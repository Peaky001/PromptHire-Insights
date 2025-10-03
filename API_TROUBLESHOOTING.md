# API Troubleshooting Guide

## Current Issue: Token Appears to be Expired

The PromptHire API is returning "Invalid token or expired token" errors. Here's how to fix it:

## Steps to Get a Fresh Token

1. **Get a new token from PromptHire:**
   - Log into your PromptHire staging account
   - Generate a new API token from your account settings
   - Copy the new token

2. **Update the token in the extension:**
   - Open `/home/shrey01/my_scraper-1/src/background/background.js`
   - Find line 65: `const PROMPTHIRE_TOKEN = '...'`
   - Replace the old token with your new token
   - Save the file

3. **Rebuild the extension:**
   ```bash
   npm run build
   ```

4. **Reload the extension in Chrome:**
   - Go to `chrome://extensions/`
   - Find "LinkedIn Detective"
   - Click the refresh icon

## How to Test if APIs are Working

Open Chrome DevTools Console (F12) when using the extension and you'll see detailed logs:

### When opening the popup:
- `Fetching job openings from: https://prompthire.org/api/jobopenings`
- `Job openings response status: 200` (should be 200 for success)
- `Job openings result: [array of jobs]`

### When sending an applicant:
- `Sending applicant to: https://prompthire.org/api/applicants`
- `Applicant data: {job_opening_id: "...", candidate_name: "...", ...}`
- `Send applicant response status: 200` (should be 200 for success)

## Alternative: Test API Manually

Test if your token works:

```bash
# Test GET job openings
curl -X GET "https://prompthire.org/api/jobopenings" \
  -H "Authorization: Bearer YOUR_NEW_TOKEN_HERE" \
  -H "Content-Type: application/json"

# Test POST applicant (after getting job_opening_id from above)
curl -X POST "https://prompthire.org/api/applicants" \
  -H "Authorization: Bearer YOUR_NEW_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{
    "job_opening_id": "some_id_from_get_request",
    "candidate_name": "Test Candidate",
    "candidate_email": "test@example.com",
    "experience": "5 years",
    "skills": ["JavaScript", "React"],
    "current_company": "Test Company",
    "linkedin_profile": "https://linkedin.com/in/test",
    "current_location": "Test City"
  }'
```

## What's New in This Update

### Features Added:
1. **Dropdown now shows all job openings** from the PromptHire API
2. **Refresh button** - Click to reload job openings if they fail to load initially
3. **Better error messages** - Shows specific error messages from the API
4. **Debug logging** - All API calls are logged to console for troubleshooting
5. **Better UX** - Clear visual feedback when loading or when no jobs are available

### How It Works:
1. Open the extension on any LinkedIn profile page
2. The extension automatically fetches job openings when you open it
3. Click "AI Investigation" to scrape the profile
4. Select a job opening from the dropdown
5. Click "Send Intelligence" to add the candidate to that job opening

### Dropdown Features:
- Shows job title, department (if available), and location (if available)
- Disabled if no jobs are available
- Can be refreshed with the refresh button
- Selection persists until you submit successfully

## Need a New Token?

Contact the PromptHire team or check your account dashboard for API token generation.
