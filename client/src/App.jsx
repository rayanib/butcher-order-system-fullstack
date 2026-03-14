import { NavLink, Route, Routes } from "react-router-dom";
import Orders from "./pages/Orders";
import NewOrder from "./pages/NewOrder";
import FutureOrders from "./pages/FutureOrders";
import LambOrders from "./pages/LambOrders";
import Prices from "./pages/Prices";
import History from "./pages/History";
import Archives from "./pages/Archives";
import { useOrders } from "./context/OrdersContext";

export default function App() {
  const { unpaidCount } = useOrders();

  const navItems = [
    { to: "/", label: "الطلبات" },
    { to: "/new", label: "جديد" },
    { to: "/future", label: "مستقبل" },
    { to: "/lamb", label: "لية" },
    { to: "/prices", label: "الأسعار" },
    { to: "/history", label: "السجل" },
    { to: "/archives", label: "الأرشيف" },
  ];

  return (
    <div className="app-shell" dir="rtl">
      <header className="topbar">
        <div className="topbar-title">نظام طلبات الملحمة</div>
      </header>

      <main className="content">
        <Routes>
          <Route path="/" element={<Orders />} />
          <Route path="/new" element={<NewOrder />} />
          <Route path="/future" element={<FutureOrders />} />
          <Route path="/lamb" element={<LambOrders />} />
          <Route path="/prices" element={<Prices />} />
          <Route path="/history" element={<History />} />
          <Route path="/archives" element={<Archives />} />
        </Routes>
      </main>

      <nav className="bottom-nav">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }
          >
            <span className="nav-item-label-wrap">
              <span>{item.label}</span>

              {item.to === "/history" && unpaidCount > 0 && (
                <span className="history-badge">
                  {unpaidCount > 9 ? "9+" : unpaidCount}
                </span>
              )}
            </span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}