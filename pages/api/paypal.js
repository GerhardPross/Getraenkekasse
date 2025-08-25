import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
    try {
      console.log('Prüfe HTTP Methode...');
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Methode nicht erlaubt' });
        return;
      }
  
      console.log('Extrahiere und validiere Getränkedaten...');
      // Getränk aus Request Body extrahieren
      
      const { getraenk, email } = req.body;
      if (!getraenk || !getraenk.preis || !getraenk.name) {
        res.status(400).json({ error: 'Ungültige Getränkedaten' });
        return;
      }  

      console.log('Konvertiere und validiere Preis...');
      // Stelle sicher, dass der Preis eine Zahl ist
      const preis = typeof getraenk.preis === 'number' 
        ? getraenk.preis 
        : parseFloat(getraenk.preis.replace(',', '.')); // Ersetze Komma falls vorhanden
  
      if (isNaN(preis)) {
        res.status(400).json({ error: 'Ungültiger Preis' });
        return;
      }
  
      console.log('Prüfe PayPal Umgebungsvariablen...');
      // Umgebungsvariablen säubern
      const clientId = process.env.PAYPAL_CLIENT_ID?.trim();
      const clientSecret = process.env.PAYPAL_CLIENT_SECRET?.trim();
      console.log('clientId', clientId);
      console.log('clientSecret', clientSecret);
      if (!clientId || !clientSecret) {
        res.status(500).json({ error: 'Fehlende PayPal-Umgebungsvariablen' });
        return;
      }
      const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
      console.log('Hole PayPal Access Token...');
      // Access Token abrufen
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
        console.error('Fehler beim Abrufen des Access Tokens:', errorText);
        throw new Error(`Fehler beim Abrufen des Access Tokens: ${errorText}`);
      }
      const authData = await authResponse.json();
      const accessToken = authData.access_token;
  
      console.log('Erstelle Bestellungsdetails...');
      // Bestellungsdetails mit Getränkedaten definieren
      const orderDetails = {
        intent: 'CAPTURE',
        purchase_units: [{
          description: getraenk.name,
          amount: {
            currency_code: 'EUR',
            value: preis.toFixed(2)
          }
        }],
        application_context: {
          return_url: `http://${process.env.NEXT_PUBLIC_SITE_URL}/danke?email=${email}&getraenk=${getraenk.id}`,
          cancel_url: `http://${process.env.NEXT_PUBLIC_SITE_URL}/?error=cancelled`
        }
      };

      console.log('Bestellungsdetails:', orderDetails);
  
      console.log('Sende Bestellung an PayPal...');
      // Bestellung erstellen
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
        console.error('Fehler beim Erstellen der Bestellung:', errorText);
        throw new Error(`Fehler beim Erstellen der Bestellung: ${errorText}`);
      }
      const orderData = await orderResponse.json();

      // Approval URL extrahieren
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
  