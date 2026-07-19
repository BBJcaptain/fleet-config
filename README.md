# A320 Fleet Configuration

A read only, mobile friendly reference for the operational configuration of an
A320 family fleet. The data is **encrypted and signed**, so the repository can
stay public while the fleet stays private. Only someone with the fleet password
can read it, and only the owner can produce a valid update.

Live app: `https://bbjcaptain.github.io/fleet-config/`
Repository: `https://github.com/BBJcaptain/fleet-config`

## What is in this repository

Public, safe to publish:

- `index.html` — the app users open. Self contained, read only, holds **no fleet
  data**. Contains the ECDSA **public** key used to verify data authorship.
- `collector.html` — keyless, offline field-collector page (holds no key and no
  fleet data; safe to publish). Used to jot an aircraft's config in the air.
- `fleet-config.enc` — the encrypted, signed fleet database (ciphertext).
- `sw.js` — service worker. Pre-caches the app and the encrypted data so both
  pages open **without a connection** (in flight). Bump `CACHE_VERSION` when
  publishing — `publish.command` does this automatically.
- `manifest.json` / `manifest-collector.json` — Add-to-Home-Screen definitions
  for the viewer and the collector.
- `UI/` — static assets:
  - `UI/icon1.png` — icon for the **viewer** (`index.html`).
  - `UI/icon2.png` — icon for the **editor** (private, not published here).
  - `UI/icon3.png` — icon for the **collector** (`collector.html`).
  - `UI/icon.png` — previous icon, no longer referenced.
  - `UI/carbon.png` — background texture used in the header and footer.
- `README.md` — this file.

**Never commit** (owner only, private):

- `editor.html` — the editor. It contains the ECDSA **private** signing key and
  can produce valid data. Treat it like a secret.
- `fleet-config.json` — the plaintext fleet.

## How it works

The owner edits the fleet on their own machine in `editor.html`, which encrypts
**and signs** it with a password, and commits the encrypted file. Every time a
user opens the app it downloads `fleet-config.enc` over HTTPS, asks once for the
password, decrypts it in the browser, and verifies the signature. If GitHub is
unreachable it shows the last cached copy and states the date the data was last
updated. The app auto locks after 15 minutes of inactivity.

---

## Security and privacy

The design assumes the file is public and hostile eyes will see it. Protection
is built in layers.

- **Confidentiality (encryption at rest and in transit).** The fleet is sealed
  with **AES-256 in GCM mode**. The key is derived from the password with
  **PBKDF2-HMAC-SHA256 at 600,000 iterations** and a random salt (OWASP 2023
  guidance), which makes password guessing slow and costly. The repository, the
  GitHub CDN, and the device's offline cache hold **only ciphertext**. In
  transit it is fetched over HTTPS (TLS), so it is double wrapped. Plaintext
  exists only in the browser's memory after you enter the password; it is never
  written to disk or uploaded. The app also **rejects any file whose KDF is
  weaker than 600,000 iterations**, so a downgraded envelope cannot lower the
  cost of guessing.

- **Authenticity (signed data).** The plaintext is signed with an **ECDSA P-256**
  private key held only in `editor.html`. The app carries the matching public
  key and **verifies every file it loads**. If the signature is missing or
  invalid, the app **fails closed**: it refuses to display the data — a file with
  no signature is rejected, never trusted. This means
  even someone who learned the password cannot substitute their own file, and
  any tampering is caught. GCM already detects corruption; the signature proves
  the data came from the owner.

- **Integrity fingerprint.** A SHA-256 fingerprint of the loaded data is shown in
  the disclaimer, so two people can confirm in one glance they are on the same
  release.

- **Session control (session only password).** The password is **never written to
  the device**. It is held in memory for the session only, so the user enters it
  once each time the app is opened fresh. Tapping **Lock**, or the 15 minute
  inactivity auto lock, clears the password from memory. The **encrypted** offline
  copy (ciphertext only) is deliberately kept, so the app still opens without a
  connection — for example in flight — once the password is re-entered. Nothing
  readable is stored on the device: the cache cannot be opened without the
  password.

- **Guess resistance.** After repeated wrong passwords the app adds an increasing
  delay before the next attempt (up to 30 seconds), raising the cost of brute
  force on top of the slow KDF.

- **Reduced attack surface.** A strict **Content Security Policy with no
  `unsafe-inline`** (inline script and style are pinned by SHA-256 hash) blocks
  injected code. The app talks only to itself and to the encrypted data file on
  `raw.githubusercontent.com`, nothing else. Data is rendered with `textContent`
  only, never `innerHTML`. There are **no accounts, no analytics, and no
  tracking**.

**Honest limits.** There is no such thing as 100% security. One shared password
means it is only as strong as the least careful holder, and there is no per user
revocation, to lock one person out you change the password, re-encrypt, and
everyone re-enters it. Anyone trusted with the password can still copy the data.
This protects against outsiders and the public, not against an authorised user
who chooses to leak. Keep `editor.html` private; it holds the signing key.

---

## Admin: how to update the fleet

Open the private `editor.html` (over `http://localhost` or in Safari/Firefox;
Chrome blocks crypto on a plain local file). Enter the fleet password.

1. Start from the current data: **Load .enc**, choose `fleet-config.enc`; it
   decrypts into the form. Or edit the pre loaded template.
