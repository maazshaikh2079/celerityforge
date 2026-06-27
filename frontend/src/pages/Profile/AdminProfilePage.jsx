import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import { FiEdit2, FiMail, FiPhone, FiShield, FiUser } from "react-icons/fi";

const AdminProfilePage = () => {
  const { adminData } = useContext(AdminContext);
  const navigate = useNavigate();

  // Fallbacks for robust rendering
  const name = adminData?.name || "Administrator";
  const email = adminData?.email || "No email provided";
  const phone = adminData?.phone || "No phone provided";
  const avatar = adminData?.profile_image_url;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-8 max-w-[1000px] mx-auto w-full relative">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1.5">
            Admin Profile
          </h1>
          <p className="text-body-sm text-neutral">
            Manage your administrative credentials and terminal access
          </p>
        </div>

        <button
          onClick={() => navigate("/profile/update")}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary border border-primary rounded-xl text-sm font-bold text-on-primary hover:bg-primary/90 transition-colors duration-200 uppercase tracking-[0.05em] cursor-pointer"
        >
          <FiEdit2 className="w-4 h-4" />
          Edit Profile
        </button>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Avatar & Identity Card */}
        <div className="w-full lg:w-1/3 bg-surface-container-lowest border border-border rounded-xl p-8 flex flex-col items-center text-center shrink-0 relative">
          <div className="w-32 h-32 rounded-xl bg-surface-container border border-border flex items-center justify-center mb-6 overflow-hidden relative">
            {avatar && !avatar.includes("default-avatar") ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-secondary flex items-center justify-center text-on-secondary font-display font-bold text-display">
                {initial}
              </div>
            )}

            {/* Absolute Badge for Role */}
            <div className="absolute bottom-2 right-2 bg-surface-container-lowest border border-border rounded-lg p-1.5 shadow-sm">
              <FiShield className="w-4 h-4 text-primary" />
            </div>
          </div>

          <h2 className="font-display text-headline-sm font-bold text-on-surface mb-1">
            {name}
          </h2>
          <span className="px-3 py-1 bg-surface-container-high border border-border rounded-md text-[11px] font-bold text-primary uppercase tracking-[0.05em]">
            System Administrator
          </span>
        </div>

        {/* Right Column: Read-Only Data Fields */}
        <div className="w-full lg:w-2/3 bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8">
          <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
            <FiUser className="w-5 h-5 text-neutral" />
            <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
              Contact Information
            </h3>
          </div>

          <div className="flex flex-col gap-6">
            {/* Full Name Readout */}
            <div className="flex flex-col gap-2">
              <label className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none">
                Full Name
              </label>
              <div className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface flex items-center">
                {name}
              </div>
            </div>

            {/* Email Readout */}
            <div className="flex flex-col gap-2">
              <label className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none">
                Email Address
              </label>
              <div className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface relative flex items-center">
                <FiMail className="absolute left-3.5 text-neutral w-[18px] h-[18px]" />
                {email}
              </div>
            </div>

            {/* Phone Readout */}
            <div className="flex flex-col gap-2">
              <label className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none">
                Phone Number
              </label>
              <div className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface relative flex items-center">
                <FiPhone className="absolute left-3.5 text-neutral w-[18px] h-[18px]" />
                {phone}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfilePage;
