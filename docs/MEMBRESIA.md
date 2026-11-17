# Activar el cobro real de la membresía

La app ya trae el registro, el inicio de sesión, la prueba gratis de 7 días, el perfil y la pantalla de suscripción.
Mientras `SF_CONFIG` esté vacío funciona en **modo prueba**: las cuentas quedan en el navegador y el pago es simulado.

Para cobrar de verdad se usan tres servicios con plan gratuito:

| Servicio | Para qué |
|---|---|
| **Supabase** | Cuentas (correo y contraseña) y estado de la membresía |
| **Mercado Pago** | Cobro mensual automático (Suscripciones) |
| **Vercel** | Aloja la app y las funciones de pago (`/api`) |

## 1. Supabase
1. Crea un proyecto en https://supabase.com.
2. **SQL Editor** → pega y ejecuta `supabase/schema.sql`.
3. **Authentication → URL Configuration**: en *Site URL* pon la dirección final de la app (por ejemplo `https://simulafrac.vercel.app`).
4. **Project Settings → API**: copia `Project URL`, la clave `anon public` y la clave `service_role` (esta última es secreta).

## 2. Mercado Pago
1. Entra a https://www.mercadopago.com.ar/developers → **Tus integraciones → Crear aplicación** (producto: *Suscripciones*).
2. Copia el **Access Token de producción** (secreto).
3. En **Webhooks** agrega la URL `https://TU-APP.vercel.app/api/mp-webhook`, con los eventos *Planes y suscripciones*. Copia la **clave secreta** de la firma.

## 3. Vercel
1. Entra a https://vercel.com con tu cuenta de GitHub → **Add New → Project** → importa `eanez13/simulafrac`.
2. En **Environment Variables** agrega:

| Variable | Valor |
|---|---|
| `SUPABASE_URL` | Project URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | clave `service_role` (secreta) |
| `MP_ACCESS_TOKEN` | Access Token de producción de Mercado Pago (secreto) |
| `MP_WEBHOOK_SECRET` | clave secreta del webhook |
| `MP_PRICE_ARS` | precio mensual en pesos (Mercado Pago cobra en ARS; equivalente a US$ 5) |
| `APP_URL` | dirección de la app, por ejemplo `https://simulafrac.vercel.app` |

3. **Deploy**.

## 4. Conectar la app
En `index.html`, busca `const SF_CONFIG=` y completa:

```js
const SF_CONFIG={price:'US$ 5',period:'por mes',trialDays:7,
  supabaseUrl:'https://xxxx.supabase.co',
  supabaseKey:'clave anon public',
  apiBase:''};
```

La clave `anon public` puede estar en la app. **Nunca** pongas en `index.html` la `service_role` ni el Access Token de Mercado Pago.

## Cómo funciona
- Al registrarse, Supabase crea el perfil con `trial_end` = hoy + 7 días.
- «Suscribirme» llama a `/api/subscribe`, que crea la suscripción en Mercado Pago y abre el pago.
- Mercado Pago avisa a `/api/mp-webhook` en cada alta, cobro o baja, y la función actualiza `member_until`.
- La app muestra «Miembro», «Prueba · N días» o «Plan gratis» según esas fechas.

## Importante
- Cuando el cobro real esté activo, conviene que el repositorio de GitHub sea **privado** y que la app se sirva solo desde Vercel. Si el código queda público, alguien con conocimientos técnicos podría copiarlo y saltear el bloqueo.
- Para cobrar en Argentina necesitas poder facturar (consulta a un contador).
