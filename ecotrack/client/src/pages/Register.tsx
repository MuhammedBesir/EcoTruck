import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { authApi } from "../api/auth";
import { getCompanies } from "../api/companies";
import type { AppUser, Company } from "../types";

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

function NatureBackground() {
  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox="0 0 800 900"
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="skyGradR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a3d2e" />
          <stop offset="60%" stopColor="#0F6E56" />
          <stop offset="100%" stopColor="#1D9E75" />
        </linearGradient>
        <linearGradient id="mountainGradR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a4f3d" />
          <stop offset="100%" stopColor="#083d2f" />
        </linearGradient>
        <linearGradient id="hillGradR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0d5c45" />
          <stop offset="100%" stopColor="#072e22" />
        </linearGradient>
        <linearGradient id="groundGradR" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a4f3d" />
          <stop offset="100%" stopColor="#041a12" />
        </linearGradient>
        <radialGradient id="moonGlowR" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#d4f7e8" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#a8edcc" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#0F6E56" stopOpacity="0" />
        </radialGradient>
        <filter id="blur2R">
          <feGaussianBlur stdDeviation="2" />
        </filter>
      </defs>
      <rect width="800" height="900" fill="url(#skyGradR)" />
      <ellipse
        cx="600"
        cy="130"
        rx="90"
        ry="90"
        fill="url(#moonGlowR)"
        opacity="0.5"
      />
      <circle cx="600" cy="130" r="38" fill="#e8f9f1" opacity="0.92" />
      <circle cx="613" cy="122" r="30" fill="#0a4f3d" opacity="0.15" />
      {[
        [80, 60],
        [140, 30],
        [220, 80],
        [300, 40],
        [380, 70],
        [450, 25],
        [510, 90],
        [670, 55],
        [720, 30],
        [750, 80],
        [170, 110],
        [340, 100],
        [480, 60],
        [640, 95],
      ].map(([x, y], i) => (
        <circle
          key={i}
          cx={x}
          cy={y}
          r={i % 3 === 0 ? 2 : 1.2}
          fill="white"
          opacity={0.5 + (i % 4) * 0.12}
        />
      ))}
      <path
        d="M0 480 L100 320 L200 420 L300 280 L400 380 L500 250 L600 370 L700 300 L800 380 L800 900 L0 900Z"
        fill="url(#mountainGradR)"
        opacity="0.9"
      />
      <path
        d="M0 580 L80 480 L180 540 L280 460 L400 520 L500 450 L620 510 L720 460 L800 500 L800 900 L0 900Z"
        fill="url(#hillGradR)"
      />
      {[30, 90, 150, 210, 260, 310, 370, 420, 480, 530, 580, 640, 690, 750].map(
        (x, i) => (
          <g key={i} transform={`translate(${x},${500 + (i % 3) * 15})`}>
            <polygon points="0,-70 18,0 -18,0" fill="#072e22" opacity="0.85" />
            <polygon points="0,-50 14,5 -14,5" fill="#083d2f" opacity="0.7" />
          </g>
        )
      )}
      {[
        0, 60, 120, 170, 230, 290, 350, 410, 470, 530, 590, 650, 710, 770, 800,
      ].map((x, i) => (
        <g key={i} transform={`translate(${x},${610 + (i % 4) * 10})`}>
          <polygon points="0,-90 22,0 -22,0" fill="#041a12" opacity="0.95" />
          <polygon points="0,-65 17,5 -17,5" fill="#051f16" opacity="0.8" />
          <rect x="-4" y="0" width="8" height="20" fill="#030f0a" />
        </g>
      ))}
      <path
        d="M0 700 Q200 680 400 695 Q600 710 800 690 L800 900 L0 900Z"
        fill="url(#groundGradR)"
      />
      <rect
        x="0"
        y="650"
        width="800"
        height="60"
        fill="#1D9E75"
        opacity="0.12"
        filter="url(#blur2R)"
      />
      <path d="M580 0 L520 350 L640 350Z" fill="#34d399" opacity="0.05" />
      <path d="M620 0 L560 300 L680 300Z" fill="#6ee7b7" opacity="0.04" />
      {[200, 280, 360, 440, 520, 600].map((x, i) => (
        <circle
          key={i}
          cx={x}
          cy={400 + Math.sin(i) * 80}
          r="2"
          fill="#6ee7b7"
          opacity="0.3"
        />
      ))}
    </svg>
  );
}

