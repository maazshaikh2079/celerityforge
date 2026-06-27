export const BASE_URL = import.meta.env.VITE_BACKEND_URL;

export const API_PATHS = {
  ADMIN: {
    GET_DETAILS: "/api/v1/admin/details",
    GET_PROFILE: "/api/v1/admin/me",
    SIGNUP: "/api/v1/admin/signup",
    LOGIN: "/api/v1/admin/login",
    UPDATE_PROFILE: "/api/v1/admin/me",
    UPDATE_PASSWORD: "/api/v1/admin/me/password",
  },

  TECHNICIANS: {
    LIST: "/api/v1/technicians/list",
    REGISTER: "/api/v1/technicians/register",
    LOGIN: "/api/v1/technicians/login",
    GET_PROFILE: (technicianId) => `/api/v1/technicians/${technicianId}`,
    UPDATE_PROFILE: (technicianId) => `/api/v1/technicians/${technicianId}`,
    UPDATE_AVAILABILITY: (technicianId) =>
      `/api/v1/technicians/${technicianId}/availability`,
    UPDATE_PASSWORD: (technicianId) =>
      `/api/v1/technicians/${technicianId}/password`,
  },

  ASSETS: {
    GET_ALL: "/api/v1/assets",
    CREATE: "/api/v1/assets",
    GET_SUMMARY_STATS: "/api/v1/assets/stats/summary",
    GET_TOP_PRODUCTS: "/api/v1/assets/top",
    GET_SALES_BY_CATEGORY: "/api/v1/assets/sales/categories",
    GET_BY_ID: (assetId) => `/api/v1/assets/${assetId}`,
    UPDATE: (assetId) => `/api/v1/assets/${assetId}`,
    MARK_OUT_OF_STOCK: (assetId) =>
      `/api/v1/assets/${assetId}/mark-out-of-stock`,
    DELETE: (assetId) => `/api/v1/assets/${assetId}`,
  },

  ORDERS: {
    LIST: "/api/v1/orders",
    CREATE: "/api/v1/orders",
    GET_STATS_SUMMARY: "/api/v1/orders/stats/summary",
    GET_MONTHLY_REVENUE: "/api/v1/orders/revenue/monthly",
    GET_BY_ID: (orderId) => `/api/v1/orders/${orderId}`,
    UPDATE: (orderId) => `/api/v1/orders/${orderId}`,
    UPDATE_METADATA: (orderId) => `/api/v1/orders/${orderId}/metadata`,
    CANCEL: (orderId) => `/api/v1/orders/${orderId}/cancel`,
    MARK_AS_PAID: (orderId) => `/api/v1/orders/${orderId}/paid`,
    RAZORPAY_CREATE: (orderId) => `/api/v1/orders/${orderId}/razorpay/create`,
    RAZORPAY_VERIFY: (orderId) => `/api/v1/orders/${orderId}/razorpay/verify`,
  },
};
