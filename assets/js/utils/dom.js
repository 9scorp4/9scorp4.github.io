/**
 * DOM Utilities
 * A collection of helper functions for DOM manipulation
 */

const DOMUtils = {
    /**
     * Get element by selector
     * @param {string} selector - CSS selector
     * @return {Element|null} - DOM element or null
     */
    get(selector) {
      return document.querySelector(selector);
    },
    
    /**
     * Get all elements matching selector
     * @param {string} selector - CSS selector
     * @return {NodeList} - List of matching elements
     */
    getAll(selector) {
      return document.querySelectorAll(selector);
    },
    
    /**
     * Create element with attributes and content
     * @param {string} tag - Element tag name
     * @param {object} attrs - Element attributes
     * @param {string|Element|Element[]} content - Inner content
     * @return {Element} - Created element
     */
    create(tag, attrs = {}, content = null) {
      const el = document.createElement(tag);
      
      // Set attributes
      Object.keys(attrs).forEach(key => {
        if (key === 'className') {
          el.className = attrs[key];
        } else if (key === 'dataset') {
          Object.keys(attrs.dataset).forEach(dataKey => {
            el.dataset[dataKey] = attrs.dataset[dataKey];
          });
        } else {
          el.setAttribute(key, attrs[key]);
        }
      });
      
      // Set content
      if (content !== null) {
        if (typeof content === 'string') {
          el.innerHTML = content;
        } else if (content instanceof Element) {
          el.appendChild(content);
        } else if (Array.isArray(content)) {
          content.forEach(item => {
            if (item instanceof Element) {
              el.appendChild(item);
            }
          });
        }
      }
      
      return el;
    },
    
    /**
     * Add event listener with delegation support
     * @param {Element|string} el - Element or selector
     * @param {string} event - Event name
     * @param {string|Function} selectorOrCallback - Selector for delegation or callback
     * @param {Function} [callback] - Callback function (for delegation)
     */
    on(el, event, selectorOrCallback, callback) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return;
      
      if (typeof selectorOrCallback === 'function') {
        // Simple event listener
        element.addEventListener(event, selectorOrCallback);
      } else {
        // Delegated event listener
        element.addEventListener(event, e => {
          const target = e.target.closest(selectorOrCallback);
          if (target && element.contains(target)) {
            callback.call(target, e);
          }
        });
      }
    },
    
    /**
     * Remove event listener
     * @param {Element|string} el - Element or selector
     * @param {string} event - Event name
     * @param {Function} callback - Callback function
     */
    off(el, event, callback) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return;
      
      element.removeEventListener(event, callback);
    },
    
    /**
     * Add class to element
     * @param {Element|string} el - Element or selector
     * @param {string} className - Class to add
     */
    addClass(el, className) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return;
      
      if (className.includes(' ')) {
        const classNames = className.split(' ').filter(Boolean);
        classNames.forEach(name => element.classList.add(name));
      } else {
        element.classList.add(className);
      }
    },
    
    /**
     * Remove class from element
     * @param {Element|string} el - Element or selector
     * @param {string} className - Class to remove
     */
    removeClass(el, className) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return;
      
      if (className.includes(' ')) {
        const classNames = className.split(' ').filter(Boolean);
        classNames.forEach(name => element.classList.remove(name));
      } else {
        element.classList.remove(className);
      }
    },
    
    /**
     * Toggle class on element
     * @param {Element|string} el - Element or selector
     * @param {string} className - Class to toggle
     * @param {boolean} [force] - Force add or remove
     */
    toggleClass(el, className, force) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return;
      
      if (typeof force !== 'undefined') {
        element.classList.toggle(className, force);
      } else {
        element.classList.toggle(className);
      }
    },
    
    /**
     * Check if element has class
     * @param {Element|string} el - Element or selector
     * @param {string} className - Class to check
     * @return {boolean} - Whether element has class
     */
    hasClass(el, className) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return false;
      
      return element.classList.contains(className);
    },
    
    /**
     * Get or set element attribute
     * @param {Element|string} el - Element or selector
     * @param {string} attr - Attribute name
     * @param {string} [value] - Attribute value to set
     * @return {string|null} - Attribute value (when getting)
     */
    attr(el, attr, value) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return null;
      
      if (typeof value !== 'undefined') {
        element.setAttribute(attr, value);
      } else {
        return element.getAttribute(attr);
      }
    },
    
    /**
     * Remove element attribute
     * @param {Element|string} el - Element or selector
     * @param {string} attr - Attribute name
     */
    removeAttr(el, attr) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return;
      
      element.removeAttribute(attr);
    },
    
    /**
     * Get or set element style
     * @param {Element|string} el - Element or selector
     * @param {string|object} prop - Style property or object of properties
     * @param {string} [value] - Style value
     * @return {string} - Style value (when getting)
     */
    css(el, prop, value) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return null;
      
      if (typeof prop === 'object') {
        Object.keys(prop).forEach(key => {
          element.style[key] = prop[key];
        });
      } else if (typeof value !== 'undefined') {
        element.style[prop] = value;
      } else {
        return getComputedStyle(element)[prop];
      }
    },
    
    /**
     * Add intersection observer to elements
     * @param {string} selector - Elements selector
     * @param {Function} callback - Callback when element intersects
     * @param {Object} options - IntersectionObserver options
     */
    observe(selector, callback, options = { threshold: 0.1 }) {
      const elements = this.getAll(selector);
      
      if (!elements.length || !('IntersectionObserver' in window)) return;
      
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          callback(entry.target, entry.isIntersecting, entry);
        });
      }, options);
      
      elements.forEach(element => {
        observer.observe(element);
      });
      
      return observer;
    },
    
    /**
     * Serialize form data to object
     * @param {Element|string} form - Form element or selector
     * @return {Object} - Form data as object
     */
    serializeForm(form) {
      const formElement = typeof form === 'string' ? this.get(form) : form;
      
      if (!formElement || formElement.nodeName !== 'FORM') return null;
      
      const formData = new FormData(formElement);
      const result = {};
      
      for (let [key, value] of formData.entries()) {
        result[key] = value;
      }
      
      return result;
    },
    
    /**
     * Get element dimensions
     * @param {Element|string} el - Element or selector
     * @return {Object} - Element dimensions {width, height, top, left, right, bottom}
     */
    dimensions(el) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return null;
      
      const rect = element.getBoundingClientRect();
      
      return {
        width: rect.width,
        height: rect.height,
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY
      };
    },
    
    /**
     * Check if element is visible in viewport
     * @param {Element|string} el - Element or selector
     * @param {number} [threshold=0] - Visibility threshold (0-1)
     * @return {boolean} - Whether element is visible
     */
    isInViewport(el, threshold = 0) {
      const element = typeof el === 'string' ? this.get(el) : el;
      
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;
      
      const verticalVisible = (
        rect.top <= windowHeight - (windowHeight * threshold) &&
        rect.bottom >= windowHeight * threshold
      );
      
      const horizontalVisible = (
        rect.left <= windowWidth - (windowWidth * threshold) &&
        rect.right >= windowWidth * threshold
      );
      
      return verticalVisible && horizontalVisible;
    }
  };
  
  export default DOMUtils;