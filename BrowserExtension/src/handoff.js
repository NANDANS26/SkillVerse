// BrowserExtension/src/handoff.js
import { validateDraft } from './validator.js';

/**
 * Serializes a validated draft into a URL fragment string
 * e.g., #draft=%7B%22platform%22%3A%22github%22...%7D
 * @param {Object} draft 
 * @returns {{ success: boolean, fragment?: string, error?: string }}
 */
export function serializeDraftToFragment(draft) {
  const result = validateDraft(draft);
  if (!result.valid) {
    return { success: false, error: result.errors.join('; ') };
  }

  try {
    const jsonStr = JSON.stringify(result.sanitized);
    const encoded = encodeURIComponent(jsonStr);
    return { success: true, fragment: `#draft=${encoded}` };
  } catch (err) {
    return { success: false, error: 'Serialization failed: ' + err.message };
  }
}

/**
 * Parses and validates a draft from a URL fragment or hash string
 * @param {string} hashString 
 * @returns {{ success: boolean, draft?: Object, error?: string }}
 */
export function parseFragmentDraft(hashString) {
  if (!hashString || typeof hashString !== 'string') {
    return { success: false, error: 'No fragment string provided' };
  }

  let rawHash = hashString.trim();
  if (rawHash.startsWith('#')) {
    rawHash = rawHash.slice(1);
  }

  let encodedPayload = '';
  if (rawHash.startsWith('draft=')) {
    encodedPayload = rawHash.slice(6);
  } else {
    // Check if key-value pairs exist
    const params = new URLSearchParams(rawHash);
    const draftParam = params.get('draft');
    if (draftParam) {
      encodedPayload = draftParam;
    } else {
      return { success: false, error: 'Fragment does not contain a draft parameter' };
    }
  }

  try {
    const jsonStr = decodeURIComponent(encodedPayload);
    const parsed = JSON.parse(jsonStr);
    const validation = validateDraft(parsed);
    if (!validation.valid) {
      return { success: false, error: 'Invalid draft schema: ' + validation.errors.join('; ') };
    }
    return { success: true, draft: validation.sanitized };
  } catch (err) {
    return { success: false, error: 'Failed to decode draft from fragment: ' + err.message };
  }
}
