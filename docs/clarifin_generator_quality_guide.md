# Clarifin Generator Quality Guide

This guide is the internal reference for future Clarifin node generation. It is based on the Iran/Hormuz goldstandard training case, not on existing production nodes.

## Core Rule

Start with the economic mechanism, not the headline.

Clarifin nodes should follow this chain:

`event -> economic channel -> market effect -> sector or asset impact`

A headline is only the trigger. The generator must identify why the event matters economically before choosing assets, exposures, scenarios, or missing data.

## App Node Layers

### Direct Impact

Use Direct Impact only for compact, app-facing assets with a strong and specific causal channel.

Good direct candidates:
- Concrete commodities or proxies when the event directly changes supply, demand, risk premium, or inventory expectations.
- Rates, bonds, currencies, or broad equity indexes when the macro channel is direct.
- Individual stocks only when the company or sector channel is concrete enough for a retail investor to understand quickly.

Bad direct candidates:
- Sector ETFs such as XLE, XLI, XLY, XLB, XLK, XLRE, XLU. These belong under Exposures as sector proxy tickers.
- Generic sectors such as Energy, Defense, Consumer, Technology.
- Weak second-order names such as Ferrari, luxury, cybersecurity, semiconductors, Visa, or Mastercard unless the event has verified company-specific evidence.
- Long lists of peers when one representative asset would explain the channel.

### Indirect Impact

Use Indirect Impact for plausible second-order assets or companies where the mechanism exists but the evidence is weaker, delayed, or conditional.

Examples:
- Luxury and high-end autos may be indirect when travel sentiment or regional wealth effects improve.
- Visa and Mastercard may be indirect when cross-border travel and card volumes could improve, but no payments data is verified.
- Cybersecurity names may be indirect when cyber escalation probability changes, unless a verified cyber incident or budget response exists.
- Semiconductors may be indirect when a geopolitical event could affect logistics or foundry inputs, unless a concrete supply-chain disruption is verified.

### Conditional Watchlist

Use the watchlist for assets that could become direct if a missing condition is confirmed.

Examples:
- Cybersecurity only upgrades if cyber escalation, a breach, incident-response demand, or security-budget acceleration is verified.
- ASML/TSMC/Nvidia only upgrade if foundry, export-control, logistics, customer capex, or company-specific evidence is present.
- Luxury only upgrades if there is verified demand, travel-retail, margin, order-book, or regional consumer evidence.

### Exposures

Exposures are sectors, themes, economic areas, or industry groups. They are not concrete Direct Impact assets.

Good exposure titles:
- Oil Risk Premium Unwind
- Tankers & Marine Insurance
- Airlines & Travel Fuel-Cost Relief
- Defense Premium Unwind
- Rate-Sensitive Assets
- Europe Energy Import Relief
- Cybersecurity Watchlist
- Growth Equity Duration Pressure

Bad exposure titles:
- Regional Security Dynamics
- Governance
- Policy
- Market Impact
- Sector
- Demand
- Consumer Spending
- Regional Dynamics
- Economy
- Business
- Geopolitics

If a generic label appears, rewrite it into the economic mechanism or reject it.

## Missing Data

Missing Data is mandatory when uncertainty matters.

Add Missing Data when:
- The event is reported but not independently confirmed.
- The causal channel depends on market follow-through.
- Direct evidence is missing for a company, sector, route, price, spread, inventory, or policy response.
- The model wants to include an asset but the channel is conditional.

For Iran/Hormuz de-escalation, Missing Data should include items such as:
- Whether the ceasefire holds.
- Whether Gulf and Strait of Hormuz shipping normalizes.
- Whether war-risk insurance premia and tanker rates fall.
- Whether Brent/WTI, gold, yields, and broad equities confirm the risk-premium unwind.
- Whether proxy fronts, sanctions risk, or cyber risk re-escalate.

## Iran/Hormuz De-Escalation Pattern

Treat credible U.S.-Iran or Middle East de-escalation as an inverse risk-premium event.

Automatically consider these channels:
- Oil geopolitical risk premium unwind.
- Strait of Hormuz shipping safety normalization.
- War-risk insurance normalization.
- Tanker-rate normalization.
- Jet fuel and airline cost relief.
- LNG and energy-import relief.
- Inflation expectations relief.
- Central bank or rate-cut expectation relief.
- Safe-haven unwind.
- Defense-premium unwind.
- Risk-on equities.
- Europe and EM oil-importer relief.
- Travel, luxury, and payments sentiment improvement.
- Cyber-escalation probability reduction.

Do not include every asset automatically. Seed candidates, validate the causal link, then choose a compact Direct Impact set, usually 6 to 8 items.

Good Direct Impact candidates for the goldstandard case:
- BRENT CRUDE: negative, because the supply-risk premium can fall.
- GOLD or GLD: negative, because safe-haven demand can fade.
- TLT: positive or mixed, because lower energy inflation can support duration while risk-on can offset.
- SPY or QQQ: positive, because risk appetite can improve.
- DAL, UAL, or LHA.DE: positive, because fuel-cost and travel-risk pressure can ease.
- FRO or STNG: negative, because tanker war-risk and rerouting premia can normalize.
- LMT or RTX: negative or mixed, because the short-term defense premium can compress while structural budgets remain supported.
- DAX or Euro Stoxx proxy: positive, because Europe is exposed to imported energy and industrial input costs.

## Hormuz Escalation Pattern

Treat escalation around the Strait of Hormuz as a concrete oil, shipping, and insurance channel.

Direct Impact should normally include:
- Brent or an equivalent crude/oil asset.
- A safe-haven, rates, broad risk, tanker, airline/travel, or defense channel.

Keep cybersecurity, luxury, high-end autos, semiconductors, Visa, and Mastercard indirect or watchlist unless verified evidence supports a stronger link.

## CPI Pattern

For hotter-than-expected CPI:
- Direct Impact should include rates/yields or a duration proxy such as TLT.
- Direct Impact should include broad equities such as SPY or QQQ when discount-rate pressure is central.
- DXY/USD may be direct when dollar/rate differentials are part of the mechanism.
- Exposures can include rate-sensitive sectors, growth equities, financials, and real estate.
- Do not add irrelevant company watchlist names without a justified channel.

## Earnings Pattern

Normal upcoming earnings are usually Upcoming Events, not Top Events.

For example:
- "DOCU reports earnings tomorrow" should classify as Upcoming and should not auto-publish as a broad market-moving node.

Mega-cap earnings can be Top Event eligible when the company has broad market or thematic read-through.

For example:
- Nvidia earnings can affect semiconductors, QQQ, AI infrastructure, hyperscaler capex, margins, and guidance expectations.
- ASML and TSMC are usually indirect or exposure-level unless the evidence links to foundry demand, capex, supply, or guidance.

## Publishing Safety

Future nodes must not be treated as feed-quality if:
- Direct Impact is empty for a high-impact market event.
- Exposures are generic.
- why_it_matters is generic.
- Causal chains are generic.
- Asset validation removed all important candidates.
- Direct/Indirect/Watchlist classification rules are violated.

If a node fails:
- Keep it draft or failed_quality_gate.
- Return diagnostics explaining why.
- Do not hide the issue in the UI.
- Do not auto-publish.

## Compact Output

The app node is not the research dump.

Use the research layer to think broadly. Use the app node to show the smallest useful set:
- Direct Impact: normally 4 to 8 high-signal assets.
- Indirect Impact: a few plausible but lower-conviction names.
- Exposures: 4 to 7 mechanisms.
- Missing Data: the next facts that would confirm or falsify the node.
- Counterarguments: why the apparent channel may not work.

