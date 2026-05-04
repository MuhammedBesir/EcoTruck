import { Router, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import { pool } from "../db";
import { authenticate, requireRole, AuthRequest } from "../middleware/auth";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";
const JWT_EXPIRES_IN = "7d";

// POST /api/auth/register
router.post(
  "/register",
  [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("full_name").trim().notEmpty(),
    body("company_id").isInt({ min: 1 }),
    body("role").isIn(["admin", "manager", "analyst", "supplier", "viewer"]),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password, full_name, company_id, role } = req.body;

    try {
      // Check email uniqueness
      const existing = await pool.query(
        "SELECT user_id FROM app_user WHERE email = $1",
        [email]
      );
      if (existing.rows.length > 0) {
        res.status(409).json({ error: "Email already in use" });
        return;
      }

      const password_hash = await bcrypt.hash(password, 12);

      const result = await pool.query(
        `INSERT INTO app_user (company_id, email, password_hash, role, full_name)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING user_id, company_id, email, role, full_name, created_at`,
        [company_id, email, password_hash, role, full_name]
      );

      const user = result.rows[0];
      const token = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      res.status(201).json({ token, user });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/login
router.post(
  "/login",
  [body("email").isEmail().normalizeEmail(), body("password").notEmpty()],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const result = await pool.query(
        `SELECT u.user_id, u.company_id, u.email, u.password_hash, u.role, u.full_name, u.created_at,
                c.name AS company_name
         FROM app_user u
         JOIN company c ON c.company_id = u.company_id
         WHERE u.email = $1`,
        [email]
      );

      if (result.rows.length === 0) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const user = result.rows[0];
      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      const token = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const { password_hash: _, ...safeUser } = user;
      res.json({ token, user: safeUser });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/users — Admin: list all users
router.get(
  "/users",
  authenticate,
  requireRole("admin"),
  async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT u.user_id, u.company_id, u.email, u.role, u.full_name, u.created_at,
                c.name AS company_name
         FROM app_user u
         JOIN company c ON c.company_id = u.company_id
         ORDER BY u.created_at DESC`
      );
      res.json(result.rows);
    } catch (err) {
      next(err);
    }
  }
);

// PATCH /api/auth/users/:id/role — Admin: change user role
router.patch(
  "/users/:id/role",
  authenticate,
  requireRole("admin"),
  [body("role").isIn(["admin", "manager", "analyst", "supplier", "viewer"])],
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    try {
      const result = await pool.query(
        `UPDATE app_user SET role = $1 WHERE user_id = $2
         RETURNING user_id, email, role, full_name, company_id`,
        [req.body.role, req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json(result.rows[0]);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/auth/me
router.get(
  "/me",
  authenticate,
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const result = await pool.query(
        `SELECT u.user_id, u.company_id, u.email, u.role, u.full_name, u.created_at,
                c.name AS company_name
         FROM app_user u
         JOIN company c ON c.company_id = u.company_id
         WHERE u.user_id = $1`,
        [req.user!.userId]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      const user = result.rows[0];
      // Issue a fresh token with current DB role (fixes stale-token role mismatch)
      const freshToken = jwt.sign(
        {
          userId: user.user_id,
          email: user.email,
          role: user.role,
          companyId: user.company_id,
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );
      res.json({ user, token: freshToken });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/auth/users/:id — Admin only
router.delete(
  "/users/:id",
  authenticate,
  requireRole("admin"),
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (Number(req.params.id) === req.user!.userId) {
      res.status(400).json({ error: "Cannot delete your own account" });
      return;
    }
    try {
      const result = await pool.query(
        "DELETE FROM app_user WHERE user_id = $1 RETURNING user_id",
        [req.params.id]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      res.json({ message: "User deleted" });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/change-password
router.post(
  "/change-password",
  authenticate,
  [
    body("current_password").notEmpty(),
    body("new_password").isLength({ min: 6 }),
  ],
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { current_password, new_password } = req.body;

    try {
      const result = await pool.query(
        "SELECT password_hash FROM app_user WHERE user_id = $1",
        [req.user!.userId]
      );
      if (result.rows.length === 0) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      const valid = await bcrypt.compare(
        current_password,
        result.rows[0].password_hash
      );
      if (!valid) {
        res.status(401).json({ error: "Current password is incorrect" });
        return;
      }

      const new_hash = await bcrypt.hash(new_password, 12);
      await pool.query(
        "UPDATE app_user SET password_hash = $1 WHERE user_id = $2",
        [new_hash, req.user!.userId]
      );

      res.json({ message: "Password changed successfully" });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
