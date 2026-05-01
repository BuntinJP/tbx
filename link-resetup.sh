#!/bin/sh
# Reset all managed command links in ./bin.
#
# Add one link_command line for each user-facing command.
# Comment out a line when you want to temporarily disable that command.

set -eu

SCRIPT_D="$(cd "$(dirname "$0")" && pwd)"
BIN_D="${SCRIPT_D}/bin"

mkdir -p "${BIN_D}"

link_command() {
	command_name="$1"
	script_rel="$2"
	script_path="${SCRIPT_D}/${script_rel}"
	link_path="${BIN_D}/${command_name}"
	link_target="../${script_rel}"

	if [ ! -f "${script_path}" ]; then
		printf '[link-resetup.sh] ERROR: script not found: %s\n' "${script_path}" >&2
		exit 1
	fi

	chmod 755 "${script_path}"

	if [ -e "${link_path}" ] && [ ! -L "${link_path}" ]; then
		printf '[link-resetup.sh] ERROR: destination exists and is not a symlink: %s\n' "${link_path}" >&2
		exit 1
	fi

	rm -f "${link_path}"
	ln -s "${link_target}" "${link_path}"
	printf '[link-resetup.sh] linked: %s -> %s\n' "${link_path}" "${link_target}"
}

link_command "b2a" "scripts/b2a.sh"
link_command "chgh" "scripts/chgh.ts"
link_command "prevent-sleep" "scripts/prevent-sleep.applescript"
link_command "refresh-brew" "scripts/refresh-brew.zsh"
link_command "request-macos-automation-permissions" "scripts/request-macos-automation-permissions.ts"
link_command "s2a" "scripts/s2a.sh"
link_command "show-gpg-key-ids" "scripts/show-gpg-key-ids.sh"
link_command "ssh-socks-proxy" "scripts/ssh-socks-proxy.sh"
link_command "t2a" "scripts/t2a.sh"
link_command "trim-lines" "scripts/trim-lines.ts"
