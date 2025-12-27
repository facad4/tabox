// Entry point for the packaged tab switcher page
(function() {
  console.log('🪟 SWITCHER PAGE: Initializing');

  function start() {
    if (typeof createTabSwitcher === 'function') {
      console.log('🪟 SWITCHER PAGE: Launching tab switcher UI');
      createTabSwitcher();
    } else {
      console.error('❌ SWITCHER PAGE: createTabSwitcher not found. Ensure content.js is loaded.');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

