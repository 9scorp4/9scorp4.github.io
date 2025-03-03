/**
 * Animation Module
 * Handles scroll-based animations and other animation effects
 */

import DOMUtils from '../utils/dom.js';

const AnimationManager = {
  /**
   * Initialize animation system
   */
  init() {
    this.setupScrollAnimations();
    this.setupPageTransitions();
  },
  
  /**
   * Set up scroll-based animations using IntersectionObserver
   */
  setupScrollAnimations() {
    // Fade in elements when they enter viewport
    const fadeElements = DOMUtils.getAll([
      '.fade-in',
      '.fade-in-up',
      '.fade-in-down',
      '.fade-in-left',
      '.fade-in-right',
      '.scale-in'
    ].join(','));
    
    if (fadeElements.length === 0) return;
    
    // Add visible class via Intersection Observer if supported
    if ('IntersectionObserver' in window) {
      DOMUtils.observe([
        '.fade-in',
        '.fade-in-up',
        '.fade-in-down',
        '.fade-in-left',
        '.fade-in-right',
        '.scale-in'
      ].join(','), (element, isIntersecting) => {
        if (isIntersecting) {
          DOMUtils.addClass(element, 'visible');
        }
      }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      fadeElements.forEach(element => {
        DOMUtils.addClass(element, 'visible');
      });
    }
    
    // Handle staggered animations
    const staggerContainers = DOMUtils.getAll('[data-stagger="true"]');
    
    staggerContainers.forEach(container => {
      const staggerItems = container.querySelectorAll('[data-stagger-item]');
      
      if (!staggerItems.length) return;
      
      // Add stagger delay based on item index
      staggerItems.forEach((item, index) => {
        const delay = index * 0.1; // 100ms between items
        item.style.transitionDelay = `${delay}s`;
      });
      
      // Use Intersection Observer to trigger staggered items
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            staggerItems.forEach(item => {
              DOMUtils.addClass(item, 'visible');
            });
            observer.unobserve(container);
          }
        }, {
          threshold: 0.1,
          rootMargin: '0px 0px -50px 0px'
        });
        
        observer.observe(container);
      } else {
        // Fallback for browsers without IntersectionObserver
        staggerItems.forEach(item => {
          DOMUtils.addClass(item, 'visible');
        });
      }
    });
    
    // Setup "back to top" button
    this.setupBackToTopButton();
  },
  
  /**
   * Handle page transitions
   */
  setupPageTransitions() {
    // Add initial transition on page load
    document.addEventListener('DOMContentLoaded', () => {
      // Add a small delay to ensure all resources are loaded
      setTimeout(() => {
        // Fade in main content
        const mainContent = DOMUtils.get('.page__content, .archive__content');
        if (mainContent) {
          DOMUtils.addClass(mainContent, 'fade-in');
          DOMUtils.addClass(mainContent, 'visible');
        }
      }, 100);
    });
  },
  
  /**
   * Setup "back to top" button
   */
  setupBackToTopButton() {
    // Create back to top button if it doesn't exist
    let backToTop = DOMUtils.get('.back-to-top');
    
    if (!backToTop) {
      backToTop = DOMUtils.create('a', {
        className: 'back-to-top',
        href: '#site-top',
        'aria-label': 'Back to top'
      }, '<i class="fas fa-arrow-up" aria-hidden="true"></i>');
      
      document.body.appendChild(backToTop);
      
      // Add ID to top of page if needed
      if (!document.getElementById('site-top')) {
        const firstElement = document.body.firstElementChild;
        firstElement.id = 'site-top';
      }
    }
    
    // Show/hide button based on scroll position
    const toggleBackToTopButton = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      
      if (scrollY > 300) {
        DOMUtils.addClass(backToTop, 'visible');
      } else {
        DOMUtils.removeClass(backToTop, 'visible');
      }
    };
    
    // Add scroll listener for back to top button
    window.addEventListener('scroll', toggleBackToTopButton);
    
    // Smooth scroll to top when button is clicked
    DOMUtils.on(backToTop, 'click', (e) => {
      e.preventDefault();
      
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
    
    // Initial check
    toggleBackToTopButton();
  }
};

export default AnimationManager;