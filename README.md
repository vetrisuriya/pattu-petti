# Pattu Petti

> The web home of Pattu Petti — nostalgic Tamil, Telugu, Hindi, and English
> music, streamed free, no login required.

A private, no-login music archive. Static site, hosted free on GitHub Pages,
media hosted free on Cloudinary. No backend, no build step — just HTML/CSS/JS.

Live at: https://vetrisuriya.github.io/pattu-petti/

## How it's structured

```
index.html          the shell (top bar, player bar, app container)
css/style.css        all styling
js/app.js            routing + rendering (home, playlist grid, song list)
js/player.js          the audio engine (queue, shuffle, loop, backgrounds)
data/telugu.json      Telugu song manifest
data/backgrounds.json player background image pools
```

Adding Tamil/Hindi/English later just means creating `data/tamil.json`
(same shape as `telugu.json`) — the site already knows to look for it.

## Adding new songs

1. Upload the MP3 to Cloudinary (any folder, doesn't matter — folders in
   Cloudinary are just for your own organizing, the site doesn't read them).
2. Copy the `secure_url` Cloudinary gives you.
3. Open `data/telugu.json` and add an entry:

```json
{ "title": "Song Name", "decade": "90s", "mood": "", "url": "https://res.cloudinary.com/isle7yoi/video/upload/..." }
```

4. Commit and push. That's it — no dashboard settings, no tags required,
   because the site reads this JSON file directly rather than querying
   Cloudinary live.

## IMPORTANT: fill in the `decade` field

All 24 Telugu songs currently have `"decade": ""` — I didn't want to guess
release years and get them wrong. Until you fill these in, every song shows
up under an "Unsorted" playlist card on the Telugu page. As you edit each
song's `decade` (e.g. `"90s"`, `"80s"`, `"2000s"`), the matching playlist
card appears automatically on the decade grid — no other code changes needed.

## Adding more background images

Open `data/backgrounds.json` and add URLs to any of the four category
arrays (`couples_music`, `couples`, `men_solo`, `music_covers`), or add a
new category key entirely — the player pulls from all categories combined,
so any new array you add is automatically included in the rotation.

## Deploying to GitHub Pages

1. Create a new repo (suggested name: `pattu-petti` (matches your existing branding)).
2. Push all these files to the `main` branch, at the repo root.
3. Repo Settings → Pages → Source: `main` branch, `/ (root)`.
4. Your site goes live at `https://vetrisuriya.github.io/pattu-petti/`.

## Troubleshooting: blank page / "strict-origin-when-cross-origin"

That phrase by itself isn't an error — it's just the default Referrer-Policy
label Chrome shows next to *every* network request in DevTools. If you saw
it and the page looked broken, the real error is elsewhere. As of this
update, the site now shows errors directly on the page instead of failing
silently, so:

1. Hard refresh the live site (`Ctrl+Shift+R` / `Cmd+Shift+R`) — GitHub
   Pages can take 1-2 minutes to update after a push, and browsers cache
   aggressively.
2. If something's still wrong, the page itself will now display what
   failed (e.g. "Couldn't load data/telugu.json").
3. For the full technical detail, open DevTools (F12) → **Console** tab —
   look for a red line starting with `[Pattu Petti]`.
4. Common root causes on GitHub Pages specifically:
   - **Folder structure not preserved.** If files were uploaded individually
     through the GitHub web UI instead of as a full folder/zip, `data/`,
     `css/`, and `js/` subfolders can end up missing or flattened. Check
     your repo's file listing on GitHub matches: `index.html`, `css/style.css`,
     `js/app.js`, `js/player.js`, `data/telugu.json`, `data/backgrounds.json`.
   - **Wrong branch/folder selected in Pages settings.** Settings → Pages →
     confirm source is `main` branch, `/ (root)` — not `/docs` unless your
     files are actually inside a `docs/` folder.
   - **Case sensitivity.** GitHub Pages is case-sensitive; `Data/Telugu.json`
     is not the same file as `data/telugu.json`.

## Notes on what's built vs. what's still a placeholder

- **Telugu** is fully wired with your real 24 songs.
- **Tamil, Hindi, English** show as "Coming soon" on the home page until you
  add their `data/<language>.json` files — the language cards already detect
  this automatically.
- **Per-language visual themes** (you asked for each language to look
  different) — the current build has one shared theme. Once Tamil/Hindi data
  is ready, I can give each language its own palette/accent the same way
  Telugu has rose/gold now.
- **Background–mood matching** (e.g. love songs → couple images specifically)
  isn't wired yet — right now "Change Background" pulls randomly from *all*
  categories combined. The `mood` field already exists per-song in the JSON
  for this — once you're ready, we can map moods to background categories.
