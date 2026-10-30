// BrowserExtension/src/popup.js
import { isValidGitHubRepoUrl, parseGitHubRepo, validateDraft, sanitizeText } from './validator.js';
import { serializeDraftToFragment } from './handoff.js';
import { 
  getSkillverseAppUrl, 
  setSkillverseAppUrl, 
  getStoredDraft, 
  setStoredDraft, 
  clearStoredDraft 
} from './storage.js';

// DOM Elements
const views = {
  unsupported: document.getElementById('view-unsupported'),
  ready: document.getElementById('view-ready'),
  capturing: document.getElementById('view-capturing'),
  preview: document.getElementById('view-preview'),
  transferring: document.getElementById('view-transferring'),
  settings: document.getElementById('view-settings')
};

const banner = document.getElementById('status-banner');
const unsupportedUrlEl = document.getElementById('unsupported-url');

const readyRepoTitle = document.getElementById('ready-repo-title');
const readyUrl = document.getElementById('ready-url');
const readyVisBadge = document.getElementById('ready-vis-badge');
const btnCapture = document.getElementById('btn-capture');

const previewRepoName = document.getElementById('preview-repo-name');
const previewRepoOwner = document.getElementById('preview-repo-owner');
const previewRepoDesc = document.getElementById('preview-repo-desc');
const previewVisBadge = document.getElementById('preview-vis-badge');
const previewTopics = document.getElementById('preview-topics');
const privateWarning = document.getElementById('private-warning');
const inputSummary = document.getElementById('input-summary');
const charCount = document.getElementById('char-count');
const inputSkills = document.getElementById('input-skills');
const displayAppUrl = document.getElementById('display-app-url');
const draftForm = document.getElementById('draft-form');
const btnCancelDraft = document.getElementById('btn-cancel-draft');

const btnSettingsToggle = document.getElementById('btn-settings-toggle');
const inputAppUrl = document.getElementById('input-app-url');
const btnSaveSettings = document.getElementById('btn-save-settings');
const btnCancelSettings = document.getElementById('btn-cancel-settings');

// State
let currentTab = null;
let currentDraft = null;
let appUrl = 'http://localhost:5173';
let previousView = 'ready';

function switchView(viewName) {
  Object.keys(views).forEach(name => {
    if (views[name]) {
      if (name === viewName) {
        views[name].classList.remove('hidden');
      } else {
        views[name].classList.add('hidden');
      }
    }
  });
}

function showBanner(message, type = 'error') {
  if (!banner) return;
  banner.textContent = message;
  banner.className = `status-banner ${type}`;
  banner.classList.remove('hidden');
}

function clearBanner() {
  if (!banner) return;
  banner.textContent = '';
  banner.className = 'status-banner hidden';
}

/**
 * In-page extractor function injected via chrome.scripting.executeScript
 */
function extractFromPage() {
  const parts = window.location.pathname.split('/').filter(Boolean);
  if (parts.length < 2) {
    return { success: false, error: 'Not a repository page' };
  }
  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/i, '');
  const canonicalUrl = `https://github.com/${owner}/${repo}`;

  let description = '';
  const descSelectors = ['p.f4.my-3', '.BorderGrid-cell p', 'meta[name="description"]'];
  for (const sel of descSelectors) {
    const el = document.querySelector(sel);
    if (el) {
      if (el.tagName === 'META') {
        const c = el.getAttribute('content');
        if (c && !c.toLowerCase().startsWith('contribute to ')) {
          description = c.trim();
          break;
        }
      } else if (el.textContent && el.textContent.trim().length > 0) {
        description = el.textContent.trim();
        break;
      }
    }
  }

  const topicNodes = document.querySelectorAll('a.topic-tag, a[data-ga-click*="Topic"]');
  const topics = Array.from(topicNodes).map(n => n.textContent.trim()).filter(Boolean);

  let isPrivate = false;
  const labels = document.querySelectorAll('span.Label, span.Label--secondary, span.Label--attention');
  labels.forEach(l => {
    if (l.textContent.trim().toLowerCase().includes('private')) {
      isPrivate = true;
    }
  });

  let primaryLanguage = '';
  const langEl = document.querySelector('span.color-fg-default.text-bold.mr-1');
  if (langEl) primaryLanguage = langEl.textContent.trim();

  return {
    success: true,
    data: {
      canonicalUrl,
      owner,
      repo,
      description,
      topics,
      primaryLanguage,
      isPrivate,
      capturedAt: new Date().toISOString()
    }
  };
}

