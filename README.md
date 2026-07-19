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
  pages open **without a connection** (in flight). Bump `CACHE_VERSION` when
  publishing — `publish.command` does this automatically.
- `manifest.json` / `manifest-collector.json` — Add-to-Home-Screen definitions for the viewer and the collector.
- `UI/` — static assets:
  - `UI/icon1.png` — icon for the **viewer** (`index.html`).
  - `UI/icon2.png` — icon for the **editor** (private, not published here).
  - `UI/icon3.png` — icon for the **collector** (`collector.html`).
  - `UI/icon.png` — previous icon, no longer referenced.
  - `UI/carbon.png` — background texture used in the header and footer.
- `README.md` — this file.

**Never commit** (Super Admin only, private, confidential):

- `editor.html` — the editor. It contains the ECDSA **private** signing key and
  can produce valid data. Treat it like a secret.
- `fleet-config.json` — the plaintext fleet.

## How it works

The admin edits the fleet on their own machine in `editor.html`, which encrypts **and signs** it with a password, and commits the encrypted file. Every time a user opens the app it downloads `fleet-config.enc` over HTTPS, asks once for the password, decrypts it in the browser, and verifies the signature. If GitHub is unreachable it shows the last cached copy and states the date the data was last updated. The app auto locks after 15 minutes of inactivity.

---

## Security and privacy

The design assumes the file is public and hostile eyes will see it. Protection is built in layers.

- **Confidentiality (encryption at rest and in transit).** The fleet is sealed with **AES-256 in GCM mode**. The key is derived from the password with **PBKDF2-HMAC-SHA256 at 600,000 iterations** and a random salt (OWASP 2023 guidance), which makes password guessing slow and costly. The repository, the GitHub CDN, and the device's offline cache hold **only ciphertext**. In transit it is fetched over HTTPS (TLS), so it is double wrapped. Plaintext exists only in the browser's memory after you enter the password; it is never written to disk or uploaded. The app also **rejects any file whose KDF is weaker than 600,000 iterations**, so a downgraded envelope cannot lower the cost of guessing.

- **Authenticity (signed data).** The plaintext is signed with an **ECDSA P-256** private key held only in `editor.html`. The app carries the matching public key and **verifies every file it loads**. If the signature is missing or invalid, the app **fails closed**: it refuses to display the data — a file with no signature is rejected, never trusted. This means
  even someone who learned the password cannot substitute their own file, and
  any tampering is caught. GCM already detects corruption; the signature proves the data came from the owner.

- **Integrity fingerprint.** A SHA-256 fingerprint of the loaded data is shown in the disclaimer, so two people can confirm in one glance they are on the same release.

- **Session control (session only password).** The password is **never written to
  the device**. It is held in memory for the session only, so the user enters it once each time the app is opened fresh. Tapping **Lock**, or the 15 minute inactivity auto lock, clears the password from memory. The **encrypted** offline copy (ciphertext only) is deliberately kept, so the app still opens without aconnection — for example in flight — once the password is re-entered. Nothing readable is stored on the device: the cache cannot be opened without the password.

- **Guess resistance.** After repeated wrong passwords the app adds an increasing delay before the next attempt (up to 30 seconds), raising the cost of brute force on top of the slow KDF.

- **Reduced attack surface.** A strict **Content Security Policy with no
  `unsafe-inline`** (inline script and style are pinned by SHA-256 hash) blocks injected code. The app talks only to its own origin (the encrypted data file is served from the same GitHub Pages site), nothing else. Data is rendered with `textContent` only, never `innerHTML`. There are **no accounts, no analytics, and no tracking**.

**Honest limits.** There is no such thing as 100% security. One shared password means it is only as strong as the least careful holder, and there is no per user revocation, to lock one person out you change the password, re-encrypt, and everyone re-enters it. Anyone trusted with the password can still copy the data. This protects against outsiders and the public, not against an authorised user who chooses to leak. Keep `editor.html` private; it holds the signing key.

---

## Admin: how to update the fleet

Open the private `editor.html` **over `http://localhost` in Chrome/Edge**
(Chrome blocks crypto on a plain local file, and localhost additionally lets
**Encrypt & save** write straight back to the same file). Safari and Firefox also work, but can only download the result. Enter the fleet password.

The editor opens **empty** — nothing is loaded until you choose a file.

1. Start from the current data: **Load ENC** (the green button — always first),
   choose `fleet-config.enc`; it decrypts into the form.
2. Edit with the dropdowns. Every field is a controlled dropdown or a text box with suggestions, which keeps all cards aligned and consistent. The editor is a responsive two-column form that works on iPhone and iPad as well as desktop.
   - **Add your own dropdown value:** choose `--- New Option ---`, type it, and it is remembered on that device for next time.
   - **First Flight** uses a date picker; dates are stored and shown as
     `dd-mm-yyyy`.
   - **`--- New Aircraft ---`** at the bottom of the aircraft picker creates a card with every field set to `—`, so you can see exactly what still needs verifying.
   - **Duplicate** / **Delete** per aircraft.
   - **Merge collected JSON** folds in notes taken with the collector, matched by registration. It shows exactly what will be added and updated before you confirm, and only applies fields that have a value — blanks never overwrite existing data. See *Merging collector notes* below.
   - **Load JSON** restores a plaintext backup or data edited outside the app. Rarely needed — it **replaces the entire fleet**.
   - Each field carries a coloured left border: **grey** = never set, **blue** = has a value, **amber** = changed in this session. A meter above each card shows how complete that airframe is.
