# GetränkeKasse – QR-basiertes Bestell- und Abrechnungssystem

Dieses Projekt ist ein digitales Kassensystem für Getränke auf Basis von **Next.js**, **React** und **SQLite**.  
Es kombiniert **automatische QR-Code-Erstellung**, **Magiclink-Anmeldung**, **Rechnungs- und Belegerstellung** sowie eine **PayPal-Anbindung**.

---

## 🚀 Funktionsübersicht

### 📌 QR-Code-Generierung
- Jedes Getränk wird mit einem eindeutigen QR-Code versehen.  
- Der QR-Code führt direkt zum Bestell- und Anmeldeprozess.

### 🔑 Magiclink-Anmeldung
- Anmeldung über die E-Mail-Adresse.  
- Ein Einmal-Link (Magiclink) wird per Mail gesendet und muss zur Verifizierung angeklickt werden.

### 💳 Zahlungsoptionen
- **Sofortkauf**  
  → Weiterleitung zu PayPal, automatische Belegerstellung und Versand an die angegebene E-Mail.  
- **Rechnungskauf**  
  → Erfassung von Rechnungsdaten (E-Mail, Ansprechpartner, Adresse).  
  → Beleg wird erstellt, Zahlung erfolgt gesammelt am Monatsanfang.

### 📂 Rechnungsverwaltung
- Autorisierung via LocalStorage für 30 Tage.  
- In diesem Zeitraum genügt das Scannen des QR-Codes zur direkten Weiterleitung auf die „Danke“-Seite.  
- Am Monatsanfang wird automatisch eine Rechnung an die hinterlegte E-Mail-Adresse versendet.  
- Mehrere offene Rechnungen werden zu einer Sammelrechnung zusammengefasst (inkl. PayPal-Bezahllink).

### 🧾 Automatisierte Beleg- und Rechnungserstellung
- **Sofortkauf** → Digitaler Beleg per E-Mail.  
- **Rechnung** → Sammelrechnung zum Monatsanfang.

### 🛠️ Admin-Funktionalitäten
Eine festgelegte Admin-E-Mail erhält Zugriff auf:  
- Preis- und Bildverwaltung  
- QR-Code-Neugenerierung für geänderte Produkte  
- Sofortige Aktivierung neuer Preise für alle Kunden  

---

## 📖 Typischer Ablauf

1. Kunde scannt den QR-Code eines Getränks.  
2. Anmeldung per Magiclink über E-Mail.  
3. Auswahl zwischen:  
   - **Sofortkauf** → Weiterleitung zu PayPal, Zahlung, Beleg per E-Mail, Danke-Seite.  
   - **Rechnung** → Eingabe von Rechnungsdaten, direkte Danke-Seite, Rechnung am Monatsanfang per E-Mail.  
4. Automatisierter Prozess sorgt für wiederholte Käufe ohne erneute Anmeldung (30 Tage gültig).  

---

## 🧑‍💻 Technologien

- **Frontend**: Next.js, React  
- **Datenbank**: SQLite  
- **Authentifizierung**: Magiclink-basierte Anmeldung  
- **Zahlungsabwicklung**: PayPal Integration  
- **Dokumente**: Automatische Beleg- und Rechnungserstellung (PDF/HTML)  
- **E-Mail-Versand**: Automatische Zustellung von Belegen und Rechnungen  