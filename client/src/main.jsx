import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import App from "./App";
import "./index.css";
import { OrdersProvider } from "./context/OrdersContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <BrowserRouter>
        <OrdersProvider>
          <App />
        </OrdersProvider>
      </BrowserRouter>
    </LocalizationProvider>
  </React.StrictMode>
);