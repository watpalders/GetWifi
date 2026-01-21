const express = require('express');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const ShortUniqueId = require('short-unique-id');
const qrcode = require('qrcode');
const dbPromise = require('./database.js');

const app = express();
const port = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json()); // Middleware to parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Middleware to parse URL-encoded bodies

// Initialize ShortUniqueId for public IDs
const uid = new ShortUniqueId({ length: 8 });

app.post('/create', async (req, res) => {
    const { ssid, password } = req.body;

    if (!ssid || !password) {
        return res.status(400).json({ error: 'SSID and Password are required.' });
    }

    try {
        const publicId = uid.rnd();
        const secretId = uuidv4(); // Use UUID for a truly unguessable secret ID

        const db = await dbPromise;
        await db.run('INSERT INTO credentials (publicId, secretId, ssid, password) VALUES (?, ?, ?, ?)', [publicId, secretId, ssid, password]);

        const adminLink = `/admin/${secretId}`;
        const publicLink = `/v/${publicId}`;

        // Generate QR code for the admin link
        const fullAdminLink = `${req.protocol}://${req.get('host')}${adminLink}`;
        const qrCodeBase64 = await qrcode.toDataURL(fullAdminLink);

        res.json({
            publicLink,
            adminLink,
            qrCodeBase64,
            message: 'Wi-Fi links generated successfully!'
        });
    } catch (error) {
        console.error('Error in /create endpoint:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Route to serve the view.html for public links
app.get('/v/:publicId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

// API endpoint to get Wi-Fi details for a public ID
app.get('/api/v/:publicId', async (req, res) => {
    const { publicId } = req.params;
    try {
        const db = await dbPromise;
        const credential = await db.get('SELECT ssid, password FROM credentials WHERE publicId = ?', [publicId]);
        if (credential) {
            res.json(credential);
        } else {
            res.status(404).json({ error: 'Wi-Fi credentials not found.' });
        }
    } catch (error) {
        console.error('Error fetching Wi-Fi details:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// Route to serve the admin.html for secret links
app.get('/admin/:secretId', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// API endpoint to get Wi-Fi details for a secret ID (for admin panel)
app.get('/api/admin/:secretId', async (req, res) => {
    const { secretId } = req.params;
    try {
        const db = await dbPromise;
        const credential = await db.get('SELECT ssid, password FROM credentials WHERE secretId = ?', [secretId]);
        if (credential) {
            res.json(credential);
        } else {
            res.status(404).json({ error: 'Admin link not found or invalid.' });
        }
    } catch (error) {
        console.error('Error fetching admin details:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

// API endpoint to update Wi-Fi details for a secret ID (from admin panel)
app.put('/api/admin/:secretId', async (req, res) => {
    const { secretId } = req.params;
    const { ssid, password } = req.body;

    if (!ssid || !password) {
        return res.status(400).json({ error: 'SSID and Password are required.' });
    }

    try {
        const db = await dbPromise;
        const result = await db.run('UPDATE credentials SET ssid = ?, password = ? WHERE secretId = ?', [ssid, password, secretId]);

        if (result.changes > 0) {
            res.json({ message: 'Credentials updated successfully!' });
        }
        else {
            res.status(404).json({ error: 'Admin link not found or invalid.' });
        }
    } catch (error) {
        console.error('Error updating credentials:', error);
        res.status(500).json({ error: 'Internal server error.' });
    }
});

dbPromise.then(db => {
    console.log('Database connection established.');
    app.listen(port, () => {
        console.log(`Server listening on port ${port}`);
    });
}).catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
});
