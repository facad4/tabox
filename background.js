// TAB SWITCHER BACKGROUND WITH COMMANDS API
console.log('🔥 BACKGROUND: Tab Switcher background loaded');
console.log('🔥 BACKGROUND: Extension ID:', chrome.runtime.id || browser.runtime.id);

const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
console.log('🔥 BACKGROUND: Browser API available:', !!browserAPI);

function isRestrictedUrl(url = '') {
  return url.startsWith('about:') ||
         url.startsWith('view-source:') ||
         url.startsWith('chrome:') ||
         url.startsWith('moz-extension:');
}

// Handle keyboard commands from manifest
if (browserAPI.commands) {
  console.log('🔧 BACKGROUND: Setting up enhanced command listener...');

  // Add a global keydown listener for debugging
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', (event) => {
      if (event.ctrlKey && event.shiftKey && (event.key === 'Y' || event.key === 'y')) {
        console.log('🎹 BACKGROUND: Detected Ctrl+Shift+Y keydown in background!');
      }
    });
  }

  browserAPI.commands.onCommand.addListener((command) => {
    console.log('🚨 BACKGROUND: *** RAW COMMAND EVENT FIRED! ***');
    console.log('🎯 BACKGROUND: Command received:', command);
    console.log('🎯 BACKGROUND: Command type:', typeof command);
    console.log('🎯 BACKGROUND: Timestamp:', new Date().toISOString());
    console.log('🎯 BACKGROUND: Available commands should be: open-tab-switcher, open-tab-switcher-ctrl-q');
    console.log('🎯 BACKGROUND: Comparing with "open-tab-switcher":', command === "open-tab-switcher");
    
    if (command === "open-tab-switcher" || command === "open-tab-switcher-ctrl-q") {
      console.log('🚀 BACKGROUND: Command matched! Calling openTabSwitcher()');
      openTabSwitcher();
    } else {
      console.log('❌ BACKGROUND: Command did not match expected values');
      console.log('❌ BACKGROUND: Received command was:', JSON.stringify(command));
    }
  });
  console.log('✅ BACKGROUND: Enhanced command listener registered');
  
  // Debug: Check what commands are actually registered
  if (browserAPI.commands.getAll) {
    browserAPI.commands.getAll((commands) => {
      console.log('🔍 BACKGROUND: Registered commands:', commands);
      commands.forEach(cmd => {
        console.log(`  - Command: "${cmd.name}", Shortcut: "${cmd.shortcut || 'none'}", Description: "${cmd.description || 'none'}"`);
      });
    });
  }
} else {
  console.error('❌ BACKGROUND: Commands API not available');
}

// Function to open tab switcher
function openTabSwitcher() {
  console.log('🚀 BACKGROUND: Opening tab switcher...');
  
  // Get the active tab
  browserAPI.tabs.query({active: true, currentWindow: true}, (tabs) => {
    if (tabs[0]) {
      const activeTab = tabs[0];
      console.log('📍 BACKGROUND: Active tab:', activeTab.url);
      const activeUrl = activeTab.url || '';

      // Restricted pages cannot be injected; open packaged UI instead
      if (isRestrictedUrl(activeUrl)) {
        console.log('⚠️ BACKGROUND: Restricted page, opening packaged switcher UI');
        browserAPI.tabs.create({
          url: browserAPI.runtime.getURL('switcher.html')
        });
        return;
      }
      
      // Try to inject content script with the tab switcher UI
      browserAPI.tabs.executeScript(activeTab.id, {
        code: getTabSwitcherCode()
      }, () => {
        if (browserAPI.runtime.lastError) {
          console.log('⚠️ BACKGROUND: Cannot inject on this page:', browserAPI.runtime.lastError.message);
          // For pages where we can't inject, show a notification
          showNotification('Tab Switcher cannot run on this page (restricted by browser security)');
        } else {
          console.log('✅ BACKGROUND: Tab switcher injected successfully');
        }
      });
    }
  });
}

// Function to show notification for restricted pages
function showNotification(message) {
  if (browserAPI.notifications) {
    browserAPI.notifications.create({
      type: 'basic',
      iconUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23666"/></svg>',
      title: 'Tab Switcher',
      message: message
    });
  }
}

