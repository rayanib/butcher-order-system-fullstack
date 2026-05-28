import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";

function getStatusMeta(status) {
  const map = {
    waiting: { label: "بانتظار", className: "status-waiting" },
    preparing: { label: "قيد التحضير", className: "status-preparing" },
    ready: { label: "جاهز", className: "status-ready" },
    future: { label: "مجدول", className: "status-future" },
  };

  return map[status] || map.waiting;
}

function normalizeDigits(value = "") {
  const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
  const persianDigits = "۰۱۲۳۴۵۶۷۸۹";

  return String(value).replace(/[٠-٩۰-۹]/g, (digit) => {
    const arabicIndex = arabicDigits.indexOf(digit);
    if (arabicIndex !== -1) return String(arabicIndex);

    const persianIndex = persianDigits.indexOf(digit);
    return persianIndex === -1 ? digit : String(persianIndex);
  });
}

function parseDateTime(value) {
  if (!value) return null;

  const parsed = new Date(String(value).replace(" ", "T"));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseRelativePickupMinutes(value = "") {
  const normalized = normalizeDigits(value);
  const numberMatch = normalized.match(/\d+/);
  const numberValue = numberMatch ? Number(numberMatch[0]) : null;
  const hasHour = /ساعة|ساعه|ساعات|ساعتين|ساعتان/.test(value);
  const hasMinute = /دقيقة|دقيقه|دقائق|دقا/.test(value);

  if (/ساعتين|ساعتان/.test(value)) return 120;
  if (hasHour) return (numberValue || 1) * 60;
  if (hasMinute) return numberValue || 0;

  return null;
}

function buildPickupDeadline(order, now) {
  const pickupTime = String(order.pickupTime || "").trim();
  if (!pickupTime) return null;

  const absoluteDate = parseDateTime(pickupTime);
  if (absoluteDate) return absoluteDate;

  const timeMatch = normalizeDigits(pickupTime).match(/(\d{1,2}):(\d{2})/);
  if (timeMatch) {
    const deadline = new Date(now);
    deadline.setHours(Number(timeMatch[1]), Number(timeMatch[2]), 0, 0);
    return deadline;
  }

  const relativeMinutes = parseRelativePickupMinutes(pickupTime);
  const createdAt = parseDateTime(order.createdAt);
  if (relativeMinutes !== null && createdAt) {
    return new Date(createdAt.getTime() + relativeMinutes * 60 * 1000);
  }

  return null;
}

function formatMinutesLeft(minutesLeft) {
  if (minutesLeft <= 0) return "تأخر";
  if (minutesLeft < 60) return `${minutesLeft} د`;

  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  return minutes ? `${hours}س ${minutes}د` : `${hours}س`;
}

function getOrderUrgency(order, now) {
  const deadline = buildPickupDeadline(order, now);
  const createdAt = parseDateTime(order.createdAt);

  if (!deadline || !createdAt) return null;

  const totalMs = Math.max(deadline.getTime() - createdAt.getTime(), 1);
  const remainingMs = deadline.getTime() - now.getTime();
  const minutesLeft = Math.ceil(remainingMs / 60000);
  const progress = Math.min(
    100,
    Math.max(0, Math.round(((totalMs - remainingMs) / totalMs) * 100))
  );
  const totalMinutes = Math.max(1, Math.round(totalMs / 60000));
  const soonMinutes = Math.max(10, Math.ceil(totalMinutes / 3));
  const urgentMinutes = Math.max(5, Math.ceil(totalMinutes / 6));

  if (minutesLeft <= 0) {
    return {
      level: "late",
      label: "تأخر الطلب",
      detail: formatMinutesLeft(minutesLeft),
      progress: 100,
    };
  }

  if (minutesLeft <= urgentMinutes) {
    return {
      level: "urgent",
      label: "حضره الآن",
      detail: formatMinutesLeft(minutesLeft),
      progress,
    };
  }

  if (minutesLeft <= soonMinutes) {
    return {
      level: "soon",
      label: "قريب",
      detail: formatMinutesLeft(minutesLeft),
      progress,
    };
  }

  return null;
}

export default function OrderCard({
  order,
  index,
  source,
  onDone,
  onDelete,
}) {
  const navigate = useNavigate();
  const { toggleOrderItemDone, cycleOrderStatus } = useOrders();
  const isFuture = source === "future" || order.isFuture;
  const status = isFuture ? "future" : order.status || "waiting";
  const statusMeta = getStatusMeta(status);
  const [now, setNow] = useState(() => new Date());
  const urgency = useMemo(
    () => (!isFuture ? getOrderUrgency(order, now) : null),
    [isFuture, order, now]
  );

  useEffect(() => {
    if (isFuture) return undefined;

    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, [isFuture]);

  return (
    <div
      className={`card order-card compact-card ${statusMeta.className} ${
        urgency ? `urgency-${urgency.level}` : ""
      }`}
    >
      <div className="order-top-row">
        <div>
          <div className="order-customer">{order.customerName}</div>
          <div className="order-phone">{order.phone || "بدون هاتف"}</div>
        </div>

        <div className="order-top-badges">
          {!isFuture ? (
            <span className={`order-status-badge ${statusMeta.className}`}>
              {statusMeta.label}
            </span>
          ) : null}
          <span className="soft-badge">{order.serviceType}</span>
          <span className="soft-badge total-badge">₪ {order.total || 0}</span>
        </div>
      </div>

      <div className="order-meta-row">
        <span className="time-badge">{order.pickupTime || "اليوم"}</span>
      </div>

      {urgency ? (
        <div className={`urgency-row urgency-${urgency.level}`}>
          <span className="urgency-symbol">!</span>
          <span>{urgency.label}</span>
          <strong>{urgency.detail}</strong>
        </div>
      ) : null}

      {order.orderNote ? (
        <div className="order-note-box">{order.orderNote}</div>
      ) : null}

      <div className="order-items-list">
        {(order.items || []).map((item, i) => (
          <div
            key={i}
            className="order-item-line"
            style={{
              color: item.done ? "#15803d" : "inherit",
              fontWeight: item.done ? "700" : "400",
            }}
          >
            <div className="order-item-copy">
              <span>
                {item.done ? "✓ " : "• "}
                {item.name} — {item.summary}
              </span>
              {item.note ? <div className="basket-item-meta">{item.note}</div> : null}
            </div>

            <button
              type="button"
              className="ghost-btn item-done-btn"
              style={{
                borderColor: item.done ? "#16a34a" : undefined,
                color: item.done ? "#16a34a" : undefined,
              }}
              onClick={() => toggleOrderItemDone(source, index, i)}
            >
              {item.done ? "راجع" : "تم"}
            </button>
          </div>
        ))}
      </div>

      <div className="order-actions">
        {!isFuture ? (
          <button
            className={`ghost-btn order-status-btn ${statusMeta.className}`}
            type="button"
            onClick={() => cycleOrderStatus(source, index)}
          >
            {statusMeta.label}
          </button>
        ) : null}

        <button className="ghost-btn" type="button" onClick={onDone}>
          تم
        </button>

        <button
          className="ghost-btn"
          type="button"
          onClick={() =>
            navigate("/new", {
              state: {
                editMode: true,
                source,
                index,
                order,
              },
            })
          }
        >
          تعديل
        </button>

        <button className="danger-icon-btn" type="button" onClick={onDelete}>
          حذف
        </button>
      </div>
    </div>
  );
}
