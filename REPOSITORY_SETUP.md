# Repository Setup Guide

This document outlines the steps to complete your repository metadata and demo materials.

---

## 1. GitHub Repository Description

**Current Status**: Repository description is null

**To Update:**
1. Go to https://github.com/nolanprice10/mftfinancetracker
2. Click **Settings** (gear icon) at the top right
3. In the **General** section, find the **Description** field
4. Enter this description:

```
Personal finance app with Monte Carlo probability engine. 
Get ONE answer to "Am I on track financially?" in 10 seconds. 
Shows realistic success probability with smart recommendations.
```

**Alternative (more concise):**
```
Monte Carlo-powered finance tracker. One question. 10 seconds. Clear answer.
```

---

## 2. Add Repository Topics/Tags

**Topics to Add**: `personal-finance`, `monte-carlo-simulation`, `financial-planning`, `nextjs`, `typescript`, `supabase`, `finance-tracker`

**To Update:**
1. In the same **Settings** page (Settings > General)
2. Scroll to the **About** section on the right sidebar
3. Or go directly to the repo homepage and look for the **About** section
4. Click the ⚙️ gear icon next to **Topics**
5. Add each topic:
   - `personal-finance`
   - `monte-carlo-simulation`
   - `financial-planning`
   - `react` (since you're using React)
   - `typescript`
   - `supabase`
   - `finance-tracker`

---

## 3. Adding Screenshots to README

**Current Status**: README updated with placeholder images

**To Replace Placeholders with Real Screenshots:**

### Option A: Using Your App (Recommended)
1. Run your app locally: `npm run dev`
2. Visit `http://localhost:8080`
3. Take screenshots using your operating system's screenshot tool:
   - **Dashboard**: Capture the main probability display with a sample goal
   - **Setup Flow**: Capture the initial setup form being filled out
4. Save as:
   - `docs/dashboard-screenshot.png`
   - `docs/setup-flow-screenshot.png`
5. Update README.md lines referencing the placeholders:
   ```markdown
   ![MyFinanceTracker Dashboard](./docs/dashboard-screenshot.png)
   ![10-Second Setup](./docs/setup-flow-screenshot.png)
   ```

### Option B: Using GitHub Issues
You can also upload images directly to GitHub:
1. Go to your repo's Issues tab
2. Start a new issue
3. Drag and drop your screenshots
4. Copy the markdown link that GitHub generates
5. Paste into README.md

### Screenshots to Capture:
- **Main Dashboard**: Show the probability percentage, goal visualization, and recommendations
- **Setup/Onboarding**: Show the form where users enter income, spending, and goal
- (Optional) **Results Page**: Show how recommendations appear after setup

---

## 4. Demo Video: 30-60 Second Setup Walkthrough

### What to Show:
- **Timestamp 0-5s**: App homepage with call-to-action
- **Timestamp 5-15s**: Entering monthly income ($5,000)
- **Timestamp 15-25s**: Entering monthly spending ($3,500)
- **Timestamp 25-35s**: Setting a financial goal ($10,000 in 12 months)
- **Timestamp 35-60s**: Instant probability result (e.g., "72% chance") and recommendations shown

### Tools to Create Video:

#### Option 1: Screen Recording (Easiest)
**macOS:**
- Use built-in QuickTime Player:
  1. Open QuickTime Player
  2. File → New Screen Recording
  3. Record your screen while performing the 10-second setup
  4. Save as MP4

**Windows:**
- Use built-in Xbox Game Bar:
  1. Press `Win + G` while the browser is focused
  2. Click "Record" button
  3. Record your screen
  4. Save file

**Linux:**
- Use SimpleScreenRecorder or OBS:
  ```bash
  # Install OBS
  sudo apt install obs-studio
  ```
  1. Open OBS
  2. Set up a scene with your screen as source
  3. Record the demo
  4. Export as MP4 (Settings → Output)

#### Option 2: Create Animated GIF (Alternative)
- Use `ffmpeg`:
  ```bash
  # Convert MP4 to GIF
  ffmpeg -i demo-video.mp4 -pix_fmt rgb24 -r 10 demo.gif
  ```
- Or use online tools: ezgif.com, gifmaker.me

#### Option 3: Use Animation Software
- **Figma**: Create step-by-step mockups and animate
- **Adobe Animate** or similar tools

### When Recording:
1. **Slow down your typing** so viewers can follow
2. **Use a clear voice** if adding narration (optional):
   - "Let me show you how MyFinanceTracker works in 30 seconds..."
   - "Enter your monthly income..." (as you type)
   - "Add your monthly spending..." (as you type)
   - "Set your financial goal..." (as you type)
   - "Instantly see your success probability and actionable recommendations!"

3. **Add text overlays** (optional):
   - "10-Second Setup" title at start
   - "Instant Probability" when result appears
   - "Smart Recommendations" when shown

### Save the Demo Video:
1. Save file as `demo.mp4` in your repo root
2. Commit and push: `git add demo.mp4 && git commit -m "Add demo video"`
3. Update README.md with hosted version (see below)

### Host the Video:
**Option A: GitHub Release** (5-100 MB max)
```bash
# Create a release with the video
gh release create v0.0.1-demo --notes "30-second setup demo" demo.mp4
```

**Option B: YouTube** (Recommended)
1. Upload to YouTube as unlisted video
2. Get the video ID
3. Update README with embed:
   ```markdown
   [![Watch Demo Video](https://img.youtube.com/vi/YOUR_VIDEO_ID/maxresdefault.jpg)](https://youtu.be/YOUR_VIDEO_ID)
   ```

**Option C: Vimeo** (Higher quality)
1. Create free Vimeo account
2. Upload video
3. Get embed link
4. Put in README

**Option D: Store in Repo**
1. Use Git LFS (Large File Storage):
   ```bash
   git lfs install
   git lfs track "*.mp4"
   git add .gitattributes demo.mp4
   git commit -m "Add demo video"
   ```

---

## 5. Quick Checklist

- [ ] Set repository description in GitHub Settings
- [ ] Add 7 topics/tags in GitHub repo settings
- [ ] Add homepage URL in repo About section (https://nolanprice10.github.io/mftfinancetracker/)
- [ ] Capture and add dashboard screenshot to README
- [ ] Capture and add setup flow screenshot to README
- [ ] Record 30-60 second demo video
- [ ] Host demo video (YouTube/Vimeo/GitHub Release)
- [ ] Update README with demo video link
- [ ] Verify live demo URL works: https://nolanprice10.github.io/mftfinancetracker/
- [ ] Test all links in README

---

## Current Homepage URL

Your app is deployed to GitHub Pages at:
```
https://nolanprice10.github.io/mftfinancetracker/
```

Add this to your GitHub repo's "About" section:
1. Go to repo homepage
2. Click ⚙️ gear icon next to "About"
3. Enter: `https://nolanprice10.github.io/mftfinancetracker/`
4. Click "Save changes"

---

## Need Help?

Refer to the updated [README.md](./README.md) for context on what these materials communicate about the project.
