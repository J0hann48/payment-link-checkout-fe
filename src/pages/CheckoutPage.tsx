import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { usePaymentLink } from "../hooks/usePaymentLink";
import { CardForm } from "../components/CardForm";
import { FeeBreakdown } from "../components/FeeBreakdown";
import { StatusBanner } from "../components/StatusBanner";
import { LoadingSpinner } from "../components/LoadingSpinner";
import { processPaymentForLink } from "../api/paymentLinkApi";
import { tokenizeCheckout } from "../api/checkoutApi";
import type { CardData } from "../psp/mockPspSdk";

type CheckoutStatus =
  | "idle"
  | "processing"
  | "success"
  | "error";

export function CheckoutPage() {
  const { slug } = useParams<{ slug: string }>();

  const { status: loadStatus, link, fee, error: loadError } = usePaymentLink(slug);

  const [checkoutStatus, setCheckoutStatus] = useState<CheckoutStatus>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastCard, setLastCard] = useState<CardData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ number?: string; month?: string; year?: string; cvc?: string; general?: string }>({});

  const isLoadingInitial = loadStatus === "loading" || loadStatus === "idle";

  const linkClosed = link && link.status !== "CREATED";

  async function handlePay(card: CardData) {
    if (!slug || !link || linkClosed) return;

    setErrorMessage(null);
    setFieldErrors({});
    setCheckoutStatus("processing");
    setLastCard(card);

    try {
      const tokenizeRes = await tokenizeCheckout(slug, {
        cardNumber: card.number.replace(/\s+/g, ""),
        expMonth: Number(card.expMonth),
        expYear: Number(card.expYear),
        cvc: card.cvc,
      });

      const res = await processPaymentForLink(slug, {
        pspToken: tokenizeRes.pspToken,
      });

      setCheckoutStatus(res.paymentStatus === "CAPTURED" ? "success" : "error");

      if (res.paymentStatus !== "CAPTURED") {
        setErrorMessage("No fue posible procesar el pago.");
      }
    } catch (err: any) {
      console.error(err);
      setCheckoutStatus("error");
      const fallback = "No fue posible procesar el pago. Intenta nuevamente en unos minutos.";
      if (err?.code === "PSP_ROUTING_FAILED") {
        setErrorMessage("No pudimos procesar tu pago despues de intentar con varios proveedores. Intenta nuevamente en unos minutos.");
      } else if (err?.code === "INVALID_CARD_NUMBER") {
        setFieldErrors({ number: err?.message ?? "Numero de tarjeta invalido" });
      } else if (err?.code === "INVALID_INPUT") {
        setFieldErrors({ general: err?.message ?? "Revisa los datos introducidos" });
      } else {
        setErrorMessage(err?.message ?? fallback);
      }
    }
  }

  // 1) Carga inicial
  if (isLoadingInitial) {
    return (
      <div className="checkout-page">
        <LoadingSpinner />
        <p>Cargando enlace de pago...</p>
      </div>
    );
  }

  // 2) Error inicial / link invalido
  if (loadStatus === "error" || !link || !fee) {
    return (
      <div className="checkout-page">
        <StatusBanner
          type="error"
          message={loadError || "Enlace de pago invalido o expirado."}
        />
      </div>
    );
  }

  // 3) Link cerrado
  if (linkClosed) {
    return (
      <div className="checkout-page">
        <StatusBanner
          type="error"
          message="Este enlace ya no acepta pagos."
        />
        <div className="cta-row">
          <Link className="link-button" to="/merchant">
            Ir al portal merchant
          </Link>
        </div>
      </div>
    );
  }

  // 4) Pantalla principal
  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <p className="eyebrow">Enlace de pago</p>
        <h1>Pagar {link.description ?? `link #${link.id}`}</h1>
        <p className="amount">
          {link.amount.toLocaleString()} {link.currency}
        </p>
        <div className="cta-row">
          <Link className="link-button" to="/merchant">
            Ir al portal merchant
          </Link>
        </div>
      </div>

      <div className="checkout-layout">
        <div className="panel">
          {checkoutStatus === "processing" && (
            <StatusBanner
              type="info"
              message="Procesando pago..."
            />
          )}

          {checkoutStatus === "success" && (
            <StatusBanner
              type="success"
              message="Pago aprobado."
            />
          )}

          {checkoutStatus === "error" && errorMessage && (
            <>
              <StatusBanner type="error" message={errorMessage} />
              {lastCard && (
                <button
                  type="button"
                  className="retry-button"
                  onClick={() => handlePay(lastCard)}
                >
                  Intenta nuevamente
                </button>
              )}
            </>
          )}

          <CardForm
            disabled={checkoutStatus === "processing"}
            onSubmit={handlePay}
            errors={fieldErrors}
            onFieldEdit={(field) => {
              setFieldErrors((prev) => ({ ...prev, [field]: undefined, general: undefined }));
            }}
          />

        </div>

        <div className="panel secondary">
          <FeeBreakdown fee={fee} />
        </div>
      </div>
    </div>
  );
}