3. Tap the **clock** button beside *Updated* to set today's date, and bump the **Data version**.
4. **Encrypt & save to iCloud** (this also signs the data). In Chrome over localhost it writes back to the same file; elsewhere it downloads a copy you must move into place yourself. An amber strip then reminds you it is **saved but not published**.
5. Publish. Users get it on next launch, or by tapping **Verify**.

**Never upload a `.enc` to GitHub by hand.** Publishing copies your local folder *to* the repo, so a file uploaded directly would be silently overwritten — and the fleet would revert — the next time you publish.

Changing the password: encrypt with a new one and tell your users; every device re-enters it once. Rotating the signing key is rare; if you ever do, update the `SIGN_PUB` constant in `index.html` to match.

### Merging collector notes into the encrypted fleet

Notes taken in the air with **Fleet Collector** arrive as a plain
`fleet-collected.json`. Nothing is merged on GitHub — the merge happens **inside
the editor, on your machine**, and the result is then re-encrypted and published.

Get the `.json` onto the Mac (AirDrop is easiest), then:

1. Open `editor.html` over `http://localhost` in Chrome and enter the fleet password.
2. **Load ENC** → choose `github/fleet-config.enc`.
   **This step is not optional.** Saving rewrites the *entire* file from what is
   on screen, so merging into an empty editor would replace the whole fleet with
   just the collected aircraft.
3. **Merge collected JSON** → choose `fleet-collected.json`.
4. A confirmation appears **before anything changes**, for example:
   > Add 1 new: 9H-NEW
   > Update 1 existing (matched by registration): 9H-GKK
   > Only fields that have a value are applied; blank fields keep the existing data.
5. Confirm, then review the affected aircraft. Edited fields show an **amber left
   border**, so you can see exactly what the merge touched.
6. Tap the **clock** button to set Updated to today, and bump the **Data version**.
7. **Encrypt & save to iCloud** → writes back to the same file.
8. Run `publish.command`. Only then tap **Clear draft** in the collector.

**How matching works.** Aircraft are matched by **registration**, case and
space insensitive. A registration already in the fleet **updates** that airframe;
an unknown one is **added**. Only fields carrying a value are applied — anything
left blank in the collector never overwrites data you already have. The merge is
therefore safe to run twice; it will not blank anything out.

### Fields

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

### App 1.6
- **Signatures are now mandatory.** A loaded file with no signature fails closed and is refused (previously a missing signature silently skipped the check). Files must be produced by `editor.html`, which always signs, so real releases are unaffected.
- **KDF downgrade protection.** The app rejects any envelope that specifies fewer than 600,000 PBKDF2 iterations, and no longer falls back to a weaker default.
- **Works offline after Lock.** Lock and the 15 minute auto lock now forget only the password; the encrypted (ciphertext-only) offline copy is kept, so the app still opens without a connection — e.g. in flight — once you re-enter the password. Previously the cache was wiped on lock, which left the app unusable offline.

## Design direction (in progress)

The three apps — viewer (`index.html`), editor (`editor.html`) and collector
(`collector.html`) — are being aligned into **one visual system**. The viewer's
Airbus-NOVA-inspired language is the reference; the editor and collector adopt it.
The rule throughout: **nothing may cost clarity.** No neon, no heavy gradients on
data fields, and no animation on a value a pilot might misread.

**Tier 1 — visual *and* functional (done in the editor):**
- **Change-state field borders.** A 3 px left border on every field: grey = never
  set, blue = has a value, **amber = changed since you loaded**. You can see your
  edits before saving, which prevents the "did I actually change that?" problem.
- **Completeness meter.** A slim bar plus "8 of 28 fields set" per airframe, so
  half-documented aircraft are obvious at a glance.
- **Unpublished-changes banner.** After saving, an amber strip states *"Saved to
  iCloud — NOT yet published."* It survives reloads and clears only when you
  confirm you ran `publish.command`, closing the save-vs-publish gap.

**Tier 2 — the family look (planned):** carbon-textured sticky header, the accent
bar, and each aircraft's registration in the viewer's gradient display typeface;
subtle glass panels over the texture on an 8 px spacing rhythm. Side by side, the
editor and viewer should read as one product.

**Tier 3 — polish (planned):** restrained motion (120 ms transitions, a checkmark
that draws itself on save, the SHA-256 fingerprint fading in), and a **⌘K command
palette** to jump to any aircraft by registration.

## Look and feel

Dark navy palette with a light blue accent and carbon texture, inspired by the Airbus NOVA style: white section headings with a short accent bar, an accent bar under each aircraft registration, a slim textured hero band, chevron footer buttons, and an elegant gradient registration typeface. Designed phone-first for iPhone in portrait, and fully responsive to iPad and desktop.

## Maintenance note

Because the CSP pins inline script and style by SHA-256 hash, if you edit any
inline `<script>` or `<style>` in `index.html` you must recompute those hashes and update the `Content-Security-Policy` meta tag, otherwise the browser will block the app.

## One rule that always wins

This tool is an unofficial reference and training aid only. Company documentation and Airbus manuals always prevail. See the in app disclaimer.
