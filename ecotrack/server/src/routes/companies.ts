import { Router, Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { pool } from "../db";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

// GET /api/companies
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await pool.query(
      `SELECT c.*, COUNT(DISTINCT f.facility_id) AS facility_count,
              COUNT(DISTINCT u.user_id) AS user_count
       FROM company c
       LEFT JOIN facility f ON f.company_id = c.company_id
       LEFT JOIN app_user u ON u.company_id = c.company_id
       GROUP BY c.company_id
       ORDER BY c.name`
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/companies/:id
router.get("/:id", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const companyResult = await pool.query(
      "SELECT * FROM company WHERE company_id = $1",
      [id]
    );
    if (companyResult.rows.length === 0) {
      res.status(404).json({ error: "Company not found" });
      return;
    }
    const facilitiesResult = await pool.query(
      "SELECT * FROM facility WHERE company_id = $1 ORDER BY name",
      [id]
    );
    const usersResult = await pool.query(
      "SELECT user_id, full_name, email, role, created_at FROM app_user WHERE company_id = $1",
      [id]
    );
    res.json({
      ...companyResult.rows[0],
      facilities: facilitiesResult.rows,
      users: usersResult.rows,
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/companies  (admin only)
router.post(
  "/",
  authenticate,
  requireRole("admin"),
  [
    body("name").notEmpty().withMessage("name is required"),
    body("country").notEmpty().withMessage("country is required"),
    body("founded_year").optional({ nullable: true }).isInt({ min: 1801 }),
  ],
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const { name, industry, country, tax_id, founded_year } = req.body;
      const result = await pool.query(
        `INSERT INTO company (name, industry, country, tax_id, founded_year)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, industry || null, country, tax_id || null, founded_year || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/companies/:id  (admin only)
router.delete(
  "/:id",
  authenticate,
  requireRole("admin"),
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "DELETE FROM company WHERE company_id = $1 RETURNING company_id",
        [id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "Company not found" });
        return;
      }
      res.json({ deleted: result.rows[0].company_id });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
