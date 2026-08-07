# Ragamalika

A private, no-login music archive. Static site, hosted free on GitHub Pages,
media hosted free on Cloudinary. No backend, no build step — just HTML/CSS/JS.

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

1. Create a new repo (suggested name: `ragamalika`).
2. Push all these files to the `main` branch, at the repo root.
3. Repo Settings → Pages → Source: `main` branch, `/ (root)`.
4. Your site goes live at `https://yourusername.github.io/ragamalika/`.

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
