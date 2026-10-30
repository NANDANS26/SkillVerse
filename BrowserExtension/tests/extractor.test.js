// BrowserExtension/tests/extractor.test.js
import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { extractGitHubRepoMetadata } from '../src/extractor.js';

describe('SkillVerse Companion: DOM Extractor Module', () => {
  beforeEach(() => {
    // Setup minimal global mocks
    global.window = {
      location: {
        pathname: '/facebook/react'
      }
    };

    global.document = {
      querySelector: (selector) => {
        if (selector === 'p.f4.my-3') {
          return { tagName: 'P', textContent: 'The library for web and native user interfaces.' };
        }
        if (selector === 'span.color-fg-default.text-bold.mr-1') {
          return { tagName: 'SPAN', textContent: 'JavaScript' };
        }
        return null;
      },
      querySelectorAll: (selector) => {
        if (selector.includes('.topic-tag') || selector.includes('Topic')) {
          return [
            { textContent: 'react' },
            { textContent: 'javascript' },
            { textContent: 'frontend' }
          ];
        }
        if (selector.includes('Label')) {
          return [{ textContent: 'Public' }];
        }
        return [];
      }
    };
  });

  it('extracts canonical metadata from a standard public GitHub repository page', () => {
    const res = extractGitHubRepoMetadata();
    assert.equal(res.success, true);
    assert.equal(res.data.owner, 'facebook');
    assert.equal(res.data.repo, 'react');
    assert.equal(res.data.canonicalUrl, 'https://github.com/facebook/react');
    assert.equal(res.data.description, 'The library for web and native user interfaces.');
    assert.deepEqual(res.data.topics, ['react', 'javascript', 'frontend']);
    assert.equal(res.data.primaryLanguage, 'JavaScript');
    assert.equal(res.data.isPrivate, false);
    assert.ok(res.data.capturedAt);
  });

  it('detects private repository badge correctly', () => {
    global.document.querySelectorAll = (selector) => {
      if (selector.includes('Label')) {
        return [{ textContent: 'Private' }];
      }
      return [];
    };

    const res = extractGitHubRepoMetadata();
    assert.equal(res.success, true);
    assert.equal(res.data.isPrivate, true);
  });

  it('returns failure when path is not a repository root', () => {
    global.window.location.pathname = '/explore';
    const res = extractGitHubRepoMetadata();
    assert.equal(res.success, false);
    assert.ok(res.error.includes('Not a repository page'));
  });
});
