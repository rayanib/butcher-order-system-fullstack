export function BasketItemCard({ item, onRemove, onDuplicate }) {
  return (
    <div className="basket-item-card">
      <div className="basket-item-top">
        <div>
          <div className="basket-item-name">{item.name}</div>
          <div className="basket-item-meta">{item.summary}</div>
          {item.note ? <div className="basket-item-meta">{item.note}</div> : null}
        </div>

        <div className="basket-item-actions">
          <button className="ghost-btn" type="button" onClick={onDuplicate}>
            نفس الصنف
          </button>
          <button className="danger-icon-btn" type="button" onClick={onRemove}>
            حذف
          </button>
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ title, onClick, className = "" }) {
  return (
    <button
      type="button"
      className={`product-card ${className}`.trim()}
      onClick={onClick}
    >
      <span>{title}</span>
      <span className="product-card-plus">+</span>
    </button>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(event) => event.stopPropagation()} dir="rtl">
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

export function NoteField({ note, onChange }) {
  return (
    <div className="money-input-wrap">
      <label>ملاحظة</label>
      <input
        type="text"
        value={note}
        onChange={(event) => onChange(event.target.value)}
        placeholder="اكتب ملاحظة"
      />
    </div>
  );
}
