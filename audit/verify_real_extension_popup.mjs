import { chromium } from '../Frontend/node_modules/@playwright/test/index.mjs';
import path from 'node:path';
import fs from 'node:fs';

const extPath = path.resolve('BrowserExtension');

async function testRealExtension() {
  console.log('=== REAL CHROME EXTENSION POPUP AUDIT ===');
  console.log('Testing unpacked extension load in Chromium...');

  const userDataDir = path.resolve('audit/test_user_data');
  if (fs.existsSync(userDataDir)) {
    fs.rmSync(userDataDir, { recursive: true, force: true });
  }

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`
    ]
  });

  try {
    // 1. Inspect chrome://extensions
    const adminPage = await context.newPage();
    await adminPage.goto('chrome://extensions');
    const extInfo = await adminPage.evaluate(() => {
      const manager = document.querySelector('extensions-manager');
      const itemList = manager?.shadowRoot.querySelector('extensions-item-list');
      const items = itemList?.shadowRoot.querySelectorAll('extensions-item');
      if (!items) return null;
      for (const item of items) {
        const name = item.shadowRoot.querySelector('#name')?.textContent.trim();
        const id = item.getAttribute('id');
        const errors = item.shadowRoot.querySelector('#errors-button');
        if (name && name.includes('SkillVerse')) {
          return { id, name, hasErrors: Boolean(errors) };
        }
      }
      return null;
    });

    console.log('Extensions Audit:', extInfo);
    const extId = extInfo.id;

    // 2. Open GitHub repository page
    const githubPage = await context.newPage();
    await githubPage.goto('https://github.com/facebook/react', { waitUntil: 'domcontentloaded' });
    console.log('GitHub page active:', await githubPage.title());

    // 3. Open Popup
    const popupUrl = `chrome-extension://${extId}/popup.html`;
    const popupPage = await context.newPage();
    await popupPage.goto(popupUrl);

    // Wait for async init() to complete
    await popupPage.waitForFunction(() => {
      const vReady = document.getElementById('view-ready');
      const vUnsupported = document.getElementById('view-unsupported');
      const vPreview = document.getElementById('view-preview');
      return (
        (vReady && !vReady.classList.contains('hidden')) ||
        (vUnsupported && !vUnsupported.classList.contains('hidden')) ||
        (vPreview && !vPreview.classList.contains('hidden'))
      );
    }, { timeout: 5000 });

    const activeView = await popupPage.evaluate(() => {
      const vReady = !document.getElementById('view-ready').classList.contains('hidden');
      const vUnsupported = !document.getElementById('view-unsupported').classList.contains('hidden');
      const vPreview = !document.getElementById('view-preview').classList.contains('hidden');
      const unsupportedUrl = document.getElementById('unsupported-url')?.textContent;
      return { vReady, vUnsupported, vPreview, unsupportedUrl };
    });

    console.log('Active Popup View after async init():', activeView);

    // 4. Test Settings View toggle
    console.log('Testing Settings View toggle in real extension popup...');
    await popupPage.click('#btn-settings-toggle');
    const settingsVisible = await popupPage.evaluate(() => {
      return !document.getElementById('view-settings').classList.contains('hidden');
    });
    console.log('Settings view opened:', settingsVisible);

    const appUrlValue = await popupPage.inputValue('#input-app-url');
    console.log('Current SkillVerse App URL in settings:', appUrlValue);

    await popupPage.click('#btn-cancel-settings');
    const settingsClosed = await popupPage.evaluate(() => {
      return document.getElementById('view-settings').classList.contains('hidden');
    });
    console.log('Settings view closed on Cancel:', settingsClosed);

    // 5. Check whether the native popup toolbar gesture is callable programmatically
    // In Chromium/Playwright:
    // Can Playwright click the action button in the Chrome toolbar?
    // In Chromium extensions, the action button is in the browser frame UI (C++ Chrome views / Omnibox / Toolbar),
    // which is outside the web DOM and cannot be targeted by page.click()!
    console.log('\n--- Chrome Extension Architecture Evaluation ---');
    console.log('Can Playwright simulate physical Chrome toolbar button click?');
    console.log('Finding: Chrome toolbar buttons are native C++ desktop widgets not exposed to DOM selectors.');
    console.log('Is chrome.action.openPopup() supported without user gesture?');
    
    const openPopupSupported = await popupPage.evaluate(async () => {
      if (typeof chrome !== 'undefined' && chrome.action && typeof chrome.action.openPopup === 'function') {
        try {
          await chrome.action.openPopup();
          return 'openPopup executed';
        } catch (e) {
          return 'openPopup rejected: ' + e.message;
        }
      }
      return 'chrome.action.openPopup undefined';
    });
    console.log('chrome.action.openPopup result:', openPopupSupported);

    await context.close();
    return {
      success: true,
      extInfo,
      activeView,
      settingsVisible,
      settingsClosed,
      openPopupSupported
    };
  } catch (err) {
    console.error('Error during real extension audit:', err);
    await context.close().catch(() => {});
    return { success: false, error: err.message };
  }
}

testRealExtension().then(res => {
  console.log('\nAudit Results Summary:', JSON.stringify(res, null, 2));
  process.exit(res.success ? 0 : 1);
});
