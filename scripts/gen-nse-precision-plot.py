#!/usr/bin/env python3
"""Rebuild the minute-level stock prediction figure from the raw NSE tick data.

The notebook behind this project (trade_quote internship/NSE_trade_quote.ipynb)
never plotted anything — it printed a threshold sweep — so there was no figure to
extract the way reel/extract_plots.py extracts the others. This reproduces the
notebook's pipeline and draws the one chart that states the project's claim:
precision against the decision threshold, with the base rate as the floor.

The site's headline is "precision from 0.51 to 0.61". 0.51 is the base rate — the
precision of predicting "up" every minute — and 0.61 is precision once the model is
only allowed to trade above a probability threshold. Plotting one without the other
is the misleading version, so the trade count rides on a second axis: raising the
threshold raises precision by trading less, and the reader should see that cost.

    python3 scripts/gen-nse-precision-plot.py

Writes reel/plots/nse-precision-threshold.png, which gen-project-plates.py then
composes onto the square card plate.
"""

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import precision_score

ROOT = Path(__file__).resolve().parent.parent
DATA = Path("/home/vishnu/projects/trade_quote internship")
OUT = ROOT / "reel" / "plots" / "nse-precision-threshold.png"

TEST_MINUTES = 100          # last N minutes per company held out, as in the notebook
ROLLING = [3, 5, 10, 20]
SEED = 42
MIN_TRADES = 50            # below this a precision figure is noise, not signal
THRESHOLDS = np.round(np.arange(0.50, 0.761, 0.01), 2)

# Palette lifted from the other figures in the set so the cards read as one family.
PAPER = "#fafaf9"
INK = "#222222"
MUTED = "#6b6b6b"
BLUE = "#4285f4"
ORANGE = "#ef6c33"
GREY = "#b0b0b0"


def load_minutes():
    """Trades and quotes -> one row per (company, minute), the notebook's features."""
    print("loading trades ...", flush=True)
    trades = pd.read_csv(
        DATA / "combined_trades.csv",
        usecols=["date", "time", "price", "volume", "company"],
        dtype={"price": "float32", "volume": "float32", "company": "category"},
    )
    # Minute bucket by string slice rather than to_datetime: the timestamps are a
    # fixed "HH:MM:SS.mmm" and parsing 9.4M of them costs minutes for no benefit.
    trades["minute"] = (trades["date"] + " " + trades["time"].str[:5]).astype("category")
    trades.drop(columns=["date", "time"], inplace=True)

    trades["pv"] = trades["price"] * trades["volume"]
    g = trades.groupby(["company", "minute"], observed=True)
    agg_t = g.agg(
        o=("price", "first"),
        h=("price", "max"),
        l=("price", "min"),
        c=("price", "last"),
        total_volume=("volume", "sum"),
        num_trades=("price", "count"),
        pv=("pv", "sum"),
    ).reset_index()
    agg_t["weighted_price"] = agg_t["pv"] / agg_t["total_volume"]
    agg_t.drop(columns=["pv"], inplace=True)
    del trades

    print("loading quotes ...", flush=True)
    quotes = pd.read_csv(
        DATA / "combined_quotes.csv",
        usecols=["date", "time", "bid_price", "bid_size", "ask_price", "ask_size", "company"],
        dtype={
            "bid_price": "float32", "bid_size": "float32",
            "ask_price": "float32", "ask_size": "float32",
            "company": "category",
        },
    )
    quotes["minute"] = (quotes["date"] + " " + quotes["time"].str[:5]).astype("category")
    quotes.drop(columns=["date", "time"], inplace=True)
    quotes["spread"] = quotes["ask_price"] - quotes["bid_price"]

    quotes["bpv"] = quotes["bid_price"] * quotes["bid_size"]
    quotes["apv"] = quotes["ask_price"] * quotes["ask_size"]
    agg_q = quotes.groupby(["company", "minute"], observed=True).agg(
        avg_spread=("spread", "mean"),
        max_spread=("spread", "max"),
        min_spread=("spread", "min"),
        total_bid_size=("bid_size", "sum"),
        total_ask_size=("ask_size", "sum"),
        bpv=("bpv", "sum"),
        apv=("apv", "sum"),
    ).reset_index()
    # Size-weighted quote prices, as in the notebook's final cell (0 when no size).
    agg_q["weighted_avg_bid_price"] = np.where(
        agg_q["total_bid_size"] > 0, agg_q["bpv"] / agg_q["total_bid_size"], 0)
    agg_q["weighted_avg_ask_price"] = np.where(
        agg_q["total_ask_size"] > 0, agg_q["apv"] / agg_q["total_ask_size"], 0)
    agg_q.drop(columns=["bpv", "apv"], inplace=True)
    del quotes

    m = pd.merge(agg_t, agg_q, on=["company", "minute"], how="inner")
    m["minute"] = m["minute"].astype(str)
    return m.sort_values(["company", "minute"]).reset_index(drop=True)


def build_features(m):
    for w in ROLLING:
        for col in ("c", "total_volume"):
            grp = m.groupby("company", observed=True)[col]
            m[f"rolling_mean_{col}_{w}"] = grp.transform(lambda x: x.rolling(w, min_periods=1).mean())
            m[f"rolling_std_{col}_{w}"] = grp.transform(lambda x: x.rolling(w, min_periods=1).std().fillna(0))

    # Target: did the close rise in the NEXT minute. shift(-1) inside the company
    # group, so the last minute of each company has no label and is dropped.
    m["future_c"] = m.groupby("company", observed=True)["c"].shift(-1)
    m["target"] = (m["future_c"] > m["c"]).astype(int)
    m = m.dropna(subset=["future_c"]).reset_index(drop=True)

    # Exactly the feature list from the notebook's final cell.
    features = [c for c in m.columns if c.startswith("rolling_")] + [
        "o", "h", "l", "c", "avg_spread", "max_spread", "min_spread",
        "total_bid_size", "total_ask_size",
        "weighted_avg_bid_price", "weighted_avg_ask_price",
    ]
    return m, features


