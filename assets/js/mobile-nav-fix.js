/**
 * Mobile Navigation Enhancement
 * Path: assets/js/mobile-nav-fix.js
 * 
 * This script carefully enhances (not replaces) the existing navigation functionality
 * by detecting if the native toggle is working, and only adding additional
 * behavior if needed.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for the theme's scripts to initialize
    setTimeout(function() {
      console.log("Mobile navigation enhancement initializing");
      monitorNavigationBehavior();
    }, 1000);
  });
  
  /**
   * Monitor the navigation behavior to determine if it's working properly
   */
  function monitorNavigationBehavior() {
    const toggleButton = document.querySelector('.greedy-nav__toggle');
    const hiddenLinks = document.querySelector('.hidden-links');
    
    if (!toggleButton || !hiddenLinks) {
      console.log("Navigation elements not found, nothing to enhance");
      return;
    }
    
    // Set a flag to track if we've seen the menu toggle work correctly
    let menuWorking = false;
    
    // Add a click monitor rather than replacing the existing handler
    toggleButton.addEventListener('click', function() {
      // Check after a short delay if the menu visibility changed
      setTimeout(function() {
        const isVisible = !hiddenLinks.classList.contains('hidden');
        console.log("Menu visibility state:", isVisible);
        
        // If the menu is visible after clicking, mark as working
        if (isVisible) {
          menuWorking = true;
          console.log("Native menu toggle is working correctly");
        } else if (!menuWorking) {
          // Only apply our fix if we've never seen the menu work
          console.log("Native menu toggle may not be working, attempting enhancement");
          applyMenuFix();
        }
      }, 100);
    });
    
    console.log("Navigation behavior monitor installed");
  }
  
  /**
   * Apply a gentle fix to the menu toggle only if the native behavior isn't working
   */
  function applyMenuFix() {
    const toggleButton = document.querySelector('.greedy-nav__toggle');
    const hiddenLinks = document.querySelector('.hidden-links');
    
    console.log("Applying minimal menu toggle enhancement");
    
    // Add our enhanced toggle handler, being careful not to interfere with existing one
    toggleButton.addEventListener('click', function(e) {
      // Don't stop propagation - let the native handler run too
      
      // Toggle the hidden class manually
      if (hiddenLinks.classList.contains('hidden')) {
        hiddenLinks.classList.remove('hidden');
      } else {
        hiddenLinks.classList.add('hidden');
      }
      
      // Log the state after our change
      console.log("Enhanced toggle applied, menu hidden:", hiddenLinks.classList.contains('hidden'));
    });
    
    // Add a document click handler to close the menu when clicking outside
    document.addEventListener('click', function(e) {
      // Only close if menu is open and click is outside menu and toggle
      if (!hiddenLinks.classList.contains('hidden') && 
          !toggleButton.contains(e.target) && 
          !hiddenLinks.contains(e.target)) {
        hiddenLinks.classList.add('hidden');
      }
    });
  }