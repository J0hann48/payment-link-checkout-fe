export function resolveCheckoutUrl(checkoutUrl: string, slug?: string) {
  const base = typeof window !== "undefined"
    ? (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || window.location.origin
    : (import.meta.env.VITE_PUBLIC_BASE_URL as string | undefined) || "";

  try {
    const url = new URL(checkoutUrl, base);

    const hasCheckoutSegment = url.pathname.startsWith("/checkout/");
    const hasSlugInline = slug && url.pathname.replace(/^\/+/, "").startsWith(slug);

    if (slug && !hasCheckoutSegment && !hasSlugInline) {
      url.pathname = `/checkout/${slug}`;
    }

    return url.toString();
  } catch {
    if (slug) {
      const cleanBase = base.replace(/\/$/, "");
      return `${cleanBase}/checkout/${slug}`;
    }
    return checkoutUrl;
  }
}
