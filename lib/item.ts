// Amounts are in cents, as Stripe expects them.
export const ITEM = { name: "e2e t-shirt", amount: 2000 };

const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

export function formatUsd(cents: number): string {
  return usd.format(cents / 100);
}
