import React, { useContext } from "react";
import { NavLink } from "react-router-dom";
import { AdminContext } from "../contexts/AdminContext.jsx";
import { TechnicianContext } from "../contexts/TechnicianContext.jsx";
import { MdOutlineDashboard } from "react-icons/md";
import {
  FiGrid,
  FiPackage,
  FiShoppingCart,
  FiUsers,
  FiUser,
  FiBox,
  FiLogOut,
} from "react-icons/fi";

const Sidebar = () => {
  const { isAdminLoggedIn, adminLogoutHandler } = useContext(AdminContext);
  const { isTechnicianLoggedIn, technicianLogoutHandler } =
    useContext(TechnicianContext);

  const handleLogout = () => {
    if (isAdminLoggedIn) adminLogoutHandler();
    else if (isTechnicianLoggedIn) technicianLogoutHandler();
  };

  // Base sidebar navigation links for everyone
  const navLinks = [
    // { name: "Dashboard", path: "/dashboard", icon: FiGrid },
    { name: "Dashboard", path: "/dashboard", icon: MdOutlineDashboard },
    { name: "Inventory", path: "/inventory/assets", icon: FiPackage },
    { name: "Orders", path: "/orders", icon: FiShoppingCart },
  ];

  // Inject Admin-only routes
  if (isAdminLoggedIn) {
    navLinks.push({ name: "Technicians", path: "/technicians", icon: FiUsers });
  }

  // Profile always goes at the bottom of the list for both roles
  navLinks.push({ name: "Profile", path: "/profile", icon: FiUser });

  return (
    <aside className="w-[260px] h-full bg-surface-container-lowest border-r border-border flex flex-col shrink-0">
      {/* ── Brand / Logo Area ── */}
      <div className="h-[72px] flex items-center px-6 border-b border-border shrink-0 gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-on-primary">
          <FiBox className="w-5 h-5 shrink-0" />
        </div>
        <div className="flex flex-col">
          <span className="font-display font-bold text-body-md text-on-surface leading-tight">
            CelerityForge
          </span>
          <span className="text-label uppercase font-bold tracking-[0.05em] text-neutral leading-tight mt-0.5">
            {isAdminLoggedIn ? "Admin Terminal" : "Tech Terminal"}
          </span>
        </div>
      </div>

      {/* ── Primary Navigation ── */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                isActive
                  ? "bg-surface-container-high text-primary" // Active state (Tonal Blue)
                  : "text-neutral hover:bg-input-bg hover:text-on-surface" // Inactive hover
              }`
            }
          >
            <link.icon className="w-5 h-5 shrink-0" />
            {link.name}
          </NavLink>
        ))}
      </nav>

      {/* ── Footer Navigation ── */}
      <div className="p-4 border-t border-border space-y-1 shrink-0">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold text-neutral hover:bg-error-container hover:text-error transition-colors duration-200 cursor-pointer border-none bg-transparent"
        >
          <FiLogOut className="w-5 h-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
