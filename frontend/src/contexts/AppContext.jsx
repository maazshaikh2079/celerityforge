import { createContext, useState, useEffect } from "react";
import orderService from "../services/order.service.js";
import assetService from "../services/asset.service.js";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [monthlyRevenue, setMonthlyRevenue] = useState([]);
  const [salesByCategory, setSalesByCategory] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [inventoryStatsSummary, setInventoryStatsSummary] = useState([]);

  const loadMonthlyRevenue = async (year = new Date().getFullYear()) => {
    try {
      const monthlyRevenue = await orderService.getMonthlyRevenue(year);
      setMonthlyRevenue(monthlyRevenue);
    } catch (err) {
      console.error(
        "log> Failed to fetch monthly revenue data - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  const loadSalesByCategory = async () => {
    try {
      const salesByCategory = await assetService.getSalesByCategory();
      setSalesByCategory(salesByCategory);
    } catch (err) {
      console.error(
        "log> Failed to fetch sales by categories - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  const loadTopProducts = async (limit = 5) => {
    try {
      const topProducts = await assetService.getTopProducts(limit);
      setTopProducts(topProducts);
    } catch (err) {
      console.error(
        "log> Failed to fetch top products - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  const loadInventoryAssets = async () => {
    try {
      const assets = await assetService.getAllAssets();
      setAssets(assets);
    } catch (err) {
      console.error(
        "log> Failed to fetch inventory assets - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  const loadInventoryStatsSummary = async () => {
    try {
      const inventoryStatsSummary = await assetService.getSummaryStats();
      setInventoryStatsSummary(inventoryStatsSummary);
    } catch (err) {
      console.error(
        "log> Failed to fetch inventory stats summary - Error:",
        err.response?.data?.message || err.message
      );
    }
  };

  useEffect(() => {
    loadMonthlyRevenue();
  }, []);

  useEffect(() => {
    loadSalesByCategory();
  }, []);

  useEffect(() => {
    loadTopProducts();
  }, []);

  useEffect(() => {
    loadInventoryAssets();
  }, []);

  useEffect(() => {
    loadInventoryStatsSummary();
  }, []);

  const value = {
    backendUrl,

    monthlyRevenue,
    setMonthlyRevenue,
    loadMonthlyRevenue,

    salesByCategory,
    setSalesByCategory,
    loadSalesByCategory,

    topProducts,
    setTopProducts,
    loadTopProducts,

    assets,
    setAssets,
    loadInventoryAssets,

    inventoryStatsSummary,
    setInventoryStatsSummary,
    loadInventoryStatsSummary,
  };

  return (
    <AppContext.Provider value={value}>{props.children}</AppContext.Provider>
  );
};

export default AppContextProvider;
