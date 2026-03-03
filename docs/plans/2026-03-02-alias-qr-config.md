# Alias/QR Payment Config Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Admin configures alias + CBU/CVU in the Negocio tab; clients see alias data + scannable QR (encodes CBU) when paying for packs, reservations, or unpaid classes.

**Architecture:** New shared `AliasQRBox` component (qrcode.react) replaces two existing inline alias blocks + adds to mi-cuenta unpaid classes. Admin form fields write to existing `site.aliasConfig` (no schema change needed).

**Tech Stack:** Next.js 14 App Router, React, `qrcode.react`, Tailwind, TypeScript.

---

### Task 1: Install qrcode.react

**Files:**
- Modify: `package.json` (via npm)

**Step 1: Install the package**

```bash
npm install qrcode.react
npm install --save-dev @types/qrcode.react
```

> Note: `qrcode.react` v4+ ships its own types, so `@types/qrcode.react` may not be needed. If the second command errors, skip it.

**Step 2: Verify build still passes**

```bash
npm run build
```

Expected: ✓ Compiled successfully

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add qrcode.react"
```

---

### Task 2: Create `AliasQRBox` component

**Files:**
- Create: `src/components/AliasQRBox.tsx`

**What it does:**
- Accepts `aliasConfig: { alias?: string; cbu?: string; banco?: string; titular?: string }` prop
- Shows alias + CBU with copy buttons (copy icon → checkmark on success)
- Shows banco + titular as plain text rows
- Has a "Ver QR" button that opens a centered modal overlay with a `<QRCodeSVG>` of the CBU value (size 200) and a close button

**Step 1: Create the file**

```tsx
'use client'

import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, CheckCheck, QrCode, X } from 'lucide-react'

interface AliasConfig {
  alias?: string
  cbu?: string
  banco?: string
  titular?: string
}

interface Props {
  aliasConfig: AliasConfig
  accentColor?: 'violet' | 'rose'
  amount?: number
}

