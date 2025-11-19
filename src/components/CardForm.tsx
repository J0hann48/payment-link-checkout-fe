import { useState } from "react";
import type { CardData } from "../psp/mockPspSdk";

type Props = {
  disabled?: boolean;
  onSubmit: (card: CardData) => void;
  errors?: {
    number?: string;
    month?: string;
    year?: string;
    cvc?: string;
    general?: string;
  };
  onFieldEdit?: (field: "number" | "expMonth" | "expYear" | "cvc") => void;
};

export function CardForm({ disabled, onSubmit, errors, onFieldEdit }: Props) {
  const [number, setNumber] = useState("");
  const [expMonth, setExpMonth] = useState("");
  const [expYear, setExpYear] = useState("");
  const [cvc, setCvc] = useState("");
  const [monthError, setMonthError] = useState<string | null>(null);
  const [numberError, setNumberError] = useState<string | null>(null);
  const [cvcError, setCvcError] = useState<string | null>(null);
  const [yearError, setYearError] = useState<string | null>(null);
  const [generalError, setGeneralError] = useState<string | null>(null);

  function isValidLuhn(value: string) {
    let sum = 0;
    let shouldDouble = false;
    for (let i = value.length - 1; i >= 0; i -= 1) {
      let digit = Number(value[i]);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disabled) return;

    const cleanNumber = number.replace(/\s+/g, "");
    if (!/^\d{16}$/.test(cleanNumber)) {
      setNumberError("El numero debe tener exactamente 16 digitos");
      return;
    }
    if (!isValidLuhn(cleanNumber)) {
      setNumberError("El numero de tarjeta no es valido");
      return;
    }

    const monthNum = Number(expMonth);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      setMonthError("El mes debe estar entre 1 y 12");
      return;
    }

    if (!/^\d{1,2}$/.test(expYear)) {
      setYearError("El ano debe tener hasta 2 digitos numericos");
      return;
    }

    setMonthError(null);
    setNumberError(null);
    setCvcError(null);
    setYearError(null);
    setGeneralError(null);
    onSubmit({ number, expMonth, expYear, cvc });
  }

  return (
    <form className="card-form" onSubmit={handleSubmit}>
      <div className="field">
        <label>Numero de tarjeta</label>
        <input
          value={number}
          onChange={(e) => {
            const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 16);
            const formatted = digitsOnly.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
            setNumber(formatted);
            if (numberError || errors?.number) setNumberError(null);
            if (digitsOnly.length > 0 && digitsOnly.length < 16) {
              setNumberError("El numero debe tener exactamente 16 digitos");
            }
            onFieldEdit?.("number");
          }}
          placeholder="4242 4242 4242 4242"
          inputMode="numeric"
          autoComplete="cc-number"
          maxLength={19}
          disabled={disabled}
          required
        />
        {(numberError || errors?.number) && <span className="field-error">{errors?.number ?? numberError}</span>}
      </div>

      <div className="field-row">
        <div className="field">
          <label>MM</label>
          <input
            value={expMonth}
            onChange={(e) => {
              setExpMonth(e.target.value.replace(/[^\d]/g, ""));
              if (monthError) setMonthError(null);
              onFieldEdit?.("expMonth");
            }}
            placeholder="12"
            inputMode="numeric"
            autoComplete="cc-exp-month"
            disabled={disabled}
            required
          />
          {(monthError || errors?.month) && <span className="field-error">{errors?.month ?? monthError}</span>}
        </div>
        <div className="field">
          <label>YY</label>
          <input
            value={expYear}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d]/g, "");
              setExpYear(next.slice(0, 2));
              if (yearError) setYearError(null);
              onFieldEdit?.("expYear");
            }}
            placeholder="28"
            inputMode="numeric"
            autoComplete="cc-exp-year"
            maxLength={2}
            disabled={disabled}
            required
          />
          {(yearError || errors?.year) && <span className="field-error">{errors?.year ?? yearError}</span>}
        </div>
        <div className="field">
          <label>CVC</label>
          <input
            type="password"
            value={cvc}
            onChange={(e) => {
              const next = e.target.value.replace(/[^\d]/g, "");
              setCvc(next.slice(0, 3));
              if (cvcError) setCvcError(null);
              onFieldEdit?.("cvc");
            }}
            placeholder="123"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={3}
            disabled={disabled}
            required
          />
          {(cvcError || errors?.cvc) && <span className="field-error">{errors?.cvc ?? cvcError}</span>}
        </div>
      </div>

      <p className="helper">
        Usa tarjetas que terminen en 0001/0002/0003/0004 para simular errores desde el backend, o 9999 para simular un fallo del SDK.
      </p>

      {(errors?.general || generalError) && (
        <p className="field-error">{errors?.general ?? generalError}</p>
      )}

      <button type="submit" disabled={disabled}>
        {disabled ? "Procesando..." : "Pagar ahora"}
      </button>
    </form>
  );
}
