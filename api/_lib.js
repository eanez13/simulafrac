import { createClient } from '@supabase/supabase-js';

export const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

export async function userFromRequest(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  if (!token) return null;
  const { data, error } = await sb.auth.getUser(token);
  return error ? null : data.user;
}

export async function mp(path, opts = {}) {
  const r = await fetch('https://api.mercadopago.com' + path, {
    ...opts,
    headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`, 'Content-Type': 'application/json', ...(opts.headers || {}) },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.message || `Mercado Pago ${r.status}`);
  return j;
}

/** Copia el estado de una suscripción de Mercado Pago al perfil del usuario. */
export async function syncPreapproval(id) {
  const pre = await mp(`/preapproval/${id}`);
  const userId = pre.external_reference;
  if (!userId) return;
  const upd = { member_status: pre.status, mp_preapproval_id: pre.id };
  if (pre.status === 'authorized' && pre.next_payment_date) {
    // acceso hasta el próximo cobro + 2 días de margen
    upd.member_until = new Date(new Date(pre.next_payment_date).getTime() + 2 * 864e5).toISOString();
  }
  await sb.from('profiles').update(upd).eq('id', userId);
}
