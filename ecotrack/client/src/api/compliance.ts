import api from "./client";
import type { ComplianceRecord } from "../types";

export const getComplianceStatus = (company_id?: number) =>
  api
    .get<ComplianceRecord[]>("/compliance/status", {
      params: company_id ? { company_id } : {},
    })
    .then((r) => r.data);
