import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  isSupabaseConfigured,
  loadRemoteAppState,
  saveRemoteAppState,
} from "../lib/supabase";

const OrdersContext = createContext(null);

const STORAGE_KEYS = {
  orders: "butcher_orders",
  futureOrders: "butcher_future_orders",
  history: "butcher_history",
  liahOrders: "butcher_liah_orders",
  customerProfiles: "butcher_customer_profiles",
  customerNames: "butcher_customer_names",
  prices: "butcher_prices",
  dailyArchives: "butcher_daily_archives",
};

const DATA_RETENTION_DAYS = 7;
const DATA_RETENTION_MS = DATA_RETENTION_DAYS * 24 * 60 * 60 * 1000;

function hashText(value = "") {
  return value.split("").reduce((acc, char) => {
    return (acc * 31 + char.charCodeAt(0)) % 100000;
  }, 7);
}

function buildCustomerCode(name = "", phone = "") {
  const normalizedPhone = String(phone || "").replace(/\D/g, "");
  if (normalizedPhone) {
    const phoneHash = String(hashText(normalizedPhone)).padStart(5, "0");
    return `C-${phoneHash.slice(-5)}`;
  }

  const normalizedName = String(name || "").trim().toLowerCase();
  if (!normalizedName) return "C-00000";

  const nameHash = String(hashText(normalizedName)).padStart(5, "0");
  return `C-${nameHash.slice(-5)}`;
}

function phonesMatchForSameCustomer(nextPhone = "", existingPhone = "") {
  const nextDigits = String(nextPhone || "").replace(/\D/g, "");
  const existingDigits = String(existingPhone || "").replace(/\D/g, "");

  if (!nextDigits || !existingDigits) return false;
  if (nextDigits === existingDigits) return true;

  const shorter =
    nextDigits.length <= existingDigits.length ? nextDigits : existingDigits;
  const longer =
    nextDigits.length > existingDigits.length ? nextDigits : existingDigits;

  return shorter.length >= 3 && longer.endsWith(shorter);
}

function loadFromStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function hasRemoteValue(remoteState, key) {
  return remoteState[key] !== undefined && remoteState[key] !== null;
}

function parseTimestamp(value) {
  if (!value) return null;
  const parsed = Date.parse(String(value).replace(" ", "T"));
  return Number.isNaN(parsed) ? null : parsed;
}

function isRecentTimestamp(value, now = Date.now()) {
  const timestamp = parseTimestamp(value);
  if (!timestamp) return true;
  return now - timestamp < DATA_RETENTION_MS;
}

function isRecentOrder(order, now = Date.now()) {
  const timestamps = [order?.doneAt, order?.createdAt, order?.pickupTime]
    .map(parseTimestamp)
    .filter(Boolean);

  if (timestamps.length === 0) return true;
  return timestamps.some((timestamp) => now - timestamp < DATA_RETENTION_MS);
}

function isRecentArchive(archive, now = Date.now()) {
  return isRecentTimestamp(archive?.date || archive?.createdAt, now);
}

function isRecentCustomerProfile(profile, now = Date.now()) {
  return isRecentTimestamp(
    profile?.updatedAt || profile?.createdAt || profile?.pickupTime,
    now
  );
}

