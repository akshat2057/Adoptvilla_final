"use client";
import { useMemo, useState } from "react";
import Link from "../components/Link.jsx";
import { indoreDirectory } from "../data/mockData.js";
export default function IndorePage() {
    const [category, setCategory] = useState("All");
    const [query, setQuery] = useState("");
    const categories = ["All", ...new Set(indoreDirectory.map((record) => record.category))];
    const records = useMemo(() => indoreDirectory.filter((record) => (category === "All" || record.category === category) && `${record.name} ${record.services.join(" ")}`.toLowerCase().includes(query.toLowerCase())), [category, query]);
    return <main className="city-page">
    <header className="city-header"><Link className="brand" href="/"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider"/><span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span></Link><Link href="/dashboard">My dashboard</Link></header>
    <section className="city-hero"><span>EXPLORE YOUR CITY</span><h1>Pet adoption and animal help in Indore</h1><p>Find sourced local organizations and government resources. Every listing shows where its information came from and what has—and has not—been verified.</p></section>
    <section className="city-emergency"><b>Animal emergency?</b><p>Contact an appropriate veterinarian or organization directly. Confirm availability before travelling. ADOPTVILLA does not dispatch or guarantee a rescue response.</p></section>
    <section className="city-directory"><div className="city-filters"><label className="city-search"><span aria-hidden="true">⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rescue, shelter, wildlife…" aria-label="Search Indore directory"/></label><div className="city-filter-pills">{categories.map((item) => <button className={category === item ? "active" : ""} aria-pressed={category === item} key={item} onClick={() => setCategory(item)}>{item}</button>)}</div></div>
      <div className="directory-cards">{records.map((record) => <article key={record.id}><div><span>{record.category}</span><em>{record.verificationStatus.replaceAll("_", " ")}</em></div><h2>{record.name}</h2><p>{record.locality}</p><ul>{record.services.map((service) => <li key={service}>{service}</li>)}</ul><small>{record.note}</small><div className="directory-card-actions"><a href={record.website} target="_blank" rel="noreferrer">Visit organization →</a><a href={record.sourceUrl} target="_blank" rel="noreferrer">Source: {record.sourceLabel}</a></div></article>)}</div>
      {!records.length && <div className="record-empty">No sourced records match these filters.</div>}
    </section>
    <section className="directory-correction"><h2>Is something wrong or is this your organization?</h2><p>Sign in to submit a correction or profile claim. Submissions are reviewed before public information changes.</p><a className="primary" href="/login?return_to=%2Fdashboard">Sign in to suggest a correction →</a></section>
  </main>;
}