2. Edit with the dropdowns. Every field is a controlled dropdown or a text box
   with suggestions, which keeps all cards aligned and consistent. The editor is
   a responsive two-column form that works on iPhone and iPad as well as desktop.
   - **Add your own dropdown value:** choose `--- New Option ---`, type it, and
     it is remembered on that device for next time.
   - **First Flight** uses a date picker; dates are stored and shown as
     `dd-mm-yyyy`.
   - **+ Add new Aircraft** creates a card with every field set to `—`, so you
     can see exactly what still needs verifying.
   - **Duplicate** / **Delete** per aircraft.
3. **Set updated = today** and bump the **Data version**.
4. **Encrypt & download .enc** (this also signs the data), then commit the new
   `fleet-config.enc` to the repo root on `main`. Users get it on next launch or
   by tapping **Verify**.

Changing the password: encrypt with a new one and tell your users; every device
re-enters it once. Rotating the signing key is rare; if you ever do, update the
`SIGN_PUB` constant in `index.html` to match.

### Fields

Identification: Registration, Model, MSN, First Flight (dd-mm-yyyy), First Owner.

Performance: MLW (T), T/O Tailwind limit (kts), LDG Tailwind limit (kts),
Narrow RWY (Approved / Not Approved), SE Taxi w/o APU (Allowed / Not Allowed),
Max autoland ALT (ft), Noise Certification (Chapter 14 / Chapter 4 / Other).

Equipment: BRK FAN, Sharklets (Installed / Not Installed), Engines, Cargo heat,
Headset Plug, ACARS (Spectralux / Standard), INIT* FLT PL Retrieval
(Available / N/A / Partially Available), ADIRU, WX RDR, HF Radio,
CPDLC (Installed / N/A).

Remarks: free text.

In the app, yes/no fields display as coloured text: green for the positive value
(Installed, Approved, Allowed) and red for the negative.

Some fields show a small **i** you can tap for a short explanatory note. For
example, **Engines** explains the difference in warm-up and cool-down times
between the fitted engine types. Tap the **i** again, or anywhere else, to close
it. Ask the maintainer to add notes to other fields as needed.

---

## Users: how to download and activate the app

Do steps 1 to 3 once; after that the app is an icon on your Home Screen.

1. On your phone, open the link in **Safari** (iPhone) or **Chrome** (Android):
   `https://bbjcaptain.github.io/fleet-config/`
2. Add it to your Home Screen (iPhone: **Share → Add to Home Screen**; Android:
   **menu → Add to Home screen**).
3. Open it from the icon, accept the disclaimer, and enter the **fleet password**
   your admin gave you. The password is kept for the session only, so you enter
   it again each time you open the app fresh (and after Lock or 15 minutes idle).

### Using it in flight (no connection)

The app is built to work offline, but it must be **opened once on the ground with
a connection** first — that is when it stores itself and the encrypted fleet data
on your device. After that:

- Launch it from the Home Screen icon as normal; it opens with no signal.
- Enter the fleet password (asked after every fresh start) — decryption happens
  entirely on your device.
- The status will read **offline**, and the footer shows the **data version and
  the date it was last updated**, so you can always see how current it is.

**Recommended before every flight:** open the app once at the gate and unlock it.
That refreshes the fleet data and keeps the offline copy current. Offline you are
always looking at the last version you downloaded — never a live one.

Day to day: the top-right shows an **ENCRYPTED** badge and a live status dot
(hover or tap for detail); the footer shows "Up to date" with the data version,
or, offline, the date the data was last updated. Use the aircraft selector to
switch airframes, and tap a field's **i** for a note where present. **About**
explains the app and its security; **Verify** forces an update check; **Feedback**
emails the maintainer; **Disclaimer** shows the full notice; the **lock** icon
forgets the password (the encrypted offline copy is kept, so the app still opens
without a connection once you re-enter the password). The layout is optimised for
iPhone in portrait and adapts to a wider, roomier layout on iPad.

---

## Version numbering

- **App version**: the software (`index.html`), shown on the About page. Bumps by
  0.1 on every change.
- **Data version**: the fleet database (`meta.version`), bumped by the admin when
  publishing. Shown in the footer and the disclaimer, with the SHA-256
  fingerprint. Dates are shown in **dd-mm-yyyy** format throughout.

## Changelog

### App 1.6
- **Signatures are now mandatory.** A loaded file with no signature fails closed
  and is refused (previously a missing signature silently skipped the check).
  Files must be produced by `editor.html`, which always signs, so real releases
  are unaffected.
- **KDF downgrade protection.** The app rejects any envelope that specifies fewer
  than 600,000 PBKDF2 iterations, and no longer falls back to a weaker default.
- **Works offline after Lock.** Lock and the 15 minute auto lock now forget only
  the password; the encrypted (ciphertext-only) offline copy is kept, so the app
  still opens without a connection — e.g. in flight — once you re-enter the
  password. Previously the cache was wiped on lock, which left the app unusable
  offline.

## Look and feel

Dark navy palette with a light blue accent and carbon texture, inspired by the
Airbus NOVA style: white section headings with a short accent bar, an accent bar
under each aircraft registration, a slim textured hero band, chevron footer
buttons, and an elegant gradient registration typeface. Designed phone-first for
iPhone in portrait, and fully responsive to iPad and desktop.

## Maintenance note

Because the CSP pins inline script and style by SHA-256 hash, if you edit any
inline `<script>` or `<style>` in `index.html` you must recompute those hashes
and update the `Content-Security-Policy` meta tag, otherwise the browser will
block the app.

## One rule that always wins

This tool is an unofficial reference and training aid only. Company documentation
and Airbus manuals always prevail. See the in app disclaimer.
