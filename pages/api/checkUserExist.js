import db from '../../utils/db';

export default async function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const { email } = req.query;
            const statement = db.prepare('SELECT * FROM user WHERE email = ?');
            const user = statement.get(email);

            if (!user) {
                return res.status(200).json({ user: false });
            }

            return res.status(200).json({ user: true });
        }
    } catch (error) {
        console.error('Fehler beim Laden der Benutzerdaten:', error);
        return res.status(500).json({ error: 'Fehler beim Laden der Benutzerdaten' });
    }
}




