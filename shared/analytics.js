// Vercel Web Analytics initialization
// Based on official Vercel Analytics documentation
(function() {
  window.va = window.va || function () { 
    (window.vaq = window.vaq || []).push(arguments); 
  };
  
  var script = document.createElement('script');
  script.defer = true;
  script.src = '/_vercel/insights/script.js';
  
  // Add script to head or body when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      document.head.appendChild(script);
    });
  } else {
    document.head.appendChild(script);
  }
})();
