import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getEmissions, createEmission, approveEmission, rejectEmission } from "../api/emissions";
import { useAppContext } from "../context/AppContext";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { ScopeBadge } from "../components/shared/ScopeBadge";
import type { EmissionActivity } from "../types";

const SCOPE_OPTIONS = [1, 2, 3] as const;

const CAN_ADD = ["admin", "analyst", "supplier"] as const;
const CAN_APPROVE = ["admin", "manager"] as const;

function StatusBadge({ status }: { status: EmissionActivity["status"] }) {
  const styles = {
    pending:  "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    approved: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  };
  const labels = { pending: "Pending", approved: "Approved", rejected: "Rejected" };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}

function AddEmissionModal({ onClose, isSupplier }: { onClose: () => void; isSupplier: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Partial<EmissionActivity>>({ scope: isSupplier ? 3 : 1 });

  const mutation = useMutation({
    mutationFn: createEmission,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["emissions"] });
      qc.invalidateQueries({ queryKey: ["supplier-emissions"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Add Emission Activity</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
        </div>

        {isSupplier && (
          <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
            As a supplier you can only submit <strong>Scope 3</strong> emissions.
          </div>
        )}

        {mutation.isError && (
          <p className="mb-4 text-sm text-red-600">{(mutation.error as Error).message}</p>
        )}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate(form);
          }}
        >
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Scope *
              </label>
              {isSupplier ? (
                <div className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500">
                  Scope 3 (fixed)
                </div>
              ) : (
                <select
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  value={form.scope}
                  onChange={(e) => setForm({ ...form, scope: Number(e.target.value) as 1 | 2 | 3 })}
                >
                  {SCOPE_OPTIONS.map((s) => (
                    <option key={s} value={s}>Scope {s}</option>
                  ))}
                </select>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                onChange={(e) => setForm({ ...form, activity_date: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity Type
            </label>
            <input
              type="text"
              placeholder="e.g. Natural Gas Boiler, Freight Transport"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              onChange={(e) => setForm({ ...form, activity_type: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                CO₂e (kg) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                onChange={(e) => setForm({ ...form, co2e_kg: Number(e.target.value) })}
              />
            </div>
            {!isSupplier && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Facility ID
                </label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                  onChange={(e) => setForm({ ...form, facility_id: Number(e.target.value) || undefined })}
                />
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary text-sm">
              {mutation.isPending ? "Saving…" : "Add Emission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Emissions() {
  const { effectiveCompanyId, currentUser } = useAppContext();
  const qc = useQueryClient();
  const role = currentUser?.role;

  const [page, setPage] = useState(1);
  const [scope, setScope] = useState<1 | 2 | 3 | undefined>();
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [approvingId, setApprovingId] = useState<number | null>(null);
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["emissions", effectiveCompanyId, scope, dateFrom, dateTo, page],
    queryFn: () =>
      getEmissions({
        company_id: effectiveCompanyId,
        scope,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        page,
        limit: 50,
      }),
    refetchInterval: 5000,
  });

  const approveMutation = useMutation<EmissionActivity, Error, number>({
    mutationFn: approveEmission,
    onMutate: (id) => { setApprovingId(id); setActionError(""); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emissions"] }); setApprovingId(null); },
    onError: (err) => { setActionError(err.message); setApprovingId(null); },
  });

  const rejectMutation = useMutation<EmissionActivity, Error, number>({
    mutationFn: rejectEmission,
    onMutate: (id) => { setRejectingId(id); setActionError(""); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["emissions"] }); setRejectingId(null); },
    onError: (err) => { setActionError(err.message); setRejectingId(null); },
  });

  const totalPages = data ? Math.ceil(data.total / 50) : 1;
  const canAdd = role && (CAN_ADD as readonly string[]).includes(role);
  const canApprove = role && (CAN_APPROVE as readonly string[]).includes(role);
  const isSupplier = role === "supplier";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Emission Activities</h1>
        {canAdd && (
          <button className="btn-primary text-sm" onClick={() => setShowModal(true)}>
            + Add Emission
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card !p-4 flex flex-wrap gap-4 items-end">
        {!isSupplier && (
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Scope</label>
            <select
              className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800"
              value={scope ?? ""}
              onChange={(e) => { setScope(e.target.value ? (Number(e.target.value) as 1 | 2 | 3) : undefined); setPage(1); }}
            >
              <option value="">All Scopes</option>
              {[1, 2, 3].map((s) => <option key={s} value={s}>Scope {s}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">From</label>
          <input type="date" className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800"
            value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">To</label>
          <input type="date" className="border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-gray-800"
            value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} />
        </div>
        <button className="text-sm text-gray-500 hover:text-gray-900 underline"
          onClick={() => { setScope(undefined); setDateFrom(""); setDateTo(""); setPage(1); }}>
          Clear
        </button>
        {data && <span className="text-sm text-gray-400">{data.total.toLocaleString()} records</span>}
      </div>

      {actionError && (
        <div className="px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-700 dark:text-red-400">
          {actionError}
        </div>
      )}

      {/* Table */}
      <div className="card !p-0 overflow-hidden">
        {isLoading ? (
          <div className="p-8"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                <tr>
                  {[
                    "Date", "Company", "Facility", "Scope",
                    "Activity Type", "CO₂e (kg)", "Recorded By",
                    "Status",
                    ...(canApprove ? ["Actions"] : []),
                  ].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {data?.data.map((ea) => (
                  <tr key={ea.activity_id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{ea.activity_date?.slice(0, 10)}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ea.company_name ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ea.facility_name ?? "—"}</td>
                    <td className="px-4 py-3"><ScopeBadge scope={ea.scope} /></td>
                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{ea.activity_type ?? "—"}</td>
                    <td className="px-4 py-3 font-mono font-medium text-gray-900 dark:text-white">
                      {Number(ea.co2e_kg).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{ea.recorded_by_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={ea.status ?? "pending"} />
                    </td>
                    {canApprove && (
                      <td className="px-4 py-3">
                        {(ea.status ?? "pending") === "pending" ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => approveMutation.mutate(ea.activity_id)}
                              disabled={approvingId === ea.activity_id || rejectingId === ea.activity_id}
                              className="px-2 py-1 text-xs bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 rounded font-medium disabled:opacity-50"
                            >
                              {approvingId === ea.activity_id ? "…" : "Approve"}
                            </button>
                            <button
                              onClick={() => rejectMutation.mutate(ea.activity_id)}
                              disabled={approvingId === ea.activity_id || rejectingId === ea.activity_id}
                              className="px-2 py-1 text-xs bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 rounded font-medium disabled:opacity-50"
                            >
                              {rejectingId === ea.activity_id ? "…" : "Reject"}
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">{ea.approved_by_name ?? "—"}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <button disabled={page === 1} onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Prev</button>
              <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 text-sm border rounded-lg disabled:opacity-40">Next</button>
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <AddEmissionModal onClose={() => setShowModal(false)} isSupplier={isSupplier} />
      )}
    </div>
  );
}
