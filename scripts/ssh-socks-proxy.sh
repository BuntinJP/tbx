#!/bin/zsh
# =============================================================================
# ssh-socks-proxy.sh — SSH SOCKS5 proxy daemon (single-instance)
#
# Usage:
#   ./ssh-socks-proxy.sh
#
# Starts an SSH SOCKS5 proxy on PROXY_PORT using the SSH_TARGET host.
# If a stale/running instance is detected via PIDFILE, it exits early.
#
# Origin: ported from Buntin-Liz/commands scripts/commands-45454-sock5-proxy.sh
# =============================================================================

set -u

# ---------------------------------------------------------------------------
# Configuration — override via environment variables as needed
# ---------------------------------------------------------------------------

PIDFILE="${PIDFILE:-${HOME}/.local/run/ssh-socks-proxy.pid}"
LOGDIR="${LOGDIR:-${HOME}/.local/run}"
PROXY_PORT="${PROXY_PORT:-45454}"
SSH_BIN="${SSH_BIN:-/usr/bin/ssh}"
SSH_TARGET="${SSH_TARGET:-bc2}"

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

mkdir -p "${LOGDIR}"

cleanup() {
    if [[ -f "${PIDFILE}" ]] && [[ "$(<"${PIDFILE}")" = "$$" ]]; then
        rm -f "${PIDFILE}"
    fi
}

trap cleanup EXIT INT TERM HUP

# ---------------------------------------------------------------------------
# Single-instance guard
# ---------------------------------------------------------------------------

if [[ -f "${PIDFILE}" ]]; then
    OLD_PID="$(<"${PIDFILE}")"

    if [[ "${OLD_PID}" =~ '^[0-9]+$' ]] && kill -0 "${OLD_PID}" 2>/dev/null; then
        echo "Already running with PID ${OLD_PID}"
        exit 0
    fi

    rm -f "${PIDFILE}"
fi

echo "$$" >"${PIDFILE}"

# ---------------------------------------------------------------------------
# Start SSH SOCKS5 proxy
# ---------------------------------------------------------------------------

exec "${SSH_BIN}" \
    -N \
    -D "127.0.0.1:${PROXY_PORT}" \
    -o ExitOnForwardFailure=yes \
    -o ServerAliveInterval=30 \
    -o ServerAliveCountMax=3 \
    "${SSH_TARGET}"
