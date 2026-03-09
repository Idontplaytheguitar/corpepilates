'use client'

import { useState, useRef, useCallback } from 'react'
import { Loader2, Image as ImageIcon, X, Upload } from 'lucide-react'

interface ImageUploaderProps {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export default function ImageUploader({ value, onChange, label, className = '' }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.url) {
        onChange(data.url)
      } else {
        alert(data.error || 'Error al subir imagen')
      }
    } catch {
      alert('Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadFile(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      uploadFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  return (
    <div className={className}>
      {label && <label className="block text-xs text-nude-500 mb-1">{label}</label>}
      <div
        className={`relative w-full h-32 rounded-xl border-2 border-dashed flex items-center justify-center overflow-hidden cursor-pointer transition-colors ${
          dragOver
            ? 'border-rose-400 bg-rose-50'
            : value
            ? 'border-cream-200 hover:border-rose-300'
            : 'border-cream-300 hover:border-rose-300 bg-cream-50'
        }`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {uploading ? (
          <Loader2 className="w-6 h-6 text-rose-400 animate-spin" />
        ) : value ? (
          <>
            <img src={value} alt="" className="w-full h-full object-cover" />
            <button
              onClick={(e) => { e.stopPropagation(); onChange('') }}
              className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </>
        ) : (
          <div className="text-center p-2">
            <Upload className="w-6 h-6 text-nude-300 mx-auto mb-1" />
            <span className="text-xs text-nude-400 block">Arrastrá o hacé clic</span>
          </div>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  )
}
