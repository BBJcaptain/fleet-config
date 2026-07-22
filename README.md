# A320 Fleet Configuration

A read only, mobile friendly reference for the operational configuration of an
A320 family fleet. The data is **encrypted and signed**, so the repository can
stay public while the fleet stays private. Only someone with the fleet password
can read it, and only the owner can produce a valid update.

Live app: `https://bbjcaptain.github.io/fleet-config/`
Repository: `https://github.com/BBJcaptain/fleet-config`

## What is in this repository

Public, safe to publish:

- `index.html` — the app users open. Self contained, read only, holds **no fleet data**. Contains the ECDSA **public** key used to verify data authorship.
- `collector.html` — keyless, offline field-collector page (holds no key and no fleet data; safe to publish). Used to jot an aircraft's config in the air.
- `fleet-config.enc` — the encrypted, signed fleet database (ciphertext).
- `sw.js` — service worker. Pre-caches the app and the encrypted data so both
  pages open **without a connection** (in flight). `CACHE_VERSION` is bumped automatically on every release.
- `manifest.json` / `manifest-collector.json` — Add-to-Home-Screen definitions for the viewer and the collector.
- `UI/` — static assets:
  - `UI/icon1.png` — icon for the **viewer** (`index.html`).
  - `UI/icon3.png` — icon for the **collector** (`collector.html`).
  - `UI/carbon.png` — background texture used in the header and footer.
- `README.md` — this file.

Everything published here is designed to be public. The tooling used to *produce*
a release — and the plaintext fleet — is kept off this repository entirely.

## How it works

The fleet is prepared offline by the maintainer, then encrypted **and signed**
before it is published here. Every time a user opens the app it downloads
`fleet-config.enc` over HTTPS, asks once for the password, decrypts it in the
browser, and verifies the signature. If GitHub is unreachable it shows the last
cached copy and states the date the data was last updated. The app auto-locks
after 15 minutes of inactivity.

---

## Security and privacy

The design assumes the file is public and hostile eyes will see it. Protection is built in layers.

- **Confidentiality (encryption at rest and in transit).** The fleet is sealed with **AES-256 in GCM mode**. The key is derived from the password with **PBKDF2-HMAC-SHA256 at 600,000 iterations** and a random salt (OWASP 2023 guidance), which makes password guessing slow and costly. The repository, the GitHub CDN, and the device's offline cache hold **only ciphertext**. In transit it is fetched over HTTPS (TLS), so it is double wrapped. Plaintext exists only in the browser's memory after you enter the password; it is never written to disk or uploaded. The app also **rejects any file whose KDF is weaker than 600,000 iterations**, so a downgraded envelope cannot lower the cost of guessing.

- **Authenticity (signed data).** The plaintext is signed with an **ECDSA P-256** private key that is held offline by the maintainer and never published. The app carries the matching public key and **verifies every file it loads**. If the signature is missing or invalid, the app **fails closed**: it refuses to display the data — a file with no signature is rejected, never trusted. This means
  even someone who learned the password cannot substitute their own file, and
  any tampering is caught. GCM already detects corruption; the signature proves the data came from the owner.

- **Integrity fingerprint.** A SHA-256 fingerprint of the loaded data is shown in the disclaimer, so two people can confirm in one glance they are on the same release.

- **Session control (session only password).** The password is **never written to
  the device**. It is held in memory for the session only, so the user enters it once each time the app is opened fresh. Tapping **Lock**, or the 15 minute inactivity auto lock, clears the password from memory. The **encrypted** offline copy (ciphertext only) is deliberately kept, so the app still opens without a connection — for example in flight — once the password is re-entered. Nothing readable is stored on the device: the cache cannot be opened without the password.

- **Guess resistance.** After repeated wrong passwords the app adds an increasing
  delay before the next attempt (up to 30 seconds). To be clear about what this
  does and does not do: it only slows guessing **through this app's own password
  box**. Anyone who downloads the encrypted file can attack it offline, where no
  delay applies. The real protection there is the slow key derivation
  (PBKDF2-HMAC-SHA256, 600,000 iterations) combined with a strong passphrase —
  the passphrase is what actually keeps the data safe.

