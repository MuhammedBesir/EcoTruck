import { useQuery } from "@tanstack/react-query";
import { getComplianceStatus } from "../api/compliance";
import { useAppContext } from "../context/AppContext";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { StatusBadge } from "../components/shared/StatusBadge";
import type { ComplianceRecord } from "../types";

function ProgressBar({
  actual,
  target,
}: {
  actual: number | null;
  target: number | null;
}) {
  if (!actual || !target)
    return <span className="text-gray-400 text-xs">—</span>;
  const pct = Math.min((actual / target) * 100, 150);
  const over = actual > target;
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-500">
        <span>{Number(actual).toLocaleString()} kg</span>
        <span>Target: {Number(target).toLocaleString()} kg</span>
      </div>
      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            over ? "bg-red-500" : "bg-green-500"
          }`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function Compliance() {
  const { effectiveCompanyId: companyId } = useAppContext();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ["compliance-status", companyId],
    queryFn: () => getComplianceStatus(companyId),
  });

  // Group by company for progress bars
  const byCompany: Record<string, ComplianceRecord[]> = {};
  records.forEach((r) => {
    const key = r.company_name ?? String(r.company_id);
    if (!byCompany[key]) byCompany[key] = [];
    byCompany[key].push(r);
  });

  const compliantCount = records.filter((r) => r.status === "compliant").length;
  const complianceRate = records.length
    ? Math.round((compliantCount / records.length) * 100)
    : 0;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Regulatory Compliance
        </h1>
        <div className="card !p-3 !rounded-lg text-center min-w-32">
          <p className="text-3xl font-bold text-primary">{complianceRate}%</p>
          <p className="text-xs text-gray-500 mt-0.5">Compliance Rate</p>
        </div>
      </div>

      {/* Progress Bars by Company */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Current Period Progress
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.entries(byCompany)
            .slice(0, 8)
            .map(([company, recs]) => (
              <div key={company}>
                <h3 className="font-medium text-gray-900 dark:text-white mb-2 text-sm">
                  {company}
                </h3>
                {recs.slice(0, 2).map((r) => (
                  <div key={r.record_id} className="mb-3">
                    <p className="text-xs text-gray-500 mb-1">
                      {r.framework} — {r.reporting_period}
                    </p>
                    <ProgressBar
                      actual={r.actual_co2e ? Number(r.actual_co2e) : null}
                      target={r.target_co2e ? Number(r.target_co2e) : null}
                    />
                  </div>
                ))}
              </div>
            ))}
        </div>
      </div>

      {/* Full Compliance Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            All Compliance Records
          </h2>
        </div>
        {isLoading ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <tr>
                  {[
                    "Company",
                    "Framework",
                    "Period",
                    "Target CO₂e",
                    "Actual CO₂e",
                    "Over Target %",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left font-medium whitespace-nowrap"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {records.map((r) => (
                  <tr
                    key={r.record_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {r.company_name}
                    </td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                      {r.framework}
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {r.reporting_period}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                      {r.target_co2e
                        ? Number(r.target_co2e).toLocaleString()
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                      {r.actual_co2e
                        ? Number(r.actual_co2e).toLocaleString()
                        : "—"}
                    </td>
                    <td
                      className={`px-4 py-3 font-mono font-medium ${
                        Number(r.over_target_pct) > 0
                          ? "text-red-600"
                          : "text-green-600"
                      }`}
                    >
                      {r.over_target_pct != null
                        ? `${r.over_target_pct > 0 ? "+" : ""}${
                            r.over_target_pct
                          }%`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {r.status && <StatusBadge status={r.status} />}
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
