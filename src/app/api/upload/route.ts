import { NextRequest, NextResponse } from 'next/server'

function getCloudinaryConfig() {
  const cloudinaryUrl = process.env.CLOUDINARY_URL
  if (cloudinaryUrl) {
    const match = cloudinaryUrl.match(/@([^/]+)$/)
    if (match) {
      return { cloudName: match[1] }
    }
  }
  
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  if (cloudName) {
    return { cloudName }
  }
  
  return null
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const config = getCloudinaryConfig()
    if (!config) {
      return NextResponse.json({ 
        error: 'Cloudinary no está configurado. Contacta al administrador.' 
      }, { status: 500 })
    }

    const uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET || 'corpepilates'

    const cloudinaryForm = new FormData()
    cloudinaryForm.append('file', file)
    cloudinaryForm.append('upload_preset', uploadPreset)

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${config.cloudName}/image/upload`,
      { method: 'POST', body: cloudinaryForm }
    )

    const data = await response.json()

    if (data.secure_url) {
      return NextResponse.json({ url: data.secure_url })
    } else {
      console.error('Cloudinary error:', data)
      return NextResponse.json({ 
        error: data.error?.message || 'Error al subir imagen. Verificá el upload preset.' 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 })
  }
}
