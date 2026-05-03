import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getSuppliers,
  getSupplierRiskRanking,
  getVerificationLag,
} from "../api/suppliers";
import { useAppContext } from "../context/AppContext";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { StatusBadge } from "../components/shared/StatusBadge";

function RatingStars({ rating }: { rating: number | null }) {
  if (rating === null) return <span className="text-gray-400">—</span>;
  const filled = Math.round(rating / 2);
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={i <= filled ? "text-amber-400" : "text-gray-300"}
        >
          ★
        </span>
      ))}
      <span className="text-xs text-gray-500 ml-1">{rating}/10</span>
    </div>
  );
}

export default function Suppliers() {
  const { effectiveCompanyId: companyId } = useAppContext();

  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [verified, setVerified] = useState<"" | "true" | "false">("");
  const [activeTab, setActiveTab] = useState<"list" | "risk" | "lag">("list");

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers", companyId, search, country, verified],
    queryFn: () =>
      getSuppliers({
        company_id: companyId,
        search: search || undefined,
        country: country || undefined,
        verified: verified === "" ? undefined : verified === "true",
      }),
  });

  const { data: riskRanking = [], isLoading: loadingRisk } = useQuery({
    queryKey: ["supplier-risk", companyId],
    queryFn: () => getSupplierRiskRanking(companyId),
    enabled: activeTab === "risk",
  });

  const { data: lagData = [], isLoading: loadingLag } = useQuery({
    queryKey: ["supplier-verification-lag", companyId],
    queryFn: () => getVerificationLag(companyId),
    enabled: activeTab === "lag",
  });

  const overdueCount = lagData.filter(
    (s) =>
      s.submission_status === "Overdue" ||
      s.submission_status === "Never submitted"
  ).length;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
        Supplier Management
      </h1>

      {/* Overdue Alert */}
      {overdueCount > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3 flex items-center gap-3">
          <span className="text-red-600 font-bold text-lg">⚠</span>
          <span className="text-sm text-red-700 dark:text-red-400">
            <strong>{overdueCount}</strong> supplier(s) are overdue or have
            never submitted verification data.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {(["list", "risk", "lag"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
            }`}
          >
            {tab === "list"
              ? "All Suppliers"
              : tab === "risk"
              ? "Risk Ranking"
              : "Verification Lag"}
          </button>
        ))}
      </div>

      {activeTab === "list" && (
        <>
          {/* Filters */}
          <div className="card !p-4 flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-48">
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Supplier name…"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Country
              </label>
              <input
                type="text"
                placeholder="e.g. Germany"
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">
                Status
              </label>
              <select
                className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800"
                value={verified}
                onChange={(e) =>
                  setVerified(e.target.value as "" | "true" | "false")
                }
              >
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            <span className="text-sm text-gray-400">
              {suppliers.length} suppliers
            </span>
          </div>

          {/* Supplier Cards */}
          {isLoading ? (
            <LoadingSpinner />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {suppliers.map((s) => (
                <div
                  key={s.supplier_id}
                  className="card hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {s.name}
                      </h3>
                      <p className="text-sm text-gray-500">{s.country}</p>
                    </div>
                    <span
                      className={`badge text-xs ${
                        s.verified
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {s.verified ? "✓ Verified" : "Unverified"}
                    </span>
                  </div>
                  <RatingStars
                    rating={
                      s.sustainability_rating
                        ? Number(s.sustainability_rating)
                        : null
                    }
                  />
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between text-xs text-gray-500">
                    <span>
                      Scope 3:{" "}
                      <strong className="text-gray-800 dark:text-gray-200">
                        {Number(s.total_scope3_co2e ?? 0).toLocaleString()} kg
                      </strong>
                    </span>
                    <span>Last: {s.last_submission_date ?? "—"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === "risk" && (
        <div className="card !p-0 overflow-hidden">
          {loadingRisk ? (
            <div className="p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <tr>
                  {[
                    "Rank",
                    "Supplier",
                    "Country",
                    "Rating",
                    "Scope 3 CO₂e (kg)",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {riskRanking.map((s) => (
                  <tr
                    key={s.supplier_id}
                    className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                      s.carbon_risk_rank <= 5
                        ? "bg-red-50/30 dark:bg-red-900/10"
                        : s.carbon_risk_rank <= 10
                        ? "bg-amber-50/30 dark:bg-amber-900/10"
                        : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                      #{s.carbon_risk_rank}
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {s.supplier_name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.country}</td>
                    <td className="px-4 py-3">
                      <RatingStars
                        rating={
                          s.sustainability_rating
                            ? Number(s.sustainability_rating)
                            : null
                        }
                      />
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {Number(s.total_scope3_co2e).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "lag" && (
        <div className="card !p-0 overflow-hidden">
          {loadingLag ? (
            <div className="p-8">
              <LoadingSpinner />
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
                <tr>
                  {[
                    "Supplier",
                    "Country",
                    "Last Submission",
                    "Days Since",
                    "Status",
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {lagData.map((s) => (
                  <tr
                    key={s.supplier_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {s.name}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{s.country}</td>
                    <td className="px-4 py-3 text-gray-500">
                      {s.last_submission_date ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-gray-700 dark:text-gray-300">
                      {s.days_since_submission ?? "∞"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={s.submission_status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
