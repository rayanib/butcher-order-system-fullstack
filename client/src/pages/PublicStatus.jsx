import { useEffect, useState } from "react";

import {
  DEFAULT_SHOP_STATUS,
  SHOP_STATUSES,
  loadShopStatus,
} from "../lib/supabase";

function formatUpdatedAt(value) {
  if (!value) return "Not updated yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not updated yet";

  return date.toLocaleString(undefined, {
    dateStyle: "short",
    timeStyle: "short",
  });
}

export default function PublicStatus() {
  const [shopStatus, setShopStatus] = useState(DEFAULT_SHOP_STATUS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function refreshStatus() {
      const nextStatus = await loadShopStatus();
      if (!isMounted) return;

      setShopStatus(nextStatus);
      setIsLoading(false);
    }

    refreshStatus();
    const intervalId = window.setInterval(refreshStatus, 30000);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const statusMeta = SHOP_STATUSES[shopStatus.status] || SHOP_STATUSES.open;

  return (
    <main className="public-status-page">
      <section className={`public-status-card status-${statusMeta.tone}`}>
        <div className="public-status-kicker">Butcher shop status</div>
        <h1>{isLoading ? "Checking status..." : statusMeta.label}</h1>
        <p className="public-status-message">{shopStatus.message}</p>
        <div className="public-status-updated">
          Last updated: {formatUpdatedAt(shopStatus.updatedAt)}
        </div>
      </section>
    </main>
  );
}
