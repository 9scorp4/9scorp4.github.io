/**
 * Compact Sidebar Navigation Fix
 * Path: assets/js/sidebar-nav-fix.js
 * 
 * This script ensures a compact sidebar navigation with minimal spacing.
 */

document.addEventListener('DOMContentLoaded', function() {
    // Wait for page to fully load
    setTimeout(function() {
      console.log("Compact Sidebar Navigation Fix running");
      
      // Apply compact styling to navigation links
      compactSidebarLinks();
      
      // Clean up any remaining spacing issues
      removeExcessSpacing();
      
      console.log("Sidebar Navigation Fix complete");
    }, 600);
  });
  
  /**
   * Applies compact styling to sidebar navigation links
   */
  function compactSidebarLinks() {
    // Target all sidebar navigation links
    const navLinks = document.querySelectorAll('.sidebar .nav__items a');
    
    navLinks.forEach(function(link) {
      // Apply compact styling to all links
      link.style.padding = '0.25rem 0';
      link.style.marginBottom = '0.1rem';
      link.style.fontSize = '0.85rem';
      link.style.display = 'block';
      
      // Determine if this is a main section link
      if (isMainSectionLink(link)) {
        // Main section links (ABOUT, PROJECTS, etc.)
        link.style.textTransform = 'uppercase';
        link.style.fontWeight = 'bold';
        link.style.fontSize = '0.8rem';
        link.style.color = '#536b7a';
        link.style.letterSpacing = '0.5px';
        link.style.marginTop = '0.5rem';
      }
    });
    
    // Fix section headers
    const headers = document.querySelectorAll('.sidebar h3, .sidebar .nav__sub-title');
    headers.forEach(function(header) {
      header.style.margin = '0.75rem 0 0.25rem';
      header.style.padding = '0 0 0.15rem 0';
      header.style.fontSize = '0.85rem';
      header.style.color = '#536b7a';
      header.style.borderBottom = 'none';
    });
  }
  
  /**
   * Removes any excess spacing in the sidebar
   */
  function removeExcessSpacing() {
    // Fix list item spacing
    const listItems = document.querySelectorAll('.sidebar .nav__items li');
    listItems.forEach(function(item) {
      item.style.marginBottom = '0.25rem';
      item.style.lineHeight = '1.1';
    });
    
    // Remove unnecessary borders and dividers
    const dividers = document.querySelectorAll('.sidebar hr, .sidebar .nav__items li:after');
    dividers.forEach(function(divider) {
      divider.style.display = 'none';
    });
    
    // Fix sidebar container spacing
    const sidebar = document.querySelector('.sidebar');
    if (sidebar) {
      sidebar.style.padding = '0.5rem';
      sidebar.style.backgroundColor = 'transparent';
      sidebar.style.boxShadow = 'none';
    }
  }
  
  /**
   * Checks if a link is a main section link
   */
  function isMainSectionLink(link) {
    const href = link.getAttribute('href') || '';
    const mainSections = ['/about/', '/ecosystem/', '/projects/', '/blog/', '/knowledge-hub/', '/cv/', '/professional/'];
    
    // Check if the link points to one of the main sections
    return mainSections.some(section => href.includes(section));
  }