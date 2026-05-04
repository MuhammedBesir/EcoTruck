import { Router, Response, NextFunction } from "express";
import { pool } from "../db";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

router.use(authenticate, requireRole("admin"));

// GET /api/audit — admin only
router.get("/", async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { page = "1", limit = "50" } = req.query as Record<string, string>;
    const offset = (Number(page) - 1) * Number(limit);

    const countResult = await pool.query("SELECT COUNT(*) FROM audit_log");
    const result = await pool.query(
      `SELECT al.*, u.full_name AS user_name
       FROM audit_log al
       LEFT JOIN app_user u ON al.user_id = u.user_id
       ORDER BY al.timestamp DESC
       LIMIT $1 OFFSET $2`,
      [Number(limit), offset]
    );
    res.json({
      data: result.rows,
      total: Number(countResult.rows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    next(err);
  }
});

export default router;
