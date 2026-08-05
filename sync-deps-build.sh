#!/usr/bin/env bash
set -e

echo "============================================================"
echo "  SYNCHRONIZING PACKAGE DEPENDENCIES & RERUNNING BUILD CYCLE"
echo "============================================================"

echo "[1/3] Synchronizing package.json and package-lock.json..."
npm install

echo "[2/3] Cleaning up node_modules cache and build artifacts..."
rm -rf node_modules/.cache
rm -rf node_modules/.vite
rm -rf dist

echo "[3/3] Rerunning build cycle..."
npm run build

echo "============================================================"
echo " SUCCESS: Dependency synchronization & build cycle complete!"
echo "============================================================"
