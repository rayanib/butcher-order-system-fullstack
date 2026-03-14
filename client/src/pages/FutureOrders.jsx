import { useOrders } from "../context/OrdersContext";
import OrderCard from "../components/OrderCard";

export default function FutureOrders() {
  const { futureOrders, removeFutureOrder, markDone } = useOrders();

  return (
    <div className="page">
      <h1>الطلبيات المستقبلية</h1>

      {futureOrders.length === 0 ? (
        <div className="card empty-state">لا توجد طلبيات مستقبلية</div>
      ) : (
        <div className="orders-grid tablet-grid">
          {futureOrders.map((order, index) => (
            <OrderCard
              key={index}
              order={order}
              index={index}
              source="future"
              onDone={() => markDone("future", index)}
              onDelete={() => removeFutureOrder(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}