// ENHANCED TAB SWITCHER WITH NAVIGATION AND SEARCH
console.log('🚀 CONTENT SCRIPT: Tab Switcher loading...');
console.log('🌍 CONTENT SCRIPT: Page URL:', window.location.href);
console.log('🔧 CONTENT SCRIPT: Document ready state:', document.readyState);
console.log('📄 CONTENT SCRIPT: Document title:', document.title);
console.log('🎯 CONTENT SCRIPT: User agent:', navigator.userAgent);

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
console.log('🔌 CONTENT SCRIPT: Browser API available:', !!browserAPI);
console.log('🔌 CONTENT SCRIPT: Browser tabs API available:', !!(browserAPI && browserAPI.tabs));
console.log('🔌 CONTENT SCRIPT: Browser runtime API available:', !!(browserAPI && browserAPI.runtime));
let popupActive = false;
let allTabs = [];
let filteredTabs = [];
let selectedIndex = 0;

// Create the tab switcher popup directly in content script
function createTabSwitcher() {
  if (popupActive) {
    console.log('Tab switcher already active');
    return;
  }
  
  console.log('🎯 Creating tab switcher popup...');
  popupActive = true;
  
  // Get tabs from background script via message passing
  console.log('📨 Requesting tabs from background script...');
  browserAPI.runtime.sendMessage({ action: "getTabs" }, (response) => {
    if (browserAPI.runtime.lastError) {
      console.error('❌ Failed to contact background:', browserAPI.runtime.lastError);
      showErrorPopup('Could not contact background script. Please reload the extension.');
      popupActive = false;
      return;
    }
    
    if (response.error) {
      console.error('❌ Background error:', response.error);
      showErrorPopup('Background script error: ' + response.error);
      popupActive = false;
      return;
    }
    
    allTabs = response.tabs;
    filteredTabs = [...allTabs];
    selectedIndex = allTabs.findIndex(tab => tab.active) || 0;
    console.log('📋 Received', allTabs.length, 'tabs from background');
    
    createPopupUI();
    console.log('✅ Tab switcher popup created successfully');
  });
}

