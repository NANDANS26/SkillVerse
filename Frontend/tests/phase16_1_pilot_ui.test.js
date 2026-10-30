// Frontend/tests/phase16_1_pilot_ui.test.js
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

describe('Phase 16.1: Pilot Program Administration and Student Consent UI Suite', () => {

  it('verifies PilotProgramManager.tsx exists and implements full administrative lifecycle controls', () => {
    const compPath = path.join(projectRoot, 'src', 'components', 'PilotProgramManager.tsx');
    assert.ok(fs.existsSync(compPath), 'PilotProgramManager.tsx must exist');
    const content = fs.readFileSync(compPath, 'utf8');

    // Administrative lifecycle transitions
    assert.ok(content.includes("handleStatusTransition"), 'Must implement status transitions');
    assert.ok(content.includes("draft"), 'Must handle draft status');
    assert.ok(content.includes("active"), 'Must handle active status');
    assert.ok(content.includes("concluded"), 'Must handle concluded status');
    assert.ok(content.includes("archived"), 'Must handle archived status');

    // Multi-tenant and role protections
    assert.ok(content.includes("institution_id"), 'Must include tenant institution scoping');
    assert.ok(content.includes("super_admin"), 'Must support super_admin capabilities');
    assert.ok(content.includes("college_admin"), 'Must support college_admin role');

    // UI form elements
    assert.ok(content.includes("consent_notice_version"), 'Must configure notice version');
    assert.ok(content.includes("consent_notice_text"), 'Must configure notice text');
    assert.ok(content.includes("target_engine_version"), 'Must display target engine version');
    assert.ok(content.includes("active_participants"), 'Must display active participants count');
    assert.ok(content.includes("withdrawn_participants"), 'Must display withdrawn count');
  });

  it('verifies StudentPilotConsentCard.tsx exists and provides voluntary opt-in and withdrawal', () => {
    const compPath = path.join(projectRoot, 'src', 'components', 'StudentPilotConsentCard.tsx');
    assert.ok(fs.existsSync(compPath), 'StudentPilotConsentCard.tsx must exist');
    const content = fs.readFileSync(compPath, 'utf8');

    // Endpoints
    assert.ok(content.includes('/student/pilot/status'), 'Must query student pilot status');
    assert.ok(content.includes('/student/pilot/consent'), 'Must call opt-in consent endpoint');
    assert.ok(content.includes('/student/pilot/withdraw'), 'Must call voluntary withdrawal endpoint');

    // Consent transparency requirements
    assert.ok(content.includes('What is tracked'), 'Must disclose tracked telemetry');
    assert.ok(content.includes('Purpose'), 'Must disclose research purpose');
    assert.ok(content.includes('Privacy Protected'), 'Must explain privacy and aggregate reporting');
    assert.ok(content.includes('100% Voluntary'), 'Must emphasize voluntary nature');

    // States
    assert.ok(content.includes('Active Pilot Participant'), 'Must render active participant state');
    assert.ok(content.includes('Withdraw from Pilot'), 'Must provide voluntary withdrawal button');
    assert.ok(content.includes('Opt In to Pilot'), 'Must provide voluntary opt-in button');
  });

  it('verifies CollegeAdminDashboard mounts PilotProgramManager with tenant scoping', () => {
    const pagePath = path.join(projectRoot, 'src', 'pages', 'college', 'CollegeAdminDashboard.tsx');
    assert.ok(fs.existsSync(pagePath), 'CollegeAdminDashboard.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('PilotProgramManager'), 'Must import PilotProgramManager');
    assert.ok(content.includes('role="college_admin"'), 'Must scope to college_admin role');
  });

  it('verifies CandidateLearning mounts StudentPilotConsentCard for contextual roadmap participation', () => {
    const pagePath = path.join(projectRoot, 'src', 'pages', 'candidate', 'CandidateLearning.tsx');
    assert.ok(fs.existsSync(pagePath), 'CandidateLearning.tsx must exist');
    const content = fs.readFileSync(pagePath, 'utf8');

    assert.ok(content.includes('StudentPilotConsentCard'), 'Must mount StudentPilotConsentCard in Learning page');
  });

  it('verifies RecommendationEffectivenessDashboard displays honest zero-pilot observation notice', () => {
    const compPath = path.join(projectRoot, 'src', 'components', 'RecommendationEffectivenessDashboard.tsx');
    const content = fs.readFileSync(compPath, 'utf8');

    assert.ok(content.includes('Zero Genuine Pilot Observations Recorded'), 'Must include zero pilot observation notice');
    assert.ok(content.includes("provenanceFilter === 'pilot'"), 'Must trigger on genuine pilot partition');
  });
});
