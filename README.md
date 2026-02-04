# Home Visit Scheduler - Setup Guide

## Prerequisites
- Node.js installed (v14 or higher)
- SQL Server installed and running on your PC
- Git installed

## Setup Instructions

### 1. Install SQL Server (if not already installed)
- Download SQL Server Express (free): https://www.microsoft.com/en-us/sql-server/sql-server-downloads
- Or use SQL Server Management Studio (SSMS) if you already have it

### 2. Create the Database

1. Open SQL Server Management Studio (SSMS)
2. Connect to your local SQL Server instance
3. Open the file: `backend/database-schema.sql`
4. Execute the SQL script to create the database and table

OR run from command line:
```bash
sqlcmd -S localhost -i backend/database-schema.sql
```

### 3. Configure Backend

1. Navigate to the backend folder:
```bash
cd backend
```

2. Install Node.js dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
copy .env.example .env
```

4. Edit the `.env` file with your SQL Server credentials:
```env
DB_SERVER=localhost
DB_DATABASE=VisitScheduler
DB_USER=your_username
DB_PASSWORD=your_password
DB_PORT=1433
PORT=3001
```

**Note:** If you're using Windows Authentication, update `db.js` to use trusted connection instead of username/password.

### 4. Start the Backend Server

```bash
npm start
```

You should see:
```
✅ Connected to SQL Server
🚀 Server running on http://localhost:3001
```

Keep this terminal window open - the server must run for the app to work!

### 5. Test the Application

1. Open the website in your browser:
   - Local: Open `index.html` in your browser
   - GitHub Pages: Visit https://yohannesdev.github.io/Visit-scheduler/

2. Submit a test appointment
3. Click "Admin Access" to view all appointments

## Important Notes

### For Local Testing:
- Backend must be running on your PC
- Open `index.html` directly in browser OR use GitHub Pages URL
- Both will connect to `http://localhost:3001`

### For Clients to Access:

**Option A: PC Must Stay On**
- Your PC with backend running must be on
- Clients can access the GitHub Pages URL
- Appointments save to your SQL Server

**Option B: Use ngrok (to expose your local server)**
1. Download ngrok: https://ngrok.com/download
2. Start ngrok:
   ```bash
   ngrok http 3001
   ```
3. Update `API_URL` in `index.html` to the ngrok URL (e.g., `https://abc123.ngrok.io/api/appointments`)
4. Commit and push changes to GitHub

## Troubleshooting

### "Could not connect to server"
- Make sure the backend is running (`npm start` in the backend folder)
- Check that SQL Server is running
- Verify your `.env` credentials are correct

### SQL Connection Errors
- Verify SQL Server is running
- Check if TCP/IP is enabled in SQL Server Configuration Manager
- Ensure firewall allows connections on port 1433

### CORS Errors
- The backend is configured to allow all origins
- If issues persist, check browser console for specific errors

## Updating the Code

When you make changes to `index.html`:
```bash
git add .
git commit -m "Update frontend"
git push origin main
```

The GitHub Pages site will update automatically in 1-2 minutes.

## Production Deployment (Optional)

To deploy the backend to a cloud service:
1. **Azure**: Deploy as Azure App Service
2. **Heroku**: Use Heroku with PostgreSQL addon
3. **Railway**: Simple deployment with built-in PostgreSQL

Let me know if you need help with cloud deployment!
