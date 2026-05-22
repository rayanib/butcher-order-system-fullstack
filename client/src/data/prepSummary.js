import { GRILL_OPTIONS } from "./menu";

const GRILL_BASE_NAMES = ["فيليه", "سينتا", "كعب فخذ"];

export function isGrillItem(name = "") {
  return (
    GRILL_BASE_NAMES.some((base) => name.includes(base)) ||
    GRILL_OPTIONS.some((option) => name.includes(option))
  );
}

export function formatKg(kg) {
  return Number.isInteger(kg) ? String(kg) : kg.toFixed(1);
}

export function calculateFuturePrepTotals(orders = []) {
  return orders.reduce(
    (totals, order) => {
      (order.items || []).forEach((item) => {
        const kgValue = Number(item.kg);
        if (!Number.isFinite(kgValue) || kgValue <= 0) return;

        const itemName = (item.name || "").trim();
        if (!itemName) return;

        if (itemName === "شاورما") {
          totals.shawarma += kgValue;
          return;
        }

        if (isGrillItem(itemName)) {
          totals.grill += kgValue;
        }
      });

      return totals;
    },
    { grill: 0, shawarma: 0 }
  );
}
