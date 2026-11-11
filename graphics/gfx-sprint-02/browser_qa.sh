#!/usr/bin/env bash
set -euo pipefail
root="$(cd "$(dirname "$0")" && pwd)"
export RAVAN_QA_HTML="$1" RAVAN_QA_OUTPUT="$2" RAVAN_QA_STAGE="$3" RAVAN_QA_VIEW="${4:-1280x800}"
export QT_QUICK_BACKEND=software QT_OPENGL=software QT_QPA_PLATFORM=offscreen
export QT_QPA_PLATFORM_PLUGIN_PATH="${RAVAN_QT_PLATFORM_PATH:-/usr/lib/x86_64-linux-gnu/qt5/plugins/platforms}"
export QTWEBENGINE_DISABLE_SANDBOX=1
export QTWEBENGINE_CHROMIUM_FLAGS='--no-sandbox --disable-gpu --disable-dev-shm-usage --no-zygote --single-process'
timeout 45 "${RAVAN_SLICER:-/opt/slicer/5.10.0/Slicer}" --no-main-window --disable-cli-modules --disable-scripted-loadable-modules --python-script "$root/browser_qa.py"
