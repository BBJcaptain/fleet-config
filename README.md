# A320 Fleet Configuration

A read only, mobile friendly reference for the operational configuration of an
A320 family fleet. The data is encrypted, so the repository can stay public
while the fleet stays private. Only someone with the fleet password can read it.

Live app: `https://bbjcaptain.github.io/fleet-config/`
Repository: `https://github.com/BBJcaptain/fleet-config`

## What is in this repository

Only two things belong here, plus this README:

- `index.html` — the app users open. Self contained, read only, and it holds
  **no fleet data**. Safe to be public.
- `fleet-config.enc` — the encrypted fleet database (ciphertext).
- `README.md` — this file.

**Never commit** the private editor (`editor.html`) or any plaintext
`fleet-config.json`. Those stay on the admin's machine only.

## How it works, in one paragraph

The admin edits the fleet as plain JSON on their own machine, encrypts it with a
password, and commits the encrypted file. Every time a user opens the app it
downloads that encrypted file over HTTPS, asks once for the password, and
unlocks it on the device. If GitHub cannot be reached, the app shows the last
copy it cached and states the date that data was last updated. See the in app
**About** page for how the encryption works in detail.

---

## Admin: how to update the fleet

You need the private `editor.html` (kept off the repo) and the fleet password.

1. Open `editor.html`. Because it uses browser cryptography, serve the folder
   over `http://localhost` or open it in Safari or Firefox. Chrome blocks crypto
   on a plain local file.
2. Type the fleet password.
3. Start from the current data: click **Load encrypted .enc**, choose your local
   `fleet-config.enc`, and it decrypts into the editor. Or edit the JSON
   directly.
4. Make your changes. Each aircraft is one object in the `aircraft` list.
   - yes/no fields: `true` or `false` (or `null` if unknown)
   - choice fields: exactly one of the allowed texts (for example engine
     `"IAE"` or `"CFM"`)
   - number fields: a plain number, no quotes
   - text and remarks: any text in double quotes
5. Bump `meta.version` (for example `3.0.0` to `3.1.0`) and click
   **Set updated = today**.
6. Click **Validate & format**, then **Encrypt & download .enc**. This produces
   a fresh `fleet-config.enc`.
7. Commit that `fleet-config.enc` to the repository root on `main` (replace
   the old one). Users get it on their next launch.

To change the password, simply encrypt with a new one and tell your users the
new password. Every device re enters it once.

Keep a private plaintext backup with **Download plaintext backup .json** if you
want one, but do not commit it.

---

## Users: how to download and activate the app

You only need to do steps 1 to 3 once. After that the app is an icon on your
home screen.

1. On your phone, open the app link in **Safari** (iPhone) or **Chrome**
   (Android): `https://bbjcaptain.github.io/fleet-config/`
2. Add it to your home screen so it opens like an app:
   - iPhone: tap the **Share** button, then **Add to Home Screen**, then **Add**.
   - Android: tap the **menu (three dots)**, then **Add to Home screen**.
3. Open the app from the new icon. Read and accept the disclaimer, then enter
   the **fleet password** your admin gave you. The password is remembered on
   your device until you tap **Lock**.

Day to day:

- The app checks for the latest data each time it opens. A bar at the top shows
  whether it is up to date, or, if there is no connection, the date the data was
  last updated.
- It works offline once loaded.
- Move between aircraft with the arrows, the dropdown, or by swiping the on
  screen selector. **Print** produces one aircraft per page.
- **Lock** forgets the password on that device, useful before handing your phone
  to someone else.
- **About** explains the app, the versioning, and the security. **Feedback**
  opens an email to report a mistake or suggestion.

If you ever see "No connection" and no data on first use, you simply need to be
online once so the app can download and unlock the fleet.

---

## Version numbering

- **App version**: the software itself. Changes only when the app is rebuilt.
  Shown on the About page.
- **Data version**: the fleet database, shown as a version number and a date
  (`meta.version` and `meta.updated` in the JSON). Changes every time the admin
  publishes new data. Shown in the top bar and the disclaimer, next to a
  SHA 256 fingerprint of the exact data on screen.

## Security and privacy, briefly

The fleet is sealed with AES using a 256 bit key in GCM mode; the key is derived
from the password with PBKDF2 (200,000 iterations, random salt). The repository
holds only the sealed file. Decryption happens on the device; the plaintext is
never uploaded or stored on a server. There are no accounts, no analytics, and
no tracking. Honest limits: one shared password, no per user revocation, and it
protects against outsiders rather than an authorised user who chooses to leak.
Full detail is on the in app About page.

## One rule that always wins

This tool is an unofficial reference and training aid only. Company
documentation and Airbus manuals always prevail. See the in app disclaimer.
