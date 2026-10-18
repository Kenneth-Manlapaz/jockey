import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarDays, Radio, Ticket, Trophy } from 'lucide-react';
import type { HomeData } from '@/types';
import { MobileGreeting } from '@web/features/account/components/mobile-greeting';

export function DashboardOverview({ data }: { data: HomeData }) {
  const race = data.liveRace;
  const dashboardQuickLinks = data.quickLinks;

  return (
    <main className="web-main">
      <MobileGreeting dateLabel={data.dateLabel} greetingName={data.greetingName} />

      <section className="dashboard-hero">
        <p className="eyebrow">{data.dateLabel}</p>
        <h1>Good afternoon,<br /><span style={{ color: 'var(--accent-soft)' }}>{data.greetingName}</span></h1>
        <p>Race day is better when you’re in the know.</p>
      </section>

      <div className="dashboard-grid">
        <article className="web-card race-feature">
          <div>
            <small><Radio size={13} style={{ verticalAlign: 'middle' }} /> {race.isLive === false ? 'FEATURED RACE' : 'LIVE NOW'} · {data.liveSeries}</small>
            <h3>Race {race.number}: {race.name}</h3>
            <span>{race.venue} · {race.distanceM}m</span>
          </div>
          <Link className="button button-accent" href="/live">Watch live <ArrowRight size={16} /></Link>
        </article>
        <section className="web-card" id="desktop-races">
          <div className="section-head"><h2>Today’s races</h2><Link href="/races">Full schedule</Link></div>
          <div className="race-list">{data.todayRaces.map((item) => (
            <Link className="race-row" href={`/race/${item.id}`} key={item.id}>
              <span className="race-number">{item.number}</span>
              <span className="race-info"><strong>{item.name}</strong><small>{item.postTime} · {item.distanceM}m · {item.entries} entries</small></span>
              <span className="status">{item.status}</span>
            </Link>
          ))}</div>
        </section>
      </div>

      <section className="mobile-live-wrap">
        <article className="mobile-live-card">
          <div className="mobile-live-top"><span><i className="live-dot" /> {race.isLive === false ? 'FEATURED RACE' : 'LIVE NOW'}</span><span>{data.liveSeries}</span></div>
          <p className="mobile-live-race">Race {race.number}</p>
          <h2>{race.name}</h2>
          <p>{race.venue} · {race.distanceM}m · {race.entries} entries</p>
          <Link href="/live" className="mobile-watch-link">Watch live <ArrowRight size={15} /></Link>
        </article>
      </section>

      <section className="mobile-content-section" id="mobile-races">
        <div className="mobile-section-heading"><h2>Today’s races</h2><Link href="/races">View schedule</Link></div>
        <div className="mobile-horizontal-list">
          {data.todayRaces.map((item) => (
            <Link className="mobile-race-card" href={`/race/${item.id}`} key={`mobile-${item.id}`}>
              <div className="mobile-race-card-top"><span>RACE {item.number}</span><span className={`mobile-race-status ${item.status}`}>{item.status}</span></div>
              <strong>{item.name}</strong><span>{item.postTime} · {item.distanceM}m</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="mobile-promo-card">
        <div><span>{data.promo.eyebrow}</span><h2>{data.promo.title}</h2><p>{data.promo.description}</p></div>
        <Link href="/games" aria-label="Explore games"><ArrowRight size={18} /></Link>
      </section>

      <section className="mobile-quick-links">
        {dashboardQuickLinks.map((item) => (
          <Link href={item.icon === 'totalizer' ? '/jockeyph-guide' : '/games'} className="mobile-quick-card" key={`mobile-${item.id}`}>
            <span className="mobile-quick-icon">{item.icon === 'totalizer' ? <BookOpen size={19} /> : <CalendarDays size={19} />}</span>
            <span><strong>{item.icon === 'totalizer' ? 'JockeyPH Guide' : item.label}</strong><small>{item.icon === 'totalizer' ? 'Race sheet and system tips' : item.sublabel}</small></span><ArrowRight size={16} />
          </Link>
        ))}
        <Link href="/betting-history" className="mobile-quick-card">
          <span className="mobile-quick-icon"><Ticket size={19} /></span>
          <span><strong>My Bets</strong><small>View tickets and bet status</small></span><ArrowRight size={16} />
        </Link>
      </section>

      <section className="web-card desktop-results" id="desktop-results" style={{ marginTop: 16 }}>
        <div className="section-head"><h2>Latest results</h2><Link href="/results">See all results</Link></div>
        {data.latestResults.map((result) => (
          <Link className="result-row" href={`/result/${result.id}`} key={result.id}>
            <span className="race-number"><Trophy size={17} /></span>
            <span className="race-info"><strong>{result.winner.horse}</strong><small>Race {result.raceNumber} · {result.venue} · {result.time}</small></span>
            <span className="status">{result.status}</span>
          </Link>
        ))}
      </section>

      <section className="utility-grid desktop-utility-grid">
        {dashboardQuickLinks.map((item) => (
          <Link className="utility-card" href={item.icon === 'totalizer' ? '/jockeyph-guide' : '/games'} key={item.id}>
            <strong>{item.icon === 'totalizer' ? 'JockeyPH Guide' : item.label} <ArrowRight size={14} /></strong><span>{item.icon === 'totalizer' ? 'Race sheet and system tips' : item.sublabel}</span>
          </Link>
        ))}
        <Link className="utility-card" href="/betting-history">
          <strong>My Bets <ArrowRight size={14} /></strong><span>View your tickets and bet status</span>
        </Link>
      </section>

      <section className="mobile-content-section mobile-results" id="mobile-results">
        <div className="mobile-section-heading"><h2>Latest results</h2><Link href="/results">See all</Link></div>
        <div className="mobile-results-card">{data.latestResults.map((result) => (
          <Link href={`/result/${result.id}`} className="mobile-result-row" key={`mobile-${result.id}`}>
            <span className="mobile-result-trophy"><Trophy size={18} /></span>
            <span className="mobile-result-info"><strong>{result.winner.horse}</strong><small>Race {result.raceNumber} · {result.venue}</small></span>
            <span className="mobile-result-status">{result.status}</span>
          </Link>
        ))}</div>
      </section>

      <section className="mobile-content-section mobile-featured">
        <div className="mobile-section-heading"><h2>Featured contenders</h2></div>
        <div className="mobile-horizontal-list">{data.featured.map((item) => (
          <article className="mobile-feature-card" key={`mobile-${item.id}`}>
            {item.image ? <img src={item.image} alt="" /> : <div className="mobile-feature-placeholder"><Trophy size={24} /></div>}
            <span>FEATURED {item.kind.toUpperCase()}</span><strong>{item.name}</strong>
          </article>
        ))}</div>
      </section>
    </main>
  );
}
