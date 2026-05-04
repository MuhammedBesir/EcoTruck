import api from "./client";
import type { Shipment, TransportComparison } from "../types";

export const getTransportComparison = (company_id?: number) =>
  api
    .get<TransportComparison[]>("/shipments/transport-comparison", {
      params: company_id ? { company_id } : {},
    })
    .then((r) => r.data);

export const getEmissionIntensity = () =>
  api.get<unknown[]>("/shipments/emission-intensity").then((r) => r.data);

export const getShipments = (params?: {
  company_id?: number;
  transport_mode?: string;
}) => api.get<Shipment[]>("/shipments", { params }).then((r) => r.data);
