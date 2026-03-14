import { useEffect, useMemo, useState } from "react";
import { useOrders } from "../context/OrdersContext";
import { ALL_PRICE_ITEMS } from "../data/menu";

export default function Prices() {
  const { prices = {}, savePrices } = useOrders();

  const safePriceItems = useMemo(() => ALL_PRICE_ITEMS || [], []);

  const initialDraft = useMemo(() => {
    const obj = {};

    safePriceItems.forEach((item) => {
      obj[item] = prices?.[item] ?? "";
    });

    return obj;
  }, [safePriceItems, prices]);

  const [draft, setDraft] = useState(initialDraft);

  useEffect(() => {
    setDraft(initialDraft);
  }, [initialDraft]);

  function handleChange(name, value) {
    setDraft((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  function handleSave() {
    const cleaned = {};

    safePriceItems.forEach((key) => {
      cleaned[key] = Number(draft[key] || 0);
    });

    savePrices(cleaned);
    alert("تم حفظ الأسعار");
  }

  return (
    <div className="page">
      <h1>الأسعار</h1>

      <div className="card prices-card">
        <div className="prices-list">
          {safePriceItems.map((item) => (
            <div key={item} className="price-row">
              <div className="price-name">{item}</div>

              <input
                className="price-input"
                type="number"
                min="0"
                value={draft[item] ?? ""}
                onChange={(e) => handleChange(item, e.target.value)}
                placeholder="₪ / كغم"
              />
            </div>
          ))}
        </div>

        <button className="save-order-btn" type="button" onClick={handleSave}>
          حفظ الأسعار
        </button>
      </div>
    </div>
  );
}