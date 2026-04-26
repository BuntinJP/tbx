#!/bin/sh
# =============================================================================
# comment.sh — Append a timestamped comment entry to chat-memo.txt
#
# Usage:
#   ./comment.sh "comment content" [agent-name]
#
# Arguments:
#   $1  Comment body (required)
#   $2  Agent / author name (optional; defaults to COMMENT_AGENT or "system")
#
# Environment variables (override defaults):
#   COMMENT_MEMO   Path to the memo file  (default: chat-memo.txt in script dir)
#   COMMENT_AGENT  Default agent name     (default: "system")
#
# =============================================================================

set -eu

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

readonly SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
readonly DEFAULT_MEMO="${SCRIPT_DIR}/chat-memo.txt"
readonly DEFAULT_AGENT="system"

readonly SEPARATOR="────────────────────────────────────────────────────────────"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

die() {
    printf '[comment.sh] ERROR: %s\n' "$*" >&2
    exit 1
}

usage() {
    cat >&2 <<EOF
Usage: $(basename "$0") "comment content" [agent-name]

  comment content   Text body to post (required)
  agent-name        Author label       (optional; default: "${DEFAULT_AGENT}")

Environment:
  COMMENT_MEMO    Target memo file   (default: chat-memo.txt next to this script)
  COMMENT_AGENT   Default agent name (default: "${DEFAULT_AGENT}")
EOF
    exit 1
}

# ---------------------------------------------------------------------------
# Argument resolution
# ---------------------------------------------------------------------------

[ "$#" -ge 1 ] || usage

COMMENT_BODY="$1"
[ -n "${COMMENT_BODY}" ] || die "Comment body must not be empty."

AGENT="${2:-${COMMENT_AGENT:-${DEFAULT_AGENT}}}"
MEMO="${COMMENT_MEMO:-${DEFAULT_MEMO}}"

# ---------------------------------------------------------------------------
# Timestamp  (ISO-8601, local time with offset — pure POSIX via date)
# ---------------------------------------------------------------------------

TIMESTAMP="$(date '+%Y-%m-%dT%H:%M:%S%z')"

# ---------------------------------------------------------------------------
# Ensure memo file is writable (create if absent)
# ---------------------------------------------------------------------------

if [ ! -e "${MEMO}" ]; then
    touch "${MEMO}" || die "Cannot create memo file: ${MEMO}"
fi

[ -w "${MEMO}" ] || die "Memo file is not writable: ${MEMO}"

# ---------------------------------------------------------------------------
# Compose and append entry
# ---------------------------------------------------------------------------

{
    printf '\n%s\n' "${SEPARATOR}"
    printf '[%s]  @%s\n' "${TIMESTAMP}" "${AGENT}"
    printf '\n%s\n' "${COMMENT_BODY}"
} >> "${MEMO}"

# ---------------------------------------------------------------------------
# Confirm
# ---------------------------------------------------------------------------

printf '[comment.sh] Posted by @%s at %s → %s\n' \
    "${AGENT}" "${TIMESTAMP}" "${MEMO}"
