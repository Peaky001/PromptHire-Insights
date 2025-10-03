# PromptHire insights ✨

A powerful Chrome extension that transforms LinkedIn profiles into actionable hiring insights. Built with React and powered by AI, it seamlessly extracts candidate data and integrates with PromptHire's recruitment platform.

## Features

- ✅ Scrapes comprehensive LinkedIn profile data including:
  - Basic information (name, headline, location, profile image)
  - Work experience
  - Education
  - Skills
- ✅ Beautiful React-based popup interface
- ✅ API integration to send scraped data
- ✅ Works only on LinkedIn profile pages for security
- ✅ Stores API URL for convenience

## Installation

### Development Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <your-repo>
   cd my_scraper-1
   npm install
   ```

2. **Build the Extension**
   ```bash
   npm run build
   ```

3. **Load Extension in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Select the `dist` folder from this project

### Production Build

For production, use:
```bash
npm run build
```

For development with auto-rebuild:
```bash
npm run dev
```

## Usage

1. **Navigate to a LinkedIn Profile**
   - Go to any LinkedIn profile page (e.g., `https://www.linkedin.com/in/username`)

2. **Open the Extension**
   - Click the extension icon in your Chrome toolbar
   - The popup will appear

3. **Scrape Profile Data**
   - Click the "🔍 Scrape Profile" button
   - Wait for the scraping to complete
   - Review the scraped data summary

4. **Send to API**
   - Enter your API endpoint URL in the input field
   - Click "📤 Send to API" to send the scraped data
   - The API URL is saved for future use

## API Integration

The extension sends a POST request to your specified API endpoint with the following payload structure:

```json
{
  "profileData": {
    "name": "John Doe",
    "headline": "Software Engineer at Company",
    "location": "San Francisco, CA",
    "profileImage": "https://...",
    "profileUrl": "https://www.linkedin.com/in/johndoe",
    "experience": [
      {
        "company": "Company Name",
        "position": "Job Title",
        "duration": "Jan 2020 - Present",
        "description": "Job description..."
      }
    ],
    "education": [
      {
        "school": "University Name",
        "degree": "Bachelor's Degree",
        "field": "Computer Science",
        "duration": "2016 - 2020"
      }
    ],
    "skills": ["JavaScript", "React", "Node.js"],
    "scrapedAt": "2024-01-01T12:00:00.000Z"
  },
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "linkedin-scraper-extension"
}
```

## File Structure

```
my_scraper-1/
├── manifest.json           # Chrome extension manifest
├── package.json           # Node.js dependencies
├── webpack.config.js      # Build configuration
├── src/
│   ├── popup/
│   │   ├── popup.jsx      # React popup component
│   │   ├── popup.html     # Popup HTML template
│   │   └── popup.css      # Popup styles
│   ├── content/
│   │   └── content.js     # Content script for scraping
│   └── background/
│       └── background.js  # Background script
└── dist/                  # Built extension files
```

## Development

### Scripts

- `npm run build` - Production build
- `npm run dev` - Development build with watch mode

### Key Components

1. **Content Script** (`src/content/content.js`)
   - Runs on LinkedIn profile pages
   - Handles the actual scraping of profile data
   - Uses multiple selector strategies for reliability

2. **Popup Component** (`src/popup/popup.jsx`)
   - React-based user interface
   - Handles user interactions
   - Manages state and API calls

3. **Background Script** (`src/background/background.js`)
   - Coordinates between popup and content script
   - Handles API calls to external endpoints
   - Manages extension lifecycle

## Security & Privacy

- ✅ Only works on LinkedIn profile pages
- ✅ No data is stored locally (except API URL preference)
- ✅ All scraping happens client-side
- ✅ API calls are made through background script for security

## Troubleshooting

### Common Issues

1. **"Content script not available" Error**
   - Refresh the LinkedIn page and try again
   - Make sure you're on a LinkedIn profile page (not search results or feed)

2. **Scraping Returns Empty Data**
   - LinkedIn may have updated their HTML structure
   - Try waiting a few seconds for the page to fully load
   - Check browser console for any errors

3. **API Call Fails**
   - Verify your API endpoint URL is correct
   - Check that your API accepts POST requests
   - Ensure CORS is properly configured on your API

### Browser Compatibility

This extension is designed for Chrome (Manifest V3). For other browsers, you may need to:
- Convert to Manifest V2 for older Chrome versions
- Adapt for Firefox WebExtensions API
- Modify for Safari Web Extensions

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly on different LinkedIn profiles
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Disclaimer

This extension is for educational and personal use only. Please respect LinkedIn's Terms of Service and robots.txt. Consider rate limiting and be mindful of privacy when scraping profile data.