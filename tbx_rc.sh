#!/bin/sh
# Source this file from shell rc files:
#   . ~/.tbx/tbx_rc.sh
#

TBX_HOME="${TBX_HOME:-${HOME}/.tbx}"
TBX_BIN="${TBX_HOME}/bin"

case ":${PATH}:" in
*":${TBX_BIN}:"*) ;;
*) export PATH="${TBX_BIN}:${PATH}" ;;
esac

# sshls
# https://github.com/badcompany-tokyo/sshls
alias sshls='deno run -RE https://raw.githubusercontent.com/badcompany-tokyo/sshls/refs/heads/main/src/main.ts'

# tree
alias tree='tree -a -I "\.DS_Store|\.git|node_modules|vendor\/bundle" -N'
