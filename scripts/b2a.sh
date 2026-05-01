#!/bin/sh

set -eu

for required_command in pbpaste pbcopy python3; do
	if ! command -v "${required_command}" >/dev/null 2>&1; then
		printf '[b2a] ERROR: required command not found: %s\n' "${required_command}" >&2
		exit 127
	fi
done

pbpaste |
	python3 -c 'import sys, urllib.parse; sys.stdout.write(urllib.parse.unquote(sys.stdin.read().strip()))' |
	pbcopy