// Function to get the complete tab switcher code as a string
function getTabSwitcherCode() {
  return `
// TAB SWITCHER INJECTED CODE
(function() {
  console.log('🎯 INJECTED: Tab switcher starting...');
  
  // Prevent multiple instances
  if (window.tabSwitcherActive) {
    console.log('⚠️ INJECTED: Tab switcher already active');
    return;
  }
  window.tabSwitcherActive = true;
  
  const browserAPI = typeof browser !== 'undefined' ? browser : chrome;
  let allTabs = [];
  let filteredTabs = [];
  let selectedIndex = 0;
  
  // Get tabs from background script
  browserAPI.runtime.sendMessage({ action: "getTabs" }, (response) => {
    if (response && response.tabs) {
      allTabs = response.tabs;
      filteredTabs = [...allTabs];
      selectedIndex = allTabs.findIndex(tab => tab.active) || 0;
      createTabSwitcherUI();
    } else {
      console.error('❌ INJECTED: Failed to get tabs');
      window.tabSwitcherActive = false;
    }
  });
  
  function createTabSwitcherUI() {
    // Create main popup container
    const popup = document.createElement('div');
    popup.id = 'injected-tab-switcher';
    popup.style.cssText = \`
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
      box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      display: flex;
      flex-direction: column;
      backdrop-filter: blur(20px);
      overflow: hidden;
    \`;
    
    // Create header with search
    const header = document.createElement('div');
    header.style.cssText = \`
      padding: 20px 24px 16px 24px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
      background: rgba(255,255,255,0.02);
    \`;
    
    const title = document.createElement('div');
    title.style.cssText = \`
      font-weight: 600; 
      text-align: center; 
      font-size: 18px; 
      color: rgba(255,255,255,0.9);
      margin-bottom: 12px;
    \`;
    title.textContent = \`Tab Switcher (\${allTabs.length} tabs)\`;
    header.appendChild(title);
    
    const searchBox = document.createElement('input');
    searchBox.type = 'text';
    searchBox.placeholder = 'Search tabs...';
    searchBox.style.cssText = \`
      padding: 14px 20px;
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 12px;
      background: rgba(255,255,255,0.05);
      color: white;
      font-size: 15px;
      outline: none;
      width: 100%;
      box-sizing: border-box;
    \`;
    searchBox.addEventListener('input', filterTabs);
    header.appendChild(searchBox);
    popup.appendChild(header);
    
    // Create tab list
    const tabListContainer = document.createElement('div');
    tabListContainer.id = 'tab-list-container';
    tabListContainer.style.cssText = \`
      flex: 1;
      overflow-y: auto;
      padding: 8px 24px;
      max-height: 60vh;
    \`;
    popup.appendChild(tabListContainer);
    
    // Create instructions
    const instructions = document.createElement('div');
    instructions.style.cssText = \`
      padding: 12px 24px 16px 24px;
      border-top: 1px solid rgba(255,255,255,0.08);
      font-size: 13px;
      color: rgba(255,255,255,0.6);
      text-align: center;
      background: rgba(255,255,255,0.02);
    \`;
    instructions.textContent = '↑↓ Navigate • Enter: Switch • Shift+Enter: Close • X: Close • Esc: Cancel';
    popup.appendChild(instructions);
    
    document.body.appendChild(popup);
    renderTabs();
    searchBox.focus();
    
    // Add global keydown listener
    document.addEventListener('keydown', handleKeydown, true);
  }
  
  function renderTabs() {
    const container = document.getElementById('tab-list-container');
    if (!container) return;
    
    container.innerHTML = '';
    
    filteredTabs.forEach((tab, index) => {
      const tabItem = document.createElement('div');
      const isSelected = index === selectedIndex;
      
      tabItem.style.cssText = \`
        padding: 10px 20px;
        margin: 2px 0;
        background: \${isSelected ? 'linear-gradient(135deg, #007acc, #0056b3)' : 'rgba(255,255,255,0.04)'};
        border-radius: 16px;
        cursor: pointer;
        border: 2px solid \${isSelected ? 'rgba(255,255,255,0.3)' : 'transparent'};
        display: flex;
        align-items: center;
        transition: all 0.2s ease;
      \`;
      
      // Favicon
      const favicon = document.createElement('img');
      favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23666"/></svg>';
      favicon.style.cssText = 'width: 20px; height: 20px; margin-right: 16px; border-radius: 6px;';
      tabItem.appendChild(favicon);
      
      // Tab info
      const tabInfo = document.createElement('div');
      tabInfo.style.cssText = 'flex: 1; min-width: 0;';
      
      const tabTitle = document.createElement('div');
      tabTitle.style.cssText = \`
        font-weight: 600; 
        margin-bottom: 4px; 
        font-size: 15px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        color: rgba(255,255,255,0.9);
      \`;
      tabTitle.textContent = tab.title || 'Untitled';
      tabInfo.appendChild(tabTitle);
      
      const tabUrl = document.createElement('div');
      tabUrl.style.cssText = \`
        font-size: 12px; 
        color: rgba(255,255,255,0.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      \`;
      tabUrl.textContent = tab.url;
      tabInfo.appendChild(tabUrl);
      tabItem.appendChild(tabInfo);
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.cssText = \`
        background: rgba(255,255,255,0.1);
        border: none;
        color: rgba(255,255,255,0.7);
        width: 28px;
        height: 28px;
        border-radius: 14px;
        cursor: pointer;
        font-size: 16px;
        margin-left: 12px;
      \`;
      closeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(tab.id);
      });
      tabItem.appendChild(closeBtn);
      
      // Click handler
      tabItem.addEventListener('click', () => {
        switchToTab(tab.id);
      });
      
      container.appendChild(tabItem);
    });
  }
  
  function filterTabs() {
    const searchBox = document.querySelector('#injected-tab-switcher input');
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
  
  function handleKeydown(event) {
    if (!document.getElementById('injected-tab-switcher')) return;
    
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        closePopup();
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        if (selectedIndex > 0) {
          selectedIndex--;
          renderTabs();
        }
        break;
        
      case 'ArrowDown':
        event.preventDefault();
        if (selectedIndex < filteredTabs.length - 1) {
          selectedIndex++;
          renderTabs();
        }
        break;
        
      case 'Enter':
        event.preventDefault();
        if (event.shiftKey && filteredTabs[selectedIndex]) {
          closeTab(filteredTabs[selectedIndex].id);
        } else if (filteredTabs[selectedIndex]) {
          switchToTab(filteredTabs[selectedIndex].id);
        }
        break;
    }
  }
  
  function switchToTab(tabId) {
    browserAPI.runtime.sendMessage({ 
      action: "switchTab", 
      tabId: tabId 
    }, () => {
      closePopup();
    });
  }
  
  function closeTab(tabId) {
    browserAPI.runtime.sendMessage({ 
      action: "closeTab", 
      tabId: tabId 
    }, (response) => {
      if (response && !response.error) {
        allTabs = allTabs.filter(tab => tab.id !== tabId);
        filteredTabs = filteredTabs.filter(tab => tab.id !== tabId);
        
        if (selectedIndex >= filteredTabs.length) {
          selectedIndex = Math.max(0, filteredTabs.length - 1);
        }
        
        renderTabs();
        
        const title = document.querySelector('#injected-tab-switcher div');
        if (title) {
          title.textContent = \`Tab Switcher (\${allTabs.length} tabs)\`;
        }
      }
    });
  }
  
  function closePopup() {
    const popup = document.getElementById('injected-tab-switcher');
    if (popup) {
      popup.remove();
      window.tabSwitcherActive = false;
      console.log('✅ INJECTED: Tab switcher closed');
    }
  }
  
  console.log('✅ INJECTED: Tab switcher ready');
})();
`;
}

