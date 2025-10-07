// Content script for scraping LinkedIn profile data
class LinkedInScraper {
  constructor() {
    try {
      console.log('LinkedInScraper constructor starting...');
      this.profileData = {};
      this.geminiApiKey = process.env.GEMINI_API_KEY || '';
      this.cache = new Map(); // Simple cache for scraped data
      this.isScraping = false;
      console.log('Gemini API key loaded:', this.geminiApiKey ? 'Yes' : 'No');
      console.log('Gemini API key length:', this.geminiApiKey ? this.geminiApiKey.length : 0);
      console.log('Gemini API key first 10 chars:', this.geminiApiKey ? this.geminiApiKey.substring(0, 10) : 'N/A');
      this.floatingIcon = null;
      console.log('About to initialize floating icon...');
      this.initFloatingIcon();
      console.log('LinkedInScraper constructor completed successfully');
    } catch (error) {
      console.error('Error in LinkedInScraper constructor:', error);
      throw error;
    }
  }

  // Initialize floating icon
  initFloatingIcon() {
    console.log('Initializing floating icon for URL:', window.location.href);
    // Only show on LinkedIn profile pages
    if (window.location.href.includes('linkedin.com/in/')) {
      console.log('LinkedIn profile page detected, creating floating icon');
      // Add a small delay to ensure page is fully loaded
      setTimeout(() => {
        this.createFloatingIcon();
      }, 1000);
    } else {
      console.log('Not a LinkedIn profile page, skipping floating icon');
    }
  }

  // Create floating icon
  createFloatingIcon() {
    console.log('Creating floating icon...');
    // Remove existing icon if any
    if (this.floatingIcon) {
      this.floatingIcon.remove();
    }

    // Get saved position or use default
    const savedPosition = this.getSavedPosition();
    console.log('Using saved position:', savedPosition);

    // Create icon element
    this.floatingIcon = document.createElement('div');
    this.floatingIcon.id = 'prompthire-floating-icon';
    this.floatingIcon.innerHTML = `
      <div class="prompthire-icon-container">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2L13.09 8.26L20 9L13.09 9.74L12 16L10.91 9.74L4 9L10.91 8.26L12 2Z" fill="currentColor"/>
          <path d="M19 15L19.5 17L21 17.5L19.5 18L19 20L18.5 18L17 17.5L18.5 17L19 15Z" fill="currentColor"/>
          <path d="M5 15L5.5 17L7 17.5L5.5 18L5 20L4.5 18L3 17.5L4.5 17L5 15Z" fill="currentColor"/>
        </svg>
        <span class="prompthire-tooltip">PromptHire Insights</span>
        <div class="prompthire-drag-handle">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 6H6V8H8V6Z" fill="currentColor"/>
            <path d="M8 10H6V12H8V10Z" fill="currentColor"/>
            <path d="M8 14H6V16H8V14Z" fill="currentColor"/>
            <path d="M12 6H10V8H12V6Z" fill="currentColor"/>
            <path d="M12 10H10V12H12V10Z" fill="currentColor"/>
            <path d="M12 14H10V16H12V14Z" fill="currentColor"/>
            <path d="M16 6H14V8H16V6Z" fill="currentColor"/>
            <path d="M16 10H14V12H16V10Z" fill="currentColor"/>
            <path d="M16 14H14V16H16V14Z" fill="currentColor"/>
          </svg>
        </div>
      </div>
    `;

    // Set initial position
    this.floatingIcon.style.left = savedPosition.x + 'px';
    this.floatingIcon.style.top = savedPosition.y + 'px';
    this.floatingIcon.style.right = 'auto';
    this.floatingIcon.style.bottom = 'auto';

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      #prompthire-floating-icon {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 999999;
        cursor: pointer;
        transition: all 0.3s ease;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        user-select: none;
        -webkit-user-select: none;
        -moz-user-select: none;
        -ms-user-select: none;
      }

