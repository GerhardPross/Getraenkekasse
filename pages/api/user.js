import db from '../../utils/db';

export default function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const { email } = req.query;
      const statement = db.prepare('SELECT * FROM user WHERE email = ?');
      const user = statement.get(email);
      res.status(200).json(user);
    }

    if (req.method === 'POST') {
      const { email, firmenname, name, strasse, ort, sofortkauf } = req.body;

      if (!email) {
        return res.status(400).json({ error: 'email ist erforderlich' });
      }

      const sofortkaufValue = sofortkauf ? 1 : 0;


      const checkEmail = db.prepare('SELECT * FROM user WHERE email = ?');
      const existingUser = checkEmail.get(email);

      if (existingUser) {
        const getStatement = db.prepare('SELECT sofortkauf FROM user WHERE email = ?');
        try {
          const result = getStatement.get(email);
          console.log("Update result:", result);
        } catch (error) {
          console.error("Error updating user:", error);
          throw error;
        }

        const sofortkauf = sofortkaufValue ? true : false;
        
        res.status(200).json({
          email,
          firmenname,
          name,
          strasse,
          ort,
          sofortkauf: sofortkauf
        });


      } else {
        const statement = db.prepare(
          'INSERT INTO user ( email, firmenname, name, strasse, ort, sofortkauf ) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const result = statement.run(email, firmenname, name, strasse, ort, sofortkaufValue);

        res.status(201).json({
          email,
          firmenname,
          name,
          strasse,
          ort,
          sofortkauf: sofortkaufValue
        });
      }
    }

    if (req.method === 'PUT') {
      const { email, firmenname, name, strasse, ort, sofortkauf } = req.body;
      
      // Nur die Felder aktualisieren, die im Request vorhanden sind
      let updateFields = [];
      let updateValues = [];
      let updateQuery = 'UPDATE user SET ';

      if (firmenname !== undefined) {
        updateFields.push('firmenname = ?');
        updateValues.push(firmenname);
      }
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      if (strasse !== undefined) {
        updateFields.push('strasse = ?');
        updateValues.push(strasse);
      }
      if (ort !== undefined) {
        updateFields.push('ort = ?');
        updateValues.push(ort);
      }
      if (sofortkauf !== undefined) {
        updateFields.push('sofortkauf = ?');
        updateValues.push(sofortkauf ? 1 : 0);
      }

      if (updateFields.length > 0) {
        updateQuery += updateFields.join(', ') + ' WHERE email = ?';
        updateValues.push(email);
        
        const statement = db.prepare(updateQuery);
        const result = statement.run(...updateValues);
        
        // Nur die aktualisierten Felder zurückgeben
        const response = { email };
        if (firmenname !== undefined) response.firmenname = firmenname;
        if (name !== undefined) response.name = name;
        if (strasse !== undefined) response.strasse = strasse;
        if (ort !== undefined) response.ort = ort;
        if (sofortkauf !== undefined) response.sofortkauf = sofortkauf;
        
        res.status(200).json(response);
      } else {
        res.status(400).json({ error: 'Keine Felder zum Aktualisieren angegeben' });
      }
    }
    if (req.method === 'DELETE') {

    }
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Server-Fehler:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
}
