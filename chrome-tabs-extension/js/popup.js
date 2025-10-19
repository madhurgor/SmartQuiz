// Store all tabs globally so we can filter them without querying again
let allTabs = [];
let activeTab = null;
let tabTimes = {}; // Store time spent on each tab

// Format time as HH:MM:SS
function formatTime(milliseconds) {
  if (!milliseconds) return '00:00:00';
  
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Function to get all tabs and display them
function getTabs() {
  // Get the DOM elements
  const tabsList = document.getElementById('tabs-list');
  const tabsCount = document.querySelector('.tabs-count');
  
  // Show loading message
  tabsList.innerHTML = '<li class="loading">Loading tabs...</li>';
  
  // Get all tab times first
  chrome.runtime.sendMessage({ action: 'getAllTabTimes' }, function(response) {
    if (response && response.tabTimes) {
      tabTimes = response.tabTimes;
    }
    
    // Query for all tabs across all windows
    chrome.tabs.query({}, function(tabs) {
      // Store all tabs globally
      allTabs = tabs;
      
      // Get the active tab
      chrome.tabs.query({active: true, currentWindow: true}, function(activeTabs) {
        activeTab = activeTabs[0];
        
        // Update tabs count
        tabsCount.textContent = `Total open tabs: ${tabs.length}`;
        
        // Sort tabs by window ID to group them
        tabs.sort((a, b) => a.windowId - b.windowId);
        
        // Display the tabs
        displayTabs(tabs);
      });
    });
  });
}

// Function to display filtered or all tabs
function displayTabs(tabs) {
  const tabsList = document.getElementById('tabs-list');
  
  // Clear the list
  tabsList.innerHTML = '';
  
  // If no tabs to display
  if (tabs.length === 0) {
    tabsList.innerHTML = '<li class="loading">No matching tabs found</li>';
    return;
  }
  
  let currentWindowId = null;
  
  // Loop through tabs and create list items
  tabs.forEach(function(tab) {
    // Add window separator if this is a new window
    if (currentWindowId !== tab.windowId) {
      currentWindowId = tab.windowId;
      
      const windowSeparator = document.createElement('li');
      windowSeparator.className = 'window-separator';
      windowSeparator.textContent = `Window ${currentWindowId}`;
      tabsList.appendChild(windowSeparator);
    }
    
    // Create list item for the tab
    const tabItem = document.createElement('li');
    
    // Add current-tab class if this is the active tab
    if (activeTab && tab.id === activeTab.id) {
      tabItem.className = 'current-tab';
    }
    
    // Create favicon or placeholder
    let favicon;
    if (tab.favIconUrl) {
      favicon = document.createElement('img');
      favicon.className = 'tab-favicon';
      favicon.src = tab.favIconUrl;
    } else {
      favicon = document.createElement('div');
      favicon.className = 'tab-favicon tab-favicon-placeholder';
      favicon.textContent = '📄'; // Document emoji as placeholder
    }
    
    // Create container for title and time
    const contentContainer = document.createElement('div');
    contentContainer.className = 'tab-content';
    
    // Create title span
    const title = document.createElement('span');
    title.className = 'tab-title';
    title.textContent = tab.title || tab.url;
    
    // Add tooltip with full URL
    title.title = tab.url;
    
    // Create timer display
    const timeDisplay = document.createElement('span');
    timeDisplay.className = 'tab-time';
    timeDisplay.textContent = formatTime(tabTimes[tab.id]);
    
    // Add click event to switch to this tab
    tabItem.addEventListener('click', function() {
      chrome.tabs.update(tab.id, {active: true});
      chrome.windows.update(tab.windowId, {focused: true});
      window.close(); // Close the popup
    });
    
    // Add title and time to content container
    contentContainer.appendChild(title);
    contentContainer.appendChild(timeDisplay);
    
    // Append elements to the list item
    tabItem.appendChild(favicon);
    tabItem.appendChild(contentContainer);
    
    // Append the list item to the list
    tabsList.appendChild(tabItem);
  });
}

// Filter tabs based on search query
function filterTabs(query) {
  if (!query) {
    displayTabs(allTabs);
    return;
  }
  
  query = query.toLowerCase();
  
  const filteredTabs = allTabs.filter(tab => {
    const title = (tab.title || '').toLowerCase();
    const url = (tab.url || '').toLowerCase();
    return title.includes(query) || url.includes(query);
  });
  
  displayTabs(filteredTabs);
  
  // Update count display
  document.querySelector('.tabs-count').textContent = 
    `Showing ${filteredTabs.length} of ${allTabs.length} tabs`;
}

// Initialize the extension
document.addEventListener('DOMContentLoaded', function() {
  // Get all tabs
  getTabs();
  
  // Set up search functionality
  const searchInput = document.getElementById('search-tabs');
  searchInput.addEventListener('input', function() {
    filterTabs(this.value);
  });
  
  // Set up refresh button
  document.getElementById('refresh-button').addEventListener('click', function() {
    getTabs();
    searchInput.value = '';
  });
});
