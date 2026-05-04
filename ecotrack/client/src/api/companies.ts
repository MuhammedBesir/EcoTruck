import api from "./client";
import type { Company } from "../types";

export const getCompanies = () =>
  api.get<Company[]>("/companies").then((r) => r.data);

export const getCompany = (id: number) =>
  api
    .get<Company & { facilities: unknown[]; users: unknown[] }>(
      `/companies/${id}`
    )
    .then((r) => r.data);
