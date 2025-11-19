export function resolveCheckoutUrl(checkoutUrl: string) {
  const base = typeof window !== "undefined"
    ? (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || window.location.origin
    : (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || "";

  try {
    return new URL(checkoutUrl, base).toString();
  } catch {
    return checkoutUrl;
  }
}
