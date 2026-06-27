import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import App from "./App.jsx";
import "./index.css";

import AdminContextProvider from "./contexts/AdminContext.jsx";
import TechnicianContextProvider from "./contexts/TechnicianContext.jsx";
import AppContextProvider from "./contexts/AppContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AdminContextProvider>
      <TechnicianContextProvider>
        <AppContextProvider>
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
          <App />
        </AppContextProvider>
      </TechnicianContextProvider>
    </AdminContextProvider>
  </BrowserRouter>
);
