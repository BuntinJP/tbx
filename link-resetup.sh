#!/bin/sh
# Reset all managed command links in ./bin.
#
# Add one link_ts line for each TypeScript command.
# Comment out a line when you want to temporarily disable that command.

set -eu

SCRIPT_D="$(cd "$(dirname "$0")" && pwd)"
BIN_D="${SCRIPT_D}/bin"

mkdir -p "${BIN_D}"

link_ts() {
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

link_ts "chgh" "scripts/chgh.ts"
