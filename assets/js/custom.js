/**
 * Custom JavaScript for 9scorp4.github.io
 * 
 * This file provides backward compatibility with existing code.
 * Most functionality is now modularized in main.js and its imports,
 * but this file serves as a bridge for any code expecting the old structure.
 */

// This file is intentionally minimal. Real functionality has been moved
// to our modular js system in main.js and its supporting modules.
// Adding code here should be avoided unless necessary for compatibility.

document.addEventListener('DOMContentLoaded', function() {
    // Legacy code compatibility (if needed)
    if (typeof jQuery !== 'undefined') {
      // Support for Minimal Mistakes jQuery-based functions
      $(document).ready(function() {
        // Forward any necessary jQuery events to our vanilla JS system
        // This is a compatibility layer for any jQuery-dependent code
      });
    }
    
    // Load diagnostic tools in debug mode
    if (window.location.search.includes('debug=true')) {
      const script = document.createElement('script');
      script.src = '/assets/js/diagnostics.js';
      script.async = true;
      document.body.appendChild(script);
    }
  });