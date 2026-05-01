#!/bin/sh

set -eu

for required_command in pbpaste pbcopy sort; do
	if ! command -v "${required_command}" >/dev/null 2>&1; then
		printf '[s2a] ERROR: required command not found: %s\n' "${required_command}" >&2
		exit 127
	fi
done

pbpaste | LC_ALL=C sort -u | pbcopy
