// Frontend/tests/e2e/phase16_1_pilot_participation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SkillVerse Phase 16.1: End-to-End Pilot Participation UI and Acceptance Suite', () => {

  test('1. College Administrator Workflow: views, creates and manages institutional pilot program', async ({ page }) => {
    // 1. Authenticate as College Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'college@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to /college/dashboard
    await page.waitForURL('**/college/dashboard', { timeout: 15000 });
    await expect(page.locator('text=Institutional Intelligence Center')).toBeVisible();

    // 3. Scroll to Controlled Student Pilot Programs section
    const pilotSection = page.locator('h2', { hasText: /Controlled Student Pilot Programs/i });
    await expect(pilotSection).toBeVisible({ timeout: 10000 });

    // 4. Verify presence of Create Pilot Program button
    const createBtn = page.locator('button', { hasText: /Create Pilot Program/i });
    await expect(createBtn).toBeVisible();

    // 5. Open Create Pilot Program Modal
    await createBtn.click();
    await expect(page.locator('h3', { hasText: /Create Controlled Pilot Program/i })).toBeVisible();

    // 6. Fill out form
    const randomSuffix = Math.floor(Math.random() * 899999 + 100000);
    const progName = `E2E College Pilot ${randomSuffix}`;
    const progCode = `E2E_PILOT_${randomSuffix}`;

    await page.fill('input[placeholder*="Spring 2026 AI Learning"]', progName);
    await page.fill('input[placeholder*="APEX_AI_SPRING_2026"]', progCode);

    // 7. Submit form
    const submitDraftBtn = page.locator('button', { hasText: /Create Draft Program/i });
    await submitDraftBtn.click();

    // 8. Verify success alert appears and program is displayed in draft status
    await expect(page.locator('text=successfully created in draft status')).toBeVisible({ timeout: 10000 });
    const progHeading = page.getByRole('heading', { name: progName, level: 3 });
    await expect(progHeading).toBeVisible();

    // 9. Activate the pilot program
    const pilotCard = page.locator('div', { has: progHeading }).filter({ hasText: progCode }).first();
    const activateBtn = pilotCard.locator('button', { hasText: /Activate Pilot/i }).first();
    await expect(activateBtn).toBeVisible();
    await activateBtn.click();

    // 10. Verify status updates to active
    await expect(page.locator('text=successfully updated to "active"')).toBeVisible({ timeout: 10000 });
    await expect(pilotCard.locator('text=Active (Accepting Participants)').first()).toBeVisible();
  });

  test('2. Student Workflow: inspects notice, opts in, records roadmap participation, and withdraws', async ({ page }) => {
    // 1. Authenticate as Student
    await page.goto('/login');
    await page.fill('input[type="email"]', 'student@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to student dashboard
    await page.waitForURL('**/student/dashboard', { timeout: 15000 });

    // 3. Navigate to Personalized Learning Roadmap
    await page.goto('/student/learning');
    await expect(page.locator('body')).toContainText(/Personalized Development Roadmap/i);

    // 4. Verify Pilot Participation Card is mounted
    const pilotIndicator = page.getByText('Controlled Pilot Status:').or(page.getByText('Voluntary AI Recommendation Pilot Program')).or(page.getByText('Active Pilot Participant'));
    await expect(pilotIndicator.first()).toBeVisible({ timeout: 10000 });

    // If an active program is waiting for opt-in:
    const optInBtn = page.locator('button:has-text("Opt In to Pilot"), button:has-text("Re-enroll in Pilot")').first();
    if (await optInBtn.isVisible()) {
      // Expand and inspect notice text
      const viewNoticeBtn = page.locator('button', { hasText: /Read Full Participation Notice/i }).first();
      if (await viewNoticeBtn.isVisible()) {
        await viewNoticeBtn.click();
        await expect(page.locator('text=voluntarily agree to participate').first()).toBeVisible();
      }

      // Check agreement box
      const termsCheckbox = page.locator('input[type="checkbox"]').first();
      await termsCheckbox.check();

      // Submit opt-in
      await optInBtn.click();
      await expect(page.locator('text=Successfully opted in to the AI recommendation pilot program!')).toBeVisible({ timeout: 10000 });
    }

    // 5. If Active Participant badge is visible, verify withdrawal workflow
    const activeBadge = page.locator('text=Active Pilot Participant');
    if (await activeBadge.isVisible()) {
      const withdrawBtn = page.locator('button', { hasText: /Withdraw from Pilot/i }).first();
      await expect(withdrawBtn).toBeVisible();
      await withdrawBtn.click();

      // Confirm dialog opens
      await expect(page.locator('text=Confirm Voluntary Withdrawal')).toBeVisible();
      const confirmWithdrawBtn = page.locator('button', { hasText: /Confirm Withdrawal/i });
      await confirmWithdrawBtn.click();

      // 6. Verify withdrawal confirmation and student learning roadmap continues
      await expect(page.locator('text=You have voluntarily withdrawn from the pilot')).toBeVisible({ timeout: 10000 });
    }

    await expect(page.locator('text=Target Goal Readiness')).toBeVisible();
  });

  test('3. Super Administrator Workflow: inspects pilot manager and zero-pilot dashboard callout', async ({ page }) => {
    // 1. Authenticate as Super Admin
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@skillverse.test');
    await page.fill('input[type="password"]', 'TestPass123!');
    await page.click('button[type="submit"]');

    // 2. Wait for redirect to /admin
    await page.waitForURL('**/admin', { timeout: 15000 });

    // 3. Switch to Recommendations Tab
    const recTab = page.locator('button', { hasText: /Recommendations & Pilot Readiness/i });
    await recTab.click();

    // 4. Verify Pilot Program Manager is mounted alongside Dashboard
    await expect(page.locator('h2', { hasText: /Controlled Student Pilot Programs/i })).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h1', { hasText: /Recommendation Effectiveness & Pilot Readiness/i })).toBeVisible();

    // 5. Verify Zero Pilot Observations Explainer Callout
    await expect(page.locator('text=Zero Genuine Pilot Observations Recorded')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('h3', { hasText: 'Controlled Student Pilot Participation' })).toBeVisible();
  });

});
