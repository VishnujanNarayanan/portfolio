# Blog writing playbook

Derived from reading ~20 danluu.com posts (pl-tokens, slow-device, cgroup-throttling,
cache-incidents, latency-pitfalls, metrics-analytics, tracing-analytics, deconstruct-files,
file-consistency, simple-architectures, essential-complexity, everything-is-broken, wat,
writing-non-advice, why-benchmark, corp-eng-blogs, postmortem-lessons, sounds-easy, in-house).

Not "write like Dan Luu." The point is to steal the *mechanics* that make those posts read as
a person who did the work, and apply them to ingestion reliability / market data.

---

## 1. What makes a post worth writing

Dan's own filter, from `why-benchmark`: measurement is undervalued, therefore high-ROI
measurement projects are easy to find. Restated as a test:

> After reading, does the reader have a **number**, a **failure mode**, or a **technique**
> they did not have before?

If the answer is "they have my opinion," don't publish it.

Every good post in the sample is one of five shapes:

| # | Shape | Examples | Why it works |
|---|-------|----------|--------------|
| 1 | **Measure what everyone argues about but nobody measured** | keyboard-latency, slow-device, pl-tokens | The number did not exist before you |
| 2 | **Incident / bug archaeology** | cache-incidents, everything-is-broken, postmortem-lessons | Knowledge decays fast; you're preserving it |
| 3 | **Widely-held belief + disconfirming data** | essential-complexity, keyboard-v-mouse, pl-tokens | Requires quoting the claim verbatim, then refuting |
| 4 | **Cheap tool, outsized payoff** | metrics-analytics, tracing-analytics | Reader thinks "I could build that Monday" |
| 5 | **Defense of the boring choice, with receipts** | simple-architectures, boring-languages, in-house | Contrarian *and* evidenced |

What is never in the sample: tutorials for things already documented, "10 tips", framework
comparisons without data, "my journey learning X", opinion without a measurement behind it.

**On problems nobody cares about:** the tell is whether a real person said the wrong thing out
loud. `pl-tokens` opens by quoting Google's AI summary. `deconstruct-files` opens by quoting the
top two r/programming comments. `essential-complexity` quotes Brooks. `in-house` opens with
"Twitter has a kernel team!?" — a thing people actually said to him. If you can't point at
someone believing the wrong thing, or at a number nobody has, the post has no reason to exist.

---

## 2. Openings

Zero throat-clearing in 20 posts. No "in today's fast-paced world", no "in this post we will
explore". Four opening moves, all usable:

1. **Result first.** — "We spent one day building a system that immediately found a mid 7 figure
   optimization (which ended up shipping)."
2. **Absurd concrete framing.** — "Wave is a $1.7B company with 70 engineers whose product is a
   CRUD app that adds and subtracts numbers."
3. **Quote the wrong claim, announce you're checking it.** — pl-tokens.
4. **Provenance note in italics.** — "*This is an excerpt from an internal document David Mackey
   and I co-authored in April 2019.*" Tells the reader what they're getting and buys forgiveness
   for rough edges.

The first sentence always contains a number, a name, or a quote. Never a definition.

---

## 3. Structure

- Body stays readable; **the mess goes in appendices.** pl-tokens has six. `metrics-analytics`
  has "Appendix: stuff I screwed up". This is the single most copyable structural trick — it lets
  you be rigorous without making the main line unreadable.
- Headings are plain descriptions of content ("Sampling", "Time", "Hardware", "Humans"), never
  clever.
- **No summary conclusion.** Posts end on the last real point, an open question, a caveat, or the
  acknowledgements. `pl-tokens`'s conclusion section is literally: "What does it all mean? / Who
  knows?"
- Heavy cross-linking to his own earlier posts, so the blog reads as one continuous argument
  rather than 100 standalone essays. Worth doing from post #2 onward.
- Ends with: "Thanks to [names] for comments/corrections/discussion."

---

## 4. Voice — the specific things that read as human

1. **Calibrated hedges, not vague ones.** "AFAIK", "at least partially attributed to", "seems
   plausible to me", "I'd guess", "maybe at best vaguely directionally true". He hedges the
   *strength* of a claim while the claim itself stays specific. Vague writing hedges the claim.
