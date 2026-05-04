import { useQuery } from "@tanstack/react-query";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getEmissions, getEmissionTrends } from "../api/emissions";
import { getSupplierRiskRanking } from "../api/suppliers";
import { getTransportComparison } from "../api/shipments";
import { useAppContext } from "../context/AppContext";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { ScopeBadge } from "../components/shared/ScopeBadge";

function KPICard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number;
  unit?: string;
  color?: string;
}) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${color ?? "text-primary"}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
        {unit && (
          <span className="text-base font-normal text-gray-400 ml-1">
            {unit}
          </span>
        )}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const { effectiveCompanyId, currentUser } = useAppContext();
  const isSupplier = currentUser?.role === "supplier";

  const { data: emissionsData, isLoading: loadingEmissions } = useQuery({
    queryKey: ["emissions", effectiveCompanyId, isSupplier],
    queryFn: () =>
      getEmissions({
        company_id: effectiveCompanyId,
        limit: 1000,
        ...(isSupplier ? { scope: 3 } : {}),
      }),
  });

  const { data: trends = [], isLoading: loadingTrends } = useQuery({
    queryKey: ["emission-trends", effectiveCompanyId],
    queryFn: () => getEmissionTrends(effectiveCompanyId),
  });

  const { data: riskRanking = [], isLoading: loadingRisk } = useQuery({
    queryKey: ["supplier-risk", effectiveCompanyId],
    queryFn: () => getSupplierRiskRanking(effectiveCompanyId),
  });

  const { data: transportData = [], isLoading: loadingTransport } = useQuery({
    queryKey: ["transport-comparison", effectiveCompanyId],
    queryFn: () => getTransportComparison(effectiveCompanyId),
  });

  const totalCo2e =
    emissionsData?.data.reduce((s, e) => s + Number(e.co2e_kg), 0) ?? 0;
  const activeSuppliers = new Set(
    emissionsData?.data.map((e) => e.supplier_id).filter(Boolean)
  ).size;

  // Build monthly chart data
  const monthlyMap: Record<string, Record<string, number>> = {};
  trends.forEach((t) => {
    const key = t.month.slice(0, 7);
    if (!monthlyMap[key])
      monthlyMap[key] = { month: Number(key.split("-")[1]) };
    monthlyMap[key][`scope${t.scope}`] =
      (monthlyMap[key][`scope${t.scope}`] ?? 0) + Number(t.total_co2e_kg);
  });
  const chartData = Object.values(monthlyMap).slice(-12);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Executive Dashboard
      </h1>

      {/* KPI Cards */}
      {loadingEmissions ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Total CO₂e (all time)"
            value={Math.round(totalCo2e / 1000)}
            unit="tCO₂e"
          />
          <KPICard
            label="Active Suppliers"
            value={activeSuppliers}
            color="text-primary-light"
          />
          <KPICard
            label="Emission Records"
            value={emissionsData?.total ?? 0}
            color="text-amber-600"
          />
          <KPICard
            label="Scope 3 Entries"
            value={emissionsData?.data.filter((e) => e.scope === 3).length ?? 0}
            color="text-purple-600"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emission Trend Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            Monthly CO₂e by Scope
          </h2>
          {loadingTrends ? (
            <LoadingSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [`${v.toLocaleString()} kg`, ""]}
                />
                <Legend />
                {!isSupplier && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="scope1"
                      stroke="#3b82f6"
                      name="Scope 1"
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="scope2"
                      stroke="#f59e0b"
                      name="Scope 2"
                      dot={false}
                      strokeWidth={2}
                    />
                  </>
                )}
                <Line
                  type="monotone"
                  dataKey="scope3"
                  stroke="#8b5cf6"
                  name="Scope 3"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Transport Mode Bar Chart */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
            CO₂e by Transport Mode
          </h2>
          {loadingTransport ? (
            <LoadingSpinner />
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={transportData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="transport_mode" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip
                  formatter={(v: number) => [
                    `${v.toLocaleString()} kg`,
                    "Total CO₂e",
                  ]}
                />
                <Bar
                  dataKey="total_co2e_kg"
                  fill="#0F6E56"
                  name="Total CO₂e (kg)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Top Suppliers Table */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Top Suppliers by Scope 3 Risk
        </h2>
        {loadingRisk ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-3 font-medium">Rank</th>
                  <th className="pb-3 font-medium">Supplier</th>
                  <th className="pb-3 font-medium">Country</th>
                  <th className="pb-3 font-medium">Scope 3 CO₂e</th>
                  <th className="pb-3 font-medium">Scope</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {riskRanking.slice(0, 10).map((s) => (
                  <tr
                    key={s.supplier_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="py-2.5">
                      <span
                        className={`font-bold ${
                          s.carbon_risk_rank <= 5
                            ? "text-red-600"
                            : s.carbon_risk_rank <= 10
                            ? "text-amber-600"
                            : "text-green-600"
                        }`}
                      >
                        #{s.carbon_risk_rank}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-gray-900 dark:text-white">
                      {s.supplier_name}
                    </td>
                    <td className="py-2.5 text-gray-500">{s.country}</td>
                    <td className="py-2.5 font-mono text-gray-700 dark:text-gray-300">
                      {Number(s.total_scope3_co2e).toLocaleString()} kg
                    </td>
                    <td className="py-2.5">
                      <ScopeBadge scope={3} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
