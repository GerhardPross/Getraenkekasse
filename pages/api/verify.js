import db from '../../utils/db';


export default function handler(req, res) {
    try {
        if (req.method === 'GET') {
            const { token } = req.query;
            console.log(token);

            if (!token) {
                return res.status(400).json({ error: 'Token ist erforderlich' });
            }

            const statement = db.prepare('SELECT * FROM auth_tokens WHERE token = ?');
            const user = statement.get(token);

            if (!user) {
                return res.status(404).json({ error: 'Token nicht gefunden' });
            }

            const badToken = new Date(user.expiredate) < new Date();
            console.log(badToken);
            
            if (badToken) {
                db.prepare('DELETE FROM auth_tokens WHERE token = ?').run(token);
                return res.status(401).json({ error: 'Token ist abgelaufen' });
            }

            return res.status(200).json({ valid: true, email: user.email, admin: user.admin });
        }

        return res.status(405).json({ error: 'Methode nicht erlaubt' });

    } catch (error) {
        return res.status(500).json({ error: 'Interner Serverfehler' });
    }
}
