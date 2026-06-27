import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  FiPackage,
  FiShoppingCart,
  FiClock,
  FiCheckCircle,
  FiTrendingUp,
  FiPieChart,
  FiList,
  FiAward,
} from "react-icons/fi";

import { AdminContext } from "../../contexts/AdminContext.jsx";
import { TechnicianContext } from "../../contexts/TechnicianContext.jsx";
import { AppContext } from "../../contexts/AppContext.jsx";

const DashboardPage = () => {
  const navigate = useNavigate();

  const adminCtx = useContext(AdminContext);
  const techCtx = useContext(TechnicianContext);
  const appCtx = useContext(AppContext);

  const isAdmin = adminCtx?.isAdminLoggedIn;

  const orderStats = isAdmin
    ? adminCtx?.ordersStatsSummary
    : techCtx?.technicianOrdersStatsSummary;

  const recentOrders = isAdmin
    ? adminCtx?.recentOrders
    : techCtx?.technicianRecentOrders;

  const {
    inventoryStatsSummary,
    monthlyRevenue,
    salesByCategory,
    topProducts,
  } = appCtx || {};

  // --- HELPERS ---
  // returns "₹num"
  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(num || 0);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Pie Chart Colors
  const COLORS = [
    "#0066FF",
    "#3B82F6",
    "#60A5FA",
    "#93C5FD",
    "#BFDBFE",
    "#DBEAFE",
  ];

  // --- CUSTOM TOOLTIPS ---
  const CustomBarTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-lowest border border-border p-3 rounded-lg shadow-sm">
          <p className="text-[11px] font-bold text-neutral uppercase tracking-widest mb-1">
            {label}
          </p>
          <p className="text-sm font-bold text-primary">
            Revenue: {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-surface-container-lowest border border-border p-3 rounded-lg shadow-sm">
          <p className="text-[11px] font-bold text-neutral uppercase tracking-widest mb-1">
            {payload[0].name}
          </p>
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-bold text-on-surface">
              {formatCurrency(payload[0].value)}
            </span>
            <span className="text-xs text-neutral font-medium">
              {payload[0].payload.percentage}% of total
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full pb-10">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-1.5">
        <h1 className="font-display text-[26px] font-bold text-on-surface tracking-tight leading-none">
          {isAdmin ? "Admin Dashboard" : "Technician Dashboard"}
        </h1>
        <p className="text-sm text-neutral">
          Welcome back. Here is your overview for today.
        </p>
      </div>

      {/* ── SUMMARY STATS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Assets (Inventory) */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-surface-container-high text-on-surface rounded-xl">
              <FiPackage className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md">
              Total Assets
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-3xl font-bold text-on-surface leading-none tracking-tight">
              {inventoryStatsSummary?.total_assets || 0}
            </span>
            <span className="text-[15px] text-neutral font-semibold mt-1.5">
              Value: {formatCurrency(inventoryStatsSummary?.total_valuation)}
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            {/* <div className="p-3 bg-surface-container-high text-on-surface rounded-xl"> */}
            <div className="p-3 bg-primary/10 text-on-surface rounded-xl">
              <FiShoppingCart className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1.5 bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider rounded-md">
              {isAdmin ? "Total Orders" : "My Orders"}
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-3xl font-bold text-on-surface leading-none tracking-tight">
              {orderStats?.total_orders?.count || 0}
            </span>
            <span className="text-[15px] text-neutral font-semibold mt-1.5">
              Value: {formatCurrency(orderStats?.total_orders?.total_value)}
            </span>
          </div>
        </div>

        {/* Paid Orders */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-secondary/15 text-secondary rounded-xl">
              <FiCheckCircle className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1.5 bg-secondary/15 text-secondary text-[10px] font-bold uppercase tracking-wider rounded-md">
              Paid
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-3xl font-bold text-on-surface leading-none tracking-tight">
              {orderStats?.paid_orders?.count || 0}
            </span>
            <span className="text-[15px] text-neutral font-semibold mt-1.5">
              Value: {formatCurrency(orderStats?.paid_orders?.total_value)}
            </span>
          </div>
        </div>

        {/* Pending Orders */}
        <div className="bg-surface-container-lowest border border-border rounded-xl p-5 flex flex-col gap-4 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-tertiary/15 text-tertiary rounded-xl">
              <FiClock className="w-5 h-5" />
            </div>
            <span className="px-2.5 py-1.5 bg-tertiary/15 text-tertiary text-[10px] font-bold uppercase tracking-wider rounded-md">
              Pending
            </span>
          </div>
          <div className="flex flex-col gap-0.5 mt-1">
            <span className="text-3xl font-bold text-on-surface leading-none tracking-tight">
              {orderStats?.pending_orders?.count || 0}
            </span>
            <span className="text-[15px] text-neutral font-semibold mt-1.5">
              Value: {formatCurrency(orderStats?.pending_orders?.total_value)}
            </span>
          </div>
        </div>
      </div>

      {/* ── CHARTS SECTION (ADMIN ONLY) ── */}
      {isAdmin && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Monthly Revenue Bar Chart */}
          <div className="lg:col-span-2 bg-surface-container-lowest border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <FiTrendingUp className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Monthly Revenue Overview
              </h2>
            </div>
            <div className="h-[320px] w-full">
              {monthlyRevenue?.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={monthlyRevenue}
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      stroke="#333333"
                      opacity={0.2}
                    />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#888888", fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <YAxis
                      hide={true} // Hide Y axis for cleaner look, tooltip handles values
                    />
                    <Tooltip
                      cursor={{ fill: "transparent" }}
                      content={<CustomBarTooltip />}
                    />
                    <Bar
                      dataKey="revenue"
                      fill="#0066FF"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-sm text-neutral italic">
                  No revenue data available for current year.
                </div>
              )}
            </div>
          </div>

          {/* Sales by Category Pie Chart */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 flex flex-col">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <FiPieChart className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Sales by Category
              </h2>
            </div>

            {salesByCategory?.length > 0 ? (
              <div className="flex flex-col gap-6 w-full">
                <div className="h-[180px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={salesByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        dataKey="revenue"
                        nameKey="category"
                        stroke="none"
                      >
                        {salesByCategory.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomPieTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Custom List Legend Below Chart */}
                <div className="flex flex-col gap-3 max-h-[140px] overflow-y-auto pr-2 custom-scrollbar">
                  {salesByCategory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{
                            backgroundColor: COLORS[index % COLORS.length],
                          }}
                        ></span>
                        <span className="font-semibold text-on-surface truncate">
                          {entry.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="font-bold text-on-surface">
                          {entry.percentage}%
                        </span>
                        <span className="text-neutral font-medium">
                          ({formatCurrency(entry.revenue)})
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-1 min-h-[250px] flex items-center justify-center text-sm text-neutral italic">
                No categorical sales data.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── LISTS SECTION ── */}
      <div
        className={`grid grid-cols-1 ${isAdmin ? "lg:grid-cols-3" : ""} gap-6`}
      >
        {/* Recent Orders Table */}
        <div
          className={`${isAdmin ? "lg:col-span-2" : ""} bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8 overflow-hidden`}
        >
          <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
            <div className="flex items-center gap-3">
              <FiList className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Recent Orders
              </h2>
            </div>
            <button
              onClick={() => navigate("/orders")}
              className="text-xs font-bold text-primary hover:underline border-none bg-transparent cursor-pointer"
            >
              View All
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="text-[10px] font-bold text-neutral uppercase tracking-widest border-b border-border/50">
                <tr>
                  <th className="pb-3 px-4 font-bold">Order ID</th>
                  <th className="pb-3 px-4 font-bold">Customer</th>
                  <th className="pb-3 px-4 font-bold">Date</th>
                  <th className="pb-3 px-4 font-bold">Status</th>
                  <th className="pb-3 px-4 font-bold text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders?.length > 0 ? (
                  recentOrders.map((order, i) => {
                    const statusStr = order.status?.toLowerCase() || "unknown";
                    const isCompleted =
                      statusStr === "completed" || statusStr === "paid";
                    const isPending = statusStr === "pending";
                    const isCancelled = statusStr === "cancelled";

                    return (
                      <tr
                        key={order.id}
                        onClick={() => navigate(`/orders/${order.id}`)}
                        className={`group border-b border-border/50 cursor-pointer transition-colors ${i === recentOrders.length - 1 ? "border-b-0" : ""} hover:bg-surface-container-low`}
                      >
                        <td className="py-4 px-4 font-bold text-on-surface group-hover:text-primary transition-colors">
                          #{order.id?.split("-")[0]}
                        </td>
                        <td className="py-4 px-4 text-on-surface font-medium">
                          {order.customer?.name || "Unknown"}
                        </td>
                        <td className="py-4 px-4 text-neutral text-xs font-medium">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                              isCompleted
                                ? "bg-secondary/15 text-secondary"
                                : isPending
                                  ? "bg-tertiary/15 text-tertiary"
                                  : isCancelled
                                    ? "bg-error/10 text-error"
                                    : "bg-surface-container-high text-neutral"
                            }`}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 font-bold text-on-surface text-right">
                          {formatCurrency(order.total_amount)}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="5"
                      className="py-8 text-center text-sm text-neutral italic"
                    >
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Products List (ADMIN ONLY) */}
        {isAdmin && (
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <FiAward className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Top Products
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {topProducts?.length > 0 ? (
                topProducts.map((product, index) => (
                  <div
                    key={product.id}
                    onClick={() => navigate(`/inventory/assets/${product.id}`)}
                    className="flex items-center gap-4 p-3 bg-surface-container-low border border-border rounded-xl hover:border-primary/50 cursor-pointer transition-colors"
                  >
                    <div className="flex-shrink-0 w-8 h-8 rounded flex items-center justify-center font-bold text-xs bg-surface-container-high text-neutral border border-border">
                      #{index + 1}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="text-sm font-bold text-on-surface truncate">
                        {product.name}
                      </span>
                      <span className="text-[10px] text-neutral font-bold uppercase tracking-widest truncate">
                        {product.category}
                      </span>
                    </div>
                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className="text-sm font-bold text-primary">
                        {formatCurrency(product.total_revenue)}
                      </span>
                      <span className="text-[10px] text-neutral font-medium">
                        {product.units_sold} sold
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-neutral italic text-center py-4">
                  No product data available.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
