import db from '../../utils/db';
import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { id } = req.query;

      if (id !== undefined) {
        const statement = db.prepare('SELECT * FROM getränke WHERE id = ?');
        const drinks = statement.get(id);
        if (!drinks) {
          return res.status(200).json(false);
        } else {
          return res.status(200).json(drinks);
        }
      } else {
        const statement = db.prepare('SELECT * FROM getränke');
        const drinks = statement.all();
        return res.status(200).json(drinks);
      }
    }

    if (req.method === 'POST') {
      const { name, preis, bild } = req.body;

      if (!name || !preis || !bild) {
        return res.status(400).json({ error: 'Alle Felder sind erforderlich!' });
      }

      const statement = db.prepare(
        'INSERT INTO getränke (name, preis, bild) VALUES (?, ?, ?)'
      );
      const result = statement.run(name, preis, bild);

      const imagePath = '/uploads/' + result.lastInsertRowid + '.' + bild;

      console.log("imagePath", imagePath);
      
      const updateStatement = db.prepare(
        'UPDATE getränke SET bild = ? WHERE id = ?'
      );
      updateStatement.run(imagePath, result.lastInsertRowid);

      console.log("updateStatement", updateStatement);

      return res.status(201).json({
        id: result.lastInsertRowid,
        name,
        preis,
        imagePath,
      });
    }

    if (req.method === 'PUT') {
      try {
        const { id, name, preis, bild } = req.body;

        console.log("id", id);

        if (!id || !name || !preis || !bild) {
          return res.status(400).json({ message: 'Fehlende Eingabedaten' });
        }

        const statement = db.prepare(
          'UPDATE getränke SET name = ?, preis = ?, bild = ? WHERE id = ?'
        );

        const result = statement.run(name, preis, bild, id);

        if (result.changes === 0) {
          return res.status(404).json({ message: 'Getränk nicht gefunden' });
        }

        return res.status(200).json({ message: 'Getränk erfolgreich aktualisiert' });
      } catch (error) {
        return res.status(500).json({ message: 'Interner Serverfehler', error: error.message });
      }
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
    
      const selectStatement = db.prepare('SELECT bild FROM getränke WHERE id = ?');
      const getraenk = selectStatement.get(id);
      if (!getraenk) {
        return res.status(404).json({ error: 'Getränk nicht gefunden' });
      }
    
      const imagePath = path.join(process.cwd(), 'public', getraenk.bild);
    
      try {
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
          console.log(`Bilddatei ${imagePath} wurde gelöscht.`);
        } else {
          console.warn(`Bilddatei ${imagePath} wurde nicht gefunden.`);
        }
      } catch (err) {
        console.error('Fehler beim Löschen der Bilddatei:', err);
      }
    
      const statement = db.prepare('DELETE FROM getränke WHERE id = ?');
      statement.run(id);
    
      return res.status(200).json({ message: 'Getränk und zugehöriges Bild erfolgreich gelöscht' });
    }

    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
