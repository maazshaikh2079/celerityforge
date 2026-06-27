import { useState, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import technicianService from "../services/technician.service.js";

let logoutTimer;

export const useTechnicianAuth = () => {
  const navigate = useNavigate();

  const [isLoadingTechnicianAuth, setIsLoadingTechnicianAuth] = useState(true);
  const [technicianToken, setTechnicianToken] = useState(null);
  const [technicianId, setTechnicianId] = useState(null);
  const [technicianData, setTechnicianData] = useState(null); // here: technicianData = { profile_image_url: "xxx", name: "xxx", email: "xxx", phone: 000, id: "xxx", created_at: "xxx", updated_at: "xxx" }
  const [technicianTokenExpirationDate, setTechnicianTokenExpirationDate] =
    useState(null);

  // function used by auto-login useEffect function below
  // TODO: rename this to `authenticate` or something better
  const technicianLoginHandler = useCallback(
    async (technicianId, technicianToken, expirationDate) => {
      setTechnicianId(technicianId);
      setTechnicianToken(technicianToken);

      const expiration =
        expirationDate || new Date(new Date().getTime() + 1000 * 60 * 60);

      setTechnicianTokenExpirationDate(expiration);

      try {
        const technicianData = await technicianService.getProfile(
          technicianId,
          technicianToken
        );

        setTechnicianData(technicianData); // here: technicianData = { profile_image_url: "xxx", name: "xxx", email: "xxx", phone: 000, id: "xxx", created_at: "xxx", updated_at: "xxx" }

        localStorage.setItem(
          "technician_auth_data",
          JSON.stringify({
            role: "Technician",
            technicianId,
            technicianToken,
            expiration: expiration.toISOString(),
          })
        );
      } catch (err) {
        console.error(
          "log> Failed to fetch technician after login - Error:",
          err.response?.data?.message || err.message
        );
      } finally {
        setIsLoadingTechnicianAuth(false);
      }
    },
    []
  );

  // function used by auto-logout useEffect function below
  const technicianLogoutHandler = useCallback(() => {
    setTechnicianToken(null);
    setTechnicianId(null);
    setTechnicianData(null);
    setTechnicianTokenExpirationDate(null);

    localStorage.removeItem("technician_auth_data");
    navigate("/");
  }, [navigate]);

  // Auto-login function/logic
  useEffect(() => {
    const storedTechnicianAuthData = JSON.parse(
      localStorage.getItem("technician_auth_data")
    ); // here: storedTechnicianAuthData = { role: "Technician", expiration: "xxx", technicianToken: "xxx", technicianId: "xxx" }

    if (
      storedTechnicianAuthData &&
      storedTechnicianAuthData.technicianToken &&
      new Date(storedTechnicianAuthData.expiration) > new Date()
    ) {
      technicianLoginHandler(
        storedTechnicianAuthData.technicianId,
        storedTechnicianAuthData.technicianToken,
        new Date(storedTechnicianAuthData.expiration)
      );
    } else {
      setIsLoadingTechnicianAuth(false);
    }
  }, [technicianLoginHandler]);

  // Auto-logout function/logic
  useEffect(() => {
    if (technicianToken && technicianTokenExpirationDate) {
      const remainingTime =
        technicianTokenExpirationDate.getTime() - new Date().getTime();
      logoutTimer = setTimeout(technicianLogoutHandler, remainingTime);
    } else {
      clearTimeout(logoutTimer);
    }

    return () => clearTimeout(logoutTimer);
  }, [technicianToken, technicianTokenExpirationDate, technicianLogoutHandler]);

  return {
    isLoadingTechnicianAuth,

    technicianToken,
    setTechnicianToken,

    technicianId,
    technicianData,
    setTechnicianData,

    technicianLoginHandler,
    technicianLogoutHandler,
  };
};
