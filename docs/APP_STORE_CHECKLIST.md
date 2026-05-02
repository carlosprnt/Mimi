# App Store Submission Checklist — Mimi

Punch list de todo lo que tiene que pasar para que App Review acepte
el build. Marca cada paso conforme lo hagas.

> Updated: 2026-05-01.

---

## ✅ Hecho (en código)

- [x] App icon 1024×1024 sRGB PNG, no alpha, no rounded corners.
- [x] Custom splash con cielo nocturno (`assets/splash.png`).
- [x] `ITSAppUsesNonExemptEncryption: false` en Info.plist (no
      preguntan compliance de exportación).
- [x] Account deletion server-side via Supabase Edge Function
      `delete-account` + wipe local AsyncStorage + App Group widget.
- [x] Sign in with Apple + Google (Apple obligatorio si ofreces
      cualquier SSO).
- [x] In-app **Privacy policy** y **Terms of use** (Settings → Legal).
- [x] In-app **Support** (mailto: a `carlosprnt@gmail.com`).
- [x] Notificaciones opt-in (sólo se programan si el usuario activa
      el toggle).
- [x] HTML estáticos para hosting público en `docs/`:
      `index.html`, `privacy.html`, `terms.html`, `support.html`,
      `.nojekyll`.
- [x] Copy de App Store en `docs/APP_STORE_COPY.md` listo para pegar.
- [x] Email de soporte real (`carlosprnt@gmail.com`) sustituido en
      `src/i18n/legal.ts` y `src/screens/ProfileScreen.tsx`.

---

## 🔧 Pendiente — Activar GitHub Pages (1 minuto)

GitHub Pages servirá los HTMLs públicos que App Review necesita.

1. En GitHub → repo `carlosprnt/mimi` → **Settings**.
2. Sidebar izquierdo → **Pages**.
3. Source: **Deploy from a branch**.
4. Branch: **main** + Folder: **/docs** → **Save**.
5. Espera ~1-2 min. GitHub mostrará: `Your site is live at https://carlosprnt.github.io/mimi/`.

Verifica que estas URLs cargan:
- https://carlosprnt.github.io/mimi/
- https://carlosprnt.github.io/mimi/privacy.html
- https://carlosprnt.github.io/mimi/terms.html
- https://carlosprnt.github.io/mimi/support.html

---

## 🔧 Pendiente — Screenshots para App Store

Apple exige **6.7"** mínimo (iPhone 15 Pro Max, 1290×2796).

1. Abre Xcode → Product → Destination → **iPhone 15 Pro Max** simulator.
2. **Cmd+R** para arrancar la app en el simulator.
3. Pasa por las pantallas que mejor venden la app y haz screenshot
   en cada una con **Cmd+S** (se guardan en el escritorio):
   - Welcome (con la imagen del bebé centrada).
   - Dashboard activo durmiendo.
   - Timeline con eventos.
   - Stats / charts semanales.
   - Onboarding (paso 2 o 5 con ilustración).
4. Necesitas **3-10 screenshots** (recomendado: 5).
5. Súbelas en ASC → Mimi → Distribución → 1.0 → Vistas previas y
   capturas de pantalla → iPhone 6.7".

---

## 🔧 Pendiente — App Store Connect (Distribución 1.0)

Pega los textos de `docs/APP_STORE_COPY.md` en cada campo:

### App Information
- [ ] **Privacy Policy URL** → `https://carlosprnt.github.io/mimi/privacy.html`
- [ ] **Subtitle** → `Sueño tranquilo, noches mejores`
- [ ] **Categoría primary**: Health & Fitness
- [ ] **Content rights**: confirma que eres el dueño del contenido.

### Pricing & Availability
- [ ] **Price**: Free.
- [ ] **Availability**: España + el resto que quieras.

### Versión 1.0 (Distribución)
- [ ] **Build**: selecciona el último build de TestFlight.
- [ ] **Promotional text**: copy de `APP_STORE_COPY.md`.
- [ ] **Description**: copy de `APP_STORE_COPY.md`.
- [ ] **Keywords**: copy de `APP_STORE_COPY.md`.
- [ ] **Support URL** → `https://carlosprnt.github.io/mimi/support.html`
- [ ] **Marketing URL** (opcional) → `https://carlosprnt.github.io/mimi/`
- [ ] **Screenshots** 6.7" (ver paso anterior).

### Age Rating
- [ ] Cuestionario completo, todo "None" → debería salir **4+**.

### App Privacy
Path: ASC → Mimi → App Privacy → Manage. Declarar:
- [ ] **Email Address**: Linked to user, App Functionality.
- [ ] **Name**: Linked, App Functionality.
- [ ] **User ID**: Linked, App Functionality.
- [ ] **Health & Fitness → Sleep**: Linked, App Functionality.
- [ ] **Sensitive Info → Other** (DOB del bebé): Linked, App Functionality.
- [ ] **Tracking**: NO.

### App Review Information
- [ ] **Sign-in info**: marca "Sign-in required: NO" (la app
      funciona sin cuenta) o "YES" + provee demo. Recomendado: NO,
      explica en notas que el botón de Apple usa el Apple ID del
      reviewer.
- [ ] **Notes**: pegar el bloque de `APP_STORE_COPY.md` →
      "App Review notes".
- [ ] **Contact info**: tu nombre, teléfono, email.

---

## 🚀 Submit

ASC → Mimi → 1.0 → **Add for Review**.

Apple suele responder en 24-72h. Posibles rechazos comunes:
- Privacy URL roto o no público → re-verifica que GitHub Pages está activo.
- Demo account no funciona → si pones que se necesita login, comprueba la cuenta demo.
- Falta Sign in with Apple → ya lo tenemos.
- Account deletion no encontrable → ya lo tenemos en Settings.

---

## Post-launch

- [ ] Verifica el listing público en App Store.
- [ ] Test del install en un device limpio.
- [ ] Confirma que `delete-account` funciona en producción (con
      cuenta de prueba).
