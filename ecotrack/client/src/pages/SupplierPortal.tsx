import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAppContext } from "../context/AppContext";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import api from "../api/client";
import { createEmission } from "../api/emissions";

interface VerifLag {
  supplier_id: number;
  supplier_name: string;
  country: string;
  sustainability_rating: number | null;
  verified: boolean;
  last_submission_date: string | null;
  days_since_submission: number | null;
  submission_status: string;
}

interface EmissionRow {
  activity_id: number;
  scope: number;
  activity_type: string;
  co2e_kg: string;
  activity_date: string;
  notes: string | null;
  status: "pending" | "approved" | "rejected";
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );
}

function SubmitEmissionModal({
  onClose,
  companyId,
}: {
  onClose: () => void;
  companyId: number;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    activity_type: "",
    co2e_kg: "",
    activity_date: "",
    notes: "",
    facility_id: "",
  });

  const { data: companyData } = useQuery({
    queryKey: ["company-facilities", companyId],
    queryFn: () =>
      api
        .get<{ facilities: { facility_id: number; name: string }[] }>(
          `/companies/${companyId}`
        )
        .then((r) => r.data),
    enabled: !!companyId,
  });
  const facilities = companyData?.facilities ?? [];

  const mutation = useMutation({
    mutationFn: () =>
      createEmission({
        scope: 3,
        activity_type: form.activity_type || undefined,
        co2e_kg: Number(form.co2e_kg),
        activity_date: form.activity_date,
        notes: form.notes || undefined,
        facility_id: form.facility_id ? Number(form.facility_id) : undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["supplier-emissions"] });
      qc.invalidateQueries({ queryKey: ["emissions"] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            Submit Scope 3 Emission
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            &times;
          </button>
        </div>

        <div className="mb-4 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-700 dark:text-blue-400">
          Submitted emissions will be reviewed and approved by your manager.
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
            mutation.mutate();
          }}
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Scope
            </label>
            <div className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800 text-sm text-gray-500">
              Scope 3 — Supply Chain (fixed)
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Facility
            </label>
            <select
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              value={form.facility_id}
              onChange={(e) =>
                setForm({ ...form, facility_id: e.target.value })
              }
            >
              <option value="">— Select facility —</option>
              {facilities.map((f) => (
                <option key={f.facility_id} value={f.facility_id}>
                  {f.name} (#{f.facility_id})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Activity Type
            </label>
            <input
              type="text"
              placeholder="e.g. Freight Transport, Purchased Goods"
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              value={form.activity_type}
              onChange={(e) =>
                setForm({ ...form, activity_type: e.target.value })
              }
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
                value={form.co2e_kg}
                onChange={(e) => setForm({ ...form, co2e_kg: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Activity Date *
              </label>
              <input
                type="date"
                required
                className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
                value={form.activity_date}
                onChange={(e) =>
                  setForm({ ...form, activity_date: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Notes
            </label>
            <textarea
              rows={3}
              className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
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
              {mutation.isPending ? "Submitting…" : "Submit Emission"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const STATUS_STYLE: Record<string, string> = {
  pending:
    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  approved:
    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  rejected: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

export default function SupplierPortal() {
  const { currentUser } = useAppContext();
  const [showModal, setShowModal] = useState(false);

  const { data: lagData = [], isLoading: lagLoading } = useQuery({
    queryKey: ["supplier-verif-lag"],
    queryFn: () =>
      api.get<VerifLag[]>("/suppliers/verification-lag").then((r) => r.data),
  });

  const { data: rawActivities, isLoading: actLoading } = useQuery({
    queryKey: ["supplier-emissions", currentUser?.company_id],
    queryFn: () =>
      api
        .get<{ data: EmissionRow[] } | EmissionRow[]>("/emissions", {
          params: { limit: 20, scope: 3 },
        })
        .then((r) => (Array.isArray(r.data) ? r.data : r.data.data)),
    refetchInterval: 5000,
  });

  const activities: EmissionRow[] = rawActivities ?? [];
  const isLoading = lagLoading || actLoading;
  const myRecord = lagData[0] ?? null;

  const scope3Total = activities.reduce(
    (sum, a) => sum + parseFloat(a.co2e_kg),
    0
  );
  const scope3Count = activities.length;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Supplier Portal
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
            Welcome, {currentUser?.full_name} — manage your emission submissions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {myRecord && (
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                myRecord.verified
                  ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
              }`}
            >
              {myRecord.verified
                ? "✓ Verified Supplier"
                : "⏳ Pending Verification"}
            </span>
          )}
          <button
            className="btn-primary text-sm"
            onClick={() => setShowModal(true)}
          >
            + Submit Emission
          </button>
        </div>
      </div>

      {/* Verification status banner */}
      {myRecord && !myRecord.verified && (
        <div className="rounded-xl p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 flex items-start gap-3">
          <svg
            className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <div>
            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
              Your account is pending verification
            </p>
            <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-0.5">
              {myRecord.submission_status} — Last submission:{" "}
              {myRecord.last_submission_date ?? "Never"}
            </p>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          label="Total Scope 3 Emissions"
          value={`${(scope3Total / 1000).toFixed(1)} t`}
          sub="CO₂e"
          color="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          label="Submitted Activities"
          value={scope3Count}
          sub="Scope 3 records"
          color="text-gray-900 dark:text-white"
        />
        <StatCard
          label="Pending Review"
          value={activities.filter((a) => a.status === "pending").length}
          sub="awaiting approval"
          color="text-amber-600 dark:text-amber-400"
        />
      </div>

      {/* Sustainability Rating */}
      {myRecord?.sustainability_rating != null && (
        <div className="bg-white dark:bg-gray-900 rounded-xl p-5 border border-gray-100 dark:border-gray-800">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Sustainability Rating
          </p>
          <div className="flex items-center gap-4">
            <span className="text-4xl font-bold text-primary dark:text-green-400">
              {myRecord.sustainability_rating}
            </span>
            <div className="flex-1">
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-400 to-green-500"
                  style={{
                    width: `${(myRecord.sustainability_rating / 10) * 100}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0</span>
                <span>5</span>
                <span>10</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Submissions table */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h2 className="text-sm font-semibold text-gray-800 dark:text-white">
            Recent Scope 3 Submissions
          </h2>
        </div>
        {activities.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-sm">
            No emission activities recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {["Date", "Type", "CO₂e (kg)", "Status", "Notes"].map((h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {activities.slice(0, 15).map((a) => (
                  <tr
                    key={a.activity_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {new Date(a.activity_date).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-gray-700 dark:text-gray-300">
                      {a.activity_type ?? "—"}
                    </td>
                    <td className="px-5 py-3 font-mono text-gray-700 dark:text-gray-300">
                      {Number(a.co2e_kg).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          STATUS_STYLE[a.status ?? "pending"]
                        }`}
                      >
                        {(a.status ?? "pending").charAt(0).toUpperCase() +
                          (a.status ?? "pending").slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-gray-400 dark:text-gray-500 max-w-xs truncate">
                      {a.notes ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <SubmitEmissionModal
          onClose={() => setShowModal(false)}
          companyId={currentUser?.company_id ?? 0}
        />
      )}
    </div>
  );
}
