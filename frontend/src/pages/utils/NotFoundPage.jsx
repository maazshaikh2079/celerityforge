import React from "react";
import { useNavigate } from "react-router-dom";
import { FiMap, FiArrowLeft, FiHome } from "react-icons/fi";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] w-full px-4">
      <div className="bg-surface-container-lowest border border-border rounded-xl p-8 sm:p-12 max-w-md w-full flex flex-col items-center text-center gap-6">
        {/* ── ICON ── */}
        <div className="w-20 h-20 bg-error/10 text-error rounded-2xl flex items-center justify-center mb-2">
          <FiMap className="w-10 h-10 shrink-0" />
        </div>

        {/* ── TEXT CONTENT ── */}
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[48px] font-bold text-on-surface leading-none tracking-tight">
            404
          </h1>
          <h2 className="text-base font-bold text-on-surface uppercase tracking-[0.05em]">
            Page Not Found
          </h2>
          <p className="text-sm text-neutral mt-2">
            The page you are looking for doesn't exist, has been moved, or you
            don't have permission to view it.
          </p>
        </div>

        {/* ── ACTIONS ── */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold uppercase tracking-wide rounded-xl transition-all duration-200 cursor-pointer border border-border"
          >
            <FiArrowLeft className="w-4 h-4" /> Go Back
          </button>
          <button
            onClick={() => navigate("/")}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold uppercase tracking-wide rounded-xl transition-all duration-200 cursor-pointer border-none"
          >
            <FiHome className="w-4 h-4" /> Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage; 
