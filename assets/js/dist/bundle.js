// assets/js/utils/dom.js
var DOMUtils = {
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
    Object.keys(attrs).forEach((key) => {
      if (key === "className") {
        el.className = attrs[key];
      } else if (key === "dataset") {
        Object.keys(attrs.dataset).forEach((dataKey) => {
          el.dataset[dataKey] = attrs.dataset[dataKey];
        });
      } else {
        el.setAttribute(key, attrs[key]);
      }
    });
    if (content !== null) {
      if (typeof content === "string") {
        el.innerHTML = content;
      } else if (content instanceof Element) {
        el.appendChild(content);
      } else if (Array.isArray(content)) {
        content.forEach((item) => {
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
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return;
    if (typeof selectorOrCallback === "function") {
      element.addEventListener(event, selectorOrCallback);
    } else {
      element.addEventListener(event, (e) => {
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
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return;
    element.removeEventListener(event, callback);
  },
  /**
   * Add class to element
   * @param {Element|string} el - Element or selector
   * @param {string} className - Class to add
   */
  addClass(el, className) {
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return;
    if (className.includes(" ")) {
      const classNames = className.split(" ").filter(Boolean);
      classNames.forEach((name) => element.classList.add(name));
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
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return;
    if (className.includes(" ")) {
      const classNames = className.split(" ").filter(Boolean);
      classNames.forEach((name) => element.classList.remove(name));
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
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return;
    if (typeof force !== "undefined") {
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
    const element = typeof el === "string" ? this.get(el) : el;
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
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return null;
    if (typeof value !== "undefined") {
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
    const element = typeof el === "string" ? this.get(el) : el;
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
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return null;
    if (typeof prop === "object") {
      Object.keys(prop).forEach((key) => {
        element.style[key] = prop[key];
      });
    } else if (typeof value !== "undefined") {
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
    if (!elements.length || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        callback(entry.target, entry.isIntersecting, entry);
      });
    }, options);
    elements.forEach((element) => {
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
    const formElement = typeof form === "string" ? this.get(form) : form;
    if (!formElement || formElement.nodeName !== "FORM") return null;
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
    const element = typeof el === "string" ? this.get(el) : el;
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
    const element = typeof el === "string" ? this.get(el) : el;
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    const windowHeight = window.innerHeight || document.documentElement.clientHeight;
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    const verticalVisible = rect.top <= windowHeight - windowHeight * threshold && rect.bottom >= windowHeight * threshold;
    const horizontalVisible = rect.left <= windowWidth - windowWidth * threshold && rect.right >= windowWidth * threshold;
    return verticalVisible && horizontalVisible;
  }
};
var dom_default = DOMUtils;

// assets/js/modules/animations.js
var AnimationManager = {
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
    const fadeElements = dom_default.getAll([
      ".fade-in",
      ".fade-in-up",
      ".fade-in-down",
      ".fade-in-left",
      ".fade-in-right",
      ".scale-in"
    ].join(","));
    if (fadeElements.length === 0) return;
    if ("IntersectionObserver" in window) {
      dom_default.observe([
        ".fade-in",
        ".fade-in-up",
        ".fade-in-down",
        ".fade-in-left",
        ".fade-in-right",
        ".scale-in"
      ].join(","), (element, isIntersecting) => {
        if (isIntersecting) {
          dom_default.addClass(element, "visible");
        }
      }, {
        threshold: 0.1,
        rootMargin: "0px 0px -50px 0px"
      });
    } else {
      fadeElements.forEach((element) => {
        dom_default.addClass(element, "visible");
      });
    }
    const staggerContainers = dom_default.getAll('[data-stagger="true"]');
    staggerContainers.forEach((container) => {
      const staggerItems = container.querySelectorAll("[data-stagger-item]");
      if (!staggerItems.length) return;
      staggerItems.forEach((item, index) => {
        const delay = index * 0.1;
        item.style.transitionDelay = `${delay}s`;
      });
      if ("IntersectionObserver" in window) {
        const observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            staggerItems.forEach((item) => {
              dom_default.addClass(item, "visible");
            });
            observer.unobserve(container);
          }
        }, {
          threshold: 0.1,
          rootMargin: "0px 0px -50px 0px"
        });
        observer.observe(container);
      } else {
        staggerItems.forEach((item) => {
          dom_default.addClass(item, "visible");
        });
      }
    });
    this.setupBackToTopButton();
  },
  /**
   * Handle page transitions
   */
  setupPageTransitions() {
    document.addEventListener("DOMContentLoaded", () => {
      setTimeout(() => {
        const mainContent = dom_default.get(".page__content, .archive__content");
        if (mainContent) {
          dom_default.addClass(mainContent, "fade-in");
          dom_default.addClass(mainContent, "visible");
        }
      }, 100);
    });
  },
  /**
   * Setup "back to top" button
   */
  setupBackToTopButton() {
    let backToTop = dom_default.get(".back-to-top");
    if (!backToTop) {
      backToTop = dom_default.create("a", {
        className: "back-to-top",
        href: "#site-top",
        "aria-label": "Back to top"
      }, '<i class="fas fa-arrow-up" aria-hidden="true"></i>');
      document.body.appendChild(backToTop);
      if (!document.getElementById("site-top")) {
        const firstElement = document.body.firstElementChild;
        firstElement.id = "site-top";
      }
    }
    const toggleBackToTopButton = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      if (scrollY > 300) {
        dom_default.addClass(backToTop, "visible");
      } else {
        dom_default.removeClass(backToTop, "visible");
      }
    };
    window.addEventListener("scroll", toggleBackToTopButton);
    dom_default.on(backToTop, "click", (e) => {
      e.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    });
    toggleBackToTopButton();
  }
};
var animations_default = AnimationManager;

// assets/js/modules/navigation.js
var Navigation = {
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
    const navToggle = dom_default.get(".greedy-nav__toggle");
    const visibleLinks = dom_default.get(".visible-links");
    if (!navToggle || !visibleLinks) return;
    dom_default.on(navToggle, "click", (e) => {
      e.preventDefault();
      const isExpanded = navToggle.getAttribute("aria-expanded") === "true";
      navToggle.setAttribute("aria-expanded", !isExpanded);
      dom_default.toggleClass(navToggle, "close", !isExpanded);
      dom_default.toggleClass(visibleLinks, "show", !isExpanded);
    });
    dom_default.on(document, "click", (e) => {
      if (!navToggle.contains(e.target) && !visibleLinks.contains(e.target)) {
        navToggle.setAttribute("aria-expanded", "false");
        dom_default.removeClass(navToggle, "close");
        dom_default.removeClass(visibleLinks, "show");
      }
    });
    navToggle.setAttribute("aria-expanded", "false");
    navToggle.setAttribute("aria-controls", "navLinks");
    visibleLinks.id = "navLinks";
  },
  /**
   * Highlight active navigation links based on current URL
   */
  setupActiveLinks() {
    const currentPath = window.location.pathname;
    const navLinks = dom_default.getAll(".visible-links a, .nav__items a");
    navLinks.forEach((link) => {
      const linkPath = new URL(link.href).pathname;
      if (currentPath === linkPath || currentPath.startsWith(linkPath) && linkPath !== "/") {
        dom_default.addClass(link, "active");
        link.setAttribute("aria-current", "page");
      }
    });
  },
  /**
   * Enable smooth scrolling for anchor links
   */
  setupSmoothScrolling() {
    dom_default.on(document, "click", 'a[href^="#"]:not([href="#"])', function(e) {
      e.preventDefault();
      const targetId = this.getAttribute("href");
      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
        history.pushState(null, null, targetId);
      }
    });
  },
  /**
   * Set up the greedy navigation for handling overflow
   */
  setupGreedyNavigation() {
    const $nav = dom_default.get(".greedy-nav");
    if (!$nav) return;
    const $btn = dom_default.create("button", {
      className: "greedy-nav__toggle hidden",
      type: "button"
    }, '<span class="navicon"></span>');
    const $vlinks = dom_default.get(".visible-links", $nav);
    const $hlinks = dom_default.get(".hidden-links", $nav);
    if (!$hlinks) {
      const $hiddenLinksList = dom_default.create("ul", {
        className: "hidden-links hidden"
      });
      $nav.appendChild($hiddenLinksList);
    }
    if (!dom_default.get(".greedy-nav__toggle", $nav)) {
      $nav.insertBefore($btn, $nav.querySelector(".hidden-links"));
    }
    const $hlinks2 = dom_default.get(".hidden-links", $nav);
    const $vlinks2 = dom_default.get(".visible-links", $nav);
    const $btn2 = dom_default.get(".greedy-nav__toggle", $nav);
    if (!$vlinks2 || !$hlinks2 || !$btn2) return;
    const navWidth = $nav.offsetWidth;
    let breaks = [];
    let remainingSpace, availableSpace, numOfVisibleItems;
    const updateNav = () => {
      const navContainerWidth = $vlinks2.offsetWidth;
      const $visibleLinks = $vlinks2.querySelectorAll("li");
      let visibleLinksWidth = 0;
      $visibleLinks.forEach((link) => {
        visibleLinksWidth += link.offsetWidth;
      });
      availableSpace = navContainerWidth - 10;
      if (visibleLinksWidth > availableSpace) {
        const lastVisibleLink = $visibleLinks[$visibleLinks.length - 1];
        $hlinks2.insertBefore(lastVisibleLink, $hlinks2.firstChild);
        breaks.push(visibleLinksWidth);
        dom_default.removeClass($btn2, "hidden");
      } else {
        const $hiddenLinks = $hlinks2.querySelectorAll("li");
        if ($hiddenLinks.length > 0 && visibleLinksWidth + $hiddenLinks[0].offsetWidth < availableSpace) {
          $vlinks2.appendChild($hiddenLinks[0]);
          breaks.pop();
        }
        if ($hlinks2.querySelectorAll("li").length === 0) {
          dom_default.addClass($btn2, "hidden");
          dom_default.addClass($hlinks2, "hidden");
        }
      }
    };
    updateNav();
    window.addEventListener("resize", updateNav);
    dom_default.on($btn2, "click", (e) => {
      e.preventDefault();
      dom_default.toggleClass($hlinks2, "hidden");
    });
    dom_default.on(document, "click", (e) => {
      if (!$nav.contains(e.target)) {
        dom_default.addClass($hlinks2, "hidden");
      }
    });
  }
};
var navigation_default = Navigation;

// assets/js/modules/ecosystem.js
var Ecosystem = {
  /**
   * Initialize ecosystem component
   */
  init() {
    this.setupEcosystemComponent();
  },
  /**
   * Set up the ecosystem visualization component
   */
  setupEcosystemComponent() {
    const ecosystemComponent = dom_default.get(".ecosystem-component");
    if (!ecosystemComponent) return;
    const nodes = dom_default.getAll(".ecosystem-node");
    if (nodes.length === 0) return;
    this.setupConnectionHighlighting(nodes);
    this.setupEntranceAnimations(nodes);
    this.setupInteractiveFeatures(nodes);
  },
  /**
   * Set up connection highlighting between nodes
   * @param {NodeList} nodes - List of ecosystem nodes
   */
  setupConnectionHighlighting(nodes) {
    nodes.forEach((node) => {
      dom_default.on(node, "mouseenter", () => {
        const connections = this.getNodeConnections(node);
        if (connections.length === 0) return;
        dom_default.addClass(node, "is-active");
        nodes.forEach((otherNode) => {
          const nodeId = this.getNodeId(otherNode);
          if (connections.includes(nodeId)) {
            dom_default.addClass(otherNode, "connected");
          }
        });
      });
      dom_default.on(node, "mouseleave", () => {
        dom_default.removeClass(node, "is-active");
        nodes.forEach((otherNode) => {
          dom_default.removeClass(otherNode, "connected");
        });
      });
    });
  },
  /**
   * Set up entrance animations for nodes
   * @param {NodeList} nodes - List of ecosystem nodes
   */
  setupEntranceAnimations(nodes) {
    nodes.forEach((node, index) => {
      dom_default.addClass(node, "fade-in");
      node.style.transitionDelay = `${index * 0.15}s`;
    });
    setTimeout(() => {
      nodes.forEach((node) => {
        dom_default.addClass(node, "visible");
      });
    }, 100);
  },
  /**
   * Add extra interactive features to ecosystem component
   * @param {NodeList} nodes - List of ecosystem nodes
   */
  setupInteractiveFeatures(nodes) {
    if ("ontouchstart" in window) {
      nodes.forEach((node) => {
        dom_default.on(node, "click", (e) => {
          if (!dom_default.hasClass(node, "is-active")) {
            e.preventDefault();
            nodes.forEach((n) => {
              dom_default.removeClass(n, "is-active");
              dom_default.removeClass(n, "connected");
            });
            dom_default.addClass(node, "is-active");
            const connections = this.getNodeConnections(node);
            if (connections.length === 0) return;
            nodes.forEach((otherNode) => {
              const nodeId = this.getNodeId(otherNode);
              if (connections.includes(nodeId)) {
                dom_default.addClass(otherNode, "connected");
              }
            });
          }
        });
      });
      dom_default.on(document, "click", (e) => {
        if (!dom_default.get(".ecosystem-component").contains(e.target)) {
          nodes.forEach((node) => {
            dom_default.removeClass(node, "is-active");
            dom_default.removeClass(node, "connected");
          });
        }
      });
    }
  },
  /**
   * Get node connections from data attribute
   * @param {Element} node - The ecosystem node
   * @return {Array} - List of connected node IDs
   */
  getNodeConnections(node) {
    const connectionsAttr = node.dataset.connections || "";
    return connectionsAttr.split(",").filter(Boolean).map((id) => id.trim());
  },
  /**
   * Get node ID from its title
   * @param {Element} node - The ecosystem node
   * @return {string} - Node ID derived from title
   */
  getNodeId(node) {
    const titleEl = node.querySelector(".ecosystem-node-title");
    if (!titleEl) return "";
    return titleEl.textContent.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  }
};
var ecosystem_default = Ecosystem;

// assets/js/modules/responsive.js
var ResponsiveManager = {
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
      breakpoint = "xs";
    } else if (width < this.breakpoints.md) {
      breakpoint = "sm";
    } else if (width < this.breakpoints.lg) {
      breakpoint = "md";
    } else if (width < this.breakpoints.xl) {
      breakpoint = "lg";
    } else {
      breakpoint = "xl";
    }
    this.currentBreakpoint = breakpoint;
    document.body.classList.remove("breakpoint-xs", "breakpoint-sm", "breakpoint-md", "breakpoint-lg", "breakpoint-xl");
    document.body.classList.add(`breakpoint-${breakpoint}`);
    return breakpoint;
  },
  /**
   * Setup event listeners for responsive adjustments
   */
  setupResponsiveListeners() {
    let resizeTimer;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        const newBreakpoint = this.detectBreakpoint();
        if (newBreakpoint !== this.currentBreakpoint) {
          this.handleBreakpointChange(newBreakpoint);
        }
        this.adjustHeroHeight();
      }, 250);
    });
    window.addEventListener("orientationchange", () => {
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
    if (this.isMobileBreakpoint(newBreakpoint) && !this.isMobileBreakpoint(prevBreakpoint)) {
      this.switchToMobileView();
    }
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
    return breakpoint === "xs" || breakpoint === "sm";
  },
  /**
   * Adjustments when switching to mobile view
   */
  switchToMobileView() {
    const sidebar = dom_default.get(".sidebar");
    if (sidebar) {
      dom_default.removeClass(sidebar, "sticky");
    }
    const authorProfileButton = dom_default.get(".author__urls-wrapper button");
    if (authorProfileButton) {
      authorProfileButton.removeAttribute("aria-expanded");
    }
  },
  /**
   * Adjustments when switching to desktop view
   */
  switchToDesktopView() {
    const sidebar = dom_default.get(".sidebar");
    if (sidebar) {
      dom_default.addClass(sidebar, "sticky");
    }
    const navToggle = dom_default.get(".greedy-nav__toggle");
    const visibleLinks = dom_default.get(".visible-links");
    if (navToggle && visibleLinks) {
      navToggle.setAttribute("aria-expanded", "false");
      dom_default.removeClass(navToggle, "close");
      dom_default.removeClass(visibleLinks, "show");
    }
  },
  /**
   * Adjust hero video/image height based on screen size
   */
  adjustHeroHeight() {
    const heroVideo = dom_default.get(".page__hero--video");
    if (heroVideo) {
      if (this.isMobileBreakpoint(this.currentBreakpoint)) {
        dom_default.css(heroVideo, "height", "50vh");
      } else {
        dom_default.css(heroVideo, "height", "65vh");
      }
    }
  },
  /**
   * Setup responsive video background handling
   */
  setupVideoBackground() {
    const heroVideo = dom_default.get(".page__hero--video video");
    if (!heroVideo) return;
    if ("ontouchstart" in window) {
      heroVideo.setAttribute("playsinline", "");
      heroVideo.muted = true;
      heroVideo.setAttribute("muted", "");
      document.addEventListener("touchstart", () => {
        heroVideo.play();
      }, { once: true });
    }
    if (!heroVideo.hasAttribute("poster")) {
      const fallbackImage = dom_default.get(".page__hero--video").dataset.fallbackImage;
      if (fallbackImage) {
        heroVideo.setAttribute("poster", fallbackImage);
      }
    }
    if ("IntersectionObserver" in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
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
    const tables = dom_default.getAll(".page__content table:not(.responsive-table)");
    tables.forEach((table) => {
      dom_default.addClass(table, "responsive-table");
      if (table.parentNode.classList.contains("table-wrapper")) return;
      const wrapper = dom_default.create("div", {
        className: "table-wrapper"
      });
      table.parentNode.insertBefore(wrapper, table);
      wrapper.appendChild(table);
    });
  },
  /**
   * Add fallbacks for browsers with JavaScript disabled
   * (These will be overridden when JS is enabled)
   */
  addNoJSFallbacks() {
    document.documentElement.classList.remove("no-js");
    document.documentElement.classList.add("js");
    dom_default.getAll(".fade-in, .fade-in-up, .fade-in-down, .fade-in-left, .fade-in-right, .scale-in").forEach((element) => {
      element.classList.add("no-js-visible");
    });
  }
};
var responsive_default = ResponsiveManager;

// assets/js/main.js
var App = class {
  /**
   * Initialize the application
   */
  constructor() {
    this.debugMode = this.getQueryParam("debug") === "true";
    if (this.debugMode) {
      document.body.classList.add("debug-mode");
    }
    this.initWhenReady();
  }
  /**
   * Initialize app when DOM is ready
   */
  initWhenReady() {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.init());
    } else {
      this.init();
    }
  }
  /**
   * Main initialization method
   */
  init() {
    this.initializeModules();
    this.setupPageSpecificBehavior();
    if (this.debugMode) {
      console.log("Portfolio site initialized in debug mode");
      this.logSystemDiagnostics();
    }
  }
  /**
   * Initialize all modules in the correct order
   * This follows a systems thinking approach by considering dependencies
   */
  initializeModules() {
    responsive_default.init();
    navigation_default.init();
    animations_default.init();
    ecosystem_default.init();
  }
  /**
   * Set up functionality specific to current page template
   */
  setupPageSpecificBehavior() {
    const bodyClasses = document.body.className;
    if (bodyClasses.includes("layout--home")) {
      this.setupHomePage();
    }
    if (bodyClasses.includes("layout--archive") && window.location.pathname.includes("/blog/")) {
      this.setupBlogPage();
    }
    if (bodyClasses.includes("layout--single") && window.location.pathname.includes("/projects/")) {
      this.setupProjectPage();
    }
    if (window.location.pathname.includes("/ecosystem/")) {
      this.setupEcosystemPage();
    }
  }
  /**
   * Home page specific setup
   */
  setupHomePage() {
  }
  /**
   * Blog page specific setup
   */
  setupBlogPage() {
    const categoryBtns = dom_default.getAll(".category-btn");
    const postCards = dom_default.getAll(".post-card");
    if (categoryBtns.length && postCards.length) {
      categoryBtns.forEach((btn) => {
        dom_default.on(btn, "click", () => {
          categoryBtns.forEach((b) => dom_default.removeClass(b, "active"));
          dom_default.addClass(btn, "active");
          const category = btn.dataset.category;
          postCards.forEach((card) => {
            if (category === "all") {
              dom_default.css(card, "display", "block");
            } else {
              if (dom_default.hasClass(card, category)) {
                dom_default.css(card, "display", "block");
              } else {
                dom_default.css(card, "display", "none");
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
  }
  /**
   * Ecosystem page specific setup
   */
  setupEcosystemPage() {
    const ecosystemDiagram = dom_default.get(".research-ecosystem-diagram svg");
    if (ecosystemDiagram) {
      this.setupEcosystemDiagramInteractivity(ecosystemDiagram);
    }
  }
  /**
   * Add interactivity to the ecosystem diagram SVG
   * @param {Element} svg - The ecosystem diagram SVG element
   */
  setupEcosystemDiagramInteractivity(svg) {
    const nodes = svg.querySelectorAll("circle");
    if (nodes.length === 0) return;
    nodes.forEach((node) => {
      node.addEventListener("mouseenter", function() {
        this.style.transform = "scale(1.1)";
        this.style.transformOrigin = "center";
        this.style.transition = "transform 0.3s ease";
      });
      node.addEventListener("mouseleave", function() {
        this.style.transform = "scale(1)";
      });
    });
  }
  /**
   * Log diagnostic information for debugging
   */
  logSystemDiagnostics() {
    console.group("\u{1F4CA} System Diagnostics");
    console.log("Page:", window.location.pathname);
    console.log("Timestamp:", (/* @__PURE__ */ new Date()).toISOString());
    console.log("Viewport:", `${window.innerWidth}px \xD7 ${window.innerHeight}px`);
    console.log("Device Pixel Ratio:", window.devicePixelRatio);
    console.log("Breakpoint:", responsive_default.currentBreakpoint);
    const criticalComponents = {
      "Header": dom_default.get(".masthead"),
      "Navigation": dom_default.get(".greedy-nav"),
      "Main Content": dom_default.get("#main"),
      "Footer": dom_default.get(".page__footer"),
      "Sidebar": dom_default.get(".sidebar")
    };
    console.log(
      "Critical Components:",
      Object.fromEntries(
        Object.entries(criticalComponents).map(([name, element]) => [name, element ? "\u2713" : "\u274C"])
      )
    );
    console.log("Resources:", {
      "Images": document.querySelectorAll("img").length,
      "Scripts": document.querySelectorAll("script").length,
      "Stylesheets": document.querySelectorAll('link[rel="stylesheet"]').length,
      "SVGs": document.querySelectorAll("svg").length
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
};
new App();
