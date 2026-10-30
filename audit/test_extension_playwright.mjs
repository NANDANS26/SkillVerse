import { chromium } from '../Frontend/node_modules/@playwright/test/index.mjs';
import path from 'node:path';

const extPath = path.resolve('BrowserExtension');

async function run() {
  console.log('Testing unpacked extension load in Chromium...');
  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extPath}`,
      `--load-extension=${extPath}`
    ]
  });

  const page = await context.newPage();
  await page.goto('chrome://extensions');

  const extData = await page.evaluate(async () => {
    const manager = document.querySelector('extensions-manager');
    if (!manager) return { error: 'No extensions-manager' };
    const itemList = manager.shadowRoot.querySelector('extensions-item-list');
    if (!itemList) return { error: 'No extensions-item-list' };
    const items = itemList.shadowRoot.querySelectorAll('extensions-item');
    return Array.from(items).map(item => {
      const nameEl = item.shadowRoot.querySelector('#name');
      const descEl = item.shadowRoot.querySelector('#description');
      const idEl = item.getAttribute('id');
      const enabledToggle = item.shadowRoot.querySelector('#enableToggle');
      return {
        id: idEl,
        name: nameEl ? nameEl.textContent.trim() : null,
        description: descEl ? descEl.textContent.trim() : null,
        enabled: enabledToggle ? enabledToggle.getAttribute('aria-checked') : null
      };
    });
  });

  console.log('Extensions found in Chromium:', JSON.stringify(extData, null, 2));

  if (Array.isArray(extData) && extData.length > 0) {
    const skillverseExt = extData.find(e => e.name?.includes('SkillVerse'));
    if (skillverseExt) {
      console.log(`\nFound SkillVerse Companion! Extension ID: ${skillverseExt.id}`);
      console.log('Opening popup directly via chrome-extension protocol:');
      const popupUrl = `chrome-extension://${skillverseExt.id}/popup.html`;
      console.log('Popup URL:', popupUrl);
      
      const popupPage = await context.newPage();
      await popupPage.goto(popupUrl);
      console.log('Popup page title:', await popupPage.title());
      const bodyHtml = await popupPage.content();
      console.log('Popup loaded successfully! Body length:', bodyHtml.length);
      
      // Check popup UI elements
      const headerText = await popupPage.locator('h1').textContent().catch(() => null);
      console.log('Header text:', headerText);
      const extractBtn = await popupPage.locator('#extract-btn').isVisible().catch(() => false);
      console.log('Extract button visible:', extractBtn);
      const statusText = await popupPage.locator('#status-message').textContent().catch(() => null);
      console.log('Status message:', statusText);
    }
  }

  await context.close();
}

run().catch(err => {
  console.error('Fatal error in run:', err);
  process.exit(1);
});
