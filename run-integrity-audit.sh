#!/usr/bin/env bash
set -e

echo "=================================================================="
echo "      N+1 SYSTEM-WIDE INTEGRITY AUDIT & BUGHUNT PIPELINE         "
echo "=================================================================="

echo "[1/3] Triggering runSystemIntegrityTestSuite & SystemBugHunt Loop..."
npx tsx scripts/runIntegrityAuditRunner.ts

echo "\n[2/3] Performing system-wide TypeScript type check & lint error scan..."
npm run lint

echo "\n[3/3] Performing system build validation..."
npm run build

echo "\n=================================================================="
echo "  ✅ SYSTEM INTEGRITY AUDIT & BUGHUNT CYCLE COMPLETE: ALL GREEN!  "
echo "=================================================================="
