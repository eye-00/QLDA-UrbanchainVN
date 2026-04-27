#!/usr/bin/env bash
set -e

echo "[1/5] Create base folders"
mkdir -p contracts backend frontend docs tests codex/skills .claude/rules

echo "[2/5] Reminder: copy ECC common + typescript rules into .claude/rules"
echo "[3/5] Reminder: install Codex CLI and open this repo with Codex"
echo "[4/5] Reminder: fill docs/04-backlog-mvp.md with real backlog"
echo "[5/5] Reminder: start with skill plan-mvp-feature"

echo "Done."
