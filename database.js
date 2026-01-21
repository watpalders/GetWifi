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
                password TEXT NOT NULL
            );
        `);

        console.log('Database initialized successfully.');
        return db;
    } catch (error) {
        console.error('Failed to initialize database:', error);
        process.exit(1); // Exit if DB connection fails
    }
}

module.exports = init();
