import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LoadingSpinner } from "../components/shared/LoadingSpinner";
import { getCompanies } from "../api/companies";
import { useAppContext } from "../context/AppContext";
import api from "../api/client";

interface UserRow {
  user_id: number;
  email: string;
  full_name: string;
  role: "admin" | "manager" | "analyst" | "supplier" | "viewer";
  company_id: number;
  company_name: string;
  created_at: string;
}

type Tab = "overview" | "users" | "companies";

const ROLES = ["admin", "manager", "analyst", "supplier", "viewer"] as const;

const ROLE_STYLE: Record<string, string> = {
  admin: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
  manager: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  analyst:
    "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  supplier:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  viewer: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
};

const PERMISSIONS: [string, boolean, boolean, boolean, boolean, boolean][] = [
  ["Dashboard", true, true, true, false, true],
  ["Emissions", true, true, true, false, false],
  ["Suppliers", true, true, true, false, false],
  ["Carbon Offsets", true, true, false, false, false],
  ["Compliance", true, true, false, false, false],
  ["Audit Log", true, false, false, false, false],
  ["Supplier Portal", false, false, false, true, false],
  ["Admin Panel", true, false, false, false, false],
  ["My Profile", true, true, true, true, true],
];

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5 flex flex-col gap-1">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className={`text-3xl font-bold ${accent}`}>
        {typeof value === "number" ? value.toLocaleString() : value}
      </p>
      {sub && <p className="text-xs text-gray-400">{sub}</p>}
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
        ROLE_STYLE[role] ?? ROLE_STYLE.viewer
      }`}
    >
      {role}
    </span>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const { data: companies = [], isLoading: loadingCo } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
  });
  const { data: emissions, isLoading: loadingEm } = useQuery({
    queryKey: ["emissions-count"],
    queryFn: () => api.get("/emissions?limit=1").then((r) => r.data),
  });
  const { data: users = [], isLoading: loadingUs } = useQuery<UserRow[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.get<UserRow[]>("/auth/users").then((r) => r.data),
  });
  const { data: suppliers = [], isLoading: loadingSup } = useQuery<unknown[]>({
    queryKey: ["suppliers-list"],
    queryFn: () => api.get<unknown[]>("/suppliers").then((r) => r.data),
  });
  const { data: offsets = [], isLoading: loadingOff } = useQuery<unknown[]>({
    queryKey: ["offsets"],
    queryFn: () => api.get<unknown[]>("/offsets").then((r) => r.data),
  });
  const { data: compliance = [], isLoading: loadingComp } = useQuery<unknown[]>(
    {
      queryKey: ["compliance-status"],
      queryFn: () =>
        api.get<unknown[]>("/compliance/status").then((r) => r.data),
    }
  );
  const { data: audit, isLoading: loadingAudit } = useQuery({
    queryKey: ["audit-recent"],
    queryFn: () => api.get("/audit?limit=8").then((r) => r.data),
  });

  const loading =
    loadingCo ||
    loadingEm ||
    loadingUs ||
    loadingSup ||
    loadingOff ||
    loadingComp;

  const roleCounts = ROLES.reduce((acc, r) => {
    acc[r] = users.filter((u) => u.role === r).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            label="Users"
            value={users.length}
            accent="text-blue-600 dark:text-blue-400"
          />
          <StatCard
            label="Companies"
            value={companies.length}
            accent="text-purple-600 dark:text-purple-400"
          />
          <StatCard
            label="Emission Records"
            value={emissions?.total ?? 0}
            accent="text-red-600 dark:text-red-400"
          />
          <StatCard
            label="Suppliers"
            value={suppliers.length}
            accent="text-amber-600 dark:text-amber-400"
          />
          <StatCard
            label="Carbon Offsets"
            value={offsets.length}
            accent="text-green-600 dark:text-green-400"
          />
          <StatCard
            label="Compliance Rows"
            value={compliance.length}
            accent="text-indigo-600 dark:text-indigo-400"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Role distribution */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
            Users by Role
          </h3>
          {loadingUs ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-3">
              {ROLES.map((r) => {
                const count = roleCounts[r] ?? 0;
                const pct = users.length
                  ? Math.round((count / users.length) * 100)
                  : 0;
                return (
                  <div key={r} className="flex items-center gap-3">
                    <RoleBadge role={r} />
                    <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500 w-8 text-right">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent audit */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4">
            Recent Audit Events
          </h3>
          {loadingAudit ? (
            <LoadingSpinner />
          ) : (
            <div className="space-y-2">
              {(audit?.data ?? []).map(
                (log: {
                  log_id: number;
                  action: string;
                  table_name: string;
                  user_name?: string;
                  timestamp: string;
                }) => (
                  <div
                    key={log.log_id}
                    className="flex items-center gap-3 text-xs"
                  >
                    <span
                      className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                        log.action === "INSERT"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                          : log.action === "DELETE"
                          ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                      }`}
                    >
                      {log.action}
                    </span>
                    <span className="text-gray-500 dark:text-gray-400 font-mono">
                      {log.table_name}
                    </span>
                    <span className="text-gray-400 ml-auto">
                      {log.user_name ?? "system"}
                    </span>
                    <span className="text-gray-300 dark:text-gray-600 w-20 text-right">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      </div>

      {/* Permission matrix */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white">
            Role Permission Matrix
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Page / Feature
                </th>
                {["Admin", "Manager", "Analyst", "Supplier", "Viewer"].map(
                  (r) => (
                    <th
                      key={r}
                      className="px-3 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-center"
                    >
                      {r}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {PERMISSIONS.map(([page, ...perms]) => (
                <tr
                  key={page}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-300">
                    {page}
                  </td>
                  {(perms as boolean[]).map((has, i) => (
                    <td key={i} className="px-3 py-3 text-center">
                      {has ? (
                        <span className="text-green-500 font-bold">✓</span>
                      ) : (
                        <span className="text-gray-200 dark:text-gray-700">
                          —
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const qc = useQueryClient();
  const { currentUser } = useAppContext();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: users = [], isLoading } = useQuery<UserRow[]>({
    queryKey: ["admin-users"],
    queryFn: () => api.get<UserRow[]>("/auth/users").then((r) => r.data),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: number; role: string }) =>
      api.patch(`/auth/users/${id}/role`, { role }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/auth/users/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const filtered = users.filter((u) => {
    const matchSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()) ||
      u.company_name?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
      {/* Toolbar */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex flex-wrap items-center gap-3">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mr-auto">
          All Users
          {!isLoading && (
            <span className="ml-2 text-gray-400 font-normal">
              ({filtered.length}/{users.length})
            </span>
          )}
        </h3>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
        >
          <option value="all">All roles</option>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Search name / email / company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary w-64"
        />
      </div>

      {isLoading ? (
        <div className="p-10">
          <LoadingSpinner />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-10 text-center text-gray-400 text-sm">
          No users found.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800">
                {["ID", "Name", "Email", "Role", "Company", "Joined", ""].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-5 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
              {filtered.map((u) => (
                <tr
                  key={u.user_id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                >
                  <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                    {u.user_id}
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">
                    <div>{u.full_name}</div>
                  </td>
                  <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">
                    {u.email}
                  </td>
                  <td className="px-5 py-3">
                    {editingId === u.user_id ? (
                      <div className="flex items-center gap-2">
                        <select
                          defaultValue={u.role}
                          autoFocus
                          className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                          onChange={(e) =>
                            roleMutation.mutate({
                              id: u.user_id,
                              role: e.target.value,
                            })
                          }
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>
                              {r}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-400 hover:text-gray-600 text-xs"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setEditingId(u.user_id)}
                        className="group flex items-center gap-1.5"
                        title="Click to change role"
                      >
                        <RoleBadge role={u.role} />
                        <span className="text-gray-300 dark:text-gray-600 group-hover:text-gray-500 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                          ✎
                        </span>
                      </button>
                    )}
                  </td>
                  <td className="px-5 py-3 text-gray-600 dark:text-gray-400">
                    {u.company_name}
                  </td>
                  <td className="px-5 py-3 text-gray-400 text-xs">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {currentUser?.user_id !== u.user_id && (
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${u.full_name}" kullanıcısını silmek istediğinize emin misiniz?`
                            )
                          ) {
                            deleteMutation.mutate(u.user_id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded font-medium transition-colors"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Companies Tab ─────────────────────────────────────────────────────────────
interface AddCompanyForm {
  name: string;
  industry: string;
  country: string;
  tax_id: string;
  founded_year: string;
}

function AddCompanyModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<AddCompanyForm>({
    name: "",
    industry: "",
    country: "",
    tax_id: "",
    founded_year: "",
  });
  const mutation = useMutation({
    mutationFn: () =>
      api
        .post("/companies", {
          name: form.name,
          industry: form.industry || undefined,
          country: form.country,
          tax_id: form.tax_id || undefined,
          founded_year: form.founded_year
            ? Number(form.founded_year)
            : undefined,
        })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["companies"] });
      onClose();
    },
  });

  const field = (
    label: string,
    key: keyof AddCompanyForm,
    required = false
  ) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <input
        type="text"
        required={required}
        value={form[key]}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Add Company
        </h2>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            mutation.mutate();
          }}
        >
          {field("Company Name", "name", true)}
          {field("Industry", "industry")}
          {field("Country", "country", true)}
          {field("Tax ID", "tax_id")}
          {field("Founded Year", "founded_year")}

          {mutation.isError && (
            <p className="text-sm text-red-600">
              {(mutation.error as { response?: { data?: { error?: string } } })
                ?.response?.data?.error ?? "An error occurred"}
            </p>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={mutation.isPending || !form.name || !form.country}
              className="px-4 py-2 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 font-medium"
            >
              {mutation.isPending ? "Adding…" : "Add Company"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompaniesTab() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: companies = [], isLoading } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) =>
      api.delete(`/companies/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["companies"] }),
  });

  const filtered = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.industry ?? "").toLowerCase().includes(search.toLowerCase()) ||
      c.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {showAdd && <AddCompanyModal onClose={() => setShowAdd(false)} />}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
          <h3 className="text-sm font-semibold text-gray-800 dark:text-white mr-auto">
            All Companies
            {!isLoading && (
              <span className="ml-2 text-gray-400 font-normal">
                ({filtered.length})
              </span>
            )}
          </h3>
          <input
            type="text"
            placeholder="Search name / industry / country…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary w-64"
          />
          <button
            onClick={() => setShowAdd(true)}
            className="px-3 py-1.5 text-sm rounded-lg bg-primary text-white hover:bg-primary/90 font-medium"
          >
            + Add Company
          </button>
        </div>

        {isLoading ? (
          <div className="p-10">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  {[
                    "ID",
                    "Company",
                    "Industry",
                    "Country",
                    "Founded",
                    "Facilities",
                    "Users",
                    "",
                  ].map((h) => (
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
                {filtered.map((c) => (
                  <tr
                    key={c.company_id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                  >
                    <td className="px-5 py-3 text-gray-400 font-mono text-xs">
                      {c.company_id}
                    </td>
                    <td className="px-5 py-3 font-medium text-gray-800 dark:text-gray-200">
                      {c.name}
                    </td>
                    <td className="px-5 py-3">
                      {c.industry ? (
                        <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs">
                          {c.industry}
                        </span>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-5 py-3 text-gray-500">{c.country}</td>
                    <td className="px-5 py-3 text-gray-500">
                      {c.founded_year ?? "—"}
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold">
                        {c.facility_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 text-xs font-bold">
                        {c.user_count ?? 0}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => {
                          if (
                            window.confirm(
                              `"${c.name}" şirketini silmek istediğinize emin misiniz?\nBağlı tüm tesisler ve veriler de silinecek.`
                            )
                          ) {
                            deleteMutation.mutate(c.company_id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="px-2 py-1 text-xs bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-red-900/30 dark:hover:text-red-400 rounded font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function AdminPanel() {
  const [tab, setTab] = useState<Tab>("overview");

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "users", label: "Users" },
    { id: "companies", label: "Companies" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Admin Panel
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          System overview and management
        </p>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-800">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && <OverviewTab />}
      {tab === "users" && <UsersTab />}
      {tab === "companies" && <CompaniesTab />}
    </div>
  );
}
