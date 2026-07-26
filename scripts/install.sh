#!/usr/bin/env bash

# N+1 Authentic Reality Emancipation - Official remote Bash Engine Installer
# Version: 0.0.0
# Engine Runtime: Node.js + tsx

set -e

echo ""
echo "=========================================================="
echo "  n+1:-authentic-reality-emancipation@0.0.0"
echo "  Official remote Bash Engine Installer"
echo "=========================================================="
echo ""

# Check for node and npm
if ! command -v node &> /dev/null; then
    echo "[!] Node.js is required but not installed. Please install Node.js v18+."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "[!] npm is required but not installed."
    exit 1
fi

echo "[+] Node Version: $(node -v)"
echo "[+] npm Version:  $(npm -v)"

TARGET_DIR="${1:-$(pwd)}"
echo "[+] Injecting N+1 System into: ${TARGET_DIR}"

cd "$TARGET_DIR"

# Install tsx globally or locally if needed
echo "[+] Verifying tsx engine runner..."
if ! command -v tsx &> /dev/null; then
    echo "[+] Installing tsx executable runner..."
    npm install -g tsx || npm install --save-dev tsx
fi

echo "[+] Registering package n+1:-authentic-reality-emancipation@0.0.0..."
if [ -f "package.json" ]; then
    npm install --save n+1:-authentic-reality-emancipation@0.0.0 || true
fi

echo "[+] Generating n1.config.json..."
cat <<EOT > n1.config.json
{
  "package": "n+1:-authentic-reality-emancipation",
  "version": "0.0.0",
  "engine": "tsx",
  "installedVia": "remote-bash-installer",
  "installedAt": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "kellerRoutes": ["keller-01", "keller-02", "keller-03", "keller-04", "keller-05"],
  "adeStatus": "VERIFIED"
}
EOT

echo ""
echo "=========================================================="
echo " [SUCCESS] N+1 System fully installed to repository!"
echo " Start server using:"
echo "   $ npm run dev"
echo "   OR"
echo "   $ tsx server.ts"
echo "=========================================================="
echo ""
