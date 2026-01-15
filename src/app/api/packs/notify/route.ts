import { NextRequest, NextResponse } from 'next/server'
import { getValidSellerToken } from '@/lib/marketplace'
import { saveUserPack, getUserById, getStoredConfig } from '@/lib/storage'
import { sendEmail } from '@/lib/email'
import { formatPrice, UserPack } from '@/data/config'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    if (body.type !== 'payment' || body.action !== 'payment.created') {
      return NextResponse.json({ received: true })
    }
    
    const paymentId = body.data?.id
    if (!paymentId) {
      return NextResponse.json({ received: true })
    }
    
    const sellerToken = await getValidSellerToken()
    if (!sellerToken) {
      console.error('No seller token for pack notification')
      return NextResponse.json({ error: 'No seller token' }, { status: 500 })
    }
    
    const paymentResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${sellerToken}` },
    })
    
    if (!paymentResponse.ok) {
      console.error('Failed to fetch payment:', await paymentResponse.text())
      return NextResponse.json({ error: 'Failed to fetch payment' }, { status: 500 })
    }
    
    const payment = await paymentResponse.json()
    
    if (payment.status !== 'approved') {
      return NextResponse.json({ received: true, status: payment.status })
    }
    
    let externalRef
    try {
      externalRef = JSON.parse(payment.external_reference || '{}')
    } catch {
      return NextResponse.json({ received: true, error: 'Invalid external reference' })
    }
    
    if (externalRef.type !== 'pack_purchase') {
      return NextResponse.json({ received: true, type: 'not_pack' })
    }
    
    const { purchaseId, packId, packName, classCount, validityDays, userId, userEmail, userName } = externalRef
    
    const now = Date.now()
    const expiresAt = now + (validityDays * 24 * 60 * 60 * 1000)
    
    const userPack: UserPack = {
      id: purchaseId,
      packId,
      packName,
      userId,
      classesRemaining: classCount,
      classesUsed: 0,
      expiresAt,
      purchasedAt: now,
      paymentId: paymentId.toString(),
      status: 'active',
    }
    
    await saveUserPack(userPack)
    
    const config = await getStoredConfig()
    const siteName = config.site?.siteName || 'Corpe Pilates'
    
    const expirationDate = new Date(expiresAt).toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    })
    
    const customerEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #be185d;">🎉 ¡Tu pack está activo!</h2>
        <p>¡Hola ${userName}!</p>
        <p>Tu compra fue procesada exitosamente. Ya podés empezar a agendar tus clases.</p>
        <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #be185d;">${packName}</h3>
          <p><strong>📚 Clases disponibles:</strong> ${classCount}</p>
          <p><strong>📅 Válido hasta:</strong> ${expirationDate}</p>
          <p style="font-size: 18px; font-weight: bold; margin-top: 15px;">Total pagado: ${formatPrice(payment.transaction_amount)}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_URL}/mi-cuenta" style="background: #be185d; color: white; padding: 15px 30px; border-radius: 10px; text-decoration: none; font-weight: bold;">
            Agendar mis clases
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Si tenés alguna consulta, escribinos por WhatsApp al ${config.site.whatsapp || 'nuestro número de contacto'}.
        </p>
        <p style="margin-top: 30px;">¡Gracias por tu confianza! 💕</p>
        <p><strong>${siteName}</strong></p>
      </div>
    `
    
    const adminEmailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #be185d;">🎉 Nueva compra de Pack</h2>
        <div style="background: #fdf2f8; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${packName}</h3>
          <p><strong>Clases:</strong> ${classCount}</p>
          <p><strong>Validez:</strong> ${validityDays} días</p>
          <p style="font-size: 18px; font-weight: bold;">Total: ${formatPrice(payment.transaction_amount)}</p>
        </div>
        <div style="background: #f1f5f9; padding: 20px; border-radius: 12px;">
          <h4 style="margin-top: 0;">Cliente:</h4>
          <p><strong>👤 Nombre:</strong> ${userName}</p>
          <p><strong>📧 Email:</strong> ${userEmail}</p>
        </div>
      </div>
    `
    
    await sendEmail(userEmail, `¡Tu pack está activo! - ${siteName}`, customerEmailHtml)
    
    if (config.site.email) {
      await sendEmail(config.site.email, `Nueva compra de pack - ${packName}`, adminEmailHtml)
    }
    
    return NextResponse.json({ success: true, packId: purchaseId })
  } catch (error) {
    console.error('Error processing pack notification:', error)
    return NextResponse.json({ error: 'Error processing notification' }, { status: 500 })
  }
}
