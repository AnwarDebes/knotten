# ADR-0002: Next.js Route Handlers as the backend (no separate API service)

## Status

Accepted, 2026-06-18

## Context

The application is a standard web product: CRUD over a relational store plus a set of stateless calculators. The calculators cover energy economics for the Roedberg site at Sniksfjorden (Lindesnes kommune, Agder, price zone NO2): spot-price exposure, stroemstoette (90% of spot above 77 øre/kWh ex VAT, 96.25 incl., hourly per zone, up to 5000 kWh/month, scheme decided through 31 Dec 2029), Norgespris (fixed 50 øre/kWh incl. VAT, meter-bound through 2026, scheme to 2029), plusskunde economics (innmating capped at 100 kW, no nettleie/levies on self-consumed kWh, no fastledd for innmating), energy sharing on the same gnr/bnr, passivhus heating demand (about 15 kWh/m2 per year), and solar yield at the site (about 1000 to 1020 kWh/kWp per year, PVGIS, indicative). All figures are indicative and labelled as estimates in public copy, and all are data-driven against placeholders because the unit/plot count is still unknown.

None of this is computationally heavy, long-running, or stateful. There is no batch pipeline, no ML inference, no GPU work, no streaming. A request comes in, the calculators run synchronously over plain inputs, a JSON response goes out. The same arithmetic also has to render in the UI so a visitor can move a slider and see a number change without a round trip.

The constraints that drive the choice:

- One language and one mental model. The team already builds the frontend in TypeScript. A second runtime means a second toolchain, a second dependency graph, a second set of CVEs, and a second thing to keep current.
- One deploy target. Fewer artifacts to build, version, promote, and roll back.
- Smallest attack surface. Every additional network boundary, port, and service is something to authenticate, authorise, rate-limit, and monitor.
- Easiest handover. The project must be legible to whoever maintains it next. A single repository that builds and deploys as one unit is the shortest path to that.

The hosting and data posture is already fixed elsewhere: email and database stay in the EU/EEA, analytics is Plousible (Plausible, EU, cookieless, no cookie banner). The backend choice must not pull data or compute outside that posture.

## Decision

Implement all server logic as Next.js Route Handlers inside the same deployable as the frontend. Do not split out a FastAPI or any other separate service for v1.

Keep the calculation and energy logic as pure, tested TypeScript modules that depend on nothing in the request lifecycle: no framework objects, no I/O, no environment reads. A module takes typed inputs (tariffs, consumption, yield, scheme parameters) and returns typed results. Route Handlers are thin: they validate and parse input, call a calculator, and serialise the result. The UI imports the exact same modules for live, client-side recalculation.

Scheme parameters that have legal expiry (stroemstoette through 31 Dec 2029, Norgespris meter-bound through 2026 and scheme to 2029, energy-sharing rules expanding from 1 Jan 2026) live as explicit, dated constants in the calculator modules, not hard-coded inline, so a future change is a single edit with a test to match.

## Alternatives considered

**Separate FastAPI / Python service.** Strong fit if the workload were numerically heavy, needed the scientific Python stack, or were owned by a separate backend team. None of those hold here. The cost is concrete: a second language, a second runtime to patch, an HTTP boundary to secure and observe, and duplicated domain logic, because the calculators still have to run in the browser for live UI. That duplication is the real defect: two implementations of stroemstoette and Norgespris math that drift apart silently. Rejected.

**Serverless functions in another runtime (separate from the Next.js deploy).** Buys independent scaling we do not need for stateless arithmetic over small inputs. It fragments deployment and observability across two platforms and reintroduces the cross-runtime duplication problem. Cold starts and per-function config add operational noise for no workload-driven benefit. Rejected.

**A BaaS backend (managed CRUD/auth provider).** Fast to start, but it pushes data location, retention, and processing terms onto a third party, which is exactly the surface that must stay provably EU/EEA. It also constrains the calculators: bespoke energy logic does not belong in vendor functions or stored procedures, and lock-in raises the handover cost rather than lowering it. Rejected for v1.

## Consequences

Positive:

- The calculators are pure, unit-tested TypeScript modules with no framework or I/O coupling. They are reused verbatim by the Route Handlers and by the UI, so the number a visitor sees on a slider is computed by the same code that serves the API. One source of truth for stroemstoette, Norgespris, plusskunde, and solar-yield math.
- Fewer moving parts to operate and to secure: one runtime, one dependency graph, one deploy, one set of logs, one network boundary. The attack surface is the Next.js app and its store, nothing more.
- Handover is a single repository that a TypeScript developer can read end to end. Dated scheme constants make the time-sensitive parts (stroemstoette to 2029, Norgespris to 2029, energy-sharing changes from 2026) easy to find and amend.
- Pure calculators are trivial to test: feed inputs, assert outputs, no servers, no fixtures, no mocks. This is where correctness for the public figures is enforced.

Negative and accepted:

- Server and client share a runtime, so a CPU-bound or long-running task would block the same process that serves pages. This is acceptable because the workload is stateless arithmetic over small inputs; if a genuinely heavy or long-running job appears later, it is extracted into its own service then, on evidence, not pre-emptively.
- The backend cannot use Python-only libraries. No such dependency exists today; should one become necessary, that is a deliberate trigger to revisit this decision, not a reason to pre-build a second service now.
- Scaling is coupled: the API cannot scale independently of the frontend. For current load this is a non-issue, and it keeps the operational model simple.

This decision is locked for v1. Revisit it only on a concrete trigger: a CPU-bound or stateful workload, a hard Python-library dependency, or a separate backend team taking ownership.