/**
 * Populates preview interface with draft metadata
 */
function populatePreview(draft) {
  currentDraft = draft;
  previewRepoName.textContent = draft.repo_name;
  previewRepoOwner.textContent = `by ${draft.repo_owner}`;
  previewRepoDesc.textContent = draft.description || 'No description provided for this repository.';

  if (draft.is_private) {
    previewVisBadge.textContent = 'Private';
    previewVisBadge.className = 'badge-vis private';
    privateWarning.classList.remove('hidden');
  } else {
    previewVisBadge.textContent = 'Public';
    previewVisBadge.className = 'badge-vis';
    privateWarning.classList.add('hidden');
  }

  previewTopics.innerHTML = '';
  if (draft.topics && draft.topics.length > 0) {
    draft.topics.forEach(t => {
      const chip = document.createElement('span');
      chip.className = 'topic-chip';
      chip.textContent = t;
      previewTopics.appendChild(chip);
    });
  } else {
    const none = document.createElement('span');
    none.className = 'helper-text';
    none.textContent = 'No topic tags defined';
    previewTopics.appendChild(none);
  }

  inputSummary.value = draft.contribution_summary || '';
  updateCharCount();

  if (draft.proposed_skills && draft.proposed_skills.length > 0) {
    inputSkills.value = draft.proposed_skills.join(', ');
  } else if (draft.primary_language) {
    inputSkills.value = draft.primary_language;
  } else {
    inputSkills.value = '';
  }

  displayAppUrl.textContent = appUrl;
  switchView('preview');
}

function updateCharCount() {
  const len = inputSummary.value.length;
  charCount.textContent = `${len}/2000`;
}

/**
 * Main initialization
 */