function createPopupUI() {
  // Create main popup container
  const popup = document.createElement('div');
  popup.id = 'content-tab-switcher';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 720px;
    max-height: 80vh;
    background: linear-gradient(145deg, #2a2a2a, #1e1e1e);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    color: white;
    box-shadow: 0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.05);
    display: flex;
    flex-direction: column;
    backdrop-filter: blur(20px);
    overflow: hidden;
  `;
  
  // Create header with search
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 20px 24px 16px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    display: flex;
    flex-direction: column;
    gap: 12px;
    background: rgba(255,255,255,0.02);
  `;
  
  const title = document.createElement('div');
  title.style.cssText = `
    font-weight: 600; 
    text-align: center; 
    font-size: 18px; 
    color: rgba(255,255,255,0.9);
    letter-spacing: -0.5px;
  `;
  title.textContent = `Tab Switcher (${allTabs.length} tabs)`;
  header.appendChild(title);
  
  // Create search box
  const searchBox = document.createElement('input');
  searchBox.id = 'tab-search';
  searchBox.type = 'text';
  searchBox.placeholder = 'Search tabs...';
  searchBox.style.cssText = `
    padding: 14px 20px;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    background: rgba(255,255,255,0.05);
    color: white;
    font-size: 15px;
    outline: none;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
    font-weight: 400;
  `;
  
  // Add focus effects for search box
  searchBox.addEventListener('focus', () => {
    searchBox.style.borderColor = 'rgba(0,122,255,0.6)';
    searchBox.style.background = 'rgba(0,122,255,0.1)';
    searchBox.style.boxShadow = '0 0 0 3px rgba(0,122,255,0.2)';
  });
  searchBox.addEventListener('blur', () => {
    searchBox.style.borderColor = 'rgba(255,255,255,0.1)';
    searchBox.style.background = 'rgba(255,255,255,0.05)';
    searchBox.style.boxShadow = 'none';
  });
  searchBox.addEventListener('input', filterTabs);
  header.appendChild(searchBox);
  
  popup.appendChild(header);
  
  // Create scrollable tab list container
  const tabListContainer = document.createElement('div');
  tabListContainer.id = 'tab-list-container';
  tabListContainer.style.cssText = `
    flex: 1;
    overflow-y: auto;
    padding: 8px 24px;
    max-height: 60vh;
  `;
  
  // Add custom scrollbar styles
  const style = document.createElement('style');
  style.textContent = `
    #tab-list-container::-webkit-scrollbar {
      width: 8px;
    }
    #tab-list-container::-webkit-scrollbar-track {
      background: rgba(255,255,255,0.05);
      border-radius: 4px;
    }
    #tab-list-container::-webkit-scrollbar-thumb {
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
    }
    #tab-list-container::-webkit-scrollbar-thumb:hover {
      background: rgba(255,255,255,0.3);
    }
  `;
  document.head.appendChild(style);
  popup.appendChild(tabListContainer);
  
  // Create instructions
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    padding: 12px 24px 16px 24px;
    border-top: 1px solid rgba(255,255,255,0.08);
    font-size: 13px;
    color: rgba(255,255,255,0.6);
    text-align: center;
    background: rgba(255,255,255,0.02);
    font-weight: 400;
    letter-spacing: 0.2px;
  `;
  instructions.textContent = '↑↓ Navigate • Enter: Switch • Shift+Enter: Close • X: Close • Esc: Cancel • Ctrl+Q or Ctrl+Shift+Y: Open';
  popup.appendChild(instructions);
  
  document.body.appendChild(popup);
  
  // Render tabs and focus search
  renderTabs();
  searchBox.focus();
}

function renderTabs() {
  const container = document.getElementById('tab-list-container');
  if (!container) return;
  
  container.innerHTML = '';
  
  filteredTabs.forEach((tab, index) => {
    const tabItem = document.createElement('div');
    tabItem.className = 'tab-item';
    tabItem.dataset.tabId = tab.id;
    tabItem.dataset.index = index;
    
    const isSelected = index === selectedIndex;
    const isActive = tab.active;
    
    tabItem.style.cssText = `
      padding: 10px 20px;
      margin: 2px 0;
      background: ${isSelected ? 'linear-gradient(135deg, #007acc, #0056b3)' : (isActive ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.04)')};
      border-radius: 16px;
      cursor: pointer;
      border: 2px solid ${isSelected ? 'rgba(255,255,255,0.3)' : 'transparent'};
      display: flex;
      align-items: center;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
      position: relative;
      overflow: hidden;
    `;
    
    // Add hover effect
    tabItem.addEventListener('mouseenter', () => {
      if (!isSelected) {
        tabItem.style.background = isActive ? 'rgba(0,122,255,0.25)' : 'rgba(255,255,255,0.08)';
        tabItem.style.transform = 'translateY(-1px)';
        tabItem.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)';
      }
    });
    tabItem.addEventListener('mouseleave', () => {
      if (!isSelected) {
        tabItem.style.background = isActive ? 'rgba(0,122,255,0.15)' : 'rgba(255,255,255,0.04)';
        tabItem.style.transform = 'translateY(0)';
        tabItem.style.boxShadow = 'none';
      }
    });
    
    // Add favicon
    const favicon = document.createElement('img');
    favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23666"/></svg>';
    favicon.style.cssText = `
      width: 20px; 
      height: 20px; 
      margin-right: 16px; 
      flex-shrink: 0;
      border-radius: 6px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    `;
    tabItem.appendChild(favicon);
    
    // Add tab info
    const tabInfo = document.createElement('div');
    tabInfo.style.cssText = 'flex: 1; min-width: 0;';
    
    const title = document.createElement('div');
    title.style.cssText = `
      font-weight: 600; 
      margin-bottom: 4px; 
      font-size: 15px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: ${isSelected ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)'};
      letter-spacing: -0.2px;
    `;
    title.textContent = tab.title || 'Untitled';
    tabInfo.appendChild(title);
    
    const url = document.createElement('div');
    url.style.cssText = `
      font-size: 12px; 
      color: ${isSelected ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.5)'};
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-weight: 400;
    `;
    url.textContent = tab.url;
    tabInfo.appendChild(url);
    
    tabItem.appendChild(tabInfo);
    
    // Add close button
    const closeBtn = document.createElement('button');
    closeBtn.textContent = '×';
    closeBtn.style.cssText = `
      background: rgba(255,255,255,0.1);
      border: none;
      color: rgba(255,255,255,0.7);
      width: 28px;
      height: 28px;
      border-radius: 14px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 500;
      margin-left: 12px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
      backdrop-filter: blur(10px);
    `;
    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255,59,48,0.8)';
      closeBtn.style.color = 'white';
      closeBtn.style.transform = 'scale(1.1)';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255,255,255,0.1)';
      closeBtn.style.color = 'rgba(255,255,255,0.7)';
      closeBtn.style.transform = 'scale(1)';
    });
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closeTab(tab.id, index);
    });
    tabItem.appendChild(closeBtn);
    
    // Add click handler for tab switching
    tabItem.addEventListener('click', () => {
      switchToTab(tab.id);
    });
    
    container.appendChild(tabItem);
  });
  
  // Scroll selected item into view
  scrollToSelected();
}

function filterTabs() {
  const searchBox = document.getElementById('tab-search');
  const query = searchBox.value.toLowerCase().trim();
  
  if (query === '') {
    filteredTabs = [...allTabs];
  } else {
    filteredTabs = allTabs.filter(tab => 
      tab.title.toLowerCase().includes(query) || 
      tab.url.toLowerCase().includes(query)
    );
  }
  
  selectedIndex = 0;
  renderTabs();
}

function navigateUp() {
  if (selectedIndex > 0) {
    selectedIndex--;
    renderTabs();
  }
}

function navigateDown() {
  if (selectedIndex < filteredTabs.length - 1) {
    selectedIndex++;
    renderTabs();
  }
}

function scrollToSelected() {
  const container = document.getElementById('tab-list-container');
  const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`);
  if (selectedItem) {
    selectedItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }
}

