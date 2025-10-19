// Timer variables
let currentTime = 0;
let timerInterval = null;
let timerDisplay = null;
let quizPopupTimer = null;
let isBlockedSite = false;
let quizPopupShown = false;

// Format time as HH:MM:SS
function formatTime(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Update the timer display
function updateTimerDisplay() {
  if (timerDisplay) {
    timerDisplay.textContent = formatTime(currentTime);
  }
}

// Reset the timer
function resetTimer() {
  currentTime = 0;
  updateTimerDisplay();
  
  // Send message to background script to reset timer for this tab
  chrome.runtime.sendMessage({
    action: 'resetTabTimer',
    tabId: parseInt(document.querySelector('#tabs-tracker-popup').dataset.tabId)
  });
}

// Create the quiz popup
function createQuizPopup() {
  // Check if popup already exists
  if (document.getElementById('quiz-popup-overlay')) return;
  
  // Create the overlay
  const overlay = document.createElement('div');
  overlay.id = 'quiz-popup-overlay';
  overlay.className = 'quiz-popup-overlay';
  
  // Pause the timer when popup is shown
  quizPopupShown = true;
  
  // Create the popup container
  const container = document.createElement('div');
  container.className = 'quiz-popup-container';
  
  // Create the title
  const title = document.createElement('div');
  title.className = 'quiz-popup-title';
  title.textContent = 'Want to go over the fun quiz?';
  
  // Create buttons
  const yesButton = document.createElement('button');
  yesButton.className = 'quiz-popup-button';
  yesButton.textContent = 'Yes, take me there!';
  yesButton.addEventListener('click', () => {
    // Here you would add the code to redirect to the quiz
    window.location.href = 'https://claude.ai/public/artifacts/c5129678-af5d-44fe-aafc-d174ae6b1454';
  });
  
  const noButton = document.createElement('button');
  noButton.className = 'quiz-popup-button';
  noButton.textContent = 'Go to Assignment';
  noButton.addEventListener('click', () => {
    hideQuizPopup();
    // Redirect to the first assignment site from the list
    chrome.runtime.sendMessage({ action: 'redirectToAssignmentSite' });
  });
  
  // Close button
  const closeButton = document.createElement('button');
  closeButton.className = 'quiz-popup-close';
  closeButton.innerHTML = '&times;';
  closeButton.addEventListener('click', hideQuizPopup);
  
  // Add all elements to the container
  container.appendChild(closeButton);
  container.appendChild(title);
  container.appendChild(yesButton);
  container.appendChild(noButton);
  
  // Add container to overlay
  overlay.appendChild(container);
  
  // Add overlay to page
  document.body.appendChild(overlay);
  
  // Show popup with a slight delay for animation
  setTimeout(() => {
    overlay.classList.add('show');
  }, 10);
}

// Hide the quiz popup
function hideQuizPopup() {
  const overlay = document.getElementById('quiz-popup-overlay');
  if (overlay) {
    // Fade out
    overlay.classList.remove('show');
    
    // Remove from DOM after animation completes
    setTimeout(() => {
      overlay.remove();
    }, 300);
    
    // Reset the timer when any action is taken
    quizPopupShown = false;
    resetTimer();
  }
}

// Start the timer update interval
function startTimerInterval() {
  // Clear any existing interval
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // Update every second
  timerInterval = setInterval(() => {
    // Only increment if we're the active tab and popup is not shown
    if (document.visibilityState === 'visible' && !quizPopupShown) {
      currentTime += 1000;
      updateTimerDisplay();
      
      // Check if we should show quiz popup
      if (isBlockedSite && !quizPopupShown) {
        // Check if time has reached 10 seconds
        const seconds = Math.floor(currentTime / 1000) % 60;
        if (seconds === 10) {
          createQuizPopup();
        }
      }
    }
  }, 1000);
}

// Create and inject the popup into the page
function createPopup() {
  // Create the main container
  const popupContainer = document.createElement('div');
  popupContainer.className = 'tabs-tracker-popup';
  popupContainer.id = 'tabs-tracker-popup';
  
  // Create the timer display
  timerDisplay = document.createElement('div');
  timerDisplay.className = 'tabs-tracker-timer';
  timerDisplay.textContent = '00:00:00';
  
  // Create timer controls
  const timerControls = document.createElement('div');
  timerControls.className = 'tabs-tracker-timer-controls';
  
  // Create reset button
  const resetButton = document.createElement('button');
  resetButton.textContent = 'Reset';
  resetButton.addEventListener('click', resetTimer);
  timerControls.appendChild(resetButton);
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'tabs-tracker-buttons';
  
  // Create list button
  const buttons = [
    { id: 'tabs-btn-list', text: '≡ List', action: openTabsList }
  ];
  
  // Add buttons to the container
  buttons.forEach(button => {
    const btnElement = document.createElement('button');
    btnElement.id = button.id;
    btnElement.textContent = button.text;
    btnElement.addEventListener('click', button.action);
    buttonContainer.appendChild(btnElement);
  });
  
  // Add minimize button
  const minimizeBtn = document.createElement('button');
  minimizeBtn.className = 'tabs-tracker-minimize';
  minimizeBtn.textContent = '−';
  minimizeBtn.title = 'Minimize';
  minimizeBtn.addEventListener('click', toggleMinimize);
  
  // Add elements to the container
  popupContainer.appendChild(minimizeBtn);
  popupContainer.appendChild(timerDisplay);
  popupContainer.appendChild(timerControls);
  popupContainer.appendChild(buttonContainer);
  
  // Add the popup to the page
  document.body.appendChild(popupContainer);
  
  // Add drag functionality
  makeDraggable(popupContainer);
  
  // Get the current tab ID and store it as a data attribute
  chrome.runtime.sendMessage({ action: 'getCurrentTab' }, function(response) {
    if (response && response.tabId) {
      popupContainer.dataset.tabId = response.tabId;
      
      // Get the current time for this tab
      chrome.runtime.sendMessage({ 
        action: 'getTabTime', 
        tabId: response.tabId 
      }, function(timeResponse) {
        if (timeResponse && typeof timeResponse.time === 'number') {
          currentTime = timeResponse.time;
          updateTimerDisplay();
        }
      });
    }
  });
  
  // Start the timer interval
  startTimerInterval();
}

// Make the popup draggable
function makeDraggable(element) {
  let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;
  
  element.addEventListener('mousedown', dragMouseDown);
  
  function dragMouseDown(e) {
    // Ignore clicks on buttons
    if (e.target.tagName === 'BUTTON') return;
    
    e.preventDefault();
    // Get the mouse cursor position at startup
    pos3 = e.clientX;
    pos4 = e.clientY;
    document.addEventListener('mouseup', closeDragElement);
    document.addEventListener('mousemove', elementDrag);
  }
  
  function elementDrag(e) {
    e.preventDefault();
    // Calculate the new cursor position
    pos1 = pos3 - e.clientX;
    pos2 = pos4 - e.clientY;
    pos3 = e.clientX;
    pos4 = e.clientY;
    // Set the element's new position
    element.style.top = (element.offsetTop - pos2) + "px";
    element.style.left = (element.offsetLeft - pos1) + "px";
  }
  
  function closeDragElement() {
    // Stop moving when mouse button is released
    document.removeEventListener('mouseup', closeDragElement);
    document.removeEventListener('mousemove', elementDrag);
  }
}

// Toggle between minimized and full view
function toggleMinimize() {
  const popup = document.getElementById('tabs-tracker-popup');
  popup.classList.toggle('tabs-tracker-minimized');
  
  const minimizeBtn = document.querySelector('.tabs-tracker-minimize');
  if (popup.classList.contains('tabs-tracker-minimized')) {
    minimizeBtn.textContent = '+';
    minimizeBtn.title = 'Expand';
  } else {
    minimizeBtn.textContent = '−';
    minimizeBtn.title = 'Minimize';
  }
}

// Open the tabs list popup
function openTabsList() {
  chrome.runtime.sendMessage({ action: 'openTabsList' });
}

// Create the popup when the page loads
window.addEventListener('load', () => {
  // Wait a second to let the page finish loading
  setTimeout(createPopup, 1000);
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'updateTimer') {
    // Update the timer display with the new time
    if (typeof request.time === 'number') {
      currentTime = request.time;
      updateTimerDisplay();
    }
    
    // Check if this is a blocked site
    if (request.isBlockedSite !== undefined) {
      isBlockedSite = request.isBlockedSite;
    }
    
    // Check if timer was reset due to base URL change
    if (request.isReset === true) {
      // Log to console that the timer was reset due to domain change
      console.log('Timer reset: Domain change detected');
      
      // If quiz popup is shown, hide it when domain changes
      if (quizPopupShown) {
        hideQuizPopup();
      }
    }
    
    return true;
  }
});
