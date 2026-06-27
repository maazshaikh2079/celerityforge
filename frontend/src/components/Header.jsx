import React, { useContext } from "react";
import { AdminContext } from "../contexts/AdminContext.jsx";
import { TechnicianContext } from "../contexts/TechnicianContext.jsx";
import { FiBell } from "react-icons/fi";

const Header = () => {
  const { isAdminLoggedIn, adminData } = useContext(AdminContext);
  const { technicianData } = useContext(TechnicianContext);

  // Determine current active user data
  const currentUser = isAdminLoggedIn ? adminData : technicianData;
  const initial = currentUser?.name
    ? currentUser.name.charAt(0).toUpperCase()
    : "U";

  return (
    <header className="h-[72px] bg-surface-container-lowest border-b border-border flex items-center justify-end px-6 sm:px-8 shrink-0 gap-6">
      {/* ── Actions ── */}
      {/* <button className="text-neutral hover:text-on-surface transition-colors duration-200 cursor-pointer border-none bg-transparent p-2 rounded-lg hover:bg-input-bg">
        <FiBell className="w-[18px] h-[18px] shrink-0" />
      </button> */}

      {/* ── Profile Widget ── */}
      <div className="flex items-center gap-3 pl-6 border-l border-border">
        {currentUser?.profile_image_url &&
        !currentUser.profile_image_url.includes("default-avatar") ? (
          <img
            src={currentUser.profile_image_url}
            alt="Profile"
            className="w-10 h-10 rounded-xl object-cover border border-border"
          />
        ) : (
          // <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-display font-bold text-lg shadow-sm border border-neutral-800">
          <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-on-secondary font-display font-bold text-lg shadow-sm border border-secondary/50">
            {initial}
          </div>
        )}

        <div className="flex flex-col hidden sm:flex">
          <span className="text-sm font-bold text-on-surface leading-tight">
            {currentUser?.name || "Loading..."}
          </span>
          <span className="text-label text-neutral leading-tight mt-0.5">
            {currentUser?.email || "loading@example.com"}
          </span>
        </div>
      </div>
    </header>
  );
};

export default Header;
