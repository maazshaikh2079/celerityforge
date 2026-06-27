import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import adminService from "../services/admin.service.js";

let logoutTimer;

export const useAdminAuth = () => {
  const navigate = useNavigate();

  const [isLoadingAdminAuth, setIsLoadingAdminAuth] = useState(true);
  const [adminToken, setAdminToken] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [adminData, setAdminData] = useState(null); // here: adminData = { profile_image_url: "xxx", name: "xxx", email: "xxx", phone: 000, id: "xxx", created_at: "xxx", updated_at: "xxx" }
  const [adminTokenExpirationDate, setAdminTokenExpirationDate] =
    useState(null);

  // function used by auto-login useEffect function below
  // TODO: rename this to `authenticate` or something better
  const adminLoginHandler = useCallback(
    async (adminId, adminToken, expirationDate) => {
      // console.log(adminId);

      setAdminId(adminId);
      setAdminToken(adminToken);

      const expiration =
        expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60);

      setAdminTokenExpirationDate(expiration);

      try {
        const adminData = await adminService.getProfile(adminToken);

        setAdminData(adminData); // here: adminData = { profile_image_url: "xxx", name: "xxx", email: "xxx", phone: 000, id: "xxx", created_at: "xxx", updated_at: "xxx" }

        localStorage.setItem(
          "admin_auth_data",
          JSON.stringify({
            role: "Admin",
            adminId,
            adminToken,
            expiration: expiration.toISOString(),
          })
        );
      } catch (err) {
        console.error(
          "log> Failed to fetch admin after login - Error:",
          err.response?.data?.message || err.message
        );
      } finally {
        setIsLoadingAdminAuth(false);
      }
    },
    []
  );

  // function used by auto-logout useEffect function below
  const adminLogoutHandler = useCallback(() => {
    setAdminToken(null);
    setAdminId(null);
    setAdminData(null);
    setAdminTokenExpirationDate(null);

    localStorage.removeItem("admin_auth_data");
    navigate("/");
  }, [navigate]);

  // Auto-login function/logic
  useEffect(() => {
    const storedAdminAuthData = JSON.parse(
      localStorage.getItem("admin_auth_data")
    ); // here: storedAdminAuthData = { role: "Admin", adminId: "xxx", adminToken: "xxx", expiration: "xxx" }

    if (
      storedAdminAuthData &&
      storedAdminAuthData.adminToken &&
      new Date(storedAdminAuthData.expiration) > new Date()
    ) {
      adminLoginHandler(
        storedAdminAuthData.adminId,
        storedAdminAuthData.adminToken,
        new Date(storedAdminAuthData.expiration)
      );
    } else {
      setIsLoadingAdminAuth(false);
    }
  }, [adminLoginHandler]);

  // Auto-logout function/logic
  useEffect(() => {
    if (adminToken && adminTokenExpirationDate) {
      const remainingTime =
        adminTokenExpirationDate.getTime() - new Date().getTime();
      logoutTimer = setTimeout(adminLogoutHandler, remainingTime);
    } else {
      clearTimeout(logoutTimer);
    }

    return () => clearTimeout(logoutTimer);
  }, [adminToken, adminTokenExpirationDate, adminLogoutHandler]);

  return {
    isLoadingAdminAuth,

    adminToken,
    setAdminToken,

    adminId,
    adminData,
    setAdminData,

    adminLoginHandler,
    adminLogoutHandler,
  };
};
