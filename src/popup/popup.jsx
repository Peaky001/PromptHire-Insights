import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './popup.css';

const LinkedInScraperPopup = () => {
  const [profileData, setProfileData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [apiUrl, setApiUrl] = useState('');
  const [isLinkedInPage, setIsLinkedInPage] = useState(false);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [selectedJobOpening, setSelectedJobOpening] = useState('');
  const [isLoadingJobs, setIsLoadingJobs] = useState(false);
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState('');
  const [isLoadingOrganizations, setIsLoadingOrganizations] = useState(false);
  const [rateLimitStatus, setRateLimitStatus] = useState(null);
  const [cooldownTimer, setCooldownTimer] = useState(null);
  
  
  // Editable form fields
  const [editableData, setEditableData] = useState({
    candidate_name: '',
    candidate_email: 'default@example.com',
    candidate_phone: 'N/A',
    experience: '',
    skills: '',
    current_company: '',
    linkedin_profile: '',
    current_location: ''
  });

  useEffect(() => {
    // Check if current tab is LinkedIn profile page
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const currentTab = tabs[0];
      if (currentTab && currentTab.url && 
          (currentTab.url.includes('linkedin.com/in/') || currentTab.url.includes('www.linkedin.com/in/'))) {
        setIsLinkedInPage(true);
      } else {
        setIsLinkedInPage(false);
        setError('Please navigate to a LinkedIn profile page to use this extension.');
      }
    });

    // Load saved API URL, selected job opening, and selected organization
    chrome.storage.sync.get(['apiUrl', 'selectedJobOpening', 'selectedOrganization'], (result) => {
      if (result.apiUrl) {
        setApiUrl(result.apiUrl);
      }
      if (result.selectedJobOpening) {
        setSelectedJobOpening(result.selectedJobOpening);
      }
      if (result.selectedOrganization) {
        setSelectedOrganization(result.selectedOrganization);
        // Fetch job openings after organization is loaded
        fetchJobOpeningsForOrg(result.selectedOrganization);
      }
    });

    // Fetch organizations and rate limit status on component mount
    fetchOrganizations();
    fetchRateLimitStatus();

    // Set up periodic rate limit status refresh
    const interval = setInterval(() => {
      fetchRateLimitStatus();
    }, 10000); // Refresh every 10 seconds

    return () => clearInterval(interval);
  }, []);

  // Function to save selected job opening to Chrome storage
  const saveSelectedJobOpening = (jobId) => {
    chrome.storage.sync.set({ selectedJobOpening: jobId }, () => {
      console.log('Selected job opening saved:', jobId);
    });
  };

  // Function to clear selected job opening from Chrome storage
  const clearSelectedJobOpening = () => {
    chrome.storage.sync.remove(['selectedJobOpening'], () => {
      console.log('Selected job opening cleared');
    });
  };

  // Function to save selected organization to Chrome storage
  const saveSelectedOrganization = (orgId) => {
    chrome.storage.sync.set({ selectedOrganization: orgId }, () => {
      console.log('Selected organization saved:', orgId);
    });
  };

  // Function to clear selected organization from Chrome storage
  const clearSelectedOrganization = () => {
    chrome.storage.sync.remove(['selectedOrganization'], () => {
      console.log('Selected organization cleared');
    });
  };

  // Function to fetch rate limit status
  const fetchRateLimitStatus = async () => {
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'getRateLimitStatus' },
          resolve
        );
      });

      if (response.success) {
        setRateLimitStatus(response.data);
        
        // If in cooldown, start timer
        if (response.data.status === 'cooldown') {
          startCooldownTimer(response.data.cooldownRemaining);
        }
      }
    } catch (err) {
      console.error('Error fetching rate limit status:', err);
    }
  };

  // Function to start cooldown timer
  const startCooldownTimer = (initialSeconds) => {
    let seconds = initialSeconds;
    
    const timer = setInterval(() => {
      seconds--;
      setCooldownTimer(seconds);
      
      if (seconds <= 0) {
        clearInterval(timer);
        setCooldownTimer(null);
        // Refresh rate limit status
        fetchRateLimitStatus();
      }
    }, 1000);
    
    setCooldownTimer(seconds);
  };

  // Function to format time remaining
  const formatTimeRemaining = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const fetchOrganizations = async () => {
    setIsLoadingOrganizations(true);
    setError('');
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            action: 'fetchOrganizations'
          },
          resolve
        );
      });

      console.log('Organizations response:', response);

      if (response.success && response.data) {
        // Handle different response structures
        let orgsList = response.data;
        if (Array.isArray(response.data)) {
          orgsList = response.data;
        } else if (response.data.items) {
          // PromptHire API returns {total, page, page_size, items: [...]}
          orgsList = response.data.items;
        } else if (response.data.organizations) {
          orgsList = response.data.organizations;
        } else if (response.data.data) {
          orgsList = response.data.data;
        }
        
        console.log('Organizations list:', orgsList);
        setOrganizations(orgsList);
        
        if (!orgsList || orgsList.length === 0) {
          setError('No organizations available. The API might be having issues.');
        }
      } else {
        const errorMsg = response.error || 'Failed to fetch organizations';
        console.error('Failed to fetch organizations:', errorMsg);
        setError(`Failed to fetch organizations: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Error fetching organizations:', err);
      setError(`Error fetching organizations: ${err.message}`);
    } finally {
      setIsLoadingOrganizations(false);
    }
  };

  const fetchJobOpeningsForOrg = async (organizationId) => {
    if (!organizationId) {
      setJobOpenings([]);
      setSelectedJobOpening('');
      clearSelectedJobOpening();
      return;
    }

    setIsLoadingJobs(true);
    setError('');
    try {
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            action: 'fetchJobOpenings',
            organizationId: organizationId
          },
          resolve
        );
      });

      console.log('Job openings response:', response);

      if (response.success && response.data) {
        // Handle different response structures
        let jobsList = response.data;
        if (Array.isArray(response.data)) {
          jobsList = response.data;
        } else if (response.data.items) {
          // PromptHire API returns {total, page, page_size, items: [...]}
          jobsList = response.data.items;
        } else if (response.data.jobs) {
          jobsList = response.data.jobs;
        } else if (response.data.data) {
          jobsList = response.data.data;
        }
        
        console.log('Jobs list:', jobsList);
        setJobOpenings(jobsList);
        
        if (!jobsList || jobsList.length === 0) {
          setError('No job openings available. The API might be having issues.');
        }
      } else {
        const errorMsg = response.error || 'Failed to fetch job openings';
        console.error('Failed to fetch job openings:', errorMsg);
        setError(`Failed to fetch job openings: ${errorMsg}`);
      }
    } catch (err) {
      console.error('Error fetching job openings:', err);
      setError(`Error fetching job openings: ${err.message}`);
    } finally {
      setIsLoadingJobs(false);
    }
  };

  const fetchJobOpenings = async () => {
    await fetchJobOpeningsForOrg(selectedOrganization);
  };

  const handleScrape = async () => {
    setIsLoading(true);
    setError('');
    setSuccess('');
    setProfileData(null);

    try {
      // Send message to content script to scrape profile
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { action: 'scrapeProfile' },
          resolve
        );
      });

      if (response.success) {
        setProfileData(response.data);
        
        // Populate editable fields with scraped data
        const data = response.data;
        setEditableData({
          candidate_name: data.name || data.geminiExtracted?.name || data.basicInfo?.name || '',
          candidate_email: 'default@example.com', // Keep default
          candidate_phone: 'N/A', // Default value
          experience: data.totalExperience || data.geminiExtracted?.totalExperience || data.basicInfo?.totalExperience || '',
          skills: Array.isArray(data.skills) ? data.skills.join(', ') : (data.geminiExtracted?.skills ? data.geminiExtracted.skills.join(', ') : ''),
          current_company: data.currentCompany || data.geminiExtracted?.currentCompany || data.basicInfo?.currentCompany || '',
          linkedin_profile: data.profileLink || data.geminiExtracted?.profileLink || data.basicInfo?.profileUrl || data.profileUrl || '',
          current_location: data.location || data.geminiExtracted?.location || data.basicInfo?.location || ''
        });
        
        setSuccess('Profile scraped successfully!');
        
        // Refresh rate limit status after successful scraping
        fetchRateLimitStatus();
      } else {
        setError(response.error || 'Failed to scrape profile');
        
        // If it's a rate limit error, update the rate limit status
        if (response.rateLimit) {
          setRateLimitStatus(response.rateLimit);
          if (response.rateLimit.status === 'cooldown') {
            startCooldownTimer(response.rateLimit.cooldownRemaining);
          }
        }
      }
    } catch (err) {
      setError('Error communicating with content script: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendToAPI = async () => {
    if (!profileData) {
      setError('No profile data to send. Please scrape a profile first.');
      return;
    }

    if (!selectedJobOpening) {
      setError('Please select a job opening from the dropdown.');
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      // Prepare applicant data from editable fields
      const applicantData = {
        job_opening_id: selectedJobOpening,
        candidate_name: editableData.candidate_name || 'N/A',
        candidate_email: editableData.candidate_email,
        candidate_phone: editableData.candidate_phone,
        experience: editableData.experience || null,
        skills: editableData.skills ? editableData.skills.split(',').map(s => s.trim()).filter(s => s) : [],
        current_company: editableData.current_company || 'N/A',
        linkedin_profile: editableData.linkedin_profile || null,
        current_location: editableData.current_location || 'N/A',
        notable_company: [], // Required field - empty array
        source: 'Linkedin' // Default source value
      };

      console.log('Sending applicant data:', applicantData);

      // Send data to API via background script
      const response = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
          { 
            action: 'sendApplicant', 
            data: applicantData
          },
          resolve
        );
      });

      console.log('Send applicant response:', response);

      if (response.success) {
        setSuccess('Applicant added successfully!');
        // Keep job selection persistent until extension is closed
      } else {
        setError(response.error || 'Failed to add applicant');
      }
    } catch (err) {
      console.error('Error sending applicant:', err);
      setError('Error sending data to API: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Rate limit status display component
  const RateLimitStatus = () => {
    if (!rateLimitStatus) return null;

    if (rateLimitStatus.status === 'cooldown') {
      const timeRemaining = cooldownTimer !== null ? cooldownTimer : rateLimitStatus.cooldownRemaining;
      return (
        <div className="rate-limit-status cooldown">
          <div className="status-icon">⏰</div>
          <div className="status-content">
            <div className="status-title">Rate Limit Exceeded</div>
            <div className="status-message">
              Please wait {formatTimeRemaining(timeRemaining)} before scraping again
            </div>
          </div>
        </div>
      );
    }

    if (rateLimitStatus.status === 'active') {
      const windowRemaining = Math.max(0, Math.ceil(rateLimitStatus.windowRemaining / 60));
      return (
        <div className="rate-limit-status active">
          <div className="status-icon">📊</div>
          <div className="status-content">
            <div className="status-title">Rate Limit Status</div>
            <div className="status-message">
              {rateLimitStatus.remaining} profiles remaining in next {windowRemaining} minutes
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ 
                  width: `${((rateLimitStatus.maxProfiles - rateLimitStatus.remaining) / rateLimitStatus.maxProfiles) * 100}%` 
                }}
              ></div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  const ProfileDataDisplay = ({ data }) => {
    if (!data) return null;

    return (
      <div className="profile-data">
        <div className="profile-header">
          <h3>📊 Candidate Profile</h3>
          <div className="status-badge">Analysis Complete</div>
        </div>
        
        {/* Basic Information - Only show if not AI enhanced */}
        {!data.geminiEnhanced && (
          <>
            <div className="data-section">
              <strong>Name:</strong> {data.name || 'N/A'}
            </div>
            <div className="data-section">
              <strong>Headline:</strong> {data.headline || 'N/A'}
            </div>
            <div className="data-section">
              <strong>Location:</strong> {data.location || 'N/A'}
            </div>
            {data.currentDesignation && (
              <div className="data-section">
                <strong>Current Designation:</strong> {data.currentDesignation}
              </div>
            )}
            {data.currentCompany && (
              <div className="data-section">
                <strong>Current Company:</strong> {data.currentCompany}
              </div>
            )}
            {data.totalExperience && (
              <div className="data-section">
                <strong>Total Experience:</strong> {data.totalExperience}
              </div>
            )}
            {data.profileUrl && (
              <div className="data-section">
                <strong>Profile Link:</strong> 
                <a href={data.profileUrl} target="_blank" rel="noopener noreferrer" className="profile-link">
                  View Profile
                </a>
              </div>
            )}
          </>
        )}
        {data.connections && (
          <div className="data-section">
            <strong>Connections:</strong> {data.connections}
          </div>
        )}
        {data.followers && (
          <div className="data-section">
            <strong>Followers:</strong> {data.followers}
          </div>
        )}
        {data.about && (
          <div className="data-section">
            <strong>About:</strong> {data.about.length > 100 ? `${data.about.substring(0, 100)}...` : data.about}
          </div>
        )}

        {/* Professional Information */}
        {data.experience && data.experience.length > 0 && (
          <div className="data-section">
            <strong>Experience:</strong> {data.experience.length} positions
          </div>
        )}
        {data.education && data.education.length > 0 && (
          <div className="data-section">
            <strong>Education:</strong> {data.education.length} entries
          </div>
        )}
        {data.skills && data.skills.length > 0 && (
          <div className="data-section">
            <strong>Skills:</strong> {data.skills.length} skills
          </div>
        )}

        {/* Additional Sections */}
        {data.certifications && data.certifications.length > 0 && (
          <div className="data-section">
            <strong>Certifications:</strong> {data.certifications.length} certifications
          </div>
        )}
        {data.volunteerExperience && data.volunteerExperience.length > 0 && (
          <div className="data-section">
            <strong>Volunteer Experience:</strong> {data.volunteerExperience.length} positions
          </div>
        )}
        {data.languages && data.languages.length > 0 && (
          <div className="data-section">
            <strong>Languages:</strong> {data.languages.length} languages
          </div>
        )}
        {data.honorsAwards && data.honorsAwards.length > 0 && (
          <div className="data-section">
            <strong>Honors & Awards:</strong> {data.honorsAwards.length} entries
          </div>
        )}
        {data.publications && data.publications.length > 0 && (
          <div className="data-section">
            <strong>Publications:</strong> {data.publications.length} publications
          </div>
        )}

        {/* Contact Information */}
        {data.contactInfo && Object.keys(data.contactInfo).length > 0 && (
          <div className="data-section">
            <strong>Contact Info:</strong> {Object.keys(data.contactInfo).join(', ')}
          </div>
        )}

        {/* AI Enhanced Data */}
        {data.geminiEnhanced && (
          <>
            {data.geminiExtracted?.name && (
              <div className="data-section ai-enhanced">
                <strong>Name:</strong>
                <span>{data.geminiExtracted.name}</span>
              </div>
            )}
            {data.geminiExtracted?.location && (
              <div className="data-section ai-enhanced">
                <strong>Location:</strong>
                <span>{data.geminiExtracted.location}</span>
              </div>
            )}
            {data.geminiExtracted?.profileLink && (
              <div className="data-section ai-enhanced">
                <strong>Profile Link:</strong>
                <span><a href={data.geminiExtracted.profileLink} target="_blank" rel="noopener noreferrer">View Profile</a></span>
              </div>
            )}
            {data.geminiExtracted?.currentCompany && (
              <div className="data-section ai-enhanced">
                <strong>Current Company:</strong>
                <span>{data.geminiExtracted.currentCompany}</span>
              </div>
            )}
            {data.geminiExtracted?.currentDesignation && (
              <div className="data-section ai-enhanced">
                <strong>Current Designation:</strong>
                <span>{data.geminiExtracted.currentDesignation}</span>
              </div>
            )}
            {data.geminiExtracted?.skills && data.geminiExtracted.skills.length > 0 && (
              <div className="data-section ai-enhanced">
                <strong>Skills:</strong>
                <span>{data.geminiExtracted.skills.join(', ')}</span>
              </div>
            )}
            {data.geminiExtracted?.totalExperience && (
              <div className="data-section ai-enhanced">
                <strong>Total Experience:</strong>
                <span>{data.geminiExtracted.totalExperience}</span>
              </div>
            )}
          </>
        )}

        {/* Metadata */}
        <div className="data-section metadata">
          <strong>Scraped:</strong> {new Date(data.scrapedAt).toLocaleString()}
          {data.scrapingVersion && (
            <span> | <strong>Version:</strong> {data.scrapingVersion}</span>
          )}
          {data.geminiEnhanced && (
            <span> | <strong>AI Enhanced:</strong> ✅</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="popup-container">
      <div className="header">
        <div className="logo">
          <span className="logo-icon">✨</span>
          <h2>PromptHire insights</h2>
        </div>
        <div className="tagline">AI-Powered Hiring Intelligence</div>
      </div>

      {!isLinkedInPage ? (
        <div className="warning">
          <p>⚠️ Please navigate to a LinkedIn profile page (linkedin.com/in/username) to use this extension.</p>
        </div>
      ) : (
        <div className="content">
          <RateLimitStatus />
          
          <div className="section">
            <button 
              className="scrape-btn"
              onClick={handleScrape}
              disabled={isLoading || (rateLimitStatus && rateLimitStatus.status === 'cooldown')}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Analyzing Profile...
                </>
              ) : rateLimitStatus && rateLimitStatus.status === 'cooldown' ? (
                <>
                  <span className="btn-icon">⏰</span>
                  Rate Limited
                </>
              ) : (
                <>
                  <span className="btn-icon">🎯</span>
                  Extract Profile
                </>
              )}
            </button>
          </div>

          {profileData && <ProfileDataDisplay data={profileData} />}

          {profileData && (
            <div className="editable-form">
              <div className="form-header">
                <h3>✏️ Review & Edit Details</h3>
                <p className="form-subtitle">Edit any field before sending to PromptHire</p>
              </div>
              
              <div className="form-group">
                <label htmlFor="candidate_name">Name *</label>
                <input
                  type="text"
                  id="candidate_name"
                  value={editableData.candidate_name}
                  onChange={(e) => setEditableData({...editableData, candidate_name: e.target.value})}
                  placeholder="Enter candidate name"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidate_email">Email (default)</label>
                <input
                  type="email"
                  id="candidate_email"
                  value={editableData.candidate_email}
                  readOnly
                  className="readonly-field"
                  title="Email is set to default value"
                />
              </div>

              <div className="form-group">
                <label htmlFor="candidate_phone">Phone</label>
                <input
                  type="tel"
                  id="candidate_phone"
                  value={editableData.candidate_phone}
                  readOnly
                  className="readonly-field"
                  title="Phone number is set to N/A by default"
                />
              </div>

              <div className="form-group">
                <label htmlFor="experience">Total Experience</label>
                <input
                  type="text"
                  id="experience"
                  value={editableData.experience}
                  onChange={(e) => setEditableData({...editableData, experience: e.target.value})}
                  placeholder="e.g., 5 years"
                />
              </div>

              <div className="form-group">
                <label htmlFor="current_company">Current Company</label>
                <input
                  type="text"
                  id="current_company"
                  value={editableData.current_company}
                  onChange={(e) => setEditableData({...editableData, current_company: e.target.value})}
                  placeholder="Enter current company"
                />
              </div>

              <div className="form-group">
                <label htmlFor="current_location">Location</label>
                <input
                  type="text"
                  id="current_location"
                  value={editableData.current_location}
                  onChange={(e) => setEditableData({...editableData, current_location: e.target.value})}
                  placeholder="Enter location"
                />
              </div>

              <div className="form-group">
                <label htmlFor="linkedin_profile">LinkedIn Profile</label>
                <input
                  type="url"
                  id="linkedin_profile"
                  value={editableData.linkedin_profile}
                  onChange={(e) => setEditableData({...editableData, linkedin_profile: e.target.value})}
                  placeholder="Enter LinkedIn profile URL"
                />
              </div>

              <div className="form-group">
                <label htmlFor="skills">Skills (comma-separated)</label>
                <textarea
                  id="skills"
                  value={editableData.skills}
                  onChange={(e) => setEditableData({...editableData, skills: e.target.value})}
                  placeholder="e.g., JavaScript, React, Node.js"
                  rows="3"
                />
              </div>
            </div>
          )}

          <div className="section">
            <div className="org-section-header">
              <label htmlFor="organization">Select Organization:</label>
              <div className="org-buttons">
                <button 
                  className="refresh-btn"
                  onClick={fetchOrganizations}
                  disabled={isLoadingOrganizations}
                  title="Refresh organizations"
                >
                  🔄 {isLoadingOrganizations ? 'Loading...' : 'Refresh'}
                </button>
                {selectedOrganization && (
                  <button 
                    className="clear-btn"
                    onClick={() => {
                      setSelectedOrganization('');
                      clearSelectedOrganization();
                      // Clear job openings when organization is cleared
                      setJobOpenings([]);
                      setSelectedJobOpening('');
                      clearSelectedJobOpening();
                    }}
                    title="Clear organization selection"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
            {isLoadingOrganizations ? (
              <div className="loading-orgs">
                <span className="spinner-small"></span>
                Loading organizations...
              </div>
            ) : (
              <>
                <select
                  id="organization"
                  value={selectedOrganization}
                  onChange={(e) => {
                    console.log('Selected organization:', e.target.value);
                    setSelectedOrganization(e.target.value);
                    saveSelectedOrganization(e.target.value);
                    // Clear job openings when organization changes
                    setJobOpenings([]);
                    setSelectedJobOpening('');
                    clearSelectedJobOpening();
                    // Fetch job openings for the selected organization
                    if (e.target.value) {
                      fetchJobOpenings();
                    }
                  }}
                  className="org-select"
                  disabled={organizations.length === 0}
                >
                  <option value="">-- Select an Organization --</option>
                  {organizations.map((org) => (
                    <option key={org.id || org._id || org.org_id} value={org.id || org._id || org.org_id}>
                      {org.organization_name || org.name || org.title || 'Untitled Organization'}
                    </option>
                  ))}
                </select>
                {organizations.length === 0 && (
                  <div className="no-orgs-message">
                    ⚠️ No organizations found. Click refresh or check API credentials.
                  </div>
                )}
              </>
            )}
          </div>

          <div className="section">
            <div className="job-section-header">
              <label htmlFor="job-opening">Select Job Opening:</label>
              <div className="job-buttons">
                <button 
                  className="refresh-btn"
                  onClick={fetchJobOpenings}
                  disabled={isLoadingJobs || !selectedOrganization}
                  title={!selectedOrganization ? "Please select an organization first" : "Refresh job openings"}
                >
                  🔄 {isLoadingJobs ? 'Loading...' : 'Refresh'}
                </button>
                {selectedJobOpening && (
                  <button 
                    className="clear-btn"
                    onClick={() => {
                      setSelectedJobOpening('');
                      clearSelectedJobOpening();
                    }}
                    title="Clear job selection"
                  >
                    ✕ Clear
                  </button>
                )}
              </div>
            </div>
            {!selectedOrganization ? (
              <div className="no-org-selected-message">
                ℹ️ Please select an organization first to view job openings.
              </div>
            ) : isLoadingJobs ? (
              <div className="loading-jobs">
                <span className="spinner-small"></span>
                Loading job openings...
              </div>
            ) : (
              <>
                <select
                  id="job-opening"
                  value={selectedJobOpening}
                  onChange={(e) => {
                    console.log('Selected job opening:', e.target.value);
                    setSelectedJobOpening(e.target.value);
                    saveSelectedJobOpening(e.target.value);
                  }}
                  className="job-select"
                  disabled={jobOpenings.length === 0}
                >
                  <option value="">-- Select a Job Opening --</option>
                  {jobOpenings.map((job) => (
                    <option key={job.id || job._id || job.job_id} value={job.id || job._id || job.job_id}>
                      {job.jobopening_name || job.role_name || job.title || job.job_title || job.name || job.position || 'Untitled Job'}
                      {job.department_name && ` - ${job.department_name}`}
                      {job.subdepartment_name && ` (${job.subdepartment_name})`}
                    </option>
                  ))}
                </select>
                {jobOpenings.length === 0 && (
                  <div className="no-jobs-message">
                    ⚠️ No job openings found for this organization. Click refresh or check API credentials.
                  </div>
                )}
              </>
            )}
            <button 
              className="send-btn"
              onClick={handleSendToAPI}
              disabled={isLoading || !profileData || !selectedJobOpening}
              title={!profileData ? 'Please scrape a profile first' : !selectedJobOpening ? 'Please select a job opening' : 'Send applicant to PromptHire'}
            >
              {isLoading ? (
                <>
                  <span className="spinner"></span>
                  Sending to PromptHire...
                </>
              ) : (
                <>
                  <span className="btn-icon">🚀</span>
                  Add to PromptHire
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="message error">
              ❌ {error}
            </div>
          )}

          {success && (
            <div className="message success">
              ✅ {success}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Render the popup
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<LinkedInScraperPopup />);