function switchToTab(tabId) {
  console.log('🎯 Switching to tab:', tabId);
  browserAPI.runtime.sendMessage({ 
    action: "switchTab", 
    tabId: tabId 
  }, (response) => {
    if (response && response.error) {
      console.error('❌ Failed to switch tab:', response.error);
    } else {
      console.log('✅ Tab switch successful');
    }
  });
  closePopup();
  // If running from the packaged extension page, close that tab after switching
  const protocol = window.location.protocol || '';
  if (protocol === 'moz-extension:' || protocol === 'chrome-extension:') {
    try {
      window.close();
    } catch (e) {
      console.warn('⚠️ Unable to close switcher page tab:', e);
    }
  }
}

function closeTab(tabId, index) {
  console.log('🗑️ Closing tab:', tabId);
  browserAPI.runtime.sendMessage({ 
    action: "closeTab", 
    tabId: tabId 
  }, (response) => {
    if (response && response.error) {
      console.error('❌ Failed to close tab:', response.error);
    } else {
      console.log('✅ Tab closed successfully');
      // Remove from our arrays
      allTabs = allTabs.filter(tab => tab.id !== tabId);
      filteredTabs = filteredTabs.filter(tab => tab.id !== tabId);
      
      // Adjust selected index
      if (selectedIndex >= filteredTabs.length) {
        selectedIndex = Math.max(0, filteredTabs.length - 1);
      }
      
      // Re-render
      renderTabs();
      
      // Update title
      const title = document.querySelector('#content-tab-switcher div');
      if (title) {
        title.textContent = `Tab Switcher (${allTabs.length} tabs)`;
      }
    }
  });
}

