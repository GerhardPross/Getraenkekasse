import db from '../../utils/db';

export default async function handler(req, res) {
  try {
    const { email } = req.body;

    const historyStatement = db.prepare(`
      SELECT * FROM history
      WHERE email = ?
        AND bezahlt IS NULL
        AND datum < datetime('now', 'start of month')
    `);
    
    const unbezahlteBestellungen = historyStatement.all(email);
    

    if (unbezahlteBestellungen.length === 0) {
      res.status(200).json({ error: 'Keine unbezahlten Bestellungen gefunden' });
      return;
    }

    const gesamtBetrag = unbezahlteBestellungen.reduce((sum, bestellung) => sum + (bestellung.preis || 0), 0);

    const name = [];
    for (const bestellung of unbezahlteBestellungen) {
      if (bestellung.preis > 0) {
        const datum = new Date(bestellung.datum);
        const monat = String(datum.getMonth() + 1).padStart(2, '0');
        const jahr = datum.getFullYear();
        const monatsJahr = `${monat}.${jahr}`;
        
        if (!name.includes(monatsJahr)) {
          name.push(monatsJahr);
        }
      }
    }
    const zeitraum = name.sort().join(',');

    const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
    if (!clientId || !clientSecret) {
      res.status(500).json({ error: 'Fehlende PayPal-Umgebungsvariablen' });
      return;
    }
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const authResponse = await fetch(`https://${process.env.PAYPAL_API_URL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`Fehler beim Abrufen des Access Tokens: ${errorText}`);
    }
    const authData = await authResponse.json();

    const accessToken = authData.access_token;

    const orderDetails = {
      intent: 'CAPTURE',
      purchase_units: [{
        description: zeitraum,
        amount: {
          currency_code: 'EUR',
          value: gesamtBetrag.toFixed(2)
        }
      }],
      application_context: {
        return_url: `http://${process.env.NEXT_PUBLIC_SITE_URL}/danke?email=${email}`,
        cancel_url: `http://${process.env.NEXT_PUBLIC_SITE_URL}/?error=cancelled`
      }
    };

    const orderResponse = await fetch(`https://${process.env.PAYPAL_API_URL}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify(orderDetails)
    });
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      throw new Error(`Fehler beim Erstellen der Bestellung: ${errorText}`);
    }
    const orderData = await orderResponse.json();

    const approvalUrl = orderData.links?.find(link => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      res.status(500).json({ error: 'Approval URL nicht gefunden' });
      return;
    }

    res.status(200).json({ approvalUrl });
  } catch (error) {
    console.error('Serverfehler:', error);
    res.status(500).json({ error: error.message });
  }
}