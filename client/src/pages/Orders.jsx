import { useEffect, useMemo, useState } from "react";
import { useOrders } from "../context/OrdersContext";
import OrderCard from "../components/OrderCard";
import { GRILL_OPTIONS } from "../data/menu";

const GRILL_BASE_NAMES = ["فيليه", "سينتا", "كعب فخذ"];
const MAIN_PREP_ITEMS = ["شاورما", "شوي", "كباب"];

const MAIN_PREP_STYLES = {
  شاورما: {
    background: "#e7f1ff",
    color: "#1f4d8f",
    border: "1px solid #bfd8ff",
    boxShadow: "0 12px 24px rgba(77,132,214,0.16)",
  },
  شوي: {
    background: "#fff1dd",
    color: "#8a4f08",
    border: "1px solid #f0d0a2",
    boxShadow: "0 12px 24px rgba(201,132,34,0.16)",
  },
  كباب: {
    background: "#ffe7ea",
    color: "#8d2b45",
    border: "1px solid #f2c0cb",
    boxShadow: "0 12px 24px rgba(184,68,104,0.16)",
  },
};

function isGrillItem(name = "") {
  return (
    GRILL_BASE_NAMES.some((base) => name.includes(base)) ||
    GRILL_OPTIONS.some((option) => name.includes(option))
  );
}

function formatKg(kg) {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

function getPrepChipClass(label) {
  if (label === "شاورما") return "prep-summary-chip prep-chip-shawarma";
  if (label === "شوي") return "prep-summary-chip prep-chip-grill";
  if (label === "كباب") return "prep-summary-chip prep-chip-kebab";
  return "prep-summary-chip";
}

function getMainPrepStyle(label) {
  return {
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    textAlign: "center",
    minHeight: "148px",
    borderRadius: "24px",
    padding: "20px 16px",
    gap: "8px",
    ...(MAIN_PREP_STYLES[label] || {}),
  };
}

const mainGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "14px",
};

const safayehListStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
};

const safayehChipStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "16px",
  minWidth: "180px",
  background: "#fbf8fd",
  color: "#4f357f",
  border: "1px solid #dac8f2",
  borderRadius: "20px",
  padding: "14px 18px",
  fontSize: "18px",
  fontWeight: "800",
  boxShadow: "0 8px 18px rgba(73,45,107,0.08)",
};

function getSafayehVariantLabel(item) {
  const parts = [];

  if (item.spice) {
    parts.push(item.spice);
  }

  if (Array.isArray(item.extras) && item.extras.length > 0) {
    parts.push(item.extras.join("، "));
  }

  return parts.length > 0 ? `صفايح ${parts.join(" • ")}` : "صفايح";
}

