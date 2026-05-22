import { useState } from "react";
import { useOrders } from "../context/OrdersContext";

export default function LambOrders() {
  const { liahOrders, addLiahOrder, removeLiahOrder } = useOrders();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [kg, setKg] = useState(5);
  const [redMeatKg, setRedMeatKg] = useState(0);
  const [redMeatType, setRedMeatType] = useState("خشن");

  function saveLiah() {
    if (!name.trim()) {
      alert("اكتب اسم الزبون");
      return;
    }

    addLiahOrder({
      customerName: name.trim(),
      phone: phone.trim(),
      kg,
      redMeatKg,
      redMeatType,
    });

    setName("");
    setPhone("");
    setKg(5);
    setRedMeatKg(0);
    setRedMeatType("خشن");
  }

  return (
    <div className="page">
      <h1>طلبات اللية</h1>

      <div className="liah-layout">
        <div className="card liah-form-card">
          <h2>إضافة طلب لية</h2>

          <div className="form-block">
            <label>اسم الزبون</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>

          <div className="form-block">
            <label>رقم الهاتف</label>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="form-block">
            <label>كمية اللية</label>
            <div className="counter-row">
              <button type="button" onClick={() => setKg((v) => Math.max(1, v - 1))}>
                -
              </button>
              <div className="counter-value">{kg} كغم</div>
              <button type="button" onClick={() => setKg((v) => v + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="form-block">
            <label>كمية لحم الاحمر</label>
            <div className="counter-row">
              <button
                type="button"
                onClick={() => setRedMeatKg((v) => Math.max(0, v - 1))}
              >
                -
              </button>
              <div className="counter-value">{redMeatKg} كغم</div>
              <button type="button" onClick={() => setRedMeatKg((v) => v + 1)}>
                +
              </button>
            </div>
          </div>

          <div className="form-block">
            <label>نوع لحم الاحمر</label>
            <div className="segmented">
              {["خشن", "ناعم", "صيخ"].map((option) => (
                <button
                  key={option}
                  type="button"
                  className={redMeatType === option ? "active" : ""}
                  onClick={() => setRedMeatType(option)}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <button className="save-order-btn" type="button" onClick={saveLiah}>
            حفظ طلب اللية
          </button>
        </div>

        <div className="card liah-list-card">
          <h2>الطلبات الحالية</h2>

          {liahOrders.length === 0 ? (
            <div className="empty-soft">لا توجد طلبات لية</div>
          ) : (
            <div className="liah-list">
              {liahOrders.map((item, index) => (
                <div key={index} className="liah-item">
                  <div>
                    <div className="basket-item-name">{item.customerName}</div>
                    <div className="basket-item-meta">
                      {item.kg} كغم لية • {item.phone || "بدون هاتف"}
                    </div>
                    <div className="basket-item-meta">
                      {item.redMeatKg || 0} كغم لحم الاحمر • {item.redMeatType || "خشن"}
                    </div>
                  </div>

                  <button
                    className="danger-icon-btn"
                    type="button"
                    onClick={() => removeLiahOrder(index)}
                  >
                    حذف
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
