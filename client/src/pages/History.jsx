import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../context/OrdersContext";

function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} dir="rtl">
        <div className="modal-header">
          <h3>{title}</h3>
          <button type="button" className="ghost-btn" onClick={onClose}>
            إغلاق
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function getItemLineTotal(item, prices) {
  if (item.mode === "money") return Number(item.money) || 0;

  if (item.mode === "kg") {
    const kg = Number(item.kg || 0);
    const key = (item.priceKey || item.name || "").trim();
    const pricePerKg = Number(prices[key] || 0);
    return kg * pricePerKg;
  }

  return 0;
}

export default function History() {
  const navigate = useNavigate();
  const {
    history,
    unpaidHistoryOrders,
    unpaidCount,
    markOrderAsPaid,
    markOrderAsUnpaid,
    removeHistory,
    clearHistory,
    archiveToday,
    prices,
  } = useOrders();

  const [showDebtModal, setShowDebtModal] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const totalHistoryRevenue = history.reduce(
    (sum, order) => sum + Number(order.total || 0),
    0
  );

  const filteredHistory = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return history;

    return history.filter((order) => {
      return (
        (order.customerName || "").toLowerCase().includes(query) ||
        (order.phone || "").toLowerCase().includes(query)
      );
    });
  }, [history, searchQuery]);

  return (
    <div className="page history-page">
      <div className="history-top-row">
        <div className="history-title-actions">
          <h1>السجل</h1>

          {history.length > 0 && (
            <>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowArchiveConfirm(true)}
              >
                أرشفة اليوم
              </button>

              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowClearConfirm(true)}
              >
                مسح الكل
              </button>
            </>
          )}
        </div>

        <button
          type="button"
          className={`debt-bell-btn ${unpaidCount > 0 ? "has-unpaid" : ""}`}
          onClick={() => setShowDebtModal(true)}
          title="الزبائن الذين لم يدفعوا"
        >
          <span style={{ fontSize: "24px" }}>🔔</span>
          {unpaidCount > 0 && (
            <span className="debt-bell-badge">
              {unpaidCount > 9 ? "9+" : unpaidCount}
            </span>
          )}
        </button>
      </div>

      <div className="card history-search-card">
        <div className="form-block" style={{ marginBottom: 0 }}>
          <label>البحث في السجل</label>
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف"
          />
        </div>
      </div>

      {history.length === 0 ? (
        <div className="card empty-state">لا يوجد سجل اليوم</div>
      ) : filteredHistory.length === 0 ? (
        <div className="card empty-state">لا توجد نتائج مطابقة</div>
      ) : (
        <>
          <div className="orders-grid">
            {filteredHistory.map((order, index) => (
              <div
                key={`${order.customerName}-${order.pickupTime}-${index}`}
                className={`card order-card ${
                  order.paymentStatus === "unpaid" ? "history-unpaid-card" : ""
                }`}
              >
                <div className="order-top-row">
                  <div>
                    <div className="order-customer">{order.customerName}</div>
                    <div className="order-phone">{order.phone || "بدون رقم"}</div>
                  </div>

                  <span
                    className={
                      order.paymentStatus === "unpaid"
                        ? "unpaid-mini-badge"
                        : "paid-mini-badge"
                    }
                  >
                    {order.paymentStatus === "unpaid" ? "عليه دين" : "مدفوع"}
                  </span>
                </div>

                <div className="order-meta-row">
                  <span className="time-badge">{order.pickupTime}</span>
                </div>

                <div className="order-items-list">
                  {(order.items || []).map((item, i) => {
                    const lineTotal = getItemLineTotal(item, prices);

                    return (
                      <div key={i} className="order-item-line">
                        <div className="order-item-copy">
                          <span>
                            {item.name} — {item.summary}
                          </span>
                          {item.note ? <div className="basket-item-meta">{item.note}</div> : null}
                        </div>
                        <strong>{lineTotal} ₪</strong>
                      </div>
                    );
                  })}
                </div>

                <div className="history-order-total">
                  المجموع: {Number(order.total || 0)} ₪
                </div>

                <div className="order-actions">
                  {order.paymentStatus === "unpaid" ? (
                    <button
                      type="button"
                      className="ghost-btn"
                      onClick={() => markOrderAsPaid("history", history.indexOf(order))}
                    >
                      تم الدفع
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="danger-icon-btn"
                      onClick={() => markOrderAsUnpaid("history", history.indexOf(order))}
                    >
                      عليه دين
                    </button>
                  )}

                  <button
                    type="button"
                    className="ghost-btn"
                    onClick={() => removeHistory(history.indexOf(order))}
                  >
                    حذف
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card history-total-card">
            <div className="history-order-total">مجموع اليوم: {totalHistoryRevenue} ₪</div>
          </div>
        </>
      )}

      {showDebtModal && (
        <Modal title="الزبائن الذين لم يدفعوا" onClose={() => setShowDebtModal(false)}>
          <div className="modal-body">
            {unpaidHistoryOrders.length === 0 ? (
              <div className="empty-soft">لا يوجد زبائن عليهم دين</div>
            ) : (
              unpaidHistoryOrders.map((order, index) => (
                <div key={index} className="basket-item-card">
                  <div className="basket-item-top">
                    <div>
                      <div className="basket-item-name">{order.customerName}</div>
                      <div className="basket-item-meta">
                        {order.phone || "بدون رقم"} • {order.pickupTime}
                      </div>
                      <div className="basket-item-meta">
                        {(order.items || []).map((item) => item.name).join("، ")}
                      </div>
                      <div className="basket-item-meta">
                        المجموع: {Number(order.total || 0)} ₪
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Modal>
      )}

      {showClearConfirm && (
        <Modal title="تأكيد مسح السجل" onClose={() => setShowClearConfirm(false)}>
          <div className="modal-body">
            <div className="empty-soft" style={{ minHeight: "120px" }}>
              هل تريد مسح كل الزبائن من السجل؟
            </div>

            <div className="order-actions">
              <button
                type="button"
                className="danger-icon-btn"
                onClick={() => {
                  clearHistory();
                  setShowClearConfirm(false);
                }}
              >
                نعم
              </button>

              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowClearConfirm(false)}
              >
                لا
              </button>
            </div>
          </div>
        </Modal>
      )}

      {showArchiveConfirm && (
        <Modal title="أرشفة اليوم" onClose={() => setShowArchiveConfirm(false)}>
          <div className="modal-body">
            <div className="empty-soft" style={{ minHeight: "120px" }}>
              هل تريد حفظ سجل اليوم في الأرشيف ثم الانتقال إلى صفحة الأرشيف؟
            </div>

            <div className="order-actions">
              <button
                type="button"
                className="danger-icon-btn"
                onClick={() => {
                  const ok = archiveToday();
                  setShowArchiveConfirm(false);

                  if (ok) navigate("/archives");
                }}
              >
                نعم
              </button>

              <button
                type="button"
                className="ghost-btn"
                onClick={() => setShowArchiveConfirm(false)}
              >
                لا
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
