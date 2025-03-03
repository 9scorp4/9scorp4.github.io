/**
 * Responsive Module
 * Handles responsive layout adjustments and optimizations
 */

import DOMUtils from '../utils/dom.js';

const ResponsiveManager = {
  // Store current breakpoint
  currentBreakpoint: null,
  
  // Breakpoint definitions (should match CSS)
  breakpoints: {
    xs: 0,
    sm: 576,
    md: 768,
    lg: 992,
    xl: 1200
  },
  
  /**
   * Initialize responsive functionality
   */
  init() {
    this.detectBreakpoint();
    this.setupResponsiveListeners();
    this.adjustHeroHeight();
    this.setupVideoBackground();
    this.setupResponsiveTables();
    this.addNoJSFallbacks();
  },
  
  /**
   * Detect current breakpoint based on window width
   */
  detectBreakpoint() {
    const width = window.innerWidth;
    let breakpoint;
    
    if (width < this.breakpoints.sm) {
      breakpoint = 'xs';
    } else if (width < this.breakpoints.md) {
      breakpoint = 'sm';
    } else if (width < this.breakpoints.lg) {
      breakpoint = 'md';
    } else if (width < this.breakpoints.xl) {
      breakpoint = 'lg';
    } else {
      breakpoint = 'xl';
    }
    
    // Store current breakpoint for reference
    this.currentBreakpoint = breakpoint;
    
    // Add breakpoint class to body (useful for debugging and CSS tweaks)
    document.body.classList.remove('breakpoint-xs', 'breakpoint-sm', 'breakpoint-md', 'breakpoint-lg', 'breakpoint-xl');
    document.body.classList.add(`breakpoint-${breakpoint}`);
    
    return breakpoint;
  },
  
  /**
   * Setup event listeners for responsive adjustments
   */
  setupResponsiveListeners() {
    // Update on window resize with debounce
    let resizeTimer;
    
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newBreakpoint = this.detectBreakpoint();
        
        // Execute breakpoint-specific code only when breakpoint changes
        if (newBreakpoint !== this.currentBreakpoint) {
          this.handleBreakpointChange(newBreakpoint);
        }
        
        // Always run these adjustments on resize
        this.adjustHeroHeight();
      }, 250); // Wait 250ms after resize stops
    });
    
    // Handle orientation change on mobile devices
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.detectBreakpoint();
        this.adjustHeroHeight();
      }, 200);
    });
  },
  
  /**
   * Handle functionality that needs to change when breakpoint changes
   * @param {string} newBreakpoint - The new detected breakpoint
   */
  handleBreakpointChange(newBreakpoint) {
    const prevBreakpoint = this.currentBreakpoint;
    this.currentBreakpoint = newBreakpoint;
    
    // Switching to mobile view
    if (this.isMobileBreakpoint(newBreakpoint) && !this.isMobileBreakpoint(prevBreakpoint)) {
      this.switchToMobileView();
    }
    
    // Switching to desktop view
    if (!this.isMobileBreakpoint(newBreakpoint) && this.isMobileBreakpoint(prevBreakpoint)) {
      this.switchToDesktopView();
    }
  },
  
  /**
   * Check if breakpoint is mobile (xs or sm)
   * @param {string} breakpoint - Breakpoint to check
   * @return {boolean} - Whether it's a mobile breakpoint
   */
  isMobileBreakpoint(breakpoint) {
    return breakpoint === 'xs' || breakpoint === 'sm';
  },
  
  /**
   * Adjustments when switching to mobile view
   */
  switchToMobileView() {
    // Handle sidebar in mobile view
    const sidebar = DOMUtils.get('.sidebar');
    if (sidebar) {
      DOMUtils.removeClass(sidebar, 'sticky');
    }
    
    // Reset any desktop-specific functionality
    const authorProfileButton = DOMUtils.get('.author__urls-wrapper button');
    if (authorProfileButton) {
      authorProfileButton.removeAttribute('aria-expanded');
    }
    
    // Other mobile-specific adjustments as needed
  },
  
  /**
   * Adjustments when switching to desktop view
   */
  switchToDesktopView() {
    // Handle sidebar in desktop view
    const sidebar = DOMUtils.get('.sidebar');
    if (sidebar) {
      DOMUtils.addClass(sidebar, 'sticky');
    }
    
    // Reset any mobile navigation states
    const navToggle = DOMUtils.get('.greedy-nav__toggle');
    const visibleLinks = DOMUtils.get('.visible-links');
    
    if (navToggle && visibleLinks) {
      navToggle.setAttribute('aria-expanded', 'false');
      DOMUtils.removeClass(navToggle, 'close');
      DOMUtils.removeClass(visibleLinks, 'show');
    }
    
    // Other desktop-specific adjustments as needed
  },
  
  /**
   * Adjust hero video/image height based on screen size
   */
  adjustHeroHeight() {
    const heroVideo = DOMUtils.get('.page__hero--video');
    
    if (heroVideo) {
      if (this.isMobileBreakpoint(this.currentBreakpoint)) {
        DOMUtils.css(heroVideo, 'height', '50vh');
      } else {
        DOMUtils.css(heroVideo, 'height', '65vh');
      }
    }
  },
  
  /**
   * Setup responsive video background handling
   */
  setupVideoBackground() {
    const heroVideo = DOMUtils.get('.page__hero--video video');
    
    if (!heroVideo) return;
    
    // Adjust video for mobile devices
    if ('ontouchstart' in window) {
      // Some mobile devices have issues with video playback
      heroVideo.setAttribute('playsinline', '');
      heroVideo.muted = true;
      heroVideo.setAttribute('muted', '');
      
      // Fix for iOS
      document.addEventListener('touchstart', () => {
        heroVideo.play();
      }, { once: true });
    }
    
    // Add poster attribute if not present
    if (!heroVideo.hasAttribute('poster')) {
      const fallbackImage = DOMUtils.get('.page__hero--video').dataset.fallbackImage;
      if (fallbackImage) {
        heroVideo.setAttribute('poster', fallbackImage);
      }
    }
    
    // Pause video when not in viewport to save resources
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            heroVideo.play();
          } else {
            heroVideo.pause();
          }
        });
      }, { threshold: 0.1 });
      
      observer.observe(heroVideo);
    }
  },
  
  /**
   * Make tables responsive by wrapping them
   */
  setupResponsiveTables() {
    // Find tables that aren't already responsive
    const tables = DOMUtils.getAll('.page__content table:not(.responsive-table)');
    
    tables.forEach(table => {
      // Mark the table as responsive
      DOMUtils.addClass(table, 'responsive-table');
      
      // Skip if table is already in a wrapper
      if (table.parentNode.classList.contains('table-wrapper')) return;
      
      // Create responsive wrapper
      const wrapper = DOMUtils.create('div', {
        className: 'table-wrapper'
      });
      
      // Replace table with wrapper containing table
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  },
  
  /**
   * Add fallbacks for browsers with JavaScript disabled
   * (These will be overridden when JS is enabled)
   */
  addNoJSFallbacks() {
    // Remove no-js class from html element
    document.documentElement.classList.remove('no-js');
    document.documentElement.classList.add('js');
    
    // Make all animated elements visible for no-js
    DOMUtils.getAll('.fade-in, .fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right, .scale-in').forEach(element => {
      element.classList.add('no-js-visible');
    });
  }
};

export default ResponsiveManager;