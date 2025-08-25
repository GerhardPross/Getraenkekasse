import db from '../../utils/db';

export default function handler(req, res) {
  if (req.method === 'GET') {
    const statement = db.prepare('SELECT * FROM history');
    const users = statement.all();
    return res.status(200).json(users);
  }

  if (req.method === 'PUT') {
    const { email, bezahlt } = req.body;
    const statement = db.prepare(`UPDATE history 
      SET bezahlt = ? 
      WHERE email = ? 
      AND datum < datetime('now', 'start of month')`);

    statement.run(bezahlt, email);
    return res.status(200).json({ message: 'History erfolgreich aktualisiert' });
  }
  
  if (req.method === 'POST') {
    try {
      const { email, getraenk } = req.body;
      
      if (!email || !getraenk) {
        return res.status(400).json({ 
          error: 'Email und Getränk sind erforderlich'
        });
      }

      const getraenkeData = db.prepare('SELECT * FROM getränke WHERE id = ?');
      const getraenke = getraenkeData.get(getraenk);
      if (!getraenke) {
        throw new Error('Getränk nicht gefunden');
      }

      console.log(getraenke);

      const datum = new Date();
      const statement = db.prepare('INSERT INTO history (email, getraenk, preis, datum) VALUES (?, ?, ?, ?)');
      
      statement.run(email, getraenke.name, getraenke.preis, datum.toISOString());
      
      return res.status(200).json({ 
        message: 'History erfolgreich erstellt',
        data: {
          email,
          getraenk: getraenke.name,
          datum: datum.toISOString(),
          preis: getraenke.preis
        }
      });

    } catch (error) {
      console.error('Fehler beim Erstellen des History Eintrags:', error);
      return res.status(500).json({
        error: 'Interner Serverfehler beim Erstellen des History Eintrags'
      });
    }
  }

  res.setHeader('Allow', ['GET', 'POST']);
  return res.status(405).json({
    error: `Methode ${req.method} nicht erlaubt`
  });
}
