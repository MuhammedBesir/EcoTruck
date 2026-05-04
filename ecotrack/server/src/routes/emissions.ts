import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { pool } from "../db";
import {
  authenticate,
  requireRole,
  AuthRequest,
  resolveCompanyId,
} from "../middleware/auth";

const router = Router();

router.use(authenticate);

// GET /api/emissions — paginated list with filters
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = resolveCompanyId(req);
    const {
      scope,
      date_from,
      date_to,
      page = "1",
      limit = "50",
    } = req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (companyId) {
      conditions.push(`f.company_id = $${p++}`);
      params.push(companyId);
    }
    if (scope) {
      conditions.push(`ea.scope = $${p++}`);
      params.push(Number(scope));
    }
    if (date_from) {
      conditions.push(`ea.activity_date >= $${p++}`);
      params.push(date_from);
    }
    if (date_to) {
      conditions.push(`ea.activity_date <= $${p++}`);
      params.push(date_to);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM emission_activity ea
       LEFT JOIN facility f ON ea.facility_id = f.facility_id
       ${where}`,
      params
    );

    const dataResult = await pool.query(
      `SELECT ea.*, f.name AS facility_name, f.company_id,
              c.name AS company_name,
              s.name AS supplier_name,
              u.full_name AS recorded_by_name,
              a.full_name AS approved_by_name
       FROM emission_activity ea
       LEFT JOIN facility f ON ea.facility_id = f.facility_id
       LEFT JOIN company c ON f.company_id = c.company_id
       LEFT JOIN supplier s ON ea.supplier_id = s.supplier_id
       LEFT JOIN app_user u ON ea.recorded_by = u.user_id
       LEFT JOIN app_user a ON ea.approved_by = a.user_id
       ${where}
       ORDER BY ea.activity_date DESC
       LIMIT $${p++} OFFSET $${p++}`,
      [...params, Number(limit), offset]
    );

    res.json({
      data: dataResult.rows,
      total: Number(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/emissions
// admin: any scope
// analyst: any scope, facility must belong to their company
// supplier: scope 3 only
// manager/viewer: forbidden
router.post(
  "/",
  [body("co2e_kg").isFloat({ gt: 0 }), body("activity_date").isDate()],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const role = req.user!.role;

    if (role === "manager" || role === "viewer") {
      res
        .status(403)
        .json({ error: "Insufficient permissions to add emissions" });
      return;
    }

    try {
      let {
        scope,
        facility_id,
        supplier_id,
        activity_type,
        co2e_kg,
        activity_date,
        notes,
      } = req.body;

      // Supplier: forced to scope 3, auto-resolve supplier_id from their company
      if (role === "supplier") {
        scope = 3;
        const srResult = await pool.query(
          "SELECT supplier_id FROM supplier_relationship WHERE company_id = $1 LIMIT 1",
          [req.user!.companyId]
        );
        if (srResult.rows.length > 0) {
          supplier_id = srResult.rows[0].supplier_id;
        }
        // Validate facility belongs to supplier's company
        if (facility_id) {
          const facCheck = await pool.query(
            "SELECT company_id FROM facility WHERE facility_id = $1",
            [facility_id]
          );
          if (
            facCheck.rows.length === 0 ||
            facCheck.rows[0].company_id !== req.user!.companyId
          ) {
            res
              .status(403)
              .json({ error: "Facility does not belong to your company" });
            return;
          }
        }
      }

      if (![1, 2, 3].includes(Number(scope))) {
        res.status(400).json({ error: "scope must be 1, 2 or 3" });
        return;
      }

      // Analyst: facility must belong to their company
      if (role === "analyst" && facility_id) {
        const check = await pool.query(
          "SELECT company_id FROM facility WHERE facility_id = $1",
          [facility_id]
        );
        if (
          check.rows.length === 0 ||
          check.rows[0].company_id !== req.user!.companyId
        ) {
          res
            .status(403)
            .json({ error: "Facility does not belong to your company" });
          return;
        }
      }

      const result = await pool.query(
        `INSERT INTO emission_activity
           (facility_id, supplier_id, recorded_by, scope, activity_type, co2e_kg, activity_date, notes, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending')
         RETURNING *`,
        [
          facility_id || null,
          supplier_id || null,
          req.user!.userId,
          scope,
          activity_type || null,
          co2e_kg,
          activity_date,
          notes || null,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/emissions/:id/approve — manager + admin only
router.patch(
  "/:id/approve",
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `UPDATE emission_activity
         SET status = 'approved', approved_by = $1, approved_at = NOW()
         WHERE activity_id = $2
         RETURNING *`,
        [req.user!.userId, req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Emission not found" });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/emissions/:id/reject — manager + admin only
router.patch(
  "/:id/reject",
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        `UPDATE emission_activity
         SET status = 'rejected', approved_by = $1, approved_at = NOW()
         WHERE activity_id = $2
         RETURNING *`,
        [req.user!.userId, req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Emission not found" });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/emissions/trends — monthly breakdown by scope
router.get(
  "/trends",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = resolveCompanyId(req);
      const params: unknown[] = [];
      let where = "";
      if (companyId) {
        where = "WHERE c.company_id = $1";
        params.push(companyId);
      }
      const result = await pool.query(
        `SELECT
           c.company_id,
           c.name AS company_name,
           DATE_TRUNC('month', ea.activity_date) AS month,
           ea.scope,
           SUM(ea.co2e_kg) AS total_co2e_kg
         FROM emission_activity ea
         JOIN facility f ON ea.facility_id = f.facility_id
         JOIN company c ON f.company_id = c.company_id
         ${where}
         GROUP BY c.company_id, c.name, DATE_TRUNC('month', ea.activity_date), ea.scope
         ORDER BY month, ea.scope`,
        params
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/emissions/:id — admin + manager only
router.delete(
  "/:id",
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        "DELETE FROM emission_activity WHERE activity_id = $1 RETURNING activity_id",
        [req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Emission not found" });
        return;
      }
      res.json({ message: "Emission deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
