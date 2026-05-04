import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { getOffsets, getOffsetBalance, createOffset, deleteOffset } from "../api/offsets";
import { useAppContext } from "../context/AppContext";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import type { CarbonOffset } from "../types";

function AddOffsetModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<CarbonOffset>>({});

  const mutation = useMutation({
    mutationFn: createOffset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offsets"] });
      qc.invalidateQueries({ queryKey: ["offset-balance"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Add Carbon Offset
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            &times;
          </button>
        </div>

        {mutation.isError && (
          <p className="mb-4 text-sm text-red-600">
            {(mutation.error as Error).message}
          </p>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Company ID *
            </label>
            <input
              type="number"
              required
              min="1"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              onChange={(e) =>
                setForm({ ...form, company_id: Number(e.target.value) })
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              onChange={(e) =>
                setForm({ ...form, project_name: e.target.value })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Certification Body
              </label>
              <input
                type="text"
                placeholder="VCS, Gold Standard…"
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                onChange={(e) =>
                  setForm({ ...form, certification_body: e.target.value })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purchase Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                onChange={(e) =>
                  setForm({ ...form, purchase_date: e.target.value })
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credits Purchased *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                onChange={(e) =>
                  setForm({
                    ...form,
                    credits_purchased: Number(e.target.value),
                  })
                }
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Credits Retired
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={0}
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                onChange={(e) =>
                  setForm({ ...form, credits_retired: Number(e.target.value) })
                }
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending}
              className="btn-primary text-sm"
            >
              {mutation.isPending ? "Saving…" : "Add Offset"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Offsets() {
  const { effectiveCompanyId, currentUser } = useAppContext();
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const deleteMutation = useMutation<unknown, Error, number>({
    mutationFn: deleteOffset,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["offsets"] });
      qc.invalidateQueries({ queryKey: ["offset-balance"] });
    },
  });

  const canDelete = currentUser?.role === "admin" || currentUser?.role === "manager";

  const { data: balanceData = [], isLoading: loadingBalance } = useQuery({
    queryKey: ["offset-balance", effectiveCompanyId],
    queryFn: () => getOffsetBalance(effectiveCompanyId),
  });

  const { data: offsets = [], isLoading: loadingOffsets } = useQuery({
    queryKey: ["offsets", effectiveCompanyId],
    queryFn: () => getOffsets(effectiveCompanyId),
  });

  const chartData = balanceData.map((d) => ({
    quarter: d.quarter?.slice(0, 7),
    gross: Number(d.gross_emissions_kg),
    offsets: Number(d.offsets_kg),
    net: Number(d.net_emissions_kg),
  }));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Carbon Offsets
        </h1>
        <button
          className="btn-primary text-sm"
          onClick={() => setShowModal(true)}
        >
          + Add Offset
        </button>
      </div>

      {/* Balance Chart */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-white">
          Quarterly Emission Balance
        </h2>
        {loadingBalance ? (
          <LoadingSpinner />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip
                formatter={(v: number) => [`${v.toLocaleString()} kg`, ""]}
              />
              <Legend />
              <Bar
                dataKey="gross"
                fill="#ef4444"
                name="Gross Emissions (kg)"
                opacity={0.7}
              />
              <Bar
                dataKey="offsets"
                fill="#22c55e"
                name="Offsets (kg)"
                opacity={0.7}
              />
              <Line
                type="monotone"
                dataKey="net"
                stroke="#0F6E56"
                name="Net Emissions (kg)"
                strokeWidth={2}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Offset Table */}
      <div className="card !p-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
            All Offset Projects
          </h2>
        </div>
        {loadingOffsets ? (
          <div className="p-8">
            <LoadingSpinner />
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500">
              <tr>
                {[
                  "Company",
                  "Project",
                  "Certification",
                  "Purchased",
                  "Retired",
                  "Balance",
                  "Date",
                  ...(canDelete ? [""] : []),
                ].map((h, i) => (
                  <th key={i} className="px-4 py-3 text-left font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {offsets.map((o) => (
                <tr
                  key={o.offset_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                    {o.company_name}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                    {o.project_name ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    {o.certification_body ? (
                      <span className="badge bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {o.certification_body}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono">
                    {Number(o.credits_purchased ?? 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono text-green-600">
                    {Number(o.credits_retired).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 font-mono font-semibold">
                    {(
                      Number(o.credits_purchased ?? 0) -
                      Number(o.credits_retired)
                    ).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {o.purchase_date?.slice(0, 10)}
                  </td>
                  {canDelete && (
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          if (window.confirm("Bu offset kaydını silmek istediğinize emin misiniz?")) {
                            deleteMutation.mutate(o.offset_id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && <AddOffsetModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
