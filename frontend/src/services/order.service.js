import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPaths.js";

// GET /api/v1/orders — List orders with optional pagination & filtering
const listOrders = async (
  { skip, limit, status, assigneeId } = {},
  currentUserToken
) => {
  try {
    const params = {};
    skip !== undefined ? (params.skip = skip) : (params.skip = 0);
    limit !== undefined ? (params.limit = limit) : (params.limit = 100);
    if (status) params.status = status;
    if (assigneeId) params.assignee_id = assigneeId; // only Admin can view orders by assigneeId, other technician cannot view each orthers orders

    const response = await axios.get(`${BASE_URL}${API_PATHS.ORDERS.LIST}`, {
      params,
      headers: { Authorization: `Bearer ${currentUserToken}` },
    });
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (listOrders)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/orders/stats/summary — Get order stats summary
const getStatsSummary = async (currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ORDERS.GET_STATS_SUMMARY}`,
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getStatsSummary)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/orders/revenue/monthly — Get monthly revenue (optional year param)
const getMonthlyRevenue = async (year) => {
  try {
    const params = {};
    if (year !== undefined) params.year = year;

    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ORDERS.GET_MONTHLY_REVENUE}`,
      { params }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getMonthlyRevenue)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/orders/:orderId — Get a single order by ID
const getOrderById = async (orderId, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ORDERS.GET_BY_ID(orderId)}`,
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getOrderById)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// POST /api/v1/orders — Create a new order (JSON body)
const createOrder = async (orderData, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.post(
      `${BASE_URL}${API_PATHS.ORDERS.CREATE}`,
      orderData,
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (createOrder)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/orders/:orderId — Update order (items, customer, notes, total_amount)
const updateOrder = async (orderId, orderData, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ORDERS.UPDATE(orderId)}`,
      orderData,
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (updateOrder)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/orders/:orderId/metadata — Update order metadata (customer & notes only)
const updateOrderMetadata = async (orderId, metadataData, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ORDERS.UPDATE_METADATA(orderId)}`,
      metadataData,
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (updateOrderMetadata)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/orders/:orderId/cancel — Cancel an order & rollback inventory
const cancelOrder = async (orderId, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ORDERS.CANCEL(orderId)}`,
      { status: "Cancelled" },
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (cancelOrder)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/orders/:orderId/paid — Mark order as paid
const markAsPaid = async (orderId, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ORDERS.MARK_AS_PAID(orderId)}`,
      { status: "Paid" },
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (markAsPaid)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// POST /api/v1/orders/:orderId/razorpay/create — Create Razorpay order
const createRazorpayOrder = async (orderId, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.post(
      `${BASE_URL}${API_PATHS.ORDERS.RAZORPAY_CREATE(orderId)}`,
      {},
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (createRazorpayOrder)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// POST /api/v1/orders/:orderId/razorpay/verify — Verify Razorpay payment
const verifyRazorpayPayment = async (
  orderId,
  { razorpayOrderId, razorpayPaymentId, razorpaySignature },
  currentUserToken
) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.post(
      `${BASE_URL}${API_PATHS.ORDERS.RAZORPAY_VERIFY(orderId)}`,
      {
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature,
      },
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (verifyRazorpayPayment)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const orderService = {
  listOrders,
  createOrder,
  getStatsSummary,
  getMonthlyRevenue,
  getOrderById,
  updateOrder,
  updateOrderMetadata,
  cancelOrder,
  markAsPaid,
  createRazorpayOrder,
  verifyRazorpayPayment,
};

export default orderService;
