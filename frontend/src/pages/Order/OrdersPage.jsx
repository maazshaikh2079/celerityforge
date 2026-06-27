import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import { TechnicianContext } from "../../contexts/TechnicianContext.jsx";
import {
  FiPlus,
  FiSearch,
  FiSliders,
  FiShoppingCart,
  FiAlertCircle,
  FiCheckCircle,
  FiChevronLeft,
  FiChevronRight,
  FiCheck,
  FiUploadCloud,
  FiXCircle,
} from "react-icons/fi";

const OrdersPage = () => {
  const navigate = useNavigate();

  const adminCtx = useContext(AdminContext);
  const techCtx = useContext(TechnicianContext);

  const isAdmin = adminCtx?.isAdminLoggedIn;

  const orders = isAdmin ? adminCtx?.orders : techCtx?.technicianOrders;
  const stats = isAdmin
    ? adminCtx?.ordersStatsSummary
    : techCtx?.technicianOrdersStatsSummary;
  const technicians = adminCtx?.technicians || [];

  const loadOrders = adminCtx?.loadOrders;
  const adminToken = adminCtx?.adminToken;
  const adminId = adminCtx?.adminId;

  const [activeTab, setActiveTab] = useState("All Orders");
  const [searchQuery, setSearchQuery] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedAssignee, setSelectedAssignee] = useState("All");

  const filterRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- FETCH DATA ON FILTER CHANGE ---
  useEffect(() => {
    if (isAdmin && loadOrders && adminToken) {
      if (selectedAssignee === "All") {
        loadOrders(adminToken);
      } else if (selectedAssignee === "Admin") {
        loadOrders(adminToken, { assigneeId: adminId });
      } else {
        loadOrders(adminToken, { assigneeId: selectedAssignee });
      }
    }
  }, [selectedAssignee, isAdmin, adminToken, adminId]);

  const totalCount = stats?.total_orders?.count || 0;
  const totalValue = stats?.total_orders?.total_value || 0;

  const pendingCount = stats?.pending_orders?.count || 0;
  const pendingValue = stats?.pending_orders?.total_value || 0;

  const completedCount = stats?.paid_orders?.count || 0;
  const completedValue = stats?.paid_orders?.total_value || 0;

  const cancelledCount = stats?.cancelled_orders?.count || 0;
  const cancelledValue = stats?.cancelled_orders?.total_value || 0;

  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  // --- CLIENT-SIDE FILTERING ---
  const filteredOrders = orders?.filter((order) => {
    const customerName = order.customer?.name || "Undefined Customer Name";
    const assigneeName = order.assignee?.name || "Unassigned";

    const matchesSearch =
      order.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assigneeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items?.some((item) =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase())
      );

    let matchesTab = true;
    if (activeTab === "Paid")
      matchesTab = order.status?.toLowerCase() === "paid";
    if (activeTab === "Pending")
      matchesTab = order.status?.toLowerCase() === "pending";
    if (activeTab === "Cancelled")
      matchesTab = order.status?.toLowerCase() === "cancelled";

    return matchesSearch && matchesTab;
  });

  // --- CSV EXPORT LOGIC ---
  const handleExport = () => {
    if (!filteredOrders || filteredOrders.length === 0) return;

    const headers = [
      "Order ID",
      "Customer Name",
      "Assignee",
      "Status",
      "Date",
      "Total Amount",
      "Items",
    ];

    const rows = filteredOrders.map((order) => {
      const id = order.id || "";
      const customer = order.customer?.name || "Undefined Customer Name";
      const assignee = (order.assignee?.name || "Unassigned").replace(
        /,/g,
        " "
      );
      const status = order.status || "Unknown";
      const date = order.created_at
        ? new Date(order.created_at).toLocaleDateString("en-US")
        : "";
      const amount = order.total_amount || 0;

      const itemsString =
        order.items && order.items.length > 0
          ? order.items
              .map((i) => i.name)
              .join("; ")
              .replace(/,/g, " ")
          : "No items";

      return `${id},${customer},${assignee},${status},${date},${amount},${itemsString}`;
    });

    const csvContent = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Orders_Export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-6 max-w-[1440px] mx-auto w-full relative">
      {/* ── HEADER SECTION ── */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1.5">
            Order Fulfillment
          </h1>
          <p className="text-body-sm text-neutral">
            Manage custom builds and component sales pipelines.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-transparent border border-border rounded-xl text-sm font-semibold text-on-surface hover:bg-input-bg transition-colors duration-200 cursor-pointer"
          >
            <FiUploadCloud className="w-4 h-4" />
            Export
          </button>

          <button
            onClick={() => navigate("/orders/create")}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary border border-primary rounded-xl text-sm font-bold text-on-primary hover:bg-primary/90 transition-colors cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            NEW ORDER
          </button>
        </div>
      </div>

      {/* ── STATS SUMMARY METRICS CARD GRID ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-6 right-6 bg-surface-container-high px-2 py-1 rounded text-[10px] font-bold text-neutral uppercase tracking-widest">
            Total Orders
          </div>
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
            <FiShoppingCart className="w-5 h-5" />
          </div>
          <p className="font-display text-[32px] font-bold text-on-surface leading-none mb-2">
            {totalCount.toLocaleString()}
          </p>
          <p className="text-sm font-body text-neutral">
            Value:{" "}
            <span className="font-semibold text-on-surface">
              {formatCurrency(totalValue)}
            </span>
          </p>
        </div>

        {/* Paid Orders */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-6 right-6 bg-secondary/10 text-secondary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
            Paid
          </div>
          <div className="w-10 h-10 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4">
            <FiCheckCircle className="w-5 h-5" />
          </div>
          <p className="font-display text-[32px] font-bold text-on-surface leading-none mb-2">
            {completedCount.toLocaleString()}
          </p>
          <p className="text-sm font-body text-neutral">
            Value:{" "}
            <span className="font-semibold text-on-surface">
              {formatCurrency(completedValue)}
            </span>
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-6 right-6 bg-tertiary/10 text-tertiary px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
            Pending
          </div>
          <div className="w-10 h-10 rounded-lg bg-tertiary/10 flex items-center justify-center text-tertiary mb-4">
            <FiAlertCircle className="w-5 h-5" />
          </div>
          <p className="font-display text-[32px] font-bold text-on-surface leading-none mb-2">
            {pendingCount.toLocaleString()}
          </p>
          <p className="text-sm font-body text-neutral">
            Value:{" "}
            <span className="font-semibold text-on-surface">
              {formatCurrency(pendingValue)}
            </span>
          </p>
        </div>

        {/* Cancelled Orders */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-6 relative overflow-hidden">
          <div className="absolute top-6 right-6 bg-error/10 text-error px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest">
            Cancelled
          </div>
          <div className="w-10 h-10 rounded-lg bg-error/10 flex items-center justify-center text-error mb-4">
            <FiXCircle className="w-5 h-5" />
          </div>
          <p className="font-display text-[32px] font-bold text-on-surface leading-none mb-2">
            {cancelledCount.toLocaleString()}
          </p>
          <p className="text-sm font-body text-neutral">
            Value:{" "}
            <span className="font-semibold text-on-surface">
              {formatCurrency(cancelledValue)}
            </span>
          </p>
        </div>
      </div>

      {/* ── DATA GRID WRAPPER ── */}
      <div className="bg-surface-container-lowest border border-border rounded-xl flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-b border-border bg-surface-container-lowest rounded-t-xl">
          <div className="flex items-center gap-6 overflow-x-auto w-full sm:w-auto">
            {["All Orders", "Paid", "Pending", "Cancelled"].map((tab) => {
              const isSelected = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-sm font-bold border-none bg-transparent cursor-pointer transition-colors pb-1 whitespace-nowrap ${
                    isSelected
                      ? "text-primary border-b-2 border-primary"
                      : "text-neutral hover:text-on-surface"
                  }`}
                  style={
                    isSelected
                      ? { borderBottom: "2px solid var(--color-primary)" }
                      : {}
                  }
                >
                  {tab}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-72">
              <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search customer, ID, or assignee..."
                className="w-full pl-10 pr-4 py-2 bg-surface-container border border-border rounded-lg text-sm font-body text-on-surface placeholder:text-neutral/60 outline-none focus:border-primary focus:border-2 focus:ring-0 transition-all duration-200"
              />
            </div>

            {/* Filter Dropdown (Hidden for Technicians) */}
            {isAdmin && (
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`p-2 border rounded-lg transition-colors cursor-pointer flex-shrink-0 relative ${
                    isFilterOpen || selectedAssignee !== "All"
                      ? "bg-primary/10 border-primary/50 text-primary"
                      : "bg-surface-container border-border text-neutral hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <FiSliders className="w-4 h-4" />
                  {selectedAssignee !== "All" && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-surface-container-lowest"></span>
                  )}
                </button>

                {isFilterOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest border border-border rounded-xl z-50 flex flex-col py-2 shadow-xl animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 text-[10px] font-bold text-neutral uppercase tracking-widest border-b border-border mb-1">
                      Filter by Assignee
                    </div>

                    <button
                      onClick={() => {
                        setSelectedAssignee("All");
                        setIsFilterOpen(false);
                      }}
                      className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-input-bg border-none bg-transparent cursor-pointer w-full text-left"
                    >
                      All Orders
                      {selectedAssignee === "All" && (
                        <FiCheck className="w-4 h-4 text-primary" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setSelectedAssignee("Admin");
                        setIsFilterOpen(false);
                      }}
                      className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-input-bg border-none bg-transparent cursor-pointer w-full text-left"
                    >
                      Admin Handled
                      {selectedAssignee === "Admin" && (
                        <FiCheck className="w-4 h-4 text-primary" />
                      )}
                    </button>

                    {technicians?.length > 0 && (
                      <>
                        <div className="px-4 py-2 mt-1 text-[10px] font-bold text-neutral uppercase tracking-widest border-t border-border">
                          Technicians
                        </div>
                        <div className="max-h-48 overflow-y-auto">
                          {technicians.map((tech) => {
                            return (
                              <button
                                key={tech.id}
                                onClick={() => {
                                  setSelectedAssignee(tech.id);
                                  setIsFilterOpen(false);
                                }}
                                className="flex items-center justify-between px-4 py-2.5 text-sm font-semibold text-on-surface hover:bg-input-bg border-none bg-transparent cursor-pointer w-full text-left truncate"
                              >
                                <span className="truncate pr-2">
                                  {tech.name || "Unknown Technician"}
                                </span>
                                {selectedAssignee === tech.id && (
                                  <FiCheck className="w-4 h-4 text-primary flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-border bg-surface-container-lowest">
                <th className="px-6 py-4 text-[11px] font-bold text-neutral uppercase tracking-widest whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral uppercase tracking-widest whitespace-nowrap">
                  Order ID / Customer
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral uppercase tracking-widest whitespace-nowrap">
                  Date / Assignee
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral uppercase tracking-widest whitespace-nowrap">
                  Items
                </th>
                <th className="px-6 py-4 text-[11px] font-bold text-neutral uppercase tracking-widest whitespace-nowrap">
                  Total Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-body text-sm text-on-surface bg-surface-container-lowest">
              {filteredOrders?.length === 0 ? (
                <tr>
                  <td
                    colSpan="5"
                    className="px-6 py-12 text-center text-neutral font-bold uppercase tracking-wider opacity-60"
                  >
                    No records found
                  </td>
                </tr>
              ) : (
                filteredOrders?.map((order) => {
                  const statusStr = order.status?.toLowerCase() || "unknown";
                  const isCompleted =
                    statusStr === "completed" || statusStr === "paid";
                  const isPending = statusStr === "pending";
                  const isCancelled = statusStr === "cancelled";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-input-bg/40 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 rounded text-xs font-bold capitalize tracking-wide ${
                            isCompleted
                              ? "bg-secondary/20 text-secondary"
                              : isPending
                                ? "bg-tertiary/20 text-tertiary"
                                : isCancelled
                                  ? "bg-error/10 text-error"
                                  : "bg-surface-container-high text-neutral"
                          }`}
                        >
                          {order.status || "Unknown"}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            onClick={() => navigate(`/orders/${order.id}`)}
                            className="font-bold text-[11px] text-neutral tracking-widest hover:underline cursor-pointer transition-all"
                          >
                            {order.id || "unknown"}
                          </span>
                          <span className="text-sm text-on-surface">
                            {order.customer?.name || "Undefined Customer Name"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-[11px] text-neutral uppercase tracking-widest">
                            {order.created_at
                              ? new Date(order.created_at).toLocaleDateString(
                                  "en-US",
                                  {
                                    month: "short",
                                    day: "numeric",
                                    year: "numeric",
                                  }
                                )
                              : "N/A"}
                          </span>
                          <span className="text-sm text-on-surface">
                            {order.assignee?.name || "Unassigned"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 max-w-[300px]">
                        <div className="flex flex-wrap gap-2 items-center">
                          {order.items?.length > 0 ? (
                            <>
                              <span className="px-2 py-1 bg-primary/10 text-[10px] font-bold text-primary uppercase tracking-wider rounded whitespace-nowrap truncate max-w-[200px]">
                                {order.items[0].name || "Unnamed Item"}
                              </span>
                              {order.items.length > 1 && (
                                <span className="px-2 py-1 bg-surface-container-high text-[10px] font-bold text-neutral uppercase tracking-wider rounded whitespace-nowrap">
                                  +{order.items.length - 1} item
                                  {order.items.length - 1 > 1 ? "s" : ""}
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-neutral italic">
                              No items
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-body text-[15px] text-on-surface">
                        {formatCurrency(order.total_amount || 0)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border bg-surface-container-low px-6 py-4 flex justify-between items-center rounded-b-xl">
          <span className="text-[11px] font-bold text-neutral uppercase tracking-widest">
            Showing {filteredOrders?.length > 0 ? 1 : 0}-
            {filteredOrders?.length || 0} of {totalCount.toLocaleString()}{" "}
            records
          </span>

          <div className="flex items-center gap-4">
            <button
              disabled
              className="p-2 bg-surface-container-lowest border border-border rounded shadow-sm text-neutral opacity-50 cursor-not-allowed flex items-center justify-center"
            >
              <FiChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-bold text-on-surface">1 / 1</span>
            <button
              disabled
              className="p-2 bg-surface-container-lowest border border-border rounded shadow-sm text-neutral opacity-50 cursor-not-allowed flex items-center justify-center"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrdersPage;
