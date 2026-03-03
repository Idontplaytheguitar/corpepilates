'use client'

import { useState, useRef, useEffect } from 'react'
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
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => { if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current) }
  }, [])

  const handleCopy = async (value: string | undefined, field: string) => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current)
      copyTimeoutRef.current = setTimeout(() => setCopiedField(null), 2000)
    } catch {}
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
              <button onClick={() => setShowQR(false)} title="Cerrar" className="p-1 rounded-lg hover:bg-cream-100 text-nude-400">
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
