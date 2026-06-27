import React, { useContext, useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import { TechnicianContext } from "../../contexts/TechnicianContext.jsx";
import orderService from "../../services/order.service.js";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiPrinter,
  FiEdit2,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiPackage,
  FiCreditCard,
  FiCheckCircle,
  FiXCircle,
  FiClipboard,
  FiLoader,
  FiFileText,
} from "react-icons/fi";

const ViewOrderPage = () => {
  // Correctly matches the :orderId from your router path
  const { orderId } = useParams();
  const navigate = useNavigate();

  // Contexts & Auth
  const adminCtx = useContext(AdminContext);
  const techCtx = useContext(TechnicianContext);
  const isAdmin = adminCtx?.isAdminLoggedIn;

  const currentUserToken = isAdmin
    ? adminCtx?.adminToken
    : techCtx?.technicianToken;

  const currentUserId = isAdmin ? adminCtx?.adminId : techCtx?.technicianId;

  // Local State
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- FETCH ORDER DATA ---
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !currentUserToken) return;

      setIsLoading(true);
      try {
        const fetchedOrder = await orderService.getOrderById(
          orderId,
          currentUserToken
        );
        setOrder(fetchedOrder);
        // console.log(order);
      } catch (err) {
        console.error("Failed to fetch order details:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, currentUserToken]);

  // --- HELPERS ---
  const refreshContextData = () => {
    if (isAdmin) {
      adminCtx.loadOrders(adminCtx.adminToken);
      adminCtx.loadAllOrdersStatsSummary(adminCtx.adminToken);
    } else {
      techCtx.loadTechnicianOrders(techCtx.technicianToken);
      techCtx.loadTechnicianOrdersStatsSummary(techCtx.technicianToken);
    }
  };

  // returns "₹num"
  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(num || 0);
  };

  // --- HANDLERS ---
  const handlePrintReceipt = () => {
    toast.success("Preparing receipt for PDF download...");
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // ------ RAZORPAY PAYMENT FLOW ------
  const handleMakePayment = async () => {
    if (!window.Razorpay) {
      toast.error("Razorpay SDK failed to load. Are you online?");
      return;
    }

    setIsProcessing(true);
    try {
      // Create the Razorpay_Order via Backend
      const data = await orderService.createRazorpayOrder(
        orderId,
        currentUserToken
      );

      const rzpOrder = data.order;

      if (data.success && rzpOrder) {
        // Initialize Razorpay Checkout Modal (i.e. initRazorpay())
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: rzpOrder.amount,
          currency: rzpOrder.currency,
          name: "CelerityForge",
          description: `Payment for CelerityForge Order #${order.id}`,
          order_id: rzpOrder.id,
          handler: async (response) => {
            // This runs on successful client-side payment completion
            setIsProcessing(true); // Re-trigger loading state during verification
            try {
              const verifyRes = await orderService.verifyRazorpayPayment(
                orderId,
                {
                  razorpayOrderId: response.razorpay_order_id,
                  razorpayPaymentId: response.razorpay_payment_id,
                  razorpaySignature: response.razorpay_signature,
                },
                currentUserToken
              );

              if (verifyRes.success) {
                toast.success(verifyRes.message || "Payment Successful!");
                setOrder((prev) => ({ ...prev, status: "Paid" }));
                refreshContextData();
              } else {
                toast.error(
                  verifyRes.message || "Payment verification failed."
                );
              }
            } catch (err) {
              console.error(err);
              toast.error(
                err?.message || "An error occurred during verification."
              );
            } finally {
              setIsProcessing(false);
            }
          },
          prefill: {
            name: order.customer.name,
            email: order.customer?.email || "",
            contact: order.customer?.phone || "",
          },
          theme: {
            color: "#0066FF",
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
              toast("Payment cancelled", { icon: "ℹ️" });
            },
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", function (response) {
          toast.error(response.error.description || "Payment failed");
          setIsProcessing(false);
        });

        rzp.open();
      } else {
        setIsProcessing(false);
        toast.error(data.message || "Could not generate payment order.");
      }
    } catch (err) {
      setIsProcessing(false);
      console.error(err);
      toast.error(err?.detail || err?.message || "Failed to initiate payment");
    }
  };
  // ------------------------------

  const handleMarkAsPaid = async () => {
    const confirm = window.confirm(
      "Are you sure you want to mark this order as PAID? This action cannot be undone."
    );
    if (!confirm) return;

    setIsProcessing(true);
    try {
      await orderService.markAsPaid(orderId, currentUserToken);
      toast.success("Order successfully marked as Paid!");
      setOrder((prev) => ({ ...prev, status: "Paid" }));
      refreshContextData();
    } catch (err) {
      toast.error(err?.detail || err?.message || "Failed to mark as paid");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelOrder = async () => {
    const confirm = window.confirm(
      "Are you sure you want to CANCEL this order? Inventory will be rolled back."
    );
    if (!confirm) return;

    setIsProcessing(true);
    try {
      await orderService.cancelOrder(orderId, currentUserToken);
      toast.success("Order successfully cancelled.");
      setOrder((prev) => ({ ...prev, status: "Cancelled" }));
      refreshContextData();
    } catch (err) {
      toast.error(err?.detail || err?.message || "Failed to cancel order");
    } finally {
      setIsProcessing(false);
    }
  };

  // --- RENDER STATES ---
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FiLoader className="w-10 h-10 text-primary animate-spin" />
        <p className="text-neutral font-bold tracking-widest uppercase text-sm">
          Loading Order...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <FiPackage className="w-12 h-12 text-neutral/30" />
        <h2 className="text-xl font-bold text-on-surface">Order Not Found</h2>
        <p className="text-neutral">
          The order you are looking for does not exist or you lack permission to
          view it.
        </p>
        <button
          onClick={() => navigate("/orders")}
          className="px-4 py-2 mt-2 bg-primary/10 text-primary font-bold rounded-lg cursor-pointer hover:bg-primary/20 transition-colors border-none"
        >
          Go Back to Orders
        </button>
      </div>
    );
  }

  const statusStr = order.status?.toLowerCase() || "undefined order status";
  const isPaid = statusStr === "paid";
  const isPending = statusStr === "pending";
  const isCancelled = statusStr === "cancelled";

  // Authorization checks for UI elements
  const isAssigneeClickable =
    isAdmin && order.assignee?.id && order.assignee?.role === "Technician";
  const isAssignedTechnician = !isAdmin && currentUserId === order.assignee?.id;
  const canEditOrder = isAdmin || isAssignedTechnician;

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full pb-10">
      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-col gap-4">
          <button
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2 text-sm font-bold text-neutral hover:text-on-surface transition-colors w-fit border-none bg-transparent cursor-pointer print:hidden"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to Orders
          </button>
          <div className="flex items-center gap-4">
            <h1 className="font-display text-[22px] font-bold text-on-surface tracking-tight leading-none">
              ORDER #{order.id}
            </h1>
            <span
              className={`px-3 py-1 rounded text-xs font-bold capitalize tracking-wide ${
                isPaid
                  ? "bg-secondary/20 text-secondary"
                  : isPending
                    ? "bg-tertiary/20 text-tertiary"
                    : isCancelled
                      ? "bg-error/10 text-error"
                      : "bg-surface-container-high text-neutral"
              }`}
            >
              {order.status || "Undefined Order Status"}
            </span>
          </div>
        </div>

        {/* TOP RIGHT ACTIONS */}
        <div className="flex items-center gap-3 w-full sm:w-auto print:hidden">
          <button
            onClick={handlePrintReceipt}
            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors cursor-pointer border-none"
          >
            <FiPrinter className="w-4 h-4" />
            Print Receipt
          </button>

          {canEditOrder && (
            <button
              onClick={() => navigate(`/orders/${order.id}/update`)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl text-sm font-bold hover:bg-primary/90 transition-colors cursor-pointer border-none shadow-sm"
            >
              <FiEdit2 className="w-4 h-4" />
              Edit Order
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── LEFT COLUMN (Customer, Assignee & Items) ── */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* CUSTOMER INFO CARD */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <FiUser className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Customer Details
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-1.5">
                  <FiUser className="w-3 h-3" /> Full Name
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {order.customer.name}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-1.5">
                  <FiMail className="w-3 h-3" /> Email Address
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {order.customer?.email || "N/A"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-1.5">
                  <FiPhone className="w-3 h-3" /> Phone Number
                </span>
                <span className="text-sm font-semibold text-on-surface">
                  {order.customer?.phone || "N/A"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-neutral uppercase tracking-widest flex items-center gap-1.5">
                  <FiMapPin className="w-3 h-3" /> Shipping Address
                </span>
                <span className="text-sm font-semibold text-on-surface leading-relaxed">
                  {order.customer?.shipping_address || "N/A"}
                </span>
              </div>
            </div>
          </div>

          {/* ASSIGNEE DETAILS */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8">
            <h2 className="text-[11px] font-bold text-neutral uppercase tracking-widest mb-4">
              Workflow Assignee
            </h2>
            <div className="flex items-start gap-4">
              <img
                src={
                  order.assignee?.profile_image_url ||
                  "https://i.ibb.co/vxLH9d92/default-avatar-light.png"
                }
                alt="Assignee"
                className="w-10 h-10 rounded-full border border-border object-cover"
              />
              <div className="flex flex-col gap-1.5 w-full">
                <div className="flex flex-wrap justify-between items-center w-full gap-2">
                  <span
                    onClick={() => {
                      if (isAssigneeClickable) {
                        navigate(`/technicians/${order.assignee.id}`);
                      }
                    }}
                    className={`text-sm font-bold text-on-surface transition-all ${
                      isAssigneeClickable
                        ? "hover:underline cursor-pointer"
                        : ""
                    }`}
                  >
                    {order.assignee?.name || "Unassigned"}
                  </span>
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded uppercase tracking-wider">
                    {order.assignee?.role || "Technician"}
                  </span>
                </div>
                <div className="flex flex-col gap-1 mt-1">
                  <span className="text-xs text-neutral flex items-center gap-2">
                    <FiMail className="w-3.5 h-3.5" />{" "}
                    {order.assignee?.email || "N/A"}
                  </span>
                  <span className="text-xs text-neutral flex items-center gap-2">
                    <FiPhone className="w-3.5 h-3.5" />{" "}
                    {order.assignee?.phone || "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS CARD */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <FiPackage className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Order Items
              </h2>
            </div>

            <div className="flex flex-col gap-4">
              {order.items?.length > 0 ? (
                order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-5 bg-surface-container border border-border rounded-xl"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={
                          item.image_url ||
                          "https://i.ibb.co/tMtqLqWm/container.jpg"
                        }
                        alt={item.name}
                        className="w-12 h-12 rounded object-cover border border-border"
                      />
                      <div className="flex flex-col gap-1">
                        <span
                          onClick={() =>
                            navigate(`/inventory/assets/${item.id}`)
                          }
                          className="text-sm font-bold text-on-surface hover:underline cursor-pointer transition-all"
                        >
                          {item.name}
                        </span>
                        <span className="text-xs text-neutral">
                          {item.quantity} x {formatCurrency(item.unit_price)}
                        </span>
                      </div>
                    </div>
                    <span className="text-[15px] font-bold text-on-surface">
                      {formatCurrency(item.total_price)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-neutral italic">
                  No items found for this order.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Notes, Summary, Actions) ── */}
        <div className="flex flex-col gap-6">
          {/* ORDER NOTES */}
          {order.notes && (
            <div className="bg-surface-container-lowest border border-border rounded-xl p-6">
              <h2 className="text-[11px] font-bold text-neutral uppercase tracking-widest mb-3 flex items-center gap-2">
                <FiFileText className="w-3.5 h-3.5" /> Internal Notes
              </h2>
              <div className="text-sm text-on-surface italic bg-surface-container-low p-4 rounded-lg border border-border">
                {order.notes}
              </div>
            </div>
          )}

          {/* ORDER SUMMARY */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em] mb-4">
              Order Summary
            </h2>

            <div className="flex flex-col gap-3 text-sm">
              {order.items?.map((item, index) => (
                <div key={index} className="flex justify-between text-neutral">
                  <span className="truncate pr-4">
                    {item.name} (x{item.quantity})
                  </span>
                  <span>{formatCurrency(item.total_price)}</span>
                </div>
              ))}

              {order.items?.length > 0 && (
                <div className="border-t border-dashed border-border/60 my-1"></div>
              )}

              <div className="flex justify-between text-neutral">
                <span>
                  Subtotal (
                  {order.items?.reduce(
                    (sum, item) => sum + (parseInt(item.quantity) || 0),
                    0
                  ) || 0}{" "}
                  items)
                </span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-neutral">
                <span>Taxes & Fees</span>
                <span>₹0.00</span>
              </div>

              <div className="flex justify-between items-center pt-3 border-t border-border mt-2">
                <span className="font-bold text-on-surface font-body tracking-wider uppercase">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-on-surface">
                  {formatCurrency(order.total_amount)}
                </span>
              </div>
            </div>
          </div>

          {/* ORDER ACTIONS CARD */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 print:hidden">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <FiClipboard className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Order Actions
              </h2>
            </div>

            <div className="flex flex-col gap-3">
              {isPending && (
                <>
                  <button
                    onClick={handleMakePayment}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 border-none shadow-sm"
                  >
                    <FiCreditCard className="w-4 h-4" /> Make Payment
                  </button>

                  <button
                    onClick={handleMarkAsPaid}
                    disabled={isProcessing}
                    className="flex items-center justify-center gap-2 w-full py-3 bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 border border-border"
                  >
                    <FiCheckCircle className="w-4 h-4" /> Mark as Paid
                  </button>
                </>
              )}

              {!isCancelled && (
                <button
                  onClick={handleCancelOrder}
                  disabled={isProcessing}
                  className="flex items-center justify-center gap-2 w-full py-3 mt-2 bg-error/10 hover:bg-error/20 text-error text-sm font-bold rounded-lg transition-all duration-200 cursor-pointer disabled:opacity-50 border-none"
                >
                  <FiXCircle className="w-4 h-4" /> Cancel Order
                </button>
              )}

              {isPaid && (
                <div className="text-center py-2 px-4 bg-secondary/10 text-secondary text-xs font-bold uppercase tracking-widest rounded-lg">
                  Order is Fully Paid
                </div>
              )}
              {isCancelled && (
                <div className="text-center py-2 px-4 bg-error/10 text-error text-xs font-bold uppercase tracking-widest rounded-lg">
                  Order is Cancelled
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewOrderPage;
