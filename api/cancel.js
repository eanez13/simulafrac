// POST /api/cancel  → cancela la renovación; el acceso sigue hasta member_until
import { sb, userFromRequest, mp } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Inicia sesión de nuevo' });
  const { data: prof } = await sb.from('profiles').select('mp_preapproval_id').eq('id', user.id).single();
  if (!prof?.mp_preapproval_id) return res.status(400).json({ error: 'No hay suscripción activa' });
  try {
    await mp(`/preapproval/${prof.mp_preapproval_id}`, { method: 'PUT', body: JSON.stringify({ status: 'cancelled' }) });
    await sb.from('profiles').update({ member_status: 'cancelled' }).eq('id', user.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
