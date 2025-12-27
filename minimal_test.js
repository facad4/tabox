// MINIMAL TEST CONTENT SCRIPT
console.log('🧪 MINIMAL TEST: Content script loaded successfully!');
console.log('🧪 MINIMAL TEST: Page URL:', window.location.href);
console.log('🧪 MINIMAL TEST: Document ready state:', document.readyState);

// Test keyboard listener
document.addEventListener('keydown', (event) => {
  if (event.ctrlKey && event.key === 'q') {
    console.log('🧪 MINIMAL TEST: Ctrl+Q detected!');
    alert('MINIMAL TEST: Ctrl+Q works! Content script is running.');
    event.preventDefault();
  }
});

console.log('🧪 MINIMAL TEST: Event listener added - press Ctrl+Q to test');
