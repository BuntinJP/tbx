#!/usr/bin/env zsh

set -euo pipefail

if ! command -v brew >/dev/null 2>&1; then
	print -u2 "[refresh-brew] ERROR: brew command was not found."
	exit 127
fi

run_step() {
	local label="$1"
	shift

	print "[refresh-brew] ${label}"
	"$@"
}

run_step "Updating Homebrew" brew update
run_step "Upgrading Homebrew packages" brew upgrade
run_step "Cleaning Homebrew cache" brew cleanup
run_step "Removing old Homebrew versions" brew autoremove

print "[refresh-brew] Done"
