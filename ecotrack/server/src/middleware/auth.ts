import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: { userId: number; email: string; role: string; companyId: number };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback_secret"
    ) as { userId: number; email: string; role: string; companyId: number };
    req.user = payload;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }
    next();
  };
}

// Admin can pass company_id query param; all other roles are locked to their own company.
export function resolveCompanyId(req: AuthRequest): number | undefined {
  if (!req.user) return undefined;
  if (req.user.role === "admin") {
    const qp = (req.query as Record<string, string>).company_id;
    return qp ? Number(qp) : undefined;
  }
  return req.user.companyId;
}
