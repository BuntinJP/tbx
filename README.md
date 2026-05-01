# tbx

**install target:** `~/.tbx`

個人用コマンドツールボックス。AIエージェントと人間が協調して作業するためのワークフロースクリプト群。

---

## スクリプト一覧

| スクリプト | 説明 |
|---|---|
| [`comment.sh`](#commentsh) | `chat-memo.txt` にタイムスタンプ付きのコメントを追記する |
| [`tbx_rc.sh`](#tbx_rcsh) | `bin` の PATH と shell alias を読み込む run command |
| [`link-resetup.sh`](#link-resetupsh) | `scripts/*` から `bin/*` へのコマンドリンクを張り直す |
| [`scripts/chgh.ts`](#scriptschghts) | GitHub SSH key / `.gitconfig` 切り替えコマンド |
| [`scripts/trim-lines.ts`](#scriptstrim-linests) | stdin の各行を `trim()` して1行ずつ出力する |
| [`scripts/request-macos-automation-permissions.ts`](#scriptsrequest-macos-automation-permissionsts) | macOS の Automation / Accessibility 初回許可プロンプトを先に出す |
| `scripts/refresh-brew.zsh` | Homebrew の update / upgrade / cleanup / autoremove をまとめて実行する |
| `scripts/ssh-socks-proxy.sh` | SSH SOCKS5 proxy を単一インスタンスで起動する |
| `scripts/prevent-sleep.applescript` | `System Events` 経由で定期的に Space key を送る |
| `scripts/b2a.sh` | クリップボード内の URL encode 文字列を decode して戻す |
| `scripts/s2a.sh` | クリップボードの行を sort unique して戻す |
| `scripts/t2a.sh` | クリップボードを plain text として `pbcopy` に通し直す |
| `scripts/show-gpg-key-ids.sh` | GPG public key ID を一覧表示する |

---

## `comment.sh`

AIエージェント・人間を問わず、ステータス・命令・コメントを `chat-memo.txt` に投稿するスクリプト。

### 使い方

```sh
./comment.sh "comment content" [agent-name]
```

| 引数 | 必須 | 説明 |
|---|---|---|
| `$1` | ✅ | 投稿するコメント本文 |
| `$2` | ➖ | エージェント / 著者名（省略時: `system` または `COMMENT_AGENT`）|

### 環境変数

| 変数 | デフォルト | 説明 |
|---|---|---|
| `COMMENT_MEMO` | スクリプトと同階層の `chat-memo.txt` | 書き込み先ファイルパス |
| `COMMENT_AGENT` | `system` | `$2` 省略時のデフォルトエージェント名 |

### 実行例

```sh
# 基本
./comment.sh "Build succeeded."

# エージェント名を指定（実行主体ごとに変えてよい）
./comment.sh "Starting: alias cleanup." "codex"
./comment.sh "Reviewing PR #42." "claude"
./comment.sh "Checking shell behavior." "gemini"
./comment.sh "Done: manual confirmation." "user"

# 環境変数で上書き
COMMENT_AGENT="ci" ./comment.sh "All tests passed."
COMMENT_MEMO="/tmp/debug.txt" ./comment.sh "Debug entry." "dev"
```

### 出力フォーマット (`chat-memo.txt`)

```
────────────────────────────────────────────────────────────
[2026-04-26T18:00:00+0900]  @reviewer

Reviewing PR #42.
```

---

## `tbx_rc.sh`

`rc` は run command の意味。`~/.tbx/bin` を `PATH` に追加し、個人用 alias を読み込む。

### 読み込み

```sh
. ~/.tbx/tbx_rc.sh
```

### 有効化される内容

| 項目 | 説明 |
|---|---|
| `PATH` | `~/.tbx/bin` を先頭に追加 |
| `sshls` | `badcompany-tokyo/sshls` を Deno 経由で実行 |
| `tree` | `.DS_Store` / `.git` / `node_modules` / `vendor/bundle` を除外して表示 |
| `rmdsstore` | カレントディレクトリ以下の `.DS_Store` を削除 |

---

## `link-resetup.sh`

`scripts/*` を `bin/*` へ symlink する管理スクリプト。新しいコマンドを追加するときは、`scripts/<name>.<ext>` を作ってから `link-resetup.sh` に `link_command "<name>" "scripts/<name>.<ext>"` を追加する。

```sh
bun run link:resetup
```

現在有効なリンク:

| command | link |
|---|---|
| `b2a` | `bin/b2a -> ../scripts/b2a.sh` |
| `chgh` | `bin/chgh -> ../scripts/chgh.ts` |
| `prevent-sleep` | `bin/prevent-sleep -> ../scripts/prevent-sleep.applescript` |
| `refresh-brew` | `bin/refresh-brew -> ../scripts/refresh-brew.zsh` |
| `request-macos-automation-permissions` | `bin/request-macos-automation-permissions -> ../scripts/request-macos-automation-permissions.ts` |
| `s2a` | `bin/s2a -> ../scripts/s2a.sh` |
| `show-gpg-key-ids` | `bin/show-gpg-key-ids -> ../scripts/show-gpg-key-ids.sh` |
| `ssh-socks-proxy` | `bin/ssh-socks-proxy -> ../scripts/ssh-socks-proxy.sh` |
| `t2a` | `bin/t2a -> ../scripts/t2a.sh` |
| `trim-lines` | `bin/trim-lines -> ../scripts/trim-lines.ts` |

---

## `scripts/chgh.ts`

`configs/chgh.json` をもとに、GitHub 用 SSH key と `~/.gitconfig` symlink を切り替える Bun TypeScript コマンド。

初回はサンプルをコピーして編集する。

```sh
cp ~/.tbx/configs/chgh.json.sample ~/.tbx/configs/chgh.json
```

基本操作:

```sh
chgh --help
chgh --info
chgh
chgh --no
chgh --dry-run
```

---

## `scripts/trim-lines.ts`

stdin の複数行文字列を読み、各行を `trim()` して newline-separated な出力に戻す。

```sh
printf ' foo  \n bar  \n' | trim-lines
printf ' foo  \n\n bar  \n' | trim-lines --drop-empty
printf ' foo  \n bar  \n' | trim-lines --json
```

---

## `scripts/request-macos-automation-permissions.ts`

新しいターミナルアプリや workflow 実行環境から `osascript` を使う前に、macOS の初回許可プロンプトをまとめて出すための補助コマンド。

```sh
request-macos-automation-permissions
request-macos-automation-permissions --include-key-event
```

macOS の権限はスクリプトから無断付与できないため、このコマンドは `Finder` / `System Events` / `Terminal` / `Shortcuts Events` への無害な AppleScript probe を実行し、必要な許可ダイアログを先に表示する。

---

## ファイル構成

```
~/.tbx/
├── bin/                     # scripts/* への symlink 置き場
│   ├── chgh -> ../scripts/chgh.ts
│   └── ...
├── configs/
│   └── chgh.json.sample     # chgh 設定例
├── scripts/
│   ├── chgh.ts              # Bun TypeScript コマンド
│   └── ...
├── comment.sh               # コメント投稿スクリプト
├── link-resetup.sh          # bin リンク再構築
├── tbx_rc.sh                # PATH / alias 読み込み
├── chat-memo.txt            # コメントログファイル（自動生成）
├── package.json             # Bun / Node / TypeScript 設定
├── tsconfig.json            # TypeScript 6 strict 設定
├── README.md                # このファイル
└── AGENTS.md                # AIエージェント向け指示書
```

---

## セットアップ

```sh
git clone <repo> ~/.tbx
chmod +x ~/.tbx/*.sh
bun install
bun run link:resetup

# PATH と alias を読み込む
echo '. ~/.tbx/tbx_rc.sh' >> ~/.zshrc
```
