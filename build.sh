#!/usr/bin/env bash
# Generic builder for any Leptos WASM sub-app in this repo.
#
# Usage:
#   ./build.sh <path-to-leptos-project>
#
# Examples:
#   ./build.sh ./src/applications_leptos/admin_app/
#   ./build.sh ./src/applications_leptos/laplace-transformation/
#
# Output:
#   public/wasm/<basename-of-project>/{*.js,*.wasm,*.d.ts,snippets/}
#
# The output directory is wiped before each build so stale artifacts never
# linger between rebuilds (no caching mishaps).

set -euo pipefail

usage() {
  echo "usage: ./build.sh <path-to-leptos-project>" >&2
  echo "  e.g. ./build.sh ./src/applications_leptos/admin_app/" >&2
  exit 1
}

[ $# -eq 1 ] || usage

PROJECT_PATH="$(realpath "$1")"
[ -f "$PROJECT_PATH/Cargo.toml" ] || {
  echo "no Cargo.toml at $PROJECT_PATH" >&2
  exit 1
}

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="$(basename "$PROJECT_PATH")"
OUT_DIR="$REPO_ROOT/public/wasm/$PROJECT_NAME"

# Prefer the rustup-managed toolchain over a distro-supplied /usr/bin/rustc.
# Arch's `rust` package, for instance, ships only x86_64 and does not include
# the wasm32-unknown-unknown target; the rustup toolchain in ~/.cargo/bin does.
if [ -x "$HOME/.cargo/bin/rustc" ]; then
  export PATH="$HOME/.cargo/bin:$PATH"
fi

# Ensure the wasm32-unknown-unknown target is installed under the active
# rustup toolchain. (No-op if already installed; safe to run every build.)
if command -v rustup >/dev/null 2>&1; then
  if ! rustup target list --installed 2>/dev/null | grep -qx 'wasm32-unknown-unknown'; then
    echo "Installing wasm32-unknown-unknown target via rustup..."
    rustup target add wasm32-unknown-unknown
  fi
fi

command -v wasm-pack >/dev/null 2>&1 || {
  echo "wasm-pack not found. Installing..."
  cargo install wasm-pack
}

# Wipe prior output so stale .js/.wasm/.d.ts/snippets cannot linger.
rm -rf "$OUT_DIR"
mkdir -p "$OUT_DIR"

echo "Building $PROJECT_NAME -> public/wasm/$PROJECT_NAME/"
( cd "$PROJECT_PATH" && wasm-pack build --target web --out-dir "$OUT_DIR" --release )

# wasm-pack emits an auto-generated .gitignore inside the out-dir; we want
# the build artifacts tracked (matches admin_app/build.sh behavior).
rm -f "$OUT_DIR/.gitignore"

echo "Done. Files at public/wasm/$PROJECT_NAME/:"
ls -lh "$OUT_DIR"
