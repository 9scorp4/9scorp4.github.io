---
title: "Search"
permalink: /search/
layout: single
author_profile: false
---

<div class="search-container">
  <div class="search-header">
    <h1>{{ page.title }}</h1>
    <p class="search-description">Search across all content in the research ecosystem.</p>
  </div>
  
  <div class="search-form-container">
    <form role="search" method="get" class="search-form" action="{{ '/search/' | relative_url }}">
      <label for="search-input">
        <i class="fas fa-search" aria-hidden="true"></i>
        <span class="sr-only">Search for:</span>
      </label>
      <input type="search" id="search-input" class="search-input" placeholder="Search..." name="q" required>
      <button type="submit" class="search-submit">
        <i class="fas fa-arrow-right" aria-hidden="true"></i>
        <span class="sr-only">Submit search</span>
      </button>
    </form>
  </div>
  
  <div class="search-info">
    <p>Type your search query above and press Enter or click the search button. Results will appear below.</p>
  </div>
  
  <div id="search-results" class="search-results"></div>
  
  <div class="search-categories">
    <h2>Browse by Category</h2>
    <div class="category-grid">
      <a href="/blog/?category=research" class="category-card">
        <div class="category-icon"><i class="fas fa-microscope"></i></div>
        <h3>Research</h3>
        <p>Methodological insights and academic reflections</p>
      </a>
      
      <a href="/blog/?category=technical" class="category-card">
        <div class="category-icon"><i class="fas fa-code"></i></div>
        <h3>Technical</h3>
        <p>Programming techniques and implementation details</p>
      </a>
      
      <a href="/blog/?category=reflection" class="category-card">
        <div class="category-icon"><i class="fas fa-brain"></i></div>
        <h3>Reflection</h3>
        <p>Personal insights and disciplinary observations</p>
      </a>
    </div>
  </div>
</div>

<style>
  .search-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
  
  .search-header {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .search-description {
    color: var(--color-text);
    opacity: 0.8;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .search-form-container {
    margin-bottom: 2rem;
  }
  
  .search-form {
    display: flex;
    flex-wrap: nowrap;
    position: relative;
    max-width: 600px;
    margin: 0 auto;
  }
  
  .search-form label {
    position: absolute;
    left: 1rem;
    top: 50%;
    transform: translateY(-50%);
    color: var(--color-neutral);
  }
  
  .search-input {
    flex: 1;
    padding: 1rem 1rem 1rem 2.5rem;
    font-size: 1.1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px 0 0 8px;
    transition: border-color 0.3s ease;
  }
  
  .search-input:focus {
    outline: none;
    border-color: var(--color-primary);
  }
  
  .search-submit {
    background-color: var(--color-primary);
    color: white;
    border: none;
    padding: 0 1.5rem;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .search-submit:hover {
    background-color: var(--color-primary-dark);
  }
  
  .search-info {
    text-align: center;
    margin-bottom: 2rem;
    font-size: 0.9rem;
    color: var(--color-neutral);
  }
  
  .search-results {
    min-height: 200px;
  }
  
  .search-result-item {
    margin-bottom: 1.5rem;
    padding-bottom: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }
  
  .search-result-title {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
  }
  
  .search-result-title a {
    color: var(--color-secondary);
    text-decoration: none;
  }
  
  .search-result-title a:hover {
    text-decoration: underline;
  }
  
  .search-result-date {
    font-size: 0.8rem;
    color: var(--color-neutral);
    margin-bottom: 0.5rem;
  }
  
  .search-result-excerpt {
    font-size: 0.95rem;
    color: var(--color-text);
  }
  
  .search-categories {
    margin-top: 3rem;
  }
  
  .search-categories h2 {
    text-align: center;
    margin-bottom: 2rem;
  }
  
  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1.5rem;
  }
  
  .category-card {
    padding: 1.5rem;
    background-color: #f5f7fa;
    border-radius: 8px;
    text-decoration: none;
    color: var(--color-text);
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .category-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
    text-decoration: none;
  }
  
  .category-icon {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    background-color: var(--color-primary);
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 1rem;
    font-size: 1.5rem;
  }
  
  .category-card:nth-child(2) .category-icon {
    background-color: var(--color-secondary);
  }
  
  .category-card:nth-child(3) .category-icon {
    background-color: var(--color-accent);
  }
  
  .category-card h3 {
    margin-bottom: 0.5rem;
  }
  
  .category-card p {
    font-size: 0.9rem;
    opacity: 0.8;
    margin-bottom: 0;
  }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
  
  /* Responsive adjustments */
  @media (max-width: 576px) {
    .category-grid {
      grid-template-columns: 1fr;
    }
    
    .search-input {
      font-size: 1rem;
      padding: 0.75rem 0.75rem 0.75rem 2.5rem;
    }
  }
</style>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    const urlParams = new URLSearchParams(window.location.search);
    const query = urlParams.get('q');
    
    if (query) {
      searchInput.value = query;
      
      // If using the default Minimal Mistakes search functionality
      if (typeof searchIndex !== 'undefined') {
        // Use the site's search index
        const results = searchIndex.search(query);
        displayResults(results);
      } else {
        // Basic search implementation if the built-in search isn't available
        searchResults.innerHTML = '<div class="search-loading">Searching...</div>';
        
        // This would ideally be replaced with actual search functionality
        setTimeout(() => {
          searchResults.innerHTML = '<div class="search-info">To implement full search functionality, please enable the search feature in _config.yml and ensure all required plugins are installed.</div>';
        }, 1000);
      }
    }
    
    function displayResults(results) {
      searchResults.innerHTML = '';
      
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No results found for <strong>' + query + '</strong>.</div>';
        return;
      }
      
      results.forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        
        const title = document.createElement('h3');
        title.className = 'search-result-title';
        const titleLink = document.createElement('a');
        titleLink.href = result.url;
        titleLink.textContent = result.title;
        title.appendChild(titleLink);
        
        const date = document.createElement('div');
        date.className = 'search-result-date';
        date.textContent = result.date ? new Date(result.date).toLocaleDateString() : '';
        
        const excerpt = document.createElement('div');
        excerpt.className = 'search-result-excerpt';
        excerpt.textContent = result.excerpt;
        
        resultItem.appendChild(title);
        if (result.date) resultItem.appendChild(date);
        resultItem.appendChild(excerpt);
        
        searchResults.appendChild(resultItem);
      });
    }
  });
</script>