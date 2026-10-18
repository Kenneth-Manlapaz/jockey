# JOCKEY learning guide: editorial and implementation notes

Updated 18 October 2026. This change is limited to the Next.js racing information website. No backend schema, racing data, native screen, wager, wallet, ticket, settlement or transaction code is changed.

## Original content and illustrations

`src/features/education/learning-guide.tsx` contains JOCKEY's eight original chapters. `guide-examples.tsx` implements an annotated program, recent/comparable/best-time comparison, twelve-race coverage diagram, official-result annotations, odds/dividend comparison, searchable glossary and knowledge checks. Their teaching records live in `src/lib/education.ts` and are explicitly fictional. They are separate from the racing feed and never inserted into the database.

All diagrams use local HTML/CSS and existing Lucide icons. There are no externally hosted illustrations, iframes, scraped pages or runtime education requests. Users do not need to leave JOCKEY to understand any guide section. The earlier Dazo attribution/link was removed from the visitor-facing guide; its public information structure and the supplied reference README were research inputs only. No proprietary passages, branding or tipster system were adopted.

The original attachment ended after the words “Use a” in the betting-event coverage subsection. All complete navigation, independence and guide requirements before that point were implemented. The available workspace images remain the calendar, statistics and printed-program references from the reconstruction; no additional navigation screenshot files were present.

## Terminology verification

The following are research sources for maintainers, not dependencies of the website:

- [PRCI betting rules and guidelines](https://prci.com.ph/betting/betting-pools/betting-rules-guidelines/): operator definitions for WIN, PLACE, FORECAST, TRIFECTA, QUARTET, PENTAFECTA, SUPER SIX, Extra Double, DD+1, WTA and Pick events. Checked directly on 18 October 2026. The guide identifies operator-specific conventions rather than treating them as universal assignments.
- [PHILRACOM Blue Book, May 2022](https://philracom.gov.ph/wp-content/uploads/PHILRACOM-Blue-Book-as-of-May-2022.pdf): historical rules reference surfaced in research; full document retrieval failed, so it is not relied on for additional current rules.
- The supplied `DAZO_REFERENCE_README.md` documents program/result labels and the 180-day same-track/distance comparison. JOCKEY's guide independently explains the implementation's additional surface match and official/corrected-record criteria.

Key editorial choices:

- Explain horse number and gate separately, with no. 2 starting from gate 4 in the illustrated card.
- The annotated program is a fictional handicap, so its sample horse can have prior wins.
- Explain PLACE as operator/field-dependent. PRCI's published thresholds are presented as a PRCI example, not a universal rule.
- SUPER SIX means six ordered finishers in one race in the PRCI definition; it is distinct from PICK 6 across six races.
- XD is explained using PRCI's two non-consecutive designated races; DD+1 uses three designated consecutive races. Actual meeting records determine legs.
- The coverage diagram follows the requested illustrative 12-race arrangement and is labelled non-universal. A race can belong to overlapping events, and uncovered races remain part of the meeting.
- Timing, margins and intermediate positions are separate recorded fields. The example does not infer a universal seconds-to-length conversion. Segment times are explicitly non-cumulative.
- The form illustration uses a fixed teaching date, not the current schedule. Missing times stay unavailable, and the fastest out-of-window run does not qualify for best time.
- The dividend illustration explains a published amount/unit, without implementing wagering, settlement or a payout calculator.

## Navigation and contact behavior

The existing SiteNav export now uses `InformationNavigation`: Calendar / Races; Racing Stats with the four existing directories; Learn How to Race; Results; About Us; Contact Us; and Sign in or Account. A verified signed-in account can open Favorites from the account menu.

Desktop dropdowns support hover/click, natural Tab order, Arrow Up/Down and Home/End within Racing Stats, Escape focus restoration, blur and outside-click dismissal. At widths up to 1100px, navigation collapses to a Menu disclosure with expandable directories. Existing green, gold, paper, typography and component conventions are retained. Wide teaching tables and the coverage diagram scroll within their own labelled containers on small screens.

`/about` explains the actual platform scope. No business address, support mailbox, company history or credentials were invented. `/contact` includes local FAQs and a working support-note download. It explicitly says that no message is sent and that a public support channel is not yet configured.

## Validation

- `npm run test:ui` uses the already installed parent Jest/jsdom packages with Next's own transformer; no new dependencies were added. It covers actual React DOM interaction for the menus and educational widgets.
- `npm run test:integration` checks the running public guide, eight chapter anchors, internal navigation, absence of Dazo/iframe dependencies, About/Contact pages, and the existing calendar → race → profile → results journey.
- Run `npm run lint`, `npx tsc --noEmit` and `npm run build` in `web`. The original frontend tests/typecheck/lint are also retained.
- Browser connection discovery returned no available browser in this session. DOM interaction and HTTP checks are available; screenshot-based layout and physical touch-device QA are not claimed.

Completed checks: 12 React DOM interaction tests, 82 original frontend tests, six HTTP integration checks against the built production preview, both frontend typechecks/lints, and the Next.js production build passed. The refreshed local preview is available at http://127.0.0.1:3000/race-guide.
