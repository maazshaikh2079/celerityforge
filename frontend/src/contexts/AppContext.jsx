import { createContext, useState, useEffect } from "react";
import assetService from "../services/asset.service.js";

export const AppContext = createContext();

const AppContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [assets, setAssets] = useState([]);
  const [inventoryStatsSummary, setInventoryStatsSummary] = useState([]);

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
    loadInventoryAssets();
  }, []);

  useEffect(() => {
    loadInventoryStatsSummary();
  }, []);

  const value = {
    backendUrl,

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
