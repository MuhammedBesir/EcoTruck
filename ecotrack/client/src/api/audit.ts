import api from "./client";
import type { AuditLog, PaginatedResponse } from "../types";

export const getAuditLogs = (page = 1, limit = 50) =>
  api
    .get<PaginatedResponse<AuditLog>>("/audit", { params: { page, limit } })
    .then((r) => r.data);
