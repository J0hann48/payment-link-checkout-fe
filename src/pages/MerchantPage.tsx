import { useMemo, useState } from "react";
import {
  createPaymentLink,
  listAllPaymentLinks,
  updatePaymentLink,
  deletePaymentLink,
  type PaymentLinkView,
} from "../api/paymentLinkApi";
import { FeeBreakdown } from "../components/FeeBreakdown";
import { StatusBanner } from "../components/StatusBanner";
import { resolveCheckoutUrl } from "../utils/url";

const MAX_EXPIRY_DAYS = 10;
const DEFAULT_MERCHANT_ID = "1";
const RECIPIENT_ID = "1";

function addDays(base: Date, days: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
}

function toDateValue(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function MerchantPage() {
  const defaultExpiry = useMemo(() => toDateValue(addDays(new Date(), 1)), []);
  const maxExpiry = useMemo(() => toDateValue(addDays(new Date(), MAX_EXPIRY_DAYS)), []);

  const [merchantId] = useState(DEFAULT_MERCHANT_ID);
  const [amount, setAmount] = useState("100000");
  const [currency, setCurrency] = useState("USD");
  const [description, setDescription] = useState("");
  const [expiresAt, setExpiresAt] = useState(defaultExpiry);
  const [expiryError, setExpiryError] = useState<string | null>(null);

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createdLink, setCreatedLink] = useState<PaymentLinkView | null>(null);

  const [links, setLinks] = useState<PaymentLinkView[]>([]);
  const [listError, setListError] = useState<string | null>(null);
  const [listing, setListing] = useState<boolean>(false);

  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editExpiresAt, setEditExpiresAt] = useState<string>("");
  const [editError, setEditError] = useState<string | null>(null);
  const [updating, setUpdating] = useState<boolean>(false);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const createdCheckoutUrl = useMemo(
    () => (createdLink ? resolveCheckoutUrl(createdLink.checkoutUrl, createdLink.slug) : ""),
    [createdLink]
  );

  function normalizeError(err: any, fallback: string) {
    if (err?.code === "MERCHANT_NOT_FOUND") {
      return err?.message ?? "Merchant no encontrado";
    }
    if (err?.message?.includes("conexion")) {
      return "No hay conexion con el servidor";
    }
    return err?.message ?? fallback;
  }

  function validateExpiry(value: string) {
    if (!value) return null;
    const chosen = new Date(`${value}T00:00:00`);
    if (Number.isNaN(chosen.getTime())) return "Fecha invalida";

    const now = new Date();
    const today = new Date(`${toDateValue(now)}T00:00:00`);
    const diffMs = chosen.getTime() - today.getTime();
    const maxMs = MAX_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
    if (diffMs > maxMs) {
      return `No puedes generar un link por mas de ${MAX_EXPIRY_DAYS} dias`;
    }
    return null;
  }

  function sanitizeAmountInput(value: string) {
    const cleaned = value.replace(/[^0-9.]/g, "");
    const [whole = "", decimals] = cleaned.split(".");
    const next = decimals !== undefined ? `${whole}.${decimals.slice(0, 2)}` : whole;
    return next;
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const expError = validateExpiry(expiresAt);
    if (expError) {
      setExpiryError(expError);
      return;
    }

    setCreating(true);
    setCreateError(null);
    setCreatedLink(null);

    try {
      const payload = {
        merchantId: Number(merchantId),
        recipientId: Number(RECIPIENT_ID),
        amount: Number(amount),
        currency,
        description: description || undefined,
        expiresAt: expiresAt || undefined,
      };

      const res = await createPaymentLink(payload);
      setCreatedLink(res);
      await loadList();
    } catch (err: any) {
      console.error(err);
      setCreateError(normalizeError(err, "No se pudo crear el payment link"));
    } finally {
      setCreating(false);
    }
  }

  async function loadList() {
    setListing(true);
    setListError(null);
    try {
      const res = await listAllPaymentLinks();
      setLinks(res);
    } catch (err: any) {
      console.error(err);
      setListError(normalizeError(err, "No se pudo cargar la lista"));
    } finally {
      setListing(false);
    }
  }

  function startEdit(link: PaymentLinkView) {
    if (link.status === "PAID") {
      setEditError("No puedes editar un link pagado.");
      return;
    }
    setEditingSlug(link.slug);
    setEditAmount(String(link.amount));
    setEditDescription(link.description ?? "");
    setEditExpiresAt(link.expiresAt ? link.expiresAt.split("T")[0] : "");
    setEditError(null);
  }

  function clearEdit() {
    setEditingSlug(null);
    setEditAmount("");
    setEditDescription("");
    setEditExpiresAt("");
    setEditError(null);
  }

  async function handleUpdate(e: React.FormEvent) {
    e.preventDefault();
    if (!editingSlug) return;
    const expErr = editExpiresAt ? validateExpiry(editExpiresAt) : null;
    if (expErr) {
      setEditError(expErr);
      return;
    }
    setUpdating(true);
    setEditError(null);
    try {
      await updatePaymentLink(editingSlug, {
        merchantId: Number(merchantId),
        recipientId: Number(RECIPIENT_ID),
        amount: Number(editAmount),
        currency,
        description: editDescription || undefined,
        expiresAt: editExpiresAt || undefined,
      });
      await loadList();
      clearEdit();
    } catch (err: any) {
      console.error(err);
      setEditError(normalizeError(err, "No se pudo actualizar el link"));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete(slug: string) {
    setDeletingSlug(slug);
    try {
      await deletePaymentLink(slug, Number(merchantId));
      await loadList();
    } catch (err: any) {
      console.error(err);
      setListError(normalizeError(err, "No se pudo eliminar el link"));
    } finally {
      setDeletingSlug(null);
    }
  }

  // Cargar lista inicial
  useMemo(() => {
    loadList();
  }, []);

  function formatDate(value: string | undefined) {
    if (!value) return "-";
    return value.split("T")[0];
  }

  function formatAmount(value: number, currencyCode: string) {
    return `${Number(value).toLocaleString()} ${currencyCode}`;
  }

  return (
    <div className="merchant-page">
      <div className="merchant-header">
        <p className="eyebrow">Portal merchant (demo)</p>
        <h1>Crear y consultar payment links</h1>
        <p className="subhead">
          Usa los endpoints autenticados de merchant para crear links y ver su estado.
        </p>
      </div>

      <div className="merchant-grid">
        <div className="panel">
          <h2>Crear payment link</h2>
          <form className="merchant-form" onSubmit={handleCreate}>
            <input type="hidden" value={RECIPIENT_ID} />

            <div className="field-row">
              <div className="field">
                <label>Monto</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  inputMode="decimal"
                  value={amount}
                  onChange={(e) => setAmount(sanitizeAmountInput(e.target.value))}
                  required
                />
              </div>
              <div className="field">
                <label>Moneda</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  required
                >
                  <option value="USD">USD</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label>Descripcion</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ej: Cobro USD con liquidez MXN"
              />
            </div>

            <div className="field">
              <label>Expiracion link</label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => {
                  const next = e.target.value.split("T")[0] ?? "";
                  setExpiresAt(next);
                  const errMsg = validateExpiry(next);
                  setExpiryError(errMsg);
                }}
                min={toDateValue(new Date())}
                max={maxExpiry}
                required
              />
              {expiryError && <span className="field-error">{expiryError}</span>}
            </div>

            <button type="submit" disabled={creating}>
              {creating ? "Creando..." : "Crear link"}
            </button>
          </form>

          {createError && <StatusBanner type="error" message={createError} />}
          {createdLink && (
            <div className="result-card">
              <StatusBanner type="success" message="Link creado" />
              <div className="cta-row">
                <button
                  type="button"
                  className="link-button ghost"
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(createdCheckoutUrl);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2500);
                    } catch {
                      setCopiedLink(false);
                    }
                  }}
                >
                  {copiedLink ? "Link copiado" : "Copiar link completo"}
                </button>
              </div>
              {createdLink.feeBreakdown && (
                <>
                  <p><strong>Tarifas previas:</strong></p>
                  <FeeBreakdown fee={createdLink.feeBreakdown} />
                </>
              )}
            </div>
          )}
        </div>

        <div className="panel">
          <h2>Lista de payment links</h2>
          <button type="button" className="link-button" onClick={loadList} disabled={listing}>
            {listing ? "Actualizando..." : "Refrescar"}
          </button>
          {listError && <StatusBanner type="error" message={listError} />}
          {links.length === 0 && !listError && <p>No hay links cargados.</p>}
          {links.length > 0 && (
            <div className="list-table">
              <div className="list-header">
                <span>Slug</span>
                <span>Monto</span>
                <span>Status</span>
                <span>Expira</span>
                <span>Acciones</span>
              </div>
              {links.map((l) => (
                <div key={l.slug} className="list-row">
                  <span className="mono">{l.slug}</span>
                  <span>{formatAmount(l.amount, l.currency)}</span>
                  <span><span className={`badge ${l.status.toLowerCase()}`}>{l.status}</span></span>
                  <span>{formatDate(l.expiresAt)}</span>
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() => startEdit(l)}
                      className="ghost icon-btn"
                      title="Editar"
                      aria-label="Editar"
                      disabled={l.status === "PAID"}
                    >
                      ✏️
                    </button>
                    <button
                      type="button"
                      className="danger icon-btn"
                      onClick={() => handleDelete(l.slug)}
                      disabled={deletingSlug === l.slug}
                      title="Eliminar"
                      aria-label="Eliminar"
                    >
                      {deletingSlug === l.slug ? "…" : "🗑️"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {editingSlug && (
            <div className="edit-form">
              <form className="merchant-form" onSubmit={handleUpdate}>
                <div className="field-row">
                  <div className="field">
                    <label>Monto</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      inputMode="decimal"
                      value={editAmount}
                      onChange={(e) => setEditAmount(sanitizeAmountInput(e.target.value))}
                      required
                    />
                  </div>
                  <div className="field">
                    <label>Descripcion</label>
                    <input
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                    />
                  </div>
                </div>

                <div className="field">
                  <label>Expiracion link</label>
                  <input
                    type="date"
                    value={editExpiresAt}
                    onChange={(e) => {
                      const next = e.target.value.split("T")[0] ?? "";
                      setEditExpiresAt(next);
                      const errMsg = validateExpiry(next);
                      setEditError(errMsg);
                    }}
                    min={toDateValue(new Date())}
                    max={maxExpiry}
                  />
                  {editError && <span className="field-error">{editError}</span>}
                </div>

                <div className="actions">
                  <button type="submit" disabled={updating}>
                    {updating ? "Actualizando..." : "Guardar cambios"}
                  </button>
                  <button type="button" className="danger" onClick={clearEdit}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
