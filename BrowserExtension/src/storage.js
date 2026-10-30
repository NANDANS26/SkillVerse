// BrowserExtension/src/storage.js

export const DEFAULT_APP_URL = 'http://localhost:5173';

/**
 * Retrieves the configured SkillVerse Web App URL from chrome.storage
 * Falls back to DEFAULT_APP_URL
 * @returns {Promise<string>}
 */
export async function getSkillverseAppUrl() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return DEFAULT_APP_URL;
  }
  return new Promise(resolve => {
    chrome.storage.local.get(['skillverseAppUrl'], result => {
      const stored = result && result.skillverseAppUrl;
      resolve(stored && typeof stored === 'string' ? stored.replace(/\/+$/, '') : DEFAULT_APP_URL);
    });
  });
}

/**
 * Persists the configured SkillVerse Web App URL
 * @param {string} url 
 * @returns {Promise<void>}
 */
export async function setSkillverseAppUrl(url) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }
  const cleanUrl = url.trim().replace(/\/+$/, '');
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ skillverseAppUrl: cleanUrl }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Retrieves stored draft if one exists
 * @returns {Promise<Object|null>}
 */
export async function getStoredDraft() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return null;
  }
  return new Promise(resolve => {
    chrome.storage.local.get(['pendingDraft'], result => {
      resolve(result && result.pendingDraft ? result.pendingDraft : null);
    });
  });
}

/**
 * Persists current working draft in local storage
 * @param {Object} draft 
 * @returns {Promise<void>}
 */
export async function setStoredDraft(draft) {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ pendingDraft: draft }, () => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else {
        resolve();
      }
    });
  });
}

/**
 * Clears stored draft
 * @returns {Promise<void>}
 */
export async function clearStoredDraft() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) {
    return;
  }
  return new Promise(resolve => {
    chrome.storage.local.remove(['pendingDraft'], () => resolve());
  });
}
