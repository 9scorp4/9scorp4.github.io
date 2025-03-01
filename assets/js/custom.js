// Custom JavaScript for 9scorp4.github.io
// Implementing systems thinking principles through interactive elements

/**
 * Main initialization function that runs on page load
 * Uses systems thinking approach to handle component interactions
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize interactive components
    initSystemsThinking();
    enhanceNavigation();
    setupAnimations();
    responsiveAdjustments();
    
    // Debug information for development
    if (document.querySelector('body').classList.contains('debug-mode')) {
      console.log('Portfolio site initialized in debug mode');
      logSystemDiagnostics();
    }
  });
  
  /**
   * Enhances navigation with interactive elements and accessibility improvements
   */
  function enhanceNavigation() {
    // Add active class to current navigation item
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav__items a');
    
    navLinks.forEach(link => {
      const linkPath = new URL(link.href).pathname;
      if (currentPath === linkPath || 
          (currentPath.includes(linkPath) && linkPath !== '/')) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
    
    // Add smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
      anchor.addEventListener('click', function(e) {
        const targetId = this.getAttribute('href');
        if (targetId !== '#' && targetId !== '#main') {
          e.preventDefault();
          const targetElement = document.querySelector(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
        }
      });
    });
  }
  
  /**
   * Applies systems thinking principles to interactive elements
   */
  function initSystemsThinking() {
    // Initialize category filtering on blog page
    if (document.querySelector('.category-selector')) {
      const categoryBtns = document.querySelectorAll('.category-btn');
      const postCards = document.querySelectorAll('.post-card');
      
      categoryBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          // Remove active class from all buttons
          categoryBtns.forEach(b => b.classList.remove('active'));
          // Add active class to clicked button
          btn.classList.add('active');
          
          const category = btn.dataset.category;
          
          // Show/hide posts based on category
          postCards.forEach(card => {
            if (category === 'all') {
              card.style.display = 'block';
            } else {
              if (card.classList.contains(category)) {
                card.style.display = 'block';
              } else {
                card.style.display = 'none';
              }
            }
          });
        });
      });
    }
  }
  
  /**
   * Initializes animations for various elements
   */
  function setupAnimations() {
    // Fade in elements when they enter viewport
    const fadeElements = document.querySelectorAll('.fade-in');
    
    if (fadeElements.length > 0 && 'IntersectionObserver' in window) {
      const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            fadeObserver.unobserve(entry.target);
          }
        });
      }, {threshold: 0.1});
      
      fadeElements.forEach(element => {
        fadeObserver.observe(element);
      });
    } else {
      // Fallback for browsers without IntersectionObserver
      fadeElements.forEach(element => {
        element.classList.add('visible');
      });
    }
  }
  
  /**
   * Handles responsive layout adjustments
   */
  function responsiveAdjustments() {
    // Adjust video hero height on mobile devices
    function adjustHeroHeight() {
      const heroVideo = document.querySelector('.page__hero--video');
      if (heroVideo) {
        if (window.innerWidth < 768) {
          heroVideo.style.height = '50vh';
        } else {
          heroVideo.style.height = '65vh';
        }
      }
    }
    
    // Initial adjustment
    adjustHeroHeight();
    
    // Adjust on resize
    window.addEventListener('resize', adjustHeroHeight);
  }
  
  /**
   * Logs diagnostic information about the system for debugging
   * Uses a systems approach to examine component interactions
   */
  function logSystemDiagnostics() {
    console.group('📊 System Diagnostics');
    
    // Check for navigation structure
    const navElements = document.querySelectorAll('nav.greedy-nav');
    console.log(`Navigation elements: ${navElements.length}`, 
      navElements.length ? '✓' : '❌');
    
    // Check for correct font loading
    const fontStatus = {
      'Montserrat': checkFontLoaded('Montserrat'),
      'Source Sans Pro': checkFontLoaded('Source Sans Pro'),
      'Fira Mono': checkFontLoaded('Fira Mono')
    };
    console.log('Font loading status:', fontStatus);
    
    // Check for SVG rendering issues
    const svgElements = document.querySelectorAll('svg');
    const svgStatus = Array.from(svgElements).map(svg => {
      const id = svg.id || 'unnamed';
      const width = svg.getBoundingClientRect().width;
      return {
        id,
        width,
        status: width > 0 ? '✓' : '❌'
      };
    });
    console.log('SVG render status:', svgStatus);
    
    // Check for responsive breakpoints
    console.log('Current viewport width:', window.innerWidth);
    console.log('Current viewport height:', window.innerHeight);
    console.log('Breakpoint status:', getBreakpointStatus());
    
    console.groupEnd();
  }
  
  /**
   * Helper function to check if a font is loaded
   * @param {string} fontName - The name of the font to check
   * @return {boolean} - Whether the font is available
   */
  function checkFontLoaded(fontName) {
    // This is a simplified check and may not be 100% reliable
    const testElement = document.createElement('span');
    testElement.style.fontFamily = `${fontName}, monospace`;
    testElement.style.visibility = 'hidden';
    testElement.textContent = 'Test Font Loading';
    document.body.appendChild(testElement);
    
    const compStyle = window.getComputedStyle(testElement);
    const fontFamily = compStyle.getPropertyValue('font-family');
    
    document.body.removeChild(testElement);
    return fontFamily.includes(fontName);
  }
  
  /**
   * Helper function to get the current breakpoint status
   * @return {object} - Information about current breakpoint
   */
  function getBreakpointStatus() {
    const width = window.innerWidth;
    let breakpoint;
    
    if (width < 576) {
      breakpoint = 'xs';
    } else if (width < 768) {
      breakpoint = 'sm';
    } else if (width < 992) {
      breakpoint = 'md';
    } else if (width < 1200) {
      breakpoint = 'lg';
    } else {
      breakpoint = 'xl';
    }
    
    return {
      width,
      breakpoint,
      isMobile: width < 768,
      isTablet: width >= 768 && width < 992,
      isDesktop: width >= 992
    };
  }