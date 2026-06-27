import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPaths.js";

// GET /api/v1/assets — Fetch all assets
const getAllAssets = async () => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ASSETS.GET_ALL}`
      // { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getAllAssets)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/assets/stats/summary — Fetch inventory summary stats
const getSummaryStats = async () => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ASSETS.GET_SUMMARY_STATS}`
      // { headers: { Authorization: `Bearer ${token}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getSummaryStats)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/assets/top — Fetch top products by revenue
const getTopProducts = async (limit = 5, adminToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ASSETS.GET_TOP_PRODUCTS}`,
      {
        params: { limit },
        headers: { Authorization: `Bearer ${adminToken}` },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getTopProducts)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/assets/sales/categories — Fetch sales by category
const getSalesByCategory = async (adminToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ASSETS.GET_SALES_BY_CATEGORY}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getSalesByCategory)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/assets/:assetId — Fetch a single asset by ID
const getAssetById = async (assetId, currentUserToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ASSETS.GET_BY_ID(assetId)}`,
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getAssetById)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// POST /api/v1/assets — Create a new asset (Admin only, FormData for file upload)
const createAsset = async (
  { name, description, category, unitPrice, stock, minStock, assetImage },
  adminToken
) => {
  try {
    // const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("unit_price", unitPrice);
    formData.append("stock", stock);
    formData.append("min_stock", minStock);
    if (assetImage) {
      formData.append("asset_image", assetImage);
    }

    const response = await axios.post(
      `${BASE_URL}${API_PATHS.ASSETS.CREATE}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    // console.log(response);

    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (createAsset)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/assets/:assetId — Update an asset (Admin only, FormData for optional file upload)
const updateAsset = async (
  assetId,
  { name, description, category, unitPrice, stock, minStock, assetImage },
  adminToken
) => {
  try {
    // const token = localStorage.getItem("token");
    const formData = new FormData();
    if (name !== undefined && name !== null) formData.append("name", name);
    if (description !== undefined && description !== null)
      formData.append("description", description);
    if (category !== undefined && category !== null)
      formData.append("category", category);
    if (unitPrice !== undefined && unitPrice !== null)
      formData.append("unit_price", unitPrice);
    if (stock !== undefined && stock !== null) formData.append("stock", stock);
    if (minStock !== undefined && minStock !== null)
      formData.append("min_stock", minStock);
    if (assetImage) formData.append("asset_image", assetImage);

    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ASSETS.UPDATE(assetId)}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${adminToken}`,
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (updateAsset)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/assets/:assetId/mark-out-of-stock — Mark asset out of stock (Admin only)
const markOutOfStock = async (assetId, adminToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ASSETS.MARK_OUT_OF_STOCK(assetId)}`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (markOutOfStock)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// DELETE /api/v1/assets/:assetId — Delete an asset (Admin only)
const deleteAsset = async (assetId, adminToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.delete(
      `${BASE_URL}${API_PATHS.ASSETS.DELETE(assetId)}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (deleteAsset)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const assetService = {
  getAllAssets,
  getSummaryStats,
  getTopProducts,
  getSalesByCategory,
  getAssetById,
  createAsset,
  updateAsset,
  markOutOfStock,
  deleteAsset,
};

export default assetService;
