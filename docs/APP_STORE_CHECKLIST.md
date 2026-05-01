# App Store Submission Checklist — Mimi

A pragmatic punch list of everything that has to happen OUTSIDE the
codebase before App Review will accept the build. Most of it lives
inside App Store Connect (ASC).

> Updated: 2026-05-01. Track here what's done and what's pending.

---

## 0. In the codebase (already done)

- [x] App icon 1024×1024 sRGB PNG, no alpha, no rounded corners.
- [x] Custom splash with night-sky gradient (`assets/splash.png`).
- [x] `ITSAppUsesNonExemptEncryption: false` in Info.plist (no
      export-compliance prompts).
- [x] Account deletion flow (`Settings → Delete account` → server-side
      via `delete-account` Edge Function + local AsyncStorage wipe).
- [x] Sign in with Apple wired up alongside Google (required by
      App Review whenever a third-party SSO is offered).
- [x] In-app **Privacy policy** and **Terms of use** (Settings → Legal
      → tap row).
- [x] In-app **Support** entry (mailto: link).
- [x] Notifications toggle is opt-in; permission requested on enable.

---

## 1. Privacy hosting (REQUIRED)

App Review requires a **public, persistent URL** for the privacy
policy. The in-app version isn't enough — Apple needs a URL they can
hit.

Options:
1. **GitHub Pages** (free, easiest) — push a static `privacy.html`
   to e.g. `https://carlospariente.github.io/mimi-legal/privacy`.
2. Custom domain — e.g. `https://mimi.app/privacy`.
3. Notion / Substack / any plain-text host that returns HTML.

Both **Privacy policy** and **Terms of use** should have public URLs.
Use the same content as the in-app screens (`src/i18n/legal.ts`).

Replace the placeholder support email `hola@mimi.app` with your real
contact mailbox in `src/i18n/legal.ts` and in `ProfileScreen` before
publishing.

---

## 2. App Store Connect — App Information

Path: ASC → My Apps → Mimi → App Information.

- [ ] **Privacy Policy URL** — required. Paste the URL from §1.
- [ ] **Subtitle** (max 30 chars) — e.g. `Sleep tracking, calm nights`.
- [ ] **Category**: Primary `Health & Fitness`. Secondary optional.
- [ ] **Content rights**: confirm you own the content.

---

## 3. App Store Connect — Pricing & Availability

- [ ] **Price tier**: free.
- [ ] **Availability**: select the territories you want to ship in.

---

## 4. App Store Connect — App Privacy

Path: ASC → Mimi → App Privacy. Apple asks a structured questionnaire.
Answer based on Mimi's data flow:

- [ ] Add data type: **Email Address** — Linked to user, Used for App
      Functionality (account auth).
- [ ] Add data type: **Name** — Linked to user, Used for App
      Functionality (account display).
- [ ] Add data type: **User ID** — Linked, App Functionality
      (Supabase user id).
- [ ] Add data type: **Health & Fitness — Sleep** — Linked, App
      Functionality. (We track sleep sessions.)
- [ ] Add data type: **Sensitive Info — Other** — only if you decide
      that DOB / sex of the baby qualifies. Apple's docs are loose
      here; conservatively yes.
- [ ] **Tracking**: NO. Mimi does not track users across other apps
      or websites.

---

## 5. App Store Connect — Version 1.0 page

Path: ASC → Mimi → Distribution → 1.0.

- [ ] **Build**: select the latest TestFlight build (currently 33).
- [ ] **Promotional text** (optional, 170 chars).
- [ ] **Description** (long form, max 4000 chars). Suggested first
      paragraph:
      > Mimi te acompaña en el sueño de tu bebé con sugerencias
      > suaves basadas en su edad. Registra siestas, despertares y
      > rutinas de noche en segundos, recibe avisos antes de la
      > hora de dormir y consulta el ritmo de la última semana. Sin
      > publicidad ni rastreo: tus datos viven en tu cuenta o sólo
      > en tu dispositivo.
- [ ] **Keywords** (100 chars total, comma-separated, English):
      `baby, sleep, tracker, naps, bedtime, nights, parents,
      newborn, infant, routine`.
- [ ] **Support URL** — e.g. `https://mimi.app/support` or a mailto:
      page. Required.
- [ ] **Marketing URL** — optional.
- [ ] **Screenshots**:
  - Required: **6.7" iPhone** (e.g. iPhone 15 Pro Max, 1290×2796).
  - Recommended: **6.5"** (1242×2688) — Apple auto-uses 6.7" if
    only that's provided.
  - Take 4–5 screenshots covering: dashboard, timeline, stats,
    calendar carousel, onboarding.
  - Use Xcode Simulator → Device → Screenshot (Cmd+S) on an iPhone
    15 Pro Max sim for the right resolution.

---

## 6. Age rating

Path: ASC → Mimi → Age Rating.

- [ ] Run the questionnaire. For Mimi every category should be
      "None" / "Not present" — final rating should land at **4+**.

---

## 7. App Review information

Path: ASC → Mimi → App Review Information.

- [ ] **Sign-in info**: Apple needs a way to test the OAuth flow.
      Options:
      a. Provide a demo Apple ID + password (least friction).
      b. Note that "Apple Sign In can be used with the reviewer's
         own Apple ID; no demo account required" — usually
         accepted.
- [ ] **Notes**: (optional) explain account deletion path:
      "Account deletion: open Settings → Eliminar cuenta → confirm.
      All server data and local data are wiped immediately."
- [ ] **Contact info**: your phone + email.

---

## 8. Build readiness (TestFlight)

- [ ] At least one TestFlight build is uploaded and finished
      processing (no "Missing Compliance" warnings).
- [ ] You've internally tested:
  - Sign in with Apple end-to-end.
  - Sign in with Google end-to-end.
  - Account deletion (server-side wipe + local wipe).
  - Sign out (local wipe + back to Welcome).
  - Bedtime reminder permission + schedule.
  - Adding / editing / deleting a baby.

---

## 9. Submit for review

Path: ASC → Mimi → Distribution → 1.0 → **Add for Review**.

Apple typically responds in 24–72h.

If they reject:
- Read their feedback verbatim.
- Most common rejections: privacy URL missing/broken, account
  deletion flow not visible, demo account doesn't work, screenshots
  showing test data with personally-identifiable info, missing
  Sign in with Apple alongside Google.

---

## Post-launch quick checklist

Once live in production:

- [ ] Verify the live App Store listing has the correct icon, the
      privacy URL works, and the build is 1.0.
- [ ] Test the install flow on a fresh device.
- [ ] Confirm the Edge Function `delete-account` actually wipes a
      production user (use a throwaway account).
- [ ] Set up an alert for any Supabase function errors.
