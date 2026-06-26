#!/bin/bash
set +e

PASSED=0
WARNED=0
FAILED=0

pass() { echo "[PASS] $1"; PASSED=$((PASSED + 1)); }
warn() { echo "[WARN] $1"; WARNED=$((WARNED + 1)); }
fail() { echo "[FAIL] $1"; FAILED=$((FAILED + 1)); }
check_cmd() { command -v "$1" >/dev/null 2>&1 && pass "$1 is installed" || fail "$1 is not installed"; }
check_pkg() { dpkg -l "$1" 2>/dev/null | grep -q "^ii" && pass "$1 is installed" || fail "$1 is not installed"; }

echo "Bootstrap Packages Verification"
echo "================================"

echo
echo "Essential packages"
check_pkg curl
check_pkg wget
check_pkg unzip
check_pkg jq
check_pkg apt-transport-https
check_pkg ca-certificates
check_pkg gnupg
check_pkg lsb-release
check_pkg software-properties-common

echo
echo "Build tools"
check_pkg make
check_pkg gcc

echo
echo "Network tools"
check_pkg net-tools
check_pkg iputils-ping

echo
echo "Storage tools"
check_pkg nvme-cli

echo
echo "AWS CLI"
command -v aws >/dev/null 2>&1 && pass "AWS CLI is installed" || warn "AWS CLI is not installed"

echo
echo "Docker"
command -v docker >/dev/null 2>&1 && pass "Docker is installed" || warn "Docker is not installed"

echo
echo "Bootstrap Packages Verification Summary"
echo "Passed: $PASSED"
echo "Warnings: $WARNED"
echo "Failed: $FAILED"

[ "$FAILED" -eq 0 ]
