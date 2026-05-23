import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import App from "./App";
import "./index.css";
import AuthGate from "./components/AuthGate";
import { OrdersProvider } from "./context/OrdersContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <AuthGate>
        {(user) => (
          <HashRouter>
            <OrdersProvider user={user}>
              <App />
            </OrdersProvider>
          </HashRouter>
        )}
      </AuthGate>
    </LocalizationProvider>
  </React.StrictMode>
);
