/**
 * DOM Utility Functions
 * 
 * Provides helper functions for common DOM operations
 * Centralizes DOM manipulation patterns for consistency
 */

/**
 * Select a single element with error handling
 * @param {string} selector - CSS selector
 * @param {Element} [parent=document] - Parent element to query within
 * @returns {Element|null} - The selected element or null
 */
export function select(selector, parent = document) {
    try {
      return parent.querySelector(selector);
    } catch (error) {
      console.error(`Error selecting "${selector}":`, error);
      return null;
    }
  }
  
  /**
   * Select multiple elements with error handling
   * @param {string} selector - CSS selector
   * @param {Element} [parent=document] - Parent element to query within
   * @returns {Element[]} - Array of selected elements
   */
  export function selectAll(selector, parent = document) {
    try {
      return Array.from(parent.querySelectorAll(selector));
    } catch (error) {
      console.error(`Error selecting all "${selector}":`, error);
      return [];
    }
  }
  
  /**
   * Create an element with optional attributes and content
   * @param {string} tag - HTML tag name
   * @param {Object} [attributes={}] - Element attributes
   * @param {string} [content=''] - Inner HTML content
   * @returns {Element} - The created element
   */
  export function createElement(tag, attributes = {}, content = '') {
    const element = document.createElement(tag);
    
    // Set attributes
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'class' || key === 'className') {
        // Handle classes specially
        element.className = value;
      } else if (key === 'style' && typeof value === 'object') {
        // Handle style objects
        Object.assign(element.style, value);
      } else if (key.startsWith('data-')) {
        // Handle data attributes
        element.setAttribute(key, value);
      } else {
        // Standard attributes
        element[key] = value;
      }
    });
    
    // Set content if provided
    if (content) {
      element.innerHTML = content;
    }
    
    return element;
  }
  
  /**
   * Add a delegated event listener
   * @param {Element} element - Element to attach the listener to
   * @param {string} eventType - Type of event
   * @param {string} selector - CSS selector for delegated elements
   * @param {Function} handler - Event handler function
   * @param {Object} [options={}] - Event listener options
   * @returns {Function} - Function to remove the event listener
   */
  export function delegateEvent(element, eventType, selector, handler, options = {}) {
    const listener = (event) => {
      let targetElement = event.target;
      
      while (targetElement && targetElement !== element) {
        if (targetElement.matches(selector)) {
          // Call handler with targetElement as 'this'
          handler.call(targetElement, event, targetElement);
          if (options.once) break;
        }
        targetElement = targetElement.parentNode;
      }
    };
    
    element.addEventListener(eventType, listener, options);
    
    // Return function to remove event listener
    return () => {
      element.removeEventListener(eventType, listener, options);
    };
  }
  
  /**
   * Toggle a class on an element
   * @param {Element} element - Element to toggle class on
   * @param {string} className - Class to toggle
   * @param {boolean} [force] - Force add or remove
   * @returns {boolean} - Whether class is present after toggling
   */
  export function toggleClass(element, className, force) {
    if (element?.classList) {
      return element.classList.toggle(className, force);
    }
    return false;
  }
  
  /**
   * Execute a callback when elements enter viewport using Intersection Observer
   * @param {Element[]|NodeList|string} elements - Elements or selector
   * @param {Function} callback - Function to call when element is visible
   * @param {Object} [options={}] - IntersectionObserver options
   * @returns {IntersectionObserver} - The observer instance
   */
  export function onElementsInView(elements, callback, options = {}) {
    // Convert string selector to elements
    if (typeof elements === 'string') {
      elements = document.querySelectorAll(elements);
    }
    
    // Default options
    const defaultOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1,
      once: true
    };
    
    const config = { ...defaultOptions, ...options };
    const { once, ...observerOptions } = config;
    
    // Convert NodeList to array
    const elementsArray = Array.from(elements);
    
    // Track observed elements if using once option
    const observedElements = new WeakSet();
    
    // Create observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          // Call callback with the element
          callback(entry.target, entry);
          
          // Unobserve if once option is true
          if (once) {
            observer.unobserve(entry.target);
            observedElements.add(entry.target);
          }
        }
      });
    }, observerOptions);
    
    // Start observing elements
    elementsArray.forEach(element => {
      if (!observedElements.has(element)) {
        observer.observe(element);
      }
    });
    
    return observer;
  }
  
  /**
   * Set multiple CSS variables on an element
   * @param {Element} element - Target element
   * @param {Object} variables - Object with variable names and values
   * @returns {void}
   */
  export function setCSSVariables(element, variables) {
    Object.entries(variables).forEach(([name, value]) => {
      // Ensure variable name has -- prefix
      const varName = name.startsWith('--') ? name : `--${name}`;
      element.style.setProperty(varName, value);
    });
  }
  
  /**
   * Get viewport dimensions
   * @returns {Object} - Object with width and height properties
   */
  export function getViewportSize() {
    return {
      width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0),
      height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
    };
  }
  
  /**
   * Check if an element is visible in the DOM
   * @param {Element} element - Element to check
   * @returns {boolean} - Whether element is visible
   */
  export function isVisible(element) {
    if (!element) return false;
    
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           style.opacity !== '0';
  }
  
  /**
   * Get the offset position of an element
   * @param {Element} element - Element to get position of
   * @returns {Object} - Object with top and left properties
   */
  export function getOffset(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX
    };
  }
  
  /**
   * Insert an element after a reference element
   * @param {Element} newElement - Element to insert
   * @param {Element} referenceElement - Element to insert after
   * @returns {Element} - The inserted element
   */
  export function insertAfter(newElement, referenceElement) {
    referenceElement.parentNode.insertBefore(newElement, referenceElement.nextSibling);
    return newElement;
  }
  
  /**
   * Check if the device is touch-capable
   * @returns {boolean} - Whether device has touch capability
   */
  export function isTouchDevice() {
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints > 0) || 
           (navigator.msMaxTouchPoints > 0);
  }
  
  /**
   * Check current media query match
   * @param {string} query - Media query string
   * @returns {boolean} - Whether the media query matches
   */
  export function matchesMedia(query) {
    return window.matchMedia(query).matches;
  }