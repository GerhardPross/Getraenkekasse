import sendEmail from '../../utils/mailSender';
import db from '../../utils/db';
import dotenv from 'dotenv';

dotenv.config();

export default async function handler(req, res) {
  console.log('Starte Rechnungserstellung...');
  
  if (req.method !== 'GET') {
    console.log('Falsche HTTP-Methode:', req.method);
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  // Hole alle einzigartigen Email-Adressen von unbezahlten Bestellungen
  const emailStatement = db.prepare('SELECT DISTINCT email FROM history WHERE bezahlt IS NULL');
  const emails = emailStatement.all();
  console.log('Gefundene Email-Adressen:', emails);
  
  const emailMap = new Map();
  emails.forEach(entry => {
    emailMap.set(entry.email, true);
  });
  console.log('Anzahl einzigartiger Emails:', emailMap.size);
  
  // Für jede Email eine Rechnung erstellen
  for (const [email] of emailMap) {
    console.log('Erstelle Rechnung für:', email);
    try {
      const startOfLastMonth = new Date();
      startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1);
      startOfLastMonth.setDate(1);
      startOfLastMonth.setHours(0, 0, 0, 0);
  
      const endOfLastMonth = new Date();
      endOfLastMonth.setDate(0);
      endOfLastMonth.setHours(23, 59, 59, 999);
      
      console.log('Zeitraum:', startOfLastMonth, 'bis', endOfLastMonth);
  
      // Hole alle unbezahlten Bestellungen für diese Email im letzten Monat
        const historyStatement = db.prepare(
          'SELECT * FROM history WHERE email = ? AND datum BETWEEN ? AND ? AND (bezahlt IS NULL OR bezahlt = \'\')'
        );
      
  
      const historyEintraege = historyStatement.all(
        email,
        startOfLastMonth.toISOString().slice(0, 10),
        endOfLastMonth.toISOString().slice(0, 10)
      );
      console.log('Gefundene Bestellungen:', historyEintraege.length);
  
      if (!historyEintraege || historyEintraege.length === 0) {
        console.log('Keine Bestellungen für:', email);
        continue;
      }

      const gesamtBrutto = historyEintraege.reduce((sum, item) => sum + (item.preis || 0), 0);
      const gesamtNetto = gesamtBrutto / 1.19;
      const gesamtMwst = gesamtBrutto - gesamtNetto;
      console.log('Beträge für', email, '- Brutto:', gesamtBrutto, 'Netto:', gesamtNetto, 'MwSt:', gesamtMwst);

      const subject = 'Ihre Monatsrechnung von Getränkekasse';
      const message = `
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; text-align: center; }
              .container { padding: 20px; margin: 0 auto; text-align: center; }
              .header { color: #333; text-align: center; }
              .content { margin: 20px 0; text-align: center; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { padding: 8px; text-align: center; border-bottom: 1px solid #ddd; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header"><b>Monatsrechnung Getränkekasse</b></div>
              <div class="content">
                <p>Datum: ${new Date().toLocaleDateString('de-DE')}</p>
                <br>
                <p>Softwarezentrum Böblingen / Sindelfingen e.V.</p>
                <p>Otto-Lilienthal-Straße 36</p>
                <p>71032 Böblingen</p>
                <p>Steuernummer: 56002/04861</p>
                <br><br>
                <p>Bestellübersicht für ${startOfLastMonth.toLocaleDateString('de-DE', { month: 'long', year: 'numeric' })}:</p>
                <br>
                <div style="width: 70%; margin: 0 auto;">
                <table>
                  <tr>
                    <th>Datum</th>
                    <th>Getränk</th>
                    <th>Preis</th>
                  </tr>
                  ${historyEintraege.map(item => `
                    <tr>
                      <td>${new Date(item.datum).toLocaleDateString('de-DE')}</td>
                      <td>${item.getraenk || 'Unbekannt'}</td>
                      <td>${(item.preis / 1.19 || 0).toFixed(2)} €</td>
                    </tr>
                  `).join('')}
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">Zwischensumme:</td>
                    <td>${gesamtNetto.toFixed(2)} €</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">Mehrwertsteuer (19%):</td>
                    <td>${gesamtMwst.toFixed(2)} €</td>
                  </tr>
                  <tr>
                    <td colspan="2" style="text-align: right; font-weight: bold;">Gesamtsumme:</td>
                    <td style="font-weight: bold;">${gesamtBrutto.toFixed(2)} €</td>
                  </tr>
                </table>
                </div>
                <div>
                    <p>Bitte hier bezahlen: <a href="http://${process.env.NEXT_PUBLIC_SITE_URL}/?customer=${email}">Rechnung begleichen</a></p>
                    <p>Danke für Ihren Einkauf bei Getränkekasse</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;

      console.log('Sende Email an:', email);
      await sendEmail(email, subject, message);
      console.log('Email erfolgreich gesendet an:', email);
    } catch (error) {
      console.error('Fehler bei Email:', email, error);
    }
  }
  console.log('Rechnungserstellung abgeschlossen');
  res.status(200).json({ message: 'Emails wurden versendet.' });
}
