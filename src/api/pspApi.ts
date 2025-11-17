const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type TokenizeAdyenPayload = {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
};

export type TokenizeAdyenResponse = {
  pspCode: "ADYEN" | string;
  pspToken: string;
  last4: string;
  brand: string;
  createdAt: string;
};

export async function tokenizeAdyen(payload: TokenizeAdyenPayload): Promise<TokenizeAdyenResponse> {
  const res = await fetch(`${API_BASE_URL}/psp/adyen/tokenize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("No se pudo tokenizar la tarjeta");
  }

  return res.json();
}

// Stripe
export type TokenizeStripePayload = {
  cardNumber: string;
  expMonth: number;
  expYear: number;
  cvc: string;
};

export type TokenizeStripeResponse = {
  pspCode: "STRIPE" | string;
  pspToken: string;
  last4: string;
  brand: string;
  createdAt: string;
};

export async function tokenizeStripe(payload: TokenizeStripePayload): Promise<TokenizeStripeResponse> {
  const res = await fetch(`${API_BASE_URL}/psp/stripe/tokenize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error("No se pudo tokenizar la tarjeta con Stripe");
  }

  return res.json();
}
