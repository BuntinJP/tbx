# tbx

**install target:** `~/.tbx`

個人用コマンドツールボックス。AIエージェントと人間が協調して作業するためのワークフロースクリプト群。

---

## スクリプト一覧

| スクリプト | 説明 |
|---|---|
| [`comment.sh`](#commentsh) | `chat-memo.txt` にタイムスタンプ付きのコメントを追記する |
| [`tbx_rc.sh`](#tbx_rcsh) | `bin` の PATH と shell alias を読み込む run command |
| [`link-resetup.sh`](#link-resetupsh) | `scripts/*.ts` から `bin/*` へのコマンドリンクを張り直す |
| [`scripts/chgh.ts`](#scriptschghts) | GitHub SSH key / `.gitconfig` 切り替えコマンド |

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

`scripts/*.ts` を `bin/*` へ symlink する管理スクリプト。新しい TypeScript コマンドを追加するときは、`scripts/<name>.ts` を作ってから `link-resetup.sh` に `link_ts "<name>" "scripts/<name>.ts"` を追加する。

```sh
bun run link:resetup
```

現在有効なリンク:

| command | link |
|---|---|
| `chgh` | `bin/chgh -> ../scripts/chgh.ts` |

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

## ファイル構成

```
~/.tbx/
├── bin/                     # scripts/*.ts への symlink 置き場
│   └── chgh -> ../scripts/chgh.ts
├── configs/
│   └── chgh.json.sample     # chgh 設定例
├── scripts/
│   └── chgh.ts              # Bun TypeScript コマンド
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
