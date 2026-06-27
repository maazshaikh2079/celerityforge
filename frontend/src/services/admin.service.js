import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPaths.js";

// GET /api/v1/admin/details — Fetch admin details (public)
const getAdminDetails = async () => {
  try {
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ADMIN.GET_DETAILS}`
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getAdminDetails)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    // TODO: try using next(error.response?.data) rather than throwing (no AI should touch this)
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/admin/me — Get logged-in admin's profile
const getProfile = async (adminToken) => {
  try {
    // const { adminToken } = JSON.parse(localStorage.getItem("admin_auth_data"));
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.ADMIN.GET_PROFILE}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getProfile)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// POST /api/v1/admin/login — Authenticate admin (OAuth2PasswordRequestForm expects form-urlencoded)
const login = async (email, password) => {
  try {
    // TODO: use JSON body instead of form data (no AI should touch this)
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await axios.post(
      `${BASE_URL}${API_PATHS.ADMIN.LOGIN}`,
      formData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (login)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// POST /api/v1/admin/signup — Register admin (Singleton, FormData for file upload)
const signup = async ({ name, email, phone, password, profileImage }) => {
  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);
    if (profileImage) {
      formData.append("profile_image", profileImage);
    }

    const response = await axios.post(
      `${BASE_URL}${API_PATHS.ADMIN.SIGNUP}`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (signup)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/admin/me — Update admin profile (FormData for optional file upload)
const updateProfile = async ({ name, phone, profileImage }, adminToken) => {
  try {
    // const token = localStorage.getItem("token");
    const formData = new FormData();
    if (name !== undefined && name !== null) formData.append("name", name);
    if (phone !== undefined && phone !== null) formData.append("phone", phone);
    if (profileImage) formData.append("profile_image", profileImage);

    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ADMIN.UPDATE_PROFILE}`,
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
      `ERROR RESPONSE (updateProfile)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/admin/me/password — Update admin password (JSON body)
const updatePassword = async ({ currentPassword, newPassword }, adminToken) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.ADMIN.UPDATE_PASSWORD}`,
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (updatePassword)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const adminService = {
  getAdminDetails,
  login,
  signup,
  getProfile,
  updateProfile,
  updatePassword,
};

export default adminService;
