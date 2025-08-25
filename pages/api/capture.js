import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  const { orderID, email } = req.body;
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  // Access Token vom PayPal-Server holen
  const authResponse = await fetch(`https://${process.env.PAYPAL_API_URL}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!authResponse.ok) {
    return res.status(500).json({ error: 'Fehler beim Abrufen des Access Tokens' });
  }
  
  const authData = await authResponse.json();
  const accessToken = authData.access_token;

  // Zahlung erfassen
  const captureResponse = await fetch(`https://${process.env.PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!captureResponse.ok) {
    const errorText = await captureResponse.text();
    return res.status(500).json({ error: errorText });
  }

  const captureData = await captureResponse.json();
  res.status(200).json({ email, captureData });

}
