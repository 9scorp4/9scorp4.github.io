/**
 * Ecosystem Visualization Module
 * 
 * Handles the interactive behavior of the research ecosystem visualization
 * Uses a systems thinking approach to manage component interactions
 */
import { animateElements, fadeIn } from '../utils/animations.js';
import { onElementsInView } from '../utils/dom.js';

export class EcosystemVisualization {
  /**
   * Initialize the ecosystem visualization
   */
  constructor() {
    this.container = document.querySelector('.ecosystem-component');
    
    // Exit if component isn't on current page
    if (!this.container) {
      return;
    }
    
    // Find key elements
    this.nodes = this.container.querySelectorAll('.ecosystem-node');
    
    // Initialize the component
    this.init();
  }
  
  /**
   * Initialize the visualization
   */
  init() {
    // Bind event handlers to maintain 'this' context
    this.handleNodeMouseEnter = this.handleNodeMouseEnter.bind(this);
    this.handleNodeMouseLeave = this.handleNodeMouseLeave.bind(this);
    
    // Set up event listeners
    this.bindEvents();
    
    // Set up animation
    this.setupAnimations();
    
    // Track initialization for debugging
    this.container.dataset.initialized = true;
  }
  
  /**
   * Bind all event listeners
   */
  bindEvents() {
    // Add interaction handlers for each node
    this.nodes.forEach(node => {
      node.addEventListener('mouseenter', this.handleNodeMouseEnter);
      node.addEventListener('mouseleave', this.handleNodeMouseLeave);
    });
    
    // Use Intersection Observer to trigger animations when visible
    onElementsInView(this.nodes, (node) => {
      this.animateNodeEntry(node);
    });
  }
  
  /**
   * Set up animations for ecosystem nodes
   */
  setupAnimations() {
    // Add transition classes to nodes
    this.nodes.forEach((node, index) => {
      node.classList.add('fade-in');
      node.style.transitionDelay = `${index * 0.15}s`;
    });
  }
  
  /**
   * Animate a node when it enters the viewport
   * @param {HTMLElement} node - The node to animate
   */
  animateNodeEntry(node) {
    // Add visible class to trigger CSS transition
    setTimeout(() => {
      node.classList.add('visible');
    }, 50); // Small delay to ensure proper transition
  }
  
  /**
   * Handle mouse enter on ecosystem node
   * @param {Event} event - The mouse event
   */
  handleNodeMouseEnter(event) {
    const currentNode = event.currentTarget;
    // Get connections from data attribute
    const connections = currentNode.dataset.connections?.split(',') || [];
    
    // Add active class to current node
    currentNode.classList.add('active');
    
    // Highlight connected nodes
    this.nodes.forEach(node => {
      // Get the ID from the node title
      const nodeId = node.querySelector('.ecosystem-node-title')
        .textContent.toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');
      
      // Add connected class if in connections array
      if (connections.includes(nodeId)) {
        node.classList.add('connected');
      } else if (node !== currentNode) {
        // Dim other nodes that aren't connected
        node.classList.add('dimmed');
      }
    });
  }
  
  /**
   * Handle mouse leave on ecosystem node
   * @param {Event} event - The mouse event
   */
  handleNodeMouseLeave() {
    // Remove all special classes from nodes
    this.nodes.forEach(node => {
      node.classList.remove('active', 'connected', 'dimmed');
    });
  }
  
  /**
   * Clean up the component and remove event listeners
   * Called when the page is unloaded or component is destroyed
   */
  destroy() {
    // Remove all event listeners
    this.nodes.forEach(node => {
      node.removeEventListener('mouseenter', this.handleNodeMouseEnter);
      node.removeEventListener('mouseleave', this.handleNodeMouseLeave);
    });
    
    // Optional: log clean-up for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log('Ecosystem visualization destroyed');
    }
  }
}