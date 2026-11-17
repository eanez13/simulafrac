// POST /api/subscribe  → crea la suscripción mensual en Mercado Pago y devuelve el enlace de pago
import { sb, userFromRequest, mp } from './_lib.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Método no permitido' });
  const user = await userFromRequest(req);
  if (!user) return res.status(401).json({ error: 'Inicia sesión de nuevo' });
  try {
    const pre = await mp('/preapproval', {
      method: 'POST',
      body: JSON.stringify({
        reason: 'Membresía mensual SimulaFrac',
        external_reference: user.id,
        payer_email: user.email,
        back_url: `${process.env.APP_URL}/?pago=ok`,
        auto_recurring: {
          frequency: 1,
          frequency_type: 'months',
          transaction_amount: Number(process.env.MP_PRICE_ARS),
          currency_id: 'ARS',
        },
        status: 'pending',
      }),
    });
    await sb.from('profiles').update({ mp_preapproval_id: pre.id }).eq('id', user.id);
    res.json({ init_point: pre.init_point });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
