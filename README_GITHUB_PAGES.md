# Roger Does Countdown — Solo Pocket v0.6 (safe-area, dictionary, verdict reviews and device histories)

This is the **public-safe** static-site version. It contains no personal Countdown MP3, credentials, passwords, certificates, or device-specific data. It is deliberately **separate** from Roger Does Countdown multiplayer.

## Publish like Archer Hold

1. Create a new GitHub repository (suggested name: `roger-does-countdown-solo`). GitHub Pages on a free account generally means the repo and hosted website are public. The **game source, dictionary and original celebration fanfares** are what visitors can access; no player scores or imported music are uploaded by the app.
2. Extract this ZIP on your Mac. In GitHub, choose **Add file → Upload files** in the new repo and upload the **contents of this folder**, making sure `index.html` is at the repository **root**. **Do not upload** any of the older *Private* or *Local Install* ZIP packages, because those include the personal music recording.
3. Review the GitHub upload file list **before committing**. It must contain **NO `.mp3`, `.m4a`, `.aac`, `.flac`, `.ogg`, `PERSONAL_AUDIO` directory, passwords or certificate files**. The `.gitignore` is an additional guard; **do not rely on it as the only safeguard for browser uploads**.
4. Open **Settings → Pages → Build and deployment → Deploy from a branch**. Select `main` and `/ (root)`, then save.
5. Visit `https://YOUR-USERNAME.github.io/roger-does-countdown-solo/` on Sarah's iPhone/iPad in Safari. Use Share → Add to Home Screen, with **Open as Web App** enabled (when shown). Open from the Home Screen **while still online** and allow the offline cache to finish. The footer should show **“Offline files verified — ready to test.”**
6. **Only after launching the Home Screen version**, use **Add Countdown music privately (optional) → Choose MP3 from Files** to import her existing personal MP3. It is copied into IndexedDB storage in that device's installed web app. It is **never uploaded** to GitHub and it is **not part of Git history**. Import separately on each device if wanted.
7. Test: close the Home Screen app, enable Airplane Mode, reopen it, then play a complete Quick game with the Countdown clock music. Keep the hosting available for future repairs and updates.

## Privacy and durability

- Only static files are hosted; no registration, analytics, third-party JavaScript, API keys or remote databases.
- Music is **not bundled**. The Clock MP3 is selected from the iPad's Files app and retained in its browser-managed storage (IndexedDB). It normally persists but may be erased if the app is deleted, its data is cleared or iPadOS reclaims storage. In that case re-import it.
- Installing a Home Screen app does not make the public source code private. Don't commit any secrets or personal music **even temporarily**: removing a file in a later commit does not reliably erase Git history/forks/caches.
- The bundled dictionary and original celebration fanfares are already part of the prior prototype; if you plan broad public distribution, verify the licences for *all* resources, not just the Countdown theme.
- Device audio rules may require a tap to start the clock. iOS/iPadOS and Safari offline operation remain to be tested on a physical device. The **offline-files verified** label confirms Cache API entries, not that the full offline gameplay has been tested.
- The main Roger Does Countdown multiplayer ZIP is unchanged.

## Project structure

`index.html`, `app.mjs`, `rules.mjs`, `style.css`, `sw.js`, and `manifest.webmanifest` live in the root along with `data/`, `icons/`, `festive/`, `audio/` and `.gitignore`. The `audio/` folder has only the project's original victory fanfares (WAV), **no Countdown music**.

## Local test on a Mac (not an iPad offline acceptance test)

`python3 -m http.server 8765` in this folder; open `http://localhost:8765/`. The game runs without the imported music until you select your own file from the local device.

## Update from v0.4

The **Christmas** dropdown now immediately changes the lobby background and shows the Christmas tree. The choice is remembered on this device. The versioned offline cache has been updated, so the new files can replace v0.4. If v0.4 is already installed, upload all new files to the **same** repository (do not remove the local MP3), keep the iPad online, visit the site's Safari address, refresh and then close/reopen the Home Screen app. On a cache-first PWA, the first visit may load the old version while the updated service worker installs; another reload/open can be needed. Check that the Christmas theme changes **before** starting a game.

The Countdown MP3 is **not** included in this ZIP and must never be uploaded to GitHub; its locally imported copy is independent of the site update.

## Changes in v0.6

- iPhone/iPad Home Screen safe-area inset keeps the title below the time, signal and battery indicators, including Christmas mode.
- Added validated **SINUATED** (and inflections of SINUATE) to the built-in dictionary. SINUATED earns 8 points with the correct letter tiles.
- Results now have **Review or correct this verdict**. Recheck corrected answers, approve a legitimate unlisted word (confirmed twice and only if the tiles are possible), or manually override a mistaken score using a confirmation dialogue. Approved words are saved locally.
- Completed results are saved locally, separately across **Quick/Short/Medium/Standard × Classic/Christmas** (eight histories, last 50 games each). The game lobby provides statistics for the selected combination and all variants; the final score screen also shows history. Only completed games are saved. Device/app storage removal erases these histories, and they do not synchronise across phones.
- Removed the redundant always-visible footer. Offline installation status is now under a collapsible option in the lobby.
- Updated the service worker cache to `roger-solo-pocket-0.6.0`. After uploading the changed files to the existing repository, refresh the published web page *while online* and reopen the Home Screen app (occasionally twice) to activate updated caching. Personal MP3 imports remain local and are unaffected by ordinary site-file updates, provided you do not clear website data.
- **Do not upload personal recordings, private-install packages or credentials to GitHub.** Only this public-safe edition is intended for the repository.

**Acceptance tests still needed on the real iPad/iPhone:** Safari Home Screen safe-area layout, updating the service worker from the installed v0.5, word approvals and history persistence after closing/reopening and in Airplane Mode.
