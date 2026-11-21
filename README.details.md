# Afterglow Cover Studio

Open `app/index.html` in desktop Chrome. Pick a panel and replace its photo, or drop a photo directly onto the preview. Drag to reframe, use the zoom slider, and edit the caption. **Use in all panels** starts each crop from the same image so it can be framed independently. Choose a color grade and download a PNG in wide (1920 × 1080), square (1080 × 1080), or portrait (1080 × 1350).

The canvas renderer and original demo illustrations live under `app/`. Fonts ship with their OFL notice. The browser handles editing and PNG encoding locally.

- `screenshots/01-wide.jpg` is the lead cover. The editor capture shows the original illustrated lead loaded through the file picker. The three cover captures come from the app's PNG downloads, scaled as needed.
- `main.ts` stages the app and captures and generates the dossier using the unchanged kit helper. Use Node 22.18+ and set `MAKEFUN_OUTPUT_DIR` to a fresh local directory outside the grader.
- Run `node tools/verify.cjs` to verify the offline file URL and regenerate the captures in headless Chromium. Install Playwright Core in your environment or set `PLAYWRIGHT_CORE` to its package path. Set `HEADLESS_CHROME` to a Chromium headless executable if needed.

Visual research covered the panel compositions in [Rockstar's artwork gallery](https://www.rockstargames.com/VI/media/artwork-wallpapers) and editing features described on the [contest leaderboard](https://make.fun/bounty/gta6-cover-art-01/leaderboard).
