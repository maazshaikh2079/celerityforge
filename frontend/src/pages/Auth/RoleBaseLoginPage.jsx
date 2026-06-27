import React, { useState, useContext } from "react";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import { TechnicianContext } from "../../contexts/TechnicianContext.jsx";
import adminService from "../../services/admin.service.js";
import technicianService from "../../services/technician.service.js";
import toast from "react-hot-toast";

import {
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiShield,
  FiTool,
  FiBox,
  FiLoader,
} from "react-icons/fi";

const RoleBaseLoginPage = () => {
  const [role, setRole] = useState("Admin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const { adminLoginHandler } = useContext(AdminContext);
  const { technicianLoginHandler } = useContext(TechnicianContext);

  // Handle Role Base Login Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      if (role === "Admin") {
        const data = await adminService.login(email, password);
        await adminLoginHandler(data.admin.id, data.access_token);
        toast.success(`Welcome back, ${data.admin.name}!`);
      } else {
        const data = await technicianService.login(email, password);
        await technicianLoginHandler(data.technician.id, data.access_token);
        toast.success(`Welcome back, ${data.technician.name}!`);
      }
    } catch (err) {
      toast.error(err?.detail || err?.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background px-4 py-8 font-body text-on-surface">
      {/* Brutalist Card: No Shadow, Level 1 Elevation */}
      <div className="w-full max-w-[420px] bg-surface-container-lowest border border-border rounded-xl p-8 sm:p-10">
        {/* ── Logo + Title ── */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center text-on-secondary mb-5">
            <FiBox className="w-8 h-8 shrink-0" />
          </div>
          <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight mb-1.5">
            Welcome back
          </h1>
          <p className="text-sm text-neutral font-body">
            Sign in to access your workspace
          </p>
        </div>

        {/* ── Role Selector ── */}
        <div className="relative flex bg-input-bg rounded-xl p-1 mb-7 border border-border">
          {/* Sliding indicator */}
          <div
            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-surface-container-lowest rounded-lg border border-border transition-transform duration-300 ease-in-out ${
              role === "technician"
                ? "translate-x-[calc(100%+4px)]"
                : "translate-x-0"
            }`}
            style={{ left: "4px" }}
          />

          <button
            type="button"
            onClick={() => setRole("Admin")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors duration-200 cursor-pointer border-none bg-transparent ${
              role === "Admin"
                ? "text-on-surface"
                : "text-neutral hover:text-on-surface-variant"
            }`}
          >
            <FiShield className="w-4 h-4 shrink-0" />
            Admin
          </button>

          <button
            type="button"
            onClick={() => setRole("technician")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-semibold rounded-lg transition-colors duration-200 cursor-pointer border-none bg-transparent ${
              role === "technician"
                ? "text-on-surface"
                : "text-neutral hover:text-on-surface-variant"
            }`}
          >
            <FiTool className="w-4 h-4 shrink-0" />
            Technician
          </button>
        </div>

        {/* ── Form ── */}
        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          {/* Email Input */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="login-email"
              className="text-label font-bold text-on-surface uppercase tracking-[0.05em] leading-none"
            >
              Email
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-neutral pointer-events-none flex items-center">
                <FiMail className="w-[18px] h-[18px] shrink-0" />
              </span>
              <input
                id="login-email"
                type="email"
                className="w-full pl-11 pr-4 py-3 bg-input-bg border border-border rounded-xl text-on-surface text-sm font-body placeholder:text-neutral/50 outline-none transition-all duration-200 focus:border-primary focus:border-2 focus:ring-0"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-2">
            <label
              htmlFor="login-password"
              className="text-label font-bold text-on-surface uppercase tracking-[0.05em] leading-none"
            >
              Password
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-neutral pointer-events-none flex items-center">
                <FiLock className="w-[18px] h-[18px] shrink-0" />
              </span>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                className="w-full pl-11 pr-12 py-3 bg-input-bg border border-border rounded-xl text-on-surface text-sm font-body placeholder:text-neutral/50 outline-none transition-all duration-200 focus:border-primary focus:border-2 focus:ring-0"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                className="absolute right-3 flex items-center justify-center p-1.5 text-neutral hover:text-on-surface transition-colors duration-200 rounded-md cursor-pointer bg-transparent border-none"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <FiEyeOff className="w-[18px] h-[18px] shrink-0" />
                ) : (
                  <FiEye className="w-[18px] h-[18px] shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 bg-primary hover:bg-primary/90 text-on-primary text-label uppercase tracking-[0.05em] font-bold rounded-xl flex items-center justify-center gap-2.5 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] border-none"
          >
            {isLoading ? (
              <>
                <FiLoader className="w-5 h-5 shrink-0 animate-spin" />
                Authenticating...
              </>
            ) : (
              <>
                Sign in
                <FiArrowRight className="w-4 h-4 shrink-0" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RoleBaseLoginPage;
