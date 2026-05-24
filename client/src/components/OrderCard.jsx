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

  return (
    <div className={`card order-card compact-card ${statusMeta.className}`}>
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
