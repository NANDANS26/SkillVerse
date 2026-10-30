// BrowserExtension/src/validator.js

const GITHUB_EXCLUDED_PATHS = new Set([
  'about', 'contact', 'customer-stories', 'explore', 'features', 'join', 
  'login', 'marketplace', 'new', 'notifications', 'organizations', 
  'pricing', 'pulls', 'issues', 'search', 'security', 'settings', 
  'sponsors', 'topics', 'trending', 'site', 'orgs'
]);

/**
 * Validates whether a URL is a supported GitHub repository page (github.com/{owner}/{repo})
 * @param {string} url 
 * @returns {boolean}
 */
export function isValidGitHubRepoUrl(url) {
  if (!url || typeof url !== 'string') return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') return false;
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;

    const parts = parsed.pathname.split('/').filter(Boolean);
    if (parts.length < 2) return false;

    const owner = parts[0].toLowerCase();
    const repo = parts[1].replace(/\.git$/i, '').toLowerCase();

    if (GITHUB_EXCLUDED_PATHS.has(owner)) return false;
    if (!/^[a-zA-Z0-9_.-]+$/.test(parts[0])) return false;
    if (!/^[a-zA-Z0-9_.-]+$/.test(parts[1])) return false;

    return true;
  } catch {
    return false;
  }
}

/**
 * Parses owner and repo name from GitHub URL
 * @param {string} url 
 * @returns {{ owner: string, repo: string } | null}
 */
export function parseGitHubRepo(url) {
  if (!isValidGitHubRepoUrl(url)) return null;
  const parsed = new URL(url);
  const parts = parsed.pathname.split('/').filter(Boolean);
  return {
    owner: parts[0],
    repo: parts[1].replace(/\.git$/i, '')
  };
}

/**
 * Normalizes GitHub URL to canonical format: https://github.com/{owner}/{repo}
 * @param {string} url 
 * @returns {string}
 */
export function normalizeGitHubUrl(url) {
  const parsed = parseGitHubRepo(url);
  if (!parsed) return '';
  return `https://github.com/${parsed.owner}/${parsed.repo}`;
}

/**
 * Sanitizes input text, strips non-printable control characters, and enforces length bounds
 * @param {string} text 
 * @param {number} maxLength 
 * @returns {string}
 */
export function sanitizeText(text, maxLength = 2000) {
  if (!text || typeof text !== 'string') return '';
  // Strip control characters except newline and tab
  const cleaned = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '').trim();
  return cleaned.slice(0, maxLength);
}

/**
 * Sanitizes topic tags array
 * @param {string[]} topics 
 * @param {number} maxCount 
 * @param {number} maxLen 
 * @returns {string[]}
 */
export function sanitizeTopics(topics, maxCount = 15, maxLen = 50) {
  if (!Array.isArray(topics)) return [];
  return topics
    .map(t => sanitizeText(String(t), maxLen).toLowerCase())
    .filter(t => t.length > 0 && /^[a-z0-9_.-]+$/.test(t))
    .slice(0, maxCount);
}

/**
 * Validates a repository evidence draft payload before handoff
 * @param {Object} draft 
 * @returns {{ valid: boolean, errors: string[], sanitized: Object | null }}
 */
export function validateDraft(draft) {
  const errors = [];
  if (!draft || typeof draft !== 'object') {
    return { valid: false, errors: ['Draft payload must be an object'], sanitized: null };
  }

  const rawUrl = draft.repo_url || draft.canonicalUrl;
  if (!isValidGitHubRepoUrl(rawUrl)) {
    errors.push('A valid GitHub repository URL is required (https://github.com/{owner}/{repo})');
  }

  const canonicalUrl = normalizeGitHubUrl(rawUrl);
  const repoMeta = parseGitHubRepo(canonicalUrl);

  const repoName = sanitizeText(draft.repo_name || (repoMeta ? repoMeta.repo : ''), 100);
  if (!repoName) {
    errors.push('Repository name is required');
  }

  const repoOwner = sanitizeText(draft.repo_owner || (repoMeta ? repoMeta.owner : ''), 100);
  if (!repoOwner) {
    errors.push('Repository owner is required');
  }

  const description = sanitizeText(draft.description || '', 2000);
  const contributionSummary = sanitizeText(draft.contribution_summary || draft.contributionSummary || '', 2000);
  const topics = sanitizeTopics(draft.topics || []);
  const proposedSkills = Array.isArray(draft.proposed_skills || draft.proposedSkills) 
    ? (draft.proposed_skills || draft.proposedSkills).map(s => sanitizeText(String(s), 50)).filter(Boolean)
    : [];

  const isPrivate = Boolean(draft.is_private || draft.isPrivate);
  const capturedAt = draft.captured_at || draft.capturedAt || new Date().toISOString();

  if (errors.length > 0) {
    return { valid: false, errors, sanitized: null };
  }

  return {
    valid: true,
    errors: [],
    sanitized: {
      platform: 'github',
      repo_url: canonicalUrl,
      repo_name: repoName,
      repo_owner: repoOwner,
      description,
      topics,
      is_private: isPrivate,
      primary_language: sanitizeText(draft.primary_language || draft.primaryLanguage || '', 50),
      contribution_summary: contributionSummary,
      proposed_skills: proposedSkills,
      captured_at: capturedAt,
      client_version: '1.0.0'
    }
  };
}
