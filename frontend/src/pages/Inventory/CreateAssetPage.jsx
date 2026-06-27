import React, { useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiBox,
  FiUploadCloud,
  FiSave,
  FiLoader,
  FiImage,
  FiAlignLeft,
} from "react-icons/fi";

import { AdminContext } from "../../contexts/AdminContext.jsx";
import assetService from "../../services/asset.service.js";

const ASSET_CATEGORIES = [
  "GPU",
  "CPU",
  "STORAGE",
  "MEMORY",
  "DESKTOPS",
  "SERVERS",
  "NETWORKING",
  "PERIPHERALS",
  "COMPONENTS",
  "MICROCONTROLLERS",
  "LAPTOPS",
];

const CreateAssetPage = () => {
  const navigate = useNavigate();
  const { adminToken } = useContext(AdminContext);
  const fileInputRef = useRef(null);

  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(ASSET_CATEGORIES[0]);
  const [unitPrice, setUnitPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");

  // Image State
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle Image Selection
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5000000) {
        // 5MB limit
        toast.error("Image must be less than 5MB");
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  // Handle Create Asset Form Submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name.trim() || !unitPrice || !stock || !minStock) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      const newAsset = await assetService.createAsset(
        {
          name,
          description: description.trim() || "No description provided.", // Fallback if empty
          // description: description.trim() || "", // Fallback if empty
          category,
          unitPrice: parseFloat(unitPrice),
          stock: parseInt(stock, 10),
          minStock: parseInt(minStock, 10),
          assetImage: imageFile,
        },
        adminToken
      );

      console.log("New created asset:", newAsset);

      toast.success("Asset created successfully!");
      navigate("/inventory/assets"); // Route back to inventory on success
    } catch (err) {
      toast.error(err?.detail || err?.message || "Failed to create asset.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8 max-w-[800px] w-full">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/inventory/assets")}
          className="flex items-center gap-2 text-sm font-bold text-neutral hover:text-on-surface transition-colors w-fit border-none bg-transparent cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1.5">
            Add New Asset
          </h1>
          <p className="text-body-sm text-neutral">
            Register a new component or product into the central registry
          </p>
        </div>
      </div>

      {/* ── FORM CARD ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 relative">
        <form onSubmit={handleSubmit} className="flex flex-col gap-8">
          {/* Image Upload Area */}
          <div className="flex flex-col gap-3">
            <label className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none">
              Asset Image (Optional)
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-xl bg-surface-container border border-border border-dashed flex flex-col items-center justify-center gap-2 text-neutral hover:bg-input-bg hover:text-on-surface transition-colors cursor-pointer overflow-hidden group"
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
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
            {/* Asset Name - Spans full width */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="name"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Asset Name
              </label>
              <div className="relative">
                <FiBox className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. NVIDIA GeForce RTX 5090"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                  required
                />
              </div>
            </div>

            {/* Description - Spans full width */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label
                htmlFor="description"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Description (Optional)
              </label>
              <div className="relative">
                <FiAlignLeft className="absolute left-3.5 top-3.5 w-[18px] h-[18px] text-neutral pointer-events-none" />
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add details about this asset..."
                  rows="3"
                  className="w-full pl-10 pr-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200 resize-y min-h-[100px]"
                />
              </div>
            </div>

            {/* Category */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="category"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Category
              </label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200 appearance-none cursor-pointer"
              >
                {ASSET_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Price */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="unitPrice"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Unit Price (₹)
              </label>
              <input
                id="unitPrice"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                placeholder="e.g. 150000"
                className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                required
              />
            </div>

            {/* Initial Stock */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="stock"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Initial Stock
              </label>
              <input
                id="stock"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="e.g. 10"
                className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                required
              />
            </div>

            {/* Minimum Stock Level */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="minStock"
                className="text-label font-bold text-neutral uppercase tracking-[0.05em] leading-none"
              >
                Minimum Stock Level
              </label>
              <input
                id="minStock"
                type="number"
                min="0"
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                placeholder="e.g. 5"
                className="w-full px-4 py-3 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
                required
              />
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
                  Creating Asset...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  Create New Asset
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateAssetPage;