function closePopup() {
  const popup = document.getElementById('content-tab-switcher');
  if (popup) {
    popup.remove();
    popupActive = false;
    console.log('🗑️ Tab switcher popup closed');
  }
}

function showErrorPopup(message) {
  const popup = document.createElement('div');
  popup.id = 'content-tab-switcher';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 400px;
    background: #d32f2f;
    border: 2px solid #ffffff;
    border-radius: 8px;
    z-index: 999999;
    font-family: Arial, sans-serif;
    color: white;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0,0,0,0.5);
  `;
  
  popup.innerHTML = `
    <h3>⚠️ Extension Error</h3>
    <p>${message}</p>
    <button onclick="this.parentElement.remove(); popupActive = false;" style="
      background: white;
      color: #d32f2f;
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      margin-top: 10px;
    ">Close</button>
  `;
  
  document.body.appendChild(popup);
}

// Keyboard shortcuts
document.addEventListener('keydown', (event) => {
  // Debug all Ctrl key combinations
  if (event.ctrlKey) {
    console.log('🔍 CONTENT SCRIPT: Ctrl key detected:', {
      key: event.key,
      code: event.code,
      ctrlKey: event.ctrlKey,
      shiftKey: event.shiftKey,
      altKey: event.altKey,
      popupActive: popupActive,
      target: event.target.tagName
    });
  }
  
  // Ctrl+Shift+Y or Ctrl+Q to open
  if (((event.ctrlKey && event.shiftKey && (event.key === 'Y' || event.key === 'y')) || 
       (event.ctrlKey && !event.shiftKey && (event.key === 'q' || event.key === 'Q'))) && !popupActive) {
    const shortcut = event.shiftKey ? 'Ctrl+Shift+Y' : 'Ctrl+Q';
    console.log(`🎯 CONTENT SCRIPT: ${shortcut} detected - opening tab switcher`);
    event.preventDefault();
    event.stopPropagation();
    createTabSwitcher();
    return false;
  }
  
  // Handle navigation when popup is active
  if (popupActive) {
    switch (event.key) {
      case 'Escape':
        console.log('🚪 Escape pressed - closing tab switcher');
        event.preventDefault();
        event.stopPropagation();
        closePopup();
        return false;
        
      case 'ArrowUp':
        event.preventDefault();
        event.stopPropagation();
        navigateUp();
        return false;
        
      case 'ArrowDown':
        event.preventDefault();
        event.stopPropagation();
        navigateDown();
        return false;
        
        case 'Enter':
        event.preventDefault();
        event.stopPropagation();
        if (event.shiftKey) {
          // Shift+Enter: Close selected tab
          if (filteredTabs[selectedIndex]) {
            closeTab(filteredTabs[selectedIndex].id, selectedIndex);
          }
        } else {
          // Enter: Switch to selected tab
          if (filteredTabs[selectedIndex]) {
            switchToTab(filteredTabs[selectedIndex].id);
          }
        }
        return false;
    }
  }
}, true);

console.log('✅ CONTENT SCRIPT: Tab Switcher ready - Use Ctrl+Q or Ctrl+Shift+Y');
console.log('🔧 CONTENT SCRIPT: Event listener attached to document');
console.log('📍 CONTENT SCRIPT: Script loaded on:', window.location.href);

// Add a test function to manually trigger the tab switcher
window.testTabSwitcher = function() {
  console.log('🧪 CONTENT SCRIPT: Manual test triggered');
  if (popupActive) {
    console.log('❌ CONTENT SCRIPT: Popup already active');
  } else {
    console.log('✅ CONTENT SCRIPT: Creating tab switcher manually...');
    createTabSwitcher();
  }
};

console.log('🔧 CONTENT SCRIPT: Test function added - call testTabSwitcher() to test manually');
