import axios from "axios";
import { BASE_URL, API_PATHS } from "../utils/apiPaths.js";

// GET /api/v1/technicians/list — Fetch all technicians
const listTechnicians = async (adminToken) => {
  try {
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.TECHNICIANS.LIST}`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (listTechnicians)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );

    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// GET /api/v1/technicians/:technicianId — Get technician by ID
const getProfile = async (technicianId, currentUserToken) => {
  try {
    // const { technicianToken } = JSON.parse(localStorage.getItem("technician_auth_data"));
    const response = await axios.get(
      `${BASE_URL}${API_PATHS.TECHNICIANS.GET_PROFILE(technicianId)}`,
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (getProfile)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// POST /api/v1/technicians/login — Authenticate technician (OAuth2PasswordRequestForm expects form-urlencoded)
const login = async (email, password) => {
  try {
    // TODO: use JSON body instead of form data (no AI should touch this)
    const formData = new URLSearchParams();
    formData.append("username", email);
    formData.append("password", password);

    const response = await axios.post(
      `${BASE_URL}${API_PATHS.TECHNICIANS.LOGIN}`,
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

// POST /api/v1/technicians/register — Register a new technician (Admin only, FormData for file upload)
const register = async ({ name, email, phone, password, profileImage }, adminToken) => {
  try {
    // const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);
    if (profileImage) {
      formData.append("profile_image", profileImage);
    }

    const response = await axios.post(
      `${BASE_URL}${API_PATHS.TECHNICIANS.REGISTER}`,
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
      `ERROR RESPONSE (register)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/technicians/:technicianId — Update technician profile (FormData for optional file upload)
const updateProfile = async (
  technicianId,
  {
    name,
    email, // Only Admin can update techincian's email
    phone,
    profileImage,
  },
  currentUserToken
) => {
  try {
    // const token = localStorage.getItem("token");
    const formData = new FormData();
    if (name !== undefined && name !== null) formData.append("name", name);
    if (email !== undefined && email !== null) formData.append("email", email); // Only Admin can update techincian's email
    if (phone !== undefined && phone !== null) formData.append("phone", phone);
    if (profileImage) formData.append("profile_image", profileImage);

    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.TECHNICIANS.UPDATE_PROFILE(technicianId)}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${currentUserToken}`,
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

// PATCH /api/v1/technicians/:technicianId/availability — Update availability (JSON body)
const updateAvailability = async (
  technicianId,
  isAvailable,
  currentUserToken
) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.TECHNICIANS.UPDATE_AVAILABILITY(technicianId)}`,
      { is_available: isAvailable },
      { headers: { Authorization: `Bearer ${currentUserToken}` } }
    );
    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (updateAvailability)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

// PATCH /api/v1/technicians/:technicianId/password — Update password (JSON body)
const updatePassword = async (
  technicianId,
  { newPassword, currentPassword },
  technicianToken
) => {
  try {
    // const token = localStorage.getItem("token");
    const response = await axios.patch(
      `${BASE_URL}${API_PATHS.TECHNICIANS.UPDATE_PASSWORD(technicianId)}`,
      {
        new_password: newPassword,
        current_password: currentPassword || null,
      },
      { headers: { Authorization: `Bearer ${technicianToken}` } }
    );

    return response.data;
  } catch (error) {
    console.error(
      `ERROR RESPONSE (updatePassword)\nStatus Code: ${error.response?.status}\nStatus Text: ${error.response?.statusText}\nDetail: ${error.response?.data?.detail || error.response?.data?.message}`
    );
    throw error.response?.data || { message: "An unknown error occurred" };
  }
};

const technicianService = {
  listTechnicians,
  getProfile,
  login,
  register,
  updateProfile,
  updateAvailability,
  updatePassword,
};

export default technicianService;
