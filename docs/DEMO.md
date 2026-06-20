# Knotten: five-minute demo walkthrough

A presenter's script for a five-minute demo that lands the wow. Times are a guide. Everything shown is real and running; every figure on screen is labelled indicative. Run against the deployed (access-gated) site or `pnpm start` locally.

## 0:00 to 0:30 The pitch and the place

- Open the **home page**. One line: "Knotten is an energy-smart coastal development at Rodberg by Sniksfjorden, planned energy-first from the first spade in the ground, and this platform proves the idea works."
- Note the honesty: "Everything is indicative and pre-regulering; we never invent a number."

## 0:30 to 1:30 See the place in 3D

- Go to **Omradet**. The real Kartverket terrain loads (3D where the device supports it, a baked still elsewhere). Pan the fjord and hillside.
- Toggle the **sun path** (season and time). "This is the real latitude and real terrain, not a render." Click a plot to show status and the sea-view sightline.
- Scroll to the **plot overview** table: live status and indicative price from the content layer.

## 1:30 to 2:45 The buyer-value tools

- Open **Verktoy**. "Eight tools, all stateless, all honest."
- **Din stromtrygghet**: pick the expensive winter 2022 period. "Real NO2 spot prices. An energy-smart home with solar and a battery is far less exposed; we show exposure, never a guaranteed saving." Toggle the battery and watch the exposure bar drop.
- **Manedskostnad**: "Norwegians buy on monthly cost. Same loan, only the energy line differs, and the energy advantage is isolated."
- **Konfigurator**: pick a house type, set solar and battery, watch self-sufficiency and cost move live. "The same energy model feeds every tool, so the numbers never disagree."

## 2:45 to 3:30 The crown jewel: consent-first lead capture

- From a plot page, click **Meld interesse for tomt A1**. Show the form pre-scoped to the plot, the explicit unbundled consent checkbox, and the privacy link. "Double opt-in, no PII without consent, withdrawal as easy as signing up."
- Submit; show the success state. "A confirmation email goes out; the lead is real only after they click it."

## 3:30 to 4:30 The owner's control room

- Go to **/admin**, sign in with password and a TOTP code. "Mandatory two-factor; sessions are short and hashed; no developer needed."
- Show the **lead list** (search, filter), open a lead's **full consent record**, set a pipeline status.
- Show **GDPR in one click**: a per-subject export, and owner-only erasure with re-auth. "Erasure truly deletes, verified, and is audited with no personal data in the log."
- Open **Innhold**: change a plot's status or publish a news post, then show it live on the public site. "The owner runs the whole site from here."

## 4:30 to 5:00 Community dashboard and the kit

- Open **Robusthet**: the community energy dashboard tiles (solar today, shared battery, self-sufficiency, outage), each marked an illustrative simulation. "The aspiration, told honestly."
- Open **For kommune og partnere** and download the **one-pager** or the **deck**. "A self-serve kit for the municipality and partners, sharing the same numbers as the site."
- Close: "Credible interest capture, a buyer-value story you can verify, and a concept the kommune can act on, built honestly from the ground up."

## Notes for the presenter

- If a device cannot run the 3D view, the static fallback is shown; this is expected and accessible.
- The English site is at the localized paths (for example `/en/the-area`, `/en/tools/price-security`).
- All figures carry a forbehold; if asked "is this guaranteed?", the answer is always no, it is an indicative estimate that needs professional verification.
