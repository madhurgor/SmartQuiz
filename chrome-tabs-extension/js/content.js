// Create and inject the popup into the page
function createPopup() {
  // Create the main container
  const popupContainer = document.createElement('div');
  popupContainer.className = 'tabs-tracker-popup';
  popupContainer.id = 'tabs-tracker-popup';
  
  // Create button container
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'tabs-tracker-buttons';
  
  // Create the three buttons
  const buttons = [
    { id: 'tabs-btn-prev', text: '◀ Prev', action: goToPreviousTab },
    { id: 'tabs-btn-list', text: '≡ List', action: openTabsList },
    { id: 'tabs-btn-next', text: 'Next ▶', action: goToNextTab }
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
  popupContainer.appendChild(buttonContainer);
  
  // Add the popup to the page
  document.body.appendChild(popupContainer);
  
  // Add drag functionality
  makeDraggable(popupContainer);
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

// Go to the previous tab
function goToPreviousTab() {
  chrome.runtime.sendMessage({ action: 'previousTab' });
}

// Go to the next tab
function goToNextTab() {
  chrome.runtime.sendMessage({ action: 'nextTab' });
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
