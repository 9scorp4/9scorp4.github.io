---
permalink: /debug/
title: "Layout Debugging"
layout: default
---

<div style="border: 3px solid red; padding: 20px; margin-bottom: 20px;">
  <h2>Debugging Information</h2>
  <p>This page contains diagnostic information about the sidebar implementation.</p>
</div>

<div style="display: flex; flex-wrap: wrap; gap: 20px;">
  <!-- Test the sidebar implementation directly -->
  <div style="flex: 1; min-width: 300px; border: 3px solid blue; padding: 20px;">
    <h3>Direct Sidebar Test</h3>
    <p>Testing direct implementation of the sidebar:</p>
    <div style="background-color: #ffeeee; padding: 10px; white-space: pre-wrap;">
      {% raw %}
      {% include sidebar.html %}
      {% endraw %}
    </div>
    <div style="margin-top: 20px;">
      Result:
      {% include sidebar.html %}
    </div>
  </div>

  <!-- Test the author profile implementation directly -->
  <div style="flex: 1; min-width: 300px; border: 3px solid green; padding: 20px;">
    <h3>Direct Author Profile Test</h3>
    <p>Testing direct implementation of the author profile:</p>
    <div style="background-color: #eeffee; padding: 10px; white-space: pre-wrap;">
      {% raw %}
      {% include author-profile.html %}
      {% endraw %}
    </div>
    <div style="margin-top: 20px;">
      Result:
      {% include author-profile.html %}
    </div>
  </div>
</div>

<div style="margin-top: 20px; border: 3px solid purple; padding: 20px;">
  <h3>Theme Configuration Debug</h3>
  <pre style="background-color: #eeeeff; padding: 10px; overflow-x: auto;">
  Theme: {{ site.remote_theme }}
  Layout: {{ page.layout }}
  Author Profile: {{ page.author_profile }}
  Default Author: {{ site.author.name | default: "Not defined" }}
  Custom Profile: {{ site.custom_author_profile | default: "Not enabled" }}
  </pre>
</div>

<div style="margin-top: 20px; border: 3px solid orange; padding: 20px;">
  <h3>CSS Debug</h3>
  <button onclick="document.querySelector('.sidebar').style.border = '5px solid red'; document.querySelector('.sidebar').style.backgroundColor = 'yellow';">Highlight Sidebar (if exists)</button>
  <button onclick="document.querySelectorAll('*').forEach(el => { if (getComputedStyle(el).display === 'none') { el.style.display = 'block'; el.style.border = '1px dashed red'; } });">Reveal Hidden Elements</button>
</div>