2. **Pre-register, then grade yourself in public.** pl-tokens states three predictions with
   confidence percentages *before* the results, then marks one of his own "incorrect".
3. **Publish your own screwups.** metrics-analytics: "I think I've probably signed up for roughly
   double the amount of direct work on this system... for essentially no benefit." He maintains a
   whole `/corrections` page.
4. **State where you stopped and why.** "I wanted this to be more of a 'quick toy project' level
   of correctness than a 'Gary Bernhardt' level of correctness, so I stopped after fixing a
   handful of issues." Admitting the ceiling is more credible than pretending there isn't one.
5. **Ambivalence survives editing.** He does not resolve into a clean takeaway when the data
   doesn't support one.
6. **Rhythm.** Long, run-on sentences with nested parentheticals sitting next to three-word
   sentences. "Who knows?" LLM-flat prose has uniform sentence length — that's the tell.
7. **Name real people**, both collaborators and people he disagrees with.
8. **Anticipate the objection inline, in parens, then keep moving** — rather than a "But some
   might say..." section.
9. **Quantify everything available.** Not "much slower" but "16ms at the server and ~240ms at the
   client, a factor of 15". Not "a lot of bugs" but "6 SEV-0s and 6 SEV-1s... along with 38 less
   severe incidents".
10. **Anecdotes are evidence, not decoration.** Each one isolates a specific mechanism and is
    followed by the generalization it supports.

### The AI tell — cut these on sight

Flagged 2026-08-10. The single strongest signal that prose was generated is the **rhetorical
flourish at the end of a paragraph**. Dan almost never does this; he ends paragraphs on a fact.

| Cut | Why | Replace with |
|-----|-----|--------------|
| Aphoristic metaphor as a closer — "the date of the cure and nothing about the date of the disease" | Written to be quoted, carries no information | The plain fact: "nothing records when a bug started, only when I fixed it" |
| Balanced antithesis — "safe in the narrow sense and useless in the broad one" | The symmetry is doing the work, not the content | "The lock stopped two threads writing at the same instant, which is not the same as making this correct" |
| Neat reversals — "the gap-repair mechanism was what made the gap permanent" | Too tidy to be observed | State the mechanism, drop the irony |
| Recycled metaphors — "wearing different clothes", "sharp edge" | Reads as filler once repeated | "are really the same bug" |

Test: read the last sentence of each paragraph on its own. If it sounds like a pull quote,
rewrite it as a statement of fact. The plain version is almost always shorter and says more,
because the space goes to a detail (a number, a flag name, a cap) instead of the rhythm.

### External links

