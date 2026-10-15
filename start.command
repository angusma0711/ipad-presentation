#!/bin/zsh
cd "$(dirname "$0")"
presentation_node="$(command -v node || true)"
if [[ -z "$presentation_node" ]]; then
  presentation_node="/Users/hingyinma/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if [[ ! -x "$presentation_node" ]]; then
  echo "Please install Node.js 22.12+ and run npm install first."
  read
  exit 1
fi
"$presentation_node" node_modules/vite/bin/vite.js --host 0.0.0.0 --port 5174
