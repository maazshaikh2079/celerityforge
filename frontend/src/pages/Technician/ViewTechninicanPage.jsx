import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import technicianService from "../../services/technician.service.js";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiTool,
  FiCheckCircle,
  FiXCircle,
  FiLoader,
  FiMoreVertical,
  FiEdit2,
  FiTrash2,
} from "react-icons/fi";

const ViewTechnicianPage = () => {
  const { technicianId } = useParams();
  const navigate = useNavigate();
  const { adminToken, loadTechnicians } = useContext(AdminContext);

  const [technician, setTechnician] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  // Dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch Technician Data
  const fetchTechnician = async () => {
    try {
      setIsLoading(true);
      const data = await technicianService.getProfile(technicianId, adminToken);
      setTechnician(data);
    } catch (err) {
      toast.error(
        err?.detail || err?.message || "Failed to load technician details."
      );
      navigate("/technicians");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken && technicianId) {
      fetchTechnician();
    }
  }, [adminToken, technicianId]);

  const refreshContextData = () => {
    loadTechnicians(adminToken);
  };

  // Handle Availability Toggle (Admin Override)
  const handleToggleAvailability = async () => {
    if (!technician) return;

    setIsToggling(true);
    const newStatus = !technician.is_available;

    try {
      await technicianService.updateAvailability(
        technician.id,
        newStatus,
        adminToken
      );

      setTechnician({ ...technician, is_available: newStatus });
      refreshContextData(); // Referesh context data to update technician and availability cards on TechniciansPage.jsx

      toast.success(
        newStatus ? "Status updated: Available" : "Status updated: Unavailable"
      );
    } catch (err) {
      toast.error(
        err?.detail || err?.message || "Failed to update availability status."
      );
    } finally {
      setIsToggling(false);
    }
  };

  // Actions Logic
  const handleEdit = () => {
    navigate(`/technicians/${technicianId}/update`);
  };

  // const handleDelete = async () => {
  // toast.error("TODO: Build delete(soft & hard) technician endpoint");
  // // if (
  // //   !window.confirm(
  // //     `CRITICAL WARNING: Are you sure you want to permanently delete ${technician?.name || "this technician"}?`
  // //   )
  // // )
  // //   return;
  // // try {
  // //   // Ensure you have a deleteTechnician method in your technician.service.js
  // //   await technicianService.deleteTechnician(technicianId, adminToken);
  // //   toast.success("Technician deleted successfully.");
  // //   navigate("/technicians");
  // // } catch (err) {
  // //   toast.error(err?.detail || err?.message || "Failed to delete technician.");
  // // }
  // };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!technician) return null;

  // Fallbacks for robust rendering
  const name = technician.name || "Unknown Technician";
  const email = technician.email || "No email provided";
  const phone = technician.phone || "No phone provided";
  const avatar = technician.profile_image_url;
  const initial = name.charAt(0).toUpperCase();

  return (
    <div className="flex flex-col gap-8 max-w-[1000px] mx-auto w-full relative">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/technicians")}
            className="flex items-center gap-2 text-sm font-bold text-neutral hover:text-on-surface transition-colors w-fit border-none bg-transparent cursor-pointer"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Technicians
          </button>
          <div>
            <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1.5">
              Technician Detail View
            </h1>
            <p className="text-body-sm text-neutral">
              Administrative overview and availability control
            </p>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Avatar, Identity & Admin Override */}
        <div className="w-full lg:w-1/3 bg-surface-container-lowest border border-border rounded-xl p-8 flex flex-col items-center text-center shrink-0 relative">
          <div className="w-32 h-32 rounded-xl bg-surface-container border border-border flex items-center justify-center mb-6 overflow-hidden relative">
            {avatar && !avatar.includes("default-avatar") ? (
              <img
                src={avatar}
                alt={name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-primary flex items-center justify-center text-on-primary font-display font-bold text-display">
                {initial}
              </div>
            )}

            {/* Absolute Badge for Role */}
            <div className="absolute bottom-2 right-2 bg-surface-container-lowest border border-border rounded-lg p-1.5 shadow-sm">
              <FiTool className="w-4 h-4 text-primary" />
            </div>
          </div>

          <h2 className="font-display text-headline-sm font-bold text-on-surface mb-1">
            {name}
          </h2>
          <span className="text-xs font-bold text-neutral mb-2">
            ID: {technician.id?.substring(0, 8).toUpperCase() || "N/A"}
          </span>
          <span className="px-3 py-1 bg-surface-container-high border border-border rounded-md text-[11px] font-bold text-primary uppercase tracking-[0.05em]">
            Field Technician
          </span>

          {/* Admin Override: Availability Control Block */}
          <div className="w-full mt-8 pt-6 border-t border-border flex flex-col gap-3">
            <span className="text-label font-bold text-neutral uppercase tracking-[0.05em]">
              {/* Dispatch Status Override */}
              Availability Status Override
            </span>
            <button
              onClick={handleToggleAvailability}
              disabled={isToggling}
              className={`flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl border text-sm font-bold uppercase tracking-[0.05em] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                technician.is_available
                  ? "bg-secondary/10 border-secondary text-secondary hover:bg-secondary/20"
                  : "bg-input-bg border-border text-neutral hover:text-on-surface hover:border-neutral"
              }`}
            >
              {isToggling ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : technician.is_available ? (
                <FiCheckCircle className="w-4 h-4" />
              ) : (
                <FiXCircle className="w-4 h-4" />
              )}
              {isToggling
                ? "Updating..."
                : technician.is_available
                  ? "Available"
                  : "Unavailable"}
            </button>
          </div>
        </div>

        {/* Right Column: Data Fields & Actions */}
        <div className="w-full lg:w-2/3 bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8">
          <div className="flex justify-between items-center border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-3">
              <FiUser className="w-5 h-5 text-neutral" />
              <h3 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Registry Information
              </h3>
            </div>

            {/* Actions Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="p-2 text-neutral hover:text-on-surface hover:bg-input-bg rounded-lg transition-colors cursor-pointer border-none bg-transparent"
              >
                <FiMoreVertical className="w-5 h-5" />
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-border rounded-xl z-50 flex flex-col p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-on-surface hover:bg-input-bg transition-colors cursor-pointer border-none bg-transparent w-full text-left"
                  >
                    <FiEdit2 className="w-4 h-4 text-neutral" />
                    Edit Profile
                  </button>
                  <div className="h-px bg-border my-1 mx-2" />
                  {/* <button
                    onClick={handleDelete}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-error hover:bg-error-container transition-colors cursor-pointer border-none bg-transparent w-full text-left"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete Technician
                  </button> */}
                </div>
              )}
            </div>
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

export default ViewTechnicianPage;