Dan links constantly, mid-sentence, to primary sources — papers, docs, repos, and his own
earlier posts. Links do real work here: they let you make a claim ("`validate="one_to_one"`
would have caught this") without explaining the whole API, and they're the main way a post
signals it was written by someone who reads. Prefer primary sources (the actual OSDI paper,
the actual pandas doc page) over listicles about them.

---

## 5. Application to this blog (ingestion reliability / market data)

Constraint: CiteSert is private. Dan's workaround is standard and legitimate — publish from
internal work with names anonymized ("with the actual service names anonymized per a comms
request"), or describe the mechanism and the numbers without the source's identity. Aggregate
numbers, failure taxonomies, and techniques are publishable; scraped data and source identities
may not be.

### Candidate posts by shape

**Shape 1 — measure what nobody measured** (highest value, flagship material)
- How often does a market data source silently rewrite history? Re-pull the same date range on a
  schedule for N weeks, diff every rerun, report the rate and the shape of the changes.
- How much do two sources disagree on corporate-action-adjusted price series, and which one is
  wrong?
- How stale is "real-time"? Measured end-to-end, source timestamp → row committed.

**Shape 2 — incident archaeology**
- A year of ingestion failures across 28 pipelines, categorized by root cause. Directly the
  `cache-incidents` shape. Probably the single best fit for the existing body of work.
- Every way a 20-year insider-filings backfill broke: format drift, encoding, renamed entities,
  restated filings.

**Shape 3 — belief + disconfirming data**
- "Idempotent" pipelines still produce non-reproducible datasets, and here's the measured rate.
- What "just add a retry" actually costs when the source is rate-limiting you.

**Shape 4 — cheap tool, outsized payoff**
- A rerun-diff harness built in a day, and the bugs it found in week one. Needs the bug list with
  real specifics.

**Shape 5 — boring choice defense**
- Whatever the actual stack is (Postgres + cron + a queue?) running 28 pipelines, with the cost
  and reliability numbers to back it.

### Rules for this blog specifically
- Never use the ~1,665 ticker figure (see memory `no-1665-ticker-count`). Prefer 28 pipelines,
  20 years of filings, 9.4M ticks, 6.4M transactions.
- Every post must carry at least one number that came from a measurement, not from a README.
- The recruiter reading this should conclude "this person has operated data pipelines and knows
  where they break" — which happens automatically if the posts are shapes 1, 2, or 4, and not at
  all if they're tutorials.

---

## 6. Post mechanics — rules set while writing the ingestion-bugs post

### Never explain how the post was made

Cut anything describing the *process* of assembling the piece: "I grepped my commit log
for fix-shaped messages," "I went back through a year of history," "the format is lifted
from X." Two reasons:

1. It reads as machine-assembled even when it isn't, which is the exact signal we're
   trying to avoid.
2. The reader does not need it. State the finding. "Over the last year I fixed about 30
   bugs across 32 scripts" stands on its own; how the 30 was counted belongs in a caveats
   section as *limitations of the number*, never as *the procedure I ran*.

The distinction that keeps this honest: **caveats about the number are good, provenance of
the method is not.** "This counts bugs I found, and the whole argument is that a class of
bug produces no signal" is a real limitation and stays. "I grepped for commits matching
fix|bug|broke" is method disclosure and goes.

### No style attribution

Do not credit or link the blog whose structure was studied, and do not describe the post as
following anyone's format. Absorbing a structure is normal writing practice; announcing it
makes the piece read as an exercise rather than a report. Links to a source's *content*
(a paper, an analysis, a doc page) are fine and encouraged — links that say "I copied this
person's format" are not.

### One heading per category, and explain all of them

An early draft listed five failure categories, then wrote up one of them in depth and
lumped the rest into "the loud twenty-two." That is a broken promise: the reader was given
a taxonomy and then handed one branch of it.

- Every category named in the classification gets its own `<h2>`, with the count in the
  heading: `2. The source fighting back — 9 bugs`.
- Individual incidents inside a category get an `<h3>`.
- It is fine for a category to be three sentences ending in "these are the bugs you fix once
  and stop thinking about." Short is not the same as skipped. Say plainly which category is
  the interesting one so the reader knows where to spend attention.

### Code examples

Include one wherever the bug *is* the code and prose has to work hard to describe it. The
format that carries the most information per line is **before/after in one block**, with the
comment doing the explaining:

```python
# Before: any row can become the resume point, including one
# that carries a date and no prices at all.
start = pd.read_csv(path)["Date"].max()

# After: only rows that actually carry a price count.
df = pd.read_csv(path)
start = df[df["Close"].notna()]["Date"].max()
```

Keep them under ~12 lines, real (paste from the actual fix, don't invent a cleaner version),
and never include a block that only restates the sentence above it. Three per post is plenty.

### Images and charts

Add one only when it shows something the prose can't. A distribution across categories
qualifies; a decorative header image does not. Rules:

- **Inline SVG**, not a raster file — it stays sharp, needs no build step, costs no request,
  and can use the site's own colour tokens.
- Load the `dataviz` skill before writing chart markup.
- Single series → **one hue** (`--color-highlight` #3932DC, validated against the #fcfcfc
  surface), direct value labels at the bar ends, no legend, recessive 1px axis.
- Always `role="img"` with a full `aria-label` naming every value, plus a `<figcaption>`
  that says what the reader should take from it.
- The numbers must also appear in the body text — the chart is a second view of the data,
  never the only one.

### Page furniture

Handled by CSS, but worth knowing when drafting:

- Posts wrap in `.post-shell` (a 1180px grid) with a sticky `.post-nav` rail on the left
  listing every post and marking the current one. Adding a post means adding a line to that
  rail **in all four files** — there is no template yet, which is the main argument for
  building the markdown generator.
- Article column is ~860px. Long `<pre>` blocks scroll inside the article rather than
  widening the page.
- Sub-pages hide the centred VJ mark and sit on `--color-bg`.
