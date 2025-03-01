---
permalink: /blog/
title: "Knowledge Hub"
layout: archive
author_profile: true
sidebar:
  nav: "main"
---

<div class="knowledge-hub">
  <p class="lead">A collection of essays, technical writings, and research insights at the intersection of anthropology, systems thinking, and technology.</p>
  
  <div class="category-selector">
    <button class="category-btn active" data-category="all">All Posts</button>
    <button class="category-btn" data-category="research">Research</button>
    <button class="category-btn" data-category="technical">Technical</button>
    <button class="category-btn" data-category="reflection">Reflections</button>
  </div>
  
  <div class="post-grid">
    {% for post in site.posts %}
      <div class="post-card {% if post.categories %}{% for category in post.categories %}{{ category | downcase }}{% unless forloop.last %} {% endunless %}{% endfor %}{% endif %}">
        <div class="post-card__inner">
          {% if post.header.teaser %}
            <div class="post-card__image">
              <img src="{{ post.header.teaser | relative_url }}" alt="{{ post.title }}">
            </div>
          {% endif %}
          <div class="post-card__content">
            {% if post.categories %}
              <div class="post-card__categories">
                {% for category in post.categories %}
                  <span class="post-card__category {{ category | downcase }}">{{ category }}</span>
                {% endfor %}
              </div>
            {% endif %}
            <h2 class="post-card__title">
              <a href="{{ post.url | relative_url }}">{{ post.title }}</a>
            </h2>
            <div class="post-card__meta">
              <span class="post-card__date">{{ post.date | date: "%B %d, %Y" }}</span>
              {% if post.read_time %}
                <span class="post-card__read-time">{{ post.read_time }} min read</span>
              {% endif %}
            </div>
            <div class="post-card__excerpt">
              {{ post.excerpt | markdownify | strip_html | truncate: 160 }}
            </div>
          </div>
        </div>
      </div>
    {% endfor %}
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', () => {
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
  });
</script>

<style>
  .knowledge-hub {
    margin-top: 2em;
  }
  
  .lead {
    font-size: 1.1em;
    margin-bottom: 2em;
  }
  
  .category-selector {
    margin-bottom: 2em;
    display: flex;
    flex-wrap: wrap;
    gap: 0.5em;
  }
  
  .category-btn {
    padding: 0.5em 1em;
    background-color: #f0f0f0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9em;
    transition: all 0.2s ease;
  }
  
  .category-btn:hover {
    background-color: #e0e0e0;
  }
  
  .category-btn.active {
    background-color: var(--color-primary);
    color: white;
  }
  
  .post-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 2em;
  }
  
  .post-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  .post-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 10px 20px rgba(0,0,0,0.1);
  }
  
  .post-card__inner {
    display: flex;
    flex-direction: column;
    height: 100%;
  }
  
  .post-card__image {
    height: 160px;
    overflow: hidden;
  }
  
  .post-card__image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.3s ease;
  }
  
  .post-card:hover .post-card__image img {
    transform: scale(1.05);
  }
  
  .post-card__content {
    padding: 1.5em;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .post-card__categories {
    margin-bottom: 0.5em;
  }
  
  .post-card__category {
    display: inline-block;
    padding: 0.2em 0.6em;
    margin-right: 0.4em;
    margin-bottom: 0.4em;
    border-radius: 3px;
    font-size: 0.8em;
    font-weight: 500;
  }
  
  .post-card__category.research {
    background-color: rgba(52, 152, 219, 0.15);
    color: #3498db;
  }
  
  .post-card__category.technical {
    background-color: rgba(46, 204, 113, 0.15);
    color: #2ecc71;
  }
  
  .post-card__category.reflection {
    background-color: rgba(155, 89, 182, 0.15);
    color: #9b59b6;
  }
  
  .post-card__title {
    margin-top: 0;
    margin-bottom: 0.5em;
    font-size: 1.2em;
    line-height: 1.3;
  }
  
  .post-card__title a {
    color: var(--color-text);
    text-decoration: none;
  }
  
  .post-card__title a:hover {
    color: var(--color-primary);
  }
  
  .post-card__meta {
    margin-bottom: 0.8em;
    font-size: 0.85em;
    color: var(--color-neutral);
    display: flex;
    flex-wrap: wrap;
    gap: 1em;
  }
  
  .post-card__excerpt {
    font-size: 0.9em;
    color: var(--color-text);
    opacity: 0.8;
    flex-grow: 1;
  }
  
  @media (max-width: 768px) {
    .post-grid {
      grid-template-columns: 1fr;
    }
  }
</style>