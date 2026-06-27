import React, { useState, useContext, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AdminContext } from "../../contexts/AdminContext.jsx";
import { TechnicianContext } from "../../contexts/TechnicianContext.jsx";
import { AppContext } from "../../contexts/AppContext.jsx";
import orderService from "../../services/order.service.js";
import toast from "react-hot-toast";
import {
  FiArrowLeft,
  FiUser,
  FiMail,
  FiPhone,
  FiMapPin,
  FiPackage,
  FiPlus,
  FiTrash2,
  FiSave,
  FiLoader,
  FiFileText,
  FiClipboard,
  FiSearch,
} from "react-icons/fi";

const CreateOrderPage = () => {
  const navigate = useNavigate();

  // Contexts & Auth
  const adminCtx = useContext(AdminContext);
  const techCtx = useContext(TechnicianContext);
  const { assets } = useContext(AppContext);

  const isAdmin = adminCtx?.isAdminLoggedIn;
  const token = isAdmin ? adminCtx?.adminToken : techCtx?.technicianToken;
  const currentUser = isAdmin ? adminCtx?.adminData : techCtx?.technicianData;
  const technicians = adminCtx?.technicians || [];

  // --- FORM STATE ---
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customer, setCustomer] = useState({
    name: "",
    email: "",
    phone: "",
    shipping_address: "",
  });

  const [assigneeId, setAssigneeId] = useState(currentUser?.id || "");
  const [status, setStatus] = useState("Pending");
  const [notes, setNotes] = useState("");

  const [items, setItems] = useState([
    {
      id: "",
      name: "",
      description: "",
      image_url: "",
      category: "Components",
      unit_price: 0,
      quantity: 1,
      total_price: 0,
      searchInput: "",
      isDropdownOpen: false,
    },
  ]);

  const dropdownRefs = useRef([]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      setItems((prevItems) =>
        prevItems.map((item, index) => {
          if (
            dropdownRefs.current[index] &&
            !dropdownRefs.current[index].contains(event.target)
          ) {
            return { ...item, isDropdownOpen: false };
          }
          return item;
        })
      );
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (currentUser?.id && !assigneeId) {
      setAssigneeId(currentUser.id);
    }
  }, [currentUser, assigneeId]);

  // --- HANDLERS ---
  const handleCustomerChange = (e) => {
    setCustomer({ ...customer, [e.target.name]: e.target.value });
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        id: "",
        name: "",
        description: "",
        image_url: "",
        category: "Components",
        unit_price: 0,
        quantity: 1,
        total_price: 0,
        searchInput: "",
        isDropdownOpen: false,
      },
    ]);
  };

  const handleRemoveItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
  };

  const handleSearchChange = (index, value) => {
    const newItems = [...items];
    newItems[index].searchInput = value;
    newItems[index].isDropdownOpen = true;
    setItems(newItems);
  };

  const toggleDropdown = (index, isOpen) => {
    const newItems = [...items];
    newItems[index].isDropdownOpen = isOpen;
    setItems(newItems);
  };

  const selectAsset = (index, selectedAsset) => {
    const newItems = [...items];

    newItems[index].id = selectedAsset.id;
    newItems[index].name = selectedAsset.name;
    newItems[index].category = selectedAsset.category;
    newItems[index].description = selectedAsset.description || "No description";
    newItems[index].image_url =
      selectedAsset.asset_image || "https://i.ibb.co/tMtqLqWm/container.jpg";
    newItems[index].unit_price = parseFloat(selectedAsset.unit_price) || 0;
    newItems[index].searchInput = selectedAsset.name;
    newItems[index].isDropdownOpen = false;
    newItems[index].total_price =
      newItems[index].unit_price * newItems[index].quantity;

    setItems(newItems);
  };

  const handleQuantityChange = (index, value) => {
    const newItems = [...items];
    let parsedValue = parseInt(value, 10);

    if (isNaN(parsedValue) || parsedValue < 1) {
      parsedValue = 1;
    }

    newItems[index].quantity = parsedValue;
    newItems[index].total_price =
      (newItems[index].unit_price || 0) * parsedValue;
    setItems(newItems);
  };

  const calculateTotalAmount = () => {
    return items.reduce((sum, item) => sum + (item.total_price || 0), 0);
  };

  // --- HELPER TO CAST PHONE TO INT ---
  const parsePhoneToInt = (phoneStr) => {
    if (!phoneStr) return 0;
    const digitsOnly = phoneStr.toString().replace(/\D/g, "");
    const parsed = parseInt(digitsOnly, 10);
    return isNaN(parsed) ? 0 : parsed;
  };

  // --- SUBMISSION ---
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!customer.name || !customer.email || items.length === 0) {
      toast.error(
        "Please fill in required customer details and add at least one item."
      );
      return;
    }

    for (let i = 0; i < items.length; i++) {
      if (!items[i].id) {
        toast.error(
          `Please select a valid item from the dropdown for row #${i + 1}`
        );
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let assigneeObj = {
        id: currentUser.id,
        name: currentUser.name || (isAdmin ? "Admin" : "Technician"),
        email: currentUser.email,
        phone: parsePhoneToInt(currentUser.phone),
        profile_image_url: currentUser.profile_image_url || "",
        role: isAdmin ? "Admin" : "Technician",
      };

      if (isAdmin && assigneeId !== currentUser.id) {
        const selectedTech = technicians.find((t) => t.id === assigneeId);
        if (selectedTech) {
          assigneeObj = {
            id: selectedTech.id,
            name: selectedTech.name,
            email: selectedTech.email,
            phone: parsePhoneToInt(selectedTech.phone),
            profile_image_url: selectedTech.profile_image_url || "",
            role: "Technician",
          };
        }
      }

      const cleanedItems = items.map(
        ({ searchInput, isDropdownOpen, ...rest }) => rest
      );

      const payload = {
        assignee: assigneeObj,
        customer: {
          ...customer,
          phone: parsePhoneToInt(customer.phone),
        },
        items: cleanedItems,
        notes: notes,
        total_amount: calculateTotalAmount(),
        status: status,
      };

      await orderService.createOrder(payload, token);

      if (isAdmin) {
        adminCtx.loadOrders(token);
        adminCtx.loadAllOrdersStatsSummary(token);
      } else {
        techCtx.loadTechnicianOrders(token);
        techCtx.loadTechnicianOrdersStatsSummary(token);
      }

      toast.success("Order created successfully!");
      navigate("/orders");
    } catch (err) {
      // FIX: Safely extract FastAPI 422 Array of Error Objects to prevent React crashes
      let errorMessage = "Failed to create order";

      if (err?.detail) {
        if (Array.isArray(err.detail)) {
          errorMessage = err.detail
            .map((d) => `${d.loc[d.loc.length - 1]}: ${d.msg}`)
            .join(" | ");
        } else if (typeof err.detail === "string") {
          errorMessage = err.detail;
        }
      } else if (err?.message) {
        errorMessage = err.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // returns "₹num"
  const formatCurrency = (num) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(num);
  };

  return (
    <div className="flex flex-col gap-8 max-w-[1200px] mx-auto w-full pb-10">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-4">
        <button
          onClick={() => navigate("/orders")}
          className="flex items-center gap-2 text-sm font-bold text-neutral hover:text-on-surface transition-colors w-fit border-none bg-transparent cursor-pointer"
        >
          <FiArrowLeft className="w-4 h-4" />
          Back to Orders
        </button>
        <div>
          <h1 className="font-display text-headline-md font-bold text-on-surface tracking-tight leading-none mb-1.5">
            Create New Order
          </h1>
          <p className="text-body-sm text-neutral">
            Manually log a custom build or component sale
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
      >
        {/* ── LEFT COLUMN (Customer & Items) ── */}
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
              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral uppercase tracking-widest">
                  Full Name *
                </label>
                <div className="relative">
                  <FiUser className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral pointer-events-none" />
                  <input
                    name="name"
                    value={customer.name}
                    onChange={handleCustomerChange}
                    required
                    placeholder="e.g. Marcus Thorne"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-border rounded-lg text-sm text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral uppercase tracking-widest">
                  Email Address *
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={customer.email}
                    onChange={handleCustomerChange}
                    required
                    placeholder="marcus@example.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-border rounded-lg text-sm text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral uppercase tracking-widest">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral pointer-events-none" />
                  <input
                    name="phone"
                    value={customer.phone}
                    onChange={handleCustomerChange}
                    placeholder="9876543210"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-border rounded-lg text-sm text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral uppercase tracking-widest">
                  Shipping Address
                </label>
                <div className="relative">
                  <FiMapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral pointer-events-none" />
                  <input
                    name="shipping_address"
                    value={customer.shipping_address}
                    onChange={handleCustomerChange}
                    placeholder="123 Tech Park, City"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-container border border-border rounded-lg text-sm text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS CARD */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6 sm:p-8">
            <div className="flex items-center justify-between border-b border-border pb-4 mb-6">
              <div className="flex items-center gap-3">
                <FiPackage className="w-5 h-5 text-neutral" />
                <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                  Configuration Items
                </h2>
              </div>
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider rounded-lg hover:bg-primary/20 transition-colors border-none cursor-pointer"
              >
                <FiPlus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="flex flex-col gap-6">
              {items.map((item, index) => {
                const filteredAssets = [...assets]
                  .sort((a, b) => a.name.localeCompare(b.name))
                  .filter((a) =>
                    a.name
                      .toLowerCase()
                      .includes(item.searchInput.toLowerCase())
                  );

                return (
                  <div
                    key={index}
                    className="flex flex-col gap-4 p-5 bg-surface-container-low border border-border rounded-xl relative group"
                  >
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(index)}
                        className="absolute top-4 right-4 text-neutral hover:text-error transition-colors border-none bg-transparent cursor-pointer p-1 z-10"
                        title="Remove Item"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div
                        className="flex flex-col gap-1.5 md:col-span-3 pr-6 relative"
                        ref={(el) => (dropdownRefs.current[index] = el)}
                      >
                        <label className="text-[10px] font-bold text-neutral uppercase tracking-widest">
                          Select Item *
                        </label>
                        <div className="relative">
                          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral pointer-events-none" />
                          <input
                            type="text"
                            value={item.searchInput}
                            onChange={(e) =>
                              handleSearchChange(index, e.target.value)
                            }
                            onFocus={() => toggleDropdown(index, true)}
                            placeholder="Type to search assets..."
                            className="w-full pl-10 pr-4 py-2 bg-surface-container border border-border rounded-lg text-sm text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 transition-all"
                            required
                          />
                        </div>

                        {item.isDropdownOpen && (
                          <ul className="absolute z-50 top-full left-0 right-6 mt-1 max-h-60 overflow-y-auto bg-surface-container-lowest border border-border rounded-lg shadow-lg py-1">
                            {filteredAssets.length === 0 ? (
                              <li className="px-4 py-3 text-sm text-neutral italic text-center">
                                No assets found
                              </li>
                            ) : (
                              filteredAssets.map((asset) => {
                                const isOutOfStock = asset.stock <= 0;
                                return (
                                  <li
                                    key={asset.id}
                                    onClick={() =>
                                      !isOutOfStock && selectAsset(index, asset)
                                    }
                                    className={`px-4 py-2 text-sm flex justify-between items-center transition-colors ${
                                      isOutOfStock
                                        ? "opacity-50 cursor-not-allowed bg-surface-container-low"
                                        : "hover:bg-input-bg cursor-pointer text-on-surface"
                                    }`}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-semibold truncate">
                                        {asset.name}
                                      </span>
                                      {isOutOfStock && (
                                        <span className="text-[10px] font-bold text-error uppercase tracking-wider mt-0.5">
                                          Out of Stock
                                        </span>
                                      )}
                                    </div>
                                    <span className="font-mono text-neutral">
                                      {formatCurrency(asset.unit_price)}
                                    </span>
                                  </li>
                                );
                              })
                            )}
                          </ul>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5 md:col-span-1">
                        <label className="text-[10px] font-bold text-neutral uppercase tracking-widest">
                          Quantity *
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleQuantityChange(index, e.target.value)
                          }
                          required
                          className="w-full px-3 py-2 bg-surface-container border border-border rounded-lg text-sm text-on-surface outline-none focus:border-primary transition-all font-mono"
                        />
                      </div>
                    </div>

                    {item.id && (
                      <div className="flex justify-end border-t border-border pt-3 mt-1">
                        <span className="text-xs font-bold text-neutral font-mono uppercase tracking-wider flex items-center gap-2">
                          Item Subtotal:
                          <span className="text-primary text-sm font-bold bg-primary/10 px-2 py-1 rounded">
                            {formatCurrency(item.total_price)}
                          </span>
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (Settings & Summary) ── */}
        <div className="flex flex-col gap-6">
          {/* ASSIGNMENT & STATUS */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 border-b border-border pb-4 mb-6">
              <FiClipboard className="w-5 h-5 text-neutral" />
              <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em]">
                Workflow
              </h2>
            </div>

            <div className="flex flex-col gap-5">
              {isAdmin && (
                <div className="flex flex-col gap-2">
                  <label className="text-[11px] font-bold text-neutral uppercase tracking-widest">
                    Assignee
                  </label>
                  <select
                    value={assigneeId}
                    onChange={(e) => setAssigneeId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-surface-container border border-border rounded-lg text-sm text-on-surface outline-none focus:border-primary focus:border-2 transition-all appearance-none cursor-pointer"
                  >
                    <option value={currentUser?.id}>Me (Admin)</option>
                    {technicians.map((tech) => (
                      <option key={tech.id} value={tech.id}>
                        {tech.name} (Tech)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral uppercase tracking-widest">
                  Initial Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-container border border-border rounded-lg text-sm font-bold text-on-surface outline-none focus:border-primary focus:border-2 transition-all appearance-none cursor-pointer"
                >
                  <option value="Pending">Pending</option>
                  <option value="Paid">Paid (Completed)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[11px] font-bold text-neutral uppercase tracking-widest flex items-center gap-2">
                  <FiFileText className="w-3.5 h-3.5" /> Order Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows="4"
                  placeholder="Internal instructions or customer requests..."
                  className="w-full px-4 py-3 bg-surface-container border border-border rounded-lg text-sm text-on-surface placeholder:text-neutral/50 outline-none focus:border-primary focus:border-2 transition-all resize-none"
                />
              </div>
            </div>
          </div>

          {/* FINANCIAL SUMMARY */}
          <div className="bg-surface-container-lowest border border-border rounded-xl p-6">
            <h2 className="text-sm font-bold text-on-surface uppercase tracking-[0.05em] mb-4">
              Financial Summary
            </h2>

            <div className="flex flex-col gap-3 mb-6 font-mono text-sm">
              <div className="flex justify-between text-neutral">
                <span>
                  Subtotal (
                  {items.reduce(
                    (sum, item) => sum + (parseInt(item.quantity) || 0),
                    0
                  )}{" "}
                  items)
                </span>
                <span>{formatCurrency(calculateTotalAmount())}</span>
              </div>
              <div className="flex justify-between text-neutral">
                <span>Taxes & Fees</span>
                <span>₹0.00</span>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-border mt-1">
                <span className="font-bold text-on-surface font-body tracking-wider uppercase">
                  Total Amount
                </span>
                <span className="text-xl font-bold text-primary">
                  {formatCurrency(calculateTotalAmount())}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center justify-center gap-2 w-full py-3.5 bg-primary hover:bg-primary/90 text-on-primary text-sm font-bold uppercase tracking-[0.05em] rounded-xl transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
            >
              {isSubmitting ? (
                <>
                  <FiLoader className="w-4 h-4 animate-spin" /> Processing...
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" /> Finalize Order
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderPage;
