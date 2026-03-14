import { useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";

export default function OrderCard({
  order,
  index,
  source,
  onDone,
  onDelete,
}) {
  const navigate = useNavigate();
  const { toggleOrderItemDone } = useOrders();

  return (
    <div className="card order-card compact-card">
      <div className="order-top-row">
        <div>
          <div className="order-customer">{order.customerName}</div>
          <div className="order-phone">{order.phone || "بدون هاتف"}</div>
        </div>

        <div className="order-top-badges">
          <span className="soft-badge">{order.serviceType}</span>
          <span className="soft-badge total-badge">₪ {order.total || 0}</span>
        </div>
      </div>

      <div className="order-meta-row">
        <span className="time-badge">{order.pickupTime || "اليوم"}</span>
      </div>

      <div className="order-items-list">
        {(order.items || []).map((item, i) => (
          <div
            key={i}
            className="order-item-line"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              color: item.done ? "#15803d" : "inherit",
              fontWeight: item.done ? "700" : "400",
            }}
          >
            <span>
              {item.done ? "✅ " : "• "}
              {item.name} — {item.summary}
            </span>

            <button
              type="button"
              className="ghost-btn"
              style={{
                padding: "6px 10px",
                minWidth: "72px",
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