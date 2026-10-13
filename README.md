# Shreya Bawankar — Portfolio

A beginner-friendly, responsive portfolio for a JavaScript Lab CA3 project. It uses plain HTML, CSS, and JavaScript; the optional visitor details demo uses Node.js built-in modules and needs no package installation.

## Run in VS Code

1. Install Node.js if it is not already installed.
2. Open this folder in VS Code.
3. Open **Terminal → New Terminal**.
4. Run `npm start`.
5. Open the local URL printed in the terminal (usually **http://localhost:3000**). If that port is busy, the server automatically tries the next available port and prints its URL.
6. Press Ctrl+C in the terminal to stop the server.

You can also open `index.html` directly, but server-based visitor details will show as unavailable. The rest of the portfolio still works.

## Personalize the site

Open `index.html` and search for **your.email**, **your-username**, and **your-profile**. Replace those placeholders with information Shreya wants to share. Academic marks are intentionally blank. Edit the school input with actual school details. Update project descriptions to match actual individual contributions and add links only when available.

- Replace achievement and certificate placeholders with verified items and real links.
- Put photos in an `images` folder and edit the gallery tile styles in `styles.css`.
- The resume and certificates are stored in `assets/`; replace those files there when you update them.
- Update the skills list in `index.html` to match your actual experience.

## Visitor analytics and privacy

The server records a basic visit entry in `visits.jsonl`: the IP address available on the server connection, timestamp, page path, and browser user-agent. It does not identify visitors by name. An IP address may be shared by several people or change over time; on localhost it is usually a loopback address. Browser JavaScript cannot reliably discover a visitor's public IP. No third-party analytics service is used.

The portfolio explains this logging to visitors. The raw visit list is available only at `/owner`, protected by HTTP Basic authentication. Before starting the server, set a private password in the VS Code PowerShell terminal and then run `npm start`:

```powershell
$env:OWNER_PASSWORD = "choose-a-private-password"
npm start
```

Open the printed local URL with `/owner` appended and sign in with username `owner` and the password you set. If the server is already running, stop it with Ctrl+C and restart it after setting the password. Do not share the password or `visits.jsonl`. Use HTTPS if deploying publicly, review the privacy rules that apply to you, and delete logs when you no longer need them. If you want to know a visitor's name, they must choose to identify themselves, such as by sending a message.

## Files

- `index.html` — page content and editable sections
- `styles.css` — responsive design and visual theme
- `script.js` — mobile menu and analytics display
- `server.js` — local static server and basic visit endpoint
- `package.json` — the `npm start` command
- `assets/shreya-bawankar-resume.pdf` — downloadable resume
- `assets/red-hat-ansible-certificate.pdf` — Red Hat Ansible course certificate
- `assets/symbithon-2024-certificate.jpeg` — Symbithon participation certificate
- `assets/hackocean-2026-certificate.pdf` — HackOcean 2026 participation certificate
- `assets/hackocean-2026-certificate-preview.png` — browser-friendly certificate preview
- `assets/maincrafts-python-internship-certificate.pdf` — internship certificate
- `assets/maincrafts-python-internship-certificate-preview.png` — certificate preview
