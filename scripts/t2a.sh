#!/bin/sh

set -eu

for required_command in pbpaste pbcopy; do
	if ! command -v "${required_command}" >/dev/null 2>&1; then
		printf '[t2a] ERROR: required command not found: %s\n' "${required_command}" >&2
		exit 127
	fi
done

pbpaste | pbcopy
