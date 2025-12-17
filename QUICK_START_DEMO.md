# Quick Start Demo

Run the Game SDK Playground locally in 3 simple steps.

---

## Step 1: Install Node.js

### Windows

**Option 1: Official Installer (Recommended)**

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version
3. Run the installer and follow the wizard
4. Restart your terminal

**Option 2: Chocolatey**
```powershell
choco install nodejs-lts
```

**Option 3: winget**
```powershell
winget install OpenJS.NodeJS.LTS
```

---

### macOS

**Option 1: Homebrew (Recommended)**
```bash
brew install node
```

**Option 2: Official Installer**

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version for macOS
3. Run the `.pkg` installer

**Option 3: nvm**
```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install --lts
```

---

### Linux

**Ubuntu / Debian:**
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Fedora:**
```bash
sudo dnf install nodejs
```

**Arch Linux:**
```bash
sudo pacman -S nodejs npm
```

---

### Verify Installation

```bash
node --version
npm --version
```

---

## Step 2: Start the Server

```bash
cd /path/to/public-game-core-sdk
node server.js
```

Output:
```
Server running at http://localhost:3333/
Open http://localhost:3333/Demo.html
```

---

## Step 3: Open Demo

Open in your browser:

**http://localhost:3333/Demo.html**

---

## Stopping the Server

Press `Ctrl + C` in the terminal.

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `node: command not found` | Restart terminal after installation |
| Port 3333 in use | Change `PORT` in `server.js` |
| Cannot connect | Try `127.0.0.1:3333` instead of `localhost` |

---

## Alternative Methods

**Python 3:**
```bash
python3 -m http.server 3333
```

**npx (no setup):**
```bash
npx serve -p 3333
```

---

**Last Updated**: December 2025
