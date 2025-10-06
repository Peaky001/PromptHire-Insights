// Background script for LinkedIn Profile Scraper extension

// Rate limiting configuration
const RATE_LIMIT = {
  MAX_PROFILES: 75,
  WINDOW_MINUTES: 5,
  COOLDOWN_MINUTES: 5
};

// Rate limiting state
let rateLimitState = {
  profileCount: 0,
  windowStart: Date.now(),
  isCooldown: false,
  cooldownEnd: null
};

// Load rate limit state from storage on startup
chrome.storage.local.get(['rateLimitState'], (result) => {
  if (result.rateLimitState) {
    rateLimitState = result.rateLimitState;
    console.log('Loaded rate limit state:', rateLimitState);
  }
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openPopup') {
    // Open the popup by clicking the extension icon
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
});

// Save rate limit state to storage
function saveRateLimitState() {
  chrome.storage.local.set({ rateLimitState }, () => {
    console.log('Rate limit state saved:', rateLimitState);
  });
}

// Check if we're in cooldown period
function isInCooldown() {
  if (!rateLimitState.isCooldown) return false;
  
  const now = Date.now();
  if (now >= rateLimitState.cooldownEnd) {
    // Cooldown period ended
    rateLimitState.isCooldown = false;
    rateLimitState.cooldownEnd = null;
    saveRateLimitState();
    return false;
  }
  
  return true;
}

// Check if we can scrape a profile (rate limit check)
function canScrapeProfile() {
  const now = Date.now();
  const windowMs = RATE_LIMIT.WINDOW_MINUTES * 60 * 1000;
  
  // Check if we're in cooldown
  if (isInCooldown()) {
    return {
      allowed: false,
      reason: 'cooldown',
      cooldownEnd: rateLimitState.cooldownEnd
    };
  }
  
  // Check if we need to reset the window
  if (now - rateLimitState.windowStart >= windowMs) {
    // Reset the window
    rateLimitState.profileCount = 0;
    rateLimitState.windowStart = now;
    saveRateLimitState();
  }
  
  // Check if we've reached the limit
  if (rateLimitState.profileCount >= RATE_LIMIT.MAX_PROFILES) {
    // Start cooldown period
    rateLimitState.isCooldown = true;
    rateLimitState.cooldownEnd = now + (RATE_LIMIT.COOLDOWN_MINUTES * 60 * 1000);
    saveRateLimitState();
    
    return {
      allowed: false,
      reason: 'limit_reached',
      cooldownEnd: rateLimitState.cooldownEnd
    };
  }
  
  return {
    allowed: true,
    remaining: RATE_LIMIT.MAX_PROFILES - rateLimitState.profileCount,
    windowReset: rateLimitState.windowStart + windowMs
  };
}

// Increment profile count after successful scraping
function incrementProfileCount() {
  rateLimitState.profileCount++;
  saveRateLimitState();
  console.log(`Profile count incremented: ${rateLimitState.profileCount}/${RATE_LIMIT.MAX_PROFILES}`);
}

// Get rate limit status
function getRateLimitStatus() {
  const now = Date.now();
  const windowMs = RATE_LIMIT.WINDOW_MINUTES * 60 * 1000;
  
  if (isInCooldown()) {
    const cooldownRemaining = Math.ceil((rateLimitState.cooldownEnd - now) / 1000);
    return {
      status: 'cooldown',
      cooldownRemaining,
      cooldownEnd: rateLimitState.cooldownEnd
    };
  }
  
  // Check if we need to reset the window
  if (now - rateLimitState.windowStart >= windowMs) {
    // Reset the window
    rateLimitState.profileCount = 0;
    rateLimitState.windowStart = now;
    saveRateLimitState();
  }
  
  const windowReset = rateLimitState.windowStart + windowMs;
  const windowRemaining = Math.max(0, Math.ceil((windowReset - now) / 1000));
  
  return {
    status: 'active',
    profileCount: rateLimitState.profileCount,
    maxProfiles: RATE_LIMIT.MAX_PROFILES,
    remaining: RATE_LIMIT.MAX_PROFILES - rateLimitState.profileCount,
    windowRemaining,
    windowReset
  };
}

// Extension installation/startup
chrome.runtime.onInstalled.addListener(() => {
  console.log('LinkedIn Profile Scraper extension installed');
});

// Clear job selection when extension is disabled/uninstalled
chrome.runtime.onSuspend.addListener(() => {
  console.log('Extension is being suspended, clearing job selection');
  chrome.storage.sync.remove(['selectedJobOpening'], () => {
    console.log('Job selection cleared on extension suspend');
  });
});

// Clear job selection when extension is disabled
chrome.management.onDisabled.addListener((extensionInfo) => {
  if (extensionInfo.id === chrome.runtime.id) {
    console.log('Extension is being disabled, clearing job selection');
    chrome.storage.sync.remove(['selectedJobOpening'], () => {
      console.log('Job selection cleared on extension disable');
    });
  }
});

