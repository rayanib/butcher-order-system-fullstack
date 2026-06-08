import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const APP_STATE_KEYS = [
  "orders",
  "futureOrders",
  "history",
  "liahOrders",
  "customerProfiles",
  "customerNames",
  "prices",
  "dailyArchives",
];

const SHOP_STATUS_KEY = "shopStatus";
const LOCAL_SHOP_STATUS_KEY = "butcher_shop_status";

export const SHOP_STATUSES = {
  open: {
    label: "Open",
    tone: "open",
    defaultMessage: "The butcher shop is open today.",
  },
  closed: {
    label: "Closed",
    tone: "closed",
    defaultMessage: "The butcher shop is closed today.",
  },
  no_meat: {
    label: "No meat available",
    tone: "no-meat",
    defaultMessage: "No meat is available today.",
  },
};

export const DEFAULT_SHOP_STATUS = {
  status: "open",
  message: SHOP_STATUSES.open.defaultMessage,
  updatedAt: null,
};

function normalizeShopStatus(payload, updatedAt = null) {
  const status = SHOP_STATUSES[payload?.status] ? payload.status : "open";
  const message =
    typeof payload?.message === "string" && payload.message.trim()
      ? payload.message.trim()
      : SHOP_STATUSES[status].defaultMessage;

  return {
    status,
    message,
    updatedAt: payload?.updatedAt || payload?.updated_at || updatedAt || null,
  };
}

function loadLocalShopStatus() {
  try {
    const raw = localStorage.getItem(LOCAL_SHOP_STATUS_KEY);
    return raw ? normalizeShopStatus(JSON.parse(raw)) : DEFAULT_SHOP_STATUS;
  } catch {
    return DEFAULT_SHOP_STATUS;
  }
}

function saveLocalShopStatus(statusPayload) {
  localStorage.setItem(LOCAL_SHOP_STATUS_KEY, JSON.stringify(statusPayload));
}

export function onAuthStateChange(callback) {
  if (!supabase) return null;

  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session);
  });

  return data.subscription;
}

export async function signInWithPassword(email, password) {
  if (!supabase) {
    return { error: new Error("Supabase is not configured") };
  }

  return supabase.auth.signInWithPassword({ email, password });
}

export async function signOut() {
  if (!supabase) return;
  await supabase.auth.signOut();
}

export async function loadRemoteAppState(userId) {
  if (!supabase || !userId) return null;

  const { data, error } = await supabase
    .from("app_state")
    .select("state_key,payload")
    .eq("user_id", userId)
    .in("state_key", APP_STATE_KEYS);

  if (error) {
    console.error("Failed to load Supabase app state", error);
    return null;
  }

  const rows = Array.isArray(data) ? data : [];

  return APP_STATE_KEYS.reduce((acc, key) => {
    const match = rows.find((row) => row.state_key === key);
    acc[key] = match?.payload;
    return acc;
  }, {});
}

export async function saveRemoteAppState(payloadByKey, userId) {
  if (!supabase || !userId) return false;

  const rows = APP_STATE_KEYS.map((key) => ({
    user_id: userId,
    state_key: key,
    payload: payloadByKey[key] ?? null,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from("app_state")
    .upsert(rows, { onConflict: "user_id,state_key" });

  if (error) {
    console.error("Failed to save Supabase app state", error);
    return false;
  }

  return true;
}

export async function loadShopStatus() {
  if (!supabase) {
    return loadLocalShopStatus();
  }

  const { data, error } = await supabase
    .from("app_state")
    .select("payload,updated_at")
    .eq("state_key", SHOP_STATUS_KEY)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error("Failed to load shop status", error);
    return DEFAULT_SHOP_STATUS;
  }

  if (!data) return DEFAULT_SHOP_STATUS;
  return normalizeShopStatus(data.payload, data.updated_at);
}

export async function saveShopStatus(userId, status, message) {
  const nextStatus = SHOP_STATUSES[status] ? status : "open";
  const updatedAt = new Date().toISOString();
  const payload = normalizeShopStatus({
    status: nextStatus,
    message,
    updatedAt,
  });

  if (!supabase) {
    saveLocalShopStatus(payload);
    return { ok: true, status: payload };
  }

  if (!userId) {
    return { ok: false, error: new Error("Missing user id") };
  }

  const { error } = await supabase.from("app_state").upsert(
    {
      user_id: userId,
      state_key: SHOP_STATUS_KEY,
      payload,
      updated_at: updatedAt,
    },
    { onConflict: "user_id,state_key" }
  );

  if (error) {
    console.error("Failed to save shop status", error);
    return { ok: false, error };
  }

  return { ok: true, status: payload };
}
