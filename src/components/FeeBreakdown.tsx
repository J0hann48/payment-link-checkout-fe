import type { FeeBreakdown as Fee } from "../api/paymentLinkApi";

function formatMoney(amount: number, currency: string) {
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

type Props = {
  fee: Fee;
};

export function FeeBreakdown({ fee }: Props) {
  const rows = [
    { label: "Monto base", value: fee.baseAmount },
    { label: "Comision PSP", value: fee.processingFee },
    { label: "FX", value: fee.fxFee },
    { label: "Descuento incentivo", value: -fee.incentiveDiscount },
  ];

  return (
    <div className="fee-card">
      <div className="fee-row header">
        <span>Desglose de tarifas</span>
        <span className="fee-currency">{fee.currency}</span>
      </div>

      {rows.map((row) => (
        <div key={row.label} className="fee-row">
          <span>{row.label}</span>
          <span>{formatMoney(row.value, fee.currency)}</span>
        </div>
      ))}

      <div className="fee-row total">
        <span>Tarifas totales</span>
        <span>{formatMoney(fee.totalFees, fee.currency)}</span>
      </div>

      <div className="fee-row final">
        <span>Total a pagar</span>
        <span>{formatMoney(fee.finalAmount, fee.currency)}</span>
      </div>
    </div>
  );
}