      #prompthire-floating-icon:hover {
        transform: scale(1.1);
      }

      .prompthire-icon-container {
        position: relative;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 50%;
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        transition: all 0.3s ease;
      }

      .prompthire-icon-container:hover {
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.25);
        transform: translateY(-2px);
      }

      .prompthire-dragging .prompthire-icon-container {
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        transform: scale(1.1);
        opacity: 0.9;
      }

      .prompthire-icon-container svg {
        color: white;
        width: 24px;
        height: 24px;
      }

      .prompthire-tooltip {
        position: absolute;
        right: 60px;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 8px 12px;
        border-radius: 6px;
        font-size: 12px;
        font-weight: 500;
        white-space: nowrap;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
        pointer-events: none;
      }

      .prompthire-tooltip::after {
        content: '';
        position: absolute;
        left: 100%;
        top: 50%;
        transform: translateY(-50%);
        border: 5px solid transparent;
        border-left-color: rgba(0, 0, 0, 0.8);
      }

      #prompthire-floating-icon:hover .prompthire-tooltip {
        opacity: 1;
        visibility: visible;
      }

      .prompthire-drag-handle {
        position: absolute;
        bottom: -2px;
        right: -2px;
        width: 16px;
        height: 16px;
        background: rgba(255, 255, 255, 0.9);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
        transition: all 0.2s ease;
        border: 2px solid #667eea;
      }

      .prompthire-drag-handle:hover {
        background: rgba(255, 255, 255, 1);
        transform: scale(1.1);
      }

      .prompthire-drag-handle:active {
        cursor: grabbing;
        transform: scale(0.95);
      }

      .prompthire-drag-handle svg {
        color: #667eea;
        width: 8px;
        height: 8px;
      }

      /* Responsive adjustments */
      @media (max-width: 768px) {
        #prompthire-floating-icon {
          top: 10px;
          right: 10px;
        }
        
        .prompthire-icon-container {
          width: 40px;
          height: 40px;
        }
        
        .prompthire-icon-container svg {
          width: 20px;
          height: 20px;
        }
      }
    `;

    // Add to page
    document.head.appendChild(style);
    document.body.appendChild(this.floatingIcon);

    // Add debugging
    console.log('Floating icon added to page:', {
      element: this.floatingIcon,
      position: {
        left: this.floatingIcon.style.left,
        top: this.floatingIcon.style.top
      },
      visible: this.floatingIcon.offsetParent !== null
    });

    // Ensure icon is visible with a fallback position
    setTimeout(() => {
      if (!this.floatingIcon.offsetParent) {
        console.log('Icon not visible, applying fallback position');
        this.floatingIcon.style.left = '20px';
        this.floatingIcon.style.top = '20px';
        this.floatingIcon.style.right = 'auto';
        this.floatingIcon.style.bottom = 'auto';
      }
    }, 100);

    // Add click handler
    this.floatingIcon.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.openPopup();
    });

    // Add hover effects
    this.floatingIcon.addEventListener('mouseenter', () => {
      this.floatingIcon.style.transform = 'scale(1.05)';
    });

    this.floatingIcon.addEventListener('mouseleave', () => {
      this.floatingIcon.style.transform = 'scale(1)';
    });

    // Add dragging functionality
    this.makeDraggable();
    
    console.log('Floating icon created and added to page');
  }

  // Get saved position or return default
  getSavedPosition() {
    try {
      // Try to get saved position from localStorage
      const saved = localStorage.getItem('prompthire-icon-position');
      if (saved) {
        const position = JSON.parse(saved);
        return { x: position.x || 20, y: position.y || 20 };
      }
    } catch (error) {
      console.log('Could not load saved position:', error);
    }
    
    // Return default position
    return { x: 20, y: 20 };
  }

  // Save position to localStorage
  savePosition(x, y) {
    try {
      localStorage.setItem('prompthire-icon-position', JSON.stringify({ x, y }));
    } catch (error) {
      console.log('Could not save position:', error);
    }
  }

  // Make the floating icon draggable
  makeDraggable() {
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    // Get the drag handle element
    const dragHandle = this.floatingIcon.querySelector('.prompthire-drag-handle');
    
    if (!dragHandle) {
      console.log('Drag handle not found, making entire icon draggable');
    }

    const dragElement = dragHandle || this.floatingIcon;

    // Mouse down event
    dragElement.addEventListener('mousedown', (e) => {
      // Only start dragging if clicking on the drag handle or if no drag handle exists
      if (dragHandle && e.target !== dragHandle && !dragHandle.contains(e.target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      
      // Get current position from computed styles
      const rect = this.floatingIcon.getBoundingClientRect();
      xOffset = rect.left;
      yOffset = rect.top;
      
      // Get initial mouse position
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;
      
      // Add dragging class for visual feedback
      this.floatingIcon.classList.add('prompthire-dragging');
      
      // Change cursor
      document.body.style.cursor = 'grabbing';
      
      console.log('Started dragging from position:', { x: xOffset, y: yOffset });
    });

    // Mouse move event
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        
        // Calculate new position
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        // Update offsets
        xOffset = currentX;
        yOffset = currentY;
        
        // Constrain to viewport
        const iconRect = this.floatingIcon.getBoundingClientRect();
        const maxX = window.innerWidth - iconRect.width;
        const maxY = window.innerHeight - iconRect.height;
        
        const constrainedX = Math.max(0, Math.min(currentX, maxX));
        const constrainedY = Math.max(0, Math.min(currentY, maxY));
        
        // Apply position
        this.floatingIcon.style.left = constrainedX + 'px';
        this.floatingIcon.style.top = constrainedY + 'px';
        this.floatingIcon.style.right = 'auto';
        this.floatingIcon.style.bottom = 'auto';
      }
    });

    // Mouse up event
    document.addEventListener('mouseup', (e) => {
      if (isDragging) {
        isDragging = false;
        
        // Remove dragging class
        this.floatingIcon.classList.remove('prompthire-dragging');
        
        // Reset cursor
        document.body.style.cursor = 'default';
        
        // Save position
        const finalX = Math.max(0, Math.min(currentX, window.innerWidth - this.floatingIcon.getBoundingClientRect().width));
        const finalY = Math.max(0, Math.min(currentY, window.innerHeight - this.floatingIcon.getBoundingClientRect().height));
        
        this.savePosition(finalX, finalY);
        console.log('Icon position saved:', { x: finalX, y: finalY });
      }
    });

    // Touch events for mobile support
    dragElement.addEventListener('touchstart', (e) => {
      if (dragHandle && e.target !== dragHandle && !dragHandle.contains(e.target)) {
        return;
      }

      e.preventDefault();
      e.stopPropagation();
      
      isDragging = true;
      
      // Get current position from computed styles
      const rect = this.floatingIcon.getBoundingClientRect();
      xOffset = rect.left;
      yOffset = rect.top;
      
      const touch = e.touches[0];
      initialX = touch.clientX - xOffset;
      initialY = touch.clientY - yOffset;
      
      this.floatingIcon.classList.add('prompthire-dragging');
      
      console.log('Started touch dragging from position:', { x: xOffset, y: yOffset });
    });

    document.addEventListener('touchmove', (e) => {
      if (isDragging) {
        e.preventDefault();
        
        const touch = e.touches[0];
        currentX = touch.clientX - initialX;
        currentY = touch.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        
        const iconRect = this.floatingIcon.getBoundingClientRect();
        const maxX = window.innerWidth - iconRect.width;
        const maxY = window.innerHeight - iconRect.height;
        
        const constrainedX = Math.max(0, Math.min(currentX, maxX));
        const constrainedY = Math.max(0, Math.min(currentY, maxY));
        
        this.floatingIcon.style.left = constrainedX + 'px';
        this.floatingIcon.style.top = constrainedY + 'px';
        this.floatingIcon.style.right = 'auto';
        this.floatingIcon.style.bottom = 'auto';
      }
    });

    document.addEventListener('touchend', (e) => {
      if (isDragging) {
        isDragging = false;
        
        this.floatingIcon.classList.remove('prompthire-dragging');
        
        const finalX = Math.max(0, Math.min(currentX, window.innerWidth - this.floatingIcon.getBoundingClientRect().width));
        const finalY = Math.max(0, Math.min(currentY, window.innerHeight - this.floatingIcon.getBoundingClientRect().height));
        
        this.savePosition(finalX, finalY);
        console.log('Icon position saved (touch):', { x: finalX, y: finalY });
      }
    });
  }

  // Open popup programmatically
  openPopup() {
    // Send message to background script to open popup
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }

  // Wait for element to be present (optimized for speed)
  waitForElement(selector, timeout = 2000) {
    return new Promise((resolve, reject) => {
      // Check immediately first
      const element = document.querySelector(selector);
      if (element) {
        resolve(element);
        return;
      }

      // Use requestAnimationFrame for more efficient checking
      let startTime = Date.now();
      const checkElement = () => {
        const element = document.querySelector(selector);
        if (element) {
          resolve(element);
          return;
        }
        
        if (Date.now() - startTime > timeout) {
          reject(new Error(`Element ${selector} not found within ${timeout}ms`));
          return;
        }
        
        requestAnimationFrame(checkElement);
      };
      
      requestAnimationFrame(checkElement);
    });
  }

  // Extract text content safely
  extractText(selector, parent = document) {
    const element = parent.querySelector(selector);
    return element ? element.textContent.trim() : '';
  }

  // Extract attribute safely
  extractAttribute(selector, attribute, parent = document) {
    const element = parent.querySelector(selector);
    return element ? element.getAttribute(attribute) : '';
  }

  // Parse duration text to months
  parseDurationToMonths(durationText) {
    if (!durationText) return 0;
    
    const text = durationText.toLowerCase().trim();
    let totalMonths = 0;
    
    console.log(`Parsing duration: "${durationText}"`);
    
    // Handle "Present" or "Current" - calculate from start date to now
    if (text.includes('present') || text.includes('current')) {
      // Extract start date - try multiple patterns
      const patterns = [
        /(\w+)\s+(\d{4})\s*-\s*(present|current)/i,
        /(\w+)\s+(\d{4})\s*to\s*(present|current)/i,
        /(\w+)\s+(\d{4})\s*–\s*(present|current)/i,
        /(\w+)\s+(\d{4})\s*–\s*(present|current)/i
      ];
      
      for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match) {
          const startMonth = this.getMonthNumber(match[1]);
          const startYear = parseInt(match[2]);
          const now = new Date();
          const currentYear = now.getFullYear();
          const currentMonth = now.getMonth() + 1;
          
          totalMonths = (currentYear - startYear) * 12 + (currentMonth - startMonth);
          console.log(`Current job: ${startMonth}/${startYear} to present = ${totalMonths} months`);
          break;
        }
      }
    } else {
      // Handle date ranges like "Jan 2020 - Dec 2022"
      const rangePatterns = [
        /(\w+)\s+(\d{4})\s*-\s*(\w+)\s+(\d{4})/i,
        /(\w+)\s+(\d{4})\s*to\s*(\w+)\s+(\d{4})/i,
        /(\w+)\s+(\d{4})\s*–\s*(\w+)\s+(\d{4})/i,
        /(\w+)\s+(\d{4})\s*–\s*(\w+)\s+(\d{4})/i
      ];
      
      for (const pattern of rangePatterns) {
        const match = text.match(pattern);
        if (match) {
          const startMonth = this.getMonthNumber(match[1]);
          const startYear = parseInt(match[2]);
          const endMonth = this.getMonthNumber(match[3]);
          const endYear = parseInt(match[4]);
          
          totalMonths = (endYear - startYear) * 12 + (endMonth - startMonth);
          console.log(`Range job: ${startMonth}/${startYear} to ${endMonth}/${endYear} = ${totalMonths} months`);
          break;
        }
      }
      
      // Handle single year like "2020 - 2022"
      if (totalMonths === 0) {
        const yearRangeMatch = text.match(/(\d{4})\s*-\s*(\d{4})/);
        if (yearRangeMatch) {
          const startYear = parseInt(yearRangeMatch[1]);
          const endYear = parseInt(yearRangeMatch[2]);
          totalMonths = (endYear - startYear) * 12;
          console.log(`Year range: ${startYear} to ${endYear} = ${totalMonths} months`);
        }
      }
      
      // Handle single year like "2020"
      if (totalMonths === 0) {
        const singleYearMatch = text.match(/(\d{4})/);
        if (singleYearMatch) {
          const year = parseInt(singleYearMatch[1]);
          const currentYear = new Date().getFullYear();
          if (year <= currentYear) {
            totalMonths = (currentYear - year) * 12;
            console.log(`Single year: ${year} to present = ${totalMonths} months`);
          }
        }
      }
    }
    
    console.log(`Final parsed months: ${totalMonths}`);
    return Math.max(0, totalMonths);
  }

  // Get month number from month name
  getMonthNumber(monthName) {
    const months = {
      'jan': 1, 'january': 1,
      'feb': 2, 'february': 2,
      'mar': 3, 'march': 3,
      'apr': 4, 'april': 4,
      'may': 5,
      'jun': 6, 'june': 6,
      'jul': 7, 'july': 7,
      'aug': 8, 'august': 8,
      'sep': 9, 'september': 9,
      'oct': 10, 'october': 10,
      'nov': 11, 'november': 11,
      'dec': 12, 'december': 12
    };
    return months[monthName.toLowerCase()] || 0;
  }

  // Format total experience in decimal years format
  formatTotalExperience(totalMonths) {
    if (totalMonths < 12) {
      const years = totalMonths / 12;
      const roundedYears = Math.round(years * 10) / 10;
      return `${roundedYears} yrs`;
    }
    
    const totalYears = totalMonths / 12;
    // Round to 1 decimal place for years
    const roundedYears = Math.round(totalYears * 10) / 10;
    
    return `${roundedYears} yrs`;
  }

  // Extract start and end dates from text
  extractDatesFromText(text) {
    const dates = { start: null, end: null };
    const lowerText = text.toLowerCase();
    
    // Handle present/current
    if (lowerText.includes('present') || lowerText.includes('current')) {
      const startMatch = text.match(/(\w+)\s+(\d{4})/i);
      if (startMatch) {
        dates.start = {
          month: this.getMonthNumber(startMatch[1]),
          year: parseInt(startMatch[2])
        };
        dates.end = {
          month: new Date().getMonth() + 1,
          year: new Date().getFullYear()
        };
      }
    } else {
      // Handle date ranges
      const rangeMatch = text.match(/(\w+)\s+(\d{4})\s*[-–]\s*(\w+)\s+(\d{4})/i);
      if (rangeMatch) {
        dates.start = {
          month: this.getMonthNumber(rangeMatch[1]),
          year: parseInt(rangeMatch[2])
        };
        dates.end = {
          month: this.getMonthNumber(rangeMatch[3]),
          year: parseInt(rangeMatch[4])
        };
      } else {
        // Handle single year
        const yearMatch = text.match(/(\d{4})/);
        if (yearMatch) {
          const year = parseInt(yearMatch[1]);
          dates.start = { month: 1, year: year };
          dates.end = { month: 12, year: year };
        }
      }
    }
    
    return dates;
  }

  // Find earliest date from array of date objects
  findEarliestDate(dates) {
    let earliest = null;
    dates.forEach(date => {
      if (date.start && (!earliest || 
          date.start.year < earliest.year || 
          (date.start.year === earliest.year && date.start.month < earliest.month))) {
        earliest = date.start;
      }
    });
    return earliest;
  }

  // Find latest date from array of date objects
  findLatestDate(dates) {
    let latest = null;
    dates.forEach(date => {
      if (date.end && (!latest || 
          date.end.year > latest.year || 
          (date.end.year === latest.year && date.end.month > latest.month))) {
        latest = date.end;
      }
    });
    return latest;
  }

  // Calculate months between two dates
  calculateMonthsBetween(startDate, endDate) {
    return (endDate.year - startDate.year) * 12 + (endDate.month - startDate.month);
  }

  // Calculate total experience including education
  calculateTotalExperienceWithEducation(experienceData, educationData) {
    let totalMonths = 0;
    
    // Calculate experience months
    if (experienceData && experienceData.length > 0) {
      experienceData.forEach(exp => {
        if (exp.duration) {
          const months = this.parseDurationToMonths(exp.duration);
          if (months > 0) {
            totalMonths += months;
          }
        }
      });
    }
    
    // Add education duration (typically 4 years for bachelor's, 2 years for master's, etc.)
    if (educationData && educationData.length > 0) {
      educationData.forEach(edu => {
        if (edu.duration) {
          const educationMonths = this.parseEducationDuration(edu.duration);
          if (educationMonths > 0) {
            totalMonths += educationMonths;
          }
        } else {
          // If no duration found, estimate based on degree type
          const estimatedMonths = this.estimateEducationDuration(edu.degree, edu.field);
          if (estimatedMonths > 0) {
            totalMonths += estimatedMonths;
          }
        }
      });
    }
    
    return totalMonths;
  }

  // Parse education duration to months
  parseEducationDuration(durationText) {
    if (!durationText) return 0;
    
    const text = durationText.toLowerCase().trim();
    let totalMonths = 0;
    
    // Handle year ranges like "2018 - 2022" or "2018-2022"
    const yearRangeMatch = text.match(/(\d{4})\s*[-–]\s*(\d{4})/);
    if (yearRangeMatch) {
      const startYear = parseInt(yearRangeMatch[1]);
      const endYear = parseInt(yearRangeMatch[2]);
      totalMonths = (endYear - startYear) * 12;
    } else {
      // Handle single year like "2022"
      const singleYearMatch = text.match(/(\d{4})/);
      if (singleYearMatch) {
        const year = parseInt(singleYearMatch[1]);
        const currentYear = new Date().getFullYear();
        if (year <= currentYear) {
          // Estimate 4 years for bachelor's degree
          totalMonths = 48; // 4 years
        }
      }
    }
    
    return totalMonths;
  }

  // Estimate education duration based on degree type
  estimateEducationDuration(degree, field) {
    if (!degree) return 0;
    
    const degreeText = degree.toLowerCase();
    
    // Bachelor's degree - typically 4 years
    if (degreeText.includes('bachelor') || degreeText.includes('b.') || 
        degreeText.includes('btech') || degreeText.includes('b.e') ||
        degreeText.includes('bsc') || degreeText.includes('ba') ||
        degreeText.includes('bcom') || degreeText.includes('bca')) {
      return 48; // 4 years
    }
    
    // Master's degree - typically 2 years
    if (degreeText.includes('master') || degreeText.includes('m.') ||
        degreeText.includes('mtech') || degreeText.includes('m.e') ||
        degreeText.includes('msc') || degreeText.includes('ma') ||
        degreeText.includes('mcom') || degreeText.includes('mca') ||
        degreeText.includes('mba')) {
      return 24; // 2 years
    }
    
    // PhD - typically 3-5 years, estimate 4 years
    if (degreeText.includes('phd') || degreeText.includes('doctorate') ||
        degreeText.includes('ph.d') || degreeText.includes('d.') ||
        degreeText.includes('phil')) {
      return 48; // 4 years
    }
    
    // Diploma - typically 2-3 years, estimate 2.5 years
    if (degreeText.includes('diploma') || degreeText.includes('certificate')) {
      return 30; // 2.5 years
    }
    
    // Default estimate for unknown degrees
    return 36; // 3 years
  }

  // Helper function to determine if text is likely a company name
  isLikelyCompanyName(text) {
    if (!text || text.length < 2 || text.length > 100) return false;
    
    // Check for job title indicators
    const jobTitleIndicators = [
      'Developer', 'Manager', 'Engineer', 'Analyst', 'Specialist', 'Coordinator',
      'Director', 'Lead', 'Senior', 'Junior', 'Intern', 'Consultant', 'Architect',
      'Designer', 'Programmer', 'Administrator', 'Executive', 'Officer', 'Associate',
      'Assistant', 'Representative', 'Coordinator', 'Supervisor', 'Technician',
      'Developer at', 'Manager at', 'Engineer at', 'Analyst at', 'Specialist at',
      'Advisor', 'Speaker', 'Educator', 'Storyteller', 'Investor', 'Angel',
      'at ', '@ ', '|', '•', '–', '-', '—', 'followers', 'impressions', 'ex-', 'ex '
    ];
    
    // Check for company indicators
    const companyIndicators = [
      'Inc', 'LLC', 'Corp', 'Ltd', 'Company', 'Technologies', 'Solutions',
      'Systems', 'Services', 'Group', 'Partners', 'Associates', 'Enterprises',
      'Industries', 'International', 'Global', 'Digital', 'Software', 'Tech'
    ];
    
    const lowerText = text.toLowerCase();
    
    // If it contains job title indicators, it's likely not a company
    for (const indicator of jobTitleIndicators) {
      if (lowerText.includes(indicator.toLowerCase())) {
        return false;
      }
    }
    
    // If it contains multiple separators or looks like a description, it's not a company
    const separatorCount = (text.match(/[|•–\-—]/g) || []).length;
    if (separatorCount > 2) return false;
    
    // If it contains numbers with K+ or M+ (like "189K+followers"), it's not a company
    if (text.match(/\d+[KM]\+/)) return false;
    
    // If it contains company indicators, it's likely a company
    for (const indicator of companyIndicators) {
      if (lowerText.includes(indicator.toLowerCase())) {
        return true;
      }
    }
    
    // If it doesn't contain job indicators and is reasonably short, might be a company
    return text.length < 50 && !text.match(/^\d+/) && !text.includes('(') && !text.includes(')');
  }

  // Helper function to determine if text is likely a job title
  isLikelyJobTitle(text) {
    if (!text || text.length < 2 || text.length > 100) return false;
    
    const jobTitleIndicators = [
      'Developer', 'Manager', 'Engineer', 'Analyst', 'Specialist', 'Coordinator',
      'Director', 'Lead', 'Senior', 'Junior', 'Intern', 'Consultant', 'Architect',
      'Designer', 'Programmer', 'Administrator', 'Executive', 'Officer', 'Associate',
      'Assistant', 'Representative', 'Supervisor', 'Technician', 'Coordinator'
    ];
    
    const lowerText = text.toLowerCase();
    
    // If it contains job title indicators, it's likely a job title
    for (const indicator of jobTitleIndicators) {
      if (lowerText.includes(indicator.toLowerCase())) {
        return true;
      }
    }
    
    // If it's short and doesn't look like a company, might be a job title
    return text.length < 50 && !text.match(/^\d+/) && !text.includes('Inc') && !text.includes('LLC');
  }

  // Call Gemini API to enhance and validate scraped data
  async enhanceDataWithGemini(profileData) {
    console.log('Enhancing data with Gemini API...', profileData);
    console.log('Gemini API key check:', {
      hasKey: !!this.geminiApiKey,
      keyLength: this.geminiApiKey ? this.geminiApiKey.length : 0,
      keyStart: this.geminiApiKey ? this.geminiApiKey.substring(0, 10) : 'N/A'
    });
    
    // Check if API key is valid
    if (!this.geminiApiKey || this.geminiApiKey.length < 10) {
      console.error('Invalid Gemini API key:', {
        hasKey: !!this.geminiApiKey,
        keyLength: this.geminiApiKey ? this.geminiApiKey.length : 0
      });
      return profileData;
    }
    
    try {
      // Create a focused prompt with minimal data for faster processing
      const experienceHtml = profileData.experienceRawHtml || '';
      const basicInfo = profileData.basicInfo || {};
      const experience = profileData.experience || [];
      const education = profileData.education || [];
      const skills = profileData.skills || [];
      
      // Create minimal data payload for faster API response
      const minimalData = {
        basicInfo: {
          name: basicInfo.name || basicInfo.fullName,
          location: basicInfo.location,
          profileLink: basicInfo.profileLink
        },
        experience: experience.slice(0, 5), // Limit to first 5 experiences
        education: education.slice(0, 3), // Limit to first 3 education entries
        skills: skills.slice(0, 20) // Limit to first 20 skills
      };
      
      const prompt = `You are a LinkedIn profile analyzer. Extract the following information from this profile data:

      PROFILE DATA:
      ${JSON.stringify(minimalData, null, 2)}

      EXPERIENCE HTML (for accurate parsing):
      ${experienceHtml}

      REQUIRED EXTRACTION:
      1. NAME: Extract the person's full name
      2. LOCATION: Extract the person's current location
      3. PROFILE_LINK: Extract the LinkedIn profile URL
      4. CURRENT COMPANY: Extract the company name from the most recent job/experience (the one with "Present" or current date)
      5. CURRENT DESIGNATION: Extract the job title/position from the most recent job/experience
      6. SKILLS: Extract all relevant skills mentioned in the profile (clean, no duplicates)
      7. TOTAL EXPERIENCE: Calculate total years of professional experience from all jobs (format as decimal like "4.8 yrs")
      8. EDUCATION_QUALIFICATION: Extract education details in the specified format

      IMPORTANT RULES FOR EXPERIENCE PARSING:
      - Use the EXPERIENCE HTML to accurately parse job durations and calculate total experience
      - Look for duration patterns like "5 mos", "10 mos", "1 yr 6 mos", "3 yrs 3 mos"
      - Handle multiple roles at the same company correctly (don't double count)
      - Skip any future dates (dates beyond current date)
      - For date ranges like "Apr 2023 - Sep 2024", calculate the actual months
      - For current jobs with "Present", calculate from start date to current date
      - Sum up all valid experience periods to get total experience

      IMPORTANT RULES:
      - For NAME: Look in basicInfo.name or basicInfo.fullName
      - For LOCATION: Look in basicInfo.location
      - For PROFILE_LINK: Look in basicInfo.profileLink or construct from current URL
      - For CURRENT COMPANY: Look at the experience entry that has "Present" or current date as end date. Company name should be the organization/company name, NOT the job title
      - For CURRENT DESIGNATION: Look at the same experience entry as current company. This should be the job title/position, NOT the company name
      - For SKILLS: Clean the skills array, remove duplicates and non-skill text
      - For TOTAL EXPERIENCE: Parse the experience HTML and calculate total years accurately (format as decimal like "4.8 yrs")
      - For EDUCATION_QUALIFICATION: Extract from education array, format as list of objects with school, degree, field, duration, grade
      - Be very specific and accurate
      - Return null if information is not available
      - Look at the basicInfo object for name, location, profile link
      - Look at the experience array for detailed job information
      - Look at the education array for education details
      - IMPORTANT: Company name and job title are different - company is the organization, designation is the role/position

      Return ONLY a JSON object with these exact keys (no markdown formatting):
      {
        "name": "Full Name or null",
        "location": "City, Country or null",
        "profileLink": "https://linkedin.com/in/username or null",
        "currentCompany": "company name or null",
        "currentDesignation": "job title or null", 
        "skills": ["skill1", "skill2", "skill3"],
        "totalExperience": "4.8 yrs or null",
        "education_qualification": [
          {
            "school": "University Name",
            "degree": "Degree Type",
            "field": "Field of Study",
            "duration": "Duration Text",
            "grade": "Grade/GPA if available"
          }
        ]
      }`;

      // Use only the fastest model with timeout
      const model = 'gemini-2.0-flash'; // Fastest model
      let response = null;
      let lastError = null;

      try {
        console.log(`Trying Gemini model: ${model}`);
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
        
        response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);

        if (!response.ok) {
          console.log(`Model ${model} failed with status: ${response.status}`);
          lastError = response.status;
        } else {
          console.log(`Successfully connected to Gemini model: ${model}`);
        }
      } catch (modelError) {
        console.log(`Model ${model} error:`, modelError);
        lastError = modelError;
      }

      if (!response || !response.ok) {
        console.error('All Gemini models failed. Last error:', lastError);
        console.error('Response status:', response?.status);
        console.error('Response text:', await response?.text());
        return profileData;
      }

      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        console.error('Invalid Gemini response structure:', data);
        return profileData;
      }

      const geminiResponse = data.candidates[0].content.parts[0].text;
      
      console.log('Gemini API response:', geminiResponse);
      console.log('Profile data being sent to Gemini:', {
        basicInfo: profileData.basicInfo || 'No basicInfo',
        experience: profileData.experience || 'No experience',
        skills: profileData.skills || 'No skills',
        education: profileData.education || 'No education'
      });
      
      // Try to parse JSON response
      try {
        // Clean the response - remove markdown code blocks if present
        let cleanedResponse = geminiResponse.trim();
        if (cleanedResponse.startsWith('```json')) {
          cleanedResponse = cleanedResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanedResponse.startsWith('```')) {
          cleanedResponse = cleanedResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        
        console.log('Cleaned Gemini response:', cleanedResponse);
        const enhancedData = JSON.parse(cleanedResponse);
        
        // Merge the enhanced data with original profile data
        const mergedData = {
          ...profileData,
          // Override with Gemini-extracted values if they exist
          name: enhancedData.name || profileData.basicInfo?.name || profileData.basicInfo?.fullName || '',
          location: enhancedData.location || profileData.basicInfo?.location || '',
          profileLink: enhancedData.profileLink || profileData.basicInfo?.profileLink || window.location.href,
          currentCompany: enhancedData.currentCompany || profileData.basicInfo?.currentCompany || '',
          currentDesignation: enhancedData.currentDesignation || profileData.basicInfo?.currentDesignation || '',
          skills: enhancedData.skills || profileData.skills || [],
          totalExperience: enhancedData.totalExperience || profileData.basicInfo?.totalExperience || '',
          education_qualification: enhancedData.education_qualification || profileData.education || [],
          geminiEnhanced: true,
          geminiExtracted: {
            name: enhancedData.name,
            location: enhancedData.location,
            profileLink: enhancedData.profileLink,
            currentCompany: enhancedData.currentCompany,
            currentDesignation: enhancedData.currentDesignation,
            skills: enhancedData.skills,
            totalExperience: enhancedData.totalExperience,
            education_qualification: enhancedData.education_qualification
          }
        };
        
        console.log('Gemini extraction results:', mergedData.geminiExtracted);
        return mergedData;
      } catch (parseError) {
        console.error('Failed to parse Gemini response:', parseError);
        console.log('Raw Gemini response:', geminiResponse);
        return profileData;
      }
    } catch (error) {
      console.error('Gemini API call failed:', error);
      return profileData;
    }
  }

  // Scrape basic profile information
  scrapeBasicInfo() {
    try {
      // Profile name
      const nameSelectors = [
        'h1.text-heading-xlarge',
        '.pv-text-details__left-panel h1',
        '.ph5.pb5 h1',
        'h1[data-anonymize="person-name"]',
        '.pv-top-card--list-bullet h1'
      ];
      
      let name = '';
      for (const selector of nameSelectors) {
        name = this.extractText(selector);
        if (name) break;
      }

      // Profile headline/title
      const headlineSelectors = [
        '.text-body-medium.break-words',
        '.pv-text-details__left-panel .text-body-medium',
        '.ph5.pb5 .text-body-medium',
        '.pv-top-card--list-bullet .text-body-medium',
        '[data-anonymize="headline"]'
      ];

      let headline = '';
      for (const selector of headlineSelectors) {
        headline = this.extractText(selector);
        if (headline) break;
      }

      // Location
      const locationSelectors = [
        '.text-body-small.inline.t-black--light.break-words',
        '.pv-text-details__left-panel .text-body-small',
        '.ph5.pb5 .text-body-small',
        '.pv-top-card--list-bullet .text-body-small',
        '[data-anonymize="location"]'
      ];

      let location = '';
      for (const selector of locationSelectors) {
        const text = this.extractText(selector);
        if (text && !text.includes('followers') && !text.includes('connections') && !text.includes('contact')) {
          location = text;
          break;
        }
      }

      // Profile image
      const profileImageSelectors = [
        '.pv-top-card-profile-picture__image',
        '.profile-photo-edit__preview',
        'img[data-anonymize="headshot-photo"]',
        '.pv-top-card__photo img',
        '.profile-photo img'
      ];

      let profileImage = '';
      for (const selector of profileImageSelectors) {
        profileImage = this.extractAttribute(selector, 'src');
        if (profileImage) break;
      }

      // About/Summary section
      const aboutSelectors = [
        '.pv-about-section .pv-about__summary-text',
        '.pv-about__summary-text',
        '.pv-about-section .break-words',
        '#about .pv-about__summary-text'
      ];

      let about = '';
      for (const selector of aboutSelectors) {
        about = this.extractText(selector);
        if (about) break;
      }

      // Connection count
      const connectionSelectors = [
        '.pv-top-card--list-bullet .t-bold',
        '.pv-top-card__connections .t-bold',
        '.pv-top-card--list-bullet .text-body-small .t-bold'
      ];

      let connections = '';
      for (const selector of connectionSelectors) {
        const text = this.extractText(selector);
        if (text && text.includes('connection')) {
          connections = text;
          break;
        }
      }

      // Follower count
      let followers = '';
      for (const selector of connectionSelectors) {
        const text = this.extractText(selector);
        if (text && text.includes('follower')) {
          followers = text;
          break;
        }
      }

      // Current company and designation from experience section
      let currentCompany = '';
      let currentDesignation = '';
      
      // Try to get current job from experience section
      const experienceSection = document.querySelector('#experience');
      console.log('Experience section found:', !!experienceSection);
      
      if (experienceSection) {
        const firstExperience = experienceSection.parentElement.querySelector('.artdeco-list__item');
        console.log('First experience item found:', !!firstExperience);
        
        if (firstExperience) {
          // Get company name - try multiple approaches with validation
          const companySelectors = [
            '.pv-entity__secondary-title',
            '.pv-entity__company-summary-info h3',
            '.pv-entity__company-name',
            '.t-16.t-black.t-bold',
            '.pv-entity__summary-info .pv-entity__secondary-title',
            '.pv-entity__summary-info h3',
            '.pv-entity__summary-info .t-16.t-black.t-bold',
            '.pv-entity__summary-info-v2 .pv-entity__secondary-title',
            '.pv-entity__summary-info-v2 h3',
            // Additional modern selectors
            '.t-14.t-normal.t-black--light',
            '.pvs-entity__caption-wrapper .t-14.t-normal.t-black--light',
            '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
            '.pvs-entity__sub-components .t-14.t-normal.t-black--light'
          ];
          
          for (const selector of companySelectors) {
            const text = this.extractText(selector, firstExperience);
            console.log(`Trying company selector ${selector}:`, text);
            if (text && this.isLikelyCompanyName(text)) {
              currentCompany = text;
              console.log(`Found valid company: ${currentCompany}`);
              break;
            }
          }
          
          // Get job title/designation - try multiple approaches with validation
          const designationSelectors = [
            '.pv-entity__summary-info h3',
            '.pv-entity__summary-info .t-16.t-black.t-bold',
            '.pv-entity__summary-info-v2 h3',
            '.t-16.t-black.t-bold',
            '.pv-entity__summary-info .pv-entity__summary-info h3',
            '.pv-entity__summary-info .pv-entity__summary-info .t-16.t-black.t-bold',
            '.pv-entity__summary-info .pv-entity__summary-info-v2 h3',
            // Additional modern selectors
            '.pvs-entity__path-node',
            'div[data-field="experience_position_title"]',
            '.mr1.t-bold span[aria-hidden="true"]',
            '.hoverable-link-text.t-bold',
            'a[data-field="experience_position_title"] span[aria-hidden="true"]'
          ];
          
          for (const selector of designationSelectors) {
            const text = this.extractText(selector, firstExperience);
            console.log(`Trying designation selector ${selector}:`, text);
            if (text && text !== currentCompany && this.isLikelyJobTitle(text)) {
              currentDesignation = text;
              console.log(`Found valid designation: ${currentDesignation}`);
              break;
            }
          }
        }
      }

      // Fallback: try to extract from headline if it contains company info
      if (!currentCompany && headline) {
        // Look for patterns like "Job Title at Company" or "Job Title @ Company"
        const headlineMatch = headline.match(/(.+?)\s+(?:at|@)\s+(.+)/i);
        if (headlineMatch) {
          const potentialDesignation = headlineMatch[1].trim();
          const potentialCompany = headlineMatch[2].trim();
          
          // Only use if both look valid
          if (this.isLikelyJobTitle(potentialDesignation) && this.isLikelyCompanyName(potentialCompany)) {
            currentDesignation = potentialDesignation;
            currentCompany = potentialCompany;
            console.log(`Fallback: Found company from headline: ${currentCompany}`);
          }
        }
      }

      // Calculate total experience from all experience entries
      let totalExperience = '';
      if (experienceSection) {
        const allExperiences = experienceSection.parentElement.querySelectorAll('.artdeco-list__item');
        let totalMonths = 0;
        let hasValidExperience = false;

        console.log(`Found ${allExperiences.length} experience entries`);

        allExperiences.forEach((expItem, index) => {
          // Try multiple selectors for duration
          const durationSelectors = [
            '.pv-entity__dates',
            '.t-14.t-black--light.t-normal',
            '.pv-entity__bullet-item-v2',
            '.pv-entity__summary-info .t-14.t-black--light',
            '.pv-entity__summary-info .t-14.t-black--light.t-normal',
            '.pv-entity__summary-info .pv-entity__dates',
            '.pv-entity__summary-info-v2 .t-14.t-black--light',
            '.pv-entity__summary-info-v2 .pv-entity__dates'
          ];

          let durationText = '';
          for (const selector of durationSelectors) {
            durationText = this.extractText(selector, expItem);
            if (durationText) break;
          }
          
          console.log(`Experience ${index + 1} duration text:`, durationText);
          
          if (durationText) {
            const months = this.parseDurationToMonths(durationText);
            console.log(`Experience ${index + 1} parsed months:`, months);
            if (months > 0) {
              totalMonths += months;
              hasValidExperience = true;
            }
          }
        });

        console.log(`Total calculated months: ${totalMonths}`);

        // If individual parsing failed, try to calculate from earliest to latest date
        if (totalMonths === 0 && allExperiences.length > 0) {
          console.log('Trying fallback calculation from earliest to latest dates...');
          const allDates = [];
          
          allExperiences.forEach((expItem, index) => {
            const durationSelectors = [
              '.pv-entity__dates',
              '.t-14.t-black--light.t-normal',
              '.pv-entity__bullet-item-v2',
              '.pv-entity__summary-info .t-14.t-black--light',
              '.pv-entity__summary-info .t-14.t-black--light.t-normal',
              '.pv-entity__summary-info .pv-entity__dates',
              '.pv-entity__summary-info-v2 .t-14.t-black--light',
              '.pv-entity__summary-info-v2 .pv-entity__dates'
            ];

            let durationText = '';
            for (const selector of durationSelectors) {
              durationText = this.extractText(selector, expItem);
              if (durationText) break;
            }
            
            if (durationText) {
              const dates = this.extractDatesFromText(durationText);
              if (dates.start || dates.end) {
                allDates.push(dates);
                console.log(`Experience ${index + 1} extracted dates:`, dates);
              }
            }
          });
          
          if (allDates.length > 0) {
            const earliestDate = this.findEarliestDate(allDates);
            const latestDate = this.findLatestDate(allDates);
            
            if (earliestDate && latestDate) {
              totalMonths = this.calculateMonthsBetween(earliestDate, latestDate);
              console.log(`Fallback calculation: ${earliestDate.month}/${earliestDate.year} to ${latestDate.month}/${latestDate.year} = ${totalMonths} months`);
            }
          }
        }

        if (totalMonths > 0) {
          totalExperience = this.formatTotalExperience(totalMonths);
        }
      }
      console.log('Total experience calculated:', totalExperience);

      // Ensure profile URL is captured
      const profileUrl = window.location.href;

      return {
        name,
        headline,
        location,
        profileImage,
        about,
        connections,
        followers,
        currentCompany,
        currentDesignation,
        totalExperience,
        profileUrl
      };
    } catch (error) {
      console.error('Error scraping basic info:', error);
      return {};
    }
  }

  // Scrape experience section
  scrapeExperience() {
    try {
      const experiences = [];
      
      // Try multiple selectors for experience section
      const experienceSectionSelectors = [
        '#experience',
        'section[data-section="experience"]',
        '[data-view-name="profile-experience"]',
        'section:has(#experience)',
        '.pv-profile-section.experience-section'
      ];
      
      let experienceSection = null;
      for (const selector of experienceSectionSelectors) {
        experienceSection = document.querySelector(selector);
        if (experienceSection) {
          console.log(`Found experience section using selector: ${selector}`);
          break;
        }
      }
      
      if (!experienceSection) {
        console.log('No experience section found with any selector');
        return { experiences: [], rawHtml: '' };
      }

      // Extract raw HTML for Gemini parsing
      const rawHtml = experienceSection.outerHTML;
      console.log('Extracted experience HTML for Gemini parsing');
      
      // Store raw HTML for Gemini processing
      this.experienceRawHtml = rawHtml;

      // Try multiple selectors for experience items
      const experienceItemSelectors = [
        '.artdeco-list__item',
        '.pvs-list__item--line-separated',
        '.experience-item',
        'div[data-view-name="profile-component-entity"]',
        '.pv-entity__position-group-pager li'
      ];
      
      let experienceItems = [];
      for (const selector of experienceItemSelectors) {
        experienceItems = experienceSection.parentElement.querySelectorAll(selector);
        if (experienceItems.length > 0) {
          console.log(`Found ${experienceItems.length} experience items using selector: ${selector}`);
          break;
        }
      }
      
      if (experienceItems.length === 0) {
        console.log('No experience items found');
        return experiences;
      }
      
      experienceItems.forEach((item, index) => {
        console.log(`Processing experience item ${index + 1}`);
        
        // First, let's try to find the main text elements and analyze their structure
        console.log(`Analyzing experience item ${index + 1} structure:`);
        const allTextElements = item.querySelectorAll('*');
        const textMap = {};
        allTextElements.forEach(el => {
          const text = el.textContent?.trim();
          if (text && text.length > 1 && text.length < 200) {
            const className = el.className || 'no-class';
            textMap[className] = text;
            console.log(`Element with class "${className}":`, text);
          }
        });

        // Company name - try to find the company by looking for specific patterns
        let company = '';
        const companyPatterns = [
          // Look for elements that typically contain company names
          '.pv-entity__secondary-title',
          '.pv-entity__company-summary-info h3',
          '.pv-entity__company-name',
          'a[data-field="experience_company_logo"] span[aria-hidden="true"]',
          // Look for text that's not a job title
          '.t-14.t-normal.t-black--light',
          '.pvs-entity__caption-wrapper .t-14.t-normal.t-black--light',
          '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
          '.pvs-entity__sub-components .t-14.t-normal.t-black--light'
        ];
        
        for (const selector of companyPatterns) {
          const text = this.extractText(selector, item);
          console.log(`Trying company selector ${selector}:`, text);
          if (text && this.isLikelyCompanyName(text)) {
            company = text;
            console.log(`Found company: ${company}`);
            break;
          }
        }
        
        // Position/Job title - look for job title patterns
        let position = '';
        const positionPatterns = [
          '.pv-entity__summary-info h3',
          '.pv-entity__summary-info .t-16.t-black.t-bold',
          '.pv-entity__summary-info-v2 h3',
          '.pvs-entity__path-node',
          'div[data-field="experience_position_title"]',
          '.mr1.t-bold span[aria-hidden="true"]',
          '.hoverable-link-text.t-bold',
          'a[data-field="experience_position_title"] span[aria-hidden="true"]',
          '.t-16.t-black.t-bold'
        ];
        
        for (const selector of positionPatterns) {
          const text = this.extractText(selector, item);
          console.log(`Trying position selector ${selector}:`, text);
          if (text && text !== company && this.isLikelyJobTitle(text)) {
            position = text;
            console.log(`Found position: ${position}`);
            break;
          }
        }
        
        // Duration/Employment period - updated selectors
        const durationSelectors = [
          '.pv-entity__bullet-item-v2',
          '.t-14.t-black--light .t-14.t-black--light',
          '.pv-entity__dates',
          '.pv-entity__summary-info .t-14.t-black--light',
          '.pvs-entity__caption-wrapper .t-14.t-normal.t-black--light',
          '.t-14.t-normal.t-black--light span[aria-hidden="true"]',
          '.pvs-entity__sub-components .t-14.t-normal.t-black--light'
        ];
        
        let duration = '';
        for (const selector of durationSelectors) {
          duration = this.extractText(selector, item);
          console.log(`Trying duration selector ${selector}:`, duration);
          if (duration && duration.length > 1) break;
        }
        
        // Job description
        const descriptionSelectors = [
          '.pv-entity__extra-info',
          '.pv-entity__description',
          '.pv-entity__summary-info .pv-entity__extra-info',
          '.pv-entity__summary-info .break-words'
        ];
        
        let description = '';
        for (const selector of descriptionSelectors) {
          description = this.extractText(selector, item);
          if (description) break;
        }

        // Employment type (Full-time, Part-time, etc.)
        const employmentTypeSelectors = [
          '.pv-entity__employment-type',
          '.pv-entity__summary-info .t-14.t-black--light'
        ];
        
        let employmentType = '';
        for (const selector of employmentTypeSelectors) {
          const text = this.extractText(selector, item);
          if (text && (text.includes('Full-time') || text.includes('Part-time') || text.includes('Contract'))) {
            employmentType = text;
            break;
          }
        }

        // Location of the job
        const jobLocationSelectors = [
          '.pv-entity__location',
          '.pv-entity__summary-info .t-14.t-black--light'
        ];
        
        let jobLocation = '';
        for (const selector of jobLocationSelectors) {
          const text = this.extractText(selector, item);
          if (text && text !== duration && text !== employmentType && text.length > 0) {
            jobLocation = text;
            break;
          }
        }

        if (company || position) {
          experiences.push({
            company: company || 'N/A',
            position: position || 'N/A',
            duration: duration || 'N/A',
            description: description || '',
            employmentType: employmentType || '',
            location: jobLocation || '',
            isCurrent: duration && duration.toLowerCase().includes('present')
          });
        }
      });

      return { experiences, rawHtml };
    } catch (error) {
      console.error('Error scraping experience:', error);
      return { experiences: [], rawHtml: '' };
    }
  }

  // Scrape education section
  scrapeEducation() {
    try {
      const education = [];
      const educationSection = document.querySelector('#education');
      
      console.log('Education section found:', !!educationSection);
      console.log('Education section element:', educationSection);
      
      if (!educationSection) {
        console.log('Education section not found, trying alternative selectors...');
        // Try alternative selectors for education section
        const altEducationSection = document.querySelector('[data-section="education"]') || 
                                   document.querySelector('.education-section') ||
                                   document.querySelector('section[aria-labelledby*="education"]');
        console.log('Alternative education section found:', !!altEducationSection);
        if (!altEducationSection) return education;
      }

      const educationItems = educationSection ? 
        educationSection.parentElement.querySelectorAll('.artdeco-list__item') :
        document.querySelectorAll('.artdeco-list__item');
      
      console.log('Education items found:', educationItems.length);
      
      // If no items found with standard selectors, try broader search
      if (educationItems.length === 0) {
        console.log('No education items found with standard selectors, trying broader search...');
        const allSections = document.querySelectorAll('section');
        console.log('Total sections found:', allSections.length);
        
        allSections.forEach((section, index) => {
          const sectionText = section.textContent.toLowerCase();
          if (sectionText.includes('education') || sectionText.includes('university') || sectionText.includes('college')) {
            console.log(`Section ${index} might contain education:`, sectionText.substring(0, 100));
            const items = section.querySelectorAll('.artdeco-list__item, .pvs-list__item, .experience-item');
            console.log(`Items in section ${index}:`, items.length);
            
            // Try to process these items as education
            items.forEach((item, itemIndex) => {
              console.log(`Processing potential education item ${itemIndex} from section ${index}:`, item);
              this.processEducationItem(item, education);
            });
          }
        });
        
        // If still no education found, try searching for any text that looks like education
        if (education.length === 0) {
          console.log('Still no education found, trying text-based search...');
          this.searchEducationByText(education);
        }
      }
      
      educationItems.forEach((item, index) => {
        console.log(`Processing education item ${index}:`, item);
        this.processEducationItem(item, education);
      });

      console.log('Final education data:', education);
      return education;
    } catch (error) {
      console.error('Error scraping education:', error);
      return [];
    }
  }

  // Helper method to process individual education items
  processEducationItem(item, education) {
    try {
      // School/University name
      const schoolSelectors = [
          '.pv-entity__school-name',
          '.t-16.t-black.t-bold',
          '.pv-entity__summary-info h3',
          '.pv-entity__school-name .t-16.t-black.t-bold',
          '.pvs-entity__school-name',
          '.pvs-entity__summary-info h3',
          '.t-16.t-black.t-bold',
          '.t-18.t-black.t-bold',
          'h3.t-16.t-black.t-bold',
          '.pvs-list__item h3',
          '.experience-item h3'
        ];
        
        let school = '';
        for (const selector of schoolSelectors) {
          school = this.extractText(selector, item);
          if (school) {
            console.log(`Found school with selector ${selector}:`, school);
            break;
          }
        }
        
        // Degree
        const degreeSelectors = [
          '.pv-entity__degree-name',
          '.t-14.t-black--light',
          '.pv-entity__summary-info .t-14.t-black--light',
          '.pv-entity__degree-name .t-14.t-black--light',
          '.pvs-entity__degree-name',
          '.pvs-entity__summary-info .t-14.t-black--light',
          '.t-14.t-black--light.t-normal',
          '.pvs-list__item .t-14.t-black--light',
          '.experience-item .t-14.t-black--light'
        ];
        
        let degree = '';
        for (const selector of degreeSelectors) {
          degree = this.extractText(selector, item);
          if (degree) {
            console.log(`Found degree with selector ${selector}:`, degree);
            break;
          }
        }
        
        // Field of study
        const fieldSelectors = [
          '.pv-entity__fos',
          '.pv-entity__summary-info .t-14.t-black--light',
          '.pv-entity__degree-name + .t-14.t-black--light'
        ];
        
        let field = '';
        for (const selector of fieldSelectors) {
          field = this.extractText(selector, item);
          if (field && field !== degree) break;
        }
        
        // Duration
        const durationSelectors = [
          '.pv-entity__dates',
          '.t-14.t-black--light.t-normal',
          '.pv-entity__summary-info .t-14.t-black--light.t-normal'
        ];
        
        let duration = '';
        for (const selector of durationSelectors) {
          duration = this.extractText(selector, item);
          if (duration) break;
        }

        // Grade/GPA
        const gradeSelectors = [
          '.pv-entity__grade',
          '.pv-entity__summary-info .t-14.t-black--light'
        ];
        
        let grade = '';
        for (const selector of gradeSelectors) {
          const text = this.extractText(selector, item);
          if (text && (text.includes('GPA') || text.includes('Grade') || text.includes('%'))) {
            grade = text;
            break;
          }
        }

        if (school) {
          const educationEntry = {
            school,
            degree: degree || 'N/A',
            field: field || '',
            duration: duration || 'N/A',
            grade: grade || ''
          };
          console.log('Adding education entry:', educationEntry);
          education.push(educationEntry);
        } else {
          console.log('No school found for education item, skipping');
        }
      } catch (error) {
        console.error('Error processing education item:', error);
      }
    }

    // Helper method to search for education by text content
    searchEducationByText(education) {
      try {
        console.log('Searching for education by text content...');
        const allText = document.body.textContent;
        const educationKeywords = ['university', 'college', 'bachelor', 'master', 'phd', 'degree', 'graduated', 'studied'];
        
        // Look for patterns that might indicate education
        const lines = allText.split('\n');
        let currentEducation = null;
        
        lines.forEach(line => {
          const lowerLine = line.toLowerCase().trim();
          if (lowerLine.length > 10 && lowerLine.length < 200) {
            // Check if this line contains education keywords
            const hasEducationKeyword = educationKeywords.some(keyword => lowerLine.includes(keyword));
            
            if (hasEducationKeyword && !currentEducation) {
              // Start of potential education entry
              currentEducation = {
                school: line.trim(),
                degree: 'N/A',
                field: '',
                duration: 'N/A',
                grade: ''
              };
            } else if (currentEducation && (lowerLine.includes('degree') || lowerLine.includes('bachelor') || lowerLine.includes('master'))) {
              // This might be the degree
              currentEducation.degree = line.trim();
            } else if (currentEducation && (lowerLine.includes('20') && lowerLine.length < 50)) {
              // This might be the duration
              currentEducation.duration = line.trim();
              // Finish this education entry
              education.push(currentEducation);
              console.log('Added education from text search:', currentEducation);
              currentEducation = null;
            }
          }
        });
        
        // Add any remaining education entry
        if (currentEducation) {
          education.push(currentEducation);
          console.log('Added final education from text search:', currentEducation);
        }
      } catch (error) {
        console.error('Error in text-based education search:', error);
      }
    }

  // Scrape skills section
  scrapeSkills() {
    try {
      const skills = [];
      
      // Try multiple selectors for skills section
      const skillsSectionSelectors = [
        '#skills',
        'section[data-section="skills"]',
        '[data-view-name="profile-skills"]',
        'section:has(#skills)',
        '.pv-profile-section.skills-section'
      ];
      
      let skillsSection = null;
      for (const selector of skillsSectionSelectors) {
        skillsSection = document.querySelector(selector);
        if (skillsSection) {
          console.log(`Found skills section using selector: ${selector}`);
          break;
        }
      }
      
      if (!skillsSection) {
        console.log('No skills section found');
        return skills;
      }

      // Get all skill items with different selectors - updated for modern LinkedIn
      const skillSelectors = [
        '.pv-skill-category-entity__name',
        '.pv-skill-category-entity__name-text',
        '.pv-skill-category-entity .t-16.t-black.t-bold',
        '.pv-skill-category-entity .pv-skill-category-entity__name',
        '.pvs-entity__path-node',
        'span[aria-hidden="true"]',
        '.mr1.hoverable-link-text.t-bold',
        '.t-bold span[aria-hidden="true"]',
        'a[data-field="skill_card_skill_topic"] span[aria-hidden="true"]'
      ];

      console.log('Scraping skills...');
      skillSelectors.forEach(selector => {
        const skillItems = skillsSection.parentElement.querySelectorAll(selector);
        console.log(`Found ${skillItems.length} skill items with selector: ${selector}`);
        skillItems.forEach((item, index) => {
          const skill = item.textContent.trim();
          console.log(`Skill ${index + 1} with selector ${selector}:`, skill);
          
          // Filter out non-skill text
          if (skill && 
              skill.length > 1 && 
              skill.length < 50 && // Not too long
              !skill.includes('experiences across') && // Remove endorsement text
              !skill.includes('Endorsed by') && // Remove endorsement text
              !skill.includes('endorsement') && // Remove endorsement text
              !skill.includes('at ') && // Remove job titles
              !skill.includes('Developer at') && // Remove job titles
              !skill.includes('Skills') && // Remove section headers
              !skill.match(/^\d+$/) && // Remove pure numbers
              !skills.includes(skill)) {
            skills.push(skill);
          }
        });
      });

      // Remove duplicates and clean up
      const uniqueSkills = [...new Set(skills)];
      console.log(`Total skills found: ${uniqueSkills.length}`, uniqueSkills);
      return uniqueSkills;
    } catch (error) {
      console.error('Error scraping skills:', error);
      return [];
    }
  }

  // Scrape certifications section
  scrapeCertifications() {
    try {
      const certifications = [];
      const certSection = document.querySelector('#licenses_and_certifications');
      
      if (!certSection) return certifications;

      const certItems = certSection.parentElement.querySelectorAll('.artdeco-list__item');
      
      certItems.forEach(item => {
        const name = this.extractText('.pv-entity__summary-info h3', item) || 
                    this.extractText('.t-16.t-black.t-bold', item);
        
        const issuer = this.extractText('.pv-entity__secondary-title', item) || 
                      this.extractText('.t-14.t-black--light', item);
        
        const issueDate = this.extractText('.pv-entity__dates', item) || 
                         this.extractText('.t-14.t-black--light.t-normal', item);
        
        const credentialId = this.extractText('.pv-entity__credential-id', item);

        if (name) {
          certifications.push({
            name: name || 'N/A',
            issuer: issuer || 'N/A',
            issueDate: issueDate || 'N/A',
            credentialId: credentialId || ''
          });
        }
      });

      return certifications;
    } catch (error) {
      console.error('Error scraping certifications:', error);
      return [];
    }
  }

  // Scrape volunteer experience
  scrapeVolunteerExperience() {
    try {
      const volunteer = [];
      const volunteerSection = document.querySelector('#volunteer_experience');
      
      if (!volunteerSection) return volunteer;

      const volunteerItems = volunteerSection.parentElement.querySelectorAll('.artdeco-list__item');
      
      volunteerItems.forEach(item => {
        const organization = this.extractText('.pv-entity__secondary-title', item) || 
                           this.extractText('.t-16.t-black.t-bold', item);
        
        const role = this.extractText('.pv-entity__summary-info h3', item) || 
                    this.extractText('.t-16.t-black.t-bold', item);
        
        const duration = this.extractText('.pv-entity__dates', item) || 
                        this.extractText('.t-14.t-black--light.t-normal', item);
        
        const description = this.extractText('.pv-entity__extra-info', item) || 
                           this.extractText('.pv-entity__description', item);

        if (organization || role) {
          volunteer.push({
            organization: organization || 'N/A',
            role: role || 'N/A',
            duration: duration || 'N/A',
            description: description || ''
          });
        }
      });

      return volunteer;
    } catch (error) {
      console.error('Error scraping volunteer experience:', error);
      return [];
    }
  }

  // Scrape languages
  scrapeLanguages() {
    try {
      const languages = [];
      const languageSection = document.querySelector('#languages');
      
      if (!languageSection) return languages;

      const languageItems = languageSection.parentElement.querySelectorAll('.artdeco-list__item');
      
      languageItems.forEach(item => {
        const language = this.extractText('.pv-entity__summary-info h3', item) || 
                        this.extractText('.t-16.t-black.t-bold', item);
        
        const proficiency = this.extractText('.pv-entity__summary-info .t-14.t-black--light', item);

        if (language) {
          languages.push({
            language: language || 'N/A',
            proficiency: proficiency || 'N/A'
          });
        }
      });

      return languages;
    } catch (error) {
      console.error('Error scraping languages:', error);
      return [];
    }
  }

  // Scrape honors and awards
  scrapeHonorsAwards() {
    try {
      const honors = [];
      const honorsSection = document.querySelector('#honors_and_awards');
      
      if (!honorsSection) return honors;

      const honorItems = honorsSection.parentElement.querySelectorAll('.artdeco-list__item');
      
      honorItems.forEach(item => {
        const title = this.extractText('.pv-entity__summary-info h3', item) || 
                     this.extractText('.t-16.t-black.t-bold', item);
        
        const issuer = this.extractText('.pv-entity__secondary-title', item) || 
                      this.extractText('.t-14.t-black--light', item);
        
        const issueDate = this.extractText('.pv-entity__dates', item) || 
                         this.extractText('.t-14.t-black--light.t-normal', item);
        
        const description = this.extractText('.pv-entity__extra-info', item) || 
                           this.extractText('.pv-entity__description', item);

        if (title) {
          honors.push({
            title: title || 'N/A',
            issuer: issuer || 'N/A',
            issueDate: issueDate || 'N/A',
            description: description || ''
          });
        }
      });

      return honors;
    } catch (error) {
      console.error('Error scraping honors and awards:', error);
      return [];
    }
  }

  // Scrape publications
  scrapePublications() {
    try {
      const publications = [];
      const pubSection = document.querySelector('#publications');
      
      if (!pubSection) return publications;

      const pubItems = pubSection.parentElement.querySelectorAll('.artdeco-list__item');
      
      pubItems.forEach(item => {
        const title = this.extractText('.pv-entity__summary-info h3', item) || 
                     this.extractText('.t-16.t-black.t-bold', item);
        
        const publisher = this.extractText('.pv-entity__secondary-title', item) || 
                         this.extractText('.t-14.t-black--light', item);
        
        const publishDate = this.extractText('.pv-entity__dates', item) || 
                           this.extractText('.t-14.t-black--light.t-normal', item);
        
        const description = this.extractText('.pv-entity__extra-info', item) || 
                           this.extractText('.pv-entity__description', item);

        if (title) {
          publications.push({
            title: title || 'N/A',
            publisher: publisher || 'N/A',
            publishDate: publishDate || 'N/A',
            description: description || ''
          });
        }
      });

      return publications;
    } catch (error) {
      console.error('Error scraping publications:', error);
      return [];
    }
  }

  // Scrape contact information (if visible)
  scrapeContactInfo() {
    try {
      const contactInfo = {};
      
      // Email (if visible)
      const emailSelectors = [
        '.pv-contact-info__contact-type[data-test-id="email"] .pv-contact-info__ci-container',
        '.ci-email .pv-contact-info__ci-container',
        '.pv-contact-info__ci-container[data-test-id="email"]'
      ];
      
      for (const selector of emailSelectors) {
        const email = this.extractText(selector);
        if (email && email.includes('@')) {
          contactInfo.email = email;
          break;
        }
      }

      // Phone (if visible)
      const phoneSelectors = [
        '.pv-contact-info__contact-type[data-test-id="phone"] .pv-contact-info__ci-container',
        '.ci-phone .pv-contact-info__ci-container',
        '.pv-contact-info__ci-container[data-test-id="phone"]'
      ];
      
      for (const selector of phoneSelectors) {
        const phone = this.extractText(selector);
        if (phone && (phone.includes('+') || phone.includes('(') || phone.includes('-'))) {
          contactInfo.phone = phone;
          break;
        }
      }

      // Website (if visible)
      const websiteSelectors = [
        '.pv-contact-info__contact-type[data-test-id="website"] .pv-contact-info__ci-container a',
        '.ci-website .pv-contact-info__ci-container a',
        '.pv-contact-info__ci-container[data-test-id="website"] a'
      ];
      
      for (const selector of websiteSelectors) {
        const website = this.extractAttribute(selector, 'href');
        if (website) {
          contactInfo.website = website;
          break;
        }
      }

      return contactInfo;
    } catch (error) {
      console.error('Error scraping contact info:', error);
      return {};
    }
  }

  // Main scraping function
  async scrapeProfile() {
    try {
      // Check cache first
      const currentUrl = window.location.href;
      const cacheKey = `profile_${currentUrl}`;
      
      if (this.cache.has(cacheKey)) {
        console.log('Returning cached profile data');
        return this.cache.get(cacheKey);
      }
      
      // Prevent multiple simultaneous scraping
      if (this.isScraping) {
        console.log('Scraping already in progress, please wait...');
        return { success: false, error: 'Scraping already in progress' };
      }
      
      this.isScraping = true;
      
      // Wait for the page to load (reduced from 3s to 1s)
      await this.waitForElement('h1', 1000);
      
      // Give minimal time for dynamic content to load (reduced from 2s to 0.5s)
      await new Promise(resolve => setTimeout(resolve, 500));

      console.log('Starting comprehensive profile scraping...');

      // Scrape all sections in parallel for better performance
      const [
        basicInfo,
        experienceResult,
        education,
        skills,
        certifications,
        volunteerExperience,
        languages,
        honorsAwards,
        publications,
        contactInfo
      ] = await Promise.all([
        Promise.resolve(this.scrapeBasicInfo()),
        Promise.resolve(this.scrapeExperience()),
        Promise.resolve(this.scrapeEducation()),
        Promise.resolve(this.scrapeSkills()),
        Promise.resolve(this.scrapeCertifications()),
        Promise.resolve(this.scrapeVolunteerExperience()),
        Promise.resolve(this.scrapeLanguages()),
        Promise.resolve(this.scrapeHonorsAwards()),
        Promise.resolve(this.scrapePublications()),
        Promise.resolve(this.scrapeContactInfo())
      ]);
      
      const experience = experienceResult.experiences;
      const experienceRawHtml = experienceResult.rawHtml;

      // Calculate total experience including education
      // Total experience will be calculated by Gemini from the raw HTML
      // Keep the basic calculation as fallback
      const totalExperienceWithEducation = this.calculateTotalExperienceWithEducation(experience, education);
      const totalExperienceFormatted = this.formatTotalExperience(totalExperienceWithEducation);
      
      // Update basicInfo with calculated total experience (fallback)
      basicInfo.totalExperience = totalExperienceFormatted;

      this.profileData = {
        basicInfo,
        experience,
        experienceRawHtml,
        education,
        skills,
        certifications,
        volunteerExperience,
        languages,
        honorsAwards,
        publications,
        contactInfo,
        scrapedAt: new Date().toISOString(),
        scrapingVersion: '2.0'
      };

      console.log('Profile scraping completed:', {
        basicInfo: Object.keys(basicInfo).length,
        experience: experience.length,
        education: education.length,
        skills: skills.length,
        certifications: certifications.length,
        volunteer: volunteerExperience.length,
        languages: languages.length,
        honors: honorsAwards.length,
        publications: publications.length,
        contactInfo: Object.keys(contactInfo).length
      });

      // Enhance data with Gemini AI with timeout fallback
      console.log('Enhancing data with Gemini AI...');
      let enhancedData;
      try {
        // Add overall timeout for Gemini enhancement
        const geminiPromise = this.enhanceDataWithGemini(this.profileData);
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Gemini timeout')), 10000) // 10 second overall timeout
        );
        
        enhancedData = await Promise.race([geminiPromise, timeoutPromise]);
        console.log('Enhanced data:', enhancedData);
        console.log('Gemini enhancement completed:', enhancedData.geminiEnhanced ? 'Success' : 'Failed');
      } catch (error) {
        console.log('Gemini enhancement timed out or failed, using basic extraction:', error.message);
        enhancedData = this.profileData;
      }

      // If Gemini enhancement failed, return the original data with basic extraction
      if (!enhancedData.geminiEnhanced) {
        console.log('Gemini enhancement failed, using basic extraction');
        const basicEnhanced = {
          ...this.profileData,
          name: this.profileData.basicInfo?.name || this.profileData.basicInfo?.fullName || '',
          location: this.profileData.basicInfo?.location || '',
          profileLink: this.profileData.basicInfo?.profileLink || window.location.href,
          currentCompany: this.profileData.basicInfo?.currentCompany || '',
          currentDesignation: this.profileData.basicInfo?.currentDesignation || '',
          skills: this.profileData.skills || [],
          totalExperience: this.profileData.basicInfo?.totalExperience || '',
          education_qualification: this.profileData.education || [],
          geminiEnhanced: false
        };
        return basicEnhanced;
      }

      // Cache the result
      this.cache.set(cacheKey, enhancedData);
      this.isScraping = false;
      
      return enhancedData;
    } catch (error) {
      console.error('Error scraping profile:', error);
      this.isScraping = false;
      throw error;
    }
  }
}

// Initialize scraper
let scraper;
try {
  console.log('Attempting to initialize LinkedInScraper...');
  scraper = new LinkedInScraper();
  console.log('LinkedIn scraper initialized successfully');
} catch (error) {
  console.error('Error initializing LinkedIn scraper:', error);
  console.error('Error stack:', error.stack);
  console.error('Error details:', {
    name: error.name,
    message: error.message,
    cause: error.cause
  });
}


// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('Content script received message:', request);
  
  if (request.action === 'scrapeProfile') {
    if (!scraper) {
      console.error('Scraper not initialized');
      sendResponse({ success: false, error: 'Scraper not initialized' });
      return true;
    }
    
    scraper.scrapeProfile()
      .then(data => {
        sendResponse({ success: true, data });
        console.log('Scraper completed successfully', data);
      })
      .catch(error => {
        sendResponse({ success: false, error: error.message });
        console.error('Scraper failed:', error);
      });
    
    // Return true to indicate we'll send a response asynchronously
    return true;
  }
  
  return false;
});

console.log('LinkedIn scraper content script loaded');
console.log('Content script is running on:', window.location.href);
console.log('Content script ready to receive messages');
