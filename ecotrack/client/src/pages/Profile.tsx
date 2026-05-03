import { useState } from "react";
import { useAppContext } from "../context/AppContext";
import { authApi } from "../api/auth";

function PasswordVisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M3 3l18 18M10.584 10.587A2 2 0 0013.413 13.416M9.88 5.09A10.45 10.45 0 0112 4.909c5.523 0 10 7.091 10 7.091a17.618 17.618 0 01-4.374 4.868M6.228 6.228C3.483 8.07 2 12 2 12s4.477 7.091 10 7.091a9.77 9.77 0 004.118-.91"
      />
    </svg>
  ) : (
    <svg
      className="w-5 h-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.27 2.943 9.542 7-1.273 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
      />
      <circle cx="12" cy="12" r="3" strokeWidth={1.8} />
    </svg>
  );
}

const ROLE_LABELS: Record<string, string> = {
  admin: "System Administrator",
  manager: "Sustainability Manager",
  analyst: "Supply Chain Analyst",
  supplier: "Supplier (External)",
  viewer: "Executive Viewer",
};

const ROLE_COLORS: Record<string, string> = {
  admin: "text-red-600 dark:text-red-400",
  manager: "text-blue-600 dark:text-blue-400",
  analyst: "text-purple-600 dark:text-purple-400",
  supplier: "text-yellow-600 dark:text-yellow-400",
  viewer: "text-gray-600 dark:text-gray-400",
};

export default function Profile() {
  const { currentUser } = useAppContext();

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({
    cur: false,
    new: false,
    conf: false,
  });
  const [status, setStatus] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    if (newPwd !== confirmPwd) {
      setStatus({ type: "error", msg: "New passwords do not match." });
      return;
    }
    if (newPwd.length < 8) {
      setStatus({
        type: "error",
        msg: "Password must be at least 8 characters.",
      });
      return;
    }
    setSubmitting(true);
    try {
      await authApi.changePassword(currentPwd, newPwd);
      setStatus({ type: "success", msg: "Password changed successfully." });
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Failed to change password.";
      setStatus({ type: "error", msg: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return null;

  const role = currentUser.role;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          My Profile
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-0.5 text-sm">
          Account details and security settings
        </p>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        {/* Avatar + name */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-green-400 flex items-center justify-center text-2xl font-bold text-white shrink-0">
            {currentUser.full_name?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentUser.full_name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {currentUser.email}
            </p>
            <p
              className={`text-sm font-medium mt-0.5 ${
                ROLE_COLORS[role] ?? "text-gray-600"
              }`}
            >
              {ROLE_LABELS[role] ?? role}
            </p>
          </div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Full Name", value: currentUser.full_name },
            { label: "Email", value: currentUser.email },
            { label: "Role", value: ROLE_LABELS[role] ?? role },
            {
              label: "Company",
              value:
                currentUser.company_name ??
                (currentUser.company_id ? `#${currentUser.company_id}` : "—"),
            },
          ].map(({ label, value }) => (
            <div
              key={label}
              className="bg-gray-50 dark:bg-gray-800 rounded-lg px-4 py-3"
            >
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                {label}
              </p>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5 truncate">
                {value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-6">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-white mb-4 flex items-center gap-2">
          <svg
            className="w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Change Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-4">
          {[
            {
              id: "cur",
              label: "Current Password",
              val: currentPwd,
              set: setCurrentPwd,
            },
            { id: "new", label: "New Password", val: newPwd, set: setNewPwd },
            {
              id: "conf",
              label: "Confirm New Password",
              val: confirmPwd,
              set: setConfirmPwd,
            },
          ].map(({ id, label, val, set }) => (
            <div key={id}>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {label}
              </label>
              <div className="relative">
                <input
                  type={showPasswords[id] ? "text" : "password"}
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  required
                  className="w-full px-3.5 pr-12 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="button"
                  aria-label={
                    showPasswords[id]
                      ? `Hide ${label.toLowerCase()}`
                      : `Show ${label.toLowerCase()}`
                  }
                  aria-pressed={showPasswords[id]}
                  onClick={() =>
                    setShowPasswords((current) => ({
                      ...current,
                      [id]: !current[id],
                    }))
                  }
                  className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 dark:text-gray-500 transition-opacity hover:opacity-70"
                >
                  <PasswordVisibilityIcon visible={showPasswords[id]} />
                </button>
              </div>
            </div>
          ))}

          {status && (
            <div
              className={`px-4 py-3 rounded-lg text-sm ${
                status.type === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400"
              }`}
            >
              {status.msg}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-white text-sm font-medium transition-opacity disabled:opacity-60"
            style={{ backgroundColor: "#1D9E75" }}
          >
            {submitting ? "Updating…" : "Update Password"}
          </button>
        </form>
      </div>

      {/* Permissions info */}
      <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-800 p-5">
        <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
          Your Permissions
        </h3>
        <div className="flex flex-wrap gap-2">
          {role === "admin" &&
            [
              "Dashboard",
              "Emissions",
              "Suppliers",
              "Offsets",
              "Compliance",
              "Audit Log",
              "Admin Panel",
              "Profile",
            ].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs rounded-full"
              >
                {p}
              </span>
            ))}
          {role === "manager" &&
            [
              "Dashboard",
              "Emissions",
              "Suppliers",
              "Offsets",
              "Compliance",
              "Profile",
            ].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-full"
              >
                {p}
              </span>
            ))}
          {role === "analyst" &&
            ["Dashboard", "Emissions", "Suppliers", "Profile"].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-full"
              >
                {p}
              </span>
            ))}
          {role === "supplier" &&
            ["Supplier Portal", "Profile"].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs rounded-full"
              >
                {p}
              </span>
            ))}
          {role === "viewer" &&
            ["Dashboard", "Profile"].map((p) => (
              <span
                key={p}
                className="px-2.5 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded-full"
              >
                {p}
              </span>
            ))}
        </div>
      </div>
    </div>
  );
}
