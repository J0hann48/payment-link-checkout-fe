const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type TokenizeCheckoutPayload = {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
};

export type TokenizeCheckoutResponse = {
  pspToken: string;
  pspCode?: string;
  last4?: string;
  brand?: string;
  createdAt?: string;
};

export async function tokenizeCheckout(
  slug: string,
  payload: TokenizeCheckoutPayload
): Promise<TokenizeCheckoutResponse> {
  const res = await fetch(`${API_BASE_URL}/checkout/${slug}/tokenize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }).catch(() => {
    throw new Error("No hay conexion con el servidor");
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    const err: any = new Error(data?.message ?? "No se pudo tokenizar la tarjeta");
    if (data?.code) err.code = data.code;
    throw err;
  }

  return data;
}