export default function Register() {
  const { login } = useAppContext();
  const navigate = useNavigate();

  const [companies, setCompanies] = useState<Company[]>([]);
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
    company_id: "",
    role: "viewer" as AppUser["role"],
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(() => {});
  }, []);

  const isAdmin = form.role === "admin";

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" && value === "admin" ? { company_id: "" } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!isAdmin && !form.company_id) {
      setError("Please select a company");
      return;
    }
    setLoading(true);
    try {
      const companyId = isAdmin
        ? companies[0]?.company_id ?? 1
        : parseInt(form.company_id);
      const { token, user } = await authApi.register({
        email: form.email,
        password: form.password,
        full_name: form.full_name,
        company_id: companyId,
        role: form.role,
      });
      login(token, user as unknown as AppUser);
      const destination =
        (user as unknown as AppUser).role === "supplier"
          ? "/supplier-portal"
          : "/dashboard";
      navigate(destination, { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = {
    backgroundColor: "#252525",
    color: "#e8e8e8",
    border: "2px solid transparent",
  };
  const selectStyle = {
    backgroundColor: "#252525",
    color: "#e8e8e8",
    border: "2px solid transparent",
  };
  const labelStyle =
    "block text-xs font-semibold tracking-widest uppercase mb-1.5";

  return (
    <div className="min-h-screen flex">
      {/* Left panel — nature scene */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 relative overflow-hidden flex-col items-center justify-end pb-16">
        <NatureBackground />
        <div className="relative z-10 text-center px-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-5">
            <svg
              className="w-9 h-9 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.8}
                d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064"
              />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">
            EcoTrack
          </h1>
          <p className="text-emerald-200 text-lg leading-relaxed max-w-sm">
            Supply Chain Carbon Management Platform
          </p>
          <div className="mt-8 flex gap-6 justify-center">
            <div className="text-center">
              <p className="text-2xl font-bold text-white">10.5K+</p>
              <p className="text-emerald-300 text-xs uppercase tracking-wider mt-1">
                Emission Records
              </p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">50</p>
              <p className="text-emerald-300 text-xs uppercase tracking-wider mt-1">
                Companies
              </p>
            </div>
            <div className="w-px bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold text-white">500</p>
              <p className="text-emerald-300 text-xs uppercase tracking-wider mt-1">
                Suppliers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — register form */}
      <div
        className="flex-1 flex items-center justify-center px-8 py-10"
        style={{ backgroundColor: "#eeeae3" }}
      >
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <div
              className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3"
              style={{ backgroundColor: "#2d6a4f" }}
            >
              <svg
                className="w-7 h-7 text-white"
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
            <h1 className="text-2xl font-bold" style={{ color: "#1a2e1a" }}>
              EcoTrack
            </h1>
          </div>

          {/* Heading */}
          <div className="mb-7">
            <h2
              className="text-4xl font-bold mb-2"
              style={{ color: "#1a2e1a" }}
            >
              Create account
            </h2>
            <p className="text-sm" style={{ color: "#6b7c6b" }}>
              Join EcoTrack and start tracking emissions
            </p>
          </div>

          {error && (
            <div
              className="mb-4 p-3 rounded-lg text-sm"
              style={{
                backgroundColor: "rgba(220,38,38,0.10)",
                border: "1px solid rgba(220,38,38,0.3)",
                color: "#b91c1c",
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className={labelStyle} style={{ color: "#2d3d2d" }}>
                Full Name
              </label>
              <input
                name="full_name"
                type="text"
                value={form.full_name}
                onChange={handleChange}
                required
                autoComplete="name"
                placeholder="John Doe"
                className="w-full px-5 py-3.5 rounded-xl text-sm outline-none transition"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.border = "2px solid #2d6a4f")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.border = "2px solid transparent")
                }
              />
            </div>

            {/* Email */}
            <div>
              <label className={labelStyle} style={{ color: "#2d3d2d" }}>
                Email
              </label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                required
                autoComplete="email"
                placeholder="you@organization.com"
                className="w-full px-5 py-3.5 rounded-xl text-sm outline-none transition"
                style={inputStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.border = "2px solid #2d6a4f")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.border = "2px solid transparent")
                }
              />
            </div>

            {/* Role */}
            <div>
              <label className={labelStyle} style={{ color: "#2d3d2d" }}>
                Role
              </label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-5 py-3.5 rounded-xl text-sm outline-none transition appearance-none"
                style={selectStyle}
                onFocus={(e) =>
                  (e.currentTarget.style.border = "2px solid #2d6a4f")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.border = "2px solid transparent")
                }
              >
                <option value="viewer">Viewer (Executive)</option>
                <option value="analyst">Supply Chain Analyst</option>
                <option value="manager">Sustainability Manager</option>
                <option value="supplier">Supplier (External)</option>
                <option value="admin">System Administrator</option>
              </select>
            </div>

            {/* Company — hidden for admin */}
            {!isAdmin && (
              <div>
                <label className={labelStyle} style={{ color: "#2d3d2d" }}>
                  Company
                </label>
                <select
                  name="company_id"
                  value={form.company_id}
                  onChange={handleChange}
                  required
                  className="w-full px-5 py-3.5 rounded-xl text-sm outline-none transition appearance-none"
                  style={selectStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #2d6a4f")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid transparent")
                  }
                >
                  <option value="">Select a company...</option>
                  {companies.map((c) => (
                    <option key={c.company_id} value={c.company_id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Password */}
            <div>
              <label className={labelStyle} style={{ color: "#2d3d2d" }}>
                Password
              </label>
              <div className="relative">
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  placeholder="Min. 6 characters"
                  className="w-full px-5 pr-14 py-3.5 rounded-xl text-sm outline-none transition"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #2d6a4f")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid transparent")
                  }
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute inset-y-0 right-0 px-4 flex items-center transition-opacity hover:opacity-70"
                  style={{ color: "#9fb4a5" }}
                >
                  <PasswordVisibilityIcon visible={showPassword} />
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className={labelStyle} style={{ color: "#2d3d2d" }}>
                Confirm Password
              </label>
              <div className="relative">
                <input
                  name="confirmPassword"
                  type={showConfirm ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={handleChange}
                  required
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="w-full px-5 pr-14 py-3.5 rounded-xl text-sm outline-none transition"
                  style={inputStyle}
                  onFocus={(e) =>
                    (e.currentTarget.style.border = "2px solid #2d6a4f")
                  }
                  onBlur={(e) =>
                    (e.currentTarget.style.border = "2px solid transparent")
                  }
                />
                <button
                  type="button"
                  aria-label={
                    showConfirm
                      ? "Hide password confirmation"
                      : "Show password confirmation"
                  }
                  aria-pressed={showConfirm}
                  onClick={() => setShowConfirm((visible) => !visible)}
                  className="absolute inset-y-0 right-0 px-4 flex items-center transition-opacity hover:opacity-70"
                  style={{ color: "#9fb4a5" }}
                >
                  <PasswordVisibilityIcon visible={showConfirm} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-4 rounded-xl font-semibold text-sm transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed mt-1"
              style={{
                backgroundColor: "#1a2e1a",
                color: "#e8e8e8",
                border: "2px solid #1a2e1a",
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#2d6a4f";
                  e.currentTarget.style.borderColor = "#2d6a4f";
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.backgroundColor = "#1a2e1a";
                  e.currentTarget.style.borderColor = "#1a2e1a";
                }
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="w-4 h-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm" style={{ color: "#6b7c6b" }}>
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold underline underline-offset-2 transition-opacity hover:opacity-70"
              style={{ color: "#1a2e1a" }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
