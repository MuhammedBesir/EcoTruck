import { useQuery } from "@tanstack/react-query";
import { getCompanies } from "../../api/companies";
import { useAppContext } from "../../context/AppContext";
import { useNavigate } from "react-router-dom";

interface TopBarProps {
  onMenuClick: () => void;
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const {
    selectedCompany,
    setSelectedCompany,
    darkMode,
    toggleDarkMode,
    currentUser,
    logout,
  } = useAppContext();
  const navigate = useNavigate();
  const { data: companies = [] } = useQuery({
    queryKey: ["companies"],
    queryFn: getCompanies,
  });

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const initials = currentUser?.full_name
    ? currentUser.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "?";

  return (
    <header className="fixed top-0 left-0 md:left-56 right-0 h-14 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between px-4 md:px-6 z-20 shadow-sm">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors p-1 rounded-lg"
          aria-label="Open menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {currentUser?.role === "admin" && (
          <>
            <label className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Company:
            </label>
            <select
              className="text-sm border border-gray-300 dark:border-gray-700 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-800 text-gray-900 dark:text-white max-w-[140px] sm:max-w-xs truncate"
              value={selectedCompany?.company_id ?? ""}
              onChange={(e) => {
                const found = companies.find(
                  (c) => c.company_id === Number(e.target.value)
                );
                setSelectedCompany(found ?? null);
              }}
            >
              <option value="">All Companies</option>
              {companies.map((c) => (
                <option key={c.company_id} value={c.company_id}>
                  {c.name}
                </option>
              ))}
            </select>
          </>
        )}
        {currentUser?.role !== "admin" && currentUser?.company_name && (
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg">
            {currentUser.company_name}
          </span>
        )}
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={toggleDarkMode}
          className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          title="Toggle dark mode"
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {currentUser && (
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-800 dark:text-white leading-none">
                {currentUser.full_name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                {currentUser.role}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-eco-green text-white flex items-center justify-center text-sm font-bold">
              {initials}
            </div>
          </div>
        )}

        <button
          onClick={handleLogout}
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
          title="Sign out"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  );
}
