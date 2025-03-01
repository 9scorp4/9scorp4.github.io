/**
 * Jekyll Site Diagnostics Tool
 * 
 * This script helps diagnose common issues with Jekyll sites, especially
 * those using the Minimal Mistakes theme. It checks for configuration problems,
 * missing dependencies, and structural issues.
 * 
 * Usage: 
 * 1. Add ?debug=true to any URL to activate debug mode
 * 2. Open browser console to view diagnostics
 */

class JekyllDiagnostics {
    constructor() {
      this.debugMode = this.getQueryParam('debug') === 'true';
      this.issues = [];
      this.status = {
        layout: false,
        fonts: false,
        styles: false,
        scripts: false,
        images: false
      };
      
      if (this.debugMode) {
        this.initDebugMode();
      }
    }
    
    /**
     * Initialize debug mode
     */
    initDebugMode() {
      console.log('%c Jekyll Diagnostics Tool 🔍', 'font-size: 16px; font-weight: bold; color: #3498DB;');
      
      document.body.classList.add('debug-mode');
      this.createDebugOverlay();
      
      // Run diagnostics
      this.checkPageStructure();
      this.checkFonts();
      this.checkStyles();
      this.checkImages();
      this.checkScripts();
      
      // Report findings
      this.displayResults();
    }
    
    /**
     * Create a simple overlay to indicate debug mode is active
     */
    createDebugOverlay() {
      const overlay = document.createElement('div');
      overlay.className = 'debug-overlay';
      overlay.innerHTML = `
        <div class="debug-indicator">Debug Mode Active</div>
        <div class="debug-toggle" title="Toggle Debug Panel">🔍</div>
        <div class="debug-panel">
          <h3>Jekyll Site Diagnostics</h3>
          <div class="debug-results"></div>
        </div>
      `;
      
      document.body.appendChild(overlay);
      
      // Add styles
      const style = document.createElement('style');
      style.textContent = `
        .debug-overlay {
          position: fixed;
          bottom: 10px;
          right: 10px;
          z-index: 9999;
          font-family: monospace;
          font-size: 14px;
        }
        
        .debug-indicator {
          background-color: rgba(52, 152, 219, 0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          margin-bottom: 5px;
          text-align: center;
        }
        
        .debug-toggle {
          background-color: rgba(44, 62, 80, 0.8);
          color: white;
          padding: 5px 10px;
          border-radius: 4px;
          cursor: pointer;
          text-align: center;
        }
        
        .debug-panel {
          display: none;
          background-color: rgba(255, 255, 255, 0.95);
          border: 1px solid #ddd;
          border-radius: 6px;
          padding: 15px;
          margin-top: 10px;
          max-width: 400px;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
        }
        
        .debug-panel h3 {
          margin-top: 0;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .debug-item {
          margin-bottom: 10px;
          padding-bottom: 10px;
          border-bottom: 1px solid #eee;
        }
        
        .debug-item-title {
          font-weight: bold;
          display: flex;
          justify-content: space-between;
        }
        
        .debug-item-status {
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        .status-warn {
          background-color: #f39c12;
          color: white;
        }
        
        .debug-item-details {
          margin-top: 5px;
          font-size: 12px;
          color: #666;
        }
        
        .debug-outline * {
          outline: 1px solid rgba(52, 152, 219, 0.5);
        }
      `;
      
      document.head.appendChild(style);
      
      // Toggle debug panel
      const toggle = overlay.querySelector('.debug-toggle');
      const panel = overlay.querySelector('.debug-panel');
      
      toggle.addEventListener('click', () => {
        if (panel.style.display === 'block') {
          panel.style.display = 'none';
        } else {
          panel.style.display = 'block';
        }
      });
    }
    
