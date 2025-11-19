const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8080";

export type FeeBreakdown = {
  baseAmount: number;
  processingFee: number;
  fxFee: number;
  incentiveDiscount: number;
  totalFees: number;
  finalAmount: number;
  currency: string;
};

export type PaymentLinkView = {
  id: number;
  merchantId: number;
  recipientId?: number | null;
  amount: number;
  currency: string;
  description?: string | null;
  status: "CREATED" | "PAID" | "EXPIRED" | string;
  preferredPsp?: "ADYEN" | "STRIPE" | string;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  slug: string;
  checkoutUrl: string;
  feeBreakdown?: FeeBreakdown; // backend campo principal esperado
  feePreview?: FeeBreakdown;   // fallback de compatibilidad
};

// 1. Crear Payment Link (UI merchant opcional)
export type CreatePaymentLinkPayload = {
  merchantId: number;
  recipientId?: number;
  amount: number;
  currency: string;
  description?: string;
  expiresAt?: string; // ISO-8601
};

export type UpdatePaymentLinkPayload = {
  merchantId: number;
  recipientId?: number;
  amount: number;
  currency: string;
  description?: string;
  expiresAt?: string; // ISO-8601 (LocalDate en backend)
};

export async function createPaymentLink(
  payload: CreatePaymentLinkPayload
): Promise<PaymentLinkView> {
  const res = await fetch(`${API_BASE_URL}/payment-links`, {
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
    const err: any = new Error(data?.message ?? "No se pudo crear el payment link");
    if (data?.code) err.code = data.code;
    throw err;
  }

  const fee = data?.feeBreakdown ?? data?.feePreview;
  return { ...(data ?? {}), feeBreakdown: fee };
}

// 2. Consultar Payment Link por slug (checkout)
export async function getPaymentLinkBySlug(slug: string): Promise<PaymentLinkView> {
  const res = await fetch(`${API_BASE_URL}/payment-links/${slug}`).catch(() => {
    throw new Error("No hay conexion con el servidor");
  });

  if (!res.ok) {
    // 404 -> link no existe
    throw new Error("Payment link no encontrado");
  }

  const data = await res.json();

  // Normalizar para UI: usar feeBreakdown si existe o caer a feePreview
  const fee = data.feeBreakdown ?? data.feePreview;
  return { ...data, feeBreakdown: fee };
}

// 3. Procesar pago para un Payment Link
export type ProcessPaymentPayload = {
  pspToken: string;
  pspHint?: "STRIPE" | "ADYEN";
};

export type ProcessPaymentResponse = {
  paymentId: number;
  paymentStatus: "CAPTURED" | "FAILED" | string;
  pspUsed: "STRIPE" | "ADYEN" | string;
  amount: number;
  currency: string;
  createdAt: string;
  feeBreakdown?: FeeBreakdown;
  feePreview?: FeeBreakdown;
};

export async function processPaymentForLink(
  slug: string,
  payload: ProcessPaymentPayload
): Promise<ProcessPaymentResponse> {
  const res = await fetch(`${API_BASE_URL}/payment-links/${slug}/pay`, {
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
    // ignore parse errors; fallback to generic handling below
  }

  if (!res.ok) {
    const err: any = new Error(data?.message ?? "Error procesando el pago");
    if (data?.code) err.code = data.code;
    throw err;
  }

  const fee = data?.feeBreakdown ?? data?.feePreview;
  return { ...data, feeBreakdown: fee };
}

export async function listPaymentLinksByMerchant(merchantId: number): Promise<PaymentLinkView[]> {
  const res = await fetch(`${API_BASE_URL}/payment-links?merchantId=${merchantId}`).catch(() => {
    throw new Error("No hay conexion con el servidor");
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    throw new Error(data?.message ?? "No se pudieron cargar los payment links");
  }

  return (data ?? []).map((item: any) => ({
    ...item,
    feeBreakdown: item.feeBreakdown ?? item.feePreview,
  }));
}

export async function listAllPaymentLinks(): Promise<PaymentLinkView[]> {
  const res = await fetch(`${API_BASE_URL}/payment-links`).catch(() => {
    throw new Error("No hay conexion con el servidor");
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore parse errors
  }

  if (!res.ok) {
    throw new Error(data?.message ?? "No se pudieron cargar los payment links");
  }

  return (data ?? []).map((item: any) => ({
    ...item,
    feeBreakdown: item.feeBreakdown ?? item.feePreview,
  }));
}

export async function updatePaymentLink(
  slug: string,
  payload: UpdatePaymentLinkPayload
): Promise<PaymentLinkView> {
  const res = await fetch(`${API_BASE_URL}/payment-links/${slug}`, {
    method: "PUT",
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
    const err: any = new Error(data?.message ?? "No se pudo actualizar el payment link");
    if (data?.code) err.code = data.code;
    throw err;
  }

  const fee = data?.feeBreakdown ?? data?.feePreview;
  return { ...(data ?? {}), feeBreakdown: fee };
}

export async function deletePaymentLink(slug: string, merchantId: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/payment-links/${slug}?merchantId=${merchantId}`, {
    method: "DELETE",
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
    const err: any = new Error(data?.message ?? "No se pudo eliminar el payment link");
    if (data?.code) err.code = data.code;
    throw err;
  }
}
