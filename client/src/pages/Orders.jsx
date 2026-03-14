import { useOrders } from "../context/OrdersContext";
import OrderCard from "../components/OrderCard";

export default function Orders() {
  const { orders, removeOrder, markDone } = useOrders();

  return (
    <div className="page">
      <h1>الطلبات</h1>

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