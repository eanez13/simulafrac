// POST /api/mp-webhook  → Mercado Pago avisa altas, cobros y bajas de suscripciones
import crypto from 'node:crypto';
import { mp, syncPreapproval } from './_lib.js';

function validSignature(req, dataId) {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return true; // sin clave configurada no se valida (configúrala en producción)
  const sig = req.headers['x-signature'] || '';
  const ts = (sig.match(/ts=([^,]+)/) || [])[1];
  const v1 = (sig.match(/v1=([^,]+)/) || [])[1];
  if (!ts || !v1) return false;
  const manifest = `id:${dataId};request-id:${req.headers['x-request-id'] || ''};ts:${ts};`;
  const h = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  return h === v1;
}

export default async function handler(req, res) {
  const type = req.body?.type || req.query.type || req.query.topic || '';
  const id = req.body?.data?.id || req.query['data.id'] || req.query.id;
  if (!id) return res.status(200).end();
  if (!validSignature(req, id)) return res.status(401).end();
  try {
    if (type.includes('authorized_payment')) {
      const pay = await mp(`/authorized_payments/${id}`);
      if (pay.preapproval_id) await syncPreapproval(pay.preapproval_id);
    } else if (type.includes('preapproval')) {
      await syncPreapproval(id);
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
}