    /**
     * Check page structure and layout
     */
    checkPageStructure() {
      console.group('Page Structure Diagnostics');
      
      // Check for basic structure elements
      const header = document.querySelector('.masthead');
      const main = document.querySelector('#main');
      const footer = document.querySelector('.page__footer');
      
      if (!header) {
        this.addIssue('layout', 'fail', 'Missing header/masthead element', 
          'The .masthead element was not found. Check if your layout includes the masthead.html partial.');
      } else {
        console.log('✓ Found header element');
      }
      
      if (!main) {
        this.addIssue('layout', 'fail', 'Missing main content area', 
          'The #main element was not found. Check your layout templates.');
      } else {
        console.log('✓ Found main content area');
      }
      
      if (!footer) {
        this.addIssue('layout', 'fail', 'Missing footer element', 
          'The .page__footer element was not found. Check if your layout includes the footer.html partial.');
      } else {
        console.log('✓ Found footer element');
      }
      
      // Check for Minimal Mistakes specific elements
      const archive = document.querySelector('.archive');
      const sidebar = document.querySelector('.sidebar');
      
      if (sidebar) {
        console.log('✓ Found sidebar element');
        
        // Check sidebar content
        const sidebarItems = sidebar.querySelectorAll('nav, .author__avatar, .author__content');
        if (sidebarItems.length === 0) {
          this.addIssue('layout', 'warn', 'Empty sidebar detected', 
            'The sidebar is present but appears to have no content. Check your sidebar configuration.');
        }
      }
      
      // Check for broken layouts
      const overflows = this.findElementsWithOverflow();
      if (overflows.length > 0) {
        this.addIssue('layout', 'warn', 'Potential horizontal overflow detected', 
          `Found ${overflows.length} elements that may cause horizontal scrolling.`);
        console.warn('Elements with potential overflow:', overflows);
      } else {
        console.log('✓ No horizontal overflow issues detected');
      }
      
      console.groupEnd();
    }
    
    /**
     * Check for font loading issues
     */
    checkFonts() {
      console.group('Font Diagnostics');
      
      // Check if custom fonts are defined
      const customFonts = [
        { name: 'Montserrat', fallback: '-apple-system, BlinkMacSystemFont, "Roboto"' },
        { name: 'Source Sans Pro', fallback: '-apple-system, BlinkMacSystemFont, "Roboto"' },
        { name: 'Fira Mono', fallback: 'monospace' }
      ];
      
      let fontIssues = false;
      
      customFonts.forEach(font => {
        const isLoaded = this.isFontLoaded(font.name);
        if (!isLoaded) {
          this.addIssue('fonts', 'warn', `Font "${font.name}" may not be loading properly`, 
            `Check if the font is correctly imported in head/custom.html. Falling back to ${font.fallback}.`);
          fontIssues = true;
        } else {
          console.log(`✓ Font "${font.name}" appears to be loaded`);
        }
      });
      
      if (!fontIssues) {
        this.status.fonts = true;
      }
      
      console.groupEnd();
    }
    
    /**
     * Check for CSS loading and styling issues
     */
    checkStyles() {
      console.group('CSS Diagnostics');
      
      // Check if main stylesheet is loaded
      const mainStylesheet = document.querySelector('link[href*="main.css"]');
      if (!mainStylesheet) {
        this.addIssue('styles', 'fail', 'Main stylesheet not detected', 
          'The main.css file does not appear to be loaded. Check your Jekyll build process.');
      } else {
        console.log('✓ Main stylesheet detected');
        this.status.styles = true;
      }
      
      // Check for custom skin
      const customSkin = getComputedStyle(document.documentElement)
        .getPropertyValue('--color-primary')
        .trim();
        
      if (!customSkin) {
        this.addIssue('styles', 'warn', 'Custom skin may not be applied correctly', 
          'CSS variables for the custom skin are not detected. Check your skin file and _config.yml settings.');
      } else {
        console.log('✓ Custom skin appears to be applied');
      }
      
      // Check for common style issues
      const fontAwesome = document.querySelector('link[href*="font-awesome"]');
      if (!fontAwesome) {
        this.addIssue('styles', 'warn', 'Font Awesome may not be loaded', 
          'Font Awesome CSS was not detected. Some icons may not display correctly.');
      } else {
        console.log('✓ Font Awesome detected');
      }
      
      console.groupEnd();
    }
    
