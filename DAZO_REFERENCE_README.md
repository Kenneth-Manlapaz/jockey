# Dividendazo (Dazo.ph) — Racing Information Reference

> **Reference document · 18 October 2026**  
> Website: https://beta.dazo.ph/  
> Public race guide: https://beta.dazo.ph/learn-how-to-race

## Overview

**Dividendazo**, commonly presented online as **Dazo.ph**, is a Philippine horse-racing program and information service. Its printed publication dates to **1932**, according to its About Us page. The digital service makes racing programs, historical horse information, race results, and related racing content available online.

The main product is **racing information**: a race program that connects the day's races to horses, their form, tipster selections, and eventually the official results and dividends. Although betting terms and links appear throughout the website, the publicly visible Dazo pages do **not** establish that Dazo itself processes real-money wagers.

This README describes **what Dazo publicly documents**, **how its information fits together**, and **what is not verifiable without member access**. It is a functional reference, not a development prompt, UI specification, or instruction to copy the website.

## 1. Product and Content Map

```text
Dividendazo / Dazo.ph
│
├── Public website
│   ├── Home / race-date calendar
│   ├── Announcements
│   ├── Reading the Race Program (guide)
│   ├── Reading the Race Results (guide)
│   ├── Subscription information
│   ├── About Dividendazo
│   └── Off-track betting locator and links
│
└── Member-oriented racing content
    ├── Race programs and race results
    │   ├── Race headers and betting-event labels
    │   ├── Declared horse entries
    │   ├── Tipster selections and favorites
    │   ├── Recent and comparable horse form
    │   ├── Announcements
    │   └── After the race: placings, times, dividends, replay
    └── Profiles
        ├── Horses
        ├── Jockeys
        ├── Trainers
        └── Owners
```

The homepage contains a calendar with **Previous Race** and **Upcoming Race** controls. The actual race-content page and profile pages require sign-in when visited without a member session.

## 2. The Racing Information Hierarchy

| Concept | Role in the Dazo experience |
|---|---|
| Racing date | Identifies when a meeting or race program is published. |
| Race | An individual contest with its own number, time, track, distance and group. |
| Race program | Pre-race entry and form information for a particular race. |
| Horse entry | A horse participating in that race, with starting gate, jockey and weight information. |
| Horse form | Historical races and performance records attached to a horse. |
| Tipster pick | A recommendation supplied by a Dazo tipster. |
| Betting event / pool | A designated wager category shown in the race program; some event labels may connect multiple races. |
| Race result | The recorded post-race finishing information and timing. |
| Dividend | A published payout for a winning pool or betting-event combination, shown in pesos. |

A **race is not a ticket**. A **betting event is not the same as a race**. The race supplies the sporting result; the betting event defines how one or more race results determine a winning selection. The available events are determined by the actual published program and operator rules.

## 3. Reading a Dazo Race Program — Before the Race

Dazo's guide describes a **blue race header** and the sections beneath it.

### 3.1 Header and race context

The blue header carries:

- Race number
- Start time
- Race track
- Distance
- An exotic-betting event label, where applicable
- Race group

The following line shows the available pool-betting events, with **TRIFECTA** and **QUARTET** named as examples in the guide. A subsequent line shows picks from Dazo's **B**, **W** and **Y** tipsters.

**Important distinction:** The race number identifies the contest. The betting labels identify wagering categories associated with it; their precise rules and the set of eligible races are not defined exhaustively by the public Dazo guide.

### 3.2 Horse-entry table

| Program element | Dazo's documented meaning |
|---|---|
| Leftmost number | Horse's starting gate. |
| Horse name | Identifies the entry; selecting it exposes historical race and profile information. |
| Star beside horse name | Marks a horse favored by a Dazo tipster. |
| Jockey | Rider listed for that entry. |
| Jockey weight | Weight figure displayed by Dazo; its exact measurement convention is not further defined in the public guide. |
| Best time | Horse's best time at the **same track and distance**, drawn from the preceding **180 days**. |
| Rightmost star control | Lets the user mark their **own** favorite horse. |

The two star concepts are distinct: **Dazo tipster recommendation** versus **user-saved favorite**. They should not be interpreted as the same signal.

