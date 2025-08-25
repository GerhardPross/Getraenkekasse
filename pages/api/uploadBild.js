// Importiere benötigte Module
import fs from "fs";
import path from "path";

// Konfiguration für die API-Route
export const config = {
  api: {
    bodyParser: false, // Deaktiviere den Standard-Body-Parser für Datei-Uploads
  },
};

export default async function handler(req, res) {
  // Prüfe ob die Anfrage-Methode POST ist
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Nur POST-Anfragen sind erlaubt." });
  }

  // Importiere benötigte Module für Datei-Upload
  const { createWriteStream  } = require("fs");
  const formidable = require("formidable");

  // Definiere Upload-Verzeichnis im public Ordner
  const uploadDir = path.join(process.cwd(), "public/uploads");

  // Erstelle Upload-Verzeichnis falls es nicht existiert
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Konfiguriere formidable für Datei-Upload
  const form = new formidable.IncomingForm();
  form.uploadDir = uploadDir;
  form.keepExtensions = true;

  // Parse die eingehende Anfrage
  form.parse(req, (err, fields, files) => {
    // Fehlerbehandlung beim Upload
    if (err) {
      console.error("Fehler beim Hochladen:", err);
      return res.status(500).json({ error: "Fehler beim Hochladen." });
    }
  
    // Logge Felder und Dateien für Debugging
    console.log("Felder:", fields);
    console.log("Dateien:", files);
  
    // Prüfe ob eine Datei hochgeladen wurde
    if (!files.file || files.file.length === 0) {
      return res.status(400).json({ error: "Keine Datei gefunden." });
    }
  
    // Hole die hochgeladene Datei
    const uploadedFile = files.file[0];
  
    // Prüfe ob imageName im FormData vorhanden ist
    if (!fields.imageName) {
      return res.status(400).json({ error: "Kein Dateiname übermittelt." });
    }
   const imageName = fields.imageName[0];
  
    // Verwende den übergebenen Dateinamen
    const newFilename = imageName;
    const filePath = path.join(uploadDir, newFilename);

    // Benenne die Datei mit .jpg Endung um
    fs.renameSync(path.join(uploadDir, uploadedFile.newFilename), filePath);
  
    // Erstelle relativen Pfad für die Datenbank
    const relativePath = '/uploads/' + newFilename;
  
    // Sende erfolgreiche Antwort mit Dateipfad
    res.status(200).json({ message: "Upload erfolgreich", filePath: relativePath });
  });
  
}