export default function AliasQRBox({ aliasConfig, accentColor = 'rose', amount }: Props) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [showQR, setShowQR] = useState(false)

  const handleCopy = (value: string | undefined, field: string) => {
    if (!value) return
    navigator.clipboard.writeText(value)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const bg = accentColor === 'violet' ? 'bg-violet-50 border-violet-200' : 'bg-rose-50 border-rose-200'
  const titleColor = accentColor === 'violet' ? 'text-violet-800' : 'text-rose-800'
  const textColor = accentColor === 'violet' ? 'text-violet-600' : 'text-rose-600'
  const hoverBg = accentColor === 'violet' ? 'hover:bg-violet-100' : 'hover:bg-rose-100'

  const { alias, cbu, banco, titular } = aliasConfig

  return (
    <>
      <div className={`border rounded-xl p-4 ${bg}`}>
        <div className="flex items-center justify-between mb-3">
          <p className={`text-sm font-medium ${titleColor}`}>Datos para la transferencia</p>
          {cbu && (
            <button
              onClick={() => setShowQR(true)}
              className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg border ${accentColor === 'violet' ? 'border-violet-300 text-violet-700 hover:bg-violet-100' : 'border-rose-300 text-rose-700 hover:bg-rose-100'} transition-colors`}
            >
              <QrCode className="w-3.5 h-3.5" />
              Ver QR
            </button>
          )}
        </div>
        <div className="space-y-2">
          {alias && (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-nude-400 block">Alias</span>
                <span className="text-sm font-mono font-medium text-rose-800">{alias}</span>
              </div>
              <button
                onClick={() => handleCopy(alias, 'alias')}
                className={`p-2 rounded-lg ${hoverBg} ${textColor} transition-colors`}
                title="Copiar alias"
              >
                {copiedField === 'alias' ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
          {cbu && (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-nude-400 block">CBU/CVU</span>
                <span className="text-xs font-mono font-medium text-rose-800 break-all">{cbu}</span>
              </div>
              <button
                onClick={() => handleCopy(cbu, 'cbu')}
                className={`p-2 rounded-lg ${hoverBg} ${textColor} transition-colors flex-shrink-0 ml-2`}
                title="Copiar CBU"
              >
                {copiedField === 'cbu' ? <CheckCheck className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          )}
          {banco && (
            <div>
              <span className="text-xs text-nude-400 block">Banco</span>
              <span className="text-sm font-medium text-rose-800">{banco}</span>
            </div>
          )}
          {titular && (
            <div>
              <span className="text-xs text-nude-400 block">Titular</span>
              <span className="text-sm font-medium text-rose-800">{titular}</span>
            </div>
          )}
          {amount !== undefined && amount > 0 && (
            <div className="pt-2 border-t border-current/10 flex justify-between font-semibold text-sm">
              <span>Total</span>
              <span className={titleColor}>${amount.toLocaleString('es-AR')}</span>
            </div>
          )}
        </div>
      </div>

      {/* QR Modal */}
      {showQR && cbu && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowQR(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-xs w-full text-center"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-rose-800">Escanear para transferir</h3>
              <button onClick={() => setShowQR(false)} className="p-1 rounded-lg hover:bg-cream-100 text-nude-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex justify-center mb-4">
              <QRCodeSVG value={cbu} size={200} />
            </div>
            {alias && <p className="text-sm text-nude-500 mb-1">Alias: <span className="font-mono font-medium text-rose-800">{alias}</span></p>}
            <p className="text-xs text-nude-400 break-all">{cbu}</p>
            <p className="text-xs text-nude-400 mt-3">Escaneá con tu app bancaria o de MercadoPago</p>
          </div>
        </div>
      )}
    </>
  )
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: ✓ Compiled successfully (AliasQRBox will be unused warning at most, not error)

**Step 3: Commit**

```bash
git add src/components/AliasQRBox.tsx
git commit -m "feat: AliasQRBox component with copy buttons and QR modal"
```

---

### Task 3: Admin site tab — alias config fields

**Files:**
- Modify: `src/app/admin/page.tsx`

**Context:** The "Negocio" tab (`activeTab === 'site'`) has a location section ending around the line with `Ubicación del servicio`. Add a new section after it.

**Step 1: Find the location section end**

Search for this exact block in `src/app/admin/page.tsx`:

```tsx
                <div className="border-t border-cream-200 pt-6 mt-6">
                  <h3 className="font-display text-lg font-semibold text-rose-800 mb-4">
                    📍 Ubicación y Entregas
                  </h3>

                  <div className="space-y-4">
                    <FormField
                      label="Ubicación del servicio (opcional)"
```

**Step 2: Add alias config section after the closing `</div></div>` of that location block**

Insert after the closing `</div>` of the location `<div className="space-y-4">` block (which contains just the location FormField), still inside the location section's outer `<div className="border-t...">`:

Actually, insert a **new** `<div className="border-t ...">` block after the entire location section div closes. The location section div closes with:
```tsx
                  </div>
                </div>
```

After that closing `</div>` (end of location section), insert:

```tsx
                <div className="border-t border-cream-200 pt-6 mt-6">
                  <h3 className="font-display text-lg font-semibold text-rose-800 mb-4">
                    💳 Datos para transferencias
                  </h3>
                  <p className="text-sm text-nude-500 mb-4">
                    Se muestran a los clientes al comprar un pack o reservar una clase con pago por transferencia.
                  </p>
                  <div className="space-y-4">
                    <FormField
                      label="Alias"
                      help="Alias de tu cuenta (ej: corpe.pilates.mp)"
                      value={site.aliasConfig?.alias || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { ...site.aliasConfig, alias: v, cbu: site.aliasConfig?.cbu || '', banco: site.aliasConfig?.banco || '', titular: site.aliasConfig?.titular || '' } }); markChanged() }}
                      placeholder="ej: corpe.pilates.mp"
                    />
                    <FormField
                      label="CBU/CVU"
                      help="Número de CBU o CVU de 22 dígitos"
                      value={site.aliasConfig?.cbu || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { ...site.aliasConfig, cbu: v, alias: site.aliasConfig?.alias || '', banco: site.aliasConfig?.banco || '', titular: site.aliasConfig?.titular || '' } }); markChanged() }}
                      placeholder="0000003100012345678901"
                    />
                    <FormField
                      label="Banco"
                      help="Nombre del banco o billetera (ej: MercadoPago, Brubank)"
                      value={site.aliasConfig?.banco || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { ...site.aliasConfig, banco: v, alias: site.aliasConfig?.alias || '', cbu: site.aliasConfig?.cbu || '', titular: site.aliasConfig?.titular || '' } }); markChanged() }}
                      placeholder="ej: MercadoPago"
                    />
                    <FormField
                      label="Titular"
                      help="Nombre completo del titular de la cuenta"
                      value={site.aliasConfig?.titular || ''}
                      onChange={v => { setSite({ ...site, aliasConfig: { ...site.aliasConfig, titular: v, alias: site.aliasConfig?.alias || '', cbu: site.aliasConfig?.cbu || '', banco: site.aliasConfig?.banco || '' } }); markChanged() }}
                      placeholder="ej: María García"
                    />
                  </div>
                </div>
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: ✓ Compiled successfully

**Step 4: Commit**

```bash
git add src/app/admin/page.tsx
git commit -m "feat: alias/CBU config fields in admin Negocio tab"
```

---

### Task 4: Replace inline alias block in `PacksSection.tsx`

**Files:**
- Modify: `src/components/PacksSection.tsx`

**Context:** The existing inline alias block starts at:
```tsx
{paymentMethod === 'alias' && aliasConfig && (aliasConfig.alias || aliasConfig.cbu) && (
  <div className="bg-violet-50 border border-violet-200 rounded-xl p-4 mb-6">
```
and ends with `</div>\n)}` closing that block.

