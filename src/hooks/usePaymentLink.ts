import { useEffect, useState } from 'react';
import {
  getPaymentLinkBySlug,
  type PaymentLinkView,
  type FeeBreakdown,
} from '../api/paymentLinkApi';

type Status = 'idle' | 'loading' | 'loaded' | 'error';

export function usePaymentLink(slug: string | undefined) {
  const [status, setStatus] = useState<Status>('idle');
  const [link, setLink] = useState<PaymentLinkView | null>(null);
  const [fee, setFee] = useState<FeeBreakdown | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setStatus('loading');
    setError(null);

    getPaymentLinkBySlug(slug)
      .then((linkRes) => {
        setLink(linkRes);
        setFee(linkRes.feeBreakdown ?? null);
        setStatus('loaded');
      })
      .catch((e) => {
        console.error(e);
        setError('No se pudo cargar el enlace de pago (puede estar expirado o no existir).');
        setStatus('error');
      });
  }, [slug]);

  return { status, link, fee, error };
}
