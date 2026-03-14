import { createContext, useContext, useEffect, useMemo, useState } from "react";

const OrdersContext = createContext(null);

const STORAGE_KEYS = {
  orders: "butcher_orders",
  futureOrders: "butcher_future_orders",
  history: "butcher_history",
  liahOrders: "butcher_liah_orders",
  customerNames: "butcher_customer_names",
  prices: "butcher_prices",
  dailyArchives: "butcher_daily_archives",
};

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function calcOrderTotal(items, prices) {
  return items.reduce((sum, item) => {
    if (item.mode === "money") {
      return sum + (Number(item.money) || 0);
    }

    if (item.mode === "kg") {
      const key = (item.priceKey || item.name || "").trim();
      const pricePerKg = Number(prices[key] || 0);
      const kg = Number(item.kg || 0);

      return sum + pricePerKg * kg;
    }

    return sum;
  }, 0);
}

function getDayKey(date = new Date()) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatArchiveDate(dateString) {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("ar", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch {
    return dateString;
  }
}

export function OrdersProvider({ children }) {
  const [orders, setOrders] = useState(() =>
    loadFromStorage(STORAGE_KEYS.orders, [])
  );
  const [futureOrders, setFutureOrders] = useState(() =>
    loadFromStorage(STORAGE_KEYS.futureOrders, [])
  );
  const [history, setHistory] = useState(() =>
    loadFromStorage(STORAGE_KEYS.history, [])
  );
  const [liahOrders, setLiahOrders] = useState(() =>
    loadFromStorage(STORAGE_KEYS.liahOrders, [])
  );
  const [dailyArchives, setDailyArchives] = useState(() =>
    loadFromStorage(STORAGE_KEYS.dailyArchives, [])
  );
  const [customerNames, setCustomerNames] = useState(() =>
    loadFromStorage(STORAGE_KEYS.customerNames, [
      "ريان",
      "محمد",
      "أحمد",
      "خالد",
      "رامي",
      "سامي",
      "يوسف",
      "عمر",
    ])
  );
  const [prices, setPrices] = useState(() =>
    loadFromStorage(STORAGE_KEYS.prices, {})
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.orders, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.futureOrders,
      JSON.stringify(futureOrders)
    );
  }, [futureOrders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.liahOrders, JSON.stringify(liahOrders));
  }, [liahOrders]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.dailyArchives,
      JSON.stringify(dailyArchives)
    );
  }, [dailyArchives]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.customerNames,
      JSON.stringify(customerNames)
    );
  }, [customerNames]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.prices, JSON.stringify(prices));
  }, [prices]);

  function rememberCustomer(name) {
    const trimmed = (name || "").trim();
    if (!trimmed) return;

    setCustomerNames((prev) => {
      const exists = prev.some(
        (item) => item.trim().toLowerCase() === trimmed.toLowerCase()
      );
      if (exists) return prev;
      return [trimmed, ...prev];
    });
  }

  function normalizePaymentStatus(order) {
    return {
      ...order,
      paymentStatus: order.paymentStatus || "paid",
    };
  }

  function addOrder(order) {
    const normalizedOrder = normalizePaymentStatus(order);
    const total = calcOrderTotal(normalizedOrder.items, prices);
    const finalOrder = { ...normalizedOrder, total };

    rememberCustomer(finalOrder.customerName);

    if (finalOrder.isFuture) {
      setFutureOrders((prev) => [finalOrder, ...prev]);
    } else {
      setOrders((prev) => [finalOrder, ...prev]);
    }
  }

  function updateOrder(source, index, order) {
    const normalizedOrder = normalizePaymentStatus(order);
    const total = calcOrderTotal(normalizedOrder.items, prices);
    const finalOrder = { ...normalizedOrder, total };

    rememberCustomer(finalOrder.customerName);

    if (source === "future") {
      setFutureOrders((prev) =>
        prev.map((item, i) => (i === index ? finalOrder : item))
      );
    } else {
      setOrders((prev) =>
        prev.map((item, i) => (i === index ? finalOrder : item))
      );
    }
  }

  function removeOrder(index) {
    setOrders((prev) => prev.filter((_, i) => i !== index));
  }

  function removeFutureOrder(index) {
    setFutureOrders((prev) => prev.filter((_, i) => i !== index));
  }

  function markDone(source, index) {
    if (source === "future") {
      const item = futureOrders[index];
      if (!item) return;

      setHistory((prev) => [
        {
          ...normalizePaymentStatus(item),
          doneAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setFutureOrders((prev) => prev.filter((_, i) => i !== index));
      return;
    }

    const item = orders[index];
    if (!item) return;

    setHistory((prev) => [
      {
        ...normalizePaymentStatus(item),
        doneAt: new Date().toISOString(),
      },
      ...prev,
    ]);
    setOrders((prev) => prev.filter((_, i) => i !== index));
  }

  function removeHistory(index) {
    setHistory((prev) => prev.filter((_, i) => i !== index));
  }

  function clearHistory() {
    setHistory([]);
  }

  function archiveToday() {
    if (history.length === 0) return false;

    const archiveDate = getDayKey();
    const totalRevenue = history.reduce(
      (sum, order) => sum + Number(order.total || 0),
      0
    );
    const unpaidCountForDay = history.filter(
      (order) => (order.paymentStatus || "paid") === "unpaid"
    ).length;

    const archiveEntry = {
      id: `${archiveDate}-${Date.now()}`,
      date: archiveDate,
      displayDate: formatArchiveDate(archiveDate),
      createdAt: new Date().toISOString(),
      orders: history,
      totalOrders: history.length,
      totalRevenue,
      unpaidCount: unpaidCountForDay,
    };

    setDailyArchives((prev) => {
      const withoutSameDay = prev.filter((day) => day.date !== archiveDate);
      return [archiveEntry, ...withoutSameDay]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 7);
    });

    setHistory([]);
    return true;
  }

  function removeArchive(id) {
    setDailyArchives((prev) => prev.filter((day) => day.id !== id));
  }

  function clearArchives() {
    setDailyArchives([]);
  }

  function addLiahOrder(order) {
    rememberCustomer(order.customerName);
    setLiahOrders((prev) => [order, ...prev]);
  }

  function removeLiahOrder(index) {
    setLiahOrders((prev) => prev.filter((_, i) => i !== index));
  }

  function savePrices(nextPrices) {
    setPrices(nextPrices);

    setOrders((prev) =>
      prev.map((order) => ({
        ...order,
        total: calcOrderTotal(order.items, nextPrices),
      }))
    );

    setFutureOrders((prev) =>
      prev.map((order) => ({
        ...order,
        total: calcOrderTotal(order.items, nextPrices),
      }))
    );

    setHistory((prev) =>
      prev.map((order) => ({
        ...order,
        total: calcOrderTotal(order.items, nextPrices),
      }))
    );

    setDailyArchives((prev) =>
      prev.map((archive) => {
        const updatedOrders = archive.orders.map((order) => ({
          ...order,
          total: calcOrderTotal(order.items, nextPrices),
        }));

        return {
          ...archive,
          orders: updatedOrders,
          totalRevenue: updatedOrders.reduce(
            (sum, order) => sum + Number(order.total || 0),
            0
          ),
        };
      })
    );
  }

  function updateOrderPaymentStatus(source, index, paymentStatus) {
    const updateBySource = {
      orders: setOrders,
      future: setFutureOrders,
      history: setHistory,
      done: setHistory,
    };

    const setter = updateBySource[source];
    if (!setter) return;

    setter((prev) =>
      prev.map((order, i) =>
        i === index ? { ...order, paymentStatus } : order
      )
    );
  }

  function markOrderAsUnpaid(source, index) {
    updateOrderPaymentStatus(source, index, "unpaid");
  }

  function markOrderAsPaid(source, index) {
    updateOrderPaymentStatus(source, index, "paid");
  }
function toggleOrderItemDone(source, orderIndex, itemIndex) {
  const updateBySource = {
    orders: setOrders,
    future: setFutureOrders,
    history: setHistory,
    done: setHistory,
  };

  const setter = updateBySource[source];
  if (!setter) return;

  setter((prev) =>
    prev.map((order, i) => {
      if (i !== orderIndex) return order;

      return {
        ...order,
        items: (order.items || []).map((item, j) =>
          j === itemIndex ? { ...item, done: !item.done } : item
        ),
      };
    })
  );
}














  const unpaidHistoryOrders = history.filter(
    (order) => (order.paymentStatus || "paid") === "unpaid"
  );

  const unpaidCount = unpaidHistoryOrders.length;

  const value = useMemo(
    () => ({
      orders,
      futureOrders,
      history,
      liahOrders,
      dailyArchives,
      customerNames,
      prices,
      unpaidHistoryOrders,
      unpaidCount,
      addOrder,
      updateOrder,
      removeOrder,
      removeFutureOrder,
      markDone,
      removeHistory,
      clearHistory,
      archiveToday,
      removeArchive,
      clearArchives,
      addLiahOrder,
      removeLiahOrder,
      savePrices,
      rememberCustomer,
      updateOrderPaymentStatus,
      markOrderAsUnpaid,
      markOrderAsPaid,
      toggleOrderItemDone,
      calcOrderTotal: (items) => calcOrderTotal(items, prices),
    }),
    [
      orders,
      futureOrders,
      history,
      liahOrders,
      dailyArchives,
      customerNames,
      prices,
      unpaidHistoryOrders,
      unpaidCount,
    ]
  );

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  );
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) {
    throw new Error("useOrders must be used inside OrdersProvider");
  }
  return ctx;
}