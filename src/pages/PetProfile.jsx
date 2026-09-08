import { useEffect, useState } from "react";
import Link from "../components/Link.jsx";
import PetActions from "../components/PetActions.jsx";
import { publicPets } from "../data/mockData.js";
import { fetchPublishedPet } from "../catalogSupabase.js";
function text(value, fallback = "Not yet recorded") {
    const output = String(value !== null && value !== void 0 ? value : "").trim();
    return output || fallback;
}
function yesNo(value) {
    return value === true || String(value).toUpperCase() === "YES" ? "Yes" : "Not confirmed";
}
export default function PetProfilePage({ petId }) {
    var _a, _b, _c, _d, _e;

    // Mock/demo pet fallback
    const fallbackPet =
        publicPets.find(
            (item) =>
                String(item.id) === String(petId)
        ) || null;

    // Real selected pet
    const [pet, setPet] =
        useState(fallbackPet);

    const [loading, setLoading] =
        useState(!fallbackPet);

    const [loadError, setLoadError] =
        useState("");


    useEffect(() => {
        let cancelled = false;

        async function loadSelectedPet() {
            setLoading(true);
            setLoadError("");

            try {
                // SAME ID jo landing card se URL me aayi hai
                const selectedPet =
                    await fetchPublishedPet(petId);

                if (cancelled) return;

                // Real Supabase pet mila
                if (selectedPet) {
                    setPet(selectedPet);
                    return;
                }

                // Supabase me nahi mila lekin demo/mock pet hai
                const mockPet =
                    publicPets.find(
                        (item) =>
                            String(item.id) ===
                            String(petId)
                    ) || null;

                if (mockPet) {
                    setPet(mockPet);
                    return;
                }

                setPet(null);
                setLoadError(
                    "Pet profile not found."
                );

            } catch (error) {

                if (cancelled) return;

                // Supabase fail hua to demo pet try karo
                const mockPet =
                    publicPets.find(
                        (item) =>
                            String(item.id) ===
                            String(petId)
                    ) || null;

                if (mockPet) {
                    setPet(mockPet);
                } else {
                    setPet(null);

                    setLoadError(
                        error instanceof Error
                            ? error.message
                            : "Pet profile could not be loaded."
                    );
                }

            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }


        loadSelectedPet();


        return () => {
            cancelled = true;
        };

    }, [petId]);


    // Supabase se pet aa raha hai
    if (loading && !pet) {
        return (
            <main className="purpose-shell">
                <section className="purpose-panel">
                    <span className="kicker">
                        PET PROFILE
                    </span>

                    <h1>
                        Loading pet profile…
                    </h1>
                </section>
            </main>
        );
    }


    // Invalid / deleted pet
    if (!pet) {
        return (
            <main className="purpose-shell">
                <section className="purpose-panel">
                    <span className="kicker">
                        PET PROFILE
                    </span>

                    <h1>
                        Pet not found
                    </h1>

                    <p>
                        {loadError ||
                            "This pet profile is not available."}
                    </p>

                    <Link href="/#pets">
                        ← Browse pets
                    </Link>
                </section>
            </main>
        );
    }
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: `${pet.name} — adoption profile`,
        description: `${pet.age} ${pet.breed} in ${pet.city}`,
        image: pet.image,
        datePublished: (_a = pet.publishedAt) !== null && _a !== void 0 ? _a : undefined,
        about: { "@type": "Thing", name: `${pet.name}, ${pet.species}` },
    };
    return <main className="public-pet-page">
    <header className="site-header public-pet-header">
      <Link className="brand" href="/" aria-label="ADOPTVILLA home">
        <img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/>
        <span className="brand-divider" aria-hidden="true"/>
        <span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span>
      </Link>
      <nav className="nav" aria-label="Pet profile navigation">
        <Link href="/#pets">Browse pets</Link>
        <Link href="/#matching">How matching works</Link>
        <Link href="/indore">City help</Link>
      </nav>
      <a className="login" href="/login?return_to=%2Fdashboard">Log in</a>
    </header>

    {pet.demo && <div className="demo-record-banner"><b>Demonstration record</b><span>This sample profile lets you test the experience. It is not accepting adoption applications.</span></div>}

    <section className="public-pet-hero">
      <div className="public-pet-gallery">
        <img src={pet.image} alt={`${pet.name}, ${pet.age} ${pet.species.toLowerCase()}`}/>
        {pet.photoPending && <span>Custodian photo pending review</span>}
      </div>
      <div className="public-pet-intro">
        <span className="kicker">{pet.species} · {pet.city}</span>
        <h1>{pet.name}</h1>
        <p className="public-pet-summary">{pet.age} · {pet.sex} · {pet.breed} · {pet.size}</p>
        {pet.localityApprox && <p className="privacy-location">Approximate area: {pet.localityApprox}. Exact location remains private.</p>}
        <div className="tags">{pet.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
        <PetActions petId={pet.id} petName={pet.name} demo={pet.demo}/>
        <p className="public-pet-safety">An individual compatibility result appears only after you complete a private adopter profile. No animal is sold or auctioned on Adoptvilla.</p>
      </div>
    </section>

    <div className="public-pet-layout">
      <article className="public-pet-content">
        <section>
          <span className="kicker">MY STORY</span>
          <h2>Meet {pet.name}</h2>
          <p>{pet.story}</p>
          {pet.origin && <dl className="profile-facts"><div><dt>How they came into care</dt><dd>{pet.origin}</dd></div>{pet.rehomingReason && <div><dt>Reason for rehoming</dt><dd>{pet.rehomingReason}</dd></div>}</dl>}
        </section>

        <section>
          <span className="kicker">PERSONALITY & BEHAVIOUR</span>
          <h2>What daily life may feel like</h2>
          <dl className="profile-facts">
            <div><dt>Energy</dt><dd>{pet.energy}</dd></div>
            <div><dt>House trained</dt><dd>{yesNo(pet.behaviour.houseTrained)}</dd></div>
            <div><dt>Leash skills</dt><dd>{text(pet.behaviour.leashSkills)}</dd></div>
            <div><dt>Alone-time notes</dt><dd>{text(pet.behaviour.aloneTimeNotes)}</dd></div>
          </dl>
        </section>

        <section>
          <span className="kicker">GOOD WITH</span>
          <h2>Current assessment</h2>
          {pet.goodWith.length ? <ul className="positive-list">{pet.goodWith.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Compatibility with children and other animals has not yet been confirmed. Careful introductions remain essential.</p>}
        </section>

        <section>
          <span className="kicker">HEALTH</span>
          <h2>Medical information provided</h2>
          <dl className="profile-facts">
            <div><dt>Vaccination</dt><dd>{pet.medical.vaccinated ? "Reported as current" : "Not confirmed"}</dd></div>
            <div><dt>Rabies</dt><dd>{pet.medical.rabies ? "Reported as current" : "Not confirmed"}</dd></div>
            <div><dt>Deworming</dt><dd>{pet.medical.dewormed ? "Reported as current" : "Not confirmed"}</dd></div>
            <div><dt>Sterilized</dt><dd>{pet.medical.sterilized ? "Yes" : "Not confirmed"}</dd></div>
            <div><dt>Conditions</dt><dd>{(_b = pet.medical.conditions) !== null && _b !== void 0 ? _b : "None disclosed"}</dd></div>
            <div><dt>Medication</dt><dd>{(_c = pet.medical.medications) !== null && _c !== void 0 ? _c : "None disclosed"}</dd></div>
          </dl>
          <p className="information-note">“Provided” is not the same as veterinarian-verified. Verification badges are shown only when evidence has been reviewed.</p>
        </section>

        <section>
          <span className="kicker">THINGS YOU SHOULD KNOW</span>
          <h2>Honest considerations</h2>
          {pet.considerations.length ? <ul className="consideration-list">{pet.considerations.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No specific concern has been recorded, but compatibility and temperament can never be guaranteed.</p>}
        </section>
      </article>

      <aside className="public-pet-sidebar">
        <section>
          <span className="kicker">DAILY NEEDS</span>
          <h2>Care commitment</h2>
          {pet.dailyNeeds.length ? <ul>{pet.dailyNeeds.map((item) => <li key={item}>{item}</li>)}</ul> : <p>Daily-care guidance is still being completed.</p>}
        </section>
        <section>
          <span className="kicker">IDEAL HOME</span>
          <h2>What may work best</h2>
          <dl className="sidebar-facts">
            <div><dt>Apartment suitable</dt><dd>{yesNo(pet.idealHome.apartmentSuitable)}</dd></div>
            <div><dt>Experienced handler</dt><dd>{yesNo(pet.idealHome.experiencedHandlerRequired)}</dd></div>
            <div><dt>Maximum alone time</dt><dd>{pet.idealHome.maxAloneHours != null ? `${pet.idealHome.maxAloneHours} hours` : "Not recorded"}</dd></div>
            <div><dt>Climate</dt><dd>{text(pet.idealHome.climate)}</dd></div>
          </dl>
        </section>
        <section>
          <span className="kicker">CURRENT CUSTODIAN</span>
          <h2>{(_e = (_d = pet.organization) === null || _d === void 0 ? void 0 : _d.name) !== null && _e !== void 0 ? _e : "Private authorized custodian"}</h2>
          {pet.organization ? <p>{pet.organization.type} · Verification status: {pet.organization.verificationStatus.replaceAll("_", " ").toLowerCase()}</p> : <p>Contact details remain hidden until the controlled matching workflow allows contact.</p>}
          <p className="profile-completeness">{pet.completeness}% profile complete</p>
        </section>
        <a className="report-listing" href={`/login?return_to=${encodeURIComponent(`/dashboard?tab=Trust & safety&reportType=PET&reportId=${pet.id}`)}`}>Report this listing privately →</a>
        <small className="record-id">Adoptvilla record: {pet.id}</small>
      </aside>
    </div>

    <footer className="public-pet-footer">
      <Link href="/#pets">← Browse more pets</Link>
      <p>Find the Right Home. Not Just Any Home.</p>
    </footer>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}/>
  </main>;
}
