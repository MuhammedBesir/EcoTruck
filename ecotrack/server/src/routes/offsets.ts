import { Router, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { pool } from "../db";
import { authenticate, requireRole, AuthRequest, resolveCompanyId } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// GET /api/offsets/balance — Query 3
router.get(
  "/balance",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = resolveCompanyId(req);
      const params: unknown[] = [];
      let emissionFilter = "";
      let offsetFilter = "";
      if (companyId) {
        emissionFilter = "AND c.company_id = $1";
        offsetFilter = "AND company_id = $1";
        params.push(companyId);
      }
      const result = await pool.query(
        `WITH quarterly_emissions AS (
           SELECT
             c.company_id,
             c.name AS company_name,
             DATE_TRUNC('quarter', ea.activity_date) AS quarter,
             SUM(ea.co2e_kg) AS gross_emissions_kg
           FROM company c
           JOIN facility f ON f.company_id = c.company_id
           JOIN emission_activity ea ON ea.facility_id = f.facility_id
           WHERE 1=1 ${emissionFilter}
           GROUP BY c.company_id, c.name, DATE_TRUNC('quarter', ea.activity_date)
         ),
         quarterly_offsets AS (
           SELECT
             company_id,
             DATE_TRUNC('quarter', purchase_date) AS quarter,
             SUM(credits_retired) AS offsets_kg
           FROM carbon_offset
           WHERE 1=1 ${offsetFilter}
           GROUP BY company_id, DATE_TRUNC('quarter', purchase_date)
         )
         SELECT
           qe.company_id,
           qe.company_name,
           qe.quarter,
           qe.gross_emissions_kg,
           COALESCE(qo.offsets_kg, 0) AS offsets_kg,
           qe.gross_emissions_kg - COALESCE(qo.offsets_kg, 0) AS net_emissions_kg
         FROM quarterly_emissions qe
         LEFT JOIN quarterly_offsets qo
           ON qo.company_id = qe.company_id AND qo.quarter = qe.quarter
         ORDER BY qe.company_id, qe.quarter`,
        params
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/offsets — company-scoped list
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = resolveCompanyId(req);
    const params: unknown[] = [];
    let where = "";
    if (companyId) {
      where = "WHERE co.company_id = $1";
      params.push(companyId);
    }
    const result = await pool.query(
      `SELECT co.*, c.name AS company_name
       FROM carbon_offset co
       JOIN company c ON co.company_id = c.company_id
       ${where}
       ORDER BY co.purchase_date DESC`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// POST /api/offsets — company_id from JWT for non-admins
router.post(
  "/",
  [
    body("credits_purchased").isFloat({ gt: 0 }),
    body("purchase_date").isDate(),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const companyId =
        req.user!.role === "admin"
          ? req.body.company_id
          : req.user!.companyId;

      if (!companyId) {
        res.status(400).json({ error: "company_id is required" });
        return;
      }

      const {
        project_name,
        certification_body,
        credits_purchased,
        credits_retired,
        purchase_date,
      } = req.body;
      const result = await pool.query(
        `INSERT INTO carbon_offset
           (company_id, project_name, certification_body, credits_purchased, credits_retired, purchase_date)
         VALUES ($1,$2,$3,$4,$5,$6)
         RETURNING *`,
        [
          companyId,
          project_name,
          certification_body,
          credits_purchased,
          credits_retired || 0,
          purchase_date,
        ]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/offsets/:id — admin + manager only
router.delete(
  "/:id",
  requireRole("admin", "manager"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        "DELETE FROM carbon_offset WHERE offset_id = $1 RETURNING offset_id",
        [req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Offset not found" });
        return;
      }
      res.json({ message: "Offset deleted" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