async function init() {
  clearBanner();
  appUrl = await getSkillverseAppUrl();

  // Check if a stored draft exists
  const savedDraft = await getStoredDraft();
  if (savedDraft) {
    populatePreview(savedDraft);
    showBanner('Resumed pending repository draft', 'info');
    return;
  }

  // Inspect current tab
  if (typeof chrome === 'undefined' || !chrome.tabs || !chrome.tabs.query) {
    switchView('unsupported');
    unsupportedUrlEl.textContent = 'Chrome Tabs API unavailable (testing environment)';
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  if (!tab || !tab.url || !isValidGitHubRepoUrl(tab.url)) {
    switchView('unsupported');
    unsupportedUrlEl.textContent = tab && tab.url ? tab.url : 'No active tab URL detected';
    return;
  }

  // Valid GitHub repository detected
  const parsed = parseGitHubRepo(tab.url);
  readyRepoTitle.textContent = `${parsed.owner} / ${parsed.repo}`;
  readyUrl.textContent = `https://github.com/${parsed.owner}/${parsed.repo}`;
  readyVisBadge.textContent = 'GitHub';
  switchView('ready');
}

// User-initiated capture
btnCapture.addEventListener('click', async () => {
  clearBanner();
  switchView('capturing');

  try {
    if (!currentTab || !currentTab.id) {
      throw new Error('No active tab ID available to inspect');
    }

    const results = await chrome.scripting.executeScript({
      target: { tabId: currentTab.id },
      func: extractFromPage
    });

    if (!results || !results[0] || !results[0].result) {
      throw new Error('Unable to extract DOM content from current page');
    }

    const res = results[0].result;
    if (!res.success) {
      throw new Error(res.error || 'Failed to extract repository metadata');
    }

    const extracted = res.data;
    const validation = validateDraft({
      canonicalUrl: extracted.canonicalUrl,
      repo_name: extracted.repo,
      repo_owner: extracted.owner,
      description: extracted.description,
      topics: extracted.topics,
      is_private: extracted.isPrivate,
      primary_language: extracted.primaryLanguage,
      captured_at: extracted.capturedAt
    });

    if (!validation.valid) {
      throw new Error(validation.errors.join('; '));
    }

    await setStoredDraft(validation.sanitized);
    populatePreview(validation.sanitized);
  } catch (err) {
    switchView('ready');
    showBanner('Capture failed: ' + err.message, 'error');
  }
});

// Char counter
inputSummary.addEventListener('input', () => {
  updateCharCount();
  if (currentDraft) {
    currentDraft.contribution_summary = inputSummary.value;
    setStoredDraft(currentDraft);
  }
});

// Draft Form Submission / Transfer
draftForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearBanner();

  const summary = sanitizeText(inputSummary.value, 2000);
  if (!summary || summary.trim().length === 0) {
    showBanner('Please provide a contribution summary explaining your work on this project.', 'error');
    inputSummary.focus();
    return;
  }

  const rawSkills = inputSkills.value.split(',').map(s => sanitizeText(s, 50)).filter(Boolean);

  const updatedDraft = {
    ...currentDraft,
    contribution_summary: summary,
    proposed_skills: rawSkills
  };

  const validation = validateDraft(updatedDraft);
  if (!validation.valid) {
    showBanner('Validation error: ' + validation.errors.join('; '), 'error');
    return;
  }

  switchView('transferring');

  const handoff = serializeDraftToFragment(validation.sanitized);
  if (!handoff.success) {
    switchView('preview');
    showBanner('Handoff error: ' + handoff.error, 'error');
    return;
  }

  const destinationUrl = `${appUrl}/extension/import${handoff.fragment}`;

  try {
    await clearStoredDraft();
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      await chrome.tabs.create({ url: destinationUrl });
    } else {
      window.open(destinationUrl, '_blank');
    }
    showBanner('Draft transferred to SkillVerse! Review in the opened tab.', 'success');
  } catch (err) {
    switchView('preview');
    showBanner('Failed to open SkillVerse: ' + err.message, 'error');
  }
});

// Discard draft
btnCancelDraft.addEventListener('click', async () => {
  await clearStoredDraft();
  currentDraft = null;
  clearBanner();
  showBanner('Repository draft discarded.', 'info');
  if (currentTab && currentTab.url && isValidGitHubRepoUrl(currentTab.url)) {
    const parsed = parseGitHubRepo(currentTab.url);
    readyRepoTitle.textContent = `${parsed.owner} / ${parsed.repo}`;
    readyUrl.textContent = `https://github.com/${parsed.owner}/${parsed.repo}`;
    switchView('ready');
  } else {
    switchView('unsupported');
  }
});

// Settings View Toggle
btnSettingsToggle.addEventListener('click', () => {
  previousView = Object.keys(views).find(name => !views[name].classList.contains('hidden')) || 'ready';
  inputAppUrl.value = appUrl;
  switchView('settings');
});

btnCancelSettings.addEventListener('click', () => {
  switchView(previousView);
});

btnSaveSettings.addEventListener('click', async () => {
  const newUrl = inputAppUrl.value.trim().replace(/\/+$/, '');
  try {
    new URL(newUrl); // Validate URL format
    appUrl = newUrl;
    await setSkillverseAppUrl(newUrl);
    displayAppUrl.textContent = appUrl;
    showBanner('Settings saved successfully.', 'success');
    switchView(previousView);
  } catch {
    showBanner('Please provide a valid HTTP or HTTPS URL (e.g. http://localhost:5173)', 'error');
  }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', init);
