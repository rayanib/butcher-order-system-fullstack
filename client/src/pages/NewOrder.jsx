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

function BasketItemCard({ item, onRemove }) {
  return (
    <div className="basket-item-card">
      <div className="basket-item-top">
        <div>
          <div className="basket-item-name">{item.name}</div>
          <div className="basket-item-meta">{item.summary}</div>
        </div>

        <button className="danger-icon-btn" type="button" onClick={onRemove}>
          حذف
        </button>
      </div>
    </div>
  );
}

function ProductCard({ title, onClick }) {
  return (
    <button type="button" className="product-card" onClick={onClick}>
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

function SimpleItemModal({ title, priceKey, onClose, onConfirm }) {
  const [mode, setMode] = useState("kg");
  const [kg, setKg] = useState(1);
  const [money, setMoney] = useState(100);

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
  const { addOrder, updateOrder, customerNames } = useOrders();

  const editState = location.state;
  const isEdit = Boolean(editState?.editMode);

  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceType, setServiceType] = useState("استلام");
  const [isFuture, setIsFuture] = useState(false);
  const [pickupTime, setPickupTime] = useState("");
  const [futureDateTime, setFutureDateTime] = useState(dayjs());
  const [selectedCategory, setSelectedCategory] = useState(
    Object.keys(PRODUCT_GROUPS)[0]
  );
  const [basket, setBasket] = useState([]);
  const [openModal, setOpenModal] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);

  useEffect(() => {
  if (isEdit && editState?.order) {
    const order = editState.order;

    setCustomerName(order.customerName || "");
    setPhone(order.phone || "");
    setServiceType(order.serviceType || "استلام");
    setIsFuture(Boolean(order.isFuture));
    setBasket(order.items || []);
    setSelectedQuickTime("");

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

  const currentProducts = PRODUCT_GROUPS[selectedCategory] || [];
  const timeOptions = isFuture ? FUTURE_TIME_OPTIONS : TODAY_TIME_OPTIONS;
  
  const [selectedQuickTime, setSelectedQuickTime] = useState("");





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
      serviceType,
      isFuture,
      pickupTime: finalPickupTime,
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
      <div className="new-order-page">
        <section className="basket-side card">
          <div className="panel-title-row">
            <h2>السلة</h2>
            <span className="soft-badge">{basket.length} صنف</span>
          </div>

          <div className="basket-list">
            {basket.length === 0 ? (
              <div className="empty-soft">الطلب فارغ</div>
            ) : (
              basket.map((item, index) => (
                <BasketItemCard
                  key={`${item.name}-${index}`}
                  item={item}
                  onRemove={() =>
                    setBasket((prev) => prev.filter((_, i) => i !== index))
                  }
                />
              ))
            )}
          </div>

          <button type="button" className="save-order-btn" onClick={saveOrder}>
            {isEdit ? "حفظ التعديل" : "حفظ الطلب"}
          </button>
        </section>

        <section className="products-side card">
          <div className="panel-title-row">
            <h2>الأصناف</h2>
          </div>

          <div className="category-chips">
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

          <div className="products-grid">
            {currentProducts.map((product) => (
              <ProductCard
                key={product.name}
                title={product.name}
                onClick={() => handleProductClick(product)}
              />
            ))}
          </div>
        </section>

        <section className="info-side card">
          <div className="panel-title-row">
            <h2>بيانات الطلب</h2>
          </div>

          <div className="form-block">
            <label>اسم الزبون</label>
            <input
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="اكتب اسم الزبون"
            />

            {suggestions.length > 0 && (
              <div className="suggestions-box">
                {suggestions.map((name) => (
                  <button
                    key={name}
                    type="button"
                    className="suggestion-item"
                    onClick={() => setCustomerName(name)}
                  >
                    {name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="form-block">
            <label>رقم الهاتف</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="اختياري"
            />
          </div>

          <div className="form-block">
            <label>طريقة الطلب</label>
            <div className="segmented">
              <button
                type="button"
                className={serviceType === "استلام" ? "active" : ""}
                onClick={() => setServiceType("استلام")}
              >
                استلام
              </button>
              <button
                type="button"
                className={serviceType === "توصيل" ? "active" : ""}
                onClick={() => setServiceType("توصيل")}
              >
                توصيل
              </button>
            </div>
          </div>

          <div className="form-block">
            <label>نوع الوقت</label>
            <div className="segmented">
              <button
                type="button"
                className={!isFuture ? "active" : ""}
                onClick={() => setIsFuture(false)}
              >
                اليوم
              </button>
              <button
                type="button"
                className={isFuture ? "active" : ""}
                onClick={() => setIsFuture(true)}
              >
                مستقبلي
              </button>
            </div>
          </div>

          <div className="form-block">
            <label>{isFuture ? "اختر الموعد المستقبلي" : "اختر وقت الاستلام"}</label>

            {!isFuture && (
              <div className="time-picker-wrap">
                <div className="time-options-grid">
                  {timeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={
                        selectedQuickTime === option ? "time-chip active" : "time-chip"
                      }
                      onClick={() => {
                        const now = dayjs();
                        setSelectedQuickTime(option);

                        if (option === "بعد 5 دقائق") {
                          setPickupTime(now.add(5, "minute").format("HH:mm"));
                        } else if (option === "بعد 10 دقائق") {
                          setPickupTime(now.add(10, "minute").format("HH:mm"));
                        } else if (option === "بعد 15 دقيقة") {
                          setPickupTime(now.add(15, "minute").format("HH:mm"));
                        } else if (option === "بعد 30 دقيقة") {
                          setPickupTime(now.add(30, "minute").format("HH:mm"));
                        } else if (option === "بعد ساعة") {
                          setPickupTime(now.add(1, "hour").format("HH:mm"));
                        } else if (option === "بعد ساعتين") {
                          setPickupTime(now.add(2, "hour").format("HH:mm"));
                        }
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>

               <div className="mui-picker-wrap" dir="ltr">
                  <label className="mini-label" style={{ direction: "rtl", display: "block" }}>
                    أو اختر الوقت بالساعة
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
              </div>
            )}
              {isFuture && (
                <div className="time-picker-wrap">
                  <div className="native-input-wrap">
                    <label className="mini-label">اختر التاريخ</label>
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
                    <label
                      className="mini-label"
                      style={{ direction: "rtl", display: "block" }}
                    >
                      اختر الوقت
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
        </section>
      </div>

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
  