// Only handle tab queries - nothing else
browserAPI.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('📨 Background received:', request.action);
  
  if (request.action === "getTabs") {
    console.log('🔍 Getting tabs...');
    browserAPI.tabs.query({}, (tabs) => {
      if (browserAPI.runtime.lastError) {
        console.error('❌ Failed to get tabs:', browserAPI.runtime.lastError);
        sendResponse({ error: browserAPI.runtime.lastError.message });
      } else {
        console.log('✅ Found', tabs.length, 'tabs');
        sendResponse({ tabs: tabs });
      }
    });
    return true; // Keep message channel open
  }
  
  if (request.action === "switchTab") {
    console.log('🎯 Switching to tab:', request.tabId);
    browserAPI.tabs.update(request.tabId, { active: true }, () => {
      if (browserAPI.runtime.lastError) {
        console.error('❌ Failed to switch tab:', browserAPI.runtime.lastError);
        sendResponse({ error: browserAPI.runtime.lastError.message });
      } else {
        console.log('✅ Tab switched successfully');
        sendResponse({ success: true });
      }
    });
    return true;
  }
  
  if (request.action === "closeTab") {
    console.log('🗑️ Closing tab:', request.tabId);
    browserAPI.tabs.remove(request.tabId, () => {
      if (browserAPI.runtime.lastError) {
        console.error('❌ Failed to close tab:', browserAPI.runtime.lastError);
        sendResponse({ error: browserAPI.runtime.lastError.message });
      } else {
        console.log('✅ Tab closed successfully');
        sendResponse({ success: true });
      }
    });
    return true;
  }
});

// Manual test function - call this from console
window.testTabSwitcher = function() {
  console.log('🧪 MANUAL TEST: Calling openTabSwitcher directly...');
  openTabSwitcher();
};

console.log('Tab Switcher ready');
console.log('🧪 MANUAL TEST: You can test by typing: testTabSwitcher() in this console');
