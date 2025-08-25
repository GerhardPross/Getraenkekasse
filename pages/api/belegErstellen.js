import sendEmail from '../../utils/mailSender';
import db from '../../utils/db';

export default async function handler(req, res) {
  try {
    const { email, getraenk } = req.body;

    if (!email || !getraenk) {
      res.status(400).json({ error: 'Email und Getränk sind erforderlich' });
      return;
    }

    const getraenkeData = await db.prepare('SELECT * FROM getränke WHERE id = ?').get(getraenk);

    if (!getraenkeData) {
      res.status(404).json({ error: 'Getränk nicht gefunden' });
      return;
    }

    const subject = 'Ihre Bestellung bei der Getränkekasse';
    const message = `
      <html>
        <head>
          <style>
            body { 
              font-family: Arial, sans-serif;
              text-align: center;
            }
            .container { 
              padding: 20px;
              margin: 0 auto;
              text-align: center;
            }
            .header { 
              color: #333;
              text-align: center;
            }
            .content { 
              margin: 20px 0;
              text-align: center;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            th, td {
              padding: 8px;
              text-align: center;
              border-bottom: 1px solid #ddd;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header"><b>Ihr Einkauf bei der Getränkekasse</b></div>
            <div class="content">
              <p>Datum: ${new Date().toLocaleDateString('de-DE')}</p>
              <br>
              <p>Softwarezentrum Böblingen / Sindelfingen e.V.</p>
              <p>Otto-Lilienthal-Straße 36</p>
              <p>71032 Böblingen</p>
              <p>Steuernummer: 56002/04861</p>
              <br><br>
              <p>Bestelldetails:</p>
              <br>
              <div style="width: 70%; margin: 0 auto;">
              <table>
                <tr>
                  <th>Getränk</th>
                  <th>Preis</th>
                </tr>
                <tr>
                  <td>${getraenkeData.name}</td>
                  <td>${(getraenkeData.preis / 1.19).toFixed(2)} €</td>
                </tr>
                <tr>
                  <td colspan="1" style="text-align: right; font-weight: bold;">Zwischensumme:</td>
                  <td>${(getraenkeData.preis / 1.19).toFixed(2)} €</td>
                </tr>
                <tr>
                  <td colspan="1" style="text-align: right; font-weight: bold;">Mehrwertsteuer (19%):</td>
                  <td>${(getraenkeData.preis - getraenkeData.preis / 1.19).toFixed(2)} €</td>
                </tr>
                <tr>
                  <td colspan="1" style="text-align: right; font-weight: bold;">Gesamtsumme:</td>
                  <td style="font-weight: bold;">${getraenkeData.preis.toFixed(2)} €</td>
                </tr>
              </table>
              </div>
              <div>
                <p>Danke für Ihren Einkauf bei der Getränkekasse</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(email, subject, message);
    res.status(200).json({ message: 'Email wurde versendet' });
  } catch (error) {
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
}