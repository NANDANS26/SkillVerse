// BrowserExtension/src/extractor.js

/**
 * Extracts metadata from the current GitHub repository DOM page.
 * Designed to execute cleanly in the page context via chrome.scripting.executeScript.
 * @returns {{ success: boolean, data?: Object, error?: string }}
 */
export function extractGitHubRepoMetadata() {
  try {
    const pathname = window.location.pathname;
    const parts = pathname.split('/').filter(Boolean);

    if (parts.length < 2) {
      return {
        success: false,
        error: 'Not a repository page. Expected format: github.com/{owner}/{repository}'
      };
    }

    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/i, '');
    const canonicalUrl = `https://github.com/${owner}/${repo}`;

    // Extract Description
    let description = '';
    const descSelectors = [
      'p.f4.my-3',
      '.BorderGrid-cell p',
      'meta[name="description"]',
      'meta[property="og:description"]',
      '[data-testid="issue-metadata-fixed"]'
    ];

    for (const sel of descSelectors) {
      const el = document.querySelector(sel);
      if (el) {
        if (el.tagName === 'META') {
          const content = el.getAttribute('content');
          if (content && !content.toLowerCase().startsWith('contribute to ')) {
            description = content.trim();
            break;
          }
        } else if (el.textContent && el.textContent.trim().length > 0) {
          description = el.textContent.trim();
          break;
        }
      }
    }

    // Extract Topic Tags
    const topicSelectors = [
      'a.topic-tag',
      'a[data-ga-click*="Topic"]',
      '.topic-tag-link',
      '[data-ga-click*="topic"]'
    ];
    const topicNodes = document.querySelectorAll(topicSelectors.join(', '));
    const topicsSet = new Set();
    topicNodes.forEach(node => {
      const text = node.textContent.trim();
      if (text && text.length < 50) {
        topicsSet.add(text.toLowerCase());
      }
    });

    // Check Repository Visibility (Private vs Public)
    let isPrivate = false;
    const labelNodes = document.querySelectorAll('span.Label, span.Label--secondary, span.Label--attention');
    labelNodes.forEach(lbl => {
      const txt = lbl.textContent.trim().toLowerCase();
      if (txt === 'private' || txt.includes('private')) {
        isPrivate = true;
      }
    });

    // Extract Primary Language if displayed in language breakdown
    let primaryLanguage = '';
    const langNode = document.querySelector('span.color-fg-default.text-bold.mr-1') ||
                     document.querySelector('li.d-inline a span');
    if (langNode && langNode.textContent) {
      primaryLanguage = langNode.textContent.trim();
    }

    return {
      success: true,
      data: {
        canonicalUrl,
        owner,
        repo,
        description,
        topics: Array.from(topicsSet).slice(0, 15),
        primaryLanguage,
        isPrivate,
        capturedAt: new Date().toISOString()
      }
    };
  } catch (err) {
    return {
      success: false,
      error: 'DOM extraction exception: ' + (err.message || 'Unknown error')
    };
  }
}
