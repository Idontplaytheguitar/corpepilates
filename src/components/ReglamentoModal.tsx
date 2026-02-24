'use client'

import { useState, useEffect, useRef } from 'react'
import { X, ScrollText, CheckCircle } from 'lucide-react'

const DEFAULT_REGLAMENTO = `*Clases y Horarios*
- El estudio ofrece clases semanales de 60 minutos.
- Si por algún motivo no podés asistir, deberás cancelar desde la app con al menos 1 hora de anticipación.

*Cancelaciones y Recuperaciones*
- La posibilidad de recuperar una clase depende de la cancelación hasta una hora antes de que comience y de la disponibilidad de espacio en el estudio.
- El estudio no está obligado a reponer las clases a las que no puedas asistir sin haber cancelado.
- Recuperar una clase es un beneficio, no una obligación.

*Puntualidad*
- Por favor llegá 5 minutos antes de tu clase. Llegar tarde afecta la experiencia del grupo.

*Pagos*
- Los pagos deben realizarse antes o durante la primera clase del mes.
- En caso de no abonar en tiempo y forma, los turnos podrán ser reasignados.

*Conducta*
- Mantener un ambiente respetuoso y tranquilo dentro del estudio.
- Usar ropa cómoda y calcetines antideslizantes.

Al reservar una clase, aceptás respetar este reglamento.`

interface ReglamentoModalProps {
  mode: 'booking' | 'readonly'
  onAccept?: () => void
  onClose: () => void
  customText?: string
}

export default function ReglamentoModal({ mode, onAccept, onClose, customText }: ReglamentoModalProps) {
  const [scrolledToBottom, setScrolledToBottom] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)
  const text = customText || DEFAULT_REGLAMENTO

  const handleScroll = () => {
    const el = contentRef.current
    if (!el) return
    const atBottom = el.scrollHeight - el.scrollTop <= el.clientHeight + 40
    if (atBottom) setScrolledToBottom(true)
  }

  useEffect(() => {
    const el = contentRef.current
    if (el && el.scrollHeight <= el.clientHeight + 40) {
      setScrolledToBottom(true)
    }
  }, [])

  const renderText = (raw: string) =>
    raw.split('\n').map((line, i) => {
      if (line.startsWith('*') && line.endsWith('*')) {
        return <p key={i} className="font-semibold text-rose-800 mt-4 mb-1">{line.slice(1, -1)}</p>
      }
      if (line.startsWith('- ')) {
        return <p key={i} className="text-nude-700 pl-4 mb-1">• {line.slice(2)}</p>
      }
      return line ? <p key={i} className="text-nude-700 mb-1">{line}</p> : <br key={i} />
    })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-cream-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center">
              <ScrollText className="w-5 h-5 text-rose-500" />
            </div>
            <div>
              <h2 className="font-display text-lg font-semibold text-rose-800">Reglamento del Estudio</h2>
              {mode === 'booking' && (
                <p className="text-xs text-nude-500">Leé hasta el final para continuar</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-cream-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-nude-500" />
          </button>
        </div>

        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6 text-sm leading-relaxed"
        >
          {renderText(text)}
          <div className="h-4" />
        </div>

        <div className="p-6 border-t border-cream-200 shrink-0">
          {mode === 'booking' ? (
            <button
              onClick={() => { if (scrolledToBottom && onAccept) onAccept() }}
              disabled={!scrolledToBottom}
              className={`w-full py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                scrolledToBottom
                  ? 'bg-rose-500 hover:bg-rose-600 text-white'
                  : 'bg-cream-200 text-nude-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle className="w-5 h-5" />
              {scrolledToBottom ? 'Acepto el reglamento' : 'Scroll para leer todo'}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-semibold transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