### 3.3 Horse historical form

Selecting a horse is documented as exposing three information groups:

1. **Last 5 Races** — the horse's five latest races, regardless of track or distance.
2. **Last 5 DIST** — the horse's recent races at the **same track and distance** as the current race.
3. **Horse Profile** — available group, jockey, trainer and owner information.

The distinction between general recent form and comparable-course/distance form is central to the value of a racing guide: recent finishes alone do not establish how a horse has performed under comparable conditions.

### 3.4 Race announcements

The **View Announcement** area can include coupled-entry information, extra prizes, sponsorships and other race notices. Such notices can alter how the entry list should be interpreted, so they belong to the race record rather than a generic news feed.

### 3.5 Transition to results

The guide explicitly states that **the race program is no longer available once results are entered**. This describes Dazo's documented presentation behavior; it should not be confused with a claim that the underlying historical program data is deleted.

## 4. Reading Dazo Race Results — After the Race

Dazo's guide describes a **red header** for results. Its displayed content differs from the pre-race program.

### 4.1 Race and clocking information

The red header identifies the race number, track, distance and race group. The timing line includes:

- **CLOCKING:** recorded time for each quarter segment, as described by the guide.
- **TIME:** winning horse's overall race time, displayed in minutes and seconds.
- **LF (Length Finished):** the guide describes this as distance between the winner and subsequent placers.
- **Placing sequence:** finishing-order numbers.

These measures are historical race facts, not tips or estimated betting returns.

### 4.2 Result table

Horses are ordered by finishing position, with the winner first. The guide documents:

| Field / notation | Meaning |
|---|---|
| `1/2` | Position at the halfway point of the race. |
| `1/4` | Position when one-quarter of the race distance remained. |
| Horse name | Entry, ordered by recorded finish. |
| Group number | Appears after the horse name in rating-based races. |
| `A`, `B`, `C`, `D` | Indicates a *Llamado* selection according to the guide. |
| Jockey and weight | Rider and displayed jockey-weight figure. |
| Run time | Recorded time shown for the horse. |
| `DH` | Dead heat. |
| `DQ` | Disqualified. |

A **View Replay** link opens a separate viewing window where replay content is available.

### 4.3 Official dividends

Dazo places a dividend line with the race results. It shows **peso-denominated dividends for betting events available for that race**.

Dividends are **post-race payout information**, not horse-performance measurements or predictions. For clarity:

- **Result:** which horse or combination won.
- **Dividend:** what the relevant winning betting unit paid, subject to the published pool rules.
- **Odds / projection:** pre-race market information or estimates, not the official dividend.

The publicly accessible guide does **not** comprehensively specify payout units, all supported pools, whether each dividend is provisional or final, or how linked multi-race event dividends are displayed. Those details require actual race records or operator documentation.

## 5. Betting Events Mentioned in Racing Programs

Dazo's public guide directly mentions **exotic events** and pool categories such as **TRIFECTA** and **QUARTET**. Philippine racing programs can also display other single-race and multi-race labels, including WIN, PLACE, WTA, PICK 5, PICK 6, XD and DD+1, depending on the program.

The useful conceptual distinction is:

| Category | Relationship to racing data |
|---|---|
| Single-race event | A winning selection depends on the result of one specified race. |
| Multi-race event | A winning selection depends on results of several specified race legs. |

**Do not infer the legs from the event name alone.** The actual event definition, sequence, eligibility, coupled-entry handling, cancellations and payouts come from the published meeting program and operator rules. The public Dazo help page is an explanation of a displayed program, not a complete wagering rules manual.

## 6. Horse, Jockey, Trainer and Owner Directories

Dazo exposes navigation for four member-oriented profile categories:

- **Horses:** https://beta.dazo.ph/horses
- **Jockeys:** https://beta.dazo.ph/jockey
- **Trainers:** https://beta.dazo.ph/trainer
- **Owners:** https://beta.dazo.ph/owner

The homepage advertises a horse database containing race-by-race performance and databases for owners, jockeys and trainers. The public guide confirms that horse names link to historical form and a profile identifying group, jockey, trainer and owner.

