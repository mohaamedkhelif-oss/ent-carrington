const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./database'); 
const app = express();

// --- CONFIGURATION ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ 
    secret: 'ien-carrington-secret-77', 
    resave: false, 
    saveUninitialized: true 
}));

// --- CRÉATION AUTO DU COMPTE ADMIN ---
// Identifiants par défaut : admin77 / password123
db.run(`INSERT OR IGNORE INTO users (firstname, lastname, username, password, role, fonction, etablissement) 
        VALUES ('Admin', 'IEN', 'admin77', 'password123', 'admin', 'Directeur', 'Collège Carrington')`);

// --- ROUTES UTILISATEURS ---

// ACCUEIL : Messagerie + Message Flash
app.get('/', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    
    db.get("SELECT * FROM flash_messages WHERE active = 1 ORDER BY id DESC", (err, flash) => {
        db.all("SELECT * FROM messages WHERE receiver_username = ? ORDER BY id DESC", [req.session.user.username], (err, mails) => {
            res.render('index', { 
                user: req.session.user, 
                messages: mails || [], 
                flashMessage: flash 
            });
        });
    });
});

// CONNEXION / DÉCONNEXION
app.get('/login', (req, res) => res.render('login'));

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    db.get("SELECT * FROM users WHERE username = ? AND password = ?", [username, password], (err, user) => {
        if (user) {
            req.session.user = user;
            res.redirect('/');
        } else {
            res.send("Identifiants incorrects. <a href='/login'>Réessayer</a>");
        }
    });
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// --- ROUTES ADMINISTRATION (CONSOLE IEN) ---

app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
    
    db.all("SELECT * FROM users", (err, users) => {
        db.all("SELECT * FROM groups", (err, groups) => {
            res.render('admin', { users: users || [], groups: groups || [] });
        });
    });
});

// Action : Créer un Utilisateur
app.post('/admin/create-user', (req, res) => {
    const { firstname, lastname, username, password, fonction } = req.body;
    const role = (fonction === 'Directeur') ? 'admin' : 'user';
    
    db.run(`INSERT INTO users (firstname, lastname, username, password, role, fonction) VALUES (?, ?, ?, ?, ?, ?)`,
    [firstname, lastname, username, password, role, fonction], (err) => {
        res.redirect('/admin');
    });
});

// Action : Créer un Groupe
app.post('/admin/create-group', (req, res) => {
    db.run(`INSERT INTO groups (name) VALUES (?)`, [req.body.group_name], () => {
        res.redirect('/admin');
    });
});

// Action : Mettre à jour la fonction (Select dans le tableau)
app.post('/admin/update-fonction', (req, res) => {
    db.run("UPDATE users SET fonction = ? WHERE username = ?", [req.body.fonction, req.body.username], () => {
        res.redirect('/admin');
    });
});

// Action : Envoyer un Message Flash (Urgence)
app.post('/admin/flash', (req, res) => {
    db.run("UPDATE flash_messages SET active = 0", () => { // On désactive l'ancien
        db.run("INSERT INTO flash_messages (content, active) VALUES (?, 1)", [req.body.content], () => {
            res.redirect('/admin');
        });
    });
});

// --- MESSAGERIE ---

// API Recherche (pour les bulles de couleur Outlook)
app.get('/api/users/search', (req, res) => {
    const q = `%${req.query.q}%`;
    db.all("SELECT username, firstname, lastname FROM users WHERE firstname LIKE ? OR lastname LIKE ? LIMIT 5", [q, q], (err, rows) => {
        res.json(rows || []);
    });
});

// Envoi de mail
app.post('/send-mail', (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    const sender = `${req.session.user.firstname} ${req.session.user.lastname}`;
    db.run("INSERT INTO messages (sender_name, receiver_username, subject, content, date) VALUES (?, ?, ?, ?, ?)",
    [sender, req.body.to, req.body.subject, req.body.content, new Date().toISOString()], () => {
        res.redirect('/');
    });
});

// --- LANCEMENT (PRÊT POUR L'HÉBERGEMENT) ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`
    -------------------------------------------
    ✅ SERVEUR EN LIGNE : http://localhost:${PORT}
    ADMIN : admin77 / password123
    -------------------------------------------
    `);
});