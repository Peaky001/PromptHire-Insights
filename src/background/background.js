// Background script for LinkedIn Profile Scraper extension

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

  if (request.action === 'sendToAPI') {
    // Handle API call
    handleAPICall(request.data, request.apiUrl)
      .then(response => sendResponse({ success: true, response }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    
    return true; // Will respond asynchronously
  }

  if (request.action === 'fetchJobOpenings') {
    // Fetch job openings from PromptHire API
    fetchJobOpenings()
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
const PROMPTHIRE_API_BASE = 'https://prompthire.org/api';
const PROMPTHIRE_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiNjhkZjdlYjNkNDQ1NWJlNTM5ZWVhMDdiIiwidXNlcl9uYW1lIjoicGhsaW5rZWRpbiIsInVzZXJfZW1haWwiOiJzaHJleWFzaEBwcm9tcHRoaXJlLmFpIiwib3JnX2lkcyI6WyI2NzNmNjU0NzExZmJlN2U1ZWQxZjM5MmUiXSwiZXhwIjoxNzYwNzczNDUyfQ.lCZEYRd0BNdLz8d96vwJHf7ZLEAUbAdSt6XOMgPGTnY';

// Function to fetch job openings
async function fetchJobOpenings() {
  try {
    console.log('Fetching job openings from:', `${PROMPTHIRE_API_BASE}/jobopenings`);
    
    const response = await fetch(`${PROMPTHIRE_API_BASE}/jobopenings`, {
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
