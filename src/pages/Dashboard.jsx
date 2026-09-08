"use client";
import { useEffect, useRef, useState } from "react";
import Link from "../components/Link.jsx";
const tabs = ["Today", "Pet Fit Guide", "My profile", "My animals", "Saved pets", "Lost & found", "Rescue & help", "Foster", "Activation & payment", "Find adopters", "Best matches", "Pet compatibility", "Activity", "Messages", "Adoption journey", "After adoption", "Notifications", "Trust & safety", "Directory corrections", "Manage", "Review queue", "Settings"];
const tabDescriptions = {
  "Today": "Your priority actions, saved work and account status in one place.",
  "Pet Fit Guide": "Build a private lifestyle profile and discover animals that suit your real routine.",
  "My profile": "Keep household, home and care information accurate for safer matching.",
  "My animals": "Create and manage structured animal records without exposing private contact details.",
  "Saved pets": "Review animals you saved and continue the right next step when you are ready.",
  "Lost & found": "Create privacy-safe reports, compare possible matches and coordinate reunions.",
  "Rescue & help": "Record a situation once and route it toward relevant welfare resources.",
  "Foster": "Manage foster availability, offers and temporary-care coordination.",
  "Activation & payment": "Review platform participation, documents, receipts and refund actions.",
  "Find adopters": "Review suitable adopter summaries without exposing private household data.",
  "Best matches": "Compare explainable recommendations generated from active animal records.",
  "Pet compatibility": "Understand one animal-specific fit result, including strengths and considerations.",
  "Activity": "Track applications, invitations and important changes across your adoption journey.",
  "Messages": "Keep consent-based conversations organized in one secure workspace.",
  "Adoption journey": "Follow each adoption stage, ownership handover and required next action.",
  "After adoption": "Complete check-ins, request support and coordinate safe returns when needed.",
  "Notifications": "Choose how important account and welfare updates reach you.",
  "Trust & safety": "Report concerns privately and review verification or moderation status.",
  "Directory corrections": "Submit sourced corrections for local animal-care directory records.",
  "Manage": "Operate shelter and organization workflows from a structured workspace.",
  "Review queue": "Review records that need accountable human decisions before publication.",
  "Settings": "Manage account preferences, communication details and workspace configuration."
};
async function platform(body) {
    var _a;
    const response = await fetch("/api/platform", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const text = await response.text();
    let data = {};
    if (text.trim()) {
        try {
            data = JSON.parse(text);
        }
        catch (_b) {
            throw new Error(response.ok ? "The server returned an unreadable response. Please try again." : "The suitability service could not complete this request. Please try again.");
        }
    }
    if (!response.ok)
        throw new Error(String((_a = data.error) !== null && _a !== void 0 ? _a : "The suitability service could not complete this request. Please try again."));
    if (!text.trim())
        throw new Error("The suitability service returned no result. Please try again.");
    return data;
}
function mediaSrc(mediaId) {
  const value = String(mediaId || "");

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  return `/api/media?mediaId=${encodeURIComponent(value)}`;
}
export default function DashboardClient({ user, initial, signOutPath }) {
    var _a, _b, _c;
    const [tab, setTab] = useState("Today");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const [matches, setMatches] = useState([]);
    const [matchRun, setMatchRun] = useState(null);
    const [workflow, setWorkflow] = useState([]);
    const [onboardingComplete, setOnboardingComplete] = useState((_b = (_a = initial.roles) === null || _a === void 0 ? void 0 : _a.some(({ role }) => role === "ONBOARDING_COMPLETE")) !== null && _b !== void 0 ? _b : false);
    const [targetPetId, setTargetPetId] = useState("");
    const [petCompatibility, setPetCompatibility] = useState(null);
    const [targetLoading, setTargetLoading] = useState(false);
    useEffect(() => {
        const timer = window.setTimeout(async () => {
            var _a;
            const requested = new URLSearchParams(window.location.search).get("tab");
            const requestedPetId = (_a = new URLSearchParams(window.location.search).get("petId")) !== null && _a !== void 0 ? _a : "";
            if (requestedPetId) {
                setTargetPetId(requestedPetId);
                if (initial.adopterProfile) {
                    setTargetLoading(true);
                    try {
                        const result = await platform({ action: "calculate-pet-match", petId: requestedPetId });
                        setPetCompatibility(result);
                        setTab("Pet compatibility");
                    }
                    catch (error) {
                        setNotice(error instanceof Error ? error.message : "Complete your profile to check this pet.");
                        setTab("Pet Fit Guide");
                    }
                    finally {
                        setTargetLoading(false);
                    }
                }
                else {
                    setTab("Pet Fit Guide");
                }
            }
            else if (requested && tabs.includes(requested))
                setTab(requested);
        }, 0);
        return () => window.clearTimeout(timer);
    }, [initial.adopterProfile]);
    const run = async (fn, success) => {
        setBusy(true);
        setNotice("");
        try {
            await fn();
            setNotice(success);
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : "Something went wrong.");
        }
        finally {
            setBusy(false);
        }
    };
    if (!onboardingComplete) {
        return <PurposeOnboarding user={user} busy={busy} signOutPath={signOutPath} onComplete={async (roles) => {
                setBusy(true);
                setNotice("");
                try {
                    await platform({ action: "set-account-purpose", roles });
                    setOnboardingComplete(true);
                    setTab(roles.includes("ADOPTER") ? targetPetId ? "Pet Fit Guide" : "My profile" : "My animals");
                }
                catch (error) {
                    setNotice(error instanceof Error ? error.message : "Something went wrong.");
                }
                finally {
                    setBusy(false);
                }
            }} notice={notice}/>;
    }
    return <main className="dashboard-shell">
    <aside className="dashboard-sidebar">
      <Link className="brand dashboard-brand" href="/"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider" aria-hidden="true"/><span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span></Link>
      <nav>{tabs.map((item) => <button className={tab === item ? "active" : ""} key={item} onClick={() => setTab(item)}>{item}</button>)}</nav>
      {((_c = initial.roles) === null || _c === void 0 ? void 0 : _c.some(({ role }) => role === "SUPER_ADMIN")) && <a className="dashboard-admin-link" href="/admin">Open Super Admin →</a>}
      <a className="dashboard-signout" href={signOutPath}>Sign out</a>
    </aside>
    <section className="dashboard-main">
      <header className="dashboard-top"><div className="dashboard-title-block"><span>SECURE WORKSPACE</span><h1>{tab}</h1><p>{tabDescriptions[tab]}</p></div><div className="account-chip"><b>{user.fullName}</b><small>{user.email}</small></div></header>
      {notice && <div className="dashboard-notice" role="status">{notice}</div>}
      {tab === "Today" && <Overview data={initial} onNavigate={setTab}/>}
      {tab === "Pet Fit Guide" && <PetFitGuide busy={busy || targetLoading} targetPetId={targetPetId} onComplete={async (profile) => {
                var _a, _b, _c, _d;
                setBusy(true);
                setNotice("");
                try {
                    await platform({ action: "save-adopter-profile", profile });
                    if (targetPetId) {
                        const data = await platform({ action: "calculate-pet-match", petId: targetPetId });
                        setPetCompatibility(data);
                        setTab("Pet compatibility");
                        setNotice("Your private profile is saved. This result is specific to the animal you selected.");
                        window.scrollTo({ top: 0, behavior: "smooth" });
                        return;
                    }
                    const data = await platform({ action: "calculate-matches" });
                    setMatches(((_a = data.matches) !== null && _a !== void 0 ? _a : []));
                    setMatchRun({ evaluated: Number((_b = data.evaluatedCount) !== null && _b !== void 0 ? _b : ((_c = data.matches) !== null && _c !== void 0 ? _c : []).length), excluded: Number((_d = data.excludedCount) !== null && _d !== void 0 ? _d : 0) });
                    setTab("Best matches");
                    setNotice("Your private fit profile is saved. These recommendations use individual animal records; breed is only optional guidance.");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
                catch (error) {
                    setNotice(error instanceof Error ? error.message : "Something went wrong.");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                }
                finally {
                    setBusy(false);
                }
            }}/>}
    {tab === "My profile" && (
  <AdopterForm
    initial={initial.adopterProfile}
    busy={busy}
    draftOwner={String(user.id || user.email)}
    onSave={(profile) =>
      run(
        () =>
          platform({
            action: "save-adopter-profile",
            profile,
          }),
        "Saved. Your profile remains private; nothing was activated or charged."
      )
    }
  />
)}

{tab === "My animals" && (
  <PetForm
    pets={initial.pets}
    busy={busy}
    draftOwner={String(user.id || user.email)}
    onSave={async (pet) =>
      platform({
        action: "save-pet",
        pet,
      })
    }
    onNotice={setNotice}
  />
)}
      {tab === "Saved pets" && <SavedPetsPanel />}
      {tab === "Lost & found" && <LostFoundNetwork organizations={initial.organizations}/>}
      {tab === "Rescue & help" && <RescueNetwork organizations={initial.organizations} directory={initial.directory}/>}
      {tab === "Foster" && <FosterNetwork />}
      {tab === "Activation & payment" && <ActivationPanel profile={initial.adopterProfile} pets={initial.pets} payments={initial.payments}/>}
      {tab === "Find adopters" && <AdopterCandidates />}
      {tab === "Best matches" && <Matches matches={matches} matchRun={matchRun} busy={busy} onApply={(matchId) => run(async () => { await platform({ action: "create-application", matchId }); }, "Application submitted. The custodian can now review your interest.")} onCalculate={() => run(async () => { var _a, _b, _c, _d; const data = await platform({ action: "calculate-matches" }); setMatches(((_a = data.matches) !== null && _a !== void 0 ? _a : [])); setMatchRun({ evaluated: Number((_b = data.evaluatedCount) !== null && _b !== void 0 ? _b : ((_c = data.matches) !== null && _c !== void 0 ? _c : []).length), excluded: Number((_d = data.excludedCount) !== null && _d !== void 0 ? _d : 0) }); }, "Matches recalculated using the active explainable ruleset.")}/>}
      {tab === "Pet compatibility" && <PetCompatibilityPanel result={petCompatibility} busy={busy || targetLoading} onProfile={() => setTab("My profile")} onActivation={() => setTab("Activation & payment")} onRecalculate={() => run(async () => {
                if (!targetPetId)
                    throw new Error("Choose a published pet before recalculating.");
                const data = await platform({ action: "calculate-pet-match", petId: targetPetId });
                setPetCompatibility(data);
            }, "Compatibility recalculated using your latest profile and the current animal record.")} onApply={(matchId) => run(async () => {
                const application = await platform({ action: "create-application", matchId });
                setPetCompatibility((current) => current ? Object.assign(Object.assign({}, current), { application: { id: application.applicationId, status: "SUBMITTED" } }) : current);
            }, "Application submitted. The custodian can now review your interest.")}/>}
      {tab === "Activity" && <WorkflowPanel records={workflow} busy={busy} onLoad={async () => { var _a; const response = await fetch("/api/platform?resource=workflow"); const data = await response.json(); if (!response.ok)
        throw new Error(data.error); setWorkflow((_a = data.applications) !== null && _a !== void 0 ? _a : []); }} onMutual={(applicationId) => run(async () => { var _a; await platform({ action: "confirm-mutual-interest", applicationId }); const response = await fetch("/api/platform?resource=workflow"); const data = await response.json(); setWorkflow((_a = data.applications) !== null && _a !== void 0 ? _a : []); }, "Mutual interest confirmed. Secure chat is now available.")} onTransition={(applicationId, next) => run(async () => { var _a; await platform({ action: "transition-application", applicationId, next }); const response = await fetch("/api/platform?resource=workflow"); const data = await response.json(); setWorkflow((_a = data.applications) !== null && _a !== void 0 ? _a : []); }, `Application moved to ${next.replaceAll("_", " ").toLowerCase()}.`)}/>}
      {tab === "Messages" && <ChatPanel records={workflow} onLoad={async () => { var _a; const response = await fetch("/api/platform?resource=workflow"); const data = await response.json(); if (!response.ok)
        throw new Error(data.error); setWorkflow((_a = data.applications) !== null && _a !== void 0 ? _a : []); }}/>}
      {tab === "Adoption journey" && <JourneyPanel records={workflow} onLoad={async () => { var _a; const response = await fetch("/api/platform?resource=workflow"); const data = await response.json(); if (!response.ok)
        throw new Error(data.error); setWorkflow((_a = data.applications) !== null && _a !== void 0 ? _a : []); }}/>}
      {tab === "After adoption" && <PostAdoptionPanel />}
      {tab === "Notifications" && <NotificationCentre records={initial.notifications}/>}
      {tab === "Trust & safety" && <TrustSafetyCentre />}
      {tab === "Directory corrections" && <DirectoryFeedback />}
      {tab === "Manage" && <ShelterCrmPanel organizations={initial.organizations}/>}
      {tab === "Review queue" && <RecordList title="Items needing review" records={initial.moderation} empty="No cases are assigned to you."/>}
      {tab === "Settings" && <ProviderPanel />}
    </section>
  </main>;
}
function PurposeOnboarding({ user, busy, signOutPath, onComplete, notice }) {
    const [selected, setSelected] = useState([]);
    const toggle = (role) => setSelected((current) => current.includes(role) ? current.filter((item) => item !== role) : [...current, role]);
    return <main className="purpose-shell">
    <header className="purpose-header">
      <Link className="brand" href="/"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider" aria-hidden="true"/><span><b>ADOPTVILLA</b><small>THE ADOPTION NETWORK</small></span></Link>
      <div className="account-chip"><b>{user.fullName}</b><small>{user.email}</small></div>
    </header>
    <section className="purpose-panel" aria-labelledby="purpose-title">
      <span className="kicker">WELCOME TO ADOPTVILLA</span>
      <h1 id="purpose-title">What brings you here?</h1>
      <p>Choose one or both. We’ll prepare the right workspace and only ask questions relevant to what you want to do.</p>
      {notice && <div className="dashboard-notice" role="alert">{notice}</div>}
      <div className="purpose-options">
        <button className={selected.includes("ADOPTER") ? "selected" : ""} onClick={() => toggle("ADOPTER")} aria-pressed={selected.includes("ADOPTER")}>
          <span className="purpose-icon" aria-hidden="true">♡</span><small>I WANT TO</small><b>Adopt a pet</b><p>Build a private lifestyle profile, receive compatible matches and apply to suitable pets.</p><em>{selected.includes("ADOPTER") ? "Selected ✓" : "Choose adopter journey"}</em>
        </button>
        <button className={selected.includes("PET_CUSTODIAN") ? "selected" : ""} onClick={() => toggle("PET_CUSTODIAN")} aria-pressed={selected.includes("PET_CUSTODIAN")}>
          <span className="purpose-icon" aria-hidden="true">⌂</span><small>I NEED TO</small><b>Find a home for an animal</b><p>Create a responsible pet profile, review suitable adopters and manage the rehoming journey.</p><em>{selected.includes("PET_CUSTODIAN") ? "Selected ✓" : "Choose rehoming journey"}</em>
        </button>
      </div>
      <div className="purpose-actions"><span>You can add or change roles later in Settings.</span><button className="primary" disabled={busy || !selected.length} onClick={() => onComplete(selected)}>{busy ? "Preparing your workspace…" : selected.length > 1 ? "Continue with both →" : "Continue →"}</button></div>
      <a className="purpose-signout" href={signOutPath}>Not your account? Sign out</a>
    </section>
  </main>;
}
function Overview({ data, onNavigate }) {
    var _a;
    const cards = [
        ["Profile", data.adopterProfile ? `${(_a = data.adopterProfile.completeness) !== null && _a !== void 0 ? _a : 0}% complete` : "Not started", "My profile"],
        ["My animals", String(data.pets.length), "My animals"],
        ["Applications", String(data.applications.length), "Activity"],
        ["Invitations", String(data.invitations.length), "Activity"],
    ];
    return <><div className="dashboard-cards">{cards.map(([label, value, target]) => <button key={label} onClick={() => onNavigate(target)}><span>{label}</span><b>{value}</b><small>Open →</small></button>)}</div>
    <div className="dashboard-grid"><article><span className="kicker">YOUR NEXT ACTION</span><h2>{data.adopterProfile ? "Review your best matches" : "Build your compatibility profile"}</h2><p>{data.adopterProfile ? "You are ready to review explainable recommendations. Nothing else needs action right now." : "Complete a private profile to receive meaningful matches. You can save and return at any time."}</p><button className="primary" onClick={() => onNavigate(data.adopterProfile ? "Best matches" : "My profile")}>{data.adopterProfile ? "Review matches →" : "Start my profile →"}</button></article>
    <article><span className="kicker">PRIVACY</span><h2>People stay private.</h2><p>Your address, phone, documents and household details never become a public directory. Reverse search uses only a privacy-safe summary.</p></article></div></>;
}
const fitQuestions = [
    { key: "species", eyebrow: "THE ANIMAL", title: "Which kind of companion are you open to?", subtitle: "Choose what you genuinely want—or stay open and let suitability lead.", options: [["Dog", "Dog"], ["Cat", "Cat"], ["Small mammal", "Rabbit or small mammal"], ["Bird", "Bird"], ["", "Open to recommendations"]] },
    { key: "homeType", eyebrow: "YOUR HOME", title: "What kind of home will you share?", subtitle: "Space matters, but routine and safe indoor care matter more.", options: [["APARTMENT", "Apartment"], ["INDEPENDENT_HOME", "Independent home"], ["SHARED", "Shared accommodation"], ["FARM", "Farm or large property"]] },
    { key: "household", eyebrow: "YOUR HOUSEHOLD", title: "Who must this animal comfortably live with?", subtitle: "This becomes a safety check, not merely a preference.", options: [["ADULTS", "Adults only"], ["YOUNG_CHILDREN", "Young children"], ["DOG", "A resident dog"], ["CAT", "A resident cat"]] },
    { key: "aloneHours", eyebrow: "YOUR ROUTINE", title: "How long would the animal usually be alone?", subtitle: "Use a normal weekday, not your best-case day.", options: [["2", "Up to 2 hours"], ["4", "Up to 4 hours"], ["6", "Up to 6 hours"], ["8", "7–8 hours"]] },
    { key: "exerciseMinutes", eyebrow: "ACTIVITY", title: "How much active time can you reliably offer each day?", subtitle: "For cats, birds and small mammals, this includes play and enrichment.", options: [["30", "About 30 minutes"], ["60", "About 1 hour"], ["90", "Around 90 minutes"], ["120", "2 hours or more"]] },
    { key: "experience", eyebrow: "EXPERIENCE", title: "What care experience do you have?", subtitle: "Honest answers protect both people and animals.", options: [["FIRST_TIME", "First-time pet parent"], ["SOME", "Some practical experience"], ["EXPERIENCED", "Experienced caregiver"]] },
    { key: "care", eyebrow: "CARE CAPACITY", title: "What level of ongoing care can you manage?", subtitle: "Medical, grooming and training needs vary between individuals.", options: [["STANDARD", "Routine care"], ["GROOMING", "Regular grooming"], ["TRAINING", "Daily training or enrichment"], ["SPECIAL", "Medical or special-needs care"]] },
    { key: "dogType", eyebrow: "OPTIONAL DOG GUIDANCE", title: "If you chose dogs, is there a general type you prefer?", subtitle: "This is a soft preference. An individual animal’s assessment always takes priority.", dogOnly: true, options: [["", "No breed or type preference"], ["INDIE_MIXED", "Indie or mixed breed"], ["SMALL_COMPANION", "Small companion type"], ["FAMILY_SPORTING", "Family or sporting type"], ["WORKING_GUARDIAN", "Working or guardian type"]] },
];
function PetFitGuide({ busy, targetPetId, onComplete }) {
    const [step, setStep] = useState(0);
    const [answers, setAnswers] = useState({
        species: "", city: "Indore", homeType: "", tenure: "OWNED", permission: "NOT_APPLICABLE",
        household: "", aloneHours: "", exerciseMinutes: "", experience: "", trainingMinutes: "20",
        climate: "VERY_HOT", care: "", dogType: "",
    });
    const visibleQuestions = fitQuestions.filter((question) => !("dogOnly" in question) || !question.dogOnly || answers.species === "Dog");
    const question = visibleQuestions[step];
    const selected = answers[question.key];
    const choose = (value) => setAnswers((current) => (Object.assign(Object.assign({}, current), { [question.key]: value })));
    const finish = () => {
        const currentPets = answers.household === "DOG" ? [{ species: "Dog" }] : answers.household === "CAT" ? [{ species: "Cat" }] : [];
        onComplete({
            city: answers.city, stateName: "", pinCode: "", homeType: answers.homeType, tenure: answers.tenure,
            landlordPermission: answers.permission, adultCount: 1,
            childAgeBands: answers.household === "YOUNG_CHILDREN" ? ["0-7"] : [],
            householdAgreement: "YES", currentPets, previousPets: [],
            workMode: "VARIABLE", aloneHours: Number(answers.aloneHours), exerciseMinutes: Number(answers.exerciseMinutes),
            trainingMinutes: answers.care === "TRAINING" ? 45 : Number(answers.trainingMinutes),
            experienceLevel: answers.experience, financialReadiness: "READY",
            preferences: { species: answers.species, dogType: answers.dogType, climate: answers.climate, acceptsMedicalNeeds: answers.care === "SPECIAL" },
            discoverability: "NONE", completeness: 86, readinessScore: 82,
        });
    };
    return <section className="fit-guide" aria-labelledby="fit-guide-title">
    <div className="fit-intro"><span className="kicker">PET FIT GUIDE · STEP {step + 1} OF {visibleQuestions.length}</span><h2 id="fit-guide-title">Find the kind of pet—and individual animal—that fits your life.</h2><p>Adapted from Dogsvilla’s breed selector for an adoption-first, multi-species marketplace. Breed tendencies offer context; they never decide an individual animal’s suitability.</p></div>
    {targetPetId && <div className="target-pet-context"><b>Checking one specific animal</b><span>Your answers will be compared with the selected pet’s current medical, behaviour and ideal-home record.</span><Link href={`/pets/${encodeURIComponent(targetPetId)}`}>Review pet profile →</Link></div>}
    <div className="fit-progress" aria-hidden="true"><span style={{ width: `${((step + 1) / visibleQuestions.length) * 100}%` }}/></div>
    <article className="fit-question">
      <span>{question.eyebrow}</span><h3>{question.title}</h3><p>{question.subtitle}</p>
      {step === 0 && <label className="fit-city">Your city<input value={answers.city} onChange={(event) => setAnswers((current) => (Object.assign(Object.assign({}, current), { city: event.target.value })))}/></label>}
      <div className="fit-options">{question.options.map(([value, label]) => <button key={label} className={selected === value ? "selected" : ""} aria-pressed={selected === value} onClick={() => choose(value)}><b>{label}</b><em>{selected === value ? "Selected ✓" : "Choose"}</em></button>)}</div>
      {question.key === "homeType" && <div className="fit-secondary"><label>Home tenure<select value={answers.tenure} onChange={(event) => setAnswers((current) => (Object.assign(Object.assign({}, current), { tenure: event.target.value })))}><option value="OWNED">Owned</option><option value="RENTED">Rented</option><option value="FAMILY_OWNED">Family-owned</option></select></label>{answers.tenure === "RENTED" && <label>Pet permission<select value={answers.permission} onChange={(event) => setAnswers((current) => (Object.assign(Object.assign({}, current), { permission: event.target.value })))}><option value="YES">Confirmed</option><option value="PENDING">Pending</option><option value="NO">Not permitted</option></select></label>}</div>}
    </article>
    <div className="fit-actions"><button disabled={step === 0} onClick={() => setStep(step - 1)}>Back</button>{step < visibleQuestions.length - 1 ? <button className="primary" disabled={selected === "" && question.key !== "species"} onClick={() => setStep(step + 1)}>Continue →</button> : <button className="primary" disabled={busy} onClick={finish}>{busy ? "Finding suitable animals…" : "Show suitable animals →"}</button>}</div>
    <p className="fit-note">No purchase recommendations or puppy prices. Adoptvilla recommends available animals and explains important care considerations.</p>
  </section>;
}
function PetCompatibilityPanel({ result, busy, onProfile, onActivation, onRecalculate, onApply }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p;
    if (!result)
        return <div className="match-empty"><span aria-hidden="true">♡</span><h3>{busy ? "Checking this compatibility…" : "No pet-specific result yet"}</h3><p>{busy ? "Hard safety rules run before any score is shown." : "Open a published pet profile and choose “Check my compatibility.”"}</p><Link className="primary" href="/#pets">Browse published pets →</Link></div>;
    const pet = ((_a = result.pet) !== null && _a !== void 0 ? _a : {});
    const application = result.application;
    const reasons = Array.isArray(result.reasons) ? result.reasons.map(String) : [];
    const warnings = Array.isArray(result.warnings) ? result.warnings.map(String) : [];
    const hardStops = Array.isArray(result.hardStops) ? result.hardStops.map(String) : [];
    const dimensions = result.dimensionScores && typeof result.dimensionScores === "object" ? result.dimensionScores : {};
    const eligible = Boolean(result.eligible);
    const canApply = Boolean(result.canApply);
    const matchId = String((_b = result.matchId) !== null && _b !== void 0 ? _b : "");
    const profileState = String((_c = result.profileState) !== null && _c !== void 0 ? _c : "DRAFT");
    return <section className="pet-compatibility">
    <div className="compatibility-hero">
      <img src={String((_d = pet.image) !== null && _d !== void 0 ? _d : "/og.png")} alt=""/>
      <div>
        <span className="kicker">PET-SPECIFIC COMPATIBILITY</span>
        <h2>{String((_e = pet.name) !== null && _e !== void 0 ? _e : "Selected animal")}</h2>
        <p>{String((_f = pet.age) !== null && _f !== void 0 ? _f : "")} · {String((_g = pet.sex) !== null && _g !== void 0 ? _g : "")} · {String((_j = (_h = pet.breed) !== null && _h !== void 0 ? _h : pet.species) !== null && _j !== void 0 ? _j : "Pet")} · {String((_k = pet.city) !== null && _k !== void 0 ? _k : "")}</p>
        <Link href={`/pets/${encodeURIComponent(String((_l = pet.id) !== null && _l !== void 0 ? _l : ""))}`}>Review the complete public profile →</Link>
      </div>
      <div className={eligible ? "compatibility-score eligible" : "compatibility-score stopped"}>
        <b>{eligible ? `${Number((_m = result.score) !== null && _m !== void 0 ? _m : 0)}%` : "STOP"}</b>
        <span>{eligible ? `${String((_o = result.confidence) !== null && _o !== void 0 ? _o : "LOW").toLowerCase()} confidence` : "Manual or profile review needed"}</span>
        <small>{Number((_p = result.coverage) !== null && _p !== void 0 ? _p : 0)}% information coverage</small>
      </div>
    </div>

    {!eligible && <div className="compatibility-stop"><b>This pet is not being recommended automatically.</b><p>A hard welfare rule conflicts with the current profile. This is not a permanent judgment; update information only when the real situation changes.</p><ul>{hardStops.map((item) => <li key={item}>{item}</li>)}</ul></div>}

    <div className="compatibility-grid">
      <article><span>WHY THIS RESULT</span><h3>Strong points</h3>{reasons.length ? <ul className="positive-list">{reasons.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No strong point can be confirmed from the current information.</p>}</article>
      <article><span>CONSIDER</span><h3>Questions to explore</h3>{warnings.length ? <ul className="consideration-list">{warnings.map((item) => <li key={item}>{item}</li>)}</ul> : <p>No additional warning was generated. Compatibility and temperament are still never guaranteed.</p>}</article>
    </div>

    {eligible && <article className="dimension-card"><span>COMPATIBILITY COMPONENTS</span><h3>How the score was formed</h3><div>{Object.entries(dimensions).map(([name, value]) => <p key={name}><b>{name.replaceAll(/([A-Z])/g, " $1")}</b><span><i style={{ width: `${Number(value)}%` }}/></span><em>{Number(value)}%</em></p>)}</div></article>}

    <div className="compatibility-actions">
      <div><b>Adopter profile: {profileState.replaceAll("_", " ").toLowerCase()}</b><span>{application ? `Application: ${String(application.status).replaceAll("_", " ").toLowerCase()}` : canApply ? "You may submit an application for welfare review." : eligible ? "Activation is required before applying." : "Resolve the safety conflict before applying."}</span></div>
      <button onClick={onRecalculate} disabled={busy}>{busy ? "Recalculating…" : "Recalculate"}</button>
      {!eligible && <button className="primary" onClick={onProfile}>Review my profile →</button>}
      {eligible && !canApply && !application && <button className="primary" onClick={onActivation}>Activate profile →</button>}
      {eligible && canApply && !application && <button className="primary" disabled={busy || !matchId} onClick={() => onApply(matchId)}>Apply responsibly →</button>}
      {application && <a className="primary" href="/dashboard?tab=Activity">View application →</a>}
    </div>
    <p className="compatibility-disclaimer">This recommendation supports human review. Adoptvilla does not approve an adoption, guarantee temperament or guarantee compatibility.</p>
  </section>;
}
function AdopterForm({
    initial,
    busy,
    onSave,
    draftOwner
}) {
     var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o, _p, _q;
    const formRef = useRef(null);

    const draftKey =
        `adoptvilla-adopter-draft:${draftOwner}`;

    const [draftStatus, setDraftStatus] =
        useState(
            "Changes are saved privately on this device."
        );

    useEffect(() => {
        restoreDraft(
            formRef.current,
            draftKey,
            setDraftStatus
        );
    }, [draftKey]);
    const submit = (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        onSave({
            city: form.get("city"), stateName: form.get("stateName"), pinCode: form.get("pinCode"), homeType: form.get("homeType"),
            tenure: form.get("tenure"), landlordPermission: form.get("landlordPermission"), adultCount: Number(form.get("adultCount")),
            householdAgreement: form.get("householdAgreement"), childAgeBands: form.getAll("childAgeBands"), currentPets: [{ species: form.get("currentPetSpecies"), temperament: form.get("currentPetTemperament") }].filter((pet) => pet.species),
            previousPets: [{ species: form.get("previousPetSpecies"), outcome: form.get("previousPetOutcome") }].filter((pet) => pet.species),
            workMode: form.get("workMode"), aloneHours: Number(form.get("aloneHours")),
            exerciseMinutes: Number(form.get("exerciseMinutes")), trainingMinutes: Number(form.get("trainingMinutes")),
            experienceLevel: form.get("experienceLevel"), financialReadiness: form.get("financialReadiness"),
            longTermPlans: { travel: form.get("travelPlan"), relocation: form.get("relocationPlan"), primaryCarer: form.get("primaryCarer"), emergencyPlan: form.get("emergencyPlan") },
            discoverability: form.get("discoverability"), preferences: { species: form.get("species"), age: form.get("preferredAge"), size: form.get("preferredSize"), specialNeeds: form.get("specialNeeds") === "YES", openBeyondPreference: form.get("openBeyondPreference") === "YES" },
            completeness: 94, readinessScore: form.get("landlordPermission") === "NO" ? 52 : form.get("householdAgreement") === "YES" ? 88 : 70,
        });
    };
    return <form ref={formRef} className="dashboard-form" onInput={(event) => saveDraft(event.currentTarget, draftKey, setDraftStatus)} onSubmit={submit}>
    <p className="draft-status" role="status">✓ {draftStatus}</p>
    <div className="form-section"><span>1</span><div><h2>Home and household</h2><p>Only compatibility-safe summaries are exposed in authorized reverse search.</p><div className="form-grid">
      <label>City<input name="city" required defaultValue={String((_a = initial === null || initial === void 0 ? void 0 : initial.city) !== null && _a !== void 0 ? _a : "Indore")}/></label>
      <label>State<input name="stateName" required defaultValue={String((_b = initial === null || initial === void 0 ? void 0 : initial.stateName) !== null && _b !== void 0 ? _b : "Madhya Pradesh")}/></label>
      <label>PIN code<input name="pinCode" inputMode="numeric" pattern="[0-9]{6}" required defaultValue={String((_c = initial === null || initial === void 0 ? void 0 : initial.pinCode) !== null && _c !== void 0 ? _c : "")}/></label>
      <label>Home type<select name="homeType" defaultValue={String((_d = initial === null || initial === void 0 ? void 0 : initial.homeType) !== null && _d !== void 0 ? _d : "APARTMENT")}><option value="APARTMENT">Apartment</option><option value="INDEPENDENT_HOME">Independent home</option><option value="SHARED">Shared accommodation</option></select></label>
      <label>Tenure<select name="tenure" defaultValue={String((_e = initial === null || initial === void 0 ? void 0 : initial.tenure) !== null && _e !== void 0 ? _e : "OWNED")}><option value="OWNED">Owned</option><option value="RENTED">Rented</option><option value="FAMILY_OWNED">Family-owned</option></select></label>
      <label>Pet permission<select name="landlordPermission" defaultValue={String((_f = initial === null || initial === void 0 ? void 0 : initial.landlordPermission) !== null && _f !== void 0 ? _f : "NOT_APPLICABLE")}><option value="YES">Confirmed</option><option value="PENDING">Pending</option><option value="NO">Not permitted</option><option value="NOT_APPLICABLE">Not applicable</option></select></label>
      <label>Adults<input name="adultCount" type="number" min="1" max="20" defaultValue={String((_g = initial === null || initial === void 0 ? void 0 : initial.adultCount) !== null && _g !== void 0 ? _g : 1)}/></label>
      <label>Household agreement<select name="householdAgreement" defaultValue={String((_h = initial === null || initial === void 0 ? void 0 : initial.householdAgreement) !== null && _h !== void 0 ? _h : "YES")}><option value="YES">Every adult agrees</option><option value="PENDING">Not yet discussed</option><option value="NO">No</option></select></label>
      <fieldset className="wide"><legend>Children in the household</legend><label><input type="checkbox" name="childAgeBands" value="0-5"/> 0–5 years</label><label><input type="checkbox" name="childAgeBands" value="6-12"/> 6–12 years</label><label><input type="checkbox" name="childAgeBands" value="13-17"/> 13–17 years</label></fieldset>
      <label>Current pet species<input name="currentPetSpecies" placeholder="None, dog, cat…"/></label><label>Current pet temperament<input name="currentPetTemperament" placeholder="Calm, social, territorial…"/></label>
      <label>Previous pet species<input name="previousPetSpecies" placeholder="Optional"/></label><label>What happened?<select name="previousPetOutcome"><option value="">Not applicable</option><option>Still with me</option><option>Natural death</option><option>Illness</option><option>Lost</option><option>Rehomed</option><option>Surrendered</option></select></label>
    </div></div></div>
    <div className="form-section"><span>2</span><div><h2>Lifestyle and capacity</h2><div className="form-grid">
      <label>Work mode<select name="workMode" defaultValue={String((_j = initial === null || initial === void 0 ? void 0 : initial.workMode) !== null && _j !== void 0 ? _j : "HYBRID")}><option value="HOME">Work from home</option><option value="HYBRID">Hybrid</option><option value="OFFICE">Office</option><option value="VARIABLE">Variable</option></select></label>
      <label>Usual alone hours<input name="aloneHours" type="number" min="0" max="24" step=".5" defaultValue={String((_k = initial === null || initial === void 0 ? void 0 : initial.aloneHours) !== null && _k !== void 0 ? _k : 5)}/></label>
      <label>Daily exercise minutes<input name="exerciseMinutes" type="number" min="0" max="300" defaultValue={String((_l = initial === null || initial === void 0 ? void 0 : initial.exerciseMinutes) !== null && _l !== void 0 ? _l : 60)}/></label>
      <label>Training minutes<input name="trainingMinutes" type="number" min="0" max="180" defaultValue={String((_m = initial === null || initial === void 0 ? void 0 : initial.trainingMinutes) !== null && _m !== void 0 ? _m : 20)}/></label>
      <label>Experience<select name="experienceLevel" defaultValue={String((_o = initial === null || initial === void 0 ? void 0 : initial.experienceLevel) !== null && _o !== void 0 ? _o : "FIRST_TIME")}><option value="FIRST_TIME">First-time pet parent</option><option value="SOME">Some experience</option><option value="EXPERIENCED">Experienced</option></select></label>
      <label>Unexpected vet expense<select name="financialReadiness" defaultValue={String((_p = initial === null || initial === void 0 ? void 0 : initial.financialReadiness) !== null && _p !== void 0 ? _p : "PLAN_NEEDED")}><option value="READY">I have a plan</option><option value="PLAN_NEEDED">I need to prepare</option><option value="SUPPORT_NEEDED">I may need support</option></select></label>
      <label>Primary caregiver<input name="primaryCarer" required placeholder="Who will handle daily care?"/></label><label>Travel plan<input name="travelPlan" required placeholder="Family, sitter or boarding"/></label>
      <label>Relocation plan<input name="relocationPlan" required placeholder="How the pet remains with you"/></label><label>Emergency care plan<input name="emergencyPlan" required placeholder="Trusted person or facility"/></label>
    </div></div></div>
    <div className="form-section"><span>3</span><div><h2>Preferences and privacy</h2><div className="form-grid">
      <label>Species preference<select name="species"><option>Dog</option><option>Cat</option><option value="Small mammal">Rabbit / small mammal</option><option>Bird</option><option value="">Open to recommendations</option></select></label>
      <label>Preferred age<select name="preferredAge"><option value="">Any age</option><option>Puppy/kitten</option><option>Young adult</option><option>Adult</option><option>Senior</option></select></label>
      <label>Preferred size<select name="preferredSize"><option value="">Any size</option><option>Small</option><option>Medium</option><option>Large</option></select></label>
      <label>Open to special needs?<select name="specialNeeds"><option value="NO">Not currently</option><option value="YES">Yes</option></select></label>
      <label>Recommendations beyond preference?<select name="openBeyondPreference"><option value="YES">Yes, suitability first</option><option value="NO">No</option></select></label>
      <label>Who may invite you?<select name="discoverability" defaultValue={String((_q = initial === null || initial === void 0 ? void 0 : initial.discoverability) !== null && _q !== void 0 ? _q : "NONE")}><option value="VERIFIED_CUSTODIANS">Verified custodians</option><option value="VERIFIED_ORGS_ONLY">Verified NGOs and shelters only</option><option value="NONE">Nobody—I will search myself</option></select></label>
    </div><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save private profile"}</button></div></div>
  </form>;
}
function PetForm({
    pets,
    busy,
    onSave,
    onNotice,
    draftOwner
}) {
    const [saving, setSaving] =
        useState(false);

    const formRef = useRef(null);

    const draftKey =
        `adoptvilla-pet-draft:${draftOwner}`;

    const [draftStatus, setDraftStatus] =
        useState(
            "Changes are saved privately on this device."
        );

    useEffect(() => {
        restoreDraft(
            formRef.current,
            draftKey,
            setDraftStatus
        );
    }, [draftKey]);
    const submit = async (event) => {
        var _a;
        event.preventDefault();
        const target = event.currentTarget;
        const form = new FormData(target);
        setSaving(true);
        onNotice("");
        try {
            const saved = await onSave({
                name: form.get("name"), species: form.get("species"), breed: form.get("breed"), ageMonths: Number(form.get("ageMonths")),
                sex: form.get("sex"), weightKg: Number(form.get("weightKg")), size: form.get("size"), city: form.get("city"),
                origin: form.get("origin"), rehomingReason: form.get("rehomingReason"), history: form.get("history"),
                medical: { vaccinated: form.get("vaccinated") === "YES", rabies: form.get("rabies") === "YES", dewormed: form.get("dewormed") === "YES", sterilized: form.get("sterilized") === "YES", specialCareRequired: form.get("specialCare") === "YES", conditions: form.get("medicalConditions"), medications: form.get("medications") },
                behaviour: { energy: form.get("energy"), childCompatible: form.get("childCompatible") === "YES", dogCompatible: form.get("dogCompatible") === "YES", catCompatible: form.get("catCompatible") === "YES", catAggressive: form.get("catAggressive") === "YES", leashTrainingNeeded: form.get("leashTraining") === "YES", houseTrained: form.get("houseTrained") === "YES", separationDistress: form.get("separationDistress") === "YES", resourceGuarding: form.get("resourceGuarding") === "YES", escapeRisk: form.get("escapeRisk") === "YES" },
                idealHome: { apartmentSuitable: form.get("apartmentSuitable") === "YES", experiencedHandlerRequired: form.get("experiencedHandler") === "YES", maxAloneHours: Number(form.get("maxAloneHours")), exerciseMinutes: Number(form.get("exerciseMinutes")), minimumChildAge: form.get("minimumChildAge"), climate: form.get("climate"), grooming: form.get("grooming") },
                biteHistory: form.get("biteHistory"), completeness: 96,
            });
            const files = form.getAll("media").filter((value) => value instanceof File && value.size > 0);
            for (const file of files) {
                const upload = new FormData();
                upload.append("file", file);
                upload.append("petId", saved.petId);
                const response = await fetch("/api/media", { method: "POST", body: upload });
                const data = await response.json();
                if (!response.ok)
                    throw new Error((_a = data.error) !== null && _a !== void 0 ? _a : "Media upload failed.");
            }
            onNotice(`Private pet draft saved${files.length ? ` with ${files.length} media file${files.length === 1 ? "" : "s"}` : ""}. Nothing was published or charged.`);
           localStorage.removeItem(draftKey);
            target.reset();
        }
        catch (error) {
            onNotice(error instanceof Error ? error.message : "Unable to save the pet record.");
        }
        finally {
            setSaving(false);
        }
    };
    return <div><RecordList title="My pet records" records={pets} empty="No pet records yet."/><form ref={formRef} className="dashboard-form compact" onInput={(event) =>saveDraft(
  event.currentTarget,
  draftKey,
  setDraftStatus
)} onSubmit={submit}><p className="draft-status" role="status">✓ {draftStatus}</p><div className="form-section"><span>+</span><div><h2>Create a structured pet draft</h2><div className="form-grid">
    <label>Name<input required name="name"/></label><label>Species<input required name="species" list="pet-species" placeholder="Dog, cat, rabbit, bird…"/><datalist id="pet-species"><option value="Dog"/><option value="Cat"/><option value="Rabbit"/><option value="Guinea pig"/><option value="Bird"/><option value="Reptile"/></datalist></label>
    <label>Breed / type<input name="breed" placeholder="Indie, mixed or unknown"/></label><label>Age in months<input name="ageMonths" type="number" min="0"/></label>
    <label>Sex<select name="sex"><option>Female</option><option>Male</option><option>Unknown</option></select></label><label>Weight kg<input name="weightKg" type="number" min="0" step=".1"/></label>
    <label>Size<select name="size"><option>Small</option><option>Medium</option><option>Large</option></select></label><label>Current city<input required name="city" defaultValue="Indore"/></label>
    <label>Origin<select name="origin"><option>Owned pet</option><option>Street rescue</option><option>Abandoned</option><option>Found</option><option>Owner surrendered</option><option>Shelter intake</option><option>Foster-born</option></select></label><label>Rehoming reason<select name="rehomingReason"><option>Not applicable</option><option>Housing</option><option>Relocation</option><option>Financial</option><option>Behaviour concern</option><option>Medical issue</option><option>Family issue</option><option>Owner illness/death</option></select></label>
    <label className="wide">Known history<textarea name="history" rows={3}/></label>
    <label>Vaccinated?<select name="vaccinated"><option value="YES">Yes</option><option value="NO">No / unknown</option></select></label><label>Rabies vaccination?<select name="rabies"><option value="YES">Yes</option><option value="NO">No / unknown</option></select></label><label>Dewormed?<select name="dewormed"><option value="YES">Yes</option><option value="NO">No / unknown</option></select></label><label>Sterilized?<select name="sterilized"><option value="YES">Yes</option><option value="NO">No / unknown</option></select></label>
    <label>Medical conditions<input name="medicalConditions" placeholder="Disclose diagnosed or suspected conditions"/></label><label>Medications<input name="medications" placeholder="Medicine and schedule"/></label>
    <label>Special medical care?<select name="specialCare"><option value="NO">No</option><option value="YES">Yes</option></select></label><label>Energy<select name="energy"><option>Low</option><option>Moderate</option><option>High</option><option>Very high</option></select></label>
    <label>Good with children?<select name="childCompatible"><option value="YES">Yes / assessed</option><option value="NO">No / not suitable</option></select></label><label>Good with dogs?<select name="dogCompatible"><option value="YES">Yes / assessed</option><option value="NO">No / not suitable</option></select></label><label>Good with cats?<select name="catCompatible"><option value="YES">Yes / assessed</option><option value="NO">No / not suitable</option></select></label>
    <label>Known cat aggression?<select name="catAggressive"><option value="NO">No</option><option value="YES">Yes</option></select></label><label>Needs leash training?<select name="leashTraining"><option value="YES">Yes</option><option value="NO">No</option></select></label>
    <label>House trained?<select name="houseTrained"><option value="YES">Yes</option><option value="NO">No / in progress</option></select></label><label>Separation distress?<select name="separationDistress"><option value="NO">None known</option><option value="YES">Yes / suspected</option></select></label><label>Resource guarding?<select name="resourceGuarding"><option value="NO">None known</option><option value="YES">Yes / suspected</option></select></label><label>Escape risk?<select name="escapeRisk"><option value="NO">Normal precautions</option><option value="YES">High risk</option></select></label>
    <label>Apartment suitable?<select name="apartmentSuitable"><option value="YES">Yes</option><option value="NO">No</option></select></label><label>Experienced handler required?<select name="experiencedHandler"><option value="NO">No</option><option value="YES">Yes</option></select></label><label>Max usual alone hours<input name="maxAloneHours" type="number" defaultValue="6" min="0" max="24"/></label>
    <label>Daily exercise minutes<input name="exerciseMinutes" type="number" defaultValue="60" min="0" max="300"/></label><label>Minimum child age<input name="minimumChildAge" type="number" min="0" max="18"/></label><label>Climate considerations<input name="climate" placeholder="Heat, cold, humidity…"/></label><label>Grooming requirement<input name="grooming" placeholder="Low, weekly, professional…"/></label><label>Bite history<input name="biteHistory" required placeholder="Disclose context or write none known"/></label>
    <label className="wide">Photos, video or records<input name="media" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple/><small className="field-help">JPG, PNG, WebP or PDF, up to 10 MB each. Files remain private with the draft.</small></label>
  </div><button className="primary" disabled={busy || saving}>{saving ? "Saving and uploading…" : "Save pet draft"}</button></div></div></form></div>;
}
function SavedPetsPanel() {
    const [pets, setPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notice, setNotice] = useState("");
    const load = async () => {
        var _a, _b;
        setLoading(true);
        try {
            const response = await fetch("/api/platform?resource=saved-pets");
            const data = await response.json();
            if (!response.ok)
                throw new Error((_a = data.error) !== null && _a !== void 0 ? _a : "Saved pets could not be loaded.");
            setPets((_b = data.pets) !== null && _b !== void 0 ? _b : []);
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : "Saved pets could not be loaded.");
        }
        finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        const timer = window.setTimeout(() => { void load(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    const remove = async (petId) => {
        var _a;
        try {
            await platform({ action: "toggle-saved-pet", petId, saved: false });
            setPets((current) => current.filter((pet) => pet.id !== petId));
            setNotice("Removed from saved pets.");
            try {
                const local = JSON.parse((_a = window.localStorage.getItem("adoptvilla-saved-pets-v1")) !== null && _a !== void 0 ? _a : "[]");
                if (Array.isArray(local))
                    window.localStorage.setItem("adoptvilla-saved-pets-v1", JSON.stringify(local.filter((id) => String(id) !== petId)));
            }
            catch (_b) {
                // Device storage is optional.
            }
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : "The pet could not be removed.");
        }
    };
    return <section>
    <div className="dashboard-section-head"><div><h2>Your saved pets</h2><p>Pets saved while signed in stay with your account. Saving is private and does not submit an application.</p></div><button onClick={load} disabled={loading}>{loading ? "Loading…" : "Refresh"}</button></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    <div className="saved-pets-grid">
      {pets.map((pet) => {
            var _a;
            return <article key={String(pet.id)}>
        <img src={String((_a = pet.image) !== null && _a !== void 0 ? _a : "/og.png")} alt=""/>
        <div><span>{pet.demo ? "Demonstration record" : "Published pet"}</span><h3>{String(pet.name)}</h3><p>{String(pet.age)} · {String(pet.sex)} · {String(pet.city)}</p><div><Link href={`/pets/${encodeURIComponent(String(pet.id))}`}>View profile →</Link><button onClick={() => remove(String(pet.id))}>Remove</button></div></div>
      </article>;
        })}
      {!loading && !pets.length && <div className="record-empty"><b>No saved pets yet.</b><p>Browse current profiles and select “Save pet” to keep them here.</p><Link className="primary" href="/#pets">Browse pets →</Link></div>}
    </div>
  </section>;
}
function Matches({ matches, matchRun, busy, onCalculate, onApply }) {
    return <div><div className="dashboard-section-head"><div><h2>{matchRun ? "Your compatibility results" : "Your compatible pets"}</h2><p>{matchRun ? `${matchRun.evaluated} published animals evaluated · ${matches.length} suitable matches · ${matchRun.excluded} excluded by safety rules.` : "We check essential safety requirements first, then compare each pet with your home, routine and experience."}</p></div>{matches.length > 0 && <button className="primary" onClick={onCalculate} disabled={busy}>{busy ? "Refreshing…" : "Refresh matches"}</button>}</div>
    <div className="record-list match-results">{matches.map((match, index) => { var _a, _b, _c, _d, _e; return <article key={String((_a = match.petId) !== null && _a !== void 0 ? _a : index)}><div><b>{String((_b = match.petName) !== null && _b !== void 0 ? _b : "Compatible pet")}</b><small>{String((_c = match.species) !== null && _c !== void 0 ? _c : "Pet")} · {String((_d = match.city) !== null && _d !== void 0 ? _d : "")} · {Number(match.score)}% match · {String(match.confidence).toLowerCase()} confidence</small></div><p>{((_e = match.reasons) !== null && _e !== void 0 ? _e : []).join(" · ") || "Complete more fields for a fuller explanation."}</p><button disabled={busy || !match.matchId} onClick={() => onApply(String(match.matchId))}>Apply responsibly →</button></article>; })}{!matches.length && <div className="match-empty"><span aria-hidden="true">♡</span><h3>{matchRun ? "No safe automatic recommendations yet" : "Complete your profile to discover compatible pets"}</h3><p>{matchRun ? `We evaluated ${matchRun.evaluated} animals, but current safety requirements excluded them. Adjust only answers that have genuinely changed; suitability matters more than producing a match.` : "Tell us about your home, routine and experience. We’ll then show suitable pets and explain every recommendation."}</p><button className="primary" onClick={onCalculate} disabled={busy}>{busy ? "Finding suitable pets…" : matchRun ? "Run assessment again →" : "Find my matches →"}</button></div>}</div></div>;
}
function ActivationPanel({ profile, pets, payments }) {
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState("");
    const activatePromo = async (benefitType, subjectId) => {
        var _a;
        setBusy(`${benefitType}:${subjectId}`);
        setNotice("");
        try {
            const data = await platform({ action: "reserve-promotion", benefitType, subjectId, idempotencyKey: `promo:${benefitType}:${subjectId}` });
            setNotice(data.status === "CONFIRMED"
                ? "Founding offer confirmed. No payment was taken."
                : String((_a = data.message) !== null && _a !== void 0 ? _a : `Promotion status: ${data.status}.`));
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Promotion could not be claimed.");
        }
        finally {
            setBusy("");
        }
    };
    const createOrder = async (purpose, subjectId) => {
        var _a;
        setBusy(`${purpose}:${subjectId}`);
        setNotice("");
        try {
            const data = await platform({ action: "create-payment-order", purpose, subjectId, idempotencyKey: `payment:${purpose}:${subjectId}` });
            if (!data.providerReady) {
                setNotice(`No charge was made. ${(_a = data.reason) !== null && _a !== void 0 ? _a : "Payment provider is not ready."}`);
                return;
            }
            await loadRazorpayCheckout();
            const Razorpay = window.Razorpay;
            if (!Razorpay)
                throw new Error("Secure checkout could not be loaded.");
            new Razorpay({
                key: data.checkoutKeyId,
                amount: data.amountPaise,
                currency: data.currency,
                name: "ADOPTVILLA — By Dogsvilla",
                description: purpose === "ADOPTER_ACTIVATION" ? "Adopter profile participation fee" : "Pet listing publication fee",
                order_id: data.providerOrderId,
                handler: () => setNotice("Payment submitted. Access will activate after the signed Razorpay webhook confirms capture."),
                modal: { ondismiss: () => setNotice("Checkout closed. No listing is published unless Razorpay confirms payment.") },
                theme: { color: "#ea6836" },
            }).open();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Payment order could not be created.");
        }
        finally {
            setBusy("");
        }
    };
    return <div><div className="dashboard-section-head"><div><h2>Activate only when you are ready</h2><p>Browsing and drafts remain free. ₹99 is a platform participation fee—not payment for an animal.</p></div></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    <div className="activation-grid">
      <article><span>ADOPTER JOURNEY</span><h3>Activate my adopter profile</h3><p>Enter matching, apply to suitable animals and receive authorized invitations.</p><b>₹99</b>{profile ? <div><button disabled={Boolean(busy)} onClick={() => activatePromo("ADOPTER_ACTIVATION", String(profile.id))}>Check Founding 100 eligibility</button><button className="primary" disabled={Boolean(busy)} onClick={() => createOrder("ADOPTER_ACTIVATION", String(profile.id))}>Pay securely →</button></div> : <small>Complete an adopter profile first.</small>}</article>
      {pets.map((pet) => <article key={String(pet.id)}><span>PET PUBLICATION</span><h3>Publish {String(pet.name)}</h3><p>{String(pet.species)} · {String(pet.city)} · Current state: {String(pet.state).replaceAll("_", " ")}</p><b>₹99</b><div><button disabled={Boolean(busy)} onClick={() => activatePromo("PET_PUBLICATION", String(pet.id))}>Check Founding 100 eligibility</button><button className="primary" disabled={Boolean(busy)} onClick={() => createOrder("PET_PUBLICATION", String(pet.id))}>Pay securely →</button></div></article>)}
    </div>
    <PaymentHistory payments={payments}/>
  </div>;
}
function loadRazorpayCheckout() {
    return Promise.resolve();
}

function PaymentHistory({ payments }) {
    const [refundOrderId, setRefundOrderId] = useState("");
    const [documents, setDocuments] = useState([]);
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState("");
    const loadDocuments = async (orderId) => {
        var _a, _b;
        setBusy(`documents:${orderId}`);
        setNotice("");
        try {
            const response = await fetch(`/api/platform?resource=payment-documents&orderId=${encodeURIComponent(orderId)}`);
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error);
            setDocuments((_a = data.documents) !== null && _a !== void 0 ? _a : []);
            if (!((_b = data.documents) === null || _b === void 0 ? void 0 : _b.length))
                setNotice("No document has been issued for this payment attempt.");
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Documents could not be loaded.");
        }
        finally {
            setBusy("");
        }
    };
    const requestRefund = async (event) => {
        var _a;
        event.preventDefault();
        setBusy(`refund:${refundOrderId}`);
        setNotice("");
        const reason = String((_a = new FormData(event.currentTarget).get("reason")) !== null && _a !== void 0 ? _a : "");
        try {
            await platform({ action: "request-refund", orderId: refundOrderId, reason });
            setNotice("Refund request sent for human review. Razorpay confirmation is required before it is shown as refunded.");
            setRefundOrderId("");
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Refund request could not be submitted.");
        }
        finally {
            setBusy("");
        }
    };
    return <section className="payment-history"><div className="dashboard-section-head"><div><h2>Payments and documents</h2><p>Invoices are issued when an order is created. Receipts and refund notes appear only after signed gateway confirmation.</p></div></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    <div className="record-list">{payments.map((payment) => { var _a; return <article key={String(payment.id)}><div><b>{String(payment.purpose).replaceAll("_", " ")}</b><small>₹{(Number((_a = payment.amountPaise) !== null && _a !== void 0 ? _a : 0) / 100).toLocaleString("en-IN")} · {String(payment.status).replaceAll("_", " ")} {payment.invoiceNumber ? `· ${String(payment.invoiceNumber)}` : ""}</small></div><div className="payment-actions"><button disabled={Boolean(busy)} onClick={() => loadDocuments(String(payment.id))}>{busy === `documents:${payment.id}` ? "Loading…" : "View documents"}</button>{payment.status === "PAID" && <button disabled={Boolean(busy)} onClick={() => setRefundOrderId(String(payment.id))}>Request refund</button>}</div></article>; })}{!payments.length && <div className="record-empty">No payment attempts. Failed or unavailable providers never publish a listing.</div>}</div>
    {refundOrderId && <form className="refund-form" onSubmit={requestRefund}><label>Why are you requesting a refund?<textarea name="reason" required minLength={10} maxLength={1000} rows={3} placeholder="Briefly explain the circumstances for the review team."/></label><div><button className="primary" disabled={Boolean(busy)}>Submit for review</button><button type="button" onClick={() => setRefundOrderId("")}>Cancel</button></div></form>}
    {documents.length > 0 && <div className="document-list">{documents.map((document) => {
                var _a, _b, _c, _d;
                const data = ((_a = document.data) !== null && _a !== void 0 ? _a : {});
                return <article key={String(document.id)}><span>{String(document.type).replaceAll("_", " ")}</span><h3>{String(document.documentNumber)}</h3><p>₹{(Number((_b = data.totalPaise) !== null && _b !== void 0 ? _b : 0) / 100).toLocaleString("en-IN")} · {String((_c = data.currency) !== null && _c !== void 0 ? _c : "INR")} · issued {new Date(String(document.issuedAt)).toLocaleString("en-IN")}</p><small>{String((_d = data.note) !== null && _d !== void 0 ? _d : "Payment document recorded against this secure order.")}</small></article>;
            })}</div>}
  </section>;
}
function AdopterCandidates() {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const load = async () => {
        var _a, _b;
        setLoading(true);
        setError("");
        try {
            const response = await fetch("/api/platform?resource=adopter-candidates");
            const data = await response.json();
            if (!response.ok)
                throw new Error((_a = data.error) !== null && _a !== void 0 ? _a : "Unable to load candidates.");
            setCandidates((_b = data.candidates) !== null && _b !== void 0 ? _b : []);
        }
        catch (problem) {
            setError(problem instanceof Error ? problem.message : "Unable to load candidates.");
        }
        finally {
            setLoading(false);
        }
    };
    return <div>
    <div className="dashboard-section-head"><div><h2>Privacy-safe adopter candidates</h2><p>These 50 demonstration profiles let you test reverse discovery. Names, email, phone, PIN code and household details remain hidden.</p></div><button className="primary" disabled={loading} onClick={load}>{loading ? "Loading…" : candidates.length ? "Refresh candidates" : "Load 50 demo adopters"}</button></div>
    {error && <div className="dashboard-notice" role="alert">{error}</div>}
    <div className="record-list candidate-list">{candidates.map((candidate) => {
            var _a, _b, _c, _d, _e;
            return <article key={String(candidate.anonymousId)}>
      <div><b>{String(candidate.anonymousId)} {candidate.demo ? "· Demo" : ""}</b><small>{String((_a = candidate.city) !== null && _a !== void 0 ? _a : "City withheld")} · {String((_b = candidate.homeType) !== null && _b !== void 0 ? _b : "Home not specified").replaceAll("_", " ").toLowerCase()} · {String((_c = candidate.experienceLevel) !== null && _c !== void 0 ? _c : "Experience not specified").replaceAll("_", " ").toLowerCase()}</small></div>
      <p>{Number((_d = candidate.readinessScore) !== null && _d !== void 0 ? _d : 0)}/100 readiness · {Number((_e = candidate.completeness) !== null && _e !== void 0 ? _e : 0)}% complete</p>
    </article>;
        })}
    {!candidates.length && !loading && <div className="record-empty">Load the authorized demonstration set to test the reverse adopter-search experience.</div>}</div>
  </div>;
}
function WorkflowPanel({ records, busy, onLoad, onMutual, onTransition }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const load = async () => { setLoading(true); setError(""); try {
        await onLoad();
    }
    catch (problem) {
        setError(problem instanceof Error ? problem.message : "Unable to load applications.");
    }
    finally {
        setLoading(false);
    } };
    return <div><div className="dashboard-section-head"><div><h2>Applications and mutual matches</h2><p>Each application shows who must act next. Chat unlocks only after both sides express interest.</p></div><button className="primary" disabled={loading} onClick={load}>{loading ? "Loading…" : records.length ? "Refresh" : "Load applications"}</button></div>
    {error && <div className="dashboard-notice" role="alert">{error}</div>}
    <div className="workflow-list">{records.map((record) => {
            const status = String(record.status);
            const nextByStatus = { UNDER_REVIEW: "INITIAL_SCREENING", INITIAL_SCREENING: "CALL", CALL: "MEET_AND_GREET", MEET_AND_GREET: "HOME_VERIFICATION", HOME_VERIFICATION: "APPROVED", APPROVED: "AGREEMENT", AGREEMENT: "HANDOVER", HANDOVER: "ADJUSTMENT", ADJUSTMENT: "COMPLETED", COMPLETED: "FOLLOW_UP" };
            const next = nextByStatus[status];
            const canDecline = ["UNDER_REVIEW", "INITIAL_SCREENING", "CALL", "MEET_AND_GREET", "HOME_VERIFICATION", "APPROVED"].includes(status);
            return <article key={String(record.id)}>
      <div className="workflow-title"><div><span>{String(record.perspective)} VIEW</span><h3>{String(record.petName)}</h3><p>{String(record.species)} · {String(record.city)} · {Number(record.score)}% compatibility</p></div><b>{String(record.status).replaceAll("_", " ")}</b></div>
      <div className="workflow-status"><span className={record.adopterInterested ? "done" : ""}>Adopter interest {record.adopterInterested ? "✓" : "pending"}</span><span className={record.custodianInterested ? "done" : ""}>Custodian interest {record.custodianInterested ? "✓" : "pending"}</span><span className={record.threadId ? "done" : ""}>Secure chat {record.threadId ? "open" : "locked"}</span></div>
      {record.perspective === "CUSTODIAN" && !record.custodianInterested && <button className="primary" disabled={busy} onClick={() => onMutual(String(record.id))}>Confirm interest and open chat →</button>}
      {record.perspective === "CUSTODIAN" && Boolean(record.custodianInterested) && next && <div className="workflow-actions"><button className="primary" disabled={busy} onClick={() => onTransition(String(record.id), next)}>Advance to {next.replaceAll("_", " ").toLowerCase()} →</button>{canDecline && <button disabled={busy} onClick={() => onTransition(String(record.id), "DECLINED")}>Decline</button>}</div>}
      {record.perspective === "ADOPTER" && !["WITHDRAWN", "DECLINED", "COMPLETED", "FOLLOW_UP"].includes(status) && <button disabled={busy} onClick={() => onTransition(String(record.id), "WITHDRAWN")}>Withdraw application</button>}
      {Boolean(record.threadId) && <p className="workflow-help">Mutual interest confirmed. Continue in Messages without sharing private phone numbers.</p>}
    </article>;
        })}{!records.length && !loading && <div className="record-empty">No loaded applications. Select “Load applications” to check the latest workflow.</div>}</div>
  </div>;
}
function ChatPanel({ records, onLoad }) {
    const [threadId, setThreadId] = useState("");
    const [messages, setMessages] = useState([]);
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const openThread = async (id) => {
        var _a;
        setThreadId(id);
        setBusy(true);
        setNotice("");
        try {
            const response = await fetch(`/api/platform?resource=thread&threadId=${encodeURIComponent(id)}`);
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error);
            setMessages((_a = data.messages) !== null && _a !== void 0 ? _a : []);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to open chat.");
        }
        finally {
            setBusy(false);
        }
    };
   const send = async (event) => {
    event.preventDefault();

    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const message = String(
        form.get("message") ?? ""
    ).trim();

    if (!message || !threadId)
        return;

    setBusy(true);
    setNotice("");

    try {
        await platform({
            action: "send-message",
            threadId,
            message
        });

        formElement.reset();

        await openThread(threadId);
    }
    catch (problem) {
        setNotice(
            problem instanceof Error
                ? problem.message
                : "Message could not be sent."
        );
    }
    finally {
        setBusy(false);
    }
};
    const chats = records.filter((record) => record.threadId);
    return <div><div className="dashboard-section-head"><div><h2>Secure conversations</h2><p>Chat is available only for mutual matches. Keep personal contact details private until both parties consent.</p></div><button onClick={() => onLoad()} disabled={busy}>Refresh conversations</button></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    <div className="chat-layout"><aside>{chats.map((record) => <button className={threadId === record.threadId ? "active" : ""} key={String(record.threadId)} onClick={() => openThread(String(record.threadId))}><b>{String(record.petName)}</b><small>{String(record.status).replaceAll("_", " ")}</small></button>)}{!chats.length && <p>No mutual-match conversations yet. Refresh after both sides confirm interest.</p>}</aside>
      <section className="chat-window">{threadId ? <><div className="chat-messages">{messages.map((message) => <article key={String(message.id)}><p>{String(message.body)}</p><small>{message.createdAt ? new Date(String(message.createdAt)).toLocaleString("en-IN") : ""}</small></article>)}{!messages.length && <p className="chat-empty">This secure conversation is ready. Start with a thoughtful question about the animal’s routine and needs.</p>}</div><form onSubmit={send}><label htmlFor="secure-message">Message</label><textarea id="secure-message" name="message" required maxLength={4000} rows={3} placeholder="Ask about routines, care needs or scheduling a safe meeting…"/><button className="primary" disabled={busy}>{busy ? "Sending…" : "Send securely"}</button></form></> : <div className="chat-empty">Choose a mutual match to open its conversation.</div>}</section></div>
  </div>;
}
function NotificationCentre() {
  const [records, setRecords] =
    useState([]);

  useEffect(() => {
    let active = true;

    fetch(
      "/api/platform?resource=notifications"
    )
      .then(async (response) => {
        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
            "Notifications could not be loaded."
          );
        }

        return result;
      })
      .then((result) => {
        if (active) {
          setRecords(
            Array.isArray(result)
              ? result
              : []
          );
        }
      })
      .catch(() => {
        if (active) {
          setRecords([]);
        }
      });

    return () => {
      active = false;
    };
  }, []);


  return (
    <div>

      <div className="dashboard-section-head">
        <div>
          <h2>Notification centre</h2>

          <p>
            Transactional updates appear here
            even when external email, WhatsApp
            or SMS providers are unavailable.
          </p>
        </div>
      </div>


      <div className="notification-list">

        {records.map((record) => (
          <article key={String(record.id)}>
            <div>
              <span>
                {String(record.channel)}
              </span>

              <h3>
                {String(record.template)
                  .replaceAll("_", " ")}
              </h3>

              <p>
                {displayContext(
                  record.contextJson
                )}
              </p>
            </div>

            <b>
              {String(record.status)}
            </b>
          </article>
        ))}


        {!records.length && (
          <div className="record-empty">
            No notifications yet.
            Adoption workflow events will
            appear here.
          </div>
        )}

      </div>

    </div>
  );
}
function JourneyPanel({ records, onLoad }) {
    const [applicationId, setApplicationId] = useState("");
    const [eventType, setEventType] = useState("MEETING_SCHEDULED");
    const [events, setEvents] = useState([]);
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const loadEvents = async (id) => {
        var _a;
        setApplicationId(id);
        setBusy(true);
        setNotice("");
        try {
            const response = await fetch(`/api/platform?resource=journey-events&applicationId=${encodeURIComponent(id)}`);
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error);
            setEvents((_a = data.events) !== null && _a !== void 0 ? _a : []);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to load the journey.");
        }
        finally {
            setBusy(false);
        }
    };
    const submit = async (event) => {
        event.preventDefault();
        if (!applicationId)
            return;
        const form = new FormData(event.currentTarget);
        const data = Object.fromEntries([...form.entries()].filter(([key]) => key !== "eventType").map(([key, value]) => [key, String(value)]));
        setBusy(true);
        setNotice("");
        try {
            await platform({ action: "save-journey-event", applicationId, eventType, data });
            setNotice("Journey milestone saved privately and the other party was notified.");
            event.currentTarget.reset();
            await loadEvents(applicationId);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to save this milestone.");
        }
        finally {
            setBusy(false);
        }
    };
    const labels = {
        MEETING_SCHEDULED: { title: "Schedule a meet and greet", fields: [["date", "Date and time", "datetime-local"], ["location", "Safe location or video link", "text"], ["attendees", "Expected attendees", "text"]] },
        MEETING_OUTCOME: { title: "Record meeting outcome", fields: [["outcome", "Outcome", "text"], ["observations", "Behaviour and interaction observations", "textarea"], ["nextStep", "Agreed next step", "text"]] },
        HOME_VERIFICATION: { title: "Complete home verification", fields: [["method", "Physical, video or photo", "text"], ["safety", "Gate, balcony, windows and containment findings", "textarea"], ["outcome", "Approved, conditional or follow-up required", "text"]] },
        AGREEMENT_SIGNED: { title: "Sign adoption agreement", fields: [["signerName", "Typed legal name", "text"], ["consent", "Type “I agree” after reviewing the care and return clauses", "text"], ["templateVersion", "Agreement template/version", "text"]] },
        HANDOVER_RECORDED: { title: "Record safe handover", fields: [["date", "Transfer date and time", "datetime-local"], ["records", "Medical records and belongings transferred", "textarea"], ["notes", "Final handover notes", "textarea"]] },
        FOLLOW_UP: { title: "Post-adoption check-in", fields: [["stage", "Day 1, 3, 7, 15, 30, 3/6/12 months", "text"], ["wellbeing", "Eating, health and settling", "textarea"], ["concerns", "Behaviour or safety concerns", "textarea"]] },
        SUPPORT_REQUEST: { title: "I’m struggling and need support", fields: [["category", "Behaviour, medical, financial, family or moving", "text"], ["urgency", "Routine, soon or urgent", "text"], ["details", "What is happening?", "textarea"]] },
    };
    const config = labels[eventType];
    return <div><div className="dashboard-section-head"><div><h2>Adoption journey and support</h2><p>Schedule, verify, agree, hand over and follow up from one private timeline. Asking for help never counts against an adopter.</p></div><button onClick={() => onLoad()} disabled={busy}>Refresh applications</button></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    <div className="journey-workspace"><aside><h3>Select an adoption</h3>{records.map((record) => <button className={applicationId === record.id ? "active" : ""} key={String(record.id)} onClick={() => loadEvents(String(record.id))}><b>{String(record.petName)}</b><small>{String(record.status).replaceAll("_", " ")}</small></button>)}{!records.length && <p>Refresh applications to load an active adoption journey.</p>}</aside>
      <section>{applicationId ? <><label>What would you like to record?<select value={eventType} onChange={(event) => setEventType(event.target.value)}>{Object.entries(labels).map(([value, item]) => <option key={value} value={value}>{item.title}</option>)}</select></label><form className="journey-event-form" onSubmit={submit}><h3>{config.title}</h3>{config.fields.map(([name, label, type]) => <label key={name}>{label}{type === "textarea" ? <textarea name={name} required rows={3}/> : <input name={name} type={type} required/>}</label>)}<button className="primary" disabled={busy}>{busy ? "Saving…" : "Save to private timeline"}</button></form><div className="journey-timeline"><h3>Permanent timeline</h3>{events.map((item) => { var _a; return <article key={String(item.id)}><b>{String(item.action).replaceAll("_", " ")}</b><p>{displayContext(JSON.stringify((_a = item.data) !== null && _a !== void 0 ? _a : {}))}</p><small>{item.createdAt ? new Date(String(item.createdAt)).toLocaleString("en-IN") : ""}</small></article>; })}{!events.length && <p>No journey milestones recorded yet.</p>}</div></> : <div className="chat-empty">Choose an application to manage its journey.</div>}</section></div>
  </div>;
}
function PostAdoptionPanel() {
    var _a, _b, _c, _d, _e, _f;
    const [data, setData] = useState({
        adoptions: [],
        summary: { adoptions: 0, dueCheckins: 0, concernsNeedingReview: 0, openSupportCases: 0, activeReturns: 0 },
    });
    const [adoptionId, setAdoptionId] = useState("");
    const [checkinId, setCheckinId] = useState("");
    const [view, setView] = useState("CHECKINS");
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const load = async () => {
        var _a;
        setBusy(true);
        try {
            const response = await fetch("/api/platform?resource=post-adoption");
            const result = await response.json();
            if (!response.ok)
                throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : "Unable to load after-adoption care.");
            setData(result);
            setAdoptionId((current) => { var _a, _b, _c; return current || String((_c = (_b = (_a = result.adoptions) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : ""); });
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to load after-adoption care.");
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
    const adoption = (_b = (_a = data.adoptions.find((item) => String(item.id) === adoptionId)) !== null && _a !== void 0 ? _a : data.adoptions[0]) !== null && _b !== void 0 ? _b : null;
    const checkins = (_c = adoption === null || adoption === void 0 ? void 0 : adoption.checkins) !== null && _c !== void 0 ? _c : [];
    const selectedCheckin = (_f = (_e = (_d = checkins.find((item) => String(item.id) === checkinId)) !== null && _d !== void 0 ? _d : checkins.find((item) => Boolean(item.due))) !== null && _e !== void 0 ? _e : checkins.find((item) => String(item.status) === "SCHEDULED")) !== null && _f !== void 0 ? _f : null;
    const selectedCheckinOpen = selectedCheckin && String(selectedCheckin.status) === "SCHEDULED" && Boolean(selectedCheckin.available);
    const run = async (work, success) => {
        var _a;
        setBusy(true);
        setNotice("");
        try {
            const result = await work();
            setNotice(String((_a = result.safetyMessage) !== null && _a !== void 0 ? _a : success));
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to save this update.");
        }
        finally {
            setBusy(false);
        }
    };
    const submitCheckin = async (event) => {
        event.preventDefault();
        if (!adoption || !selectedCheckin)
            return;
        const target = event.currentTarget;
        const form = new FormData(target);
        await run(async () => {
            var _a;
            const photoMediaIds = [];
            for (const file of form.getAll("photos").filter((item) => item instanceof File && item.size > 0).slice(0, 4)) {
                const upload = new FormData();
                upload.append("file", file);
                upload.append(
  "purpose",
  "PRIVATE_POST_ADOPTION"
);

upload.append(
  "adoptionId",
  String(adoption.id)
);
                const response = await fetch("/api/media", { method: "POST", body: upload });
                const result = await response.json();
                if (!response.ok)
                    throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : "A check-in photo could not be uploaded.");
                photoMediaIds.push(String(result.id));
            }
            const result = await platform({
                action: "submit-post-adoption-checkin",
                adoptionId: adoption.id,
                checkinId: selectedCheckin.id,
                answers: {
                    eating: form.get("eating"),
                    settling: form.get("settling"),
                    toileting: form.get("toileting"),
                    behaviour: form.get("behaviour"),
                    health: form.get("health"),
                    otherPets: form.get("otherPets"),
                    children: form.get("children"),
                    escapeRisk: form.get("escapeRisk") === "on",
                    needSupport: form.get("needSupport") === "on",
                    notes: form.get("notes"),
                },
                photoMediaIds,
            });
            target.reset();
            return result;
        }, "Check-in saved privately. The other adoption participant has been notified.");
    };
    const submitSupport = async (event) => {
        event.preventDefault();
        if (!adoption)
            return;
        const target = event.currentTarget;
        const form = new FormData(target);
        await run(async () => {
            const result = await platform({ action: "open-post-adoption-support", adoptionId: adoption.id, category: form.get("category"), urgency: form.get("urgency"), summary: form.get("summary") });
            target.reset();
            return result;
        }, "Support request opened privately. Asking for help never counts against an adopter.");
    };
    const submitReturn = async (event) => {
        event.preventDefault();
        if (!adoption)
            return;
        const target = event.currentTarget;
        const form = new FormData(target);
        if (form.get("safePromise") !== "on") {
            setNotice("Confirm that you will not abandon or privately transfer the animal while a safe plan is arranged.");
            return;
        }
        await run(async () => {
            const result = await platform({ action: "request-safe-return", adoptionId: adoption.id, category: form.get("category"), explanation: form.get("explanation"), urgentSafetyRisk: form.get("urgentSafetyRisk") === "on" });
            target.reset();
            return result;
        }, "Safe-return request opened. The original custodian has been notified.");
    };
    return <div className="post-adoption">
    <div className="dashboard-section-head"><div><span className="kicker">SUPPORT FOR LIFE</span><h2>Help the adoption stay successful</h2><p>Private check-ins catch small problems early. Support is available without judgement, and a structured safe return remains available when needed.</p></div><button onClick={load} disabled={busy}>Refresh</button></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    <div className="post-adoption-stats">
      <article><span>ADOPTIONS</span><b>{data.summary.adoptions}</b><small>active care records</small></article>
      <article><span>CHECK-INS DUE</span><b>{data.summary.dueCheckins}</b><small>scheduled milestones</small></article>
      <article><span>NEEDS REVIEW</span><b>{data.summary.concernsNeedingReview + data.summary.openSupportCases}</b><small>concerns and support</small></article>
      <article><span>SAFE RETURNS</span><b>{data.summary.activeReturns}</b><small>being coordinated</small></article>
    </div>
    {!data.adoptions.length ? <div className="post-adoption-empty"><span>♡</span><h3>No after-adoption record yet</h3><p>Once the custodian records the handover, Adoptvilla creates Day 1 through one-year check-ins automatically.</p><a href="?tab=Adoption%20journey">Open adoption journey →</a></div> :
            <div className="post-adoption-layout">
        <aside>
          <h3>Your adoption</h3>
          {data.adoptions.map((item) => <button key={String(item.id)} className={String(adoption === null || adoption === void 0 ? void 0 : adoption.id) === String(item.id) ? "active" : ""} onClick={() => { setAdoptionId(String(item.id)); setCheckinId(""); }}>
            <b>{String(item.petName)}</b><span>{String(item.status).replaceAll("_", " ")}</span><small>Handover {new Date(String(item.handoverAt)).toLocaleDateString("en-IN")}</small>
          </button>)}
          <div className="post-adoption-tabs">
            <button className={view === "CHECKINS" ? "active" : ""} onClick={() => setView("CHECKINS")}>Check-ins</button>
            <button className={view === "SUPPORT" ? "active" : ""} onClick={() => setView("SUPPORT")}>Get support</button>
            <button className={view === "RETURN" ? "active danger" : ""} onClick={() => setView("RETURN")}>Safe return</button>
          </div>
        </aside>
        <section>
          {adoption && view === "CHECKINS" && <>
            <div className="post-adoption-heading"><div><span className="kicker">{String(adoption.perspective)}</span><h3>{String(adoption.petName)}’s adjustment check-ins</h3></div><span className={`status-pill ${String(adoption.status).toLowerCase()}`}>{String(adoption.status).replaceAll("_", " ")}</span></div>
            <div className="checkin-roadmap">{checkins.map((checkin) => <button key={String(checkin.id)} className={`${String(selectedCheckin === null || selectedCheckin === void 0 ? void 0 : selectedCheckin.id) === String(checkin.id) ? "active" : ""} ${checkin.due ? "due" : ""}`} onClick={() => setCheckinId(String(checkin.id))}><b>{String(checkin.milestone).replace("_", " ")}</b><small>{String(checkin.status).replaceAll("_", " ")}</small></button>)}</div>
            {selectedCheckinOpen ? <form className="checkin-form" onSubmit={submitCheckin}>
              <div className="checkin-form-head"><h3>{String(selectedCheckin.milestone).replace("_", " ")} check-in</h3><p>Due {new Date(String(selectedCheckin.scheduledFor)).toLocaleDateString("en-IN")}. Answer honestly—concerns open support, not penalties.</p></div>
              <label>Eating<select name="eating" required><option value="WELL">Eating well</option><option value="SOME_CONCERN">Some concern</option><option value="NOT_EATING">Not eating</option></select></label>
              <label>Settling<select name="settling" required><option value="WELL">Settling well</option><option value="SLOWLY">Settling slowly</option><option value="NOT_SETTLING">Not settling</option></select></label>
              <label>Toileting<select name="toileting" required><option value="OK">Going well</option><option value="SOME_ISSUES">Some issues</option><option value="SERIOUS_ISSUES">Serious issues</option></select></label>
              <label>Behaviour<select name="behaviour" required><option value="OK">No current concern</option><option value="NEEDS_GUIDANCE">I need guidance</option><option value="SAFETY_CONCERN">Safety concern</option></select></label>
              <label>Health<select name="health" required><option value="OK">No current concern</option><option value="VET_ADVICE_NEEDED">Vet advice needed</option><option value="URGENT">Urgent concern</option></select></label>
              <label>With other pets<select name="otherPets" required><option value="NOT_APPLICABLE">Not applicable</option><option value="OK">Going well</option><option value="TENSION">Some tension</option><option value="UNSAFE">Unsafe interaction</option></select></label>
              <label>With children<select name="children" required><option value="NOT_APPLICABLE">Not applicable</option><option value="OK">Going well</option><option value="CONCERN">Some concern</option><option value="UNSAFE">Unsafe interaction</option></select></label>
              <label className="check-option"><input name="escapeRisk" type="checkbox"/> There is an escape or containment risk</label>
              <label className="check-option"><input name="needSupport" type="checkbox"/> I would like support</label>
              <label className="wide">Anything else we should know?<textarea name="notes" rows={4} maxLength={4000} placeholder="Describe routines, progress, changes or concerns."/></label>
              <label className="wide">Optional update photos<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small>Up to 4 photos. Private to adoption participants and authorized reviewers.</small></label>
              <button className="primary wide" disabled={busy}>{busy ? "Saving…" : "Submit private check-in"}</button>
            </form> : selectedCheckin && String(selectedCheckin.status) === "SCHEDULED" ? <div className="upcoming-checkin"><span>UPCOMING CHECK-IN</span><h3>{String(selectedCheckin.milestone).replace("_", " ")}</h3><p>This check-in opens on {new Date(String(selectedCheckin.scheduledFor)).toLocaleDateString("en-IN")}. Use “Get support” now if you do not want to wait.</p><button onClick={() => setView("SUPPORT")}>Get support now →</button></div> : selectedCheckin ? <CheckinResult checkin={selectedCheckin} canReview={String(adoption.perspective) === "CUSTODIAN"} busy={busy} onReview={(resolved, notes) => run(() => platform({ action: "review-post-adoption-checkin", checkinId: selectedCheckin.id, resolved, notes }), resolved ? "Check-in concern marked resolved." : "Review notes saved; support remains open.")}/> : null}
          </>}
          {adoption && view === "SUPPORT" && <>
            <div className="post-adoption-heading"><div><span className="kicker">EARLY HELP</span><h3>I’m struggling with {String(adoption.petName)}</h3><p>Tell us what is happening. This does not lower readiness or count against you.</p></div></div>
            <form className="support-request-form" onSubmit={submitSupport}>
              <label>What kind of help?<select name="category"><option>BEHAVIOUR</option><option>MEDICAL</option><option>FINANCIAL</option><option>FAMILY</option><option value="PET_CONFLICT">Conflict with another pet</option><option>MOVING</option><option value="ESCAPE_RISK">Escape risk</option><option>OTHER</option></select></label>
              <label>How urgent?<select name="urgency"><option value="ROUTINE">Routine guidance</option><option value="PRIORITY">Please respond soon</option><option value="URGENT">Urgent safety or health concern</option></select></label>
              <label className="wide">What is happening?<textarea name="summary" required minLength={20} maxLength={4000} rows={6} placeholder="Share the facts, what has changed and what help would be useful."/></label>
              <div className="urgent-guidance wide"><b>Immediate danger or medical emergency?</b><p>Contact an emergency veterinarian or relevant local emergency resource now. Adoptvilla does not dispatch or guarantee a response.</p></div>
              <button className="primary wide" disabled={busy}>Request private support</button>
            </form>
            <SupportCaseList cases={adoption.supportCases} canTriage={String(adoption.perspective) === "CUSTODIAN"} busy={busy} onTriage={(supportCaseId, next, notes) => run(() => platform({ action: "triage-post-adoption-support", supportCaseId, next, notes }), "Support plan updated and shared privately.")}/>
          </>}
          {adoption && view === "RETURN" && <>
            <div className="safe-return-intro"><span>RETURN TO SAFETY</span><h3>A safe return is always better than abandonment</h3><p>We first look for practical support where appropriate. If return is necessary, the original custodian or authorized team coordinates a documented handover so the pet’s history stays intact.</p></div>
            {!adoption.returnCases.some((item) => !["WITHDRAWN", "CLOSED"].includes(String(item.status))) && <form className="safe-return-form" onSubmit={submitReturn}>
              <label>Primary reason<select name="category"><option>BEHAVIOUR</option><option>MEDICAL</option><option>FINANCIAL</option><option>FAMILY</option><option value="PET_CONFLICT">Conflict with another pet</option><option>MOVING</option><option>SAFETY</option><option>OTHER</option></select></label>
              <label className="wide">Explain the situation<textarea name="explanation" required minLength={20} maxLength={4000} rows={6} placeholder="What happened, what support has been tried and what is needed now?"/></label>
              <label className="check-option wide"><input name="urgentSafetyRisk" type="checkbox"/> There is an immediate safety concern</label>
              <label className="check-option wide"><input name="safePromise" type="checkbox" required/> I will not abandon, sell or privately transfer the animal while a safe plan is arranged.</label>
              <button className="primary wide" disabled={busy}>Request a safe return</button>
            </form>}
            <ReturnCaseList cases={adoption.returnCases} perspective={String(adoption.perspective)} busy={busy} onTransition={(returnCaseId, next, notes, scheduledHandoverAt) => run(() => platform({ action: "transition-safe-return", returnCaseId, next, notes, scheduledHandoverAt }), "Safe-return plan updated and shared privately.")}/>
          </>}
        </section>
      </div>}
  </div>;
}
function CheckinResult({ checkin, canReview, busy, onReview }) {
    var _a, _b, _c;
    const concerns = ((_a = checkin.concerns) !== null && _a !== void 0 ? _a : []);
    return <div className="checkin-result"><div><span className="kicker">{String(checkin.status).replaceAll("_", " ")}</span><h3>Check-in received</h3><p>Submitted {checkin.submittedAt ? new Date(String(checkin.submittedAt)).toLocaleString("en-IN") : ""}</p></div>
    <div className="checkin-result-grid"><article><span>CONCERN LEVEL</span><b>{Number(checkin.concernScore) < 20 ? "No review needed" : Number(checkin.concernScore) >= 50 ? "Urgent review" : "Support review"}</b></article><article><span>FLAGS</span><b>{concerns.length}</b></article></div>
    {concerns.length > 0 && <ul>{concerns.map((concern) => <li key={concern}>{concern}</li>)}</ul>}
    {((_b = checkin.photoMediaIds) !== null && _b !== void 0 ? _b : []).length > 0 && <div className="checkin-photos">{((_c = checkin.photoMediaIds) !== null && _c !== void 0 ? _c : []).map((mediaId, index) => <img key={mediaId} src={mediaSrc(mediaId)} alt={`Private check-in update ${index + 1}`}/>)}</div>}
    {Boolean(checkin.reviewerNotes) && <div className="review-note"><b>Review note</b><p>{String(checkin.reviewerNotes)}</p></div>}
    {canReview && String(checkin.status) === "REVIEW_NEEDED" && <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onReview(form.get("resolved") === "YES", String(form.get("notes"))); }}><label>Review outcome<select name="resolved"><option value="NO">Keep support open</option><option value="YES">Concern resolved</option></select></label><label>Factual support notes<textarea name="notes" required minLength={20} maxLength={4000} rows={4}/></label><button className="primary" disabled={busy}>Save review</button></form>}
  </div>;
}
function SupportCaseList({ cases, canTriage, busy, onTriage }) {
    const transitions = { OPEN: ["TRIAGED", "RESOLVED", "RETURN_REQUESTED", "CLOSED"], TRIAGED: ["PLAN_AGREED", "RESOLVED", "RETURN_REQUESTED", "CLOSED"], PLAN_AGREED: ["RESOLVED", "RETURN_REQUESTED", "CLOSED"], RESOLVED: ["CLOSED"], RETURN_REQUESTED: ["CLOSED"], CLOSED: [] };
    return <div className="support-case-list"><h3>Support history</h3>{cases.map((item) => { var _a, _b; return <article key={String(item.id)}><div><span>{String(item.urgency)}</span><h4>{String(item.category).replaceAll("_", " ")}</h4><p>{String(item.summary)}</p><small>{String(item.status).replaceAll("_", " ")} · {new Date(String(item.createdAt)).toLocaleString("en-IN")}</small></div>{canTriage && ((_a = transitions[String(item.status)]) !== null && _a !== void 0 ? _a : []).length > 0 && <form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onTriage(String(item.id), String(form.get("next")), String(form.get("notes"))); }}><select name="next">{((_b = transitions[String(item.status)]) !== null && _b !== void 0 ? _b : []).map((next) => <option key={next}>{next}</option>)}</select><textarea name="notes" required minLength={20} placeholder="Agreed help and next step"/><button disabled={busy}>Update</button></form>}</article>; })}{!cases.length && <p>No support cases. You can ask for help at any point.</p>}</div>;
}
function ReturnCaseList({ cases, perspective, busy, onTransition }) {
    return <div className="return-case-list">{cases.map((item) => {
            var _a;
            const status = String(item.status);
            const options = {
                REQUESTED: ["TRIAGED", "SUPPORT_OFFERED", "RETURN_APPROVED"],
                TRIAGED: ["SUPPORT_OFFERED", "RETURN_APPROVED"],
                SUPPORT_OFFERED: ["RETURN_APPROVED", "CLOSED"],
                RETURN_APPROVED: ["HANDOVER_SCHEDULED"],
                HANDOVER_SCHEDULED: ["RETURNED"],
                RETURNED: ["CLOSED"],
            };
            return <article key={String(item.id)}><span>{item.urgentSafetyRisk ? "URGENT SAFETY REVIEW" : "SAFE RETURN PLAN"}</span><h3>{String(item.category).replaceAll("_", " ")}</h3><p>{String(item.explanation)}</p><b>{status.replaceAll("_", " ")}</b>{Boolean(item.resolutionNotes) && <small>{String(item.resolutionNotes)}</small>}
      {perspective === "CUSTODIAN" && ((_a = options[status]) !== null && _a !== void 0 ? _a : []).length > 0 && <form onSubmit={(event) => { var _a; event.preventDefault(); const form = new FormData(event.currentTarget); onTransition(String(item.id), String(form.get("next")), String(form.get("notes")), String((_a = form.get("scheduledHandoverAt")) !== null && _a !== void 0 ? _a : "")); }}><label>Next step<select name="next">{options[status].map((option) => <option key={option}>{option}</option>)}</select></label>{status === "RETURN_APPROVED" && <label>Safe handover date<input name="scheduledHandoverAt" type="datetime-local" required/></label>}<label className="wide">Agreed plan<textarea name="notes" required minLength={20} rows={4}/></label><button className="primary wide" disabled={busy}>Update safe-return plan</button></form>}
      {perspective === "ADOPTER" && ["REQUESTED", "TRIAGED", "SUPPORT_OFFERED", "RETURN_APPROVED", "HANDOVER_SCHEDULED"].includes(status) && <button disabled={busy} onClick={() => onTransition(String(item.id), "WITHDRAWN", "", "")}>Withdraw request</button>}
    </article>;
        })}</div>;
}
function displayContext(value) {
    try {
        const parsed = JSON.parse(String(value !== null && value !== void 0 ? value : "{}"));
        return Object.values(parsed).map(String).join(" · ") || "Workflow update";
    }
    catch (_a) {
        return "Workflow update";
    }
}
function DirectoryFeedback() {
    const [notice, setNotice] = useState("");
    const submit = async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setNotice("");
        try {
            await platform({ action: "submit-directory-feedback", directoryId: form.get("directoryId"), feedbackType: form.get("feedbackType"), details: form.get("details") });
            setNotice("Submitted for review. Public information has not been changed automatically.");
            event.currentTarget.reset();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to submit feedback.");
        }
    };
    return <form className="dashboard-form" onSubmit={submit}><div className="dashboard-section-head"><div><h2>Claim or correct a directory profile</h2><p>Every submission is reviewed. A claim does not automatically create a verified badge.</p></div><a href="/indore">View Indore directory →</a></div>{notice && <div className="dashboard-notice">{notice}</div>}<div className="form-section"><span>⌖</span><div><div className="form-grid"><label>Directory record ID<input name="directoryId" required placeholder="Shown in the directory record URL or supplied by support"/></label><label>Request type<select name="feedbackType"><option value="CORRECTION">Suggest correction</option><option value="CLAIM">Claim organization</option><option value="CLOSED">Report closed</option><option value="WRONG_CONTACT">Wrong contact</option><option value="MOVED">Moved</option></select></label><label className="wide">Evidence and details<textarea name="details" required minLength={10} rows={5} placeholder="Explain the correction and include a public source where possible."/></label></div><button className="primary">Submit for review</button></div></div></form>;
}
function LostFoundNetwork({ organizations }) {
    var _a, _b;
    const [data, setData] = useState({
        reports: [], matches: [], summary: { myReports: 0, openLost: 0, openFound: 0, possibleMatches: 0, reunited: 0 },
    });
    const [view, setView] = useState("NETWORK");
    const [reportType, setReportType] = useState("LOST");
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const [organizationId, setOrganizationId] = useState(String((_b = (_a = organizations[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : ""));
    const load = async () => {
        var _a;
        setBusy(true);
        try {
            const response = await fetch("/api/platform?resource=lost-found-network");
            const result = await response.json();
            if (!response.ok)
                throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : "Unable to load lost-and-found reports.");
            setData(result);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to load lost-and-found reports.");
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => {
        const timer = window.setTimeout(() => { void load(); }, 0);
        return () => window.clearTimeout(timer);
    }, []);
    const act = async (body, success) => {
        setBusy(true);
        setNotice("");
        try {
            await platform(body);
            setNotice(success);
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to update this lost-and-found workflow.");
        }
        finally {
            setBusy(false);
        }
    };
    const submitReport = async (event) => {
        var _a, _b;
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        setBusy(true);
        setNotice("");
        try {
            const files = values.getAll("photos").filter((item) => item instanceof File && item.size > 0).slice(0, 5);
            const mediaIds = [];
            for (const file of files) {
                const upload = new FormData();
                upload.append("file", file);
                upload.append("purpose", "PUBLIC_WELFARE");
                const response = await fetch("/api/media", { method: "POST", body: upload });
                const uploaded = await response.json();
                if (!response.ok)
                    throw new Error((_a = uploaded.error) !== null && _a !== void 0 ? _a : "A report photo could not be uploaded.");
                mediaIds.push(String(uploaded.id));
            }
            const result = await platform({
                action: "save-lost-found-report",
                report: {
                    type: reportType,
                    petName: values.get("petName"),
                    species: values.get("species"),
                    breedType: values.get("breedType"),
                    colours: String((_b = values.get("colours")) !== null && _b !== void 0 ? _b : "").split(","),
                    sex: values.get("sex"),
                    size: values.get("size"),
                    ageBand: values.get("ageBand"),
                    publicDescription: values.get("publicDescription"),
                    privateProofMarks: values.get("privateProofMarks"),
                    collarPublic: values.get("collarPublic"),
                    microchipPrivate: values.get("microchipPrivate"),
                    eventDate: values.get("eventDate"),
                    city: values.get("city"),
                    localityApprox: values.get("localityApprox"),
                    preciseLocationPrivate: values.get("preciseLocationPrivate"),
                    movementDirection: values.get("movementDirection"),
                    condition: values.get("condition"),
                    currentSafeStatus: values.get("currentSafeStatus"),
                    canHoldUntil: values.get("canHoldUntil"),
                    mediaIds,
                },
            });
            form.reset();
            setView("NETWORK");
            setNotice(`${result.publicReference} is live. Private proof details and the exact location remain hidden.`);
            await load();
            await platform({ action: "calculate-lost-found-matches", reportId: result.reportId });
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to create this report.");
        }
        finally {
            setBusy(false);
        }
    };
    const openStatuses = ["REPORTED", "POSSIBLE_MATCH", "CONTACTED", "VERIFICATION"];
    const ownReports = data.reports.filter((report) => report.relationship === "REPORTER");
    const communityReports = data.reports.filter((report) => report.relationship === "COMMUNITY" && openStatuses.includes(String(report.status)));
    return <div className="lost-found-network">
    <div className="dashboard-section-head"><div><span className="kicker">REUNITE SAFELY</span><h2>Lost & Found Network</h2><p>Compare reports without publishing phone numbers, exact locations, microchips or the identifying detail used to prove ownership.</p></div><div className="lost-found-head-actions"><button onClick={() => { setReportType("LOST"); setView("REPORT"); }}>Report lost</button><button className="primary" onClick={() => { setReportType("FOUND"); setView("REPORT"); }}>Report found animal</button></div></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    {view === "REPORT" ? <form className="lost-found-form" onSubmit={submitReport}>
      <div className="lost-found-form-head"><div><span>{reportType === "LOST" ? "MY ANIMAL IS MISSING" : "I FOUND AN ANIMAL"}</span><h3>{reportType === "LOST" ? "Create a searchable lost report" : "Record a found animal without exposing its location"}</h3><p>Clear facts improve possible matches. Adoptvilla suggests candidates; people must verify identity and ownership.</p></div><button type="button" onClick={() => setView("NETWORK")}>Close ×</button></div>
      <div className="privacy-banner"><b>Keep one identifying detail private</b><p>Do not put every unique mark in the public description. The private detail is used later to challenge an ownership claim.</p></div>
      <div className="form-grid">
        {reportType === "LOST" && <label>Pet name<input name="petName" placeholder="Name people may call"/></label>}
        <label>Species<input name="species" list="lost-found-species" required placeholder="Dog, cat, bird, rabbit…"/><datalist id="lost-found-species"><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Guinea pig</option><option>Other companion animal</option></datalist></label>
        <label>Breed or type<input name="breedType" placeholder="Indie, mixed, unknown, Labrador…"/></label>
        <label>Colours<input name="colours" required placeholder="e.g. black, tan, white"/><small className="field-help">Separate multiple colours with commas.</small></label>
        <label>Sex<select name="sex"><option value="UNKNOWN">Unknown</option><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="INTERSEX">Intersex</option></select></label>
        <label>Size<select name="size"><option value="UNKNOWN">Unknown</option><option value="TINY">Tiny</option><option value="SMALL">Small</option><option value="MEDIUM">Medium</option><option value="LARGE">Large</option><option value="GIANT">Giant</option></select></label>
        <label>Age group<select name="ageBand"><option value="UNKNOWN">Unknown</option><option value="YOUNG">Young</option><option value="ADULT">Adult</option><option value="SENIOR">Senior</option></select></label>
        <label>{reportType === "LOST" ? "Last seen date" : "Found date"}<input name="eventDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)}/></label>
        <label>City<input name="city" required defaultValue="Indore"/></label>
        <label>Approximate public locality<input name="localityApprox" required placeholder="Area only, not a full address"/></label>
        <label className="wide">Public description<textarea name="publicDescription" required minLength={10} rows={4} placeholder="Appearance, behaviour, coat, mobility and other useful details. Keep one unique ownership detail private."/></label>
        <label className="wide">Private identifying detail<textarea name="privateProofMarks" required minLength={4} rows={3} placeholder="A scar, tooth detail, unusual marking, private photo detail or another fact a genuine owner should know"/><small className="field-help">Never shown in community search. Only you and authorized reviewers can see it.</small></label>
        <label>Collar or visible accessory<input name="collarPublic" placeholder="Public colour or description"/></label>
        <label>Microchip number — private<input name="microchipPrivate" placeholder="Never shown publicly"/></label>
        <label className="wide">Exact location — private<input name="preciseLocationPrivate" placeholder="Building, landmark, map pin or safe location; authorized access only"/></label>
        <label>Direction of travel<input name="movementDirection" placeholder="e.g. toward Vijay Nagar"/></label>
        <label>Observed condition<input name="condition" placeholder="Healthy, limping, frightened, injured…"/></label>
        {reportType === "FOUND" && <><label>Where is the animal now?<select name="currentSafeStatus" required defaultValue=""><option value="" disabled>Choose status</option><option value="WITH_FINDER">Safe with me</option><option value="ROAMING">Still roaming nearby</option><option value="AT_VET">At a veterinary clinic</option><option value="WITH_ORGANIZATION">With a shelter or NGO</option><option value="UNKNOWN">Current location unknown</option></select></label><label>Can safely hold until<input name="canHoldUntil" type="datetime-local"/></label></>}
        <label className="wide">Recent photos — up to five<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small className="field-help">Use clear face, body and marking photos. Do not include people, IDs or house numbers.</small></label>
      </div>
      <div className="lost-found-submit"><button type="button" onClick={() => setView("NETWORK")}>Cancel</button><button className="primary" disabled={busy}>{busy ? "Saving and checking reports…" : `Publish ${reportType.toLowerCase()} report and check matches`}</button></div>
    </form> : <>
      <div className="lost-found-stats"><article><span>My reports</span><b>{data.summary.myReports}</b></article><article><span>Open lost</span><b>{data.summary.openLost}</b></article><article><span>Open found</span><b>{data.summary.openFound}</b></article><article><span>Possible matches</span><b>{data.summary.possibleMatches}</b></article><article className="success"><span>My reunions</span><b>{data.summary.reunited}</b></article></div>

      <section className="lost-found-section"><div className="lost-found-section-head"><div><h3>Your reports</h3><p>Run matching again whenever new community reports or shelter records appear.</p></div></div>
        <div className="lost-found-report-grid">{ownReports.map((report) => {
                var _a, _b, _c;
                return <article className={`lost-found-report ${String(report.type).toLowerCase()}`} key={String(report.id)}>
          <div className="lost-found-report-top"><span>{String(report.publicReference)}</span><em>{String(report.status).replaceAll("_", " ")}</em></div>
          <h4>{String(report.type) === "LOST" ? String(report.petName || "Missing animal") : "Found animal"} · {String(report.species)}</h4>
          <p>{String(report.publicDescription)}</p>
          <small>{((_a = report.colours) !== null && _a !== void 0 ? _a : []).join(", ")} · {String(report.size)} · {String(report.localityApprox)}, {String(report.city)} · {new Date(String(report.eventDate)).toLocaleDateString("en-IN")}</small>
          {((_b = report.mediaIds) !== null && _b !== void 0 ? _b : []).length > 0 && <div className="lost-found-photos">{((_c = report.mediaIds) !== null && _c !== void 0 ? _c : []).map((mediaId, index) => <img key={mediaId} src={mediaSrc(mediaId)} alt={`${String(report.type).toLowerCase()} ${String(report.species)} report photo ${index + 1}`}/>)}</div>}
          <div className="lost-found-report-actions">
            {openStatuses.includes(String(report.status)) && <button disabled={busy} onClick={() => act({ action: "calculate-lost-found-matches", reportId: report.id }, "Reports checked again. Possible matches are ranked below with reasons and confidence.")}>Check new possible matches</button>}
            {report.type === "FOUND" && organizations.length > 0 && !report.crmAnimalId && openStatuses.includes(String(report.status)) && <><select aria-label="Organization accepting the found animal" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>{organizations.map((organization) => <option value={String(organization.id)} key={String(organization.id)}>{String(organization.name)}</option>)}</select><button disabled={busy || !organizationId} onClick={() => act({ action: "accept-found-into-care", reportId: report.id, organizationId }, "Found animal linked to the organization’s permanent CRM record.")}>Accept into organization care</button></>}
            {openStatuses.includes(String(report.status)) && <button disabled={busy} onClick={() => act({ action: "close-lost-found-report", reportId: report.id, next: report.type === "FOUND" ? "OWNER_NOT_FOUND" : "CLOSED" }, "Report closed and retained in the audit history.")}>Close report</button>}
            
            {String(report.status) === "CLOSED" && (
  <button
    disabled={busy}
    onClick={() => {
      const confirmed = window.confirm(
        "Permanently delete this closed report? Reports with match or reunion history cannot be deleted."
      );

      if (!confirmed) return;

      void act(
        {
          action: "delete-lost-found-report",
          reportId: report.id,
        },
        "Closed report deleted."
      );
    }}
  >
    Delete report
  </button>
)}
          </div>
        </article>;
            })}{!ownReports.length && <div className="record-empty">You have not created a lost or found report yet.</div>}</div>
      </section>

      <section className="lost-found-section"><div className="lost-found-section-head"><div><h3>Possible matches for your reports</h3><p>Scores rank structured similarities. They do not prove identity or ownership.</p></div></div>
        <div className="lost-found-match-list">{data.matches.map((match) => {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                const perspective = String(match.perspective);
                const other = (perspective === "LOST_REPORTER" ? match.foundReport : match.lostReport);
                const mineInterested = perspective === "LOST_REPORTER" ? Boolean(match.lostReporterInterested) : perspective === "FOUND_REPORTER" ? Boolean(match.foundReporterInterested) : true;
                return <article className="lost-found-match" key={String(match.id)}>
            <div className="lost-found-match-score"><b>{String(match.score)}%</b><span>{String(match.confidence)} confidence</span><small>{String(match.status).replaceAll("_", " ")}</small></div>
            <div className="lost-found-match-body"><span>{perspective === "LOST_REPORTER" ? "POSSIBLE FOUND REPORT" : perspective === "FOUND_REPORTER" ? "POSSIBLE LOST REPORT" : "ADMIN REVIEW"}</span><h4>{String((_a = other === null || other === void 0 ? void 0 : other.species) !== null && _a !== void 0 ? _a : "Animal")} · {String((_b = other === null || other === void 0 ? void 0 : other.localityApprox) !== null && _b !== void 0 ? _b : "")}, {String((_c = other === null || other === void 0 ? void 0 : other.city) !== null && _c !== void 0 ? _c : "")}</h4><p>{String((_d = other === null || other === void 0 ? void 0 : other.publicDescription) !== null && _d !== void 0 ? _d : "")}</p>
              {((_e = other === null || other === void 0 ? void 0 : other.mediaIds) !== null && _e !== void 0 ? _e : []).length > 0 && <div className="lost-found-photos">{((_f = other === null || other === void 0 ? void 0 : other.mediaIds) !== null && _f !== void 0 ? _f : []).map((mediaId, index) => <img key={mediaId}src={mediaSrc(mediaId)} alt={`Possible match photo ${index + 1}`}/>)}</div>}
              <div className="match-explanation"><div><b>Why it may match</b>{((_g = match.reasons) !== null && _g !== void 0 ? _g : []).map((reason) => <p key={reason}>✓ {reason}</p>)}</div>{((_h = match.warnings) !== null && _h !== void 0 ? _h : []).length > 0 && <div><b>Check carefully</b>{((_j = match.warnings) !== null && _j !== void 0 ? _j : []).map((warning) => <p key={warning}>⚠ {warning}</p>)}</div>}</div>
              <div className="lost-found-match-actions">
                {!mineInterested && ["SUGGESTED", "INTERESTED"].includes(String(match.status)) && <button className="primary" disabled={busy} onClick={() => act({ action: "express-lost-found-interest", matchId: match.id }, "Interest recorded privately. Chat unlocks only if the other reporter also agrees.")}>This could be the same animal</button>}
                {mineInterested && !["MUTUAL", "VERIFICATION", "CONFIRMED"].includes(String(match.status)) && <em>Waiting for the other reporter</em>}
                {["SUGGESTED", "INTERESTED", "MUTUAL", "VERIFICATION"].includes(String(match.status)) && <button disabled={busy} onClick={() => act({ action: "mark-lost-found-false-match", matchId: match.id, reason: "Closed by a report participant." }, "This candidate was marked as a false match. Both reports remain searchable.")}>Not the same animal</button>}
              </div>
              {Boolean(match.threadId) && <LostFoundChat threadId={String(match.threadId)} onNotice={setNotice}/>}
              {perspective === "LOST_REPORTER" && match.status === "MUTUAL" && <form className="ownership-proof" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); void act({ action: "submit-ownership-verification", matchId: match.id, proofAnswer: form.get("proofAnswer") }, "Ownership detail sent privately for comparison. No handover is approved automatically."); }}><b>Prove ownership privately</b><p>Describe a detail that was not shown publicly. Never send ID numbers or payment.</p><textarea name="proofAnswer" required minLength={10} maxLength={1500} rows={3}/><button className="primary" disabled={busy}>Submit for verification</button></form>}
              {perspective === "FOUND_REPORTER" && match.status === "VERIFICATION" && <div className="reunion-confirm"><b>Compare the private answer before handover</b><p>Check photos, veterinary or microchip records where available, and meet safely. Confirmation records a reunion; it is not a guarantee.</p><button className="primary" disabled={busy} onClick={() => act({ action: "confirm-lost-found-reunion", matchId: match.id }, "Reunion confirmed and both reports closed successfully.")}>Confirm safe reunion</button></div>}
              {match.status === "CONFIRMED" && <div className="reunion-confirm success"><b>Reunion confirmed</b><p>This match remains in the permanent audit history.</p></div>}
            </div>
          </article>;
            })}{!data.matches.length && <div className="record-empty">No possible matches yet. Create a report or recheck an open report as new information arrives.</div>}</div>
      </section>

      <section className="lost-found-section community"><div className="lost-found-section-head"><div><h3>Recent community reports</h3><p>Only approximate, non-sensitive details are shown. Contact is controlled through mutual matching.</p></div></div><div className="lost-found-community-grid">{communityReports.slice(0, 18).map((report) => { var _a; return <article key={String(report.id)}><span>{String(report.type)} · {String(report.publicReference)}</span><h4>{String(report.species)} · {String(report.localityApprox)}</h4><p>{String(report.publicDescription)}</p><small>{((_a = report.colours) !== null && _a !== void 0 ? _a : []).join(", ")} · {new Date(String(report.eventDate)).toLocaleDateString("en-IN")}</small></article>; })}{!communityReports.length && <div className="record-empty">No community reports are visible right now.</div>}</div></section>
    </>}
  </div>;
}
function LostFoundChat({ threadId, onNotice }) {
    const [messages, setMessages] = useState([]);
    const [busy, setBusy] = useState(false);
    const load = async () => {
        var _a, _b;
        const response = await fetch(`/api/platform?resource=lost-found-thread&threadId=${encodeURIComponent(threadId)}`);
        const result = await response.json();
        if (!response.ok)
            throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : "Unable to load the private conversation.");
        setMessages((_b = result.messages) !== null && _b !== void 0 ? _b : []);
    };
    useEffect(() => {
        const timer = window.setTimeout(() => { void load().catch((problem) => onNotice(problem instanceof Error ? problem.message : "Unable to load the private conversation.")); }, 0);
        return () => window.clearTimeout(timer);
        // Thread identity is the intended load boundary.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [threadId]);
    const send = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        setBusy(true);
        try {
            await platform({ action: "send-lost-found-message", threadId, message: values.get("message") });
            form.reset();
            await load();
        }
        catch (problem) {
            onNotice(problem instanceof Error ? problem.message : "Unable to send the message.");
        }
        finally {
            setBusy(false);
        }
    };
    return <section className="lost-found-chat"><div className="lost-found-chat-head"><div><b>Private reunion chat</b><small>Phone numbers and exact addresses stay hidden unless you deliberately share them.</small></div><button onClick={() => void load()}>Refresh</button></div><div className="lost-found-chat-log">{messages.map((message) => <p className={message.mine ? "mine" : ""} key={String(message.id)}>{String(message.body)}<small>{new Date(String(message.createdAt)).toLocaleString("en-IN")}</small></p>)}{!messages.length && <em>Mutual interest is confirmed. Ask a focused question or discuss a safe verification step.</em>}</div><form onSubmit={send}><input name="message" required maxLength={3000} placeholder="Write a private message…"/><button className="primary" disabled={busy}>{busy ? "Sending…" : "Send"}</button></form></section>;
}
function RescueNetwork({ organizations, directory }) {
    var _a, _b;
    const [data, setData] = useState({ cases: [], fosterProfile: null, matches: [], summary: { myReports: 0, openNearby: 0, critical: 0, fosterOffers: 0 } });
    const [view, setView] = useState("CASES");
    const [organizationId, setOrganizationId] = useState(String((_b = (_a = organizations[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : ""));
    const [candidates, setCandidates] = useState({});
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const load = async () => {
        var _a;
        setBusy(true);
        try {
            const response = await fetch("/api/platform?resource=rescue-network");
            const result = await response.json();
            if (!response.ok)
                throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : "Unable to load rescue cases.");
            setData(result);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to load rescue cases.");
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
    const report = async (event) => {
        var _a;
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        setBusy(true);
        setNotice("");
        try {
            const files = values.getAll("photos").filter((item) => item instanceof File && item.size > 0).slice(0, 4);
            const mediaIds = [];
            for (const file of files) {
                upload.append("purpose", "PUBLIC_WELFARE");
                const upload = new FormData();
                upload.append("file", file);
                const response = await fetch("/api/media", { method: "POST", body: upload });
                const uploaded = await response.json();
                if (!response.ok)
                    throw new Error((_a = uploaded.error) !== null && _a !== void 0 ? _a : "A rescue photo could not be uploaded.");
                mediaIds.push(String(uploaded.id));
            }
            const result = await platform({ action: "save-rescue-case", rescue: {
                    species: values.get("species"), animalCount: values.get("animalCount"), ageBand: values.get("ageBand"),
                    condition: values.get("condition"), urgency: values.get("urgency"), city: values.get("city"),
                    localityApprox: values.get("localityApprox"), landmarkPrivate: values.get("landmarkPrivate"),
                    safeAccessNotes: values.get("safeAccessNotes"), helpNeeds: values.getAll("helpNeeds"), mediaIds,
                } });
            form.reset();
            setView("CASES");
            setNotice(`Rescue case ${result.publicReference} was recorded. No rescue response has been promised.`);
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to save this rescue case.");
        }
        finally {
            setBusy(false);
        }
    };
    const calculate = async (rescueCaseId) => {
        setBusy(true);
        setNotice("");
        try {
            const result = await platform({ action: "calculate-foster-matches", rescueCaseId });
            setCandidates((current) => (Object.assign(Object.assign({}, current), { [rescueCaseId]: result.candidates })));
            setNotice(`${result.eligibleCount} eligible foster options found from ${result.evaluatedCount} available profiles.`);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to calculate foster matches.");
        }
        finally {
            setBusy(false);
        }
    };
    const act = async (body, success) => {
        setBusy(true);
        setNotice("");
        try {
            await platform(body);
            setNotice(success);
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to update this case.");
        }
        finally {
            setBusy(false);
        }
    };
    return <div className="rescue-network">
    <div className="dashboard-section-head"><div><span className="kicker">WHO NEEDS HELP?</span><h2>Rescue and help network</h2><p>Record the situation once, route it to relevant resources, find a capable foster and preserve the animal’s history.</p></div><div className="rescue-head-actions"><a href="/indore">Find verified help</a><button className="primary" onClick={() => setView(view === "REPORT" ? "CASES" : "REPORT")}>{view === "REPORT" ? "Back to cases" : "+ Report an animal"}</button></div></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    {view === "REPORT" ? <form className="rescue-report-form" onSubmit={report}>
      <div className="rescue-safety"><b>If an animal or person is in immediate danger</b><p>Contact an appropriate emergency veterinarian, public authority or verified local organization directly. Adoptvilla records and routes information; it does not dispatch or guarantee rescue.</p></div>
      <div className="form-grid">
        <label>Species<input name="species" required list="rescue-species" placeholder="Dog, cat, bird, rabbit…"/><datalist id="rescue-species"><option>Dog</option><option>Cat</option><option>Bird</option><option>Rabbit</option><option>Wildlife</option></datalist></label>
        <label>Number of animals<input name="animalCount" type="number" min="1" max="20" defaultValue="1" required/></label>
        <label>Age group<select name="ageBand"><option value="UNKNOWN">Unknown</option><option value="NEONATAL">Newborn / neonatal</option><option value="PUPPY_KITTEN">Puppy / kitten</option><option value="ADULT">Adult</option><option value="SENIOR">Senior</option></select></label>
        <label>Urgency<select name="urgency" required><option value="ROUTINE">Routine help</option><option value="SOON">Needs help soon</option><option value="URGENT">Urgent</option><option value="CRITICAL">Critical / immediate risk</option></select></label>
        <label>City<input name="city" defaultValue="Indore" required/></label>
        <label>Approximate public locality<input name="localityApprox" required placeholder="Area only—never an exact home address"/></label>
        <label className="wide">Condition and what you observed<textarea name="condition" required minLength={10} rows={4} placeholder="Describe injuries, mobility, breathing, bleeding, age and immediate risks without diagnosing."/></label>
        <label className="wide">Photos — up to four<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple/><small className="field-help">Use clear, recent images. Do not photograph people, identity documents or exact house numbers.</small></label>
        <fieldset className="wide"><legend>What help may be needed?</legend>{[["VETERINARY", "Veterinary care"], ["TRANSPORT", "Safe transport"], ["SHELTER", "Shelter space"], ["FOSTER", "Temporary foster"], ["MEDICATION", "Medication support"], ["NEONATAL_CARE", "Neonatal care"], ["ISOLATION", "Isolation"], ["MOBILITY_SUPPORT", "Mobility support"]].map(([value, label]) => <label key={value}><input type="checkbox" name="helpNeeds" value={value}/> {label}</label>)}</fieldset>
        <label className="wide">Exact landmark — private<input name="landmarkPrivate" placeholder="Visible only to authorized people handling this case"/></label>
        <label className="wide">Safe-access notes<textarea name="safeAccessNotes" rows={3} placeholder="Traffic, gate access, fearful animal, unsafe area or handling warnings"/></label>
      </div><button className="primary" disabled={busy}>{busy ? "Recording safely…" : "Record and route this case"}</button>
    </form> : <>
      <div className="rescue-stats"><article><span>My reports</span><b>{data.summary.myReports}</b></article><article><span>Open nearby</span><b>{data.summary.openNearby}</b></article><article className={data.summary.critical ? "attention" : ""}><span>Critical</span><b>{data.summary.critical}</b></article><article><span>Foster offers</span><b>{data.summary.fosterOffers}</b></article></div>
      <div className="rescue-layout"><section className="rescue-case-list"><h3>Cases you can help with</h3>{data.cases.map((caseRecord) => {
                var _a, _b, _c, _d;
                const caseId = String(caseRecord.id);
                const relationship = String(caseRecord.relationship);
                const caseMatches = data.matches.filter((match) => match.rescueCaseId === caseId);
                const matchCandidates = (_a = candidates[caseId]) !== null && _a !== void 0 ? _a : [];
                return <article key={caseId} className={`rescue-case urgency-${String(caseRecord.urgency).toLowerCase()}`}>
          <div className="rescue-case-top"><div><span>{String(caseRecord.publicReference)} · {String(caseRecord.urgency)}</span><h3>{String(caseRecord.animalCount)} {String(caseRecord.species)} · {String(caseRecord.localityApprox)}, {String(caseRecord.city)}</h3></div><em>{String(caseRecord.status).replaceAll("_", " ")}</em></div>
          <p>{String(caseRecord.condition)}</p>
          {((_b = caseRecord.mediaIds) !== null && _b !== void 0 ? _b : []).length > 0 && <div className="rescue-photos">{((_c = caseRecord.mediaIds) !== null && _c !== void 0 ? _c : []).map((mediaId, index) => <img key={mediaId} src={mediaSrc(mediaId)} alt={`${String(caseRecord.species)} rescue case photo ${index + 1}`}/>)}</div>}
          <div className="rescue-needs">{((_d = caseRecord.helpNeeds) !== null && _d !== void 0 ? _d : []).map((need) => <span key={need}>{need.replaceAll("_", " ")}</span>)}</div>
          <small>{relationship === "NEARBY" ? "Privacy-safe public summary" : `Your role: ${relationship.toLowerCase()}`}</small>
          {relationship !== "NEARBY" && <div className="rescue-case-actions">
            <button disabled={busy} onClick={() => calculate(caseId)}>Find suitable fosters</button>
            {caseRecord.status === "REPORTED" && organizations.length > 0 && <><select aria-label="Organization for triage" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>{organizations.map((organization) => <option value={String(organization.id)} key={String(organization.id)}>{String(organization.name)}</option>)}</select><button disabled={busy || !organizationId} onClick={() => act({ action: "transition-rescue-case", rescueCaseId: caseId, next: "TRIAGED", organizationId }, "Case triaged and assigned for accountable review.")}>Triage</button></>}
         {relationship === "ORGANIZATION" &&
  ["TRIAGED", "HELP_OFFERED"].includes(String(caseRecord.status)) && (
    <button
      className="primary"
      disabled={busy || !caseRecord.assignedOrganizationId}
      onClick={() =>
        act(
          {
            action: "accept-rescue-into-care",
            rescueCaseId: caseId,
            organizationId: caseRecord.assignedOrganizationId,
          },
          "Animal accepted into organization care."
        )
      }
    >
      Accept into care
    </button>
  )}
            {relationship === "REPORTER" && ["REPORTED", "TRIAGED", "HELP_OFFERED"].includes(String(caseRecord.status)) && <button disabled={busy} onClick={() => act({ action: "transition-rescue-case", rescueCaseId: caseId, next: "WITHDRAWN", notes: "Withdrawn by reporter." }, "Case withdrawn and retained in the audit history.")}>Withdraw report</button>}
          </div>}
          {matchCandidates.length > 0 && <div className="foster-candidates"><h4>Best potential fosters</h4>{matchCandidates.slice(0, 6).map((candidate) => { var _a; return <div key={String(candidate.fosterProfileId)}><div><b>{String(candidate.anonymousId)} · {String(candidate.score)}% match</b><small>{String(candidate.city)} · {String(candidate.experienceLevel)} · {String(candidate.confidence)} confidence{candidate.demo ? " · Demo profile" : ""}</small><p>{((_a = candidate.reasons) !== null && _a !== void 0 ? _a : []).slice(0, 2).join(" ")}</p></div><button disabled={busy} onClick={() => act({ action: "invite-foster", rescueCaseId: caseId, fosterProfileId: candidate.fosterProfileId }, "A private foster invitation was sent.")}>Invite</button></div>; })}</div>}
          {caseMatches.some((match) => match.status === "OFFERED") && <div className="foster-offers"><h4>Offers awaiting a decision</h4>{caseMatches.filter((match) => match.status === "OFFERED").map((match) => { var _a, _b; return <div key={String(match.id)}><span>{String((_b = (_a = match.foster) === null || _a === void 0 ? void 0 : _a.anonymousId) !== null && _b !== void 0 ? _b : "Foster")} · {String(match.score)}% compatibility</span><button className="primary" disabled={busy} onClick={() => act({ action: "accept-foster-match", matchId: match.id }, "Foster offer accepted. Coordinate the safe handover through the case timeline.")}>Accept offer</button></div>; })}</div>}
        </article>;
            })}{!data.cases.length && <div className="record-empty">No rescue cases are available. Use “Report an animal” to create a responsible, traceable case.</div>}</section>
      <aside className="rescue-resources"><h3>Relevant local resources</h3><p>Confirm availability directly before travelling. Listing does not mean a responder has accepted a case.</p>{directory.slice(0, 5).map((entry) => <article key={String(entry.id)}><b>{String(entry.name)}</b><small>{String(entry.category)} · {String(entry.city)}</small></article>)}<a className="primary" href="/indore">Open sourced directory</a></aside></div>
    </>}
  </div>;
}
function FosterNetwork() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const [data, setData] = useState({ cases: [], fosterProfile: null, matches: [], summary: { myReports: 0, openNearby: 0, critical: 0, fosterOffers: 0 } });
    const [view, setView] = useState("OPPORTUNITIES");
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const load = async () => {
        setBusy(true);
        try {
            const response = await fetch("/api/platform?resource=rescue-network");
            const result = await response.json();
            if (!response.ok)
                throw new Error(result.error);
            setData(result);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to load foster opportunities.");
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => { const timer = window.setTimeout(() => { void load(); }, 0); return () => window.clearTimeout(timer); }, []);
    const save = async (event) => {
        var _a, _b;
        event.preventDefault();
        const form = event.currentTarget;
        const values = new FormData(form);
        setBusy(true);
        setNotice("");
        try {
            await platform({ action: "save-foster-profile", profile: {
                    state: values.get("state"), city: values.get("city"), localityApprox: values.get("localityApprox"),
                    radiusKm: values.get("radiusKm"), capacityTotal: values.get("capacityTotal"), capacityAvailable: values.get("capacityAvailable"),
                    species: values.getAll("species"), ageBands: values.getAll("ageBands"), careCapabilities: values.getAll("careCapabilities"),
                    experienceLevel: values.get("experienceLevel"), maxDurationDays: values.get("maxDurationDays"),
                    availabilityUntil: values.get("availabilityUntil"), discoverability: values.get("discoverability"),
                    residentPets: [{ summary: String((_a = values.get("residentPets")) !== null && _a !== void 0 ? _a : "") }], household: { summary: String((_b = values.get("household")) !== null && _b !== void 0 ? _b : "") },
                } });
            setNotice("Your private foster profile is saved. Only privacy-safe summaries appear in matching.");
            setView("OPPORTUNITIES");
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to save the foster profile.");
        }
        finally {
            setBusy(false);
        }
    };
    const act = async (body, success) => {
        setBusy(true);
        setNotice("");
        try {
            await platform(body);
            setNotice(success);
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to update this foster workflow.");
        }
        finally {
            setBusy(false);
        }
    };
    const profile = data.fosterProfile;
    const ownMatches = data.matches.filter((match) => match.isOwnFosterProfile);
    return <div className="foster-network"><div className="dashboard-section-head"><div><span className="kicker">WHO CAN HELP?</span><h2>Foster network</h2><p>Share your real availability and capabilities. Adoptvilla recommends only animals whose care needs fit your profile.</p></div><button className="primary" onClick={() => setView(view === "PROFILE" ? "OPPORTUNITIES" : "PROFILE")}>{view === "PROFILE" ? "View opportunities" : profile ? "Update my profile" : "Create foster profile"}</button></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    {view === "PROFILE" ? <form className="foster-profile-form" onSubmit={save}>
      <div className="form-grid">
        <label>Availability<select name="state" defaultValue={String((_a = profile === null || profile === void 0 ? void 0 : profile.state) !== null && _a !== void 0 ? _a : "AVAILABLE")}><option>AVAILABLE</option><option>LIMITED</option><option>FULL</option><option>UNAVAILABLE</option><option>DRAFT</option></select></label>
        <label>City<input name="city" required defaultValue={String((_b = profile === null || profile === void 0 ? void 0 : profile.city) !== null && _b !== void 0 ? _b : "Indore")}/></label>
        <label>Approximate locality<input name="localityApprox" defaultValue={String((_c = profile === null || profile === void 0 ? void 0 : profile.localityApprox) !== null && _c !== void 0 ? _c : "")}/></label>
        <label>Travel radius<input name="radiusKm" type="number" min="1" max="200" defaultValue={Number((_d = profile === null || profile === void 0 ? void 0 : profile.radiusKm) !== null && _d !== void 0 ? _d : 10)}/></label>
        <label>Total capacity<input name="capacityTotal" type="number" min="1" max="10" defaultValue={Number((_e = profile === null || profile === void 0 ? void 0 : profile.capacityTotal) !== null && _e !== void 0 ? _e : 1)}/></label>
        <label>Available spaces now<input name="capacityAvailable" type="number" min="0" max="10" defaultValue={Number((_f = profile === null || profile === void 0 ? void 0 : profile.capacityAvailable) !== null && _f !== void 0 ? _f : 1)}/></label>
        <fieldset><legend>Species accepted</legend>{["Dog", "Cat", "Bird", "Rabbit", "Any"].map((item) => { var _a; return <label key={item}><input type="checkbox" name="species" value={item} defaultChecked={((_a = profile === null || profile === void 0 ? void 0 : profile.species) === null || _a === void 0 ? void 0 : _a.includes(item)) || (!profile && item === "Dog")}/> {item}</label>; })}</fieldset>
        <fieldset><legend>Age groups accepted</legend>{[["NEONATAL", "Newborn"], ["PUPPY_KITTEN", "Puppy / kitten"], ["ADULT", "Adult"], ["SENIOR", "Senior"], ["ANY", "Any age"]].map(([value, label]) => { var _a; return <label key={value}><input type="checkbox" name="ageBands" value={value} defaultChecked={(_a = profile === null || profile === void 0 ? void 0 : profile.ageBands) === null || _a === void 0 ? void 0 : _a.includes(value)}/> {label}</label>; })}</fieldset>
        <fieldset className="wide"><legend>Care capabilities</legend>{[["ROUTINE_CARE", "Routine care"], ["MEDICATION", "Medication"], ["NEONATAL_CARE", "Neonatal care"], ["ISOLATION", "Isolation"], ["MOBILITY_SUPPORT", "Mobility support"]].map(([value, label]) => { var _a; return <label key={value}><input type="checkbox" name="careCapabilities" value={value} defaultChecked={(_a = profile === null || profile === void 0 ? void 0 : profile.careCapabilities) === null || _a === void 0 ? void 0 : _a.includes(value)}/> {label}</label>; })}</fieldset>
        <label>Experience<select name="experienceLevel" defaultValue={String((_g = profile === null || profile === void 0 ? void 0 : profile.experienceLevel) !== null && _g !== void 0 ? _g : "SOME")}><option value="FIRST_TIME">First foster</option><option value="SOME">Some practical experience</option><option value="EXPERIENCED">Experienced foster</option><option value="PROFESSIONAL">Professional care experience</option></select></label>
        <label>Maximum placement length<input name="maxDurationDays" type="number" min="1" max="365" defaultValue={Number((_h = profile === null || profile === void 0 ? void 0 : profile.maxDurationDays) !== null && _h !== void 0 ? _h : 30)}/></label>
        <label>Available until<input name="availabilityUntil" type="date"/></label>
        <label>Who may invite me?<select name="discoverability" defaultValue={String((_j = profile === null || profile === void 0 ? void 0 : profile.discoverability) !== null && _j !== void 0 ? _j : "MATCH_ONLY")}><option value="MATCH_ONLY">Compatible verified cases</option><option value="VERIFIED_ORGS_ONLY">Verified organizations only</option><option value="NONE">No invitations</option></select></label>
        <label className="wide">Resident animals<textarea name="residentPets" rows={3} placeholder="Species, temperament and important compatibility limits"/></label>
        <label className="wide">Household and safe-care setup<textarea name="household" rows={3} placeholder="Adults, children, secure indoor area, separation space and household agreement"/></label>
      </div><button className="primary" disabled={busy}>{busy ? "Saving…" : "Save private foster profile"}</button>
    </form> : <>
      <div className="foster-profile-summary"><div><span>YOUR AVAILABILITY</span><h3>{profile ? String(profile.state).replaceAll("_", " ") : "Profile not created"}</h3><p>{profile ? `${String(profile.city)} · ${String(profile.capacityAvailable)} space available · ${String(profile.completeness)}% complete` : "Create a private profile before offering foster help."}</p></div>{profile && <em>{String(profile.verificationStatus)}</em>}</div>
      {ownMatches.filter((match) => match.status === "INVITED").map((match) => {
                var _a, _b;
                const caseRecord = data.cases.find((item) => item.id === match.rescueCaseId);
                return <article className="foster-invite" key={String(match.id)}><div><span>PRIVATE FOSTER INVITATION</span><h3>{String((_a = caseRecord === null || caseRecord === void 0 ? void 0 : caseRecord.species) !== null && _a !== void 0 ? _a : "Animal")} in {String((_b = caseRecord === null || caseRecord === void 0 ? void 0 : caseRecord.city) !== null && _b !== void 0 ? _b : "")}</h3><p>{String(match.score)}% compatibility · {String(match.confidence)} confidence</p></div><div><button disabled={busy} onClick={() => act({ action: "respond-foster-invite", matchId: match.id, response: "DECLINED" }, "Invitation declined privately.")}>Not this time</button><button className="primary" disabled={busy} onClick={() => act({ action: "respond-foster-invite", matchId: match.id, response: "OFFERED" }, "Foster help offered. Your private contact details remain hidden.")}>I can help</button></div></article>;
            })}
      <div className="foster-opportunities"><h3>Animals that may need foster care</h3>{data.cases.filter((caseRecord) => { var _a; return ["REPORTED", "TRIAGED", "HELP_OFFERED"].includes(String(caseRecord.status)) && ((_a = caseRecord.helpNeeds) !== null && _a !== void 0 ? _a : []).includes("FOSTER"); }).map((caseRecord) => {
                var _a;
                const offered = ownMatches.find((match) => match.rescueCaseId === caseRecord.id && ["OFFERED", "ACCEPTED"].includes(String(match.status)));
                return <article key={String(caseRecord.id)}><div><span>{String(caseRecord.urgency)} · {String(caseRecord.publicReference)}</span><h3>{String(caseRecord.animalCount)} {String(caseRecord.species)} · {String(caseRecord.city)}</h3><p>{String(caseRecord.condition)}</p><small>{((_a = caseRecord.helpNeeds) !== null && _a !== void 0 ? _a : []).map((need) => need.replaceAll("_", " ")).join(" · ")}</small></div>{offered ? <em>{String(offered.status).replaceAll("_", " ")}</em> : <button className="primary" disabled={busy || !profile} onClick={() => act({ action: "offer-foster-help", rescueCaseId: caseRecord.id }, "Your foster offer was sent privately to the case coordinator.")}>{profile ? "Offer foster help" : "Create profile first"}</button>}</article>;
            })}{!data.cases.some((caseRecord) => { var _a; return ((_a = caseRecord.helpNeeds) !== null && _a !== void 0 ? _a : []).includes("FOSTER"); }) && <div className="record-empty">No compatible open foster requests are available right now.</div>}</div>
    </>}
  </div>;
}
const crmEventOptions = [
    ["MEDICAL", "Medical assessment or treatment"],
    ["VACCINATION", "Vaccination"],
    ["MEDICATION", "Medication"],
    ["WEIGHT", "Weight check"],
    ["CARE_TASK", "Daily care task"],
    ["MOVEMENT", "Move location"],
    ["FOSTER_PLACEMENT", "Foster placement"],
    ["FOSTER_CHECKIN", "Foster check-in"],
    ["BEHAVIOUR", "Behaviour assessment"],
    ["TRAINING", "Training session"],
];
function ShelterCrmPanel({ organizations }) {
    var _a, _b, _c, _d, _e, _f;
    const [organizationId, setOrganizationId] = useState(String((_b = (_a = organizations[0]) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : ""));
    const [animals, setAnimals] = useState([]);
    const [selectedAnimalId, setSelectedAnimalId] = useState("");
    const [summary, setSummary] = useState({ animals: 0, openTasks: 0, overdue: 0, fosterPlacements: 0, locations: [] });
    const [mode, setMode] = useState("REGISTER");
    const [eventType, setEventType] = useState("MEDICAL");
    const [busy, setBusy] = useState(false);
    const [notice, setNotice] = useState("");
    const selectedAnimal = (_c = animals.find((animal) => animal.id === selectedAnimalId)) !== null && _c !== void 0 ? _c : null;
    const load = async (target = organizationId, preferredAnimalId) => {
        var _a, _b, _c, _d, _e, _f, _g, _h;
        if (!target)
            return;
        setBusy(true);
        setNotice("");
        try {
            const response = await fetch(`/api/platform?resource=crm&organizationId=${encodeURIComponent(target)}`);
            const data = await response.json();
            if (!response.ok)
                throw new Error((_a = data.error) !== null && _a !== void 0 ? _a : "Unable to load the organization workspace.");
            setAnimals((_b = data.animals) !== null && _b !== void 0 ? _b : []);
            setSummary((_c = data.summary) !== null && _c !== void 0 ? _c : { animals: 0, openTasks: 0, overdue: 0, fosterPlacements: 0, locations: [] });
            const nextSelected = preferredAnimalId && ((_d = data.animals) === null || _d === void 0 ? void 0 : _d.some((animal) => animal.id === preferredAnimalId))
                ? preferredAnimalId
                : ((_e = data.animals) === null || _e === void 0 ? void 0 : _e.some((animal) => animal.id === selectedAnimalId))
                    ? selectedAnimalId
                    : String((_h = (_g = (_f = data.animals) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.id) !== null && _h !== void 0 ? _h : "");
            setSelectedAnimalId(nextSelected);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to load the organization workspace.");
        }
        finally {
            setBusy(false);
        }
    };
    useEffect(() => {
        const timer = window.setTimeout(() => { if (organizationId)
            void load(organizationId); }, 0);
        // The selected organization is the only trigger; load keeps the active animal when possible.
        return () => window.clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [organizationId]);
    const submitIntake = async (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const values = Object.fromEntries(new FormData(form));
        setBusy(true);
        setNotice("");
        try {
            const result = await platform({ action: "crm-intake", organizationId, intake: values });
            form.reset();
            setMode("REGISTER");
            setNotice("Animal intake saved. A permanent welfare timeline has been opened.");
            await load(organizationId, result.crmAnimalId);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to save the intake.");
        }
        finally {
            setBusy(false);
        }
    };
    const submitEvent = async (event) => {
        var _a, _b, _c, _d, _e, _f;
        event.preventDefault();
        if (!selectedAnimalId)
            return;
        const form = event.currentTarget;
        const values = new FormData(form);
        const data = {
            title: String((_a = values.get("title")) !== null && _a !== void 0 ? _a : ""),
            notes: String((_b = values.get("notes")) !== null && _b !== void 0 ? _b : ""),
            provider: String((_c = values.get("provider")) !== null && _c !== void 0 ? _c : ""),
            value: String((_d = values.get("value")) !== null && _d !== void 0 ? _d : ""),
            locationCode: String((_e = values.get("locationCode")) !== null && _e !== void 0 ? _e : ""),
            capacityType: String((_f = values.get("capacityType")) !== null && _f !== void 0 ? _f : ""),
        };
        setBusy(true);
        setNotice("");
        try {
            await platform({
                action: "crm-add-event", organizationId, crmAnimalId: selectedAnimalId, type: eventType,
                dueAt: values.get("dueAt") || null, completed: values.get("completed") === "on", data,
            });
            form.reset();
            setNotice("The animal’s permanent timeline has been updated.");
            await load(organizationId, selectedAnimalId);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to save the event.");
        }
        finally {
            setBusy(false);
        }
    };
    const completeEvent = async (eventId) => {
        setBusy(true);
        setNotice("");
        try {
            await platform({ action: "crm-complete-event", organizationId, eventId });
            setNotice("Task marked complete and retained in the audit history.");
            await load(organizationId, selectedAnimalId);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to complete the task.");
        }
        finally {
            setBusy(false);
        }
    };
    const publishFoundFromCrm = async (event) => {
        event.preventDefault();
        if (!selectedAnimalId)
            return;
        const form = new FormData(event.currentTarget);
        setBusy(true);
        setNotice("");
        try {
            const result = await platform({
                action: "create-found-report-from-crm", organizationId, crmAnimalId: selectedAnimalId,
                localityApprox: form.get("localityApprox"), publicDescription: form.get("publicDescription"),
            });
            await platform({ action: "calculate-lost-found-matches", reportId: result.reportId });
            setNotice(`${result.publicReference} is checking open lost reports. Exact shelter location and identifying marks remain private.`);
            await load(organizationId, selectedAnimalId);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Unable to check lost reports for this animal.");
        }
        finally {
            setBusy(false);
        }
    };
    if (!organizations.length)
        return <div><div className="dashboard-section-head"><div><h2>Shelter and NGO operations</h2><p>Animal records are available only to invited organization staff and Super Admin.</p></div></div><div className="record-empty">No organization workspace is connected to this account. Ask an organization administrator to invite you, or create and assign the organization from Super Admin.</div></div>;
    return <div className="crm">
    <div className="dashboard-section-head"><div><span className="kicker">WELFARE OPERATIONS</span><h2>Shelter and NGO CRM</h2><p>One permanent record from intake through medical care, shelter or foster movement, adoption and follow-up.</p></div><div className="crm-head-actions"><select aria-label="Organization" value={organizationId} onChange={(event) => setOrganizationId(event.target.value)}>{organizations.map((organization) => <option key={String(organization.id)} value={String(organization.id)}>{String(organization.name)}</option>)}</select><button className="primary" onClick={() => setMode(mode === "INTAKE" ? "REGISTER" : "INTAKE")}>{mode === "INTAKE" ? "Back to register" : "+ New intake"}</button></div></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    <div className="crm-stats">
      <article><span>Animals in care</span><b>{summary.animals}</b><small>Current organization register</small></article>
      <article><span>Open care tasks</span><b>{summary.openTasks}</b><small>Assigned or scheduled events</small></article>
      <article className={summary.overdue ? "attention" : ""}><span>Overdue</span><b>{summary.overdue}</b><small>Needs operational attention</small></article>
      <article><span>Foster placements</span><b>{summary.fosterPlacements}</b><small>Open foster records</small></article>
    </div>
    {mode === "INTAKE" ? <form className="crm-intake" onSubmit={submitIntake}>
      <div><span className="kicker">NEW ANIMAL</span><h3>Record intake once</h3><p>This opens the permanent animal welfare timeline. An adoption listing can be linked later without copying the record.</p></div>
      <div className="form-grid">
        <label>Intake date<input name="intakeDate" type="date" required defaultValue={new Date().toISOString().slice(0, 10)}/></label>
        <label>Source<select name="source" required defaultValue=""><option value="" disabled>Choose source</option><option>Street rescue</option><option>Owner surrender</option><option>Shelter transfer</option><option>Found animal</option><option>Community animal</option><option>Born in care</option><option>Other authorized intake</option></select></label>
        <label>Animal name or intake name<input name="name" placeholder="Optional"/></label>
        <label>Species<input name="species" required placeholder="Dog, cat, bird, rabbit…"/></label>
        <label>Breed or type<input name="breedType" placeholder="Indie, mixed, unknown…"/></label>
        <label>Colours<input name="colours" placeholder="black, tan, white"/></label>
        <label>Sex<select name="sex"><option value="UNKNOWN">Unknown</option><option value="FEMALE">Female</option><option value="MALE">Male</option><option value="INTERSEX">Intersex</option></select></label>
        <label>Size<select name="size"><option value="UNKNOWN">Unknown</option><option value="TINY">Tiny</option><option value="SMALL">Small</option><option value="MEDIUM">Medium</option><option value="LARGE">Large</option><option value="GIANT">Giant</option></select></label>
        <label className="wide">Private identifying marks<textarea name="identifyingMarksPrivate" rows={2} placeholder="Withhold a unique detail for ownership verification"/></label>
        <label className="wide">Condition at intake<textarea name="condition" required minLength={4} rows={3} placeholder="Observed health, injuries, body condition and immediate needs"/></label>
        <label>Current location code<input name="locationCode" placeholder="e.g. Shelter A · Kennel K-12"/></label>
        <label>Capacity type<select name="capacityType"><option>KENNEL</option><option>ROOM</option><option>QUARANTINE</option><option>ISOLATION</option><option>FOSTER</option><option>CLINIC</option><option>OTHER</option></select></label>
        <label className="wide">Custody and legal notes<textarea name="custodyNotes" rows={3} placeholder="Known custodian, surrender consent, rescue report or restrictions"/></label>
      </div><button className="primary" disabled={busy}>{busy ? "Saving intake…" : "Create permanent animal record"}</button>
    </form> : <div className="crm-workspace">
      <aside>
        <div className="crm-location"><h3>Capacity by location</h3>{summary.locations.map((location) => <div key={location.location}><span>{location.location}</span><b>{location.occupied}</b></div>)}{!summary.locations.length && <p>No locations are occupied yet.</p>}</div>
        <div className="crm-animal-list"><h3>Animal register</h3>{animals.map((animal) => <button className={selectedAnimalId === animal.id ? "active" : ""} key={String(animal.id)} onClick={() => setSelectedAnimalId(String(animal.id))}><b>{String(animal.name || animal.petId || `Animal ${String(animal.id).slice(-6).toUpperCase()}`)}</b><small>{String(animal.species || "Species not recorded")} · {String(animal.locationCode || "Location unassigned")} · {String(animal.condition || "Condition not recorded")}</small></button>)}{!animals.length && <p>No intakes yet. Use “New intake” to open the first permanent animal record.</p>}</div>
      </aside>
      <section>{selectedAnimal ? <>
        <div className="crm-animal-head"><div><span>PERMANENT ANIMAL ID</span><h3>{String(selectedAnimal.id)}</h3><p>Intake {selectedAnimal.intakeDate ? new Date(String(selectedAnimal.intakeDate)).toLocaleDateString("en-IN") : "—"} · {String(selectedAnimal.source)}</p></div><em>{String(selectedAnimal.locationCode || "Unassigned")}</em></div>
        {selectedAnimal.lostFoundReport ? <div className="crm-lost-found-linked"><b>Lost & Found check active</b><p>{String(selectedAnimal.lostFoundReport.publicReference)} · {String(selectedAnimal.lostFoundReport.status).replaceAll("_", " ")}</p></div> : <form className="crm-lost-found-form" onSubmit={publishFoundFromCrm}><div><b>Could this animal be missing from home?</b><p>Publish a privacy-safe found report and check open lost reports. The kennel location and private identifying marks remain hidden.</p></div><label>Public approximate locality<input name="localityApprox" required placeholder="Area only, not the shelter address"/></label><label>Public description<textarea name="publicDescription" required minLength={10} rows={2} defaultValue={String((_d = selectedAnimal.condition) !== null && _d !== void 0 ? _d : "")}/></label><button className="primary" disabled={busy}>Check lost reports</button></form>}
        <form className="crm-event-form" onSubmit={submitEvent}>
          <label>Record an event<select value={eventType} onChange={(event) => setEventType(event.target.value)}>{crmEventOptions.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label>Title or instruction<input name="title" required placeholder="What happened or needs to be done?"/></label>
          <label>Vet, staff, foster or provider<input name="provider" placeholder="Optional responsible person or clinic"/></label>
          <label>Value or dosage<input name="value" placeholder="e.g. 12.4 kg, vaccine batch, 5 ml"/></label>
          <label>Due date and time<input name="dueAt" type="datetime-local"/></label>
          {eventType === "MOVEMENT" && <><label>New location code<input name="locationCode" required placeholder="e.g. Foster F-18"/></label><label>Capacity type<select name="capacityType"><option>KENNEL</option><option>ROOM</option><option>QUARANTINE</option><option>ISOLATION</option><option>FOSTER</option><option>CLINIC</option><option>OTHER</option></select></label></>}
          <label className="wide">Notes<textarea name="notes" rows={3} placeholder="Clinical observations, care instructions, behaviour notes or placement details"/></label>
          <label className="crm-check"><input name="completed" type="checkbox"/> This event is already complete</label>
          <button className="primary" disabled={busy}>{busy ? "Saving…" : "Add to permanent timeline"}</button>
        </form>
        <div className="crm-timeline"><h3>Animal timeline</h3>{(_e = selectedAnimal.events) === null || _e === void 0 ? void 0 : _e.map((item) => {
                    var _a;
                    const data = ((_a = item.data) !== null && _a !== void 0 ? _a : {});
                    return <article key={String(item.id)} className={item.completedAt ? "complete" : ""}><div><span>{String(item.type).replaceAll("_", " ")}</span><b>{String(data.title || item.type)}</b><p>{[data.notes, data.provider, data.value].filter(Boolean).map(String).join(" · ") || "Event recorded"}</p><small>{item.dueAt ? `Due ${new Date(String(item.dueAt)).toLocaleString("en-IN")}` : `Recorded ${new Date(String(item.createdAt)).toLocaleString("en-IN")}`}</small></div>{item.completedAt ? <em>Completed</em> : item.type !== "INTAKE" ? <button disabled={busy} onClick={() => completeEvent(String(item.id))}>Mark complete</button> : <em>Intake</em>}</article>;
                })}{!((_f = selectedAnimal.events) === null || _f === void 0 ? void 0 : _f.length) && <p>No events recorded.</p>}</div>
      </> : <div className="record-empty">Choose an animal record to manage medical care, daily tasks, movements and fosters.</div>}</section>
    </div>}
  </div>;
}
function RecordList({ title, records, empty }) {
    return <div><div className="dashboard-section-head"><div><h2>{title}</h2><p>Only records authorized for this signed-in account are shown.</p></div></div><div className="record-list">{records.map((record, index) => { var _a, _b, _c, _d, _e, _f, _g, _h; return <article key={String((_a = record.id) !== null && _a !== void 0 ? _a : index)}><div><b>{String((_d = (_c = (_b = record.name) !== null && _b !== void 0 ? _b : record.status) !== null && _c !== void 0 ? _c : record.type) !== null && _d !== void 0 ? _d : "Record")}</b><small>{String((_g = (_f = (_e = record.city) !== null && _e !== void 0 ? _e : record.state) !== null && _f !== void 0 ? _f : record.verificationStatus) !== null && _g !== void 0 ? _g : "")}</small></div><code>{String((_h = record.id) !== null && _h !== void 0 ? _h : "")}</code></article>; })}{!records.length && <div className="record-empty">{empty}</div>}</div></div>;
}
function TrustSafetyCentre() {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
    const [data, setData] = useState(null);
    const [busy, setBusy] = useState("");
    const [notice, setNotice] = useState("");
    const [verificationTarget, setVerificationTarget] = useState("");
    const [reportSubject, setReportSubject] = useState({ type: "PET", id: "" });
    const load = async () => {
        var _a;
        const response = await fetch("/api/platform?resource=trust-safety");
        const result = await response.json();
        if (!response.ok)
            throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : "Trust and safety records could not be loaded.");
        setData(result);
        const targets = result.targets;
        const account = targets === null || targets === void 0 ? void 0 : targets.user;
        if (!verificationTarget && (account === null || account === void 0 ? void 0 : account.id))
            setVerificationTarget(`USER|${String(account.id)}`);
    };
    useEffect(() => {
        let active = true;
        const parameterTimer = window.setTimeout(() => {
            const parameters = new URLSearchParams(window.location.search);
            const reportType = parameters.get("reportType");
            const reportId = parameters.get("reportId");
            if (reportType && reportId)
                setReportSubject({ type: reportType, id: reportId });
        }, 0);
        fetch("/api/platform?resource=trust-safety")
            .then(async (response) => {
            var _a;
            const result = await response.json();
            if (!response.ok)
                throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : "Trust and safety records could not be loaded.");
            return result;
        })
            .then((result) => {
            if (!active)
                return;
            setData(result);
            const targets = result.targets;
            const account = targets === null || targets === void 0 ? void 0 : targets.user;
            if (account === null || account === void 0 ? void 0 : account.id)
                setVerificationTarget(`USER|${String(account.id)}`);
        })
            .catch((problem) => { if (active)
            setNotice(problem instanceof Error ? problem.message : "Trust and safety records could not be loaded."); });
        return () => { active = false; window.clearTimeout(parameterTimer); };
    }, []);
    const uploadEvidence = async (files, maximum) => {
        var _a;
        if (files.length > maximum)
            throw new Error(`Upload no more than ${maximum} files.`);
        const mediaIds = [];
        for (const file of files) {
           const payload = new FormData();

payload.set(
  "file",
  file
);

payload.set(
  "purpose",
  "PRIVATE_TRUST_EVIDENCE"
);
            const response = await fetch("/api/media", { method: "POST", body: payload });
            const result = await response.json();
            if (!response.ok)
                throw new Error((_a = result.error) !== null && _a !== void 0 ? _a : `${file.name} could not be uploaded.`);
            mediaIds.push(String(result.id));
        }
        return mediaIds;
    };
    const verificationTypes = {
        USER: [["IDENTITY", "Identity"], ["ADDRESS_AREA", "Area / locality"]],
        PROFESSIONAL: [["VETERINARIAN", "Veterinarian credentials"], ["TRAINER_BEHAVIOURIST", "Trainer / behaviourist credentials"]],
        ORGANIZATION: [["ORGANIZATION_DOCUMENTS", "Organization documents"]],
        PET: [["PET_MEDICAL", "Pet medical information"], ["PET_BEHAVIOUR", "Pet behaviour assessment"]],
    };
    const [targetType] = verificationTarget.split("|");
    const submitVerification = async (event) => {
        var _a, _b, _c;
        event.preventDefault();
        setBusy("verification");
        setNotice("");
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        try {
            const [chosenType, targetId] = String(form.get("target")).split("|");
            const files = form.getAll("evidence").filter((file) => file.size > 0);
            const evidenceMediaIds = await uploadEvidence(files, 10);
            await platform({
                action: "submit-verification-request",
                targetType: chosenType,
                targetId,
                verificationType: form.get("verificationType"),
                requestedScope: form.get("requestedScope"),
                evidenceMediaIds,
                declaration: {
                    accurate: form.get("accurate") === "on",
                    consentToReview: form.get("consentToReview") === "on",
                    authority: form.get("authority"),
                },
            });
            formElement.reset();
            setVerificationTarget(`USER|${String((_c = (_b = (_a = data === null || data === void 0 ? void 0 : data.targets) === null || _a === void 0 ? void 0 : _a.user) === null || _b === void 0 ? void 0 : _b.id) !== null && _c !== void 0 ? _c : "")}`);
            setNotice("Verification request submitted. The badge will describe only what a reviewer confirms.");
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Verification request could not be submitted.");
        }
        finally {
            setBusy("");
        }
    };
    const submitReport = async (event) => {
        event.preventDefault();
        setBusy("report");
        setNotice("");
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        try {
            const files = form.getAll("evidence").filter((file) => file.size > 0);
            const evidenceMediaIds = await uploadEvidence(files, 8);
            await platform({
                action: "submit-safety-report",
                subjectType: reportSubject.type,
                subjectId: reportSubject.id,
                category: form.get("category"),
                summary: form.get("summary"),
                evidenceMediaIds,
            });
            formElement.reset();
            setReportSubject({ type: "PET", id: "" });
            setNotice("Report submitted privately. It will be reviewed; no automatic punishment was applied.");
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Safety report could not be submitted.");
        }
        finally {
            setBusy("");
        }
    };
    const submitAppeal = async (event, caseId) => {
        event.preventDefault();
        setBusy(`appeal-${caseId}`);
        setNotice("");
        const formElement = event.currentTarget;
        const form = new FormData(formElement);
        try {
            const files = form.getAll("evidence").filter((file) => file.size > 0);
            const evidenceMediaIds = await uploadEvidence(files, 10);
            await platform({ action: "submit-moderation-appeal", caseId, statement: form.get("statement"), evidenceMediaIds });
            formElement.reset();
            setNotice("Appeal submitted for a fresh human review.");
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Appeal could not be submitted.");
        }
        finally {
            setBusy("");
        }
    };
    const phone = ((_a = data === null || data === void 0 ? void 0 : data.phoneVerification) !== null && _a !== void 0 ? _a : {});
    const targets = ((_b = data === null || data === void 0 ? void 0 : data.targets) !== null && _b !== void 0 ? _b : {});
    const account = ((_c = targets.user) !== null && _c !== void 0 ? _c : {});
    const petTargets = ((_d = targets.pets) !== null && _d !== void 0 ? _d : []);
    const organizationTargets = ((_e = targets.organizations) !== null && _e !== void 0 ? _e : []);
    const badges = ((_f = data === null || data === void 0 ? void 0 : data.badges) !== null && _f !== void 0 ? _f : []);
    const requests = ((_g = data === null || data === void 0 ? void 0 : data.verificationRequests) !== null && _g !== void 0 ? _g : []);
    const reports = ((_h = data === null || data === void 0 ? void 0 : data.safetyReports) !== null && _h !== void 0 ? _h : []);
    const moderationCaseRows = ((_j = data === null || data === void 0 ? void 0 : data.moderationCases) !== null && _j !== void 0 ? _j : []);
    const appeals = ((_k = data === null || data === void 0 ? void 0 : data.appeals) !== null && _k !== void 0 ? _k : []);
    const restrictions = ((_l = data === null || data === void 0 ? void 0 : data.restrictions) !== null && _l !== void 0 ? _l : []);
    const appealedCaseIds = new Set(appeals.map((appeal) => String(appeal.moderationCaseId)));
    return <div className="trust-centre">
    <div className="dashboard-section-head"><div><h2>Trust, verification and safety</h2><p>Request evidence-scoped badges, report a concern privately and appeal accountable moderation decisions.</p></div><button disabled={Boolean(busy)} onClick={() => { setBusy("load"); setNotice(""); load().catch((problem) => setNotice(problem instanceof Error ? problem.message : "Could not refresh.")).finally(() => setBusy("")); }}>{busy === "load" ? "Refreshing…" : "Refresh"}</button></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    {!data ? <div className="record-empty">Loading your private trust and safety workspace…</div> : <>
      <div className="trust-summary">
        <article><span>PHONE</span><b>{phone.verified ? "Verified" : "Not verified"}</b><p>{String((_m = phone.meaning) !== null && _m !== void 0 ? _m : "")}</p></article>
        <article><span>ACTIVE BADGES</span><b>{badges.length}</b><p>Every badge states the exact checked scope.</p></article>
        <article><span>OPEN REPORTS</span><b>{reports.filter((report) => report.status !== "CLOSED").length}</b><p>Your identity is not shown to the reported account.</p></article>
        <article><span>ACTIVE RESTRICTIONS</span><b>{restrictions.filter((restriction) => restriction.active).length}</b><p>Decisions and appeal routes remain visible.</p></article>
      </div>
      <section className="trust-card">
        <div className="trust-card-head"><div><span>MY VERIFICATION</span><h3>Request a precise verification badge</h3><p>Upload only the evidence needed for this check. Identity documents remain private and are never displayed in public profiles.</p></div></div>
        <div className="badge-grid">{badges.map((badge) => <article key={String(badge.id)}><span>✓ {String(badge.label)}</span><b>{String(badge.scope || "Verified scope recorded")}</b><p>{String(badge.meaning)}</p><small>Checked {new Date(String(badge.verifiedAt)).toLocaleDateString("en-IN")}{badge.expiresAt ? ` · expires ${new Date(String(badge.expiresAt)).toLocaleDateString("en-IN")}` : ""}</small></article>)}{!badges.length && <div className="record-empty">No active verification badges yet.</div>}</div>
        <form className="trust-form" onSubmit={submitVerification}>
          <label>Profile or animal<select name="target" value={verificationTarget} onChange={(event) => setVerificationTarget(event.target.value)} required>
            <option value={`USER|${String(account.id)}`}>My account</option>
            <option value={`PROFESSIONAL|${String(account.id)}`}>My professional credentials</option>
            {petTargets.map((pet) => <option key={String(pet.id)} value={`PET|${String(pet.id)}`}>{String(pet.name)} · pet record</option>)}
            {organizationTargets.map((organization) => <option key={String(organization.id)} value={`ORGANIZATION|${String(organization.id)}`}>{String(organization.name)} · organization</option>)}
          </select></label>
          <label>What should be checked?<select name="verificationType" key={targetType} required>{((_o = verificationTypes[targetType]) !== null && _o !== void 0 ? _o : verificationTypes.USER).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className="wide">Requested scope<input name="requestedScope" required placeholder="Example: current veterinary registration and stated qualification"/></label>
          <label className="wide">Your authority to submit this evidence<textarea name="authority" required minLength={10} rows={2} placeholder="Example: I am the document holder, pet custodian or authorized organization administrator."/></label>
          <label className="wide">Supporting evidence<input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple required/><small>JPG, PNG, WebP or PDF, up to 10 MB each. Evidence is visible only to you and authorized reviewers.</small></label>
          <label className="trust-check"><input name="accurate" type="checkbox" required/> The information and files are accurate.</label>
          <label className="trust-check"><input name="consentToReview" type="checkbox" required/> I authorize Adoptvilla reviewers to examine this evidence for the requested scope.</label>
          <button className="primary" disabled={Boolean(busy)}>{busy === "verification" ? "Submitting securely…" : "Submit verification request"}</button>
        </form>
        <div className="trust-history">{requests.map((request) => { var _a; return <article key={String(request.id)}><b>{String(request.verificationType).replaceAll("_", " ")}</b><span>{String(request.status)}</span><p>{String(request.requestedScope || "")}</p><small>{Number((_a = request.evidenceCount) !== null && _a !== void 0 ? _a : 0)} private evidence file(s) · {new Date(String(request.createdAt)).toLocaleDateString("en-IN")}</small></article>; })}{!requests.length && <p>No verification requests submitted.</p>}</div>
      </section>
      <section className="trust-card">
        <div className="trust-card-head"><div><span>PRIVATE SAFETY REPORT</span><h3>Report fraud, welfare risk or harassment</h3><p>Use the record ID shown on a pet, application, message, organization, rescue case or directory record. Immediate animal danger should also be reported to appropriate local authorities.</p></div></div>
        <form className="trust-form" onSubmit={submitReport}>
          <label>Record type<select name="subjectType" value={reportSubject.type} onChange={(event) => setReportSubject((current) => (Object.assign(Object.assign({}, current), { type: event.target.value })))}><option>USER</option><option>PET</option><option>ORGANIZATION</option><option>APPLICATION</option><option>MESSAGE</option><option>RESCUE_CASE</option><option>DIRECTORY_ENTRY</option></select></label>
          <label>Record ID<input name="subjectId" value={reportSubject.id} onChange={(event) => setReportSubject((current) => (Object.assign(Object.assign({}, current), { id: event.target.value })))} required placeholder="Paste the exact Adoptvilla record ID"/></label>
          <label>Concern<select name="category"><option>ANIMAL_WELFARE</option><option>COMMERCIAL_SALE</option><option>BREEDING</option><option>FRAUD</option><option>STOLEN_PHOTO</option><option>DUPLICATE_LISTING</option><option>HARASSMENT</option><option>SUSPICIOUS_FEE</option><option>FALSE_ORGANIZATION_CLAIM</option><option>OTHER</option></select></label>
          <label className="wide">What happened?<textarea name="summary" minLength={20} required rows={4} placeholder="State observable facts, dates and context. Avoid speculation or sensitive details that are not relevant."/></label>
          <label className="wide">Optional evidence<input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple/><small>Evidence stays private. Reports create a review case; they do not automatically suspend anyone.</small></label>
          <button className="primary" disabled={Boolean(busy)}>{busy === "report" ? "Submitting privately…" : "Submit private report"}</button>
        </form>
        <div className="trust-history">{reports.map((report) => <article key={String(report.id)}><b>{String(report.category).replaceAll("_", " ")}</b><span>{String(report.status)}</span><p>{String(report.summary)}</p><small>{String(report.subjectType)} · {String(report.subjectId)}</small></article>)}{!reports.length && <p>No safety reports submitted.</p>}</div>
      </section>
      {(moderationCaseRows.length > 0 || restrictions.length > 0) && <section className="trust-card">
        <div className="trust-card-head"><div><span>DECISIONS & APPEALS</span><h3>Understand a decision and request another review</h3><p>The reporter’s identity and private evidence are not shown here. You receive the decision, its reason, duration and a fair appeal route.</p></div></div>
        <div className="decision-list">{moderationCaseRows.map((caseRecord) => {
                    var _a;
                    return <article key={String(caseRecord.id)}>
          <div><span>{String(caseRecord.status)} · {String(caseRecord.priority)}</span><h4>Case {String(caseRecord.id)}</h4><p>{String(caseRecord.resolution || "Review is still in progress.")}</p></div>
          {((_a = caseRecord.actions) !== null && _a !== void 0 ? _a : []).map((caseAction) => <small key={String(caseAction.id)}>{String(caseAction.action)} · {String(caseAction.reason)}{caseAction.endsAt ? ` · until ${new Date(String(caseAction.endsAt)).toLocaleDateString("en-IN")}` : ""}</small>)}
          {["ACTIONED", "CLOSED", "APPEALED"].includes(String(caseRecord.status)) && !appealedCaseIds.has(String(caseRecord.id)) && <form onSubmit={(event) => submitAppeal(event, String(caseRecord.id))}>
            <label>Why should the decision be reviewed again?<textarea name="statement" minLength={50} required rows={4} placeholder="Explain what may be incorrect, add relevant context and identify any evidence that should change the decision."/></label>
            <label>Optional appeal evidence<input name="evidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple/></label>
            <button className="primary" disabled={Boolean(busy)}>{busy === `appeal-${String(caseRecord.id)}` ? "Submitting…" : "Submit appeal"}</button>
          </form>}
        </article>;
                })}</div>
      </section>}
    </>}
  </div>;
}
function ProviderPanel() {
    var _a, _b, _c;
    const [settings, setSettings] = useState(null);
    const [challengeId, setChallengeId] = useState("");
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState("");
    const load = async () => {
        setBusy("load");
        setNotice("");
        try {
            const response = await fetch("/api/platform?resource=communication-settings");
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error);
            setSettings(data);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Settings could not be loaded.");
        }
        finally {
            setBusy("");
        }
    };
    useEffect(() => {
        let active = true;
        fetch("/api/platform?resource=communication-settings")
            .then(async (response) => {
            const data = await response.json();
            if (!response.ok)
                throw new Error(data.error);
            return data;
        })
            .then((data) => { if (active)
            setSettings(data); })
            .catch((problem) => { if (active)
            setNotice(problem instanceof Error ? problem.message : "Settings could not be loaded."); });
        return () => { active = false; };
    }, []);
    const requestOtp = async (event) => {
        var _a;
        event.preventDefault();
        setBusy("otp-send");
        setNotice("");
        const form = new FormData(event.currentTarget);
        try {
            const data = await platform({ action: "request-phone-otp", phone: form.get("phone"), idempotencyKey: crypto.randomUUID() });
            if (data.alreadyVerified) {
                setNotice(`Phone already verified: ${data.phone}`);
                await load();
                return;
            }
            setChallengeId(String((_a = data.challengeId) !== null && _a !== void 0 ? _a : ""));
            setNotice(`Verification code sent to ${data.phone}. It expires in 10 minutes.`);
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "The verification code could not be sent.");
        }
        finally {
            setBusy("");
        }
    };
    const verifyOtp = async (event) => {
        event.preventDefault();
        setBusy("otp-verify");
        setNotice("");
        const form = new FormData(event.currentTarget);
        try {
            const data = await platform({ action: "verify-phone-otp", challengeId, otp: form.get("otp") });
            setNotice(`Phone verified: ${data.phone}.`);
            setChallengeId("");
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "The code could not be verified.");
        }
        finally {
            setBusy("");
        }
    };
    const savePreferences = async (event) => {
        event.preventDefault();
        setBusy("preferences");
        setNotice("");
        const form = new FormData(event.currentTarget);
        try {
            await platform({ action: "save-notification-preferences", preferences: {
                    emailEnabled: form.get("emailEnabled") === "on",
                    whatsappEnabled: form.get("whatsappEnabled") === "on",
                    smsEnabled: form.get("smsEnabled") === "on",
                    digestFrequency: "IMMEDIATE",
                } });
            setNotice("Notification choices saved.");
            await load();
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "Preferences could not be saved.");
        }
        finally {
            setBusy("");
        }
    };
    const test = async (channel) => {
        setBusy(`test-${channel}`);
        setNotice("");
        try {
            const result = await platform({ action: "send-test-notification", channel });
            if (result?.providerReady === false || result?.accepted === false) {
                setNotice(result?.reason || `${channel} provider is not configured yet. No external message was sent.`);
            } else {
                setNotice(`${channel.toLowerCase()} test accepted by the provider.`);
            }
        }
        catch (problem) {
            setNotice(problem instanceof Error ? problem.message : "The test could not be sent.");
        }
        finally {
            setBusy("");
        }
    };
    const providerInfo = [
        ["razorpay", "Razorpay", "UPI, cards, net banking, signed webhooks and reviewed refunds"],
        ["phoneOtp", "Phone OTP", "Indian mobile verification without storing the code"],
        ["whatsapp", "WhatsApp", "Approved transactional templates only"],
        ["email", "Email", "Account and workflow notifications"],
        ["sms", "SMS", "DLT-approved critical reminders"],
    ];
    const providers = ((_a = settings === null || settings === void 0 ? void 0 : settings.providers) !== null && _a !== void 0 ? _a : {});
    const contact = ((_b = settings === null || settings === void 0 ? void 0 : settings.contact) !== null && _b !== void 0 ? _b : {});
    const preferences = ((_c = settings === null || settings === void 0 ? void 0 : settings.preferences) !== null && _c !== void 0 ? _c : {});
    return <div className="communication-settings">
    <div className="dashboard-section-head"><div><h2>Security and notifications</h2><p>Verify your Indian mobile number, choose channels and see which provider connections are operational.</p></div><button disabled={Boolean(busy)} onClick={load}>{busy === "load" ? "Checking…" : "Refresh status"}</button></div>
    {notice && <div className="dashboard-notice" role="status">{notice}</div>}
    {!settings ? <div className="record-empty">{busy ? "Loading secure settings…" : "Settings are unavailable."}</div> : <>
      <section className="settings-card"><div><span>PHONE VERIFICATION</span><h3>{contact.phoneVerified ? "Mobile number verified" : "Verify your mobile number"}</h3><p>{contact.phoneVerified ? `${contact.phone} can receive opted-in WhatsApp and SMS updates.` : "We use a short-lived provider-managed OTP. Adoptvilla never stores the code."}</p></div>
        {!contact.phoneVerified && <>{!challengeId ? <form onSubmit={requestOtp}><label>Indian mobile number<input name="phone" inputMode="tel" autoComplete="tel" placeholder="98765 43210" required/></label><button className="primary" disabled={Boolean(busy)}>{busy === "otp-send" ? "Sending…" : "Send verification code"}</button></form> : <form onSubmit={verifyOtp}><label>Verification code<input name="otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{4,8}" required/></label><button className="primary" disabled={Boolean(busy)}>{busy === "otp-verify" ? "Checking…" : "Verify phone"}</button><button type="button" onClick={() => setChallengeId("")}>Use another number</button></form>}</>}
      </section>
      <form className="settings-card preference-form" onSubmit={savePreferences}><div><span>DELIVERY CHOICES</span><h3>How should we contact you?</h3><p>Essential in-app notices always remain available. WhatsApp and SMS require a verified phone.</p></div>
        <label><input name="emailEnabled" type="checkbox" defaultChecked={Boolean(preferences.emailEnabled)}/> Email</label>
        <label><input name="whatsappEnabled" type="checkbox" defaultChecked={Boolean(preferences.whatsappEnabled)} disabled={!contact.phoneVerified}/> WhatsApp</label>
        <label><input name="smsEnabled" type="checkbox" defaultChecked={Boolean(preferences.smsEnabled)} disabled={!contact.phoneVerified}/> SMS</label>
        <button className="primary" disabled={Boolean(busy)}>{busy === "preferences" ? "Saving…" : "Save notification choices"}</button>
      </form>
      <div className="provider-grid">{providerInfo.map(([key, name, description]) => <article key={key}><span className={providers[key] ? "ready" : ""}>{providers[key] ? "READY" : "NEEDS SETUP"}</span><h3>{name}</h3><p>{description}</p>{["email", "whatsapp", "sms"].includes(key) && <button disabled={Boolean(busy) || !providers[key]} onClick={() => test(key.toUpperCase())}>Send test</button>}</article>)}</div>
    </>}
  </div>;
}
function saveDraft(form, key, setStatus) {
    const values = {};
    const data = new FormData(form);
    for (const [name, value] of data.entries()) {
        if (value instanceof File)
            continue;
        const existing = values[name];
        values[name] = existing == null ? String(value) : Array.isArray(existing) ? [...existing, String(value)] : [existing, String(value)];
    }
    localStorage.setItem(key, JSON.stringify({ values, savedAt: new Date().toISOString() }));
    setStatus(`Draft saved at ${new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}.`);
}
function restoreDraft(form, key, setStatus) {
    var _a;
    if (!form)
        return;
    try {
        const stored = localStorage.getItem(key);
        if (!stored)
            return;
        const draft = JSON.parse(stored);
        Object.entries((_a = draft.values) !== null && _a !== void 0 ? _a : {}).forEach(([name, value]) => {
            const fields = form.elements.namedItem(name);
            if (!fields)
                return;
            const wanted = Array.isArray(value) ? value : [value];
            const elements = fields instanceof RadioNodeList ? Array.from(fields) : [fields];
            elements.forEach((field) => {
                var _a;
                if (field instanceof HTMLInputElement && (field.type === "checkbox" || field.type === "radio"))
                    field.checked = wanted.includes(field.value);
                else if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement)
                    field.value = (_a = wanted[0]) !== null && _a !== void 0 ? _a : "";
            });
        });
        setStatus(`Draft restored from ${draft.savedAt ? new Date(draft.savedAt).toLocaleString("en-IN") : "this device"}.`);
    }
    catch (_b) {
        localStorage.removeItem(key);
    }
}
