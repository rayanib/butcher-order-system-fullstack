import dayjs from "dayjs";
import { useEffect, useMemo, useState } from "react";
import { useOrders } from "../context/OrdersContext";
import OrderCard from "../components/OrderCard";
import {
  calculateFuturePrepTotals,
  calculatePrepTotalsByDay,
  formatKg,
} from "../data/prepSummary";

function getFutureDayKey(order) {
  const raw = (order.pickupTime || "").trim();
  if (!raw) return "unknown";

  const parsed = dayjs(raw.replace(" ", "T"));
  if (!parsed.isValid()) return raw.split(" ")[0] || raw;

  return parsed.format("YYYY-MM-DD");
}

function getFutureDayLabel(dayKey) {
  const parsed = dayjs(dayKey);
  if (!parsed.isValid()) return dayKey;
  return parsed.format("dddd DD/MM/YYYY");
}

const prepPanelStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
  gap: "10px",
  padding: 0,
  marginBottom: "10px",
  background: "transparent",
  border: 0,
  boxShadow: "none",
};

const prepItemBaseStyle = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minWidth: 0,
  minHeight: "54px",
  padding: "5px 8px",
  borderRadius: "14px",
  textAlign: "center",
};

const prepItemStyles = {
  kebab: {
    ...prepItemBaseStyle,
    background: "#ffe7ea",
    color: "#8d2b45",
    border: "1px solid #f2c0cb",
  },
  grill: {
    ...prepItemBaseStyle,
    background: "#fff1dd",
    color: "#8a4f08",
    border: "1px solid #f0d0a2",
  },
  shawarma: {
    ...prepItemBaseStyle,
    background: "#e7f1ff",
    color: "#1f4d8f",
    border: "1px solid #bfd8ff",
  },
};

const prepLabelStyle = {
  fontSize: "12px",
  fontWeight: 900,
  lineHeight: 1.1,
  whiteSpace: "nowrap",
};

const prepValueStyle = {
  fontSize: "23px",
  fontWeight: 900,
  lineHeight: 1,
  whiteSpace: "nowrap",
};

const prepUnitStyle = {
  fontSize: "10px",
  fontWeight: 900,
  lineHeight: 1.1,
  opacity: 0.82,
  whiteSpace: "nowrap",
};

const dayPrepStripStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px",
  margin: "0 0 10px",
};

const dayPrepBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "7px 10px",
  borderRadius: "999px",
  background: "#fff",
  border: "1px solid #dfd2ea",
  color: "#4f347e",
  fontSize: "12px",
  fontWeight: 900,
  whiteSpace: "nowrap",
  boxShadow: "0 6px 14px rgba(73,45,107,0.06)",
};

const dayPrepNumberStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "3px",
};

