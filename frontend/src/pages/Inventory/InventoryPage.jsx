import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiUploadCloud,
  FiDownloadCloud,
  FiPlus,
  FiAlertTriangle,
  FiXCircle,
  FiSearch,
  FiFilter,
  FiMoreVertical,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
} from "react-icons/fi";

import { AppContext } from "../../contexts/AppContext.jsx";
import { AdminContext } from "../../contexts/AdminContext.jsx";

const InventoryPage = () => {
  const { assets, inventoryStatsSummary } = useContext(AppContext);
  const { isAdminLoggedIn } = useContext(AdminContext);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Helper function: returns "₹amount"
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
    }).format(amount || 0);
  };

  // Filter assets based on search term AND active status filter
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      asset.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesFilter =
      activeFilter === "All" || activeFilter === asset.stock_status;

    return matchesSearch && matchesFilter;
  });

  // Export Function (Generates and downloads a CSV file for Excel)
  const handleExport = () => {
    const headers = [
      "ID",
      "Asset Name",
      "Category",
      "Current Stock",
      "Unit Price",
      "Total Value",
      "Status",
    ];

    const csvRows = filteredAssets.map((asset) => {
      const status = asset.stock_status;
      const totalValue = asset.stock * (asset.unit_price || 0);

      return [
        asset.id || "N/A",
        `"${asset.name || "Unknown Asset"}"`, // Quotes handle commas in names
        asset.category || "UNCATEGORIZED",
        asset.stock,
        asset.unit_price || 0,
        totalValue,
        status,
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `CelerityForge_Inventory_Export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // Inventory Stats Summary Variables
  const totalAssetsCount = inventoryStatsSummary?.total_assets || 0;

  const totalValuation = inventoryStatsSummary?.total_valuation || 0;

  const lowStockCount =
    inventoryStatsSummary?.stock_distribution?.low_stock || 0;

  const outOfStockCount =
    inventoryStatsSummary?.stock_distribution?.out_of_stock || 0;

  return (
    <div className="flex flex-col gap-8 max-w-[1440px] mx-auto w-full relative">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1">
              Inventory Registry
            </h1>
            <p className="text-body-sm text-neutral">
              Centralized asset database and real-time stock control
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-border rounded-xl text-sm font-semibold text-on-surface hover:bg-input-bg transition-colors duration-200 cursor-pointer"
          >
            <FiUploadCloud className="w-4 h-4" />
            Export
          </button>

          {/* Conditional rendering for Admin only */}
          {isAdminLoggedIn && (
            <button
              onClick={() => navigate("/inventory/assets/create")}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary border border-primary rounded-xl text-sm font-bold text-on-primary hover:bg-primary/90 transition-colors duration-200 uppercase tracking-[0.05em] cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              New Asset
            </button>
          )}
        </div>
      </div>

      {/* ── STATS CARDS SECTION ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Assets */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-surface-container-high flex items-center justify-center text-on-surface">
            <FiPackage className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label text-neutral font-bold uppercase tracking-[0.05em] mb-0.5">
              Total Assets
            </p>
            <p className="font-display text-headline-md font-bold text-on-surface leading-none">
              {totalAssetsCount}
            </p>
          </div>
        </div>

        {/* Total Valuation */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-secondary/15 flex items-center justify-center text-secondary">
            <span className="font-display font-bold text-lg">₹</span>
          </div>
          <div>
            <p className="text-label text-neutral font-bold uppercase tracking-[0.05em] mb-0.5">
              Total Valuation
            </p>
            <p className="font-display text-headline-md font-bold text-on-surface leading-none">
              {formatCurrency(totalValuation)}
            </p>
          </div>
        </div>

        {/* Low Stock */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-tertiary/15 border-none flex items-center justify-center text-tertiary">
            <FiAlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label text-neutral font-bold uppercase tracking-[0.05em] mb-0.5">
              Low Stock
            </p>
            <p className="font-display text-headline-md font-bold text-on-surface leading-none">
              {lowStockCount}
            </p>
          </div>
        </div>

        {/* Out of Stock */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-error/10 border-none flex items-center justify-center text-error">
            <FiXCircle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-label text-neutral font-bold uppercase tracking-[0.05em] mb-0.5">
              Out of Stock
            </p>
            <p className="font-display text-headline-md font-bold text-on-surface leading-none">
              {outOfStockCount}
            </p>
          </div>
        </div>
      </div>

      {/* ── DATA REGISTRY SECTION ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl flex flex-col relative">
        {/* Sticky Toolbar */}
        <div className="sticky top-[-32px] z-30 p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-surface-container-lowest rounded-t-xl">
          <div className="relative w-full sm:max-w-md">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-neutral" />
            <input
              type="text"
              placeholder="Search by Name or Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-input-bg border border-border rounded-xl text-sm font-body text-on-surface placeholder:text-neutral/60 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
            />
          </div>

          {/* Custom Filter Dropdown */}
          <div className="relative w-full sm:w-auto" ref={filterRef}>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border rounded-xl text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                activeFilter !== "All"
                  ? "border-primary text-primary bg-surface-container"
                  : "border-border text-on-surface hover:bg-input-bg"
              }`}
            >
              <FiFilter className="w-4 h-4" />
              {activeFilter === "All"
                ? "Filters"
                : `Filtered (${activeFilter})`}
            </button>

            {isFilterOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-surface-container-lowest border border-border rounded-xl z-50 flex flex-col p-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                {["All", "In Stock", "Low Stock", "Out of Stock"].map(
                  (option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setActiveFilter(option);
                        setIsFilterOpen(false);
                      }}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer border-none bg-transparent ${
                        activeFilter === option
                          ? "bg-surface-container text-primary font-bold"
                          : "text-on-surface hover:bg-input-bg"
                      }`}
                    >
                      {option === "All" ? "All / None" : option}
                      {activeFilter === option && (
                        <FiCheck className="w-4 h-4" />
                      )}
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-surface-container-lowest border-b border-border">
                <th className="px-6 py-4 text-label font-bold text-neutral uppercase tracking-[0.05em] whitespace-nowrap">
                  Asset Identification
                </th>
                <th className="px-6 py-4 text-label font-bold text-neutral uppercase tracking-[0.05em] whitespace-nowrap">
                  Category
                </th>
                <th className="px-6 py-4 text-label font-bold text-neutral uppercase tracking-[0.05em] whitespace-nowrap">
                  Current Stock
                </th>
                <th className="px-6 py-4 text-label font-bold text-neutral uppercase tracking-[0.05em] whitespace-nowrap">
                  Unit Price
                </th>
                <th className="px-6 py-4 text-label font-bold text-neutral uppercase tracking-[0.05em] whitespace-nowrap">
                  Total Value
                </th>
                <th className="px-6 py-4 text-label font-bold text-neutral uppercase tracking-[0.05em] whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredAssets.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="px-6 py-12 text-center text-neutral text-sm"
                  >
                    No assets found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredAssets.map((asset) => {
                  const stockStatus = asset.stock_status;
                  const maxStockCalc =
                    asset.max_stock || Math.max(asset.stock, 50);
                  const totalValue = asset.stock * (asset.unit_price || 0);

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-input-bg/50 transition-colors duration-150"
                    >
                      {/* Identity */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {asset.image_url ? (
                            <img
                              src={asset.image_url}
                              alt={asset.name}
                              className="w-10 h-10 rounded-lg object-cover border border-border shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-surface-container border border-border flex items-center justify-center shrink-0 text-primary">
                              <FiPackage className="w-5 h-5 opacity-50" />
                            </div>
                          )}
                          <span
                            onClick={() =>
                              navigate(`/inventory/assets/${asset.id}`)
                            }
                            className="text-sm font-bold text-on-surface whitespace-nowrap hover:underline cursor-pointer transition-all"
                          >
                            {asset.name || "Unknown Asset"}
                          </span>
                        </div>
                      </td>
                      {/* Category */}
                      <td className="px-6 py-4">
                        <span className="px-2.5 py-1 bg-input-bg border border-border rounded-md text-[11px] font-bold text-on-surface-variant uppercase tracking-[0.05em]">
                          {asset.category || "UNCATEGORIZED"}
                        </span>
                      </td>
                      {/* Current Stock (Progress Bar) */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${stockStatus === "Out of Stock" ? "bg-error" : stockStatus === "Low Stock" ? "bg-tertiary" : "bg-primary"}`}
                              style={{
                                width: `${Math.min((asset.stock / maxStockCalc) * 100, 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-body-sm font-bold text-on-surface">
                            {asset.stock}{" "}
                            <span className="font-normal text-neutral">
                              {asset.stock === 1 ? "Unit" : "Units"}
                            </span>
                          </span>
                        </div>
                      </td>
                      {/* Valuations */}
                      <td className="px-6 py-4 text-sm font-medium text-on-surface whitespace-nowrap">
                        {formatCurrency(asset.unit_price)}
                      </td>
                      {/* Total Value */}
                      <td className="px-6 py-4 text-sm font-medium text-on-surface whitespace-nowrap">
                        {formatCurrency(totalValue)}
                      </td>
                      {/* Status */}
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-surface-container-lowest rounded-b-xl">
          <span className="text-body-sm text-neutral">
            Displaying{" "}
            <strong className="text-on-surface">{filteredAssets.length}</strong>{" "}
            of <strong className="text-on-surface">{assets.length}</strong>{" "}
            components
          </span>
        </div>
      </div>
    </div>
  );
};

export default InventoryPage;
