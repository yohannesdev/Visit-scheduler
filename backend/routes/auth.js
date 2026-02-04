const express = require('express');
const router = express.Router();
const { getAuthUrl, getTokensFromCode } = require('../googleCalendar');

// Get Google OAuth URL
router.get('/google-auth-url', (req, res) => {
  const authUrl = getAuthUrl();
  res.json({ authUrl });
});

// OAuth callback endpoint
router.get('/oauth2callback', async (req, res) => {
  const { code } = req.query;
  
  if (!code) {
    return res.status(400).send('Missing authorization code');
  }
  
  try {
    const tokens = await getTokensFromCode(code);
    
    res.send(`
      <html>
        <head><title>Google Calendar Setup</title></head>
        <body style="font-family: Arial; padding: 40px;">
          <h2>✅ Google Calendar Connected Successfully!</h2>
          <p>Copy the refresh token below and add it to your .env file:</p>
          <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px;">
GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}
          </pre>
          <p><strong>Next steps:</strong></p>
          <ol>
            <li>Copy the refresh token above</li>
            <li>Add it to your backend/.env file</li>
            <li>Restart the server</li>
          </ol>
          <p>You can close this window now.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Error getting tokens:', error);
    res.status(500).send('Error getting tokens: ' + error.message);
  }
});

module.exports = router;
