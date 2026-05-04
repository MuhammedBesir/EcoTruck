import { Router, Response, NextFunction } from "express";
import { pool } from "../db";
import { authenticate, AuthRequest, resolveCompanyId } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// GET /api/shipments/transport-comparison — Query 5, company-scoped
router.get(
  "/transport-comparison",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = resolveCompanyId(req);
      const params: unknown[] = [];
      let where = "WHERE sh.distance_km > 0 AND sh.weight_kg > 0";
      if (companyId) {
        where += ` AND sh.company_id = $1`;
        params.push(companyId);
      }
      const result = await pool.query(
        `SELECT
           sh.transport_mode,
           COUNT(*) AS shipment_count,
           SUM(sh.co2e_kg) AS total_co2e_kg,
           SUM(sh.distance_km * sh.weight_kg / 1000.0) AS total_tonne_km,
           ROUND(
             SUM(sh.co2e_kg) / NULLIF(SUM(sh.distance_km * sh.weight_kg / 1000.0), 0),
             6
           ) AS co2e_per_tonne_km
         FROM shipment sh
         ${where}
         GROUP BY sh.transport_mode`,
        params
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/shipments/emission-intensity — Query 6 (global, admin-level analytical view)
router.get(
  "/emission-intensity",
  async (_req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const result = await pool.query(
        "SELECT * FROM v_emission_intensity_by_supplier LIMIT 50"
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/shipments — company-scoped
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const companyId = resolveCompanyId(req);
    const { transport_mode } = req.query as Record<string, string>;
    const conditions: string[] = [];
    const params: unknown[] = [];
    let p = 1;
    if (companyId) {
      conditions.push(`sh.company_id = $${p++}`);
      params.push(companyId);
    }
    if (transport_mode) {
      conditions.push(`sh.transport_mode = $${p++}`);
      params.push(transport_mode);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `SELECT sh.*, s.name AS supplier_name, c.name AS company_name
       FROM shipment sh
       LEFT JOIN supplier s ON sh.supplier_id = s.supplier_id
       LEFT JOIN company c ON sh.company_id = c.company_id
       ${where}
       ORDER BY sh.shipment_date DESC
       LIMIT 200`,
      params
    );
    res.json(result.rows);
  } catch (err) {
    next(err);
  }
});

export default router;
