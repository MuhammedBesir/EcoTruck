import { NavLink } from "react-router-dom";
import { useAppContext } from "../../context/AppContext";
import type { AppUser } from "../../types";

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles: AppUser["role"][];
}

const NAV_ITEMS: NavItem[] = [
  {
    to: "/dashboard",
    label: "Dashboard",
    roles: ["admin", "manager", "analyst", "viewer"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"
        />
      </svg>
    ),
  },
  {
    to: "/emissions",
    label: "Emissions",
    roles: ["admin", "manager", "analyst"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
        />
      </svg>
    ),
  },
  {
    to: "/suppliers",
    label: "Suppliers",
    roles: ["admin", "manager", "analyst"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
    ),
  },
  {
    to: "/offsets",
    label: "Carbon Offsets",
    roles: ["admin", "manager"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
        />
      </svg>
    ),
  },
  {
    to: "/compliance",
    label: "Compliance",
    roles: ["admin", "manager"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
  {
    to: "/audit-log",
    label: "Audit Log",
    roles: ["admin"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
    ),
  },
  {
    to: "/supplier-portal",
    label: "My Portal",
    roles: ["supplier"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
        />
      </svg>
    ),
  },
  {
    to: "/admin",
    label: "Admin Panel",
    roles: ["admin"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
        />
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
      </svg>
    ),
  },
  {
    to: "/profile",
    label: "My Profile",
    roles: ["admin", "manager", "analyst", "supplier", "viewer"],
    icon: (
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
        />
      </svg>
    ),
  },
];

const ROLE_META: Record<AppUser["role"], { label: string; color: string }> = {
  admin: {
    label: "System Admin",
    color: "bg-red-500/20 text-red-300 border-red-500/30",
  },
  manager: {
    label: "Sustainability Mgr",
    color: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  },
  analyst: {
    label: "Supply Chain Analyst",
    color: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  },
  supplier: {
    label: "Supplier (External)",
    color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  },
  viewer: {
    label: "Executive Viewer",
    color: "bg-gray-500/20 text-gray-300 border-gray-500/30",
  },
};

export function Sidebar() {
  const { currentUser } = useAppContext();
  const role = currentUser?.role;
  const visibleItems = role
    ? NAV_ITEMS.filter((item) => item.roles.includes(role))
    : [];
  const roleMeta = role ? ROLE_META[role] : null;

  return (
    <aside className="fixed top-0 left-0 h-screen w-56 bg-primary dark:bg-gray-900 flex flex-col z-30 shadow-lg">
      {/* Logo */}
      <div className="px-4 py-4 border-b border-white/20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center shrink-0">
            <svg
              className="w-4.5 h-4.5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
              />
            </svg>
          </div>
          <div>
            <p className="text-white font-bold text-sm tracking-tight leading-none">
              EcoTrack
            </p>
            <p className="text-white/50 text-xs mt-0.5">Carbon Management</p>
          </div>
        </div>
      </div>

      {/* Role badge */}
      {roleMeta && (
        <div className="px-4 py-2.5 border-b border-white/10">
          <p className="text-white/40 text-xs mb-1">Role</p>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${roleMeta.color}`}
          >
            {roleMeta.label}
          </span>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
        {visibleItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-white/20 text-white"
                  : "text-white/65 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <span className="shrink-0 opacity-90">{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-white/20 text-white/30 text-xs">
        BIM216 — Term Project
      </div>
    </aside>
  );
}