// Handle messages between popup and content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'scrapeProfile') {
    // Check rate limit before allowing scraping
    const rateLimitCheck = canScrapeProfile();
    
    if (!rateLimitCheck.allowed) {
      if (rateLimitCheck.reason === 'cooldown') {
        const cooldownRemaining = Math.ceil((rateLimitCheck.cooldownEnd - Date.now()) / 1000);
        sendResponse({ 
          success: false, 
          error: `Rate limit exceeded. Please wait ${cooldownRemaining} seconds before scraping again.`,
          rateLimit: {
            status: 'cooldown',
            cooldownRemaining,
            cooldownEnd: rateLimitCheck.cooldownEnd
          }
        });
      } else if (rateLimitCheck.reason === 'limit_reached') {
        const cooldownRemaining = Math.ceil((rateLimitCheck.cooldownEnd - Date.now()) / 1000);
        sendResponse({ 
          success: false, 
          error: `Rate limit reached (${RATE_LIMIT.MAX_PROFILES} profiles in ${RATE_LIMIT.WINDOW_MINUTES} minutes). Please wait ${cooldownRemaining} seconds before scraping again.`,
          rateLimit: {
            status: 'cooldown',
            cooldownRemaining,
            cooldownEnd: rateLimitCheck.cooldownEnd
          }
        });
      }
      return true;
    }
    
    // Forward the message to the active tab's content script
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, request, (response) => {
          if (chrome.runtime.lastError) {
            sendResponse({ 
              success: false, 
              error: 'Content script not available. Please refresh the LinkedIn page.' 
            });
          } else {
            // If scraping was successful, increment the profile count
            if (response.success) {
              incrementProfileCount();
            }
            sendResponse(response);
          }
        });
      } else {
        sendResponse({ 
          success: false, 
          error: 'No active tab found' 
        });
      }
    });
    
    return true; // Will respond asynchronously
  }

  if (request.action === 'getRateLimitStatus') {
    // Return current rate limit status
    const status = getRateLimitStatus();
    sendResponse({ success: true, data: status });
    return true;
  }

  if (request.action === 'sendToAPI') {
    // Handle API call
    handleAPICall(request.data, request.apiUrl)
      .then(response => sendResponse({ success: true, response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Will respond asynchronously
  }

  if (request.action === 'fetchOrganizations') {
    // Fetch organizations from PromptHire API
    fetchOrganizations()
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Will respond asynchronously
  }

  if (request.action === 'fetchJobOpenings') {
    // Fetch job openings from PromptHire API
    fetchJobOpenings(request.organizationId)
      .then(data => sendResponse({ success: true, data }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Will respond asynchronously
  }

  if (request.action === 'sendApplicant') {
    // Send applicant data to PromptHire API
    sendApplicant(request.data)
      .then(response => sendResponse({ success: true, response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Will respond asynchronously
  }
});

// PromptHire API configuration
const PROMPTHIRE_API_BASE = process.env.PROMPTHIRE_API_BASE || 'https://prompthire.org/api';
const PROMPTHIRE_TOKEN = process.env.PROMPTHIRE_TOKEN || '';

// Function to fetch organizations
async function fetchOrganizations() {
  try {
    console.log('Fetching organizations from:', `${PROMPTHIRE_API_BASE}/organisations?page_size=100`);
    
    const response = await fetch(`${PROMPTHIRE_API_BASE}/organisations?page_size=100`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROMPTHIRE_TOKEN}`
      }
    });

    console.log('Organizations response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Organizations API error:', errorText);
      throw new Error(`Failed to fetch organizations: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Organizations result:', result);
    return result;
  } catch (error) {
    console.error('Fetch organizations error:', error);
    throw error;
  }
}

// Function to fetch job openings
async function fetchJobOpenings(organizationId = null) {
  try {
    if (!organizationId) {
      throw new Error('Organization ID is required to fetch job openings');
    }
    
    const url = `${PROMPTHIRE_API_BASE}/jobopening_summary?org_id=${organizationId}`;
    console.log('Fetching job openings from:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROMPTHIRE_TOKEN}`
      }
    });

    console.log('Job openings response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Job openings API error:', errorText);
      throw new Error(`Failed to fetch job openings: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Job openings result:', result);
    return result;
  } catch (error) {
    console.error('Fetch job openings error:', error);
    throw error;
  }
}

// Function to send applicant data
async function sendApplicant(applicantData) {
  try {
    console.log('Sending applicant to:', `${PROMPTHIRE_API_BASE}/applicants`);
    console.log('Applicant data:', applicantData);
    
    const response = await fetch(`${PROMPTHIRE_API_BASE}/applicants`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${PROMPTHIRE_TOKEN}`
      },
      body: JSON.stringify(applicantData)
    });

    console.log('Send applicant response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Send applicant API error:', errorText);
      throw new Error(`Failed to send applicant: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    console.log('Send applicant result:', result);
    return result;
  } catch (error) {
    console.error('Send applicant error:', error);
    throw error;
  }
}

// Function to handle API calls
async function handleAPICall(profileData, apiUrl) {
  try {
    if (!apiUrl) {
      throw new Error('API URL is required');
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        profileData,
        timestamp: new Date().toISOString(),
        source: 'linkedin-scraper-extension'
      })
    });

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('API call error:', error);
    throw error;
  }
}

// Check if current tab is LinkedIn
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && (tab.url.includes('linkedin.com/in/') || tab.url.includes('www.linkedin.com/in/'))) {
      // Enable the extension icon when on LinkedIn profile page
      chrome.action.enable(activeInfo.tabId);
    } else {
      // Optionally disable on non-LinkedIn pages
      // chrome.action.disable(activeInfo.tabId);
    }
  } catch (error) {
    console.error('Error checking tab:', error);
  }
});

console.log('LinkedIn Profile Scraper background script loaded');
