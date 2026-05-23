import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

/**
 * Supabase Edge Function: order-notification
 * 
 * Triggered by: Database Webhook on "orders" table (INSERT)
 * Purpose: Send an automated WhatsApp notification to customers upon new order.
 */

// These should be set using: 
// supabase secrets set WHATSAPP_API_KEY=your_key WHATSAPP_API_ENDPOINT=your_url
const WHATSAPP_API_KEY = Deno.env.get('WHATSAPP_API_KEY')
const WHATSAPP_API_ENDPOINT = Deno.env.get('WHATSAPP_API_ENDPOINT')

serve(async (req) => {
  try {
    // Supabase Webhook payload
    const payload = await req.json()
    const { record, type } = payload

    console.log(`Received ${type} event on orders table`)

    // Only process new order insertions
    if (type !== 'INSERT' || !record) {
      return new Response(JSON.stringify({ message: "No action needed for this event type." }), {
        headers: { "Content-Type": "application/json" },
        status: 200,
      })
    }

    const { customer_phone, order_id, items } = record

    if (!customer_phone) {
      console.error("Missing customer phone for order:", order_id)
      return new Response(JSON.stringify({ error: "Missing customer phone" }), { status: 400 })
    }

    // Extract and format product names from items (JSONB)
    let product_names = 'your items'
    let itemsArray = []
    
    if (Array.isArray(items)) {
      itemsArray = items
    } else if (typeof items === 'string') {
      try {
        itemsArray = JSON.parse(items)
      } catch (e) {
        console.error("Failed to parse items string:", items)
      }
    }

    if (itemsArray.length > 0) {
      product_names = itemsArray.map((item: any) => `${item.name}${item.quantity > 1 ? ` (x${item.quantity})` : ''}`).join(', ')
    }

    // Message Template
    const message = `Hi! Thanks for your order from Kottravai. We have received your order #${order_id} for ${product_names}. We will notify you once it is shipped!`

    console.log(`Sending WhatsApp message to: ${customer_phone}`)

    // Clean phone number: remove non-digits and ensure 91 prefix for India
    let cleanPhone = customer_phone.replace(/\D/g, '')
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone
    }

    // Standard WhatsApp API Request
    if (!WHATSAPP_API_ENDPOINT) {
        throw new Error("WHATSAPP_API_ENDPOINT is not configured in Supabase Secrets")
    }

    const whatsappResponse = await fetch(WHATSAPP_API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${WHATSAPP_API_KEY}`,
      },
      body: JSON.stringify({
        to: cleanPhone,
        message: message,
        // Depending on provider, might need:
        // "type": "text", "body": message
      }),
    })

    const result = await whatsappResponse.json()
    console.log("Provider Response:", result)

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    })

  } catch (error) {
    console.error("Critical Error in Edge Function:", error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    })
  }
})
