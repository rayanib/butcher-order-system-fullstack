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
