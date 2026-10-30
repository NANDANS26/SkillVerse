# SkillVerse Companion (Chrome Manifest V3 Extension)

**SkillVerse Companion** is a lightweight, privacy-preserving browser extension that lets students explicitly capture public and private GitHub repository metadata as evidence of technical competencies and transfer it into the SkillVerse platform.

---

## 1. Principles & Least Privilege Architecture

- **Manifest V3**: Built following modern Manifest V3 standards without background service worker surveillance.
- **Explicit Consent**: The extension never collects or inspects browsing activity in the background. It executes extraction only when the student explicitly clicks the extension icon and presses **Capture Repository Evidence**.
- **Data Minimization**:
  - Captures: Repository URL, name, owner, public description, topic tags, primary language, and student-provided contribution summary.
  - Excludes: Source code files, commit diffs, commit messages, issues/PR discussions, authentication tokens, cookies, browsing history, and private personal data.
- **Zero Credential Sharing**: The extension never receives, stores, or embeds backend JWT secrets, database credentials, or privileged service tokens.
- **Secure Fragment Handoff**: Draft transfer to SkillVerse uses the URL fragment (`#draft=...`) rather than query parameters. The SkillVerse web app strips the fragment from the browser URL immediately upon parsing.

---

## 2. Manifest Permissions Justification

| Permission | Justification |
| :--- | :--- |
| `activeTab` | Grants temporary access to inspect the active tab only when the user invokes the extension popup. |
| `scripting` | Executes the in-page DOM metadata extraction function on the active GitHub repository page upon user click. |
| `storage` | Stores user-configured SkillVerse Web App URL and local draft state between popup toggles. |
| `host_permissions: ["https://github.com/*"]` | Scopes script execution exclusively to GitHub pages; prevents access to any other domain. |

---

## 3. Installation & Developer Setup

No build step or bundling is required. The extension is pure ES module JavaScript and native HTML/CSS.

### Step-by-Step Unpacked Installation in Chrome / Brave / Edge:
1. Open Google Chrome (or any Chromium browser).
2. Navigate to `chrome://extensions/` (or Edge: `edge://extensions/`).
3. Toggle on **Developer mode** in the top-right corner.
4. Click **Load unpacked** in the top-left toolbar.
5. Select the `SkillVerse/BrowserExtension` directory:
   `D:\NANDAN.S\ENGINEERING\HACKATHONS\portfolio\SkillVerse\BrowserExtension`
6. The **SkillVerse Companion** extension icon will appear in your extensions list and browser toolbar.

---

## 4. End-to-End User Workflow

1. **Navigate to a GitHub Repository**:
   Open any GitHub repository in your browser (e.g. `https://github.com/facebook/react` or your own project).
2. **Open SkillVerse Companion**:
   Click the SkillVerse icon in the Chrome toolbar.
3. **Capture Evidence**:
   Click **Capture Repository Evidence**. The extension inspects the page DOM and loads the repository title, owner, description, and topic tags.
4. **Review & Write Contribution**:
   - Inspect the metadata preview.
   - If the repository is private, a warning banner will appear reminding you that only metadata is transferred.
   - In the **Your Contribution Summary** field, write an honest summary of what you implemented in this project (required).
   - Enter proposed canonical skill tags (e.g. `TypeScript, React, PostgreSQL`).
5. **Transfer to SkillVerse**:
   Click **Transfer to SkillVerse**. The extension opens your configured SkillVerse instance at `/extension/import#draft=...`.
6. **Confirm in SkillVerse**:
   - SkillVerse parses the draft and immediately purges the fragment from the URL bar.
   - You select or confirm the canonical skill from the dropdown.
   - Click **Confirm & Submit Project Evidence**.
7. **View in Skill DNA**:
   The evidence is persisted in PostgreSQL with `pending_review` status and is visible on your Skill DNA profile. Your assigned faculty advisor can review and verify the submission.

---

## 5. Running Extension Unit Tests

Unit tests verify URL validation, canonical normalization, length bounds, HTML sanitization, and fragment handoff serialization:

```powershell
cd BrowserExtension
npm test
```

---

## 6. Configuration & Troubleshooting

- **Changing the SkillVerse URL**:
  Click the gear icon (Settings) in the top right of the extension popup. You can configure any local port (e.g. `http://localhost:5173` or `http://127.0.0.1:5173`).
- **"Unsupported Page" Message**:
  The extension only operates on GitHub repository pages matching `github.com/{owner}/{repository}`. Pages such as `github.com/explore` or `github.com/settings` are intentionally blocked.
- **Port Refused**:
  Ensure the SkillVerse web app is running via `.\scripts\dev\start.ps1`.