**Access limitation:** The actual directory listings, full profile fields, search filters, ranking formulas and relationship history could not be verified publicly. Each directory returns a **Members Only Area** notice to an unauthenticated visitor. No detailed authenticated-screen behavior is assumed in this README.

## 7. User Journey Through Dazo

```text
Open Dazo.ph
   |
   +--> Read the public race guide
   |
   +--> Choose a racing date / previous or upcoming race
   |       |
   |       +--> Sign in / subscribe where required
   |               |
   |               +--> Open the race program
   |                       |
   |                       +--> Read race conditions and pools
   |                       +--> Review runners and tipster picks
   |                       +--> Open horse form and profiles
   |                       +--> Mark personal favorites
   |                       +--> Read announcements
   |
   +--> After a race: view results
           |
           +--> Finish order and timing
           +--> Dividends
           +--> Replay where available
```

This is a **conceptual journey assembled from public page descriptions**, not a verified step-by-step recording of the member interface.

## 8. Access and Commercial Model

The publicly displayed subscription offers observed on **18 October 2026** are:

| Plan | Advertised price |
|---|---:|
| Daily | **₱35** |
| Monthly | **₱299** |

The homepage markets earlier access to race programs, horse-performance information, historical race results and video replays. It states results with replays are available from **September 2020 onward**; this is the site's claim, not an independently audited count of complete archival coverage.

The home page also advertises:

- Livestream viewing
- An off-track betting locator
- A link inviting users to bet
- Registration and contact features

These supplementary features do not establish that Dazo itself hosts or settles bets. The public material describes an **information-subscription product**, with links to related racing activities.

Account creation is shown as a three-stage process: contact detail entry, verification code, and account credentials/profile. The actual paid entitlement rules and current checkout experience were not tested.

## 9. What Makes the Dazo Format Distinct

Dazo's documented structure follows the lifecycle of an individual race:

```text
Race date
  -> Race program
     -> Race context and available pools
     -> Horse entries and comparable form
     -> Tipsters and personal favorites
     -> Race announcements
  -> Race result
     -> Finishing positions and sectional information
     -> Published dividends
     -> Replay
```

Its important information patterns are:

- **One race, many connected records:** horse, jockey, trainer, owner, result and relevant pool labels.
- **Two complementary form views:** latest races versus comparable track/distance history.
- **Two different favorite markers:** editorial tipster selections and the user's own stars.
- **Clear before/after distinction:** blue pre-race presentation versus red results presentation.
- **Dividends belong with official results:** they are reported after racing, not generated as a horse-performance prediction.
- **Racing history has standalone value:** the service charges for convenient access to the digital racing program and associated research information.

## 10. Verification and Open Questions

### Verified from public Dazo pages

- The printed-publication history claimed on the About page.
- The race-program and race-results field descriptions.
- The meanings of `Last 5 Races`, `Last 5 DIST`, stars, clocking, `LF`, `DH` and `DQ` as explained in Dazo's guide.
- The publicly advertised subscription prices.
- The existence of member-gated race, horse, jockey, trainer and owner routes.
- The homepage's advertised archive, replay, livestream and locator offerings.

### Not verified without authenticated access or operator documentation

- Real race-program screen layout and complete member interactions.
- All betting-event types, mappings, overlapping legs and calculation rules.
- Detailed horse/jockey/trainer/owner directory fields and filters.
- The precise source, freshness and completeness of individual racing records.
- Payout units and settlement details for every dividend.
- Exact premium entitlements and checkout/payment behavior.
- Whether links to livestreams or betting use third-party services and their current availability.

## Source Links

1. **Dazo home:** https://beta.dazo.ph/
2. **How to read the race program and results:** https://beta.dazo.ph/learn-how-to-race
3. **About Dividendazo:** https://beta.dazo.ph/about-us
4. **Member race area:** https://beta.dazo.ph/view-races
5. **Horse directory:** https://beta.dazo.ph/horses
6. **Jockey directory:** https://beta.dazo.ph/jockey
7. **Trainer directory:** https://beta.dazo.ph/trainer
8. **Owner directory:** https://beta.dazo.ph/owner

---

*Reference purpose: document the Dazo racing-information model as a stable functional guide. No assertion is made that the member-only screens or proprietary datasets have been inspected.*
