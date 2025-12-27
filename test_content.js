// MINIMAL TEST CONTENT SCRIPT
console.log('🚀 TEST: Content script loaded successfully!');
console.log('🌍 TEST: Page URL:', window.location.href);

// Simple keyboard test
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'q') {
    console.log('🎯 TEST: Ctrl+Q detected!');
    alert('Tab Switcher Test: Ctrl+Q works!');
    event.preventDefault();
  }
});

console.log('✅ TEST: Event listener added');