export default function Orders() {
  const { orders, removeOrder, markDone } = useOrders();
  const [showHolidayPrep, setShowHolidayPrep] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("showHolidayPrep") === "true";
  });

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("showHolidayPrep", String(showHolidayPrep));
  }, [showHolidayPrep]);

  const prepSummary = useMemo(() => {
    const mainTotals = new Map(MAIN_PREP_ITEMS.map((label) => [label, 0]));
    const safayehTotals = new Map();

    orders.forEach((order) => {
      (order.items || []).forEach((item) => {
        const kgValue = Number(item.kg);
        if (!Number.isFinite(kgValue) || kgValue <= 0) return;

        const itemName = (item.name || "").trim();
        if (!itemName) return;

        if (itemName === "شاورما") {
          mainTotals.set("شاورما", (mainTotals.get("شاورما") || 0) + kgValue);
          return;
        }

        if (itemName === "كباب") {
          mainTotals.set("كباب", (mainTotals.get("كباب") || 0) + kgValue);
          return;
        }

        if (isGrillItem(itemName)) {
          mainTotals.set("شوي", (mainTotals.get("شوي") || 0) + kgValue);
          return;
        }

        if (itemName === "صفايح / كفته") {
          const variantLabel = getSafayehVariantLabel(item);
          safayehTotals.set(
            variantLabel,
            (safayehTotals.get(variantLabel) || 0) + kgValue
          );
        }
      });
    });

    const mainItems = MAIN_PREP_ITEMS.map((label) => ({
      label,
      kg: mainTotals.get(label) || 0,
    }));

    const safayehItems =
      safayehTotals.size > 0
        ? Array.from(safayehTotals.entries()).map(([label, kg]) => ({
            label,
            kg,
          }))
        : [{ label: "صفايح", kg: 0 }];

    return {
      mainItems,
      safayehItems,
    };
  }, [orders]);

  return (
    <div className="page orders-page">
      <h1>الطلبات</h1>

      <div
        className="card prep-summary-card"
        style={{
          padding: "10px 14px",
          marginBottom: "14px",
        }}
      >
        <div
          className="panel-title-row prep-summary-title-row"
          style={{ marginBottom: showHolidayPrep ? "10px" : 0 }}
        >
          <h2 style={{ fontSize: "20px" }}>تحضير العيد</h2>
          <button
            type="button"
            className="ghost-btn"
            onClick={() => setShowHolidayPrep((prev) => !prev)}
            style={{
              padding: "8px 14px",
              borderRadius: "999px",
              fontWeight: 800,
              background: showHolidayPrep ? "#7353b6" : "#fff",
              color: showHolidayPrep ? "#fff" : "#5b3f90",
              borderColor: "#d4c1ef",
            }}
          >
            {showHolidayPrep ? "إخفاء" : "إظهار"}
          </button>
        </div>

        {showHolidayPrep ? (
          <>
            <div
              className="prep-summary-main-grid"
              style={{
                ...mainGridStyle,
                gridTemplateColumns: "repeat(3, minmax(140px, 1fr))",
                gap: "10px",
              }}
            >
              {prepSummary.mainItems.map((item) => (
                <div
                  key={item.label}
                  className={`${getPrepChipClass(item.label)} prep-main-chip`}
                  style={{
                    ...getMainPrepStyle(item.label),
                    minHeight: "96px",
                    padding: "12px 10px",
                    borderRadius: "18px",
                    gap: "4px",
                  }}
                >
                  <span className="prep-chip-label" style={{ whiteSpace: "nowrap", fontWeight: 800, fontSize: "16px" }}>
                    {item.label}
                  </span>
                  <span
                    className="prep-chip-value"
                    style={{ fontSize: "30px", fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap" }}
                  >
                    {formatKg(item.kg)}
                  </span>
                  <span
                    className="prep-chip-unit"
                    style={{ fontSize: "12px", fontWeight: 800, opacity: 0.82, whiteSpace: "nowrap" }}
                  >
                    كغم
                  </span>
                </div>
              ))}
            </div>

            <div className="prep-summary-subtitle" style={{ margin: "10px 0 8px", fontSize: "13px" }}>
              الصفايح حسب نفس الخلطة
            </div>

            <div className="prep-summary-list" style={safayehListStyle}>
              {prepSummary.safayehItems.map((item) => (
                <div
                  key={item.label}
                  className="prep-summary-chip prep-summary-chip-soft"
                  style={{
                    ...safayehChipStyle,
                    minWidth: "150px",
                    padding: "10px 12px",
                    borderRadius: "16px",
                    fontSize: "15px",
                  }}
                >
                  <span className="prep-chip-label" style={{ whiteSpace: "nowrap" }}>
                    {item.label}
                  </span>
                  <span
                    className="prep-chip-value"
                    style={{ fontSize: "18px", fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap" }}
                  >
                    {formatKg(item.kg)}
                  </span>
                  <span
                    className="prep-chip-unit"
                    style={{ fontSize: "11px", fontWeight: 800, opacity: 0.82, whiteSpace: "nowrap" }}
                  >
                    كغم
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>

      {orders.length === 0 ? (
        <div className="card empty-state">لا يوجد طلبات</div>
      ) : (
        <div className="orders-grid tablet-grid">
          {orders.map((order, index) => (
            <OrderCard
              key={index}
              order={order}
              index={index}
              source="orders"
              onDone={() => markDone("orders", index)}
              onDelete={() => removeOrder(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
