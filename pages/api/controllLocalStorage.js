import db from '../../utils/db';

export default function handler(req, res) {
    if (req.method === 'POST') {
        try {
            const { hash, getraenkeID } = req.body;

            if (!hash) {
                return res.status(400).json({
                    valid: false,
                    getraenkeID: getraenkeID
                });
            }

            const statement = db.prepare('SELECT * FROM auth_tokens WHERE token = ?');
            const user = statement.get(hash);
            const email = user.email;
            const change = user.changes;
            const sofortkauf = change.sofortkauf;
            const sofortkaufBool = sofortkauf ? true : false;



            if (!user) {
                return res.status(401).json({
                    valid: false,
                    getraenkeID: getraenkeID,
                    email: email,
                });
            }

            if (hash !== user.token) {
                return res.status(401).json({
                    valid: false,
                    getraenkeID: getraenkeID,
                    email: email,
                });
            }

            if (getraenkeID !== undefined || getraenkeID !== null) {
                return res.status(200).json({
                    valid: true,
                    email: email,
                    sofortkauf: sofortkaufBool
                });
            } else {
                return res.status(200).json({
                    valid: true,
                    email: email,
                    getraenkeID: getraenkeID,
                    sofortkauf: sofortkaufBool
                });
            }

        } catch (error) {
            return res.status(500).json({
                valid: false,
            });
        }
    }

    if (req.method === 'GET') {
        try {
            const { token } = req.query;
            const statement = db.prepare('SELECT * FROM auth_tokens WHERE token = ?');
            const users = statement.get(token);
            if (!users) {
                return res.status(404).json({
                    valid: false,
                    error: 'Kein Benutzer zum Token gefunden'
                });
            }
            const admin = users.admin ? true : false;
            console.log("admin", admin);
            return res.status(200).json({ admin: admin });
        } catch (error) {
            console.error('Fehler beim Abrufen der Admin-Informationen:', error);
            return res.status(500).json({
                valid: false,
                error: 'Fehler beim Abrufen der Admin-Informationen'
            });
        }
    }


    return res.status(405).json({
        valid: false,
    });
}
