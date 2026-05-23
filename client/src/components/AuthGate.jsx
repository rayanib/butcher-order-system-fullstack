import { useEffect, useState } from "react";

import {
  isSupabaseConfigured,
  onAuthStateChange,
  signInWithPassword,
  signOut,
  supabase,
} from "../lib/supabase";

export default function AuthGate({ children }) {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setIsLoading(false);
      return undefined;
    }

    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      setSession(data.session || null);
      setIsLoading(false);
    });

    const subscription = onAuthStateChange((nextSession) => {
      setSession(nextSession);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const { error: signInError } = await signInWithPassword(
      email.trim(),
      password
    );

    if (signInError) {
      setError("فشل تسجيل الدخول. افحص البريد وكلمة المرور.");
    }

    setIsSubmitting(false);
  }

  if (!isSupabaseConfigured) {
    return children(null);
  }

  if (isLoading) {
    return (
      <div className="auth-page" dir="rtl">
        <div className="card auth-card">جاري الاتصال...</div>
      </div>
    );
  }

  if (!session?.user) {
    return (
      <div className="auth-page" dir="rtl">
        <form className="card auth-card" onSubmit={handleSubmit}>
          <h1>تسجيل الدخول</h1>

          <label className="auth-field">
            <span>البريد الإلكتروني</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>

          <label className="auth-field">
            <span>كلمة المرور</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />
          </label>

          {error && <div className="auth-error">{error}</div>}

          <button type="submit" className="primary-btn" disabled={isSubmitting}>
            {isSubmitting ? "جاري الدخول..." : "دخول"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <>
      {children(session.user)}
      <button type="button" className="auth-sign-out" onClick={signOut}>
        خروج
      </button>
    </>
  );
}
