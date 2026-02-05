# Google Calendar Integration Setup

## Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Calendar API**:
   - Click "Enable APIs and Services"
   - Search for "Google Calendar API"
   - Click "Enable"

## Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **"Create Credentials"** > **"OAuth client ID"**
3. If prompted, configure the OAuth consent screen:
   - User Type: **External**
   - App name: **Home Visit Scheduler**
   - User support email: **Forallhomecare@gmail.com**
   - Developer contact: **Forallhomecare@gmail.com**
   - Scopes: Add `https://www.googleapis.com/auth/calendar`
   - Test users: Add **Forallhomecare@gmail.com**
   - Save and continue

4. Create OAuth Client ID:
   - Application type: **Web application**
   - Name: **Home Visit Scheduler**
   - Authorized redirect URIs: Add **http://localhost:3001/api/auth/oauth2callback**
   - Click **Create**

5. **Copy** the Client ID and Client Secret

## Step 3: Add Credentials to .env File

Add these to your `backend/.env` file:

```env
GOOGLE_CLIENT_ID=your_client_id_here
GOOGLE_CLIENT_SECRET=your_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/oauth2callback
```

## Step 4: Authorize the Application

1. Restart your backend server
2. Open your browser and go to:
   ```
   http://localhost:3001/api/auth/google-auth-url
   ```

3. Copy the `authUrl` from the JSON response
4. Paste it in your browser and visit it
5. Sign in with **Forallhomecare@gmail.com**
6. Grant the requested permissions
7. You'll be redirected to a page showing your refresh token
8. Copy the refresh token

## Step 5: Add Refresh Token to .env

Add the refresh token to your `backend/.env` file:

```env
GOOGLE_REFRESH_TOKEN=your_refresh_token_here
```

Your complete .env should look like:

```env
DB_SERVER=localhost
DB_DATABASE=Forallhomecare
DB_USER=johnny
DB_PASSWORD=NewPassword2024!
DB_PORT=1433
PORT=3001

# Google Calendar Integration
GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:3001/api/auth/oauth2callback
GOOGLE_REFRESH_TOKEN=your_refresh_token
```

## Step 6: Restart Server

Restart your backend server to apply the changes.

## How It Works

- When you **confirm** an appointment in the admin panel, it automatically creates a Google Calendar event
- The event includes:
  - Client name, phone, email, and address
  - Appointment date and time (1-hour duration)
  - Email notification to the client
  - Reminders (1 day before and 30 minutes before)

## Testing

1. Submit a test appointment from your form
2. Go to Admin panel
3. Click "Confirm" on the appointment
4. Check your Google Calendar (Forallhomecare@gmail.com) - the event should appear!

## Troubleshooting

- **401 Authentication Error**: Refresh token expired. Repeat Step 4 to get a new refresh token
- **403 Access Denied**: Make sure the Google Calendar API is enabled in your project
- **Calendar not showing events**: Check that you're signed in to Forallhomecare@gmail.com in Google Calendar
