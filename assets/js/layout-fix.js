/**
 * DOM Layout Fix - Updated to preserve sidebar functionality
 * This script helps restructure problematic DOM elements
 * while maintaining proper sidebar layout
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for DOM to be fully loaded
    setTimeout(function() {
      console.log("DOM Layout Fix running - sidebar-aware version");
      
      // Check if we're in mobile or desktop mode
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        // Mobile-specific fixes only
        fixToggleMenu();
        fixConnectButton();
      } else {
        // Desktop-specific fixes
        ensureSidebarLayout();
      }
      
      // Fix that applies to both
      fixProfileImage();
      
      console.log("DOM Layout Fix complete");
    }, 500);
  });
  
  /**
   * Fixes issues with profile image
   */
  function fixProfileImage() {
    // Find the problematic avatar - but only in the main content, not sidebar
    const mainContentAvatars = document.querySelectorAll('.page__content .author__avatar:not(.sidebar .author__avatar)');
    
    mainContentAvatars.forEach(function(avatar) {
      // If the avatar doesn't look right (has odd dimensions)
      const img = avatar.querySelector('img');
      if (img) {
        // Force proper dimensions and shape
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
      }
    });
  }
  
  /**
   * Fixes toggle menu issues
   */
  function fixToggleMenu() {
    // Find any toggle menu buttons in the content area (not in the header)
    const toggleButtons = document.querySelectorAll('.page__content .toggle-menu, .page__content button[data-toggle]');
    
    toggleButtons.forEach(function(button) {
      // If it's in the wrong place, hide it
      if (!button.closest('.masthead')) {
        button.style.display = 'none';
      }
    });
  }
  
  /**
   * Fixes Connect button positioning
   */
  function fixConnectButton() {
    const connectButtons = document.querySelectorAll('.connect, a.connect');
    
    connectButtons.forEach(function(button) {
      // Style only if it's not already styled
      if (!button.classList.contains('styled')) {
        button.classList.add('styled');
        button.style.display = 'inline-block';
        button.style.padding = '0.5em 1em';
        button.style.margin = '0.5em 1em';
        button.style.backgroundColor = '#3498DB';
        button.style.color = 'white';
        button.style.borderRadius = '4px';
        button.style.textDecoration = 'none';
        button.style.fontWeight = 'bold';
      }
    });
  }
  
  /**
   * Ensures sidebar is properly positioned in desktop view
   */
  function ensureSidebarLayout() {
    // Get main container
    const mainContent = document.getElementById('main');
    if (!mainContent) return;
    
    // Get sidebar
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    
    // Get main content
    const article = document.querySelector('article.page') || document.querySelector('.archive');
    if (!article) return;
    
    // Ensure proper grid layout
    mainContent.style.display = 'grid';
    mainContent.style.gridTemplateColumns = '1fr 3fr';
    mainContent.style.gap = '2rem';
    
    // Ensure proper element placement
    sidebar.style.gridColumn = '1';
    sidebar.style.gridRow = '1 / span 20';
    article.style.gridColumn = '2';
  }/**
   * DOM Layout Fix
   * This script helps restructure problematic DOM elements
   * to achieve a cleaner layout
   */
  
  document.addEventListener('DOMContentLoaded', function() {
    // Wait for DOM to be fully loaded
    setTimeout(function() {
      console.log("DOM Layout Fix running");
      
      // Fix profile image area
      fixProfileImage();
      
      // Fix toggle menu
      fixToggleMenu();
      
      // Fix connect button
      fixConnectButton();
      
      console.log("DOM Layout Fix complete");
    }, 500);
  });
  
  /**
   * Fixes issues with profile image
   */
  function fixProfileImage() {
    // Find the problematic avatar
    const avatars = document.querySelectorAll('.author__avatar');
    
    avatars.forEach(function(avatar) {
      // If the avatar doesn't look right (has odd dimensions)
      const img = avatar.querySelector('img');
      if (img) {
        // Force proper dimensions and shape
        img.style.width = '80px';
        img.style.height = '80px';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '50%';
      }
      
      // If it's still problematic, hide it
      if (avatar.offsetWidth > 100 || avatar.offsetHeight > 100) {
        avatar.style.display = 'none';
      }
    });
  }
  
  /**
   * Fixes toggle menu issues
   */
  function fixToggleMenu() {
    // Find any toggle menu buttons in the content area (not in the header)
    const toggleButtons = document.querySelectorAll('.page__content .toggle-menu, .page__content button[data-toggle]');
    
    toggleButtons.forEach(function(button) {
      // If it's in the wrong place, hide it
      if (!button.closest('.masthead')) {
        button.style.display = 'none';
      }
    });
  }
  
  /**
   * Fixes Connect button positioning
   */
  function fixConnectButton() {
    const connectButtons = document.querySelectorAll('.connect, a.connect');
    
    connectButtons.forEach(function(button) {
      // Make it a proper button
      button.style.display = 'inline-block';
      button.style.float = 'right';
      button.style.padding = '0.5em 1em';
      button.style.margin = '0.5em 1em';
      button.style.backgroundColor = '#3498DB';
      button.style.color = 'white';
      button.style.borderRadius = '4px';
      button.style.textDecoration = 'none';
      button.style.fontWeight = 'bold';
    });
  }