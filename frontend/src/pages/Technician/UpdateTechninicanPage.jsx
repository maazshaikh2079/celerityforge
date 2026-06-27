import React, { useState, useContext, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import technicianService from "../../services/technician.service.js";
import toast from "react-hot-toast";

import {
  FiArrowLeft,
  FiUser,
  FiPhone,
  FiMail,
  FiUploadCloud,
  FiSave,
  FiLoader,
  FiLock,
  FiShield,
  FiAlertOctagon,
} from "react-icons/fi";

const UpdateTechnicianPage = () => {
  const { technicianId } = useParams();
  const navigate = useNavigate();
  const { adminToken, loadTechnicians } = useContext(AdminContext);
  const fileInputRef = useRef(null);

  // ── Profile Form State ──
  const [name, setName] = useState("");
  const [email, setEmail] = useState(""); // Admin specific
  const [phone, setPhone] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // ── Password Override Form State (Admin) ──
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const [isFetching, setIsFetching] = useState(true);

  // Initialize data on mount
  useEffect(() => {
    const fetchTechnician = async () => {
      try {
        setIsFetching(true);
        const data = await technicianService.getProfile(
          technicianId,
          adminToken
        );

        setName(data.name || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");

        if (
          data.profile_image_url &&
          !data.profile_image_url.includes("default-avatar")
        ) {
          setImagePreview(data.profile_image_url);
        }
      } catch (err) {
        toast.error(
          err?.detail || err?.message || "Failed to load technician details."
        );
        navigate("/technicians");
      } finally {
        setIsFetching(false);
      }
    };

    if (adminToken && technicianId) {
      fetchTechnician();
    }
  }, [adminToken, technicianId, navigate]);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        // 2MB Limit
        toast.error("Image must be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Profile Update Submission
  const handleUpdateProfileSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim()) {
      toast.error("Name and Email are required.");
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const data = await technicianService.updateProfile(
        technicianId,
        {
          name,
          email,
          phone,
          profileImage: imageFile,
        },
        adminToken
      );

      if (data.technician_data) loadTechnicians(adminToken);

      toast.success(
        data?.message || "Technician profile updated successfully!"
      );
    } catch (err) {
      toast.error(err?.detail || err?.message || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Handle Admin Password Reset Override
  const handleUpdatePasswordSubmit = async (e) => {
    e.preventDefault();

    if (!newPassword || !confirmPassword) {
      toast.error("Please fill all password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters long.");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to forcibly reset this technician's password?"
      )
    ) {
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const data = await technicianService.updatePassword(
        technicianId,
        {
          newPassword,
          // currentPassword: null, // Admin override bypasses current password
        },
        adminToken
      );

      if (data?.error_message) throw new Error(data.error_message);

      toast.success("Technician password forcibly reset successfully!");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.error(err?.detail || err?.message || "Failed to reset password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 max-w-[800px] w-full">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate(`/technicians/${technicianId}`)}
          className="flex items-center gap-2 text-sm font-bold text-neutral hover:text-on-surface transition-colors w-fit border-none bg-transparent cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Technician Details
        </button>
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1.5">
            Modify Technician Record
          </h1>
          <p className="text-body-sm text-neutral">
            Update administrative identity data and manage security overrides
          </p>
        </div>
      </div>

      {/* ── PROFILE UPDATE CARD ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 relative">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
          <FiUser className="w-5 h-5 text-neutral" />
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
            Identity Specifications
          </h2>
        </div>

        <form
          onSubmit={handleUpdateProfileSubmit}
          className="flex flex-col gap-8"
        >
          {/* Image Upload Area */}
          <div className="flex flex-col gap-3">
            <label className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none">
              Profile Image (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 rounded-xl bg-surface-container border border-border border-dashed flex flex-col items-center justify-center gap-2 text-neutral hover:bg-input-bg hover:text-on-surface transition-colors cursor-pointer overflow-hidden group relative"
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-full object-cover group-hover:opacity-50 transition-opacity"
                  />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <FiUploadCloud className="w-6 h-6 text-on-surface" />
                  </div>
                </>
              ) : (
                <>
                  <FiUploadCloud className="w-8 h-8 group-hover:scale-110 transition-transform duration-200" />
                  <span className="text-xs font-bold uppercase tracking-[0.05em]">
                    Upload
                  </span>
                </>
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/jpeg, image/png, image/webp, image/gif"
              className="hidden"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="name"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Full Name
              </label>
              <div className="relative">
                <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Alex Sterling"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Email (Admin Only Field) */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none flex items-center gap-2"
              >
                Email Address{" "}
                <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded uppercase tracking-widest">
                  Admin Override
                </span>
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. alex@celerityforge.com"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="phone"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Phone Number
              </label>
              <div className="relative">
                <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="phone"
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +1 555-0198"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Profile Submit Action */}
          <div className="pt-4 mt-2 border-t border-border">
            <button
              type="submit"
              disabled={isUpdatingProfile}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary text-label uppercase tracking-[0.05em] font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none w-full sm:w-auto"
            >
              {isUpdatingProfile ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Updating Record...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* ── SECURITY OVERRIDE CARD (ADMIN ONLY) ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 relative">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
          <FiAlertOctagon className="w-5 h-5 text-error" />
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
            Administrative Password Override
          </h2>
        </div>

        <form
          onSubmit={handleUpdatePasswordSubmit}
          className="flex flex-col gap-6"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* New Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="newPassword"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Force New Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-error focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Confirm Forced Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type new password"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-error focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Password Submit Action */}
          <div className="pt-4 mt-2 border-t border-border">
            <button
              type="submit"
              disabled={isUpdatingPassword}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-error hover:bg-error/90 text-white text-label uppercase tracking-[0.05em] font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none w-full sm:w-auto"
            >
              {isUpdatingPassword ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Executing Override...
                </>
              ) : (
                <>
                  <FiShield className="w-4 h-4" />
                  Force Password Reset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UpdateTechnicianPage;
