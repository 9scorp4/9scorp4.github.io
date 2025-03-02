/**
 * Main JavaScript Entry Point
 * 
 * Main application initialization that coordinates all modules
 * Uses a systems-oriented approach with modular design
 */

// Import modules
import DOMUtils from './utils/dom.js';
import AnimationManager from './modules/animations.js';
import Navigation from './modules/navigation.js';
import Ecosystem from './modules/ecosystem.js';
import ResponsiveManager from './modules/responsive.js';

/**
 * Main application class
 * Uses systems thinking approach to integrate components
 */
class App {
  /**
   * Initialize the application
   */
  constructor() {
    // Store whether debug mode is active
    this.debugMode = this.getQueryParam('debug') === 'true';
    
    // Add debug class to body if needed
    if (this.debugMode) {
      document.body.classList.add('debug-mode');
    }
    
    // Initialize when DOM is ready
    this.initWhenReady();
  }
  
  /**
   * Initialize app when DOM is ready
   */
  initWhenReady() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }
  
  /**
   * Main initialization method
   */
  init() {
    // Initialize all modules in proper order
    this.initializeModules();
    
    // Set up page-specific functionality
    this.setupPageSpecificBehavior();
    
    // Log initialization in development mode
    if (this.debugMode) {
      console.log('Portfolio site initialized in debug mode');
      this.logSystemDiagnostics();
    }
  }
  
  /**
   * Initialize all modules in the correct order
   * This follows a systems thinking approach by considering dependencies
   */
  initializeModules() {
    // First: Initialize responsive system (this affects everything else)
    ResponsiveManager.init();
    
    // Second: Initialize navigation system
    Navigation.init();
    
    // Third: Initialize animation system (affects visual appearance)
    AnimationManager.init();
    
    // Fourth: Initialize ecosystem visualization
    Ecosystem.init();
    
    // Add any additional module initialization here
  }
  
  /**
   * Set up functionality specific to current page template
   */
  setupPageSpecificBehavior() {
    // Determine current page/template
    const bodyClasses = document.body.className;
    
    // Home page specific
    if (bodyClasses.includes('layout--home')) {
      this.setupHomePage();
    }
    
    // Blog page specific
    if (bodyClasses.includes('layout--archive') && window.location.pathname.includes('/blog/')) {
      this.setupBlogPage();
    }
    
    // Project page specific
    if (bodyClasses.includes('layout--single') && window.location.pathname.includes('/projects/')) {
      this.setupProjectPage();
    }
    
    // Ecosystem page specific
    if (window.location.pathname.includes('/ecosystem/')) {
      this.setupEcosystemPage();
    }
  }
  
  /**
   * Home page specific setup
   */
  setupHomePage() {
    // Add any home page specific functionality here
    // This is a placeholder for future customizations
  }
  
  /**
   * Blog page specific setup
   */
  setupBlogPage() {
    // Set up category filtering on blog page
    const categoryBtns = DOMUtils.getAll('.category-btn');
    const postCards = DOMUtils.getAll('.post-card');
    
    if (categoryBtns.length && postCards.length) {
      categoryBtns.forEach(btn => {
        DOMUtils.on(btn, 'click', () => {
          // Remove active class from all buttons
          categoryBtns.forEach(b => DOMUtils.removeClass(b, 'active'));
          
          // Add active class to clicked button
          DOMUtils.addClass(btn, 'active');
          
          const category = btn.dataset.category;
          
          // Show/hide posts based on category
          postCards.forEach(card => {
            if (category === 'all') {
              DOMUtils.css(card, 'display', 'block');
            } else {
              if (DOMUtils.hasClass(card, category)) {
                DOMUtils.css(card, 'display', 'block');
              } else {
                DOMUtils.css(card, 'display', 'none');
              }
            }
          });
        });
      });
    }
  }
  
  /**
   * Project page specific setup
   */
  setupProjectPage() {
    // Add any project page specific functionality here
    // This is a placeholder for future customizations
  }
  
  /**
   * Ecosystem page specific setup
   */
  setupEcosystemPage() {
    // Special handling for ecosystem diagram SVG if present
    const ecosystemDiagram = DOMUtils.get('.research-ecosystem-diagram svg');
    
    if (ecosystemDiagram) {
      // Apply system-specific animations for ecosystem diagram
      this.setupEcosystemDiagramInteractivity(ecosystemDiagram);
    }
  }
  
  /**
   * Add interactivity to the ecosystem diagram SVG
   * @param {Element} svg - The ecosystem diagram SVG element
   */
  setupEcosystemDiagramInteractivity(svg) {
    // Get all nodes in the SVG (circles)
    const nodes = svg.querySelectorAll('circle');
    
    if (nodes.length === 0) return;
    
    // Add hover effects to nodes
    nodes.forEach(node => {
      node.addEventListener('mouseenter', function() {
        this.style.transform = 'scale(1.1)';
        this.style.transformOrigin = 'center';
        this.style.transition = 'transform 0.3s ease';
      });
      
      node.addEventListener('mouseleave', function() {
        this.style.transform = 'scale(1)';
      });
    });
  }
  
  /**
   * Log diagnostic information for debugging
   */
  logSystemDiagnostics() {
    console.group('📊 System Diagnostics');
    
    // Log general information
    console.log('Page:', window.location.pathname);
    console.log('Timestamp:', new Date().toISOString());
    console.log('Viewport:', `${window.innerWidth}px × ${window.innerHeight}px`);
    console.log('Device Pixel Ratio:', window.devicePixelRatio);
    console.log('Breakpoint:', ResponsiveManager.currentBreakpoint);
    
    // Check for critical components
    const criticalComponents = {
      'Header': DOMUtils.get('.masthead'),
      'Navigation': DOMUtils.get('.greedy-nav'),
      'Main Content': DOMUtils.get('#main'),
      'Footer': DOMUtils.get('.page__footer'),
      'Sidebar': DOMUtils.get('.sidebar')
    };
    
    console.log('Critical Components:', 
      Object.fromEntries(
        Object.entries(criticalComponents)
          .map(([name, element]) => [name, element ? '✓' : '❌'])
      )
    );
    
    // Log resource loading info
    console.log('Resources:', {
      'Images': document.querySelectorAll('img').length,
      'Scripts': document.querySelectorAll('script').length,
      'Stylesheets': document.querySelectorAll('link[rel="stylesheet"]').length,
      'SVGs': document.querySelectorAll('svg').length
    });
    
    console.groupEnd();
  }
  
  /**
   * Get query parameter value
   * @param {string} name - Parameter name
   * @return {string|null} - Parameter value
   */
  getQueryParam(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
  }
}

// Start the application
new App();