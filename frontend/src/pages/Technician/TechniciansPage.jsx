import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import {
  FiPlus,
  FiUsers,
  FiUserCheck,
  FiUserX,
  FiMail,
  FiPhone,
  FiUser,
} from "react-icons/fi";

const TechniciansPage = () => {
  const { technicians } = useContext(AdminContext);
  const navigate = useNavigate();

  // Stats Calculations
  const totalStaff = technicians?.length || 0;
  const availableCount = technicians?.filter((t) => t.is_available).length || 0;
  const unavailableCount = totalStaff - availableCount;

  return (
    <div className="flex flex-col gap-8 max-w-[1440px] mx-auto w-full relative">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          {/* <div className="w-12 h-12 rounded-xl bg-surface-container-high border border-border flex items-center justify-center text-primary">
            <FiUsers className="w-6 h-6" />
          </div> */}
          <div>
            <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1">
              Technician Registry
            </h1>
            <p className="text-body-sm text-neutral">
              Centralized staff database and real-time dispatch tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate("/technicians/register")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary border border-primary rounded-xl text-sm font-bold text-on-primary hover:bg-primary/90 transition-colors duration-200 uppercase tracking-[0.05em] cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            Register Technician
          </button>
        </div>
      </div>

      {/* ── STATS CARDS SECTION ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Staff */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-surface-container-high flex items-center justify-center text-primary">
            <FiUsers className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label text-neutral font-bold uppercase tracking-[0.05em] mb-0.5">
              Total Staff
            </p>
            <p className="font-display text-headline-md font-bold text-on-surface leading-none">
              {totalStaff.toString().padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Available */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary">
            <FiUserCheck className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label text-neutral font-bold uppercase tracking-[0.05em] mb-0.5">
              Available
            </p>
            <p className="font-display text-headline-md font-bold text-on-surface leading-none">
              {availableCount.toString().padStart(2, "0")}
            </p>
          </div>
        </div>

        {/* Unavailable */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-10 h-10 rounded-lg bg-tertiary/10 border border-tertiary/20 flex items-center justify-center text-tertiary">
            <FiUserX className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label text-neutral font-bold uppercase tracking-[0.05em] mb-0.5">
              Unavailable
            </p>
            <p className="font-display text-headline-md font-bold text-on-surface leading-none">
              {unavailableCount.toString().padStart(2, "0")}
            </p>
          </div>
        </div>
      </div>

      {/* ── TECHNICIAN GRID SECTION ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {technicians?.length === 0 ? (
          <div className="col-span-full p-12 flex flex-col items-center justify-center border border-border rounded-xl bg-surface-container-lowest border-dashed text-neutral">
            <FiUsers className="w-8 h-8 mb-3 opacity-50" />
            <p className="text-sm font-bold uppercase tracking-[0.05em]">
              No Technicians Found
            </p>
          </div>
        ) : (
          technicians?.map((tech) => {
            const avatar = tech.profile_image_url;
            const initial = tech.name ? tech.name.charAt(0).toUpperCase() : "T";

            return (
              <div
                key={tech.id}
                className="bg-surface-container-lowest border border-border rounded-xl p-6 flex flex-col gap-6"
              >
                {/* Identity Row */}
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-surface-container border border-border flex items-center justify-center overflow-hidden shrink-0">
                    {avatar && !avatar.includes("default-avatar") ? (
                      <img
                        src={avatar}
                        alt={tech.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-primary flex items-center justify-center text-on-primary font-display font-bold text-lg">
                        {initial}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span
                      onClick={() => navigate(`/technicians/${tech.id}`)}
                      className="font-display text-lg font-bold text-on-surface truncate hover:underline cursor-pointer transition-all"
                    >
                      {tech.name || "Unknown Technician"}
                    </span>
                    <span className="text-xs font-bold text-primary uppercase tracking-[0.05em]">
                      ID: {tech.id?.substring(0, 8).toUpperCase() || "N/A"}
                    </span>
                  </div>
                </div>

                {/* Contact Info (Recessed Container) */}
                <div className="flex flex-col gap-3 bg-input-bg border border-border rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <FiMail className="w-4 h-4 text-neutral shrink-0" />
                    <span className="text-sm font-body text-on-surface truncate">
                      {tech.email || "No email provided"}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FiPhone className="w-4 h-4 text-neutral shrink-0" />
                    <span className="text-sm font-body text-on-surface truncate">
                      {tech.phone || "No phone provided"}
                    </span>
                  </div>
                </div>

                {/* Status Footer */}
                <div className="pt-4 border-t border-border flex justify-between items-center">
                  <div className="flex items-center gap-2.5">
                    {/* Blinker LED */}
                    <div className="relative flex h-2.5 w-2.5">
                      {tech.is_available && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
                          tech.is_available ? "bg-secondary" : "bg-tertiary"
                        }`}
                      ></span>
                    </div>
                    {/* Status Text */}
                    <span
                      className={`text-sm font-bold uppercase tracking-[0.05em] ${
                        tech.is_available ? "text-secondary" : "text-tertiary"
                      }`}
                    >
                      {tech.is_available ? "Available" : "Unavailable"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TechniciansPage;
