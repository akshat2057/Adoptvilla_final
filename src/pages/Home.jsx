"use client";
import { useEffect, useState } from "react";
const savedStorageKey = "adoptvilla-saved-pets-v1";
const matchStorageKey = "adoptvilla-compatibility-profile-v1";
const defaultMatchProfile = { city: "Indore", routine: "Office / hybrid", alone: "4–6 hours", home: "Apartment", tenure: "Owned", agreement: "Yes", exercise: "30–60 minutes", experience: "First-time pet parent", discoverability: "Verified custodians may invite me" };
export default function Home({ isAuthenticated = false }) {
    const [catalogPets, setCatalogPets] = useState([]);
    const [catalogLoading, setCatalogLoading] = useState(true);
    const [catalogTotal, setCatalogTotal] = useState({ all: 0, real: 0, demo: 0 });
    const [catalogPage, setCatalogPage] = useState(1);
    const [catalogHasMore, setCatalogHasMore] = useState(false);
    const [cities, setCities] = useState([]);
    const [promotions, setPromotions] = useState({ adopter: null, pet: null });
    const [query, setQuery] = useState("");
    const [type, setType] = useState("All");
    const [city, setCity] = useState("All cities");
    const [saved, setSaved] = useState([]);
    const [accountSaves, setAccountSaves] = useState(false);
    const [journey, setJourney] = useState(null);
    const [step, setStep] = useState(0);
    const [toast, setToast] = useState("");
    const [menu, setMenu] = useState(false);
    const [listingSpecies, setListingSpecies] = useState("Dog");
    const [otherSpecies, setOtherSpecies] = useState("");
    const [matchProfile, setMatchProfile] = useState(defaultMatchProfile);
    useEffect(() => {
        const localTimer = window.setTimeout(() => {
            var _a;
            try {
                const local = JSON.parse((_a = window.localStorage.getItem(savedStorageKey)) !== null && _a !== void 0 ? _a : "[]");
                if (Array.isArray(local))
                    setSaved(local.map(String));
            }
            catch (_b) {
                // Invalid device storage is safely ignored.
            }
        }, 0);
        fetch("/api/platform?resource=saved-pets")
            .then(async (response) => {
            if (!response.ok)
                return;
            const data = await response.json();
            setAccountSaves(true);
            setSaved((current) => {
                var _a;
                const merged = [...new Set([...current, ...((_a = data.petIds) !== null && _a !== void 0 ? _a : [])])];
                window.localStorage.setItem(savedStorageKey, JSON.stringify(merged));
                return merged;
            });
        })
            .catch(() => undefined);
        return () => window.clearTimeout(localTimer);
    }, []);
    useEffect(() => {
        const timer = window.setTimeout(() => {
            var _a;
            try {
                const stored = JSON.parse((_a = window.localStorage.getItem(matchStorageKey)) !== null && _a !== void 0 ? _a : "null");
                if (stored)
                    setMatchProfile(Object.assign(Object.assign({}, defaultMatchProfile), stored));
            }
            catch (_b) {
                // Invalid device storage is safely ignored.
            }
        }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    useEffect(() => {
        const controller = new AbortController();
        const timer = window.setTimeout(async () => {
            setCatalogLoading(true);
            try {
                const params = new URLSearchParams({ q: query, species: type, city, page: "1", pageSize: "12" });
                const response = await fetch(`/api/catalog?${params}`, { signal: controller.signal });
                if (!response.ok)
                    throw new Error();
                const data = await response.json();
                setCatalogPets(data.pets);
                setCatalogTotal({ all: data.total, real: data.realTotal, demo: data.demoTotal });
                setCatalogPage(data.page);
                setCatalogHasMore(data.hasMore);
                setCities(data.cities);
                setPromotions(data.promotions);
            }
            catch (error) {
                if (!(error instanceof DOMException && error.name === "AbortError"))
                    setCatalogPets([]);
            }
            finally {
                if (!controller.signal.aborted)
                    setCatalogLoading(false);
            }
        }, 220);
        return () => {
            window.clearTimeout(timer);
            controller.abort();
        };
    }, [query, type, city]);
    const toggleSaved = async (petId) => {
        const wasSaved = saved.includes(petId);
        const next = wasSaved ? saved.filter((id) => id !== petId) : [...saved, petId];
        setSaved(next);
        window.localStorage.setItem(savedStorageKey, JSON.stringify(next));
        notify(wasSaved ? "Removed from saved pets." : accountSaves ? "Saved to your account." : "Saved on this device. Log in to keep it across devices.");
        if (!accountSaves)
            return;
        try {
            const response = await fetch("/api/platform", {
                method: "POST",
                headers: { "content-type": "application/json" },
                body: JSON.stringify({ action: "toggle-saved-pet", petId, saved: !wasSaved }),
            });
            if (!response.ok)
                throw new Error();
        }
        catch (_a) {
            setSaved(saved);
            window.localStorage.setItem(savedStorageKey, JSON.stringify(saved));
            notify("We could not update your account. Please try again.");
        }
    };
    const loadMore = async () => {
        const nextPage = catalogPage + 1;
        setCatalogLoading(true);
        try {
            const params = new URLSearchParams({ q: query, species: type, city, page: String(nextPage), pageSize: "12" });
            const response = await fetch(`/api/catalog?${params}`);
            if (!response.ok)
                throw new Error();
            const data = await response.json();
            setCatalogPets((current) => [...current, ...data.pets]);
            setCatalogPage(data.page);
            setCatalogHasMore(data.hasMore);
        }
        catch (_a) {
            notify("More pets could not be loaded. Please try again.");
        }
        finally {
            setCatalogLoading(false);
        }
    };
    const notify = (message) => {
        setToast(message);
        window.setTimeout(() => setToast(""), 2600);
    };
    const start = (value) => {
        setJourney(value);
        setStep(0);
    };
    const submitSearch = (event) => {
        var _a;
        event.preventDefault();
        (_a = document.querySelector("#pets")) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    };
    const updateMatchProfile = (field, value) => {
        setMatchProfile((current) => (Object.assign(Object.assign({}, current), { [field]: value })));
    };
    const compatibilityResults = catalogPets.map((pet) => {
        let score = 62;
        const strengths = [];
        const considerations = [];
        if (pet.city === matchProfile.city) {
            score += 10;
            strengths.push(`Located in ${pet.city}, making introductions easier`);
        }
        else
            considerations.push(`Currently in ${pet.city}; transport may need coordination`);
        if (matchProfile.home === "Apartment" && pet.tags.some((tag) => /apartment|indoor|small home/i.test(tag))) {
            score += 8;
            strengths.push("Profile indicates apartment suitability");
        }
        if (matchProfile.home === "Shared accommodation") {
            score -= 5;
            considerations.push("Shared-home consent and stability should be confirmed");
        }
        if (matchProfile.tenure === "Rented")
            considerations.push("Written landlord approval should be confirmed before adoption");
        if (matchProfile.agreement !== "Yes") {
            score -= 22;
            considerations.push("Every adult must agree before placement can proceed");
        }
        const highEnergy = /high|very high/i.test(pet.energy);
        const exerciseMinutes = matchProfile.exercise === "90+ minutes" ? 100 : matchProfile.exercise === "60–90 minutes" ? 75 : 45;
        if (highEnergy && exerciseMinutes >= 75) {
            score += 9;
            strengths.push("Your exercise commitment fits this pet’s energy");
        }
        else if (highEnergy) {
            score -= 12;
            considerations.push(`${pet.name} has ${pet.energy.toLowerCase()} energy and may need more daily activity`);
        }
        else if (exerciseMinutes <= 60) {
            score += 6;
            strengths.push("Energy needs appear compatible with your routine");
        }
        if (matchProfile.alone === "7+ hours") {
            score -= 12;
            considerations.push("Long periods alone require a specific care and enrichment plan");
        }
        else if (matchProfile.alone === "Under 2 hours" || matchProfile.alone === "2–4 hours") {
            score += 6;
            strengths.push("Your available companionship supports easier adjustment");
        }
        if (matchProfile.experience === "First-time pet parent" && pet.tags.some((tag) => /first.?time|trained|calm|gentle/i.test(tag))) {
            score += 7;
            strengths.push("Profile suggests a manageable first-time-parent fit");
        }
        if (/experienced/i.test(pet.consider) && matchProfile.experience === "First-time pet parent") {
            score -= 12;
            considerations.push(pet.consider);
        }
        return { pet, score: Math.max(30, Math.min(97, score)), strengths: strengths.slice(0, 3), considerations: considerations.slice(0, 3) };
    }).sort((a, b) => b.score - a.score);
    const finishCompatibilityProfile = () => {
        window.localStorage.setItem(matchStorageKey, JSON.stringify(matchProfile));
        setStep(3);
    };
    return (<main className="public-home">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="ADOPTVILLA home">
          <img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/>
          <span className="brand-divider" aria-hidden="true"/>
          <span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span>
        </a>
        <button className="menu-button" onClick={() => setMenu(!menu)} aria-expanded={menu} aria-label="Open navigation">Menu</button>
        <nav className={menu ? "nav open" : "nav"} aria-label="Primary navigation">
          <a href="#pets" onClick={() => setMenu(false)}>Adopt</a>
          <a href="#matching" onClick={() => setMenu(false)}>AI Match</a>
          <button onClick={() => start("list")}>Rehome</button>
          <a href="/dashboard?tab=Lost%20%26%20found" onClick={() => setMenu(false)}>Lost & Found</a>
          <a href="#help" onClick={() => setMenu(false)}>Rescue & Emergency</a>
          <a href="#cities" onClick={() => setMenu(false)}>Explore your city</a>
        </nav>
       <a
  className="login"
  href={
    isAuthenticated
      ? "/dashboard"
      : "/login?return_to=%2Fdashboard"
  }
>
  {isAuthenticated ? "Dashboard" : "Log in"}
</a>
      </header>


      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow">INDIA’S INTELLIGENT PET ADOPTION NETWORK</div>
          <h1>Adopt love.<br /><em>Find the right fit.</em></h1>
          <p className="lead">A calmer way to discover compatible pets, rehome responsibly and find trusted animal support—without losing sight of welfare.</p>
          <div className="hero-cta-row">
            <button className="hero-cta primary-cta" onClick={() => start("adopt")}>Find my match</button>
            <a className="hero-cta secondary-cta" href="#pets">Browse pets</a>
            <button className="hero-cta outline-cta" onClick={() => start("list")}>Rehome responsibly</button>
          </div>
          <form className="search hero-search" onSubmit={submitSearch}>
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} aria-label="Describe the pet you are looking for" placeholder="Try “calm apartment dog in Indore”"/>
            <button>Search</button>
          </form>
          <div className="hero-trust-row" aria-label="AdoptVilla principles">
            <span><b>✓</b> Free to browse</span>
            <span><b>✓</b> Welfare-led matching</span>
            <span><b>✓</b> Privacy by design</span>
          </div>
        </div>
        <div className="hero-visual">
          <img src="/pets/Home.jpeg" alt="Dogs" />
         
        </div>
      </section>

      <section className="home-services" aria-labelledby="home-services-title">
        <div className="home-section-heading centered">
          <span className="kicker">EVERYTHING IN ONE ADOPTION NETWORK</span>
          <h2 id="home-services-title">Start with what you need today</h2>
          <p>AdoptVilla keeps each task focused, so you can move from discovery to the next safe step without learning the whole platform first.</p>
        </div>
        <div className="home-service-grid">
          <button className="home-service-card" onClick={() => start("adopt")}><span>♡</span><h3>Find a compatible pet</h3><p>Build a lifestyle profile and see explainable matches.</p><em>Start matching →</em></button>
          <a className="home-service-card" href="#pets"><span>⌕</span><h3>Browse adoptable pets</h3><p>Explore published profiles with honest care needs and context.</p><em>View pets →</em></a>
          <button className="home-service-card" onClick={() => start("list")}><span>⌂</span><h3>Rehome responsibly</h3><p>Create a structured profile and privately discover suitable adopters.</p><em>Start a profile →</em></button>
          <a className="home-service-card" href="/dashboard?tab=Lost%20%26%20found"><span>⌖</span><h3>Lost &amp; found</h3><p>Compare privacy-safe community reports and manage a case.</p><em>Open reports →</em></a>
          <button className="home-service-card" onClick={() => start("rescue")}><span>＋</span><h3>Rescue &amp; emergency help</h3><p>Find the most relevant nearby support for the situation.</p><em>Find help →</em></button>
          <button className="home-service-card" onClick={() => { window.location.href = "/indore"; }}><span>✚</span><h3>Explore local care</h3><p>See sourced vets, NGOs, shelters and animal resources by city.</p><em>Explore a city →</em></button>
        </div>
      </section>

      <section className="journey-map home-process" aria-labelledby="journey-map-title">
        <div><span className="kicker">ONE CALM, SHARED JOURNEY</span><h2 id="journey-map-title">Always know what happens next.</h2><p>Each stage shows the current status, who needs to act, and whether anything has actually been submitted, paid or published.</p></div>
        <ol>
          <li><span>1</span><b>Tell us the situation</b><small>Only relevant questions appear.</small></li>
          <li><span>2</span><b>Get useful guidance</b><small>See options before committing.</small></li>
          <li><span>3</span><b>Build the right record</b><small>Autosave and resume safely.</small></li>
          <li><span>4</span><b>Connect with consent</b><small>Personal details stay protected.</small></li>
          <li><span>5</span><b>Complete and follow up</b><small>Support continues after handover.</small></li>
        </ol>
      </section>

      <section className="promo" aria-label="Founding 100 offer">
        <div><span>FOUNDING OFFER</span><b>{promotions.adopter || promotions.pet ? "Eligible early members join free" : "Launch promotion is not currently active"}</b><small>Only confirmed activations and approved publications consume a slot</small></div>
        <div className="counter">{promotions.adopter ? <><b>{promotions.adopter.confirmed}</b><span>/ {promotions.adopter.limit}</span><small>Confirmed adopter activations · {promotions.adopter.remaining} remaining</small></> : <><b>—</b><small>Adopter campaign inactive</small></>}</div>
        <div className="counter">{promotions.pet ? <><b>{promotions.pet.confirmed}</b><span>/ {promotions.pet.limit}</span><small>Approved pets published · {promotions.pet.remaining} remaining</small></> : <><b>—</b><small>Pet campaign inactive</small></>}</div>
        <a className="promo-action" href="/login?return_to=%2Fdashboard%3Ftab%3DActivation%2520%2526%2520payment">Check eligibility →</a>
      </section>

      <section className="section" id="pets">
        <div className="section-heading">
          <div><span className="kicker">MEET YOUR MATCH</span><h2>Pets who may fit your life</h2><p>Every recommendation combines safety rules, lifestyle fit and honest care needs.</p></div>
          <a href="#matching">How matching works →</a>
        </div>
        <div className="filters" aria-label="Pet filters">
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Species"><option>All</option><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option></select>
          <select value={city} onChange={(e) => setCity(e.target.value)} aria-label="City"><option>All cities</option>{cities.map((item) => <option key={item.name}>{item.name}</option>)}</select>
          <button onClick={() => { setType("All"); setCity("All cities"); setQuery(""); }}>Clear filters</button>
          <span>{catalogTotal.real ? `${catalogTotal.real} available pet${catalogTotal.real === 1 ? "" : "s"}` : catalogTotal.demo ? `${catalogTotal.demo} clearly labelled demonstration record${catalogTotal.demo === 1 ? "" : "s"}` : "No published pets found"}</span>
        </div>
        {catalogTotal.demo > 0 && <div className="catalog-demo-note"><b>Testing records are clearly labelled.</b><span>They demonstrate matching and profile features; they are not accepting applications. Approved real listings appear here automatically.</span></div>}
        <div className="pet-grid">
          {catalogPets.map((pet) => (<article className="pet-card" key={pet.id}>
              <div className="pet-image">
                <img src={pet.image} alt={`${pet.name}, ${pet.age} ${pet.type.toLowerCase()}`}/>
                <span>{pet.demo ? "Demonstration record" : pet.photoPending ? "Published · photo pending" : "Published"}</span>
                <button aria-label={`${saved.includes(pet.id) ? "Remove" : "Save"} ${pet.name}`} onClick={() => toggleSaved(pet.id)}>{saved.includes(pet.id) ? "♥" : "♡"}</button>
              </div>
              <div className="pet-body">
                <div><h3>{pet.name}</h3><span>{pet.age} · {pet.sex}</span></div>
                <p>⌖ {pet.city} &nbsp; · &nbsp; {pet.energy} energy</p>
                <div className="tags">{pet.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <a href={`/pets/${encodeURIComponent(pet.id)}`}>View {pet.name}’s full profile <span>→</span></a>
              </div>
            </article>))}
        </div>
        {catalogLoading && !catalogPets.length && <div className="empty" role="status"><b>Loading published pet records…</b><p>We are checking current availability.</p></div>}
        {!catalogLoading && !catalogPets.length && <div className="empty"><b>No suitable pets found yet.</b><p>Broaden a filter or create a match alert—we will not pressure you into a poor fit.</p><button onClick={() => { setType("All"); setCity("All cities"); setQuery(""); }}>Show all pets</button></div>}
        {catalogHasMore && <div className="load-more"><button disabled={catalogLoading} onClick={loadMore}>{catalogLoading ? "Loading…" : "Show more pets"}</button></div>}
      </section>

      <section className="home-numbers" aria-labelledby="home-numbers-title">
        <div className="home-section-heading centered light-heading">
          <span className="kicker light">THE NUMBERS THAT MATTER</span>
          <h2 id="home-numbers-title">Built for useful, accountable animal support</h2>
          <p>Clear records and sourced resources help people make better decisions without pretending every listing is automatically verified or suitable.</p>
        </div>
        <div className="home-number-grid">
          <article><b>{catalogTotal.real || catalogTotal.demo || 0}</b><span>Published pet records</span></article>
          <article><b>{cities.reduce((total, item) => total + (item.resourceCount || 0), 0)}</b><span>Sourced local resources</span></article>
          <article><b>{cities.length}</b><span>Cities indexed</span></article>
          <article><b>2-way</b><span>Consent-first matching</span></article>
        </div>
      </section>

      <section className="matching" id="matching">
        <div>
          <span className="kicker">THE ADOPTVILLA DIFFERENCE</span>
          <h2>A two-way marketplace.<br />Built around welfare.</h2>
          <p>Adopters discover compatible pets. Authorized custodians privately discover compatible adopters. Personal details stay hidden until mutual interest.</p>
          <div className="principle"><b>Rule-based first</b><span>Hard safety checks protect animals and families before any score is shown.</span></div>
          <div className="principle"><b>Explainable always</b><span>See strengths, considerations, missing information and confidence.</span></div>
          <button className="primary" onClick={() => start("adopt")}>Build my compatibility profile →</button>
        </div>
        <div className="match-flow">
          <div className="flow-card person"><span>ILLUSTRATIVE ADOPTER</span><b>Private lifestyle profile</b><small>Home · routine · experience</small><small>Consent-controlled discoverability</small></div>
          <div className="flow-heart"><b>FIT</b><small>RULES + WEIGHTS</small></div>
          <div className="flow-card animal"><span>ILLUSTRATIVE PET</span><b>Structured animal profile</b><small>Medical · behaviour · daily needs</small><small>Ideal-home requirements</small></div>
          <div className="flow-reasons"><b>Why this match</b><span>✓ Exercise needs align</span><span>✓ Experience is suitable</span><span>✓ Alone-time needs fit</span><span className="warning">△ Continued leash training needed</span></div>
        </div>
      </section>

      <section className="section cities" id="cities">
        <div className="section-heading"><div><span className="kicker">EXPLORE YOUR CITY</span><h2>Animal help, close to home</h2><p>Find adoptable pets and verified local resources without exposing private foster locations.</p></div></div>
        <div className="city-grid">{cities.map((item) => <button key={item.name} onClick={() => { var _a; if (item.name === "Indore")
        window.location.href = "/indore";
    else {
        setCity(item.name);
        (_a = document.querySelector("#pets")) === null || _a === void 0 ? void 0 : _a.scrollIntoView({ behavior: "smooth" });
    } }}><span>⌖</span><b>{item.name}</b><small>{item.realPetCount ? `${item.realPetCount} available pet${item.realPetCount === 1 ? "" : "s"}` : item.demoPetCount ? `${item.demoPetCount} demonstration record${item.demoPetCount === 1 ? "" : "s"}` : "No published pets"} · {item.resourceCount} sourced resource{item.resourceCount === 1 ? "" : "s"}</small><em>Explore →</em></button>)}</div>
        {!cities.length && <div className="empty"><b>City records are being prepared.</b><p>Only sourced resources and currently published animal records will be counted here.</p></div>}
      </section>

      <section className="help" id="help">
        <div><span className="kicker light">WHO NEEDS HELP?</span><h2>Start with the situation.<br />We’ll guide the next safe step.</h2></div>
        <div className="help-actions">
          <a href="/dashboard?tab=Lost%20%26%20found"><span>⌕</span><b>I lost or found a pet</b><small>Compare privacy-safe community reports</small></a>
          <button onClick={() => start("rescue")}><span>＋</span><b>I found an injured animal</b><small>Route to suitable nearby help</small></button>
          <button onClick={() => start("list")}><span>⌂</span><b>I’m struggling with my pet</b><small>Explore support before rehoming</small></button>
          <button onClick={() => { window.location.href = "/indore"; }}><span>✚</span><b>I need an emergency vet</b><small>Sourced resources and contact guidance</small></button>
        </div>
        <p>ADOPTVILLA helps you find relevant resources. It does not promise or dispatch a rescue response.</p>
      </section>

      <section className="fee home-fee">
        <div><span className="kicker">WHY ₹99?</span><h2>A small fee. A more intentional journey.</h2><p>The participation fee helps discourage casual or fraudulent activity and supports platform operations. It never guarantees trust or approval—and it is never payment for an animal.</p></div>
        <div><b>₹99</b><span>one adopter journey</span><small>Apply to multiple suitable pets</small></div>
        <div><b>₹99</b><span>one pet publication</span><small>Active until adopted or withdrawn</small></div>
      </section>

      <section className="home-faq" aria-labelledby="home-faq-title">
        <div className="home-section-heading centered">
          <span className="kicker">FREQUENTLY ASKED QUESTIONS</span>
          <h2 id="home-faq-title">Quick answers before you begin</h2>
          <p>AdoptVilla is designed to make the next step clear without hiding important limits or responsibilities.</p>
        </div>
        <div className="faq-list">
          <details><summary>Is AdoptVilla selling animals?</summary><p>No. AdoptVilla is an adoption, responsible rehoming and animal-support network. Participation fees are platform fees, not payments for an animal.</p></details>
          <details><summary>How does AI Match work?</summary><p>Your household and lifestyle answers are compared with structured pet care profiles. Hard safety rules run before fit signals, and the result explains strengths and considerations.</p></details>
          <details><summary>Can I rehome my pet privately?</summary><p>Yes. The rehoming flow is designed around authorized custodians, structured animal records and consent-controlled discovery rather than exposing personal details publicly.</p></details>
          <details><summary>What happens if I find an injured animal?</summary><p>Use Rescue &amp; Emergency to describe the situation and find relevant sourced resources. AdoptVilla helps route information; it does not promise or dispatch a rescue response.</p></details>
          <details><summary>Are every shelter and resource on the platform verified?</summary><p>Verification and source status are shown separately. A directory listing does not automatically mean endorsement or guaranteed availability.</p></details>
        </div>
      </section>

      <section className="home-final-cta">
        <span className="kicker light">READY FOR THE NEXT SAFE STEP?</span>
        <h2>Find the right home—not just any home.</h2>
        <p>Browse pets freely, build an explainable match profile or start a responsible rehoming journey.</p>
        <div>
          <button className="cta-gold" onClick={() => start("adopt")}>Find my match</button>
          <a className="cta-outline" href="#pets">Browse adoptable pets</a>
          <button className="cta-outline" onClick={() => start("list")}>Rehome a pet</button>
        </div>
      </section>

      <footer className="home-footer">
        <div className="footer-grid">
          <div className="footer-about">
            <div className="brand footer-brand"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider" aria-hidden="true"/><span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span></div>
            <p>A welfare-led network for adoption, responsible rehoming, local animal support and explainable compatibility.</p>
          </div>
          <div><b>Quick links</b><a href="#pets">Adopt</a><a href="#matching">AI Match</a><button onClick={() => start("list")}>Rehome</button><a href="#cities">Explore cities</a></div>
          <div><b>Animal support</b><a href="/dashboard?tab=Lost%20%26%20found">Lost &amp; Found</a><button onClick={() => start("rescue")}>Rescue &amp; Emergency</button><button onClick={() => start("offer")}>Offer your help</button><button onClick={() => start("services")}>Local care</button></div>
          <div><b>Your account</b><a href="/login?return_to=%2Fdashboard">Log in</a><a href="/signup">Create account</a><a href="/dashboard">Dashboard</a><a href="/indore">Indore directory</a></div>
        </div>
        <div className="footer-bottom"><span>© 2026 AdoptVilla</span><span>Privacy by design · Welfare first · No commercial pet sales</span></div>
      </footer>

      {journey && <div className="modal-backdrop" role="presentation">
        <section className="modal journey-modal" role="dialog" aria-modal="true" aria-labelledby="journey-title">
          <button className="close" onClick={() => setJourney(null)} aria-label="Close">×</button>
          <div className="progress"><span style={{ width: `${Math.min(step + 1, 3) * 33.33}%` }}/></div>
          {journey === "adopt" && step < 3 && <JourneyAdopt step={step} profile={matchProfile} onChange={updateMatchProfile}/>}
          {journey === "adopt" && step === 3 && <CompatibilityResults results={compatibilityResults} saved={saved} onSave={toggleSaved}/>}
          {journey === "list" && <JourneyList step={step} species={listingSpecies} otherSpecies={otherSpecies} onSpeciesChange={setListingSpecies} onOtherSpeciesChange={setOtherSpecies}/>}
          {journey === "rescue" && <JourneyRescue step={step}/>}
          {journey === "offer" && <JourneyOffer step={step}/>}
          {journey === "services" && <JourneyServices step={step}/>}
          {!(journey === "adopt" && step === 3) && <div className="journey-actions">
            <button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>
            {step < 2 ? <button className="primary" disabled={journey === "list" && step === 1 && listingSpecies === "Other" && !otherSpecies.trim()} onClick={() => setStep(step + 1)}>Continue →</button> : <button className="primary" onClick={() => {
                        if (journey === "rescue") {
                            window.location.href = "/dashboard?tab=Rescue%20%26%20help";
                            return;
                        }
                        if (journey === "services") {
                            window.location.href = "/indore";
                            return;
                        }
                        if (journey === "adopt") {
                            finishCompatibilityProfile();
                            return;
                        }
                        if (journey === "list") {
                            window.location.href = "/login?return_to=%2Fdashboard%3Ftab%3DMy%2520animals";
                            return;
                        }
                        if (journey === "offer") {
                            window.location.href = "/login?return_to=%2Fdashboard%3Ftab%3DFoster";
                            return;
                        }
                    }}>{journey === "services" ? "Show sourced services →" : journey === "rescue" ? "Record and route this case →" : "Continue securely →"}</button>}
          </div>}
          {journey === "adopt" && step === 3 && <div className="journey-actions result-actions"><button onClick={() => setStep(0)}>Update answers</button><button className="primary" onClick={() => setJourney(null)}>Keep these matches →</button></div>}
          <small className="autosave">{journey === "adopt" && step === 3 ? "Your compatibility profile is saved on this device. Scores guide discovery; they do not replace welfare screening or approval." : "This short guide does not publish, charge or contact anyone. Continue securely to save a real private record."}</small>
        </section>
      </div>}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>);
}
function JourneyAdopt({ step, profile, onChange }) {
    return <div className="journey-content">
    <span className="kicker">ADOPTER PROFILE · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["Tell us about your life", "What does home look like?", "What kind of care can you offer?"][step]}</h2>
    <p>{["We match daily reality—not an idealised version of it.", "Private details are never shown in a public directory.", "Preferences guide the match; safety and suitability come first."][step]}</p>
    {step === 0 && <div className="form-grid"><label>City<input value={profile.city} onChange={(event) => onChange("city", event.target.value)}/></label><label>Normal weekday<select value={profile.routine} onChange={(event) => onChange("routine", event.target.value)}><option>Work from home</option><option>Office / hybrid</option><option>Variable schedule</option></select></label><label className="wide">Hours a pet would usually be alone<select value={profile.alone} onChange={(event) => onChange("alone", event.target.value)}><option>Under 2 hours</option><option>2–4 hours</option><option>4–6 hours</option><option>7+ hours</option></select></label></div>}
    {step === 1 && <div className="form-grid"><label>Home type<select value={profile.home} onChange={(event) => onChange("home", event.target.value)}><option>Apartment</option><option>Independent home</option><option>Shared accommodation</option></select></label><label>Tenure<select value={profile.tenure} onChange={(event) => onChange("tenure", event.target.value)}><option>Owned</option><option>Rented</option><option>Family-owned</option></select></label><label className="wide">Does every adult agree?<select value={profile.agreement} onChange={(event) => onChange("agreement", event.target.value)}><option>Yes</option><option>Not yet discussed</option><option>No</option></select></label></div>}
    {step === 2 && <div className="form-grid"><label>Daily exercise time<select value={profile.exercise} onChange={(event) => onChange("exercise", event.target.value)}><option>30–60 minutes</option><option>60–90 minutes</option><option>90+ minutes</option></select></label><label>Experience<select value={profile.experience} onChange={(event) => onChange("experience", event.target.value)}><option>First-time pet parent</option><option>Some experience</option><option>Experienced</option></select></label><label className="wide">Discoverability<select value={profile.discoverability} onChange={(event) => onChange("discoverability", event.target.value)}><option>Verified custodians may invite me</option><option>Verified NGOs/shelters only</option><option>I will search myself</option></select></label></div>}
  </div>;
}
function CompatibilityResults({ results, saved, onSave }) {
    return <div className="journey-content compatibility-results">
    <span className="kicker">YOUR COMPATIBILITY PROFILE · COMPLETE</span>
    <h2 id="journey-title">Your closest current matches</h2>
    <p>Each score reflects the information you entered and the pet profile currently available. Missing information lowers confidence.</p>
    {!results.length && <div className="empty"><b>No published pets are available to score yet.</b><p>Your profile is saved. New pets can be compared as they are approved.</p></div>}
    <div className="compatibility-list">{results.slice(0, 4).map(({ pet, score, strengths, considerations }, index) => <article key={pet.id}>
      <div className="compatibility-photo"><img src={pet.image} alt=""/><span>#{index + 1}</span></div>
      <div className="compatibility-copy"><div><h3>{pet.name}</h3><small>{pet.age} · {pet.city} · {pet.energy} energy</small></div><div className="guide-score"><b>{score}%</b><span>fit</span></div><div className="compatibility-bar"><i style={{ width: `${score}%` }}/></div><ul>{(strengths.length ? strengths : ["No hard incompatibility was found in your answers"]).map((item) => <li className="positive" key={item}>✓ {item}</li>)}{considerations.map((item) => <li key={item}>△ {item}</li>)}</ul><div className="compatibility-buttons"><a href={`/pets/${encodeURIComponent(pet.id)}`}>View full profile →</a><button onClick={() => onSave(pet.id)}>{saved.includes(pet.id) ? "♥ Saved" : "♡ Save pet"}</button></div></div>
    </article>)}</div>
  </div>;
}
function JourneyList({ step, species, otherSpecies, onSpeciesChange, onOtherSpeciesChange }) {
    return <div className="journey-content">
    <span className="kicker">RESPONSIBLE REHOMING · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["Your relationship to the animal", "Tell us who they are", "Can we help them stay?"][step]}</h2>
    <p>{["Only an authorized custodian may publish a pet.", "Honest medical and behaviour details lead to safer homes.", "We offer support before you decide to rehome. You remain in control."][step]}</p>
    {step === 0 && <div className="form-grid"><label>I am the<select><option>Current pet parent</option><option>Independent rescuer</option><option>Foster parent</option><option>NGO / shelter coordinator</option></select></label><label>Current city<input defaultValue="Indore"/></label><label className="wide">Authority declaration<select><option>I am authorized to make placement decisions</option><option>I need help confirming authority</option></select></label></div>}
    {step === 1 && <div className="form-grid"><label>Pet name<input placeholder="e.g. Bruno"/></label><label>Species<select value={species} onChange={(event) => onSpeciesChange(event.target.value)}><option>Dog</option><option>Cat</option><option>Other</option></select></label>{species === "Other" && <label className="wide">Which animal?<input value={otherSpecies} onChange={(event) => onOtherSpeciesChange(event.target.value)} placeholder="For example: rabbit, guinea pig or bird" required autoFocus/><small className="field-help">Please identify the species so adopters understand exactly which animal needs a home.</small></label>}<label>Age<input placeholder="e.g. 3 years"/></label><label>Energy<select><option>Low</option><option>Moderate</option><option>High</option><option>Very high</option></select></label></div>}
    {step === 2 && <div className="support-box"><button>Behaviour or training support</button><button>Temporary foster or boarding</button><button>Medical or veterinary support</button><button>Continue with responsible rehoming</button></div>}
  </div>;
}
function JourneyRescue({ step }) {
    return <div className="journey-content">
    <span className="kicker">FIND ANIMAL HELP · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["Is anyone in immediate danger?", "Where is the animal?", "What support seems needed?"][step]}</h2>
    <p>{["Move only if it is safe. For human emergencies, contact local emergency services.", "An approximate location is enough for the first step.", "We route information to relevant resources; this does not guarantee a response."][step]}</p>
    {step === 0 && <div className="support-box"><button>Road accident / severe bleeding</button><button>Injured but stable</button><button>Abandoned young animals</button><button>Animal cruelty concern</button></div>}
    {step === 1 && <div className="form-grid"><label>City<input defaultValue="Indore"/></label><label>Locality<input placeholder="Approximate area"/></label><label className="wide">Safe callback number<input placeholder="+91" inputMode="tel"/></label></div>}
    {step === 2 && <div className="support-box"><button>Emergency veterinarian</button><button>Animal ambulance</button><button>Experienced rescuer / NGO</button><button>Temporary foster</button></div>}
  </div>;
}
function JourneyOffer({ step }) {
    return <div className="journey-content">
    <span className="kicker">OFFER HELP · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["How would you like to help?", "What can you realistically offer?", "Where should we look?"][step]}</h2>
    <p>{["Choose one or more ways to help. We will only ask questions relevant to those capabilities.", "Boundaries help us suggest safe, achievable opportunities.", "Your exact home address and private details are never shown publicly."][step]}</p>
    {step === 0 && <div className="support-box"><button>Foster temporarily</button><button>Volunteer with an organization</button><button>Provide transport</button><button>Offer professional help</button><button>Sponsor care or supplies</button></div>}
    {step === 1 && <div className="form-grid"><label>Usual availability<select><option>Weekends</option><option>Weekday mornings</option><option>Weekday evenings</option><option>Flexible / on call</option></select></label><label>Travel radius<select><option>Within 5 km</option><option>Within 15 km</option><option>Within 30 km</option></select></label><label className="wide">Important limits<input placeholder="For example: no overnight fostering"/></label></div>}
    {step === 2 && <div className="form-grid"><label>City<input defaultValue="Indore"/></label><label>Approximate locality<input placeholder="Area or PIN code"/></label><label className="wide">Opportunity alerts<select><option>Immediate needs only</option><option>Daily digest</option><option>Weekly digest</option><option>Do not notify me</option></select></label></div>}
  </div>;
}
function JourneyServices({ step }) {
    return <div className="journey-content">
    <span className="kicker">LOCAL ANIMAL SERVICES · STEP {step + 1} OF 3</span>
    <h2 id="journey-title">{["What are you looking for?", "Where do you need it?", "What matters right now?"][step]}</h2>
    <p>{["Choose the service, not the organization type. We will translate your need into suitable resources.", "An approximate area is enough. Private locations are never exposed.", "Verification and freshness are shown separately; listed does not mean endorsed."][step]}</p>
    {step === 0 && <div className="support-box"><button>Veterinary care</button><button>24/7 emergency vet</button><button>NGO or rescuer</button><button>Shelter</button><button>Animal transport</button><button>Training or behaviour support</button></div>}
    {step === 1 && <div className="form-grid"><label>City<input defaultValue="Indore"/></label><label>Locality or PIN code<input placeholder="Approximate area"/></label><label className="wide">Search radius<select><option>Within 5 km</option><option>Within 15 km</option><option>Anywhere in the city</option></select></label></div>}
    {step === 2 && <div className="form-grid"><label>Availability<select><option>Open now</option><option>Today</option><option>Any time</option></select></label><label>Home visit needed?<select><option>No preference</option><option>Yes</option><option>No</option></select></label><label className="wide">Accessibility or language needs<input placeholder="Optional"/></label></div>}
  </div>;
}
