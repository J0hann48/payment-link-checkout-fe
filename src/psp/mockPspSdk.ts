export type PspName = "STRIPE" | "ADYEN";

export type CardData = {
  number: string;
  expMonth: string;
  expYear: string;
  cvc: string;
};

export type TokenizeResult = {
  pspToken: string; 
  pspHint: PspName;
};

export async function tokenizeCard(
  card: CardData,
  primaryPsp: PspName = "STRIPE"
): Promise<TokenizeResult> {

  await new Promise((resolve) => setTimeout(resolve, 800));

  const normalized = card.number.replace(/\s+/g, "");

  if (!/^\d{12,19}$/.test(normalized)) {
    throw new Error("Tarjeta invalida");
  }

  const monthNum = Number(card.expMonth);
  if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
    throw new Error("Mes de expiracion invalido");
  }

  const yearNumRaw = card.expYear.length === 2 ? Number(`20${card.expYear}`) : Number(card.expYear);
  const yearNum = Number.isNaN(yearNumRaw) ? 0 : yearNumRaw;
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  if (yearNum < thisYear || (yearNum === thisYear && monthNum < thisMonth)) {
    throw new Error("Tarjeta expirada");
  }

  if (!/^\d{3,4}$/.test(card.cvc)) {
    throw new Error("CVC invalido");
  }

  if (normalized.endsWith("9999")) {
    throw new Error("Error de red en el SDK del PSP");
  }
  if (normalized.endsWith("0001")) {
    return { pspToken: "sim_stripe_exception", pspHint: "STRIPE" };
  }

  if (normalized.endsWith("0002")) {
    return { pspToken: "sim_stripe_failed", pspHint: "STRIPE" };
  }

  if (normalized.endsWith("0003")) {
    return { pspToken: "sim_adyen_exception", pspHint: "ADYEN" };
  }

  if (normalized.endsWith("0004")) {
    return { pspToken: "sim_adyen_failed", pspHint: "ADYEN" };
  }

  if (primaryPsp === "STRIPE") {
    return { pspToken: "sim_stripe_ok", pspHint: "STRIPE" };
  } else {
    return { pspToken: "sim_adyen_ok", pspHint: "ADYEN" };
  }
}
