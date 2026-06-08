import { useEffect, useState } from "react";

import {
  DEFAULT_SHOP_STATUS,
  SHOP_STATUSES,
  loadShopStatus,
  saveShopStatus,
} from "../lib/supabase";

const QUICK_MESSAGES = [
  "Closed today for holiday.",
  "Closed until Monday.",
  "No meat available today.",
  "All meat sold out.",
];

function formatUpdatedAt(value) {
  if (!value) return "Not updated yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated yet";

  return date.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function ShopStatusAdmin({ user }) {
  const [status, setStatus] = useState(DEFAULT_SHOP_STATUS.status);
  const [message, setMessage] = useState(DEFAULT_SHOP_STATUS.message);
  const [updatedAt, setUpdatedAt] = useState(DEFAULT_SHOP_STATUS.updatedAt);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveState, setSaveState] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function hydrateStatus() {
      const savedStatus = await loadShopStatus();
      if (!isMounted) return;

      setStatus(savedStatus.status);
      setMessage(savedStatus.message);
      setUpdatedAt(savedStatus.updatedAt);
      setIsLoading(false);
    }

    hydrateStatus();

    return () => {
      isMounted = false;
    };
  }, []);

  function chooseStatus(nextStatus) {
    setStatus(nextStatus);
    setMessage(SHOP_STATUSES[nextStatus].defaultMessage);
    setSaveState("");
  }

  async function handleSave(event) {
    event.preventDefault();
    setIsSaving(true);
    setSaveState("");

    const result = await saveShopStatus(user?.id, status, message);

    if (result.ok) {
      setUpdatedAt(result.status.updatedAt);
      setSaveState("Saved. Customer page is updated.");
    } else {
      setSaveState("Could not save. Check Supabase setup.");
    }

    setIsSaving(false);
  }

  return (
    <div className="page shop-status-admin-page">
      <div className="status-admin-header">
        <div>
          <h1>Shop Status</h1>
          <p>Change this in less than 10 seconds.</p>
        </div>
        <a className="ghost-btn" href="#/status" target="_blank" rel="noreferrer">
          Public page
        </a>
      </div>

      <form className="card status-admin-card" onSubmit={handleSave}>
        <div className="status-option-grid">
          {Object.entries(SHOP_STATUSES).map(([statusKey, option]) => (
            <button
              key={statusKey}
              type="button"
              className={`status-choice status-${option.tone} ${
                status === statusKey ? "active" : ""
              }`}
              onClick={() => chooseStatus(statusKey)}
            >
              {option.label}
            </button>
          ))}
        </div>

        <label className="status-message-field">
          <span>Message customers will see or hear</span>
          <textarea
            value={message}
            onChange={(event) => {
              setMessage(event.target.value);
              setSaveState("");
            }}
            rows={4}
            disabled={isLoading}
          />
        </label>

        <div className="status-quick-messages">
          {QUICK_MESSAGES.map((quickMessage) => (
            <button
              key={quickMessage}
              type="button"
              className="soft-badge"
              onClick={() => setMessage(quickMessage)}
            >
              {quickMessage}
            </button>
          ))}
        </div>

        <button className="primary-btn status-save-btn" type="submit" disabled={isSaving || isLoading}>
          {isSaving ? "Saving..." : "Save status"}
        </button>

        <div className="status-save-note">
          <span>{saveState || `Last updated: ${formatUpdatedAt(updatedAt)}`}</span>
          <span>Future phone message: {message || SHOP_STATUSES[status].defaultMessage}</span>
        </div>
      </form>
    </div>
  );
}
