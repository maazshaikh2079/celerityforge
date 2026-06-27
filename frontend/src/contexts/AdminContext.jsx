import { createContext, useState, useEffect } from "react";
import { useAdminAuth } from "../hooks/admin-auth-hook.js";
import technicianService from "../services/technician.service.js";
import orderService from "../services/order.service.js";

export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const {
    isLoadingAdminAuth,

    adminToken,
    setAdminToken,

    adminId,
    adminData, // <- because of this we dont need adminService.getProfile() here
    setAdminData,

    adminLoginHandler,
    adminLogoutHandler,
  } = useAdminAuth();

  const [orders, setOrders] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [ordersStatsSummary, setOrdersStatsSummary] = useState([]);
  const [technicians, setTechnicians] = useState([]);

  // loads recent 100 orders by default
  const loadOrders = async (
    adminToken,
    { skip = 0, limit = 100, status = null, assigneeId = null } = {}
  ) => {
    try {
      const orders = await orderService.listOrders(
        { skip, limit, status, assigneeId },
        adminToken
      );
      setOrders(orders);
    } catch (err) {
      console.error(
        "log> Failed to fetch all orders list after admin login - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  // loads recent 5 orders by default
  const loadRecentOrders = async (adminToken, { limit = 5 } = {}) => {
    try {
      const recentOrders = await orderService.listOrders({ limit }, adminToken);
      setRecentOrders(recentOrders);
    } catch (err) {
      console.error(
        "log> Failed to fetch recent orders list after admin login - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  const loadAllOrdersStatsSummary = async (adminToken) => {
    try {
      const ordersStatsSummary = await orderService.getStatsSummary(adminToken);
      // console.log(ordersStatsSummary);

      setOrdersStatsSummary(ordersStatsSummary);
    } catch (err) {
      console.error(
        "log> Failed to fetch orders stats summary data after admin login - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  const loadTechnicians = async (adminToken) => {
    try {
      const technicians = await technicianService.listTechnicians(adminToken);
      setTechnicians(technicians);
    } catch (err) {
      console.error(
        "log> Failed to fetch all technicians list after admin login - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  useEffect(() => {
    adminToken && loadTechnicians(adminToken);
  }, [adminToken]);

  useEffect(() => {
    adminToken && loadOrders(adminToken);
  }, [adminToken]);

  useEffect(() => {
    adminToken && loadRecentOrders(adminToken);
  }, [adminToken]);

  useEffect(() => {
    adminToken && loadAllOrdersStatsSummary(adminToken);
  }, [adminToken]);

  const value = {
    isAdminLoggedIn: !!adminToken,

    isLoadingAdminAuth,

    adminToken,
    setAdminToken,

    adminId,
    adminData,
    setAdminData,

    adminLoginHandler,
    adminLogoutHandler,

    technicians,
    setTechnicians,
    loadTechnicians,

    orders,
    setOrders,
    loadOrders,

    recentOrders,
    setRecentOrders,
    loadRecentOrders,

    ordersStatsSummary,
    setOrdersStatsSummary,
    loadAllOrdersStatsSummary,
  };

  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
