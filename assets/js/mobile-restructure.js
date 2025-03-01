/**
 * Mobile DOM Restructuring
 * Path: assets/js/mobile-restructure.js
 * 
 * This script handles mobile-specific DOM restructuring to ensure
 * proper layout flow on small screens, without affecting desktop view.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for full page load
    setTimeout(function() {
      console.log("Mobile DOM restructuring running");
      
      // First detect if we're on mobile
      const isMobile = window.innerWidth < 768;
      
      if (isMobile) {
        console.log("Mobile view detected, applying mobile-specific fixes");
        restructureMobileLayout();
      }
      
      // Also add a resize listener to handle orientation changes
      window.addEventListener('resize', function() {
        const isMobileNow = window.innerWidth < 768;
        
        if (isMobileNow) {
          restructureMobileLayout();
        } else {
          // If switching to desktop, we could restore original structure if needed
          // But that's more complex and might not be necessary
        }
      });
    }, 500);
  });
  
  /**
   * Restructures the DOM for optimal mobile layout
   */
  function restructureMobileLayout() {
    // Step 1: Fix the header area
    fixMobileHeader();
    
    // Step 2: Fix author profile area
    fixMobileAuthorProfile();
    
    // Step 3: Fix content flow
    fixMobileContentFlow();
    
    // Step 4: Fix navigation elements
    fixMobileNavigation();
    
    // Step 5: Remove connect button (new step)
    removeConnectButton();
    
    // Log completion
    console.log("Mobile DOM restructuring complete");
  }
  
  /**
   * Completely removes the Connect button from the DOM
   */
  function removeConnectButton() {
    // Find all possible connect button instances using different selectors
    const connectButtons = document.querySelectorAll('.connect, a.connect, a[href="#connect"], #connect');
    
    // Remove each button from the DOM
    connectButtons.forEach(function(button) {
      if (button && button.parentNode) {
        button.parentNode.removeChild(button);
        console.log("Removed Connect button from DOM");
      }
    });
  }
  
  /**
   * Fixes issues with the header area on mobile
   */
  function fixMobileHeader() {
    // Ensure header is visible and properly sized
    const masthead = document.querySelector('.masthead');
    if (masthead) {
      masthead.style.display = 'block';
      masthead.style.width = '100%';
    }
    
    // Fix breadcrumbs on mobile
    const breadcrumbs = document.querySelector('.breadcrumbs');
    if (breadcrumbs) {
      breadcrumbs.style.fontSize = '0.8rem';
      breadcrumbs.style.whiteSpace = 'normal';
    }
  }
  
  /**
   * Fixes author profile area for mobile view
   */
  function fixMobileAuthorProfile() {
    // Find author profile elements
    const authorAvatar = document.querySelector('.author__avatar');
    const authorContent = document.querySelector('.author__content');
    
    // If both exist, ensure proper structure
    if (authorAvatar && authorContent) {
      // Make sure avatar is before content for mobile
      const parent = authorAvatar.parentNode;
      
      // Only reposition if needed
      if (parent && parent.contains(authorContent) && authorAvatar.nextElementSibling !== authorContent) {
        parent.insertBefore(authorAvatar, authorContent);
        console.log("Repositioned avatar before author content");
      }
      
      // Ensure avatar has proper styling
      const avatarImg = authorAvatar.querySelector('img');
      if (avatarImg) {
        avatarImg.style.borderRadius = '50%';
        avatarImg.style.width = '80px';
        avatarImg.style.height = '80px';
        avatarImg.style.margin = '0 auto';
        avatarImg.style.display = 'block';
        avatarImg.style.border = '2px solid #3498DB';
      }
      
      // Center author content
      if (authorContent) {
        authorContent.style.textAlign = 'center';
      }
    }
    
    // No more Connect button styling here
  }
  
  /**
   * Fixes content flow for mobile view
   */
  function fixMobileContentFlow() {
    // Get main container
    const main = document.getElementById('main');
    if (!main) return;
    
    // Ensure main has flex display for mobile
    main.style.display = 'flex';
    main.style.flexDirection = 'column';
    
    // Make sure sidebar comes before content (reversing previous approach)
    const content = document.querySelector('article.page, .archive');
    const sidebar = document.querySelector('.sidebar');
    
    if (content && sidebar && main.contains(content) && main.contains(sidebar)) {
      // If content is before sidebar, reposition (reverse the previous logic)
      if (sidebar.compareDocumentPosition(content) & Node.DOCUMENT_POSITION_PRECEDING) {
        main.insertBefore(sidebar, content);
        console.log("Repositioned sidebar before content for mobile");
      }
    }
    
    // Ensure toggle menu is in the right position
    const toggleMenu = document.querySelector('.toggle-menu, button.toggle-menu');
    if (toggleMenu) {
      toggleMenu.style.margin = '1rem auto';
      toggleMenu.style.display = 'block';
    }
  }
  
  /**
   * Fixes navigation elements for mobile view
   */
  function fixMobileNavigation() {
    // Make navigation links centered on mobile
    const navLinks = document.querySelectorAll('.nav__items a');
    navLinks.forEach(function(link) {
      link.style.textAlign = 'center';
      link.style.display = 'block';
    });
    
    // Fix navigation section headings
    const navHeadings = document.querySelectorAll('.nav__sub-title, .sidebar h3');
    navHeadings.forEach(function(heading) {
      heading.style.textAlign = 'center';
      heading.style.fontSize = '1rem';
      heading.style.margin = '1rem 0 0.5rem';
    });
    
    // Ensure local/social links display properly
    const socialLinks = document.querySelectorAll('.author__urls li');
    socialLinks.forEach(function(link) {
      link.style.marginBottom = '0.5rem';
    });
  }