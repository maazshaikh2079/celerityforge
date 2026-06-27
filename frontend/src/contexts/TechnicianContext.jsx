import { createContext, useState, useEffect } from "react";
import { useTechnicianAuth } from "../hooks/technician-auth-hook.js";
import orderService from "../services/order.service.js";

export const TechnicianContext = createContext();

const TechnicianContextProvider = (props) => {
  const {
    isLoadingTechnicianAuth,

    technicianToken,
    setTechnicianToken,

    technicianId,
    technicianData,
    setTechnicianData,

    technicianLoginHandler,
    technicianLogoutHandler,
  } = useTechnicianAuth();

  const [technicianOrders, setTechnicianOrders] = useState([]);
  const [technicianRecentOrders, setTechnicianRecentOrders] = useState([]);
  const [technicianOrdersStatsSummary, setTechnicianOrdersStatsSummary] =
    useState([]);

  // loads recent 100 orders of current technician by default
  const loadTechnicianOrders = async (
    technicianToken,
    { skip = 0, limit = 100, status = null } = {}
  ) => {
    try {
      const technicianOrders = await orderService.listOrders(
        { skip, limit, status },
        technicianToken
      );
      setTechnicianOrders(technicianOrders);
    } catch (err) {
      console.error(
        "log> Failed to fetch technician orders - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  // loads recent 5 orders of current technician by default
  const loadTechnicianRecentOrders = async (
    technicianToken,
    { limit = 5 } = {}
  ) => {
    try {
      const technicianRecentOrders = await orderService.listOrders(
        { limit },
        technicianToken
      );
      setTechnicianRecentOrders(technicianRecentOrders);
    } catch (err) {
      console.error(
        "log> Failed to fetch technician orders - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  const loadTechnicianOrdersStatsSummary = async (technicianToken) => {
    try {
      const technicianOrdersStatsSummary =
        await orderService.getStatsSummary(technicianToken);
      setTechnicianOrdersStatsSummary(technicianOrdersStatsSummary);
    } catch (err) {
      console.error(
        "log> Failed to fetch technician orders stats summary - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  useEffect(() => {
    technicianToken && loadTechnicianOrders(technicianToken);
  }, [technicianToken]);

  useEffect(() => {
    technicianToken && loadTechnicianRecentOrders(technicianToken);
  }, [technicianToken]);

  useEffect(() => {
    technicianToken && loadTechnicianOrdersStatsSummary(technicianToken);
  }, [technicianToken]);

  const value = {
    isTechnicianLoggedIn: !!technicianToken,

    isLoadingTechnicianAuth,

    technicianToken,
    setTechnicianToken,

    technicianId,
    technicianData,
    setTechnicianData,

    technicianLoginHandler,
    technicianLogoutHandler,

    technicianOrders,
    setTechnicianOrders,
    loadTechnicianOrders,

    technicianRecentOrders,
    setTechnicianRecentOrders,
    loadTechnicianRecentOrders,

    technicianOrdersStatsSummary,
    setTechnicianOrdersStatsSummary,
    loadTechnicianOrdersStatsSummary,
  };

  return (
    <TechnicianContext.Provider value={value}>
      {props.children}
    </TechnicianContext.Provider>
  );
};

export default TechnicianContextProvider;