- **Reduced attack surface.** A strict **Content Security Policy with no
  `unsafe-inline`** (inline script and style are pinned by SHA-256 hash) blocks injected code. Data is rendered with `textContent` only, never `innerHTML`. There are **no accounts and no sign-up**.

  The app makes exactly two kinds of outbound request: the encrypted data file from its own origin, and a single
  anonymous launch ping to `nom.telemetrydeck.com` (see **Usage measurement** below). Both are pinned in `connect-src`;
  nothing else can be contacted.

**Honest limits.** There is no such thing as 100% security. Access is granted by
passphrase rather than per-user accounts, so there is no individual revocation:
withdrawing access means rotating the passphrase and re-encrypting, after which
everyone enters the new one once. Anyone trusted with the passphrase can still
copy what they can read. This design protects the data from the public and from
outsiders — it cannot protect it from an authorised reader who chooses to leak.
The passphrase is rotated on a regular schedule.


---

## Usage measurement

The viewer sends **one anonymous ping per launch** to
[TelemetryDeck](https://telemetrydeck.com), a privacy-focused European analytics
service. It exists to answer a single question — *is this app actually being
used and worth maintaining?*

**What is sent, in full:** app ID, page URL, referrer, browser locale, SDK
version. That is the entire payload. No cookies are set, nothing is written to
the device, and no identifier is stored anywhere. TelemetryDeck derives a
visitor count server-side by hashing IP + app ID + user agent together with a
salt **that changes every day**, so the same person cannot be linked from one
day to the next — including by the maintainer.

**What it deliberately is *not*:** a security control. It cannot see the attack
that actually matters. Anyone who wants to break this data downloads
`fleet-config.enc` once — possibly with `curl`, never opening the app — and
attacks it offline, where no client-side analytics can ever observe them. In-flight
launches send nothing either, because there is no connection. The real
protections remain the passphrase strength, PBKDF2 at 600,000 iterations, the
mandatory ECDSA signature, and the annual password rotation. For spotting
unusual bulk downloads of the ciphertext, GitHub's own repository traffic and
clone statistics are the better signal.

**How it is wired in, and why that way:** the 681-byte SDK is **self-hosted** at
`UI/telemetrydeck.min.js` instead of being loaded from TelemetryDeck's CDN. That
keeps `script-src` at `'self'`, so no third-party code can ever execute in this
page, and pins the exact bytes in this repository where they can be read in full.
The only CSP change is one added entry in `connect-src`. Verify the vendored copy
still matches upstream at any time:

```
curl -s https://cdn.telemetrydeck.com/websdk/telemetrydeck.min.js | shasum -a 256
# 2633ae3f17ce21dfc782e5c3be4cca36c3f8e48bcaab77348117efab15e4181e
```

It switches itself to test mode automatically on `localhost` and `file://`, so
local development is never counted.

**Scope:** the viewer (`index.html`) only. The collector is keyless and used
offline, and the editor is private and runs on localhost — neither is
instrumented. This is a deliberate exception to the "keep all three apps in
sync" rule, not an oversight.

## Maintaining the fleet

Fleet data is produced and published by the maintainer using private tooling that
is not part of this repository. If you spot something wrong in the data, use the
**Feedback** button in the app.

## What the app shows

Identification: Registration, Model, MSN, First Flight (dd-mm-yyyy), First Owner.

Performance: MLW (T), T/O Tailwind limit (kts), LDG Tailwind limit (kts),
Narrow RWY (Approved / Not Approved), SE Taxi w/o APU (Allowed / Not Allowed), Max autoland ALT (ft), Noise Certification (Chapter 14 / Chapter 4 / Other).

Equipment: BRK FAN, Sharklets (Installed / Not Installed), Engines, Cargo heat, Headset Plug, ACARS (Spectralux / Standard), INIT* FLT PL Retrieval
(Available / N/A / Partially Available), ADIRU, WX RDR, HF Radio, CPDLC (Installed / N/A).

Remarks: free text.

In the app, yes/no fields display as coloured text: green for the positive value (Installed, Approved, Allowed) and red for the negative.

Some fields show a small **i** you can tap for a short explanatory note. For
example, **Engines** explains the difference in warm-up and cool-down times
between the fitted engine types. Tap the **i** again, or anywhere else, to close it. Ask the maintainer to add notes to other fields as needed.

---

## Users: how to download and activate the app

Do steps 1 to 3 once; after that the app is an icon on your Home Screen.

1. On your phone, open the link in **Safari** (iPhone) or **Chrome** (Android):
   `https://bbjcaptain.github.io/fleet-config/`
2. Add it to your Home Screen (iPhone: **Share → Add to Home Screen**; Android: **menu → Add to Home screen**).
3. Open it from the icon, accept the disclaimer, and enter the **fleet password** your admin gave you. The password is kept for the session only, so you enter it again each time you open the app fresh (and after Lock or 15 minutes idle).

### Using it in flight (no connection)

The app is built to work offline, but it must be **opened once on the ground with a connection** first — that is when it stores itself and the encrypted fleet data on your device. After that:

- Launch it from the Home Screen icon as normal; it opens with no signal.
- Enter the fleet password (asked after every fresh start) — decryption happens entirely on your device.
- The status will read **offline**, and the footer shows the **data version and the date it was last updated**, so you can always see how current it is.

**Recommended before every flight:** open the app once at the gate and unlock it. That refreshes the fleet data and keeps the offline copy current. Offline you are always looking at the last version you downloaded — never a live one.

Day to day: the top-right shows an **ENCRYPTED** badge and a live status dot
(hover or tap for detail); the footer shows "Up to date" with the data version, or, offline, the date the data was last updated. Use the aircraft selector to switch airframes, and tap a field's **i** for a note where present. **About** explains the app and its security; **Verify** forces an update check; **Feedback** emails the maintainer; **Disclaimer** shows the full notice; the **lock** icon forgets the password (the encrypted offline copy is kept, so the app still opens without a connection once you re-enter the password). The layout is optimised for iPhone in portrait and adapts to a wider, roomier layout on iPad.

### Collecting an aircraft's configuration in flight

`collector.html` is a separate, **keyless** page for noting an airframe's
configuration while you fly it. It contains no password, no signing key and no fleet data, and it never connects to anything — it cannot read or change the fleet. It only produces a small file you hand to the admin.

1. On the ground with a connection, open `https://bbjcaptain.github.io/fleet-config/collector.html` and *Share → Add to Home Screen** ("Fleet Collector"). Opening it from Files or iCloud will **not** work — iOS does not run the page properly from there and the buttons will appear dead.
2. Airborne, launch it from the Home Screen icon. Tap **Add aircraft to collect** and fill in the **Registration first**, then whatever you can verify. Leave a field blank if you did not check it — blanks are never merged, so they cannot overwrite good data.
3. Your work is **saved on the device automatically** after every change (green ✓ Saved stamp). It survives closing the app, a reload, or the phone reclaiming memory, and reloads itself next time you open the page.
4. After landing, tap **Download collected .json** and send it to the admin.
   Once the admin confirms it is merged and published, tap **Clear draft**.
   
   Do not leave a collection sitting on the phone for weeks — export it soon after landing, as the phone may clear stored site data after a period of disuse.

---

## Version numbering

- **App version**: the software (`index.html`), shown on the About page. Bumps by 0.1 on every change.
- **Data version**: the fleet database (`meta.version`), bumped by the admin when publishing. Shown in the footer and the disclaimer, with the SHA-256
  fingerprint. Dates are shown in **dd-mm-yyyy** format throughout.

## Changelog

Versions were reset to **1.0** on 21-07-2026 when the three apps were first
versioned independently. Each app carries its own number: **+0.1** for an
ordinary update, **+1.0** for a major one.

### All apps 1.0 — 21-07-2026

- **Easier to read at night.** Field labels and the PERFORMANCE / EQUIPMENT /
  REMARKS headings are larger and brighter, so the app is legible on a dark
  flight deck without turning the screen up.
- **The starfield now sits behind the whole app**, not just the acknowledgement
  page. It never touches the legibility of a value: aircraft cards are opaque and
  the image only shows around them. It is suppressed when printing.
- Each app shows its own version in the footer. The viewer, collector and editor
  are versioned separately because they are released independently.
- **"Updated" moved from the footer to the header.** In the viewer it is the date
  this device last downloaded the fleet data, and it turns amber with a ⚠ once
  that is more than a fortnight old, so a stale offline copy is obvious.
- The **data version and its own date stay in the footer and the disclaimer**.
  They answer a different question: the header says *"am I holding a current
  copy?"*, the footer says *"how old is the information itself?"* A copy
  downloaded today can still contain data last edited months ago.

### Earlier (pre-reset, viewer only) — 1.7

- **Anti-rollback protection.** The viewer records the highest data version it
  has ever seen. A correctly signed but *older* release is now refused with a
  loud red alert, and the pilot stays on the newer data already on screen —
  a signed downgrade can no longer quietly put crews on superseded config.
- **Red Message acknowledgement page.** The old six-paragraph legal wall was
  rewritten as a short, scannable notice. Every legal point is retained; reading
  time is roughly a third of what it was. A starfield now fills the screen behind
  the card, which sits on it as a blurred glass panel.
- **Acknowledgement version bumped** alongside the rewritten notice. The gate is
  shown once per notice version; because the wording changed, every device is
  asked to acknowledge again.
- **"New version ready" prompt.** The app shell is cached so it opens instantly
  with no signal, which means a newly published version only appears on a later
  launch. The app now shows a calm strip — *"A new version of the app is ready.
  Your fleet data is unaffected."* — with **Reload** and **Later**. It never
  reloads by itself; a reload mid-lookup would be worse than a slightly old
  build. The collector has the same strip and saves your draft before reloading.
  Fleet data is unaffected either way: it is fetched network-first and is always
  current when you have a connection.
- **Anonymous usage measurement** via a self-hosted TelemetryDeck SDK. See
  *Usage measurement* above for exactly what is sent and, just as importantly,
  what it cannot do.
- Honest-privacy text corrected throughout: the app previously claimed "no
  analytics, no tracking", which the change above would have made untrue.
- `theme-color` aligned to the carbon header (`#0b224d`) in all three apps.
- `.gitignore` added to the public repo as a second line of defence against ever
  committing the editor or plaintext fleet data.
- Removed the unused `UI/icon.png`; softened the guess-resistance wording so it
  no longer implies the rate limit protects against offline attack.

### App 1.6
- **Signatures are now mandatory.** A loaded file with no signature fails closed and is refused (previously a missing signature silently skipped the check). Real releases are always signed, so they are unaffected.
- **KDF downgrade protection.** The app rejects any envelope that specifies fewer than 600,000 PBKDF2 iterations, and no longer falls back to a weaker default.
- **Works offline after Lock.** Lock and the 15 minute auto lock now forget only the password; the encrypted (ciphertext-only) offline copy is kept, so the app still opens without a connection — e.g. in flight — once you re-enter the password. Previously the cache was wiped on lock, which left the app unusable offline.

## Look and feel

Dark navy palette with a light blue accent and carbon texture, inspired by the Airbus NOVA style: white section headings with a short accent bar, an accent bar under each aircraft registration, a slim textured hero band, chevron footer buttons, and an elegant gradient registration typeface. Designed phone-first for iPhone in portrait, and fully responsive to iPad and desktop.

## Maintenance note

Because the CSP pins inline script and style by SHA-256 hash, if you edit any
inline `<script>` or `<style>` in `index.html` you must recompute those hashes and update the `Content-Security-Policy` meta tag, otherwise the browser will block the app.

## One rule that always wins

This tool is an unofficial reference and training aid only. Company documentation and Airbus manuals always prevail. See the in app disclaimer.
