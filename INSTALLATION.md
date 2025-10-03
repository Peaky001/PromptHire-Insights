# Quick Installation Guide

## Chrome Extension Installation

### Step 1: Build the Extension
```bash
cd /home/shrey01/my_scraper-1
npm install
npm run build
```

### Step 2: Load Extension in Chrome
1. Open Chrome browser
2. Go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right corner)
4. Click "Load unpacked" button
5. Navigate to and select the `dist` folder in this project
6. The extension should now appear in your Chrome toolbar

### Step 3: Test the Extension
1. Navigate to any LinkedIn profile (e.g., `https://www.linkedin.com/in/someone`)
2. Click the extension icon in your Chrome toolbar
3. Click "🔍 Scrape Profile" to test scraping
4. Enter an API URL and click "📤 Send to API" to test API integration

## Testing with Example API Server

### Step 1: Start the Example Server
```bash
# In the project directory
npm run api-server
```

The server will start on `http://localhost:3000`

### Step 2: Use the Extension
1. Go to a LinkedIn profile page
2. Open the extension popup
3. Click "Scrape Profile"
4. Enter API URL: `http://localhost:3000/api/linkedin-profile`
5. Click "Send to API"
6. Check the server console for received data

### Step 3: View Scraped Data
- All profiles: `http://localhost:3000/api/profiles`
- Specific profile: `http://localhost:3000/api/profiles/{id}`
- Health check: `http://localhost:3000/health`

## Troubleshooting

### Extension Not Loading
- Make sure you selected the `dist` folder, not the project root
- Check Chrome's extension page for any error messages
- Try refreshing the extensions page

### Scraping Not Working
- Ensure you're on a LinkedIn profile page (URL should contain `/in/`)
- Refresh the LinkedIn page and try again
- Check browser console (F12) for any errors

### API Calls Failing
- Verify the API server is running
- Check that the API URL is correct
- Ensure CORS is enabled on your API server (included in example)

## Production Deployment

For production use:
1. Replace the example API server with your production API
2. Update the API URL in the extension
3. Consider implementing authentication/API keys
4. Test thoroughly with different LinkedIn profiles
5. Package the extension for distribution

## Security Notes

- The extension only works on LinkedIn profile pages
- No sensitive data is stored locally
- All API calls go through the background script
- Respect LinkedIn's Terms of Service and rate limits
