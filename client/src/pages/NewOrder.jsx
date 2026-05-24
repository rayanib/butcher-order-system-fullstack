import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import { StaticTimePicker } from "@mui/x-date-pickers/StaticTimePicker";
import { MobileTimePicker } from "@mui/x-date-pickers/MobileTimePicker";

import { GRILL_OPTIONS } from "../data/menu";
import { useOrders } from "../context/OrdersContext";
import {
  FUTURE_TIME_OPTIONS,
  KOFTA_EXTRAS,
  KOFTA_SPICES,
  PRODUCT_GROUPS,
  SHAWARMA_SPICES,
  TODAY_TIME_OPTIONS,
} from "../data/menu";

const QUICK_ADD_ITEMS = [
  { id: "shawarma-ready-1", label: "شاورما 1 كغم جاهز", type: "shawarma" },
  {
    id: "kofta-ready-1",
    label: "صفايح / كفته 1 كغم كل شي جاهز",
    type: "koftaReady",
  },
  { id: "hawsi-1", label: "حوسي 1 كغم", type: "simple", name: "حوسي" },
  { id: "na3meh-1", label: "ناعم 1 كغم", type: "simple", name: "لحمة ناعمة" },
];

function BasketItemCard({ item, onRemove, onDuplicate }) {
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

function ProductCard({ title, onClick, className = "" }) {
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

function cloneBasketItems(items = []) {
  return items.map((item) => ({
    ...item,
  }));
}

function getOrderTimestamp(order) {
  return (
    order?.createdAt ||
    order?.doneAt ||
    order?.pickupTime ||
    ""
  );
}

function NoteField({ note, onChange }) {
  return (
    <div className="money-input-wrap">
      <label>ملاحظة</label>
      <input
        type="text"
        value={note}
        onChange={(e) => onChange(e.target.value)}
        placeholder="اكتب ملاحظة"
      />
    </div>
  );
}

function SimpleItemModal({ title, priceKey, onClose, onConfirm }) {
  const [mode, setMode] = useState("kg");
  const [kg, setKg] = useState(1);
  const [money, setMoney] = useState(100);
  const [note, setNote] = useState("");

  return (
    <Modal title={`إضافة ${title}`} onClose={onClose}>
      <div className="modal-body">
        <div className="segmented">
          <button
            type="button"
            className={mode === "kg" ? "active" : ""}
            onClick={() => setMode("kg")}
          >
            كغم
          </button>
          <button
            type="button"
            className={mode === "money" ? "active" : ""}
            onClick={() => setMode("money")}
          >
            سعر
          </button>
        </div>

        {mode === "kg" ? (
          <div className="counter-row">
            <button
              type="button"
              onClick={() => setKg((v) => Math.max(0.5, v - 0.5))}
            >
              -
            </button>
            <div className="counter-value">{kg.toFixed(1)} كغم</div>
            <button type="button" onClick={() => setKg((v) => v + 0.5)}>
              +
            </button>
          </div>
        ) : (
          <div className="money-input-wrap">
            <label>السعر بالشيكل</label>
            <input
              type="number"
              min="1"
              value={money}
              onChange={(e) => setMoney(Number(e.target.value) || 0)}
            />
          </div>
        )}

        <NoteField note={note} onChange={setNote} />

        <button
          type="button"
          className="primary-btn"
          onClick={() =>
            onConfirm({
                name: title,
                priceKey: priceKey || title,
                mode,
                kg: mode === "kg" ? kg : null,
                money: mode === "money" ? money : null,
                note: note.trim(),
                summary: mode === "kg" ? `${kg.toFixed(1)} كغم` : `${money} ₪`,
                done: false,
              })
          }
        >
          إضافة إلى السلة
        </button>
      </div>
    </Modal>
  );
}

function ShawarmaModal({ onClose, onConfirm }) {
  const [mode, setMode] = useState("kg");
  const [kg, setKg] = useState(1);
  const [money, setMoney] = useState(100);
  const [spice, setSpice] = useState("مبهر");
  const [note, setNote] = useState("");

  return (
    <Modal title="إضافة شاورما" onClose={onClose}>
      <div className="modal-body">
        <div className="segmented">
          <button
            type="button"
            className={mode === "kg" ? "active" : ""}
            onClick={() => setMode("kg")}
          >
            كغم
          </button>
          <button
            type="button"
            className={mode === "money" ? "active" : ""}
            onClick={() => setMode("money")}
          >
            سعر
          </button>
        </div>

        {mode === "kg" ? (
          <div className="counter-row">
            <button
              type="button"
              onClick={() => setKg((v) => Math.max(0.5, v - 0.5))}
            >
              -
            </button>
            <div className="counter-value">{kg.toFixed(1)} كغم</div>
            <button type="button" onClick={() => setKg((v) => v + 0.5)}>
              +
            </button>
          </div>
        ) : (
          <div className="money-input-wrap">
            <label>السعر بالشيكل</label>
            <input
              type="number"
              min="1"
              value={money}
              onChange={(e) => setMoney(Number(e.target.value) || 0)}
            />
          </div>
        )}

        <div className="choice-block">
          <div className="choice-title">نوع البهار</div>
          <div className="choice-chips">
            {SHAWARMA_SPICES.map((option) => (
              <button
                key={option}
                type="button"
                className={spice === option ? "chip active" : "chip"}
                onClick={() => setSpice(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <NoteField note={note} onChange={setNote} />

        <button
          type="button"
          className="primary-btn"
          onClick={() =>
            onConfirm({
                    name: "شاورما",
                    mode,
                    kg: mode === "kg" ? kg : null,
                    money: mode === "money" ? money : null,
                    spice,
                    note: note.trim(),
                    summary:
                      mode === "kg"
                        ? `${kg.toFixed(1)} كغم • ${spice}`
                        : `${money} ₪ • ${spice}`,
                    done: false,
                  })
                            }
        >
          إضافة إلى السلة
        </button>
      </div>
    </Modal>
  );
}

function KoftaModal({ onClose, onConfirm }) {
  const [mode, setMode] = useState("kg");
  const [kg, setKg] = useState(1);
  const [money, setMoney] = useState(100);
  const [extras, setExtras] = useState([]);
  const [spice, setSpice] = useState("مبهر");
  const [note, setNote] = useState("");

  function toggleExtra(extra) {
    setExtras((prev) =>
      prev.includes(extra) ? prev.filter((x) => x !== extra) : [...prev, extra]
    );
  }

  return (
    <Modal title="إضافة صفايح / كفته" onClose={onClose}>
      <div className="modal-body">
        <div className="segmented">
          <button
            type="button"
            className={mode === "kg" ? "active" : ""}
            onClick={() => setMode("kg")}
          >
            كغم
          </button>
          <button
            type="button"
            className={mode === "money" ? "active" : ""}
            onClick={() => setMode("money")}
          >
            سعر
          </button>
        </div>

        {mode === "kg" ? (
          <div className="counter-row">
            <button
              type="button"
              onClick={() => setKg((v) => Math.max(0.5, v - 0.5))}
            >
              -
            </button>
            <div className="counter-value">{kg.toFixed(1)} كغم</div>
            <button type="button" onClick={() => setKg((v) => v + 0.5)}>
              +
            </button>
          </div>
        ) : (
          <div className="money-input-wrap">
            <label>السعر بالشيكل</label>
            <input
              type="number"
              min="1"
              value={money}
              onChange={(e) => setMoney(Number(e.target.value) || 0)}
            />
          </div>
        )}

        <div className="choice-block">
          <div className="choice-title">الإضافات</div>
          <div className="choice-chips">
            {KOFTA_EXTRAS.map((option) => (
              <button
                key={option}
                type="button"
                className={extras.includes(option) ? "chip active" : "chip"}
                onClick={() => toggleExtra(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="choice-block">
          <div className="choice-title">نوع البهار</div>
          <div className="choice-chips">
            {KOFTA_SPICES.map((option) => (
              <button
                key={option}
                type="button"
                className={spice === option ? "chip active" : "chip"}
                onClick={() => setSpice(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <NoteField note={note} onChange={setNote} />

        <button
          type="button"
          className="primary-btn"
          onClick={() => {
            const extrasText = extras.length ? ` • ${extras.join("، ")}` : "";
            const amountText =
              mode === "kg" ? `${kg.toFixed(1)} كغم` : `${money} ₪`;

            onConfirm({
                  name: "صفايح / كفته",
                  mode,
                  kg: mode === "kg" ? kg : null,
                  money: mode === "money" ? money : null,
                  spice,
                  extras,
                  note: note.trim(),
                  summary: `${amountText} • ${spice}${extrasText}`,
                  done: false,
                });
          }}
        >
          إضافة إلى السلة
        </button>
      </div>
    </Modal>
  );
}

function ReadyChoiceModal({ title, onClose, onConfirm }) {
  const [mode, setMode] = useState("kg");
  const [kg, setKg] = useState(1);
  const [money, setMoney] = useState(100);
  const [readyState, setReadyState] = useState("جاهز");
  const [note, setNote] = useState("");

  return (
    <Modal title={`إضافة ${title}`} onClose={onClose}>
      <div className="modal-body">
        <div className="segmented">
          <button
            type="button"
            className={mode === "kg" ? "active" : ""}
            onClick={() => setMode("kg")}
          >
            كغم
          </button>
          <button
            type="button"
            className={mode === "money" ? "active" : ""}
            onClick={() => setMode("money")}
          >
            سعر
          </button>
        </div>

        {mode === "kg" ? (
          <div className="counter-row">
            <button
              type="button"
              onClick={() => setKg((v) => Math.max(0.5, v - 0.5))}
            >
              -
            </button>
            <div className="counter-value">{kg.toFixed(1)} كغم</div>
            <button type="button" onClick={() => setKg((v) => v + 0.5)}>
              +
            </button>
          </div>
        ) : (
          <div className="money-input-wrap">
            <label>السعر بالشيكل</label>
            <input
              type="number"
              min="1"
              value={money}
              onChange={(e) => setMoney(Number(e.target.value) || 0)}
            />
          </div>
        )}

        <div className="choice-block">
          <div className="choice-title">الحالة</div>
          <div className="choice-chips">
            {["جاهز", "مش جاهز"].map((option) => (
              <button
                key={option}
                type="button"
                className={readyState === option ? "chip active" : "chip"}
                onClick={() => setReadyState(option)}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <NoteField note={note} onChange={setNote} />

        <button
          type="button"
          className="primary-btn"
          onClick={() =>
            onConfirm({
              name: title,
              priceKey: title,
              mode,
              kg: mode === "kg" ? kg : null,
              money: mode === "money" ? money : null,
              readyState,
              note: note.trim(),
              summary:
                mode === "kg"
                  ? `${kg.toFixed(1)} كغم • ${readyState}`
                  : `${money} ₪ • ${readyState}`,
              done: false,
            })
          }
        >
          إضافة إلى السلة
        </button>
      </div>
    </Modal>
  );
}


















function formatFutureDateForStorage(value) {
  if (!value || !dayjs(value).isValid()) return "";
  return dayjs(value).format("YYYY-MM-DD HH:mm");
}

function dayjsFromTimeString(value) {
  if (!value || !value.includes(":")) {
    return dayjs()
      .year(2026)
      .month(0)
      .date(1)
      .hour(7)
      .minute(0)
      .second(0)
      .millisecond(0);
  }

  const [hours, minutes] = value.split(":");

  return dayjs()
    .year(2026)
    .month(0)
    .date(1)
    .hour(Number(hours))
    .minute(Number(minutes))
    .second(0)
    .millisecond(0);
}


function GrillOptionsModal({ base, onClose, onSelect }) {
  return (
    <Modal title={`اختيار نوع ${base}`} onClose={onClose}>
      <div className="modal-body">
        <div className="products-grid">
          {GRILL_OPTIONS.map((option) => (
            <button
              key={option}
              className="product-card"
              onClick={() =>
                onSelect({
                  name: `${base} ${option}`,
                  priceKey: base,
                })
              }
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
}


















export default function NewOrder() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    addOrder,
    updateOrder,
    customerNames,
    customerProfiles,
    rememberCustomerProfile,
    orders,
    futureOrders,
    history,
  } = useOrders();

  const editState = location.state;
  const isEdit = Boolean(editState?.editMode);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [serviceType, setServiceType] = useState("استلام");
  const [isFuture, setIsFuture] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [futureDateTime, setFutureDateTime] = useState(dayjs());
  const [selectedCategory, setSelectedCategory] = useState(
    Object.keys(PRODUCT_GROUPS)[0]
  );
  const [basket, setBasket] = useState([]);
  const [openModal, setOpenModal] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [selectedQuickTime, setSelectedQuickTime] = useState("");
  const [showAdvancedTime, setShowAdvancedTime] = useState(false);
  const [entryStep, setEntryStep] = useState("customer");

  useEffect(() => {
  if (isEdit && editState?.order) {
    const order = editState.order;

    setCustomerName(order.customerName || "");
    setPhone(order.phone || "");
    setCustomerCode(order.customerCode || "");
    setServiceType(order.serviceType || "استلام");
    setIsFuture(Boolean(order.isFuture));
    setOrderNote(order.orderNote || "");
    setBasket(order.items || []);
    setSelectedQuickTime("");
    setEntryStep((order.items || []).length ? "time" : "items");

    if (order.isFuture) {
      if (order.pickupTime) {
        const parsed = dayjs(order.pickupTime.replace(" ", "T"));
        setFutureDateTime(parsed.isValid() ? parsed : dayjs());
      }
    } else {
      setPickupTime(order.pickupTime || "");
    }
  }
}, [isEdit, editState]);

  const suggestions = useMemo(() => {
    const q = customerName.trim().toLowerCase();
    if (!q) return [];

    const matches = customerNames
      .filter((name) => name.toLowerCase().includes(q))
      .slice(0, 5);

    const exactMatch = matches.some(
      (name) => name.trim().toLowerCase() === q
    );

    return exactMatch ? [] : matches;
  }, [customerName, customerNames]);

  const allKnownOrders = useMemo(
    () => [...orders, ...futureOrders, ...history],
    [orders, futureOrders, history]
  );

  const customerLookup = useMemo(() => {
    return customerProfiles;
  }, [customerProfiles]);

  const customerProfileList = useMemo(
    () => Array.from(customerLookup.values()),
    [customerLookup]
  );

  const phoneSuggestions = useMemo(() => {
    const q = phone.trim();
    if (!q) return [];

    return customerProfileList
      .filter((entry) => {
        const phoneValue = (entry.phone || "").trim();
        const codeValue = (entry.customerCode || "").toLowerCase();
        const normalizedQuery = q.toLowerCase();
        const matchesLastDigits =
          q.length >= 3 && phoneValue.length >= q.length && phoneValue.endsWith(q);

        return (
          phoneValue.includes(q) ||
          matchesLastDigits ||
          codeValue.includes(normalizedQuery)
        );
      })
      .slice(0, 5);
  }, [phone, customerProfileList]);

  const matchedCustomerEntry = useMemo(() => {
    const phoneQuery = phone.trim();
    const nameQuery = customerName.trim().toLowerCase();

    if (phoneQuery.length >= 3) {
      const exactPhoneMatches = customerProfileList.filter((entry) =>
        (entry.phone || "").trim().endsWith(phoneQuery)
      );

      if (exactPhoneMatches.length === 1) {
        return exactPhoneMatches[0];
      }
    }

    if (nameQuery) {
      const exactNameMatches = customerProfileList.filter(
        (entry) => (entry.customerName || "").trim().toLowerCase() === nameQuery
      );

      if (exactNameMatches.length === 1) {
        return exactNameMatches[0];
      }
    }

    return null;
  }, [phone, customerName, customerProfileList]);

  const recentCustomerOrders = useMemo(() => {
    const phoneQuery = phone.trim();
    const nameQuery = customerName.trim().toLowerCase();

    if (!phoneQuery && !nameQuery) return [];

    return allKnownOrders
      .filter((order) => {
        const samePhone =
          phoneQuery && (order.phone || "").trim() === phoneQuery;
        const sameName =
          nameQuery &&
          (order.customerName || "").trim().toLowerCase() === nameQuery;

        return samePhone || sameName;
      })
      .sort((a, b) => getOrderTimestamp(b).localeCompare(getOrderTimestamp(a)))
      .filter((order, index, arr) => {
        const signature = JSON.stringify({
          serviceType: order.serviceType,
          items: order.items,
        });

        return (
          arr.findIndex(
            (candidate) =>
              JSON.stringify({
                serviceType: candidate.serviceType,
                items: candidate.items,
              }) === signature
          ) === index
        );
      })
      .slice(0, 3);
  }, [allKnownOrders, customerName, phone]);

  const customerFutureBookings = useMemo(() => {
    const phoneQuery = phone.trim();
    const nameQuery = customerName.trim().toLowerCase();

    if (!phoneQuery && !nameQuery) return [];

    return futureOrders
      .filter((order) => {
        const samePhone = phoneQuery && (order.phone || "").trim() === phoneQuery;
        const sameName =
          nameQuery &&
          (order.customerName || "").trim().toLowerCase() === nameQuery;

        return samePhone || sameName;
      })
      .slice(0, 3);
  }, [futureOrders, customerName, phone]);

  const currentProducts = PRODUCT_GROUPS[selectedCategory] || [];
  const timeOptions = isFuture ? FUTURE_TIME_OPTIONS : TODAY_TIME_OPTIONS;
  const hasCustomerIdentity = Boolean(phone.trim() || customerName.trim());
  const showItemsStep =
    hasCustomerIdentity && (entryStep === "items" || entryStep === "time");
  const showTimeStep = basket.length > 0 && entryStep === "time";
  const activePickupLabel = isFuture
    ? futureDateTime.format("DD/MM/YYYY HH:mm")
    : pickupTime || "لم يحدد بعد";

  function applyCustomerLookup(entry) {
    setCustomerName(entry.customerName || "");
    setPhone(entry.phone || "");
    setCustomerCode(entry.customerCode || "");
  }

  function moveToItemsStep() {
    if (!hasCustomerIdentity) return;

    rememberCustomerProfile(customerName, phone, customerCode);
    setEntryStep("items");
  }

  useEffect(() => {
    if (entryStep !== "customer" && !hasCustomerIdentity) {
      setEntryStep("customer");
      return;
    }

    if (entryStep === "time" && basket.length === 0) {
      setEntryStep("items");
    }
  }, [entryStep, hasCustomerIdentity, basket.length]);

  function applyCustomerName(name) {
    const matchedEntry = customerProfileList.find(
      (entry) => entry.customerName === name
    );

    if (matchedEntry) {
      applyCustomerLookup(matchedEntry);
      return;
    }

    setCustomerName(name);
  }

  function applyRecentOrder(order) {
    setBasket(cloneBasketItems(order.items || []));
    setServiceType(order.serviceType || "استلام");
  }

  function handleQuickAddItem(quickItem) {
    if (quickItem.type === "shawarma") {
      setBasket((prev) => [
        {
          name: "شاورما",
          mode: "kg",
          kg: 1,
          money: null,
          spice: SHAWARMA_SPICES[0] || "مبهر",
          note: "",
          summary: `1.0 كغم • ${SHAWARMA_SPICES[0] || "مبهر"} • جاهز`,
          done: false,
        },
        ...prev,
      ]);
      setEntryStep("items");
      return;
    }

    if (quickItem.type === "koftaReady") {
      const readyExtras = [...KOFTA_EXTRAS];
      const readySpice = KOFTA_SPICES[0] || "مبهر";
      const extrasText = readyExtras.length ? ` • ${readyExtras.join("، ")}` : "";

      setBasket((prev) => [
        {
          name: "صفايح / كفته",
          mode: "kg",
          kg: 1,
          money: null,
          spice: readySpice,
          extras: readyExtras,
          note: "",
          summary: `1.0 كغم • ${readySpice}${extrasText} • كل شي جاهز`,
          done: false,
        },
        ...prev,
      ]);
      setEntryStep("items");
      return;
    }

    setBasket((prev) => [
      {
        name: quickItem.name,
        priceKey: quickItem.name,
        mode: "kg",
        kg: 1,
        money: null,
        note: "",
        summary: "1.0 كغم",
        done: false,
      },
      ...prev,
    ]);
    setEntryStep("items");
  }

  function duplicateBasketItem(index) {
    setBasket((prev) => {
      const item = prev[index];
      if (!item) return prev;

      const duplicatedItem = { ...item };
      const next = [...prev];
      next.splice(index + 1, 0, duplicatedItem);
      return next;
    });
  }

  function handleProductClick(product) {
  setActiveProduct(product);

  if (product.type === "shawarma") {
    setOpenModal("shawarma");
    return;
  }

  if (product.type === "kofta") {
    setOpenModal("kofta");
    return;
  }

  if (product.type === "grillParent") {
    setOpenModal("grillOptions");
    return;
  }

  if (product.type === "readyChoice") {
    setOpenModal("readyChoice");
    return;
  }

  setOpenModal("simple");
}
  function saveOrder() {
    if (!customerName.trim()) {
      alert("اكتب اسم الزبون");
      return;
    }

    if (basket.length === 0) {
      alert("أضف أصناف أولاً");
      return;
    }

    const finalPickupTime = isFuture
      ? formatFutureDateForStorage(futureDateTime)
      : pickupTime;

    if (!finalPickupTime) {
      alert("اختر وقت الطلب");
      return;
    }


    const orderData = {
      customerName: customerName.trim(),
      phone: phone.trim(),
      customerCode: customerCode.trim(),
      serviceType,
      isFuture,
      pickupTime: finalPickupTime,
      orderNote: orderNote.trim(),
      items: basket,
      paymentStatus: isEdit
        ? editState?.order?.paymentStatus || "paid"
        : "paid",
      createdAt: isEdit
        ? editState?.order?.createdAt || new Date().toISOString()
        : new Date().toISOString(),
    };

    if (isEdit) {
      updateOrder(editState.source, editState.index, orderData);
    } else {
      addOrder(orderData);
    }

    navigate(isFuture ? "/future" : "/");
  }

  return (
    <>
      {entryStep === "customer" && (
      <section className="customer-start-panel card">
        <div className="panel-title-row">
          <div>
            <div className="new-order-kicker">{"\u0627\u0644\u062e\u0637\u0648\u0629 1"}</div>
            <h2>{"\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0632\u0628\u0648\u0646"}</h2>
          </div>
          <span className="soft-badge">{customerCode || "\u0643\u0648\u062f \u062a\u0644\u0642\u0627\u0626\u064a"}</span>
        </div>

        <div className="customer-start-grid">
          <div className="form-block">
            <label>{"\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641"}</label>
            <input
              type="tel"
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !hasCustomerIdentity) return;
                event.preventDefault();
                moveToItemsStep();
              }}
              placeholder={"\u0627\u0643\u062a\u0628 \u0622\u062e\u0631 3 \u0623\u0631\u0642\u0627\u0645 \u0623\u0648 \u0627\u0644\u0631\u0642\u0645 \u0643\u0627\u0645\u0644"}
            />

            {phoneSuggestions.length > 0 && (
              <div className="suggestions-box">
                {phoneSuggestions.map((entry, index) => (
                  <button
                    key={(entry.phone || entry.customerName) + "-" + index}
                    type="button"
                    className="suggestion-item"
                    onClick={() => applyCustomerLookup(entry)}
                  >
                    {entry.customerName}
                    {entry.phone ? " \u2022 " + entry.phone : ""}
                    {entry.customerCode ? " \u2022 " + entry.customerCode : ""}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-block">
            <label>{"\u0627\u0633\u0645 \u0627\u0644\u0632\u0628\u0648\u0646"}</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              onKeyDown={(event) => {
                if (event.key !== "Enter" || !hasCustomerIdentity) return;
                event.preventDefault();
                moveToItemsStep();
              }}
              placeholder={"\u064a\u0638\u0647\u0631 \u0627\u0644\u0627\u0633\u0645 \u062a\u0644\u0642\u0627\u0626\u064a\u0627\u064b \u0623\u0648 \u0627\u0643\u062a\u0628 \u0627\u0644\u0627\u0633\u0645"}
            />

            {suggestions.length > 0 && (
              <div className="suggestions-box">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="suggestion-item"
                    onClick={() => applyCustomerName(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {matchedCustomerEntry && (
          <button
            type="button"
            className="customer-match-card"
            onClick={() => applyCustomerLookup(matchedCustomerEntry)}
          >
            <span className="customer-match-kicker">
              {"\u0627\u0644\u0632\u0628\u0648\u0646 \u0627\u0644\u0645\u0637\u0627\u0628\u0642"}
            </span>
            <strong>{matchedCustomerEntry.customerName || phone}</strong>
            <span>
              {matchedCustomerEntry.phone || "\u0628\u062f\u0648\u0646 \u0647\u0627\u062a\u0641"}
            </span>
            <span>{matchedCustomerEntry.customerCode || "\u0643\u0648\u062f \u062a\u0644\u0642\u0627\u0626\u064a"}</span>
          </button>
        )}

        {(recentCustomerOrders.length > 0 || customerFutureBookings.length > 0) && (
          <div className="customer-insight-grid compact-customer-insights">
            {recentCustomerOrders.length > 0 && (
              <div className="form-block mini-panel-block">
                <label>{"\u0622\u062e\u0631 \u0637\u0644\u0628\u0627\u062a \u0627\u0644\u0632\u0628\u0648\u0646"}</label>
                <div className="suggestions-box compact-suggestions-box">
                  {recentCustomerOrders.map((order, index) => (
                    <button
                      key={getOrderTimestamp(order) + "-" + index}
                      type="button"
                      className="suggestion-item"
                      onClick={() => applyRecentOrder(order)}
                    >
                      {(order.items || []).map((item) => item.name).join("\u060C ")}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {customerFutureBookings.length > 0 && (
              <div className="form-block mini-panel-block">
                <label>{"\u062d\u062c\u0648\u0632\u0627\u062a \u0645\u0633\u062a\u0642\u0628\u0644\u064a\u0629 \u0644\u0646\u0641\u0633 \u0627\u0644\u0632\u0628\u0648\u0646"}</label>
                <div className="suggestions-box compact-suggestions-box">
                  {customerFutureBookings.map((order, index) => (
                    <div
                      key={order.pickupTime + "-" + index}
                      className="suggestion-item"
                      style={{ cursor: "default" }}
                    >
                      {order.pickupTime} {" \u2022 "} {(order.items || []).map((item) => item.name).join("\u060C ")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="customer-start-actions">
          <button
            type="button"
            className="primary-btn"
            onClick={moveToItemsStep}
            disabled={!hasCustomerIdentity}
          >
            {"\u0645\u062a\u0627\u0628\u0639\u0629 \u0625\u0644\u0649 \u0627\u0644\u0623\u0635\u0646\u0627\u0641"}
          </button>
        </div>
      </section>
      )}

      {entryStep === "items" && showItemsStep && (
        <div className="new-order-page new-order-page-flow">
          <section className="products-side card">
            <div className="panel-title-row">
              <div>
                <div className="new-order-kicker">{"\u0627\u0644\u062e\u0637\u0648\u0629 2"}</div>
                <h2>{"\u0627\u062e\u062a\u0631 \u0627\u0644\u0623\u0635\u0646\u0627\u0641"}</h2>
              </div>
              <span className="soft-badge">{currentProducts.length} {"\u062e\u064a\u0627\u0631"}</span>
            </div>

            <div className="category-scroll-wrap">
              <div className="category-chips compact-category-chips">
                {Object.keys(PRODUCT_GROUPS).map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={
                      selectedCategory === category
                        ? "category-chip active"
                        : "category-chip"
                    }
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="products-grid compact-products-grid">
              {currentProducts.map((product) => (
                <ProductCard
                  key={product.name}
                  title={product.name}
                  onClick={() => handleProductClick(product)}
                />
              ))}
            </div>
          </section>

          <section className="basket-side card order-cart-panel">
            <div className="panel-title-row">
              <div>
                <div className="new-order-kicker">{"\u0627\u0644\u0637\u0644\u0628 \u0627\u0644\u062d\u0627\u0644\u064a"}</div>
                <h2>{"\u0627\u0644\u0633\u0644\u0629"}</h2>
              </div>
              <span className="soft-badge">{basket.length} {"\u0635\u0646\u0641"}</span>
            </div>

            <div className="step-summary-row">
              <span className="basket-summary-pill">{customerName || phone}</span>
              <button
                type="button"
                className="ghost-btn mini-ghost-btn"
                onClick={() => setEntryStep("customer")}
              >
                {"\u0631\u062c\u0648\u0639"}
              </button>
            </div>

            <div className="basket-panel">
              <div className="basket-list">
                {basket.length === 0 ? (
                  <div className="empty-soft">{"\u0623\u0636\u0641 \u0623\u0648\u0644 \u0635\u0646\u0641 \u0644\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0625\u0644\u0649 \u0627\u0644\u0645\u0648\u0639\u062f"}</div>
                ) : (
                  basket.map((item, index) => (
                    <BasketItemCard
                      key={item.name + "-" + index}
                      item={item}
                      onDuplicate={() => duplicateBasketItem(index)}
                      onRemove={() =>
                        setBasket((prev) => prev.filter((_, i) => i !== index))
                      }
                    />
                  ))
                )}
              </div>
            </div>

            <div className="form-block order-note-block">
              <label>{"\u0645\u0644\u0627\u062d\u0638\u0629 \u0639\u0644\u0649 \u0627\u0644\u0637\u0644\u0628"}</label>
              <textarea
                value={orderNote}
                onChange={(event) => setOrderNote(event.target.value)}
                rows={3}
                placeholder={"\u0645\u062b\u0644\u0627\u064b: \u062e\u0628\u0632\u0629 \u0648\u0627\u062d\u062f\u0629\u060c \u0627\u0644\u0644\u062d\u0645 \u0645\u062e\u0644\u0648\u0637"}
              />
            </div>

            <div className="customer-start-actions">
              <button
                type="button"
                className="primary-btn"
                onClick={() => setEntryStep("time")}
                disabled={basket.length === 0}
              >
                {"\u0645\u062a\u0627\u0628\u0639\u0629 \u0625\u0644\u0649 \u0627\u0644\u0645\u0648\u0639\u062f"}
              </button>
            </div>
          </section>
        </div>
      )}

      {entryStep === "time" && showTimeStep && (
        <section className="time-save-panel card">
          <div className="panel-title-row">
            <div>
              <div className="new-order-kicker">{"\u0627\u0644\u062e\u0637\u0648\u0629 3"}</div>
              <h2>{"\u0627\u0644\u0645\u0648\u0639\u062f \u0648\u0627\u0644\u062d\u0641\u0638"}</h2>
            </div>
            <span className="soft-badge">{basket.length} {"\u0635\u0646\u0641"}</span>
          </div>

          <div className="step-summary-row">
            <span className="basket-summary-pill">{customerName || phone}</span>
            <button
              type="button"
              className="ghost-btn mini-ghost-btn"
              onClick={() => setEntryStep("items")}
            >
              {"\u0631\u062c\u0648\u0639 \u0644\u0644\u0623\u0635\u0646\u0627\u0641"}
            </button>
          </div>

          <div className="time-save-grid">
            <div className="form-block">
              <label>{"\u0646\u0648\u0639 \u0627\u0644\u0648\u0642\u062a"}</label>
              <div className="segmented">
                <button
                  type="button"
                  className={!isFuture ? "active" : ""}
                  onClick={() => {
                    setIsFuture(false);
                    setShowAdvancedTime(false);
                  }}
                >
                  {"\u0627\u0644\u064a\u0648\u0645"}
                </button>
                <button
                  type="button"
                  className={isFuture ? "active" : ""}
                  onClick={() => {
                    setIsFuture(true);
                    setShowAdvancedTime(false);
                  }}
                >
                  {"\u0645\u0633\u062a\u0642\u0628\u0644\u064a"}
                </button>
              </div>
            </div>

            <div className="form-block">
              <label>{"\u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u0637\u0644\u0628"}</label>
              <div className="segmented">
                <button
                  type="button"
                  className={serviceType === "\u0627\u0633\u062a\u0644\u0627\u0645" ? "active" : ""}
                  onClick={() => setServiceType("\u0627\u0633\u062a\u0644\u0627\u0645")}
                >
                  {"\u0627\u0633\u062a\u0644\u0627\u0645"}
                </button>
                <button
                  type="button"
                  className={serviceType === "\u062a\u0648\u0635\u064a\u0644" ? "active" : ""}
                  onClick={() => setServiceType("\u062a\u0648\u0635\u064a\u0644")}
                >
                  {"\u062a\u0648\u0635\u064a\u0644"}
                </button>
              </div>
            </div>
          </div>

          <div className="form-block time-panel-block">
            <div className="time-panel-head">
              <label>{isFuture ? "\u0627\u062e\u062a\u0631 \u0627\u0644\u0645\u0648\u0639\u062f \u0627\u0644\u0645\u0633\u062a\u0642\u0628\u0644\u064a" : "\u0627\u062e\u062a\u0631 \u0648\u0642\u062a \u0627\u0644\u0627\u0633\u062a\u0644\u0627\u0645"}</label>
              <button
                type="button"
                className="ghost-btn mini-ghost-btn"
                onClick={() => setShowAdvancedTime((prev) => !prev)}
              >
                {showAdvancedTime ? "\u0625\u062e\u0641\u0627\u0621 \u0627\u0644\u0633\u0627\u0639\u0629" : "\u0627\u062e\u062a\u064a\u0627\u0631 \u0628\u0627\u0644\u0633\u0627\u0639\u0629"}
              </button>
            </div>

            {!isFuture && (
              <div className="time-picker-wrap">
                <div className="time-options-grid compact-time-options-grid">
                  {timeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={selectedQuickTime === option ? "time-chip active" : "time-chip"}
                      onClick={() => {
                        const now = dayjs();
                        setSelectedQuickTime(option);
                        setShowAdvancedTime(false);

                        if (option === "\u0628\u0639\u062f 5 \u062f\u0642\u0627\u0626\u0642") {
                          setPickupTime(now.add(5, "minute").format("HH:mm"));
                        } else if (option === "\u0628\u0639\u062f 10 \u062f\u0642\u0627\u0626\u0642") {
                          setPickupTime(now.add(10, "minute").format("HH:mm"));
                        } else if (option === "\u0628\u0639\u062f 15 \u062f\u0642\u064a\u0642\u0629") {
                          setPickupTime(now.add(15, "minute").format("HH:mm"));
                        } else if (option === "\u0628\u0639\u062f 30 \u062f\u0642\u064a\u0642\u0629") {
                          setPickupTime(now.add(30, "minute").format("HH:mm"));
                        } else if (option === "\u0628\u0639\u062f \u0633\u0627\u0639\u0629") {
                          setPickupTime(now.add(1, "hour").format("HH:mm"));
                        } else if (option === "\u0628\u0639\u062f \u0633\u0627\u0639\u062a\u064a\u0646") {
                          setPickupTime(now.add(2, "hour").format("HH:mm"));
                        }
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>

                {showAdvancedTime && (
                  <div className="mui-picker-wrap" dir="ltr">
                    <label className="mini-label" style={{ direction: "rtl", display: "block" }}>
                      {"\u0623\u0648 \u0627\u062e\u062a\u0631 \u0627\u0644\u0648\u0642\u062a \u0628\u0627\u0644\u0633\u0627\u0639\u0629"}
                    </label>

                    <StaticTimePicker
                      ampm={true}
                      displayStaticWrapperAs="mobile"
                      openTo="hours"
                      views={["hours", "minutes"]}
                      minutesStep={5}
                      value={dayjsFromTimeString(pickupTime)}
                      onChange={(value) => {
                        if (value && dayjs(value).isValid()) {
                          setPickupTime(dayjs(value).format("HH:mm"));
                          setSelectedQuickTime("");
                        }
                      }}
                      slotProps={{
                        actionBar: {
                          actions: ["cancel", "accept"],
                        },
                        toolbar: {
                          hidden: false,
                        },
                      }}
                    />
                  </div>
                )}
              </div>
            )}

            {isFuture && !showAdvancedTime && (
              <div className="future-date-preview">
                <span className="basket-summary-pill basket-summary-pill-strong">
                  {futureDateTime.format("DD/MM/YYYY")}
                </span>
                <span className="basket-summary-pill">
                  {futureDateTime.format("HH:mm")}
                </span>
              </div>
            )}

            {isFuture && showAdvancedTime && (
              <div className="time-picker-wrap">
                <div className="native-input-wrap">
                  <label className="mini-label">{"\u0627\u062e\u062a\u0631 \u0627\u0644\u062a\u0627\u0631\u064a\u062e"}</label>
                  <input
                    type="date"
                    className="native-date-input"
                    value={futureDateTime.format("YYYY-MM-DD")}
                    min={dayjs().format("YYYY-MM-DD")}
                    onChange={(e) => {
                      const selectedDate = e.target.value;
                      if (!selectedDate) return;

                      const currentTime = futureDateTime.isValid() ? futureDateTime : dayjs();

                      setFutureDateTime(
                        dayjs(selectedDate)
                          .hour(currentTime.hour())
                          .minute(currentTime.minute())
                          .second(0)
                          .millisecond(0)
                      );
                    }}
                  />
                </div>

                <div className="mui-picker-wrap" dir="ltr">
                  <label className="mini-label" style={{ direction: "rtl", display: "block" }}>
                    {"\u0627\u062e\u062a\u0631 \u0627\u0644\u0648\u0642\u062a"}
                  </label>

                  <StaticTimePicker
                    ampm={true}
                    displayStaticWrapperAs="mobile"
                    openTo="hours"
                    views={["hours", "minutes"]}
                    minutesStep={5}
                    value={futureDateTime}
                    onChange={(value) => {
                      if (value && dayjs(value).isValid()) {
                        setFutureDateTime((prev) =>
                          prev
                            .hour(dayjs(value).hour())
                            .minute(dayjs(value).minute())
                            .second(0)
                            .millisecond(0)
                        );
                      }
                    }}
                    slotProps={{
                      actionBar: {
                        actions: ["cancel", "accept"],
                      },
                      toolbar: {
                        hidden: false,
                      },
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="basket-summary-strip">
            <span className="basket-summary-pill">{serviceType}</span>
            <span className="basket-summary-pill basket-summary-pill-strong">{activePickupLabel}</span>
          </div>

          <button type="button" className="save-order-btn" onClick={saveOrder}>
            {isEdit ? "\u062d\u0641\u0638 \u0627\u0644\u062a\u0639\u062f\u064a\u0644" : "\u062d\u0641\u0638 \u0627\u0644\u0637\u0644\u0628"}
          </button>
        </section>
      )}
      {openModal === "simple" && activeProduct && (
            <SimpleItemModal
              title={activeProduct.name}
              priceKey={activeProduct.priceKey}
              onClose={() => {
                setOpenModal(null);
                setActiveProduct(null);
              }}
              onConfirm={(item) => {
                  setBasket((prev) => [...prev, item]);
                  setEntryStep("items");
                  setOpenModal(null);
                  setActiveProduct(null);
                }}
            />
          )}
      {openModal === "shawarma" && (
        <ShawarmaModal
          onClose={() => {
            setOpenModal(null);
            setActiveProduct(null);
          }}
          onConfirm={(item) => {
            setBasket((prev) => [...prev, item]);
            setEntryStep("items");
            setOpenModal(null);
            setActiveProduct(null);
          }}
        />
      )}

      {openModal === "kofta" && (
        <KoftaModal
          onClose={() => {
            setOpenModal(null);
            setActiveProduct(null);
          }}
          onConfirm={(item) => {
            setBasket((prev) => [...prev, item]);
            setOpenModal(null);
            setActiveProduct(null);
          }}
        />
      )}
       {openModal === "grillOptions" && activeProduct && (
        <GrillOptionsModal
          base={activeProduct.name}
          onClose={() => {
            setOpenModal(null);
            setActiveProduct(null);
          }}
          onSelect={(productData) => {
            setOpenModal("simple");
            setActiveProduct(productData);
          }}
        />
      )}

      {openModal === "readyChoice" && activeProduct && (
        <ReadyChoiceModal
          title={activeProduct.name}
          onClose={() => {
            setOpenModal(null);
            setActiveProduct(null);
          }}
          onConfirm={(item) => {
            setBasket((prev) => [...prev, item]);
            setOpenModal(null);
            setActiveProduct(null);
          }}
        />
)}






    </>
  );
}
  
