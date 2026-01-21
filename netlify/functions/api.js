// The handler file for the Netlify serverless function.
const serverless = require('serverless-http');
const app = require('../../server'); // Import our Express app

// Wrap the app in the serverless-http handler
module.exports.handler = serverless(app);