    /**
     * Check for image loading issues
     */
    checkImages() {
      console.group('Image Diagnostics');
      
      // Check for broken images
      const images = document.querySelectorAll('img');
      let brokenImages = 0;
      
      images.forEach(img => {
        if (!img.complete || img.naturalHeight === 0) {
          brokenImages++;
          console.warn('Broken image detected:', img.src);
        }
      });
      
      if (brokenImages > 0) {
        this.addIssue('images', 'fail', `${brokenImages} broken images detected`, 
          'Some images are not loading properly. Check file paths and image existence.');
      } else if (images.length > 0) {
        console.log(`✓ All ${images.length} images appear to be loading correctly`);
        this.status.images = true;
      } else {
        console.log('No images detected on this page');
        this.status.images = true;
      }
      
      // Check for SVG rendering
      const svgs = document.querySelectorAll('svg');
      let svgIssues = 0;
      
      svgs.forEach(svg => {
        const rect = svg.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          svgIssues++;
          console.warn('SVG with zero dimensions detected:', svg);
        }
      });
      
      if (svgIssues > 0) {
        this.addIssue('images', 'warn', `${svgIssues} SVGs with rendering issues detected`, 
          'Some SVG elements have zero dimensions. Check your SVG code for errors.');
      } else if (svgs.length > 0) {
        console.log(`✓ All ${svgs.length} SVGs appear to be rendering correctly`);
      }
      