def sweep(m, features):
    """Train on all but the last TEST_MINUTES per company, sweep the threshold."""
    g = m.groupby("company", observed=True)
    train = g.apply(lambda x: x.iloc[:-TEST_MINUTES], include_groups=False).reset_index(drop=True)
    test = g.apply(lambda x: x.iloc[-TEST_MINUTES:], include_groups=False).reset_index(drop=True)
    print(f"train {len(train):,} rows / test {len(test):,} rows / {len(features)} features", flush=True)

    model = RandomForestClassifier(n_estimators=100, random_state=SEED, n_jobs=-1)
    model.fit(train[features], train["target"])
    probs = model.predict_proba(test[features])[:, 1]

    y = test["target"].to_numpy()
    base = y.mean()   # precision of "always predict up" — the honest floor
    rows = []
    for t in THRESHOLDS:
        preds = (probs > t).astype(int)
        n = int(preds.sum())
        rows.append((t, precision_score(y, preds, zero_division=0) if n else np.nan, n))
    return base, rows, len(train), len(test)


def draw(base, rows, n_train, n_test, n_ticks):
    ts = [r[0] for r in rows]
    prec = [r[1] for r in rows]
    trades = [r[2] for r in rows]

    # Callout only where enough trades were taken for the number to mean anything.
    # Past that the precision swings between 0 and 1 on a handful of trades, which is
    # sampling noise, not skill — that region is shaded rather than quietly cropped.
    best = max((r for r in rows if r[2] >= MIN_TRADES), key=lambda r: r[1])
    thin = [r[0] for r in rows if r[2] < MIN_TRADES]

    fig, ax = plt.subplots(figsize=(16, 10), dpi=100)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)

    if thin:
        ax.axvspan(min(thin), max(ts), color="#ececeb", zorder=0)
        ax.annotate(
            f"Fewer than {MIN_TRADES} trades\n— too thin to read",
            xy=(min(thin), 0.02), xytext=(6, 0), textcoords="offset points",
            color="#9a9a9a", fontsize=12, va="bottom",
        )

    ax.axhline(base, color=GREY, lw=2, zorder=1)
    ax.annotate(
        f"Base rate {base:.2f} — precision of predicting “up” every minute",
        # Below the line: the precision curve runs just above the base rate at the
        # left-hand thresholds, so a label above it collides with the series.
        xy=(ts[0], base), xytext=(0, -9), textcoords="offset points",
        color=MUTED, fontsize=13, va="top",
    )

    ax.plot(ts, prec, color=BLUE, lw=3, zorder=3, label="Precision at threshold")
    ax.scatter([best[0]], [best[1]], s=110, color=BLUE, zorder=4)
    ax.annotate(
        f"{best[1]:.2f} at {best[0]:.2f}\n{best[2]} trades taken",
        xy=(best[0], best[1]), xytext=(10, -34), textcoords="offset points",
        color=INK, fontsize=13,
    )

    ax2 = ax.twinx()
    ax2.plot(ts, trades, color=ORANGE, lw=2.5, ls="--", zorder=2, label="Trades taken")
    ax2.set_ylabel("Minutes the model chose to trade", fontsize=14, color=MUTED)
    ax2.tick_params(colors=MUTED, labelsize=12)
    ax2.set_ylim(bottom=0)
    for s in ax2.spines.values():
        s.set_visible(False)

    ax.set_xlabel("Probability threshold required before taking the trade", fontsize=15)
    ax.set_ylabel("Precision (share of taken trades that rose)", fontsize=15)
    ax.tick_params(labelsize=12, colors="#444444")
    ax.grid(axis="y", color="#e2e2e0", lw=1)
    ax.set_axisbelow(True)
    for side in ("top", "right"):
        ax.spines[side].set_visible(False)
    for side in ("left", "bottom"):
        ax.spines[side].set_color("#cfcfcd")

    fig.text(0.055, 0.955, "Precision rises with the threshold, and the trade count pays for it",
             fontsize=23, color=INK, va="top")
    fig.text(0.055, 0.905,
             "Random forest on minute bars; raising the bar buys accuracy by trading less often",
             fontsize=15, color=MUTED, va="top")

    h1, l1 = ax.get_legend_handles_labels()
    h2, l2 = ax2.get_legend_handles_labels()
    ax.legend(h1 + h2, l1 + l2, loc="upper left", bbox_to_anchor=(0, 1.06),
              frameon=False, ncol=2, fontsize=14)

    fig.text(0.055, 0.028,
             f"Source: NSE trade & quote tapes, 2024-04-01 — {n_ticks:,} ticks → "
             f"{n_train:,} training minutes, {n_test:,} held-out minutes",
             fontsize=13, color="#8d8d8d")

    fig.subplots_adjust(left=0.075, right=0.925, top=0.80, bottom=0.11)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(OUT, facecolor=PAPER)
    print(f"wrote {OUT.relative_to(ROOT)}")


def main():
    if not (DATA / "combined_trades.csv").exists():
        sys.exit(f"missing tick data under {DATA}")
    m = load_minutes()
    n_ticks = 2933072 + 6449315   # header-excluded line counts of the two tapes
    m, features = build_features(m)
    base, rows, n_train, n_test = sweep(m, features)
    for t, p, n in rows:
        print(f"  threshold {t:.2f}  precision {p:.4f}  trades {n}")
    draw(base, rows, n_train, n_test, n_ticks)


if __name__ == "__main__":
    main()
