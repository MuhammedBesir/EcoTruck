import { Router, Response, NextFunction } from "express";
import { pool } from "../db";
import { authenticate, AuthRequest, resolveCompanyId } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// GET /api/suppliers — list with filters, company-scoped
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = resolveCompanyId(req);
    const { country, min_rating, max_rating, verified, search } =
      req.query as Record<string, string>;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;

    if (companyId) {
      conditions.push(`sr.company_id = $${p++}`);
      params.push(companyId);
    }
    if (country) {
      conditions.push(`s.country ILIKE $${p++}`);
      params.push(`%${country}%`);
    }
    if (min_rating) {
      conditions.push(`s.sustainability_rating >= $${p++}`);
      params.push(Number(min_rating));
    }
    if (max_rating) {
      conditions.push(`s.sustainability_rating <= $${p++}`);
      params.push(Number(max_rating));
    }
    if (verified !== undefined) {
      conditions.push(`s.verified = $${p++}`);
      params.push(verified === "true");
    }
    if (search) {
      conditions.push(`s.name ILIKE $${p++}`);
      params.push(`%${search}%`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const join = companyId
      ? "JOIN supplier_relationship sr ON sr.supplier_id = s.supplier_id"
      : "";

    const result = await pool.query(
      `SELECT s.*,
              COALESCE(SUM(ea.co2e_kg) FILTER (WHERE ea.scope = 3), 0) AS total_scope3_co2e
       FROM supplier s
       ${join}
       LEFT JOIN emission_activity ea ON ea.supplier_id = s.supplier_id
       ${where}
       GROUP BY s.supplier_id
       ORDER BY s.name`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

// GET /api/suppliers/risk-ranking — company-scoped (Query 2)
router.get(
  "/risk-ranking",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = resolveCompanyId(req);

      if (companyId) {
        const result = await pool.query(
          `SELECT
             s.supplier_id,
             s.name AS supplier_name,
             s.country,
             s.sustainability_rating,
             s.verified,
             COALESCE(SUM(ea.co2e_kg) FILTER (WHERE ea.scope = 3), 0) AS total_scope3_co2e,
             RANK() OVER (
               ORDER BY COALESCE(SUM(ea.co2e_kg) FILTER (WHERE ea.scope = 3), 0) DESC
             ) AS carbon_risk_rank
           FROM supplier s
           JOIN supplier_relationship sr ON sr.supplier_id = s.supplier_id AND sr.company_id = $1
           LEFT JOIN emission_activity ea ON ea.supplier_id = s.supplier_id
           GROUP BY s.supplier_id, s.name, s.country, s.sustainability_rating, s.verified
           ORDER BY carbon_risk_rank
           LIMIT 20`,
          [companyId]
        );
        res.json(result.rows);
      } else {
        const result = await pool.query(
          `SELECT supplier_id, supplier_name, country, sustainability_rating,
                  verified, total_scope3_co2e,
                  risk_rank AS carbon_risk_rank
           FROM v_supplier_risk_ranking LIMIT 20`
        );
        res.json(result.rows);
      }
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/suppliers/verification-lag — company-scoped (Query 7)
router.get(
  "/verification-lag",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = resolveCompanyId(req);

      if (companyId) {
        const result = await pool.query(
          `SELECT
             s.supplier_id,
             s.name,
             s.country,
             s.sustainability_rating,
             s.verified,
             s.last_submission_date,
             CURRENT_DATE - s.last_submission_date AS days_since_submission,
             CASE
               WHEN s.last_submission_date IS NULL             THEN 'Never submitted'
               WHEN CURRENT_DATE - s.last_submission_date > 90 THEN 'Overdue'
               WHEN CURRENT_DATE - s.last_submission_date > 30 THEN 'Late'
               ELSE 'On track'
             END AS submission_status
           FROM supplier s
           JOIN supplier_relationship sr ON sr.supplier_id = s.supplier_id AND sr.company_id = $1
           WHERE s.verified = FALSE
              OR s.last_submission_date IS NULL
              OR (CURRENT_DATE - s.last_submission_date) > 30
           ORDER BY days_since_submission DESC NULLS FIRST`,
          [companyId]
        );
        res.json(result.rows);
      } else {
        const result = await pool.query(
          `SELECT
             supplier_id,
             supplier_name AS name,
             country,
             sustainability_rating,
             verified,
             last_submission_date,
             days_since_submission,
             CASE submission_status
               WHEN 'Overdue (>90 days)' THEN 'Overdue'
               WHEN 'Late (>30 days)'    THEN 'Late'
               WHEN 'Recent'             THEN 'On track'
               ELSE submission_status
             END AS submission_status
           FROM v_supplier_verification_lag`
        );
        res.json(result.rows);
      }
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/suppliers/:id
router.get(
  "/:id",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const companyId = resolveCompanyId(req);

      const supplierQuery = companyId
        ? pool.query(
            `SELECT s.* FROM supplier s
             JOIN supplier_relationship sr ON sr.supplier_id = s.supplier_id
             WHERE s.supplier_id = $1 AND sr.company_id = $2`,
            [id, companyId]
          )
        : pool.query("SELECT * FROM supplier WHERE supplier_id = $1", [id]);

      const supplier = await supplierQuery;
      if (supplier.rows.length === 0) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }
      const emissions = await pool.query(
        `SELECT ea.scope, SUM(ea.co2e_kg) AS total_co2e
         FROM emission_activity ea
         WHERE ea.supplier_id = $1
         GROUP BY ea.scope`,
        [id]
      );
      res.json({ ...supplier.rows[0], emissions_by_scope: emissions.rows });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
