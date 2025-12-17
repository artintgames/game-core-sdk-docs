# Local Server Guide

This guide explains how to run `Demo.html` locally using a simple Node.js server. ES modules require an HTTP server and cannot be loaded from the `file://` protocol due to CORS restrictions.

## Prerequisites

You need Node.js installed on your system. Follow the instructions below for your operating system.

---

## Installing Node.js

### Windows

**Option 1: Official Installer (Recommended)**

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version (recommended for most users)
3. Run the installer (`.msi` file)
4. Follow the installation wizard, keeping default settings
5. Restart your terminal/command prompt

**Option 2: Using Chocolatey**

```powershell
choco install nodejs-lts
```

**Option 3: Using winget**

```powershell
winget install OpenJS.NodeJS.LTS
```

**Verify installation:**

```cmd
node --version
npm --version
```

---

### macOS

**Option 1: Official Installer**

1. Go to [nodejs.org](https://nodejs.org/)
2. Download the **LTS** version for macOS
3. Run the `.pkg` installer
4. Follow the installation wizard

**Option 2: Using Homebrew (Recommended)**

```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install Node.js
brew install node
```

**Option 3: Using nvm (Node Version Manager)**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal, then install Node.js
nvm install --lts
nvm use --lts
```

**Verify installation:**

```bash
node --version
npm --version
```

---

### Linux

#### Ubuntu / Debian

**Option 1: Using NodeSource (Recommended)**

```bash
# Install Node.js 20.x LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Option 2: Using apt (older version)**

```bash
sudo apt update
sudo apt install nodejs npm
```

**Option 3: Using nvm**

```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Restart terminal or run:
source ~/.bashrc

# Install Node.js LTS
nvm install --lts
nvm use --lts
```

#### Fedora / RHEL / CentOS

```bash
# Fedora
sudo dnf install nodejs

# RHEL/CentOS (using NodeSource)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo yum install -y nodejs
```

#### Arch Linux

```bash
sudo pacman -S nodejs npm
```

**Verify installation:**

```bash
node --version
npm --version
```

---

## Running the Local Server

### Step 1: Navigate to the project directory

**Windows (Command Prompt):**
```cmd
cd C:\path\to\public-game-core-sdk
```

**Windows (PowerShell):**
```powershell
cd C:\path\to\public-game-core-sdk
```

**macOS / Linux:**
```bash
cd /path/to/public-game-core-sdk
```

### Step 2: Start the server

```bash
node server.js
```

You should see:
```
Server running at http://localhost:3333/
Open http://localhost:3333/Demo.html
```

### Step 3: Open in browser

Open your web browser and navigate to:

**http://localhost:3333/Demo.html**

Or simply:

**http://localhost:3333/**

---

## Stopping the Server

Press `Ctrl + C` in the terminal where the server is running.

---

## Troubleshooting

### "node is not recognized" / "command not found"

- **Windows**: Restart your terminal after installing Node.js
- **macOS/Linux**: Run `source ~/.bashrc` or `source ~/.zshrc`, or restart terminal

### Port 3333 is already in use

Edit `server.js` and change the `PORT` value:

```javascript
const PORT = 8080; // Change to any available port
```

### EACCES permission denied (Linux/macOS)

For ports below 1024, you need sudo. Use port 3333 or higher instead.

### Cannot connect to localhost

1. Check if firewall is blocking the port
2. Try using `127.0.0.1` instead of `localhost`
3. Make sure no other application is using port 3333

---

## Alternative: Using Python (if Node.js is not available)

If you have Python installed, you can use its built-in HTTP server:

**Python 3:**
```bash
cd /path/to/public-game-core-sdk
python3 -m http.server 3333
```

**Python 2:**
```bash
cd /path/to/public-game-core-sdk
python -m SimpleHTTPServer 3333
```

Then open: **http://localhost:3333/Demo.html**

---

## Alternative: Using npx (no installation required)

If you have npm but don't want to use server.js:

```bash
cd /path/to/public-game-core-sdk
npx serve -p 3333
```

Then open: **http://localhost:3333/Demo.html**

---

**Last Updated**: December 2025
**Version**: 1.0.0
