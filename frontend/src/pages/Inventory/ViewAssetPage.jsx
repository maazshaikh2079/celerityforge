import React, { useState, useEffect, useContext, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import { TechnicianContext } from "../../contexts/TechnicianContext.jsx";
import assetService from "../../services/asset.service.js";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiMoreVertical,
  FiEdit2,
  FiXCircle,
  FiTrash2,
  FiBox,
  FiLoader,
} from "react-icons/fi";

const ViewAssetPage = () => {
  const { assetId } = useParams();
  const navigate = useNavigate();

  const { isAdminLoggedIn, adminToken } = useContext(AdminContext);
  const { isTechnicianLoggedIn, technicianToken } =
    useContext(TechnicianContext);

  const currentUserToken = isAdminLoggedIn ? adminToken : technicianToken;

  const [asset, setAsset] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
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

  // Fetch Asset Data
  const fetchAsset = async () => {
    try {
      setIsLoading(true);
      const data = await assetService.getAssetById(assetId, currentUserToken);
      setAsset(data);
    } catch (err) {
      toast.error(
        err?.detail || err?.message || "Failed to load asset details"
      );
      navigate("/inventory/assets"); // Go back if asset doesn't exist
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserToken) {
      fetchAsset();
    }
  }, [assetId, currentUserToken]);

  // Actions Logic
  const handleEdit = () => {
    navigate(`/inventory/assets/${assetId}/update`);
  };

  const handleMarkOutOfStock = async () => {
    if (
      !window.confirm(
        "Are you sure you want to mark this asset as Out of Stock?"
      )
    )
      return;

    setIsActionLoading(true);
    try {
      await assetService.markOutOfStock(assetId, adminToken);
      toast.success("Asset marked out of stock successfully");
      setIsDropdownOpen(false);
      fetchAsset(); // Refresh data to show new status
    } catch (err) {
      toast.error(
        err?.detail || err?.message || "Failed to update stock status"
      );
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (
      !window.confirm(
        "CRITICAL WARNING: Are you sure you want to permanently delete this asset?"
      )
    )
      return;

    setIsActionLoading(true);
    try {
      await assetService.deleteAsset(assetId, adminToken);
      toast.success("Asset deleted successfully");
      navigate("/inventory/assets"); // Redirect to list after deletion
    } catch (err) {
      toast.error(err?.detail || err?.message || "Failed to delete asset");
      setIsActionLoading(false);
    }
  };

  // Helper formatting function
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[60vh]">
        <FiLoader className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (!asset) return null;

  const stockStatus = asset?.stock_status || "Asset Stock Status Undefined";

  const totalEquity = asset.stock * (asset.unit_price || 0);

  return (
    <div className="flex flex-col gap-8 max-w-[1000px] w-full">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/inventory/assets")}
          className="flex items-center gap-2 text-sm font-bold text-primary hover:text-primary/80 transition-colors w-fit border-none bg-transparent cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Inventory
        </button>
        <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-2">
          Inventory Asset Detail View
        </h1>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* Left Column: Image Container */}
        <div className="w-full lg:w-1/3 aspect-square bg-surface-container border border-border rounded-xl flex items-center justify-center p-8 shrink-0 relative overflow-hidden">
          {asset.image_url ? (
            <img
              src={asset.image_url}
              alt={asset.name}
              className="w-full h-full object-contain"
            />
          ) : (
            <FiBox className="w-24 h-24 text-primary opacity-20" />
          )}
        </div>

        {/* Right Column: Data Card */}
        <div className="w-full lg:w-2/3 bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-10 relative">
          {/* Card Header & Actions */}
          <div className="flex justify-between items-start mb-10">
            <h2 className="font-display text-headline-md font-bold text-on-surface pr-8">
              {asset.name || "Unknown Asset"}
            </h2>

            {/* Conditional Dropdown for Admins Only */}
            {isAdminLoggedIn && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  disabled={isActionLoading}
                  className="p-2 text-neutral hover:text-on-surface hover:bg-input-bg rounded-lg transition-colors cursor-pointer border-none bg-transparent"
                >
                  {isActionLoading ? (
                    <FiLoader className="w-5 h-5 animate-spin" />
                  ) : (
                    <FiMoreVertical className="w-5 h-5" />
                  )}
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-border rounded-xl z-50 flex flex-col p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                      onClick={handleEdit}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-on-surface hover:bg-input-bg transition-colors cursor-pointer border-none bg-transparent w-full text-left"
                    >
                      <FiEdit2 className="w-4 h-4 text-neutral" />
                      Edit Asset
                    </button>
                    <button
                      onClick={handleMarkOutOfStock}
                      disabled={stockStatus === "Out of Stock"}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-on-surface hover:bg-input-bg transition-colors cursor-pointer border-none bg-transparent w-full text-left disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiXCircle className="w-4 h-4 text-tertiary" />
                      Mark "Out of Stock"
                    </button>
                    <div className="h-px bg-border my-1 mx-2" />
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold text-error hover:bg-error-container transition-colors cursor-pointer border-none bg-transparent w-full text-left"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      Delete Asset
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Details List */}
          <div className="flex flex-col">
            <div className="flex flex-col sm:flex-row py-5 border-b border-border gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Description
              </span>
              <span className="text-sm font-medium text-neutral tracking-wide uppercase">
                {asset.description || "N/A"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row py-5 border-b border-border gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Category
              </span>
              <span className="text-sm font-medium text-neutral">
                {asset.category || "Uncategorized"}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row py-5 border-b border-border gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Current Stock
              </span>
              <span className="text-sm font-bold text-secondary">
                {asset.stock}{" "}
                <span className="font-medium text-neutral">
                  {asset.stock === 1 ? "Unit" : "Units"}
                </span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row py-5 border-b border-border gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Unit Price
              </span>
              <span className="text-sm font-bold text-on-surface">
                {formatCurrency(asset.unit_price)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row py-5 border-b border-border gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Total Equity
              </span>
              <span className="text-sm font-bold text-on-surface">
                {formatCurrency(totalEquity)}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row py-5 border-b border-border gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Minimum Stock Level
              </span>
              <span className="text-sm font-bold text-error">
                {asset.min_stock || 5}{" "}
                <span className="font-medium">Units</span>
              </span>
            </div>

            <div className="flex flex-col sm:flex-row py-5 gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Status
              </span>
              <div className="flex items-center gap-2">
                <div
                  className={`w-2 h-2 rounded-full ${
                    stockStatus === "In Stock"
                      ? "bg-secondary"
                      : stockStatus === "Low Stock"
                        ? "bg-tertiary"
                        : "bg-error"
                  }`}
                />
                <span
                  className={`text-sm font-bold ${
                    stockStatus === "In Stock"
                      ? "text-secondary"
                      : stockStatus === "Low Stock"
                        ? "text-tertiary"
                        : "text-error"
                  }`}
                >
                  {stockStatus}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row py-5 border-b border-border gap-2 sm:gap-8 items-start sm:items-center">
              <span className="w-full sm:w-1/3 text-sm font-bold text-on-surface">
                Asset ID
              </span>
              <span className="text-sm font-medium text-neutral tracking-wide ">
                {asset.id || "N/A"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewAssetPage;
