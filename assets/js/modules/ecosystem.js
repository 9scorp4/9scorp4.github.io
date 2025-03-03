/**
 * Ecosystem Module
 * Handles the interactive ecosystem visualization component
 */

import DOMUtils from '../utils/dom.js';

const Ecosystem = {
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
    const ecosystemComponent = DOMUtils.get('.ecosystem-component');
    
    if (!ecosystemComponent) return;
    
    // Nodes are the main interactive elements
    const nodes = DOMUtils.getAll('.ecosystem-node');
    
    if (nodes.length === 0) return;
    
    // Add connection highlighting
    this.setupConnectionHighlighting(nodes);
    
    // Add entrance animations
    this.setupEntranceAnimations(nodes);
    
    // Add interactive features (optional)
    this.setupInteractiveFeatures(nodes);
  },
  
  /**
   * Set up connection highlighting between nodes
   * @param {NodeList} nodes - List of ecosystem nodes
   */
  setupConnectionHighlighting(nodes) {
    nodes.forEach(node => {
      // When hovering over a node, highlight connections
      DOMUtils.on(node, 'mouseenter', () => {
        // Get connections from data attribute
        const connections = this.getNodeConnections(node);
        
        if (connections.length === 0) return;
        
        // Highlight node itself
        DOMUtils.addClass(node, 'is-active');
        
        // Highlight connected nodes
        nodes.forEach(otherNode => {
          const nodeId = this.getNodeId(otherNode);
          
          if (connections.includes(nodeId)) {
            DOMUtils.addClass(otherNode, 'connected');
          }
        });
      });
      
      // When mouse leaves, remove highlighting
      DOMUtils.on(node, 'mouseleave', () => {
        // Remove active state from this node
        DOMUtils.removeClass(node, 'is-active');
        
        // Remove connected state from all nodes
        nodes.forEach(otherNode => {
          DOMUtils.removeClass(otherNode, 'connected');
        });
      });
    });
  },
  
  /**
   * Set up entrance animations for nodes
   * @param {NodeList} nodes - List of ecosystem nodes
   */
  setupEntranceAnimations(nodes) {
    // Add fade-in animation classes with staggered delays
    nodes.forEach((node, index) => {
      DOMUtils.addClass(node, 'fade-in');
      node.style.transitionDelay = `${index * 0.15}s`;
    });
    
    // Make nodes visible after a short delay
    setTimeout(() => {
      nodes.forEach(node => {
        DOMUtils.addClass(node, 'visible');
      });
    }, 100);
  },
  
  /**
   * Add extra interactive features to ecosystem component
   * @param {NodeList} nodes - List of ecosystem nodes
   */
  setupInteractiveFeatures(nodes) {
    // Add click functionality for mobile devices
    // This is optional but helps with mobile UX
    if ('ontouchstart' in window) {
      nodes.forEach(node => {
        DOMUtils.on(node, 'click', (e) => {
          // If not already active, prevent default and show connections
          if (!DOMUtils.hasClass(node, 'is-active')) {
            e.preventDefault();
            
            // Remove active state from all nodes
            nodes.forEach(n => {
              DOMUtils.removeClass(n, 'is-active');
              DOMUtils.removeClass(n, 'connected');
            });
            
            // Add active state to clicked node
            DOMUtils.addClass(node, 'is-active');
            
            // Get connections from data attribute
            const connections = this.getNodeConnections(node);
            
            if (connections.length === 0) return;
            
            // Highlight connected nodes
            nodes.forEach(otherNode => {
              const nodeId = this.getNodeId(otherNode);
              
              if (connections.includes(nodeId)) {
                DOMUtils.addClass(otherNode, 'connected');
              }
            });
          }
        });
      });
      
      // Close connections when clicking outside
      DOMUtils.on(document, 'click', (e) => {
        if (!DOMUtils.get('.ecosystem-component').contains(e.target)) {
          nodes.forEach(node => {
            DOMUtils.removeClass(node, 'is-active');
            DOMUtils.removeClass(node, 'connected');
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
    const connectionsAttr = node.dataset.connections || '';
    return connectionsAttr.split(',').filter(Boolean).map(id => id.trim());
  },
  
  /**
   * Get node ID from its title
   * @param {Element} node - The ecosystem node
   * @return {string} - Node ID derived from title
   */
  getNodeId(node) {
    const titleEl = node.querySelector('.ecosystem-node-title');
    
    if (!titleEl) return '';
    
    // Generate ID from title: "Technical Methods" -> "technical-methods"
    return titleEl.textContent.trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }
};

export default Ecosystem;