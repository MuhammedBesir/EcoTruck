import { Router, Response, NextFunction } from "express";
import { pool } from "../db";
import { authenticate, AuthRequest, resolveCompanyId } from "../middleware/auth";

const router = Router();

router.use(authenticate);

// GET /api/compliance/status — Query 4, company-scoped
router.get(
  "/status",
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const companyId = resolveCompanyId(req);
      const params: unknown[] = [];
      let where = "";
      if (companyId) {
        where = "WHERE company_id = $1";
        params.push(companyId);
      }
      const result = await pool.query(
        `SELECT record_id, company_id, company_name,
                framework_name AS framework,
                jurisdiction, target_year,
                reporting_period, target_co2e, actual_co2e,
                status, over_target_pct
         FROM v_compliance_status ${where}
         ORDER BY company_name, reporting_period DESC`,
        params
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
