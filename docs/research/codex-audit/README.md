# codex-audit 運用

`docs/research/codex-audit/` は改善監査の成果物を日付単位で保存するディレクトリです。

## ディレクトリ構成

- `_template/`  
  監査ファイルのテンプレート
- `scripts/`  
  日付フォルダと初期ファイルを作る補助スクリプト
- `YYYY-MM-DD/`  
  監査実体（1回分）

## クイックスタート

1. 日付フォルダを作成

```powershell
& .\docs\research\codex-audit\scripts\new-audit.ps1
```

2. 特定日を指定して作成

```powershell
& .\docs\research\codex-audit\scripts\new-audit.ps1 -Date 2026-02-06
```

3. 生成されるファイル

- `README.md`
- `YYYY-MM-DD_summary.md`
- `YYYY-MM-DD_risks.md`
- `YYYY-MM-DD_plan-10.md`
- `YYYY-MM-DD_appendix.md`
- `improvement-tracker.md`

## 更新ルール

- 既存日付フォルダを上書きせず、日付単位で新規作成する。
- 監査観点の追加・変更があれば `_template/` と `.agent/skills/codex-audit/SKILL.md` を同時更新する。
