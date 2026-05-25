#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/setup_openrouter_env.sh <OPENROUTER_API_KEY>
KEY="${1:-}"

CACHE_DIR="$HOME/.openrouter"
CACHE_FILE="$CACHE_DIR/OPENROUTER_API_KEY.txt"

if [ -z "$KEY" ]; then
  if [ -f "$CACHE_FILE" ]; then
    KEY=$(cat "$CACHE_FILE")
  else
    echo "Usage: $0 <OPENROUTER_API_KEY> or store the key at $CACHE_FILE" >&2
    exit 1
  fi
fi

if [ -z "$KEY" ]; then
  echo "OpenRouter API key is empty" >&2
  exit 1
fi

mkdir -p "$CACHE_DIR"
echo "$KEY" > "$CACHE_FILE"

# Persist to shell profile if not already present
PROFILE="$HOME/.bashrc"
if [ -f "$PROFILE" ]; then
  if ! grep -q "OPENROUTER_API_KEY" "$PROFILE"; then
    echo "export OPENROUTER_API_KEY=\"$KEY\"" >> "$PROFILE"
    echo "Appended OPENROUTER_API_KEY to $PROFILE"
  else
    echo "OPENROUTER_API_KEY already present in $PROFILE" 
  fi
fi

export OPENROUTER_API_KEY="$KEY"
echo "OPENROUTER_API_KEY exported for current session. New sessions will source it via $PROFILE." 
