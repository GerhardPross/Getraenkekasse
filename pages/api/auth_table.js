import db from '../../utils/db';
import sendEmail from '../../utils/mailSender';
import { v4 as uuidv4 } from 'uuid';


export default function handler(req, res) {

    if (req.method === 'POST') {
        try {
            const { email, getraenk, changes, sofortkauf, admin } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email are required' });
            }

            const token = uuidv4().toString();
            const expiredate = new Date(Date.now() + 600000).toISOString();

            const sofortkaufValue = sofortkauf ? 1 : 0;
            const adminValue = admin ? 1 : 0;

            console.log("email:", email, "token:", token, "expiredate:", expiredate, "changes:", changes);

            // Prüfe ob Email bereits existiert
            const checkEmail = db.prepare('SELECT * FROM auth_tokens WHERE email = ?');
            const existingUser = checkEmail.get(email);

            // Wenn Benutzer existiert, lösche den alten Eintrag
            if (existingUser) {
                const deleteStatement = db.prepare('DELETE FROM auth_tokens WHERE email = ?');
                deleteStatement.run(email);
            }


            const subject = 'Authentifizierung';
            const authLink = `https://${process.env.NEXT_PUBLIC_SITE_URL}/login?getraenk=${getraenk}&token=${token}`;
            const message = `
            <html>
                <body>
                    <p>Willkommen bei AI xpress.</p>
                    <p>Klicken Sie auf den folgenden Link, um Ihre Anmeldung abzuschließen.</p>
                    <p>Der Link ist 10 Minuten gültig.</p>
                    <p>Falls Sie die Anmeldung nicht angefordert haben, ignorieren Sie diese Nachricht.</p>
                    <p><a href="${authLink}">Authentifizieren</a></p>
                    <p>Vielen Dank für Ihre Anmeldung bei AI xpress.</p>
                </body>
            </html>`;

            console.log('getraenk in auth_table', getraenk);

            sendEmail(email, subject, message);


            const statement = db.prepare('INSERT INTO auth_tokens (email, token, expiredate, changes, sofortkauf, admin) VALUES (?, ?, ?, ?, ?, ?)');
            statement.run(email, token, expiredate, JSON.stringify(changes), sofortkaufValue, adminValue);

            return res.status(201).json({ message: 'Token added successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    if (req.method === 'GET') {
        try {
            const { email } = req.query;
            console.log('GET request received with email:', email);

            const statement = db.prepare('SELECT changes, sofortkauf FROM auth_tokens WHERE email = ?');
            const users = statement.get(email);
            console.log('Database query result:', users);

            const sofortkauf = users.sofortkauf ? true : false;


            if (!users) {
                console.log('No user found for email:', email);
                return res.status(404).json({ changes: null, sofortkauf: sofortkauf });
            }

            if (!users.changes) {
                console.log('No changes found for user');
                return res.status(200).json({ changes: null, sofortkauf: sofortkauf });
            }

            try {
                const changes = JSON.parse(users.changes);
                console.log('Parsed changes:', changes);
                return res.status(200).json({ changes: changes, sofortkauf: sofortkauf });
            } catch (parseError) {
                console.error('Error parsing changes JSON:', parseError);
                return res.status(500).json({ error: 'Invalid changes data format' });
            }

        } catch (error) {
            console.error('Server error:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    if (req.method === 'PUT') {
        try {
            const { token, email } = req.body;

            if (!token || !email) {
                return res.status(400).json({ error: 'Token und Email sind erforderlich' });
            }

            // Prüfe ob Email existiert
            const checkEmail = db.prepare('SELECT * FROM auth_tokens WHERE email = ?');
            const user = checkEmail.get(email);

            if (!user) {
                return res.status(404).json({ error: 'Email nicht gefunden' });
            }

            // Update Token für die gegebene Email
            const statement = db.prepare('UPDATE auth_tokens SET token = ? WHERE email = ?');
            statement.run(token, email);

            return res.status(200).json({ message: 'Token erfolgreich aktualisiert' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Interner Serverfehler' });
        }
    }

    if (req.method === 'DELETE') {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const statement = db.prepare('DELETE FROM auth_tokens WHERE email = ?');
            statement.run(email);

            return res.status(200).json({ message: 'User deleted successfully' });
        } catch (error) {
            console.error(error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    }

    res.setHeader('Allow', ['POST', 'GET', 'PUT', 'DELETE']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
}
