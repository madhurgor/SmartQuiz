// Background script to track time spent on each tab
let tabTimes = {};
let activeTabId = null;
let lastActivationTime = null;
let tabBaseUrls = {}; // Track base URL for each tab

// Blocklist of websites to monitor
const blockedSites = [
  'facebook.com',
  'youtube.com',
  'instagram.com',
  'tiktok.com'
];

// List of assignment sites to redirect to
const assignmentListSites = [
  'https://claude.ai/public/artifacts/4f311c00-bee5-4b81-8870-823cf2f0c7f8?fullscreen=true',
  'https://www.khanacademy.org/',
  'https://www.coursera.org/assignments',
  'https://classroom.google.com/',
];

// Initialize storage when extension loads
function initTabTimes() {
  chrome.storage.local.get(['tabTimes'], function(result) {
    if (result.tabTimes) {
      tabTimes = result.tabTimes;
    }
  });
}

// Update time for the tab that's being switched from
function updateTabTime(tabId) {
  if (tabId && lastActivationTime) {
    const currentTime = Date.now();
    const timeSpent = currentTime - lastActivationTime;
    
    if (!tabTimes[tabId]) {
      tabTimes[tabId] = 0;
    }
    
    tabTimes[tabId] += timeSpent;
    
    // Save to storage
    chrome.storage.local.set({ tabTimes: tabTimes });
    
    // Notify the tab about the time update
    chrome.tabs.sendMessage(tabId, { 
      action: 'updateTimer',
      time: tabTimes[tabId]
    }).catch(() => {
      // Tab might be closed or not have content script loaded yet
    });
  }
}

// Track active tab changes
chrome.tabs.onActivated.addListener(function(activeInfo) {
  // Update time for the previous tab
  if (activeTabId) {
    updateTabTime(activeTabId);
  }
  
  // Update tracking for new tab
  activeTabId = activeInfo.tabId;
  lastActivationTime = Date.now();
  
  // Send initial time to the tab
  if (tabTimes[activeTabId]) {
    chrome.tabs.sendMessage(activeTabId, { 
      action: 'updateTimer', 
      time: tabTimes[activeTabId] 
    }).catch(() => {
      // Tab might not have content script loaded yet
    });
  }
});

// Check if URL is in the blocklist
function isBlockedSite(url) {
  if (!url) return false;
  
  return blockedSites.some(site => url.includes(site));
}

// Extract base URL (domain) from a full URL
function getBaseUrl(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname;
  } catch (e) {
    return url; // If URL parsing fails, return original URL
  }
}

// Track tab updates (refreshes, URL changes)
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  // If there's a URL change
  if (changeInfo.url) {
    // Extract the new base URL
    const newBaseUrl = getBaseUrl(changeInfo.url);
    const oldBaseUrl = tabBaseUrls[tabId];
    
    // If this is the active tab
    if (tabId === activeTabId) {
      updateTabTime(activeTabId);
      lastActivationTime = Date.now();
      
      // If the base URL has changed
      if (oldBaseUrl && newBaseUrl !== oldBaseUrl) {
        // Reset the timer for this tab
        tabTimes[tabId] = 0;
        
        // Save to storage
        chrome.storage.local.set({ tabTimes: tabTimes });
        
        // Notify the tab about the reset
        chrome.tabs.sendMessage(tabId, { 
          action: 'updateTimer',
          time: 0,
          isReset: true
        }).catch(() => {
          // Tab might not have content script loaded yet
        });
      }
    }
    
    // Update the stored base URL for this tab
    tabBaseUrls[tabId] = newBaseUrl;
  }
  
  // If the tab is complete, send the current time
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is a blocked site
    const isBlocked = isBlockedSite(tab.url);
    
    // Update base URL if it doesn't exist yet
    if (!tabBaseUrls[tabId] && tab.url) {
      tabBaseUrls[tabId] = getBaseUrl(tab.url);
    }
    
    // Send time and blocked status
    chrome.tabs.sendMessage(tabId, { 
      action: 'updateTimer', 
      time: tabTimes[tabId] || 0,
      isBlockedSite: isBlocked
    }).catch(() => {
      // Tab might not have content script loaded yet
    });
  }
});

// Handle window focus/blur events
chrome.windows.onFocusChanged.addListener(function(windowId) {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Window lost focus, update the active tab
    if (activeTabId) {
      updateTabTime(activeTabId);
      lastActivationTime = null; // Pause the timer
    }
  } else {
    // Window gained focus, restart timer for active tab
    chrome.tabs.query({active: true, windowId: windowId}, function(tabs) {
      if (tabs.length > 0) {
        activeTabId = tabs[0].id;
        lastActivationTime = Date.now();
      }
    });
  }
});

// Get time for a specific tab
function getTabTime(tabId) {
  if (tabId === activeTabId) {
    // For the active tab, calculate the current time
    updateTabTime(activeTabId);
    lastActivationTime = Date.now(); // Reset the timer
  }
  
  return tabTimes[tabId] || 0;
}

// Handle messages from popup or content script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'getTabTime') {
    const tabId = request.tabId;
    sendResponse({ time: getTabTime(tabId) });
  } else if (request.action === 'getAllTabTimes') {
    // Update the time for the active tab first
    if (activeTabId) {
      updateTabTime(activeTabId);
      lastActivationTime = Date.now(); // Reset the timer
    }
    sendResponse({ tabTimes: tabTimes });
  } else if (request.action === 'getCurrentTab') {
    // If the message comes from a content script, return that tab's ID
    if (sender.tab) {
      sendResponse({ tabId: sender.tab.id });
    } else {
      // For messages from popup, return the active tab
      sendResponse({ tabId: activeTabId });
    }
  } else if (request.action === 'openTabsList') {
    // Handle tabs list popup
    chrome.action.openPopup();
  } else if (request.action === 'redirectToAssignmentSite') {
    // Check all open tabs to see if any match with the assignment sites
    if (sender.tab) {
      chrome.tabs.query({}, function(tabs) {
        // Flag to track if we found a matching tab
        let foundMatchingTab = false;
        
        // Loop through all tabs and check if any URL matches with any assignment site
        for (let i = 0; i < tabs.length; i++) {
          const tab = tabs[i];
          // Check if this tab's URL matches any assignment site URL
          for (let j = 0; j < assignmentListSites.length; j++) {
            if (tab.url && tab.url.includes(new URL(assignmentListSites[j]).hostname)) {
              // Found a match, switch to this tab
              chrome.tabs.update(tab.id, { active: true });
              chrome.windows.update(tab.windowId, { focused: true });
              foundMatchingTab = true;
              break;
            }
          }
          if (foundMatchingTab) break;
        }
        
        // If no matching tab is found, redirect the current tab to the first assignment site
        if (!foundMatchingTab && assignmentListSites.length > 0) {
          chrome.tabs.update(sender.tab.id, { url: assignmentListSites[0] });
        }
      });
    }
  } else if (request.action === 'resetTabTimer') {
    // Handle reset timer request from content script
    const tabId = request.tabId;
    if (tabId && tabTimes[tabId]) {
      // Reset the timer for this tab
      tabTimes[tabId] = 0;
      
      // Save to storage
      chrome.storage.local.set({ tabTimes: tabTimes });
      
      // If this is the active tab, reset the activation time
      if (tabId === activeTabId) {
        lastActivationTime = Date.now();
      }
    }
  }
  
  return true; // Indicates we will respond asynchronously
});

// Initialize when the extension loads
initTabTimes();
