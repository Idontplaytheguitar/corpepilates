# Pilates Reformer — Full Feature Design

**Date:** 2026-02-24
**Status:** Approved

---

## Overview

Enhance the existing Corpe Pilates Reformer booking platform with:
1. Alias/CVU + cash payment flow with manual admin verification
2. User profile collection (dirección + obra social) on first booking
3. Reglamento (studio rules) popup before every booking + on-demand
4. Complete CMS admin panel with live preview, draft mode, image previews
5. Weekly calendar views (public + admin)
6. Dedicated pending payments tab in admin with count badge
7. Mouse scroll animation fix
8. Forgot password via configurable recovery email

---

## Architecture

**Approach:** Surgical refactor of UI/UX layers. Existing API routes, Redis storage, and MercadoPago integration remain intact. New features added as new API routes and components. No database migration.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Redis (ioredis), Nodemailer, MercadoPago SDK, Cloudinary.

---

## Section 1: Booking Wizard (`/reservar`)

### Flow

**5-step for first-time bookers, 3-step for returning users:**

| Step | Name | New/Existing |
|------|------|-------------|
| 1 | Reglamento | New |
| 2 | Seleccionar fecha y horario | Existing |
| 3 | Tus datos | Enhanced |
| 4 | Confirmar reserva + Pago | Enhanced |
| 5 | Confirmación | Enhanced |

### Step 1 — Reglamento
- Full-screen overlay modal with studio rules text (editable from admin CMS)
- User must scroll to bottom before "Acepto el reglamento" button activates
- Fires on **every** booking (not stored as "accepted once")
- Also accessible anytime via "📋 Ver reglamento" link in footer and `/reservar` page

### Step 3 — Tus datos
- Fields: Nombre, Email, Teléfono, **Dirección** (required), **Obra social** (required)
- On 2nd+ booking: "Usar datos anteriores" button at top auto-fills all fields
- Fields start empty; user clicks button to auto-fill
- Fields remain editable after auto-fill
- Profile data stored per-user in Redis under `corpepilates:user_profile:{userId}`

### Step 4 — Confirmar reserva + Pago
**When `mercadopagoEnabled: true`:**
- Primary CTA: "Pagar con MercadoPago" → existing MP flow
- Secondary link: "Reservar sin pagar (abonar después)" → creates pending booking

**When `mercadopagoEnabled: false`:**
- Shows alias/CVU info card (alias, CBU/CVU, bank, account holder from config)
- Two buttons: "Ya transferí — adjuntar comprobante" and "Pagar en efectivo al llegar"
- Both create a booking with `paymentStatus: 'pending'`

### Step 5 — Confirmación
- If pending payment: shows alias again + owner email + "Enviar comprobante por WhatsApp" button
- WhatsApp link pre-filled: `?text=Hola! Reservé una clase para [fecha] [hora]. Adjunto mi comprobante de pago.`
- Uses studio WhatsApp from site config

---

## Section 2: User Account (`/mi-cuenta`)

### 4-Tab Layout

**Tab 1 — Mi actividad**
- Upcoming classes: date, time, service, status badge (Confirmada / Pago pendiente / Cancelada)
- Past classes hidden by default with "Mostrar anteriores" toggle
- Cancel button on upcoming classes (up to 1 hour before)

**Tab 2 — Ver agenda (calendario)**
- Weekly grid, 7 columns, horizontally scrollable on mobile
- Color coding per slot:
  - 🟢 Green = spots available
  - 🔴 Red = full
  - 🔵 Blue = user is booked in this slot
- No student names visible to public
- Click available slot → opens booking wizard pre-filled with date/time

**Tab 3 — Mis packs / Créditos**
- Active packs: progress bar (used/total), expiry date, "Reservar clase" button
- Expired/exhausted packs below divider, collapsed by default

**Tab 4 — Mi perfil**
- Editable: Nombre, Email (read-only from Google), Teléfono, Dirección, Obra social
- Save button → updates Redis user profile

---

## Section 3: Admin Panel

### Layout
- Sidebar navigation (desktop) / bottom tabs (mobile)
- "Vista previa" toggle in top-right → split-screen: editor left, live preview iframe right
- Draft indicator badge when unsaved changes exist
- "Publicar" button saves draft and refreshes preview

### Sections

**Dashboard** *(new)*
- KPI cards: pending payments count (with red badge), today's classes, active users, monthly bookings
- Quick action buttons: go to pending payments, go to today's calendar

**Pagos pendientes** *(new)* — tab with count badge
- List of unverified bookings grouped by date
- Per row: user name, class, date/time, payment method (alias/efectivo/mp), amount
- "✓ Verificar" button → marks `paymentStatus: 'verified'`, sends confirmation email to user