      console.groupEnd();
    }
    
    /**
     * Check for JavaScript loading and execution issues
     */
    checkScripts() {
      console.group('JavaScript Diagnostics');
      
      // Check for main.min.js
      const mainScript = document.querySelector('script[src*="main.min.js"]');
      if (!mainScript) {
        this.addIssue('scripts', 'warn', 'Main script not detected', 
          'The main.min.js file from Minimal Mistakes theme is not detected. Some functionality may be limited.');
      } else {
        console.log('✓ Main script detected');
      }
      
      // Check for custom.js
      const customScript = document.querySelector('script[src*="custom.js"]');
      if (!customScript) {
        this.addIssue('scripts', 'info', 'Custom script not detected', 
          'No custom.js file is loaded. This is optional but useful for custom functionality.');
      } else {
        console.log('✓ Custom script detected');
      }
      
      // Check for jQuery (required by Minimal Mistakes)
      if (typeof jQuery === 'undefined') {
        this.addIssue('scripts', 'warn', 'jQuery not detected', 
          'jQuery is required by Minimal Mistakes but was not detected. Some functionality may not work.');
      } else {
        console.log(`✓ jQuery ${jQuery.fn.jquery} detected`);
        this.status.scripts = true;
      }
      
      // Check for JS errors
      const errorCount = this.getJsErrorCount();
      if (errorCount > 0) {
        this.addIssue('scripts', 'fail', `${errorCount} JavaScript errors detected`, 
          'JavaScript errors were detected. Check the console for details.');
      } else {
        console.log('✓ No JavaScript errors detected');
      }
      
      console.groupEnd();
    }
    
    /**
     * Display diagnostic results in the debug panel
     */
    displayResults() {
      const resultsContainer = document.querySelector('.debug-results');
      if (!resultsContainer) return;
      
      if (this.issues.length === 0) {
        resultsContainer.innerHTML = '<div class="debug-item-title">✅ No issues detected!</div>';
        return;
      }
      
      const issuesByCategory = this.groupIssuesByCategory();
      
      for (const [category, issues] of Object.entries(issuesByCategory)) {
        const categoryEl = document.createElement('div');
        categoryEl.className = 'debug-category';
        
        const categoryTitle = document.createElement('h4');
        categoryTitle.textContent = this.formatCategoryName(category);
        categoryEl.appendChild(categoryTitle);
        
        issues.forEach(issue => {
          const issueEl = document.createElement('div');
          issueEl.className = 'debug-item';
          
          const titleEl = document.createElement('div');
          titleEl.className = 'debug-item-title';
          titleEl.innerHTML = `
            ${issue.title}
            <span class="debug-item-status status-${issue.status}">${issue.status.toUpperCase()}</span>
          `;
          
          const detailsEl = document.createElement('div');
          detailsEl.className = 'debug-item-details';
          detailsEl.textContent = issue.details;
          
          issueEl.appendChild(titleEl);
          issueEl.appendChild(detailsEl);
          categoryEl.appendChild(issueEl);
        });
        
        resultsContainer.appendChild(categoryEl);
      }
      
      // Add 'outline' button to help visualize page structure
      const outlineBtn = document.createElement('button');
      outlineBtn.textContent = 'Toggle Element Outlines';
      outlineBtn.style.margin = '15px 0 0 0';
      outlineBtn.style.padding = '5px 10px';
      outlineBtn.style.backgroundColor = '#3498DB';
      outlineBtn.style.color = 'white';
      outlineBtn.style.border = 'none';
      outlineBtn.style.borderRadius = '4px';
      outlineBtn.style.cursor = 'pointer';
      
      outlineBtn.addEventListener('click', () => {
        document.body.classList.toggle('debug-outline');
      });
      
      resultsContainer.appendChild(outlineBtn);
    }
    
    /**
     * Group issues by their category
     */
    groupIssuesByCategory() {
      const groupedIssues = {};
      
      this.issues.forEach(issue => {
        if (!groupedIssues[issue.category]) {
          groupedIssues[issue.category] = [];
        }
        groupedIssues[issue.category].push(issue);
      });
      
      return groupedIssues;
    }
    
    /**
     * Format category name for display
     */
    formatCategoryName(category) {
      return category.charAt(0).toUpperCase() + category.slice(1);
    }
    
    /**
     * Add an issue to the diagnostics
     */
    addIssue(category, status, title, details) {
      this.issues.push({
        category,
        status,
        title,
        details
      });
      
      if (status === 'fail') {
        console.error(`[${category}] ${title}: ${details}`);
      } else if (status === 'warn') {
        console.warn(`[${category}] ${title}: ${details}`);
      } else {
        console.info(`[${category}] ${title}: ${details}`);
      }
    }
    
    /**
     * Find elements that might cause horizontal overflow
     */
    findElementsWithOverflow() {
      const elements = [];
      const viewportWidth = window.innerWidth;
      
      // Check all elements
      document.querySelectorAll('*').forEach(el => {
        const rect = el.getBoundingClientRect();
        
        // If element extends beyond viewport or has horizontal scrollbar
        if (rect.width > viewportWidth || el.scrollWidth > el.clientWidth) {
          elements.push({
            element: el,
            width: rect.width,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth
          });
        }
      });
      
      return elements;
    }
    
    /**
     * Check if a font is loaded
     */
    isFontLoaded(fontName) {
      // Create test elements
      const serif = document.createElement('span');
      serif.style.fontFamily = 'serif';
      serif.style.fontSize = '72px';
      serif.innerHTML = 'mmmmmmmmmmlli';
      
      const sansSerif = document.createElement('span');
      sansSerif.style.fontFamily = `"${fontName}", serif`;
      sansSerif.style.fontSize = '72px';
      sansSerif.innerHTML = 'mmmmmmmmmmlli';
      
      const body = document.body;
      body.appendChild(serif);
      body.appendChild(sansSerif);
      
      // Check dimensions
      const seriffWidth = serif.offsetWidth;
      const sansSerifWidth = sansSerif.offsetWidth;
      
      // Clean up
      body.removeChild(serif);
      body.removeChild(sansSerif);
      
      // If widths are different, custom font likely loaded
      return seriffWidth !== sansSerifWidth;
    }
    
    /**
     * Get the count of JavaScript errors
     */
    getJsErrorCount() {
      // This is a simple implementation
      // For a real implementation, you'd need to hook into window.onerror
      return window.jsErrors || 0;
    }
    
    /**
     * Get a query parameter value
     */
    getQueryParam(name) {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get(name);
    }
  }
  
  // Initialize diagnostics
  document.addEventListener('DOMContentLoaded', () => {
    // Track JS errors
    window.jsErrors = 0;
    window.addEventListener('error', () => {
      window.jsErrors++;
    });
    
    // Initialize diagnostics
    new JekyllDiagnostics();
  });pass {
          background-color: #2ecc71;
          color: white;
        }
        
        .status-fail {
          background-color: #e74c3c;
          color: white;
        }
        
        .status-