import { Link, useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const ROLE_HOME: Record<string, string> = {
  admin: "/dashboard",
  manager: "/dashboard",
  analyst: "/dashboard",
  supplier: "/supplier-portal",
  viewer: "/dashboard",
};

export default function Forbidden() {
  const { currentUser } = useAppContext();
  const navigate = useNavigate();
  const home = currentUser
    ? ROLE_HOME[currentUser.role] ?? "/dashboard"
    : "/login";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        {/* 403 badge */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-500"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white mb-2">
          403
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-3">
          Access Denied
        </h2>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">
          You don't have permission to view this page.
        </p>
        {currentUser && (
          <p className="text-gray-400 dark:text-gray-500 text-xs mb-8">
            Your role:{" "}
            <span className="font-medium text-gray-600 dark:text-gray-300">
              {currentUser.role}
            </span>{" "}
            does not have access to this resource.
          </p>
        )}

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ← Go Back
          </button>
          <Link
            to={home}
            className="px-4 py-2 rounded-lg text-sm text-white font-medium transition-opacity hover:opacity-90"
            style={{ backgroundColor: "#1D9E75" }}
          >
            Go to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