**Reservas** *(enhanced)*
- Full list with inline "✓ Verificar pago" checkbox
- Filter bar: todas / confirmadas / pendientes / canceladas
- Shows: dirección, obra social per reservation

**Calendario admin** *(new)*
- Same weekly grid as user calendar
- Shows full student names per slot
- Payment status badge per student (✓ verified / ⏳ pending)
- Capacity bar per slot (e.g., 3/5 camas)
- Click slot → student list modal
- Click student → their reservation detail

**CMS — Inicio**
- Edit Hero text (title, tagline, CTA button text)
- Edit About section text
- Live preview panel
- Draft mode with "Publicar" button

**CMS — Servicios**
- Create/edit/delete services
- Image upload with immediate preview
- Edit name, description, price, duration
- Toggle bookable/paused
- Live preview of service card

**CMS — Packs**
- Create/edit/delete packs
- Image upload with immediate preview
- Edit name, description, class count, price, validity
- Toggle paused
- Live preview of pack card

**CMS — Reglamento** *(new)*
- Rich text editor for studio rules content
- "Vista previa" shows how it renders in the modal
- Saved to Redis under `corpepilates:config:reglamento`

**Configuración** *(enhanced)*
- All existing site config fields
- **Alias/CVU section** (visible when mercadopagoEnabled is off):
  - Alias, CBU/CVU, banco, titular
  - Recovery/contact email (used for forgot password)
- MercadoPago toggle + OAuth connect

**Seguridad** *(enhanced)*
- Existing: change password via OTP
- New: "Olvidé mi contraseña" link → sends reset link to site contact email
- Reset link: signed token in Redis, 30-min TTL → `/admin/reset-password?token=xxx`

---

## Section 4: UI Fixes & Polish

### Mouse Scroll Animation
- File: `src/components/Hero.tsx`
- Fix: `bottom: 2rem` minimum clearance, z-index below CTA buttons
- Fade out once user scrolls past 100px via `useEffect` scroll listener

### Forgot Password
- Admin login page: "¿Olvidaste tu contraseña?" link below password field
- Form: info text + "Enviar link" button
- API route: `POST /api/admin/auth/forgot-password` → generates signed token, emails it
- Reset page: `/admin/reset-password` with new password + confirm fields
- API route: `POST /api/admin/auth/reset-password` → validates token, updates password

### Reglamento Link
- Footer: subtle "📋 Ver reglamento" link
- `/reservar` page: same link above booking form
- Opens same modal component, but without mandatory accept — just a close button

### Email Notifications
- When admin verifies payment → send email to user: "Tu pago fue confirmado — tu clase del [fecha] está reservada."
- Uses existing Nodemailer setup in `src/lib/email.ts`

---

## Data Model Changes

### New Redis keys
| Key | Value | TTL |
|-----|-------|-----|
| `corpepilates:user_profile:{userId}` | `{direccion, obraSocial, telefono}` | none |
| `corpepilates:config:reglamento` | `string (HTML/text)` | none |
| `corpepilates:config:alias` | `{alias, cbu, banco, titular}` | none |
| `corpepilates:admin_reset:{token}` | `{createdAt}` | 30min |

### Enhanced existing models
- `Reservation` / `ScheduledClass`: add `paymentStatus: 'pending' | 'verified' | 'paid_online'`, `paymentMethod: 'alias' | 'efectivo' | 'mercadopago'`
- `SiteConfig`: add `aliasConfig: {alias, cbu, banco, titular}`, `reglamento: string`

---

## New Files to Create

```
src/app/admin/reset-password/page.tsx
src/app/api/admin/auth/forgot-password/route.ts
src/app/api/admin/auth/reset-password/route.ts
src/app/api/admin/reglamento/route.ts
src/app/api/admin/verify-payment/route.ts
src/app/api/user/profile/route.ts
src/components/ReglamentoModal.tsx
src/components/WeeklyCalendar.tsx
src/components/admin/CMSPreview.tsx
src/components/admin/PaymentMethodSelector.tsx
src/components/admin/PendingPaymentsTab.tsx
src/components/admin/CalendarAdminTab.tsx
src/components/admin/DashboardTab.tsx
```

## Files to Modify

```
src/app/reservar/page.tsx         — 5-step wizard with reglamento + profile + payment
src/app/mi-cuenta/page.tsx        — 4-tab layout with calendar tab + profile tab
src/app/admin/page.tsx            — full CMS layout with sidebar + preview
src/components/Hero.tsx           — fix mouse animation
src/components/Footer.tsx         — add reglamento link
src/data/config.ts                — new types for paymentStatus, aliasConfig
src/lib/email.ts                  — add payment verification email template
src/lib/auth.ts                   — add forgot/reset password functions
src/lib/storage.ts                — add user profile CRUD, alias config CRUD
```