function applyRetention(state, now = Date.now()) {
  return {
    orders: (state.orders || []).filter((order) => isRecentOrder(order, now)),
    futureOrders: (state.futureOrders || []).filter((order) =>
      isRecentOrder(order, now)
    ),
    history: (state.history || []).filter((order) => isRecentOrder(order, now)),
    liahOrders: (state.liahOrders || []).filter((order) =>
      isRecentOrder(order, now)
    ),
    customerProfiles: (state.customerProfiles || []).filter((profile) =>
      isRecentCustomerProfile(profile, now)
    ),
    customerNames: state.customerNames || [],
    prices: state.prices || {},
    dailyArchives: (state.dailyArchives || [])
      .filter((archive) => isRecentArchive(archive, now))
      .slice(0, DATA_RETENTION_DAYS),
  };
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

function getOrderDayKey(order) {
  const raw = (order?.pickupTime || "").trim();
  if (!raw) return "";

  const parsed = new Date(raw.replace(" ", "T"));
  if (Number.isNaN(parsed.getTime())) {
    return raw.split(" ")[0] || "";
  }

  return getDayKey(parsed);
}

function isFutureOrderDue(order, todayKey = getDayKey()) {
  const dayKey = getOrderDayKey(order);
  return Boolean(dayKey && dayKey <= todayKey);
}

function makeDueOrderActive(order) {
  return {
    ...order,
    isFuture: false,
    status: order.status && order.status !== "future" ? order.status : "waiting",
  };
}

function getOrderIdentity(order) {
  return [
    order?.createdAt || "",
    order?.customerName || "",
    order?.phone || "",
    order?.pickupTime || "",
    JSON.stringify(order?.items || []),
  ].join("|");
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

export function OrdersProvider({ children, user }) {
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
  const [storedCustomerProfiles, setStoredCustomerProfiles] = useState(() =>
    loadFromStorage(STORAGE_KEYS.customerProfiles, [])
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
  const [syncStatus, setSyncStatus] = useState(
    isSupabaseConfigured ? "connecting" : "local"
  );
  const hasLoadedRemoteRef = useRef(false);
  const promotedFutureOrderKeysRef = useRef(new Set());
  const supabaseUserId = user?.id || null;

  function getCurrentAppState() {
    return {
      orders,
      futureOrders,
      history,
      liahOrders,
      customerProfiles: storedCustomerProfiles,
      customerNames,
      prices,
      dailyArchives,
    };
  }

  function applyAppState(nextState) {
    setOrders(nextState.orders);
    setFutureOrders(nextState.futureOrders);
    setHistory(nextState.history);
    setLiahOrders(nextState.liahOrders);
    setStoredCustomerProfiles(nextState.customerProfiles);
    setCustomerNames(nextState.customerNames);
    setPrices(nextState.prices);
    setDailyArchives(nextState.dailyArchives);
  }

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
      STORAGE_KEYS.customerProfiles,
      JSON.stringify(storedCustomerProfiles)
    );
  }, [storedCustomerProfiles]);

  useEffect(() => {
    localStorage.setItem(
      STORAGE_KEYS.customerNames,
      JSON.stringify(customerNames)
    );
  }, [customerNames]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.prices, JSON.stringify(prices));
  }, [prices]);

  useEffect(() => {
    let isCancelled = false;

    async function hydrateFromSupabase() {
      if (!isSupabaseConfigured) {
        applyAppState(applyRetention(getCurrentAppState()));
        hasLoadedRemoteRef.current = true;
        setSyncStatus("local");
        return;
      }

      if (!supabaseUserId) {
        setSyncStatus("local");
        return;
      }

      setSyncStatus("loading");
      const remoteState = await loadRemoteAppState(supabaseUserId);

      if (isCancelled) return;

      if (remoteState) {
        const hasUsableRemoteState =
          Array.isArray(remoteState.orders) ||
          Array.isArray(remoteState.futureOrders) ||
          Array.isArray(remoteState.history) ||
          Array.isArray(remoteState.liahOrders) ||
          Array.isArray(remoteState.dailyArchives) ||
          Array.isArray(remoteState.customerProfiles) ||
          (Array.isArray(remoteState.customerNames) &&
            remoteState.customerNames.length > 0) ||
          (remoteState.prices &&
            typeof remoteState.prices === "object" &&
            !Array.isArray(remoteState.prices));

        if (hasUsableRemoteState) {
          const retainedRemoteState = applyRetention({
            orders: Array.isArray(remoteState.orders) ? remoteState.orders : orders,
            futureOrders: Array.isArray(remoteState.futureOrders)
              ? remoteState.futureOrders
              : futureOrders,
            history: Array.isArray(remoteState.history)
              ? remoteState.history
              : history,
            liahOrders: Array.isArray(remoteState.liahOrders)
              ? remoteState.liahOrders
              : liahOrders,
            dailyArchives: Array.isArray(remoteState.dailyArchives)
              ? remoteState.dailyArchives
              : dailyArchives,
            customerProfiles: Array.isArray(remoteState.customerProfiles)
              ? remoteState.customerProfiles
              : storedCustomerProfiles,
            customerNames:
              Array.isArray(remoteState.customerNames) &&
              remoteState.customerNames.length > 0
                ? remoteState.customerNames
                : customerNames,
            prices:
              hasRemoteValue(remoteState, "prices") &&
              typeof remoteState.prices === "object" &&
              !Array.isArray(remoteState.prices)
                ? remoteState.prices
                : prices,
          });

          applyAppState(retainedRemoteState);

          hasLoadedRemoteRef.current = true;
          setSyncStatus("cloud");
          return;
        }

        hasLoadedRemoteRef.current = true;
        setSyncStatus("syncing");
        const retainedLocalState = applyRetention(getCurrentAppState());
        applyAppState(retainedLocalState);
        const seeded = await saveRemoteAppState(
          retainedLocalState,
          supabaseUserId
        );

        if (isCancelled) return;

        setSyncStatus(seeded ? "cloud" : "error");
        return;
      }

      hasLoadedRemoteRef.current = true;
      setSyncStatus("local");
    }

    hydrateFromSupabase();

    return () => {
      isCancelled = true;
    };
  }, [supabaseUserId]);

  useEffect(() => {
    if (
      !isSupabaseConfigured ||
      !supabaseUserId ||
      !hasLoadedRemoteRef.current
    ) {
      return;
    }

    const timeoutId = setTimeout(async () => {
      setSyncStatus("syncing");
      const ok = await saveRemoteAppState(
        applyRetention(getCurrentAppState()),
        supabaseUserId
      );
      setSyncStatus(ok ? "cloud" : "error");
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [
    orders,
    futureOrders,
    history,
    liahOrders,
    storedCustomerProfiles,
    customerNames,
    prices,
    dailyArchives,
    supabaseUserId,
  ]);

  useEffect(() => {
    const todayKey = getDayKey();
    const dueFutureOrders = futureOrders.filter((order) =>
      isFutureOrderDue(order, todayKey)
    );

    if (dueFutureOrders.length === 0) return;

    const ordersToMove = dueFutureOrders.filter((order) => {
      const key = getOrderIdentity(order);
      return !promotedFutureOrderKeysRef.current.has(key);
    });

    ordersToMove.forEach((order) => {
      promotedFutureOrderKeysRef.current.add(getOrderIdentity(order));
    });

    if (ordersToMove.length > 0) {
      setOrders((prev) => [
        ...ordersToMove.map(makeDueOrderActive),
        ...prev,
      ]);
    }

    setFutureOrders((prev) =>
      prev.filter((order) => !isFutureOrderDue(order, todayKey))
    );
  }, [futureOrders]);

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

  function rememberCustomerProfile(name, phone, customerCode) {
    const customerName = (name || "").trim();
    const customerPhone = (phone || "").trim();

    if (!customerName && !customerPhone) return;

    const nextCode =
      (customerCode || "").trim() || buildCustomerCode(customerName, customerPhone);

    rememberCustomer(customerName);

    setStoredCustomerProfiles((prev) => {
      const nextEntry = {
        customerCode: nextCode,
        customerName,
        phone: customerPhone,
        updatedAt: new Date().toISOString(),
      };

      const matchIndex = prev.findIndex((entry) => {
        const samePhone =
          customerPhone && (entry.phone || "").trim() === customerPhone;
        const sameNameAndPhoneSuffix =
          customerName &&
          customerPhone &&
          (entry.customerName || "").trim().toLowerCase() ===
            customerName.toLowerCase() &&
          phonesMatchForSameCustomer(customerPhone, entry.phone);
        const sameCode =
          nextCode && (entry.customerCode || "").trim() === nextCode;
        const sameName =
          customerName &&
          (entry.customerName || "").trim().toLowerCase() ===
            customerName.toLowerCase();

        return samePhone || sameNameAndPhoneSuffix || sameCode || sameName;
      });

      if (matchIndex === -1) {
        return [nextEntry, ...prev];
      }

      return prev.map((entry, index) =>
        index === matchIndex
          ? {
              ...entry,
              ...nextEntry,
              customerName: customerName || entry.customerName || "",
              phone:
                customerPhone.length > (entry.phone || "").trim().length
                  ? customerPhone
                  : entry.phone || customerPhone || "",
            }
          : entry
      );
    });
  }

  function normalizeOrder(order) {
    const normalizedStatus = order.isFuture
      ? "future"
      : order.status && order.status !== "future"
        ? order.status
        : "waiting";

    return {
      ...order,
      paymentStatus: order.paymentStatus || "paid",
      status: normalizedStatus,
      customerCode:
        order.customerCode ||
        buildCustomerCode(order.customerName, order.phone),
    };
  }

  function addOrder(order) {
    const normalizedOrder = normalizeOrder(order);
    const total = calcOrderTotal(normalizedOrder.items, prices);
    const finalOrder = { ...normalizedOrder, total };

    rememberCustomerProfile(
      finalOrder.customerName,
      finalOrder.phone,
      finalOrder.customerCode
    );

    if (finalOrder.isFuture) {
      setFutureOrders((prev) => [finalOrder, ...prev]);
    } else {
      setOrders((prev) => [finalOrder, ...prev]);
    }
  }

  function updateOrder(source, index, order) {
    const normalizedOrder = normalizeOrder(order);
    const total = calcOrderTotal(normalizedOrder.items, prices);
    const finalOrder = { ...normalizedOrder, total };

    rememberCustomerProfile(
      finalOrder.customerName,
      finalOrder.phone,
      finalOrder.customerCode
    );

    if (source === "future") {
      if (finalOrder.isFuture) {
        setFutureOrders((prev) =>
          prev.map((item, i) => (i === index ? finalOrder : item))
        );
        return;
      }

      setFutureOrders((prev) => prev.filter((_, i) => i !== index));
      setOrders((prev) => [finalOrder, ...prev]);
      return;
    }

    if (finalOrder.isFuture) {
      setOrders((prev) => prev.filter((_, i) => i !== index));
      setFutureOrders((prev) => [finalOrder, ...prev]);
      return;
    }

    setOrders((prev) =>
      prev.map((item, i) => (i === index ? finalOrder : item))
    );
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
          ...normalizeOrder(item),
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
        ...normalizeOrder(item),
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
    rememberCustomerProfile(order.customerName, order.phone, order.customerCode);
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

  function updateOrderStatus(source, index, status) {
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
        i === index ? { ...order, status } : order
      )
    );
  }

  function cycleOrderStatus(source, index) {
    const currentBySource = {
      orders,
      future: futureOrders,
      history,
      done: history,
    };

    const order = currentBySource[source]?.[index];
    if (!order) return;

    if (source === "future" || order.isFuture) {
      updateOrderStatus(source, index, "future");
      return;
    }

    const flow = ["waiting", "preparing", "ready"];
    const currentIndex = flow.indexOf(order.status || "waiting");
    const nextStatus = flow[(currentIndex + 1) % flow.length];
    updateOrderStatus(source, index, nextStatus);
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

  const customerProfiles = useMemo(() => {
    const allOrders = [...orders, ...futureOrders, ...history];
    const fromOrders = allOrders.reduce((acc, order) => {
      const customerName = (order.customerName || "").trim();
      const phone = (order.phone || "").trim();
      if (!customerName && !phone) return acc;

      const customerCode =
        order.customerCode || buildCustomerCode(customerName, phone);
      const key = phone || customerCode || customerName.toLowerCase();
      const existing = acc.get(key);

      const nextProfile = {
        customerCode,
        customerName,
        phone,
        lastOrder: order,
      };

      if (
        !existing ||
        getOrderTimestamp(order) > getOrderTimestamp(existing.lastOrder)
      ) {
        acc.set(key, nextProfile);
      }

      return acc;
    }, new Map());

    return storedCustomerProfiles.reduce((acc, profile) => {
      const customerName = (profile.customerName || "").trim();
      const phone = (profile.phone || "").trim();
      if (!customerName && !phone) return acc;

      const customerCode =
        (profile.customerCode || "").trim() ||
        buildCustomerCode(customerName, phone);
      const key = phone || customerCode || customerName.toLowerCase();
      const existing = acc.get(key);
      const profileTimestamp =
        profile.updatedAt || profile.createdAt || profile.pickupTime || "";

      if (
        !existing ||
        profileTimestamp > getOrderTimestamp(existing.lastOrder || existing)
      ) {
        acc.set(key, {
          customerCode,
          customerName,
          phone,
          lastOrder: existing?.lastOrder || null,
          updatedAt: profileTimestamp,
        });
      }

      return acc;
    }, fromOrders);
  }, [orders, futureOrders, history, storedCustomerProfiles]);

  const unpaidCount = unpaidHistoryOrders.length;

  const value = useMemo(
    () => ({
      orders,
      futureOrders,
      history,
      liahOrders,
      dailyArchives,
      customerNames,
      customerProfiles,
      prices,
      syncStatus,
      isCloudSyncEnabled: isSupabaseConfigured,
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
      rememberCustomerProfile,
      updateOrderPaymentStatus,
      markOrderAsUnpaid,
      markOrderAsPaid,
      updateOrderStatus,
      cycleOrderStatus,
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
      customerProfiles,
      prices,
      syncStatus,
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

function getOrderTimestamp(order) {
  return (
    order?.createdAt ||
    order?.doneAt ||
    order?.pickupTime ||
    ""
  );
}
