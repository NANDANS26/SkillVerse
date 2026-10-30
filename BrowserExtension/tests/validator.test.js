// BrowserExtension/tests/validator.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  isValidGitHubRepoUrl, 
  parseGitHubRepo, 
  normalizeGitHubUrl, 
  sanitizeText, 
  sanitizeTopics, 
  validateDraft 
} from '../src/validator.js';

describe('SkillVerse Companion: URL Validation & Normalization', () => {
  it('identifies valid GitHub repository URLs', () => {
    assert.equal(isValidGitHubRepoUrl('https://github.com/facebook/react'), true);
    assert.equal(isValidGitHubRepoUrl('https://github.com/torvalds/linux'), true);
    assert.equal(isValidGitHubRepoUrl('https://github.com/NANDANS26/SkillVerse.git'), true);
    assert.equal(isValidGitHubRepoUrl('https://github.com/owner/my-cool-project_123/tree/main'), true);
    assert.equal(isValidGitHubRepoUrl('https://www.github.com/owner/repo'), true);
  });

  it('rejects unsupported domains and non-repository paths', () => {
    assert.equal(isValidGitHubRepoUrl('https://gitlab.com/owner/repo'), false);
    assert.equal(isValidGitHubRepoUrl('https://bitbucket.org/owner/repo'), false);
    assert.equal(isValidGitHubRepoUrl('https://github.com/'), false);
    assert.equal(isValidGitHubRepoUrl('https://github.com/explore'), false);
    assert.equal(isValidGitHubRepoUrl('https://github.com/settings/profile'), false);
    assert.equal(isValidGitHubRepoUrl('https://github.com/notifications'), false);
    assert.equal(isValidGitHubRepoUrl('https://github.com/marketplace'), false);
    assert.equal(isValidGitHubRepoUrl('https://github.com/login'), false);
    assert.equal(isValidGitHubRepoUrl('http://localhost:3000'), false);
    assert.equal(isValidGitHubRepoUrl('javascript:alert(1)'), false);
    assert.equal(isValidGitHubRepoUrl(''), false);
    assert.equal(isValidGitHubRepoUrl(null), false);
  });

  it('correctly parses owner and repo name', () => {
    const res1 = parseGitHubRepo('https://github.com/facebook/react');
    assert.deepEqual(res1, { owner: 'facebook', repo: 'react' });

    const res2 = parseGitHubRepo('https://github.com/owner/project.git');
    assert.deepEqual(res2, { owner: 'owner', repo: 'project' });

    const res3 = parseGitHubRepo('https://github.com/invalid');
    assert.equal(res3, null);
  });

  it('normalizes GitHub URLs to canonical format', () => {
    assert.equal(
      normalizeGitHubUrl('https://github.com/owner/repo.git'),
      'https://github.com/owner/repo'
    );
    assert.equal(
      normalizeGitHubUrl('https://www.github.com/owner/repo/issues/42'),
      'https://github.com/owner/repo'
    );
    assert.equal(
      normalizeGitHubUrl('https://github.com/owner/repo/?tab=readme-ov-file#installation'),
      'https://github.com/owner/repo'
    );
  });
});

describe('SkillVerse Companion: Metadata Sanitization & Bounds', () => {
  it('sanitizes text and strips unprintable control characters', () => {
    const raw = 'Hello\x00\x08 World!\x1F\x7F';
    const clean = sanitizeText(raw, 50);
    assert.equal(clean, 'Hello World!');
  });

  it('enforces maximum text length bounds', () => {
    const longText = 'A'.repeat(3000);
    const sanitized = sanitizeText(longText, 2000);
    assert.equal(sanitized.length, 2000);
  });

  it('sanitizes and limits topic tag count and length', () => {
    const rawTopics = [
      'React', 'TYPE-script', 'node_js', 'c++', 
      'invalid tag with spaces', 'A'.repeat(100),
      't1', 't2', 't3', 't4', 't5', 't6', 't7', 't8', 't9', 't10', 't11', 't12', 't13'
    ];
    const sanitized = sanitizeTopics(rawTopics, 15, 50);
    assert.ok(sanitized.length <= 15);
    assert.ok(sanitized.includes('react'));
    assert.ok(sanitized.includes('type-script'));
    assert.ok(sanitized.includes('node_js'));
    assert.ok(!sanitized.includes('invalid tag with spaces')); // Spaces rejected
  });
});

describe('SkillVerse Companion: Draft Validation Schema', () => {
  it('validates a complete, authentic draft payload', () => {
    const draft = {
      repo_url: 'https://github.com/owner/ai-assistant.git',
      repo_name: 'ai-assistant',
      repo_owner: 'owner',
      description: 'An autonomous agent framework built with TypeScript.',
      contribution_summary: 'Architected the execution graph and implemented vector embeddings pipeline.',
      topics: ['typescript', 'agents', 'vector-search'],
      is_private: false,
      primary_language: 'TypeScript'
    };

    const res = validateDraft(draft);
    assert.equal(res.valid, true);
    assert.equal(res.errors.length, 0);
    assert.equal(res.sanitized.repo_url, 'https://github.com/owner/ai-assistant');
    assert.equal(res.sanitized.platform, 'github');
    assert.equal(res.sanitized.is_private, false);
    assert.equal(res.sanitized.client_version, '1.0.0');
  });

  it('rejects drafts missing required repository URL', () => {
    const draft = {
      repo_name: 'repo',
      repo_owner: 'owner'
    };
    const res = validateDraft(draft);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some(e => e.includes('GitHub repository URL')));
  });

  it('flags private repository visibility properly in draft', () => {
    const draft = {
      repo_url: 'https://github.com/owner/private-client-project',
      repo_name: 'private-client-project',
      repo_owner: 'owner',
      is_private: true
    };
    const res = validateDraft(draft);
    assert.equal(res.valid, true);
    assert.equal(res.sanitized.is_private, true);
  });
});
