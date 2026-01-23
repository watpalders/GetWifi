const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

// This is a self-invoking async function that initializes the database
async function init() {
    try {
        const db = await open({
            filename: './wifi_credentials.db',
            driver: sqlite3.Database
        });

        // Create the table if it doesn't exist
        await db.exec(`
            CREATE TABLE IF NOT EXISTS credentials (
                publicId TEXT PRIMARY KEY,
                secretId TEXT NOT NULL,
                ssid TEXT NOT NULL,
                password TEXT NOT NULL,
                views INTEGER DEFAULT 0,
                greeting TEXT DEFAULT 'Welcome Guest'
            );
        `);

        // Migration: Add columns if they don't exist (for existing databases)
        // We catch errors because "duplicate column name" means it's already there.
        try {
            await db.exec(`ALTER TABLE credentials ADD COLUMN views INTEGER DEFAULT 0;`);
        } catch (e) { /* Column likely exists */ }

        try {
            await db.exec(`ALTER TABLE credentials ADD COLUMN greeting TEXT DEFAULT 'Welcome Guest';`);
        } catch (e) { /* Column likely exists */ }

        console.log('Database initialized successfully.');
        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1); // Exit if DB connection fails
    }
}

module.exports = init();