**Step 1: Add import at top of file**

Add after existing imports:
```tsx
import AliasQRBox from './AliasQRBox'
```

**Step 2: Replace the inline block (lines ~256-304) with**

```tsx
{paymentMethod === 'alias' && aliasConfig && (aliasConfig.alias || aliasConfig.cbu) && (
  <div className="mb-6">
    <AliasQRBox aliasConfig={aliasConfig} accentColor="violet" />
  </div>
)}
```

**Step 3: Verify build**

```bash
npm run build
```

Expected: ✓ Compiled successfully

**Step 4: Commit**

```bash
git add src/components/PacksSection.tsx
git commit -m "feat: use AliasQRBox in PacksSection"
```

---

### Task 5: Replace inline alias block in `reservar/page.tsx`

**Files:**
- Modify: `src/app/reservar/page.tsx`

**Context:** The existing inline alias block is:
```tsx
{paymentMethod === 'alias' && aliasConfig && (
  <div className="bg-rose-50 rounded-xl p-5 mb-6 text-left border border-rose-200">
    <h3 className="font-medium text-rose-800 mb-3">Datos de transferencia</h3>
    <div className="space-y-2 text-sm">
      ...rows for alias, cbu, banco, titular, total...
    </div>
  </div>
)}
```

**Step 1: Add import at top of the file**

Add after existing imports:
```tsx
import AliasQRBox from '@/components/AliasQRBox'
```

**Step 2: Replace the entire inline block with**

```tsx
{paymentMethod === 'alias' && aliasConfig && (
  <div className="mb-6">
    <AliasQRBox aliasConfig={aliasConfig} accentColor="rose" amount={selectedService?.price} />
  </div>
)}
```

Note: `selectedService.price` is available in this scope (the confirmation step where the block renders). Check that `selectedService` is non-null at this point; if there's already a guard around this section, it's fine.

**Step 3: Verify build**

```bash
npm run build
```

Expected: ✓ Compiled successfully

**Step 4: Commit**

```bash
git add src/app/reservar/page.tsx
git commit -m "feat: use AliasQRBox in reservar page"
```

---

### Task 6: Show alias + QR for unpaid classes in `mi-cuenta`

**Files:**
- Modify: `src/app/mi-cuenta/page.tsx`

**Context:**
- The page already fetches `/api/admin/config` in its `Promise.all` (index 2 = `configData`)
- `upcomingClasses` is `ScheduledClass[]`; each has `paymentStatus?: 'pending' | 'verified' | 'paid_online'` and `paymentMethod?: 'alias' | 'efectivo' | 'mercadopago'`
- The "Próximas Clases" list renders at `upcomingClasses.map(cls => ...)` and already shows a "Pago pendiente" badge when `paymentStatus === 'pending'`

**Step 1: Add `aliasConfig` state**

At the top of `MiCuentaContent()`, add:
```tsx
const [aliasConfig, setAliasConfig] = useState<{ alias?: string; cbu?: string; banco?: string; titular?: string } | null>(null)
```

**Step 2: Populate it from configData**

Inside the `.then(([packsData, classesData, configData, purchasesData]) => {` block, after the existing `setBedsCapacity` line, add:
```tsx
if (configData.site?.aliasConfig) setAliasConfig(configData.site.aliasConfig)
```

**Step 3: Add import**

Add at top:
```tsx
import AliasQRBox from '@/components/AliasQRBox'
```

**Step 4: Add AliasQRBox below each unpaid alias class**

In the `upcomingClasses.map(cls => (...))` render block, find the inner card div for each class. Currently it shows a "Pago pendiente" badge. After the existing badge/card content (but still inside the card div for that class), add:

```tsx
{cls.paymentStatus === 'pending' && cls.paymentMethod === 'alias' && aliasConfig && (aliasConfig.alias || aliasConfig.cbu) && (
  <div className="mt-3">
    <AliasQRBox aliasConfig={aliasConfig} accentColor="rose" />
  </div>
)}
```

This should be placed inside the card container for each class, after the date/time/status content.

**Step 5: Verify build**

```bash
npm run build
```

Expected: ✓ Compiled successfully

**Step 6: Commit**

```bash
git add src/app/mi-cuenta/page.tsx
git commit -m "feat: show alias QR for unpaid classes in mi-cuenta"
```

---

## Verification Checklist

1. `npm run build` — clean, no type errors
2. Admin → Negocio tab → "💳 Datos para transferencias" section shows 4 fields → fill them → Save → reload → values persist
3. Home → Packs → Comprar → select "Transferencia" → alias box with copy buttons + "Ver QR" button appears → click "Ver QR" → QR modal opens with QR code
4. Reservar → select service + date + time → select "Transferencia" → alias box + "Ver QR" → QR encodes CBU
5. Mi cuenta → upcoming class with `paymentStatus: 'pending'` + `paymentMethod: 'alias'` → alias box shows below the class card
