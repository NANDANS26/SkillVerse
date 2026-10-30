// BrowserExtension/tests/handoff.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { serializeDraftToFragment, parseFragmentDraft } from '../src/handoff.js';

describe('SkillVerse Companion: URL Fragment Handoff Serialization', () => {
  const validDraft = {
    repo_url: 'https://github.com/torvalds/subsurface-for-dirk',
    repo_name: 'subsurface-for-dirk',
    repo_owner: 'torvalds',
    description: 'Divelog software for Linux and mobile devices.',
    contribution_summary: 'Authored Bluetooth LE dive computer synchronization protocols.',
    topics: ['c', 'qt', 'divelog'],
    is_private: false,
    primary_language: 'C'
  };

  it('serializes a draft into a URL fragment string starting with #draft=', () => {
    const res = serializeDraftToFragment(validDraft);
    assert.equal(res.success, true);
    assert.ok(res.fragment.startsWith('#draft='));
  });

  it('rejects serialization if draft fails schema validation', () => {
    const badDraft = { repo_url: 'not-a-repo' };
    const res = serializeDraftToFragment(badDraft);
    assert.equal(res.success, false);
    assert.ok(res.error.includes('GitHub repository URL'));
  });

  it('accurately parses and reconstructs the draft from the fragment string', () => {
    const serialized = serializeDraftToFragment(validDraft);
    const parsed = parseFragmentDraft(serialized.fragment);

    assert.equal(parsed.success, true);
    assert.equal(parsed.draft.repo_url, 'https://github.com/torvalds/subsurface-for-dirk');
    assert.equal(parsed.draft.repo_name, 'subsurface-for-dirk');
    assert.equal(parsed.draft.repo_owner, 'torvalds');
    assert.equal(parsed.draft.contribution_summary, 'Authored Bluetooth LE dive computer synchronization protocols.');
    assert.deepEqual(parsed.draft.topics, ['c', 'qt', 'divelog']);
    assert.equal(parsed.draft.platform, 'github');
    assert.equal(parsed.draft.is_private, false);
  });

  it('handles fragment with or without leading hash', () => {
    const serialized = serializeDraftToFragment(validDraft);
    const noHash = serialized.fragment.replace('#', '');
    const parsed = parseFragmentDraft(noHash);

    assert.equal(parsed.success, true);
    assert.equal(parsed.draft.repo_name, 'subsurface-for-dirk');
  });

  it('rejects tampered or unparseable JSON payloads', () => {
    const res1 = parseFragmentDraft('#draft=invalid-json-payload-%%%');
    assert.equal(res1.success, false);

    const res2 = parseFragmentDraft('#draft=' + encodeURIComponent(JSON.stringify({ repo_url: 'invalid' })));
    assert.equal(res2.success, false);
    assert.ok(res2.error.includes('Invalid draft schema'));
  });

  it('rejects empty or missing fragments', () => {
    assert.equal(parseFragmentDraft('').success, false);
    assert.equal(parseFragmentDraft('#other-hash').success, false);
    assert.equal(parseFragmentDraft(null).success, false);
  });
});
