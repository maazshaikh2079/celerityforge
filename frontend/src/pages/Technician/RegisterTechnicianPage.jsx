import React, { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import technicianService from "../../services/technician.service.js";
import toast from "react-hot-toast";

import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiUploadCloud,
  FiSave,
  FiLoader,
  FiShield,
} from "react-icons/fi";

const RegisterTechnicianPage = () => {
  const navigate = useNavigate();
  const { adminToken } = useContext(AdminContext);
  const fileInputRef = useRef(null);

  // Form State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2000000) {
        // Limit 2MB
        toast.error("Image must be less than 2MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      toast.error("Name, Email, and Passwords are required fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Initial password and confirmation do not match.");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsSubmitting(true);

    try {
      await technicianService.register(
        {
          name,
          email,
          phone,
          password,
          profileImage: imageFile,
        },
        adminToken
      );

      toast.success("Technician registered successfully!");
      navigate("/technicians"); // Route back to list on success
    } catch (err) {
      toast.error(
        err?.message || err?.detail || "Failed to register technician."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-[800px] w-full">
      {/* ── HEADER SECTION ── */}
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
            Register New Technician
          </h1>
          <p className="text-body-sm text-neutral">
            Onboard a new field operative into the dispatch system
          </p>
        </div>
      </div>

      {/* ── REGISTRATION FORM CARD ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 relative">
        <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
          <FiShield className="w-5 h-5 text-neutral" />
          <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
            Identity & Access Credentials
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
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
            {/* Full Name - Spans full width */}
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
                  placeholder="e.g. Marcus Vance"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="email"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Email Address
              </label>
              <div className="relative">
                <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. marcus@celerityforge.com"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Phone Number */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="phone"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Phone Number (Optional)
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

            {/* Initial Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="password"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Initial Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="confirmPassword"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Confirm Password
              </label>
              <div className="relative">
                <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-type initial password"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 mt-2 border-t border-border">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary hover:bg-primary/90 text-on-primary text-label uppercase tracking-[0.05em] font-bold rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Register Technician
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RegisterTechnicianPage;
