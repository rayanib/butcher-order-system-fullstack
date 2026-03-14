import { useState } from "react";
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
  if (item.mode === "money") {
    return Number(item.money) || 0;
  }

  if (item.mode === "kg") {
    const kg = Number(item.kg || 0);
    const pricePerKg = Number(prices[item.name] || 0);
    return kg * pricePerKg;
  }

  return 0;
}

function buildPrintableHtml(archive, prices) {
  const orderBlocks = (archive.orders || [])
    .map((order) => {
      const itemRows = (order.items || [])
        .map((item) => {
          const lineTotal = getItemLineTotal(item, prices);

          return `
            <div class="item-row">
              <span>${item.name} — ${item.summary}</span>
              <strong>${lineTotal} ₪</strong>
            </div>
          `;
        })
        .join("");

      return `
        <div class="order-card">
          <div class="order-top">
            <div>
              <div class="customer">${order.customerName || ""}</div>
              <div class="meta">${order.phone || "بدون رقم"} • ${order.pickupTime || ""}</div>
            </div>
            <div class="${order.paymentStatus === "unpaid" ? "badge-unpaid" : "badge-paid"}">
              ${order.paymentStatus === "unpaid" ? "عليه دين" : "مدفوع"}
            </div>
          </div>

          <div class="items-list">
            ${itemRows}
          </div>

          <div class="order-total">
            المجموع: ${Number(order.total || 0)} ₪
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
      <head>
        <meta charset="UTF-8" />
        <title>أرشيف ${archive.displayDate || archive.date}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            direction: rtl;
            padding: 24px;
            color: #111;
            background: #fff;
          }

          .page-title {
            text-align: center;
            margin-bottom: 8px;
            font-size: 28px;
            font-weight: bold;
          }

          .page-subtitle {
            text-align: center;
            margin-bottom: 24px;
            color: #555;
            font-size: 18px;
          }

          .summary-box {
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 20px;
            background: #f8f8f8;
          }

          .summary-line {
            margin-bottom: 6px;
            font-size: 16px;
          }

          .order-card {
            border: 1px solid #ddd;
            border-radius: 12px;
            padding: 14px;
            margin-bottom: 14px;
          }

          .order-top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            margin-bottom: 10px;
          }

          .customer {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 4px;
          }

          .meta {
            color: #555;
            font-size: 14px;
          }

          .badge-unpaid,
          .badge-paid {
            padding: 6px 10px;
            border-radius: 999px;
            font-size: 13px;
            font-weight: bold;
            white-space: nowrap;
          }

          .badge-unpaid {
            background: #ffe7c2;
            color: #8a4b00;
          }

          .badge-paid {
            background: #daf5e7;
            color: #0b6b3a;
          }

          .items-list {
            margin-top: 10px;
            margin-bottom: 10px;
          }

          .item-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            padding: 6px 0;
            border-bottom: 1px dashed #ddd;
          }

          .item-row:last-child {
            border-bottom: none;
          }

          .order-total {
            margin-top: 12px;
            font-weight: bold;
            font-size: 16px;
          }
        </style>
      </head>
      <body>
        <div class="page-title">أرشيف الطلبات</div>
        <div class="page-subtitle">${archive.displayDate || archive.date}</div>

        <div class="summary-box">
          <div class="summary-line">عدد الطلبات: ${archive.totalOrders || 0}</div>
          <div class="summary-line">عدد الديون: ${archive.unpaidCount || 0}</div>
          <div class="summary-line">المجموع: ${archive.totalRevenue || 0} ₪</div>
        </div>

        ${orderBlocks}
      </body>
    </html>
  `;
}

function ArchiveDayCard({ archive, onOpen, onDelete, onDownload }) {
  return (
    <div className="card order-card">
      <div className="order-card-top">
        <div>
          <div className="order-customer">
            {archive.displayDate || archive.date}
          </div>
          <div className="order-phone">
            {archive.totalOrders} طلبات • {archive.totalRevenue} ₪
          </div>
        </div>

        {archive.unpaidCount > 0 && (
          <span className="unpaid-mini-badge">
            {archive.unpaidCount} دين
          </span>
        )}
      </div>

      <div className="order-actions">
        <button type="button" className="ghost-btn" onClick={onOpen}>
          فتح
        </button>

        <button type="button" className="ghost-btn" onClick={onDownload}>
          PDF
        </button>

        <button type="button" className="ghost-btn" onClick={onDelete}>
          حذف
        </button>
      </div>
    </div>
  );
}

export default function Archives() {
  const { dailyArchives, removeArchive, clearArchives, prices } = useOrders();
  const [selectedArchive, setSelectedArchive] = useState(null);

  function handleDownloadPdf(archive) {
    const printWindow = window.open("", "_blank", "width=1000,height=800");
    if (!printWindow) return;

    const html = buildPrintableHtml(archive, prices);
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();

    printWindow.focus();
    printWindow.print();
  }

  return (
    <div className="page">
      <div className="history-top-row">
        <div className="history-title-actions">
          <h1>الأرشيف</h1>

          {dailyArchives.length > 0 && (
            <button
              type="button"
              className="ghost-btn"
              onClick={clearArchives}
            >
              حذف كل الأرشيف
            </button>
          )}
        </div>
      </div>

      {dailyArchives.length === 0 ? (
        <div className="card empty-state">لا يوجد أرشيف بعد</div>
      ) : (
        <div className="orders-grid">
          {dailyArchives.map((archive) => (
            <ArchiveDayCard
              key={archive.id}
              archive={archive}
              onOpen={() => setSelectedArchive(archive)}
              onDelete={() => removeArchive(archive.id)}
              onDownload={() => handleDownloadPdf(archive)}
            />
          ))}
        </div>
      )}

      {selectedArchive && (
        <Modal
          title={`أرشيف ${selectedArchive.displayDate || selectedArchive.date}`}
          onClose={() => setSelectedArchive(null)}
        >
          <div className="modal-body">
            <div className="basket-item-card">
              <div className="basket-item-name">
                عدد الطلبات: {selectedArchive.totalOrders}
              </div>
              <div className="basket-item-meta">
                المجموع: {selectedArchive.totalRevenue} ₪
              </div>
              <div className="basket-item-meta">
                عدد الديون: {selectedArchive.unpaidCount}
              </div>
            </div>

            {(selectedArchive.orders || []).map((order, index) => (
              <div
                key={index}
                className={`basket-item-card ${
                  order.paymentStatus === "unpaid" ? "history-unpaid-card" : ""
                }`}
              >
                <div className="basket-item-top">
                  <div style={{ width: "100%" }}>
                    <div className="basket-item-name">{order.customerName}</div>
                    <div className="basket-item-meta">
                      {order.phone || "بدون رقم"} • {order.pickupTime}
                    </div>

                    <div className="order-items-list" style={{ marginTop: "10px" }}>
                      {(order.items || []).map((item, i) => {
                        const lineTotal = getItemLineTotal(item, prices);

                        return (
                          <div key={i} className="order-item-line">
                            <span>
                              {item.name} — {item.summary}
                            </span>
                            <strong>{lineTotal} ₪</strong>
                          </div>
                        );
                      })}
                    </div>

                    <div className="history-order-total">
                      المجموع: {Number(order.total || 0)} ₪
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="order-actions" style={{ marginTop: "14px" }}>
              <button
                type="button"
                className="ghost-btn"
                onClick={() => handleDownloadPdf(selectedArchive)}
              >
                تنزيل PDF
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}