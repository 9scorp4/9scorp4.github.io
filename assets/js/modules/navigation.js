/**
 * Navigation Module
 * Handles main navigation functionality, mobile menu, and active states
 */

import DOMUtils from '../utils/dom.js';

const Navigation = {
  /**
   * Initialize navigation functionality
   */
  init() {
    this.setupMobileNavigation();
    this.setupActiveLinks();
    this.setupSmoothScrolling();
    this.setupGreedyNavigation();
  },
  
  /**
   * Set up mobile navigation toggle
   */
  setupMobileNavigation() {
    const navToggle = DOMUtils.get('.greedy-nav__toggle');
    const visibleLinks = DOMUtils.get('.visible-links');
    
    if (!navToggle || !visibleLinks) return;
    
    // Toggle menu when button is clicked
    DOMUtils.on(navToggle, 'click', (e) => {
      e.preventDefault();
      
      const isExpanded = navToggle.getAttribute('aria-expanded') === 'true';
      
      // Toggle button state
      navToggle.setAttribute('aria-expanded', !isExpanded);
      DOMUtils.toggleClass(navToggle, 'close', !isExpanded);
      
      // Toggle menu visibility
      DOMUtils.toggleClass(visibleLinks, 'show', !isExpanded);
    });
    
    // Close menu when clicking outside
    DOMUtils.on(document, 'click', (e) => {
      if (!navToggle.contains(e.target) && !visibleLinks.contains(e.target)) {
        navToggle.setAttribute('aria-expanded', 'false');
        DOMUtils.removeClass(navToggle, 'close');
        DOMUtils.removeClass(visibleLinks, 'show');
      }
    });
    
    // Setup proper accessibility attributes
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-controls', 'navLinks');
    visibleLinks.id = 'navLinks';
  },
  
  /**
   * Highlight active navigation links based on current URL
   */
  setupActiveLinks() {
    const currentPath = window.location.pathname;
    const navLinks = DOMUtils.getAll('.visible-links a, .nav__items a');
    
    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      
      // Mark link as active if it matches current path
      // or if the current path is a sub-path of the link
      if (currentPath === linkPath || 
          (currentPath.startsWith(linkPath) && linkPath !== '/')) {
        DOMUtils.addClass(link, 'active');
        link.setAttribute('aria-current', 'page');
      }
    });
  },
  
  /**
   * Enable smooth scrolling for anchor links
   */
  setupSmoothScrolling() {
    DOMUtils.on(document, 'click', 'a[href^="#"]:not([href="#"])', function(e) {
      e.preventDefault();
      
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      if (targetElement) {
        // Scroll to target element
        targetElement.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Update URL hash without triggering scroll
        history.pushState(null, null, targetId);
      }
    });
  },
  
  /**
   * Set up the greedy navigation for handling overflow
   */
  setupGreedyNavigation() {
    const $nav = DOMUtils.get('.greedy-nav');
    
    if (!$nav) return;
    
    const $btn = DOMUtils.create('button', {
      className: 'greedy-nav__toggle hidden',
      type: 'button'
    }, '<span class="navicon"></span>');
    
    const $vlinks = DOMUtils.get('.visible-links', $nav);
    const $hlinks = DOMUtils.get('.hidden-links', $nav);
    
    // If hidden links don't exist, create them
    if (!$hlinks) {
      const $hiddenLinksList = DOMUtils.create('ul', { 
        className: 'hidden-links hidden' 
      });
      $nav.appendChild($hiddenLinksList);
    }
    
    // If the toggle button doesn't exist, add it
    if (!DOMUtils.get('.greedy-nav__toggle', $nav)) {
      $nav.insertBefore($btn, $nav.querySelector('.hidden-links'));
    }
    
    // Now get/re-get the elements
    const $hlinks2 = DOMUtils.get('.hidden-links', $nav);
    const $vlinks2 = DOMUtils.get('.visible-links', $nav);
    const $btn2 = DOMUtils.get('.greedy-nav__toggle', $nav);
    
    if (!$vlinks2 || !$hlinks2 || !$btn2) return;
    
    // Get the width of the navbar
    const navWidth = $nav.offsetWidth;
    
    // Get the width of the logo and toggle button
    let breaks = [];
    let remainingSpace, availableSpace, numOfVisibleItems;
    
    // Get initial state
    const updateNav = () => {
      // Get the width of the visible links container
      const navContainerWidth = $vlinks2.offsetWidth;
      
      // Get all visible links first
      const $visibleLinks = $vlinks2.querySelectorAll('li');
      
      // Calculate all visible links width
      let visibleLinksWidth = 0;
      $visibleLinks.forEach(link => {
        visibleLinksWidth += link.offsetWidth;
      });
      
      // Calculate how much space is available
      availableSpace = navContainerWidth - 10; // Small buffer
      
      // If there's not enough space
      if (visibleLinksWidth > availableSpace) {
        // Move item to hidden links
        const lastVisibleLink = $visibleLinks[$visibleLinks.length - 1];
        $hlinks2.insertBefore(lastVisibleLink, $hlinks2.firstChild);
        breaks.push(visibleLinksWidth);
        
        // Show the toggle button
        DOMUtils.removeClass($btn2, 'hidden');
      } else {
        // Check if we can move some items back to visible
        const $hiddenLinks = $hlinks2.querySelectorAll('li');
        
        if ($hiddenLinks.length > 0 && visibleLinksWidth + $hiddenLinks[0].offsetWidth < availableSpace) {
          // Move first hidden item to visible
          $vlinks2.appendChild($hiddenLinks[0]);
          breaks.pop();
        }
        
        // Hide toggle button if no hidden links remain
        if ($hlinks2.querySelectorAll('li').length === 0) {
          DOMUtils.addClass($btn2, 'hidden');
          DOMUtils.addClass($hlinks2, 'hidden');
        }
      }
    };
    
    // Initial check
    updateNav();
    
    // Update on window resize
    window.addEventListener('resize', updateNav);
    
    // Toggle hidden links when button is clicked
    DOMUtils.on($btn2, 'click', (e) => {
      e.preventDefault();
      DOMUtils.toggleClass($hlinks2, 'hidden');
    });
    
    // Close hidden links when clicking outside
    DOMUtils.on(document, 'click', (e) => {
      if (!$nav.contains(e.target)) {
        DOMUtils.addClass($hlinks2, 'hidden');
      }
    });
  }
};

export default Navigation;