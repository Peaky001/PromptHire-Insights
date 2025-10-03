// Example API server for testing the LinkedIn Profile Scraper Extension
// Run with: node example-api-server.js

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

// Middleware
app.use(cors()); // Enable CORS for extension requests
app.use(express.json({ limit: '10mb' })); // Parse JSON bodies

// Store scraped profiles (in production, use a proper database)
const scrapedProfiles = [];

// Endpoint to receive scraped LinkedIn profile data
app.post('/api/linkedin-profile', (req, res) => {
  try {
    console.log('Received LinkedIn profile data:');
    console.log('-----------------------------------');
    
    const { profileData, timestamp, source } = req.body;
    
    if (!profileData) {
      return res.status(400).json({
        success: false,
        error: 'profileData is required'
      });
    }

    // Log the received data
    console.log(`Name: ${profileData.name || 'N/A'}`);
    console.log(`Headline: ${profileData.headline || 'N/A'}`);
    console.log(`Location: ${profileData.location || 'N/A'}`);
    console.log(`Profile URL: ${profileData.profileUrl || 'N/A'}`);
    console.log(`Experience entries: ${profileData.experience ? profileData.experience.length : 0}`);
    console.log(`Education entries: ${profileData.education ? profileData.education.length : 0}`);
    console.log(`Skills: ${profileData.skills ? profileData.skills.length : 0}`);
    console.log(`Scraped at: ${profileData.scrapedAt || 'N/A'}`);
    console.log(`Source: ${source || 'N/A'}`);
    console.log('-----------------------------------');

    // Store the profile data
    const profileEntry = {
      id: Date.now(),
      profileData,
      timestamp,
      source,
      receivedAt: new Date().toISOString()
    };
    
    scrapedProfiles.push(profileEntry);

    // Respond with success
    res.json({
      success: true,
      message: 'Profile data received successfully',
      profileId: profileEntry.id,
      dataReceived: {
        name: profileData.name,
        profileUrl: profileData.profileUrl,
        experienceCount: profileData.experience ? profileData.experience.length : 0,
        educationCount: profileData.education ? profileData.education.length : 0,
        skillsCount: profileData.skills ? profileData.skills.length : 0
      }
    });

  } catch (error) {
    console.error('Error processing profile data:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Get all scraped profiles
app.get('/api/profiles', (req, res) => {
  res.json({
    success: true,
    count: scrapedProfiles.length,
    profiles: scrapedProfiles.map(profile => ({
      id: profile.id,
      name: profile.profileData.name,
      profileUrl: profile.profileData.profileUrl,
      scrapedAt: profile.profileData.scrapedAt,
      receivedAt: profile.receivedAt
    }))
  });
});

// Get specific profile by ID
app.get('/api/profiles/:id', (req, res) => {
  const profileId = parseInt(req.params.id);
  const profile = scrapedProfiles.find(p => p.id === profileId);
  
  if (!profile) {
    return res.status(404).json({
      success: false,
      error: 'Profile not found'
    });
  }

  res.json({
    success: true,
    profile
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API server is running',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 LinkedIn Profile Scraper API Server running on http://localhost:${PORT}`);
  console.log(`📡 Send profile data to: http://localhost:${PORT}/api/linkedin-profile`);
  console.log(`📊 View all profiles at: http://localhost:${PORT}/api/profiles`);
  console.log(`❤️  Health check at: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Waiting for profile data...');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down API server...');
  process.exit(0);
});
