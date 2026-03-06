# Quant Lab Documentation

## Overview
Quant Lab adds a reproducible workflow for student quant research:
- Data Hub with versioned datasets and metadata
- Deterministic backtesting sandbox
- Educational notebooks
- Community sharing board with required transparency fields

Route: `/quant-lab`

## Architecture
- Frontend page: `src/pages/QuantLab.tsx`
- Backtesting engine: `src/lib/quant/backtester.ts`
- Types: `src/lib/quant/types.ts`
- Static dataset catalog: `public/quant-lab/datasets/catalog.json`
- Notebooks: `public/quant-lab/notebooks/*.ipynb`

## Data Hub
Catalog format (`public/quant-lab/datasets/catalog.json`):
- `id`, `name`, `assetClass`, `frequency`, `description`, `tags`
- `versions[]` with:
  - `version`
  - `lastUpdated`
  - `source`
  - `preprocessingSteps[]`
  - `missingValuesHandled`
  - `schema`
  - `rowCount`
  - `apiPath`
  - `downloads.csv` and `downloads.json`

### Add a New Dataset
1. Create dataset directory:
   - `public/quant-lab/datasets/<dataset_id>/v1/`
2. Add files:
   - `data.csv`
   - `data.json`
3. Ensure schema is:
   - `date,open,high,low,close,volume`
4. Append dataset metadata and version entry in `catalog.json`.
5. Validate in browser:
   - `/<base>/quant-lab/datasets/<dataset_id>/v1/data.json`
   - `/<base>/quant-lab/datasets/<dataset_id>/v1/data.csv`

## Backtesting Sandbox
Engine behavior:
- Deterministic execution over sorted historical bars
- Numeric controls only (no arbitrary code execution)
- Strategy controls:
  - entry/exit thresholds
  - lookback window
  - position size
  - stop-loss and take-profit

Metrics produced:
- Cumulative return
- Max drawdown
- Volatility (annualized)
- Sharpe ratio

Reproducibility:
- Run ID derived from config + dataset/version + date bounds
- Same inputs produce the same Run ID and metrics

## Tutorials / Notebooks
Provided examples:
- `01_loading_datasets.ipynb`
- `02_cleaning_preprocessing.ipynb`
- `03_strategy_and_metrics.ipynb`

Each notebook explains:
- Dataset loading
- Cleaning and preprocessing
- Strategy execution
- Metrics calculation

## Community Collaboration
Current implementation:
- Local browser persistence (`localStorage` key: `quant_lab_community_v1`)
- Users can share dataset/strategy/result posts
- Posts require preprocessing notes and metrics
- Comment threads are available per post

To make collaboration multi-user:
1. Add Supabase tables for posts/comments
2. Apply RLS policies for read/write controls
3. Replace localStorage actions with Supabase CRUD calls

## Performance Notes
- Preview table renders first 20 rows by default
- Backtesting runs in-memory with lightweight loops
- Charts use efficient line rendering without point markers
- Static datasets are CDN-cacheable under `public/quant-lab`

## Safety Notes
- No `eval` or dynamic code execution
- Inputs are clamped and sanitized before simulation
- Backtest engine only processes predefined numeric config