export default function FutureOrders() {
  const { futureOrders, removeFutureOrder, markDone } = useOrders();
  const [selectedDayKey, setSelectedDayKey] = useState("");

  const tabBarStyle = {
    display: "flex",
    flexWrap: "wrap",
    gap: "8px",
    padding: "8px",
    marginBottom: "14px",
    borderRadius: "18px",
    background: "#f3edf8",
    border: "1px solid #e0d4eb",
  };

  const getTabStyle = (active) => ({
    border: active ? "1px solid #d7c8e7" : "1px solid transparent",
    background: active ? "#ffffff" : "transparent",
    color: active ? "#4f347e" : "#5a4a6e",
    borderRadius: "14px",
    padding: "10px 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "14px",
    fontWeight: 800,
    cursor: "pointer",
    boxShadow: active ? "0 8px 18px rgba(73,45,107,0.08)" : "none",
  });

  const countStyle = (active) => ({
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "26px",
    height: "26px",
    padding: "0 8px",
    borderRadius: "999px",
    background: active ? "#7353b6" : "rgba(115,83,182,0.1)",
    color: active ? "#fff" : "inherit",
    fontSize: "12px",
    fontWeight: 900,
    whiteSpace: "nowrap",
  });

  const groupedOrders = useMemo(() => {
    const groups = futureOrders.reduce((acc, order, index) => {
      const dayKey = getFutureDayKey(order);
      if (!acc.has(dayKey)) {
        acc.set(dayKey, []);
      }

      acc.get(dayKey).push({ order, index });
      return acc;
    }, new Map());

    return Array.from(groups.entries())
      .map(([dayKey, entries]) => ({
        dayKey,
        dayLabel: getFutureDayLabel(dayKey),
        entries: entries.sort((a, b) =>
          String(a.order.pickupTime || "").localeCompare(
            String(b.order.pickupTime || "")
          )
        ),
      }))
      .sort((a, b) => a.dayKey.localeCompare(b.dayKey));
  }, [futureOrders]);

  useEffect(() => {
    if (!groupedOrders.length) {
      setSelectedDayKey("");
      return;
    }

    const exists = groupedOrders.some((group) => group.dayKey === selectedDayKey);
    if (!exists) {
      setSelectedDayKey(groupedOrders[0].dayKey);
    }
  }, [groupedOrders, selectedDayKey]);

  const selectedGroup =
    groupedOrders.find((group) => group.dayKey === selectedDayKey) ||
    groupedOrders[0];

  const futurePrepTotals = useMemo(
    () => calculateFuturePrepTotals(futureOrders),
    [futureOrders]
  );

  const prepTotalsByDay = useMemo(
    () => calculatePrepTotalsByDay(groupedOrders),
    [groupedOrders]
  );

  return (
    <div className="page orders-page">
      <div className="future-prep-mini-panel" style={prepPanelStyle}>
        <div className="future-prep-mini-item" style={prepItemStyles.kebab}>
          <span style={prepLabelStyle}>كباب</span>
          <span style={prepValueStyle}>{formatKg(futurePrepTotals.kebab)}</span>
          <span style={prepUnitStyle}>كغم</span>
        </div>

        <div className="future-prep-mini-item" style={prepItemStyles.grill}>
          <span style={prepLabelStyle}>شوي</span>
          <span style={prepValueStyle}>{formatKg(futurePrepTotals.grill)}</span>
          <span style={prepUnitStyle}>كغم</span>
        </div>

        <div className="future-prep-mini-item" style={prepItemStyles.shawarma}>
          <span style={prepLabelStyle}>شاورما</span>
          <span style={prepValueStyle}>
            {formatKg(futurePrepTotals.shawarma)}
          </span>
          <span style={prepUnitStyle}>كغم</span>
        </div>
      </div>

      <h1>الطلبيات المستقبلية</h1>

      {groupedOrders.length === 0 ? (
        <div className="card empty-state">لا توجد طلبيات مستقبلية</div>
      ) : (
        <div className="future-day-board">
          <div className="future-day-prep-strip" style={dayPrepStripStyle}>
            {prepTotalsByDay.map((day) => (
              <div key={day.dayKey} style={dayPrepBadgeStyle}>
                <span>{day.dayLabel}</span>
                <span style={dayPrepNumberStyle}>
                  شوي {formatKg(day.totals.grill)}
                </span>
                <span style={dayPrepNumberStyle}>
                  شاورما {formatKg(day.totals.shawarma)}
                </span>
              </div>
            ))}
          </div>

          <div className="future-day-tabs" style={tabBarStyle}>
            {groupedOrders.map((group) => (
              <button
                key={group.dayKey}
                type="button"
                className={
                  group.dayKey === selectedGroup?.dayKey
                    ? "future-day-tab active"
                    : "future-day-tab"
                }
                style={getTabStyle(group.dayKey === selectedGroup?.dayKey)}
                onClick={() => setSelectedDayKey(group.dayKey)}
              >
                <span className="future-day-tab-label">{group.dayLabel}</span>
                <span
                  className="future-day-tab-count"
                  style={countStyle(group.dayKey === selectedGroup?.dayKey)}
                >
                  {group.entries.length}
                </span>
              </button>
            ))}
          </div>

          {selectedGroup && (
            <section className="card future-day-card">
              <div className="orders-grid tablet-grid">
                {selectedGroup.entries.map(({ order, index }) => (
                  <OrderCard
                    key={`${selectedGroup.dayKey}-${index}`}
                    order={order}
                    index={index}
                    source="future"
                    onDone={() => markDone("future", index)}
                    onDelete={() => removeFutureOrder(index)}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
