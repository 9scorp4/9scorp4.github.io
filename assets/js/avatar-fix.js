/**
 * Avatar Display Fix
 * Path: assets/js/avatar-fix.js
 * 
 * This script ensures consistent avatar display by finding and fixing
 * problematic avatar elements that CSS alone might not catch.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for complete page load
    setTimeout(function() {
      console.log("Avatar display fix running");
      
      // Fix avatar elements
      fixAvatarImages();
      fixAvatarContainers();
      
      console.log("Avatar display fix complete");
    }, 700);
  });
  
  /**
   * Finds and fixes avatar images throughout the page
   */
  function fixAvatarImages() {
    // Use multiple selectors to catch different avatar implementations
    const avatarSelectors = [
      '.author__avatar img',
      'img.avatar',
      '.avatar img',
      'img[alt*="Nicolas"]',
      'img[alt*="profile"]',
      '.page__content img[src*="profile"]',
      '.sidebar img[src*="profile"]'
    ];
    
    // Find all avatar images
    const avatarQuery = avatarSelectors.join(', ');
    const avatarImages = document.querySelectorAll(avatarQuery);
    
    console.log(`Found ${avatarImages.length} potential avatar images to fix`);
    
    // Apply fixes to each avatar image
    avatarImages.forEach(function(img, index) {
      // Set proper styling
      img.style.borderRadius = '50%';
      img.style.objectFit = 'cover';
      
      // Get context to determine sizing
      const inSidebar = isElementInSidebar(img);
      const inContent = isElementInMainContent(img);
      
      // Set size based on context
      if (inSidebar) {
        img.style.width = '120px';
        img.style.height = '120px';
      } else if (inContent) {
        img.style.width = '80px';
        img.style.height = '80px';
      } else {
        // Default size
        img.style.width = '100px';
        img.style.height = '100px';
      }
      
      // Add border
      img.style.border = '2px solid #3498DB';
      
      // Fix aspect ratio issues
      img.setAttribute('width', img.style.width);
      img.setAttribute('height', img.style.height);
      
      console.log(`Fixed avatar image ${index + 1}${inSidebar ? ' (sidebar)' : ''}${inContent ? ' (content)' : ''}`);
    });
  }
  
  /**
   * Fixes avatar container elements
   */
  function fixAvatarContainers() {
    // Find avatar containers
    const avatarContainers = document.querySelectorAll('.author__avatar');
    
    console.log(`Found ${avatarContainers.length} avatar containers to fix`);
    
    // Fix each container
    avatarContainers.forEach(function(container, index) {
      // Fix container styling
      container.style.width = 'auto';
      container.style.height = 'auto';
      container.style.display = 'flex';
      container.style.justifyContent = 'center';
      container.style.alignItems = 'center';
      container.style.overflow = 'hidden';
      
      // Add margin for spacing
      container.style.margin = '0 auto 1rem';
      
      // If container is empty or only has whitespace, add fallback
      if (!container.innerHTML.trim()) {
        addFallbackAvatar(container);
      }
      
      console.log(`Fixed avatar container ${index + 1}`);
    });
  }
  
  /**
   * Adds a fallback avatar with initials if image is missing
   */
  function addFallbackAvatar(container) {
    // Create a fallback element
    const fallback = document.createElement('div');
    fallback.textContent = 'NA'; // Nicolas Arias initials
    
    // Style the fallback
    fallback.style.width = '100px';
    fallback.style.height = '100px';
    fallback.style.borderRadius = '50%';
    fallback.style.backgroundColor = '#3498DB';
    fallback.style.color = 'white';
    fallback.style.display = 'flex';
    fallback.style.justifyContent = 'center';
    fallback.style.alignItems = 'center';
    fallback.style.fontWeight = 'bold';
    fallback.style.fontSize = '2rem';
    
    // Add to container
    container.appendChild(fallback);
    console.log("Added fallback avatar with initials");
  }
  
  /**
   * Helper to check if element is in the sidebar
   */
  function isElementInSidebar(element) {
    return element.closest('.sidebar') !== null;
  }
  
  /**
   * Helper to check if element is in the main content
   */
  function isElementInMainContent(element) {
    return element.closest('.page__content') !== null || 
           element.closest('article.page') !== null;
  }