#!/bin/sh

set -eu

if ! command -v gpg >/dev/null 2>&1; then
	printf '[show-gpg-key-ids] ERROR: gpg command was not found.\n' >&2
	exit 127
fi

gpg --list-keys --keyid-format LONG |
	awk '/^pub/ { split($2, key_parts, "/"); if (key_parts[2] != "") print key_parts[2] }'
