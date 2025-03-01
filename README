# Nicolas Arias Garcia - Portfolio Site

A research portfolio built with Jekyll and the Minimal Mistakes theme, showcasing work in anthropology, systems thinking, and digital research.

## Site Structure and Organization

This portfolio is organized around a systems thinking approach, with interconnected content domains that reflect both academic background and technical skills.

### Key Content Areas

- **About**: Professional background and expertise
- **Research Ecosystem**: Systems-oriented methodology framework
- **Projects**: Technical and research implementations
- **Knowledge Hub**: Blog posts and articles across domains
- **Professional**: CV and contact information

### Technical Implementation

- **Framework**: Jekyll static site generator
- **Theme**: Modified version of Minimal Mistakes
- **Hosting**: GitHub Pages
- **Custom Features**:
  - Systems-oriented visualization components
  - Enhanced navigation structure
  - SVG-based diagrams
  - Responsive design

## Development Guide

### Local Development Setup

1. **Prerequisites**:
   - Ruby (2.5.0 or higher)
   - Bundler (`gem install bundler`)
   - Git

2. **Installation**:
   ```bash
   # Clone the repository
   git clone https://github.com/9scorp4/9scorp4.github.io.git
   cd 9scorp4.github.io
   
   # Install dependencies
   bundle install
   
   # Start local server
   bundle exec jekyll serve
   ```

3. **View locally**:
   - Open http://localhost:4000 in your browser

### Project Organization

```
9scorp4.github.io/
├── _data/               # Site data files
│   ├── authors.yml      # Author information
│   ├── ecosystem_domains.yml # Research domains data
│   ├── navigation.yml   # Navigation structure
│   └── ui-text.yml      # UI text elements
├── _includes/           # Template partials
│   ├── author-profile.html  # Author sidebar
│   ├── breadcrumbs.html     # Navigation breadcrumbs
│   ├── ecosystem-component.html # Research visualization
│   ├── footer.html          # Site footer
│   ├── head/                # Head elements
│   └── ...
├── _layouts/            # Page layouts
│   ├── default.html     # Base layout
│   ├── home.html        # Homepage layout
│   ├── single.html      # Standard content page
│   └── with-sidebar.html # Page with sidebar
├── _pages/              # Site pages
│   ├── about.md         # About page
│   ├── blog.md          # Blog listing page
│   ├── ecosystem.md     # Research ecosystem page
│   └── ...
├── _posts/              # Blog posts
│   └── ...
├── _sass/               # Sass partials
│   └── minimal-mistakes/ # Theme customizations
├── assets/              # Site assets
│   ├── css/             # Compiled CSS
│   ├── images/          # Images
│   ├── js/              # JavaScript files
│   └── ...
├── _config.yml          # Site configuration
└── index.md             # Homepage
```

### CSS/Design System

This site uses a custom variation of the Minimal Mistakes theme with:

- **Color Palette**:
  - Primary (Deep Navy): `#2C3E50`
  - Secondary (Digital Blue): `#3498DB`
  - Accent (Terra Cotta): `#E67E22`
  - Background Light: `#F5F7FA`
  - Background Dark: `#1A202C`
  - Text Primary: `#2D3748`
  - Neutral: `#718096`

- **Typography**:
  - Headings: Montserrat
  - Body Text: Source Sans Pro
  - Code: Fira Mono

### Adding Content

#### Blog Posts

Create a new `.md` file in the `_posts` directory:

```markdown
---
title: "Post Title"
excerpt: "Short description"
date: YYYY-MM-DD
categories:
  - Research
tags:
  - tag1
  - tag2
header:
  teaser: "/assets/images/posts/teaser-image.jpg"
---

Content goes here...
```

#### Adding Pages

Create a new `.md` file in the `_pages` directory:

```markdown
---
permalink: /page-url/
title: "Page Title"
layout: single
---

Content goes here...
```

### Debugging

This site includes several debugging tools:

1. **URL Parameters**:
   - Add `?debug=true` to any URL to enable debug mode
   - Example: `https://9scorp4.github.io/about/?debug=true`

2. **JavaScript Console**:
   - Open browser developer tools to view detailed diagnostics

3. **Diagnostic Script**:
   - `assets/js/diagnostics.js` provides detailed site analysis

## Deployment

This site is automatically deployed through GitHub Pages:

1. **Push to main branch**:
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```

2. **GitHub Actions**:
   - Automated build process defined in `.github/workflows/jekyll.yml`
   - Builds and deploys to GitHub Pages

## Contact

- GitHub: [@9scorp4](https://github.com/9scorp4)
- LinkedIn: [Nicolas Arias Garcia](https://www.linkedin.com/in/nicag/)

## License

Content is Copyright © 2025 Nicolas Arias Garcia. All rights reserved.