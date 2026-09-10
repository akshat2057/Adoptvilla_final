"use client";
import {
  useEffect,
  useState,
} from "react";
import Link from "../components/Link.jsx";
import { DatabaseBrowser } from "../components/DatabaseBrowser.jsx";
const sections = ["Overview", "Users", "Pets", "Adoptions", "Post-adoption", "Organizations", "Verification", "Lost & Found", "Rescue & Foster", "Shelter CRM", "Payments", "Communications", "Promotions", "Matching", "Moderation", "Directory", "System", "Audit", "Database"];
const sectionDescriptions = {
  "Overview": "Platform health, adoption activity and operational signals at a glance.",
  "Users": "Review people, roles and access without bypassing accountable moderation workflows.",
  "Pets": "Manage animal listing states, completeness and publication readiness.",
  "Adoptions": "Track adoption journeys, mutual interest and handover progress.",
  "Post-adoption": "Review welfare check-ins, support cases and safe-return coordination.",
  "Organizations": "Manage organizations, access assignments and verification states.",
  "Verification": "Review evidence-scoped verification requests and active badges.",
  "Lost & Found": "Monitor reports, reunion signals and privacy-safe case progression.",
  "Rescue & Foster": "Coordinate rescue cases, foster capacity and welfare routing.",
  "Shelter CRM": "Review organization animal records, capacity and operational follow-ups.",
  "Payments": "Manage transactions, documents, refunds and commerce settings.",
  "Communications": "Review delivery queues, templates and provider outcomes.",
  "Promotions": "Configure controlled launch campaigns and participation limits.",
  "Matching": "Tune explainable matching weights without overriding hard safety rules.",
  "Moderation": "Review fraud and welfare signals, evidence, actions and appeals.",
  "Directory": "Maintain sourced local-care records and public correction workflows.",
  "System": "Inspect platform configuration, operational health and integration states.",
  "Audit": "Review immutable operational activity and accountable admin actions.",
  "Database": "Inspect structured records through a controlled administrative browser."
};
async function adminAction(body) {
    var _a;
    const response = await fetch("/api/platform", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    const data = await response.json();
    if (!response.ok)
        throw new Error((_a = data.error) !== null && _a !== void 0 ? _a : "Admin action failed.");
    return data;
}
export default function AdminClient({ user, initial, signOutPath }) {
    const [section, setSection] = useState("Overview");
    const [data, setData] = useState(initial);
    const [notice, setNotice] = useState("");
    const [busy, setBusy] = useState(false);
    const [selected, setSelected] = useState(null);
    useEffect(() => {
  let active = true;

  const loadAdminData =
    async () => {

      try {
        const response =
          await fetch(
            "/api/platform?resource=admin-console"
          );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
            "Admin console could not be loaded."
          );
        }

        if (active) {
          setData((current) => ({
            ...current,
            ...result,

            stats: {
              ...(current.stats || {}),
              ...(result.stats || {}),
            },
          }));
        }

      } catch (error) {

        if (active) {
          setNotice(
            error instanceof Error
              ? error.message
              : "Admin console could not be loaded."
          );
        }
      }
    };

  loadAdminData();

  return () => {
    active = false;
  };
}, []);
    const run = async (work, success) => {
        setBusy(true);
        setNotice("");
        try {
            await work();
            setNotice(success);
        }
        catch (error) {
            setNotice(error instanceof Error ? error.message : "Something went wrong.");
        }
        finally {
            setBusy(false);
        }
    };
    const updateLocal = (collection, id, patch) => setData((current) => (Object.assign(Object.assign({}, current), { [collection]: current[collection].map((row) => row.id === id ? Object.assign(Object.assign({}, row), patch) : row) })));
    return <main className="admin-shell">
    <aside className="admin-sidebar">
      <Link className="brand admin-brand" href="/"><img className="dogsvilla-mark" src="/dogsvilla-logo.png" alt=""/><span className="brand-divider"/><span><b>ADOPTVILLA</b><small>SUPER ADMIN</small></span></Link>
      <nav>{sections.map((item) => <button key={item} className={section === item ? "active" : ""} onClick={() => setSection(item)}>{item}</button>)}</nav>
      <div className="admin-account"><b>{user.fullName}</b><small>{user.email}</small><a href="/dashboard">User dashboard</a><a href={signOutPath}>Sign out</a></div>
    </aside>
    <section className="admin-main">
      <header className="admin-top"><div className="admin-title-block"><span>OPERATIONS CONSOLE</span><h1>{section}</h1><p>{sectionDescriptions[section]}</p></div><div className="admin-live"><i /> Production controls</div></header>
      {notice && <div className="dashboard-notice" role="status">{notice}</div>}
      {selected && <AdminDetail section={section} row={selected} onClose={() => setSelected(null)}/>}
      {section === "Overview" && <Overview data={data} onNavigate={setSection}/>}
      {section === "Users" && <><div className="admin-summary"><article><span className="kicker">ACCOUNTABILITY</span><h2>Account restrictions begin with a case.</h2><p>Use Moderation to record evidence, a factual reason, proportional scope and an appeal route. User records cannot be suspended from this list.</p></article></div><AdminTable onReview={setSelected} title="People and permissions" rows={data.users} columns={["fullName", "email", "status", "roles"]}/></>}
      {section === "Pets" && <AdminTable onReview={setSelected} title="Listings and approvals" rows={data.pets} columns={["name", "species", "city", "state", "completeness"]} renderAction={(row) => <select disabled={busy} value={String(row.state)} onChange={(event) => run(async () => { await adminAction({ action: "admin-update-pet", petId: row.id, state: event.target.value }); updateLocal("pets", String(row.id), { state: event.target.value }); }, "Pet listing state updated and audited.")}>{["DRAFT", "PENDING_REVIEW", "PUBLISHED", "PAUSED", "REJECTED", "WITHDRAWN"].map((state) => <option key={state}>{state}</option>)}</select>}/>}
      {section === "Adoptions" && <AdminTable onReview={setSelected} title="Adoption journeys" rows={data.applications} columns={["status", "adopterInterested", "custodianInterested", "version", "updatedAt"]}/>}
      {section === "Post-adoption" && <PostAdoptionOperations data={data} busy={busy} onCheckin={(checkinId, resolved, notes) => run(async () => { await adminAction({ action: "review-post-adoption-checkin", checkinId, resolved, notes }); updateLocal("postAdoptionCheckins", checkinId, { status: resolved ? "RESOLVED" : "REVIEW_NEEDED", reviewerNotes: notes }); }, "Post-adoption check-in review recorded.")} onSupport={(supportCaseId, next, notes) => run(async () => { await adminAction({ action: "triage-post-adoption-support", supportCaseId, next, notes }); updateLocal("postAdoptionSupportCases", supportCaseId, { status: next, triageNotes: notes }); }, "Support case updated and shared with the adoption participants.")} onReturn={(returnCaseId, next, notes, scheduledHandoverAt) => run(async () => { await adminAction({ action: "transition-safe-return", returnCaseId, next, notes, scheduledHandoverAt }); updateLocal("adoptionReturnCases", returnCaseId, { status: next, resolutionNotes: notes, scheduledHandoverAt }); }, "Safe-return plan updated and audited.")}/>}
      {section === "Organizations" && <><CreateOrganization busy={busy} onCreate={(organization) => run(async () => { await adminAction({ action: "create-organization", organization }); }, "Organization created. Refresh to see the new record.")}/><AssignOrganizationRole organizations={data.organizations} busy={busy} onAssign={(assignment) => run(async () => { await adminAction(Object.assign({ action: "assign-organization-role" }, assignment)); }, "Organization access assigned and audited.")}/><AdminTable title="Organizations and verification" rows={data.organizations} columns={["name", "type", "city", "verificationStatus", "registrationNumber"]} renderAction={(row) => <select disabled={busy} value={String(row.verificationStatus)} onChange={(event) => run(async () => { await adminAction({ action: "admin-update-organization", organizationId: row.id, verificationStatus: event.target.value }); updateLocal("organizations", String(row.id), { verificationStatus: event.target.value }); }, "Organization listing status updated.")}><option>LISTED</option><option>CLAIMED</option>{["VERIFIED", "REVIEW_REQUIRED"].includes(String(row.verificationStatus)) && <option disabled>{String(row.verificationStatus)}</option>}<option>REJECTED</option></select>}/></>}
      {section === "Lost & Found" && <><AdminTable onReview={setSelected} title="Lost and found reports" rows={data.lostFoundReports} columns={["publicReference", "type", "species", "city", "localityApprox", "eventDate", "status", "riskScore", "possibleMatches", "mutualMatches", "crmAnimalId"]} renderAction={(row) => <select disabled={busy} value={String(row.status)} onChange={(event) => run(async () => { await adminAction({ action: "admin-update-lost-found", reportId: row.id, status: event.target.value }); updateLocal("lostFoundReports", String(row.id), { status: event.target.value }); }, "Lost-and-found status updated and audited.")}>{["REPORTED", "POSSIBLE_MATCH", "CONTACTED", "VERIFICATION", "REUNITED", "CLOSED", "OWNER_NOT_FOUND"].map((status) => <option key={status}>{status}</option>)}</select>}/><AdminTable onReview={setSelected} title="Possible reunion matches" rows={data.lostFoundMatches} columns={["score", "confidence", "status", "lostReporterInterested", "foundReporterInterested", "lostReportId", "foundReportId", "updatedAt"]}/></>}
      {section === "Rescue & Foster" && <><AdminTable onReview={setSelected} title="Rescue cases and welfare routing" rows={data.rescueCases} columns={["publicReference", "species", "animalCount", "urgency", "city", "status", "organization", "fosterOffers", "riskScore"]}/><AdminTable onReview={setSelected} title="Foster profiles and verification" rows={data.fosterProfiles} columns={["city", "state", "capacityAvailable", "experienceLevel", "completeness", "verificationStatus", "activeMatches"]} renderAction={(row) => <select disabled={busy || String(row.id).startsWith("demo_foster_")} value={String(row.verificationStatus)} onChange={(event) => run(async () => { await adminAction({ action: "admin-update-foster", fosterProfileId: row.id, verificationStatus: event.target.value }); updateLocal("fosterProfiles", String(row.id), { verificationStatus: event.target.value }); }, "Foster verification updated and audited.")}>{["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"].map((status) => <option key={status}>{status}</option>)}</select>}/></>}
      {section === "Shelter CRM" && <AdminTable onReview={setSelected} title="Organization animal records" rows={data.crmAnimals} columns={["organization", "intakeDate", "source", "condition", "locationCode", "capacityType", "openEvents", "overdueEvents"]}/>}
      {section === "Payments" && <><CommerceForm settings={data.commerceSettings} busy={busy} onSave={(settings) => run(async () => { await adminAction({ action: "admin-save-commerce-settings", settings }); }, "Pricing, tax and invoice settings saved.")}/><AdminTable onReview={setSelected} title="Transactions and refunds" rows={data.payments} columns={["purpose", "amountPaise", "status", "invoiceNumber", "providerOrderId", "providerPaymentId", "providerRefundId"]} renderAction={(row) => String(row.status) === "REFUND_REQUESTED"
                ? <button className="primary" disabled={busy || Boolean(row.providerRefundId)} onClick={() => run(async () => { await adminAction({ action: "admin-process-refund", orderId: row.id }); updateLocal("payments", String(row.id), { providerRefundId: "Submitted—awaiting webhook" }); }, "Refund submitted. The state will change only after Razorpay confirms it.")}>{row.providerRefundId ? "Awaiting gateway" : "Submit refund"}</button>
                : !["PAID", "REFUNDED", "FAILED", "DISPUTED"].includes(String(row.status))
                    ? <button disabled={busy} onClick={() => run(async () => { await adminAction({ action: "admin-update-payment", orderId: row.id, status: "FAILED" }); updateLocal("payments", String(row.id), { status: "FAILED" }); }, "Payment attempt closed as failed and audited.")}>Close failed attempt</button>
                    : null}/><AdminTable title="Invoices, receipts and refund notes" rows={data.paymentDocuments} columns={["documentNumber", "type", "orderId", "issuedAt"]}/></>}
      {section === "Communications" && <><CommunicationControls busy={busy} rows={data.notifications} onProcess={() => run(async () => { await adminAction({ action: "admin-process-notification-queue", limit: 50 }); }, "Delivery queue processed. Refresh the page to see final provider states.")}/><AdminTable onReview={setSelected} title="Delivery queue" rows={data.notifications} columns={["channel", "template", "status", "attemptCount", "maxAttempts", "nextAttemptAt", "lastError", "providerMessageId"]} renderAction={(row) => ["FAILED", "QUEUED"].includes(String(row.status)) ? <button disabled={busy} onClick={() => run(async () => { await adminAction({ action: "admin-retry-notification", notificationId: row.id }); }, "Delivery retried. Refresh to see the latest state.")}>Retry now</button> : null}/><AdminTable title="Phone-verification security log" rows={data.otpChallenges} columns={["provider", "status", "sendCount", "verifyAttempts", "expiresAt", "verifiedAt", "lastError"]}/></>}
      {section === "Promotions" && <><PromotionForm busy={busy} onSave={(promotion) => run(async () => { await adminAction({ action: "admin-save-promotion", promotion }); }, "Promotion saved. Refresh to update the table.")}/><AdminTable title="Promotion capacity" rows={data.promotions} columns={["code", "benefitType", "limit", "confirmedCount", "active", "startsAt", "endsAt"]}/></>}
      {section === "Matching" && <MatchingControl rows={data.matchingRules} busy={busy} onSave={(weights) => run(async () => { await adminAction({ action: "admin-save-matching-rules", weights }); }, "A new matching-rules version is active.")}/>}
      {section === "Verification" && <VerificationOperations rows={data.verificationRequests} badges={data.verificationBadges} busy={busy} onDecision={(requestId, decision, notes, approvedScope, validityMonths) => run(async () => {
                await adminAction({ action: "admin-review-verification", requestId, decision, notes, approvedScope, validityMonths });
                updateLocal("verificationRequests", requestId, { status: decision, reviewerNotes: notes });
            }, `Verification ${decision.toLowerCase()} with an exact, auditable scope.`)}/>}
      {section === "Moderation" && <TrustSafetyOperations cases={data.moderation} reports={data.safetyReports} appeals={data.moderationAppeals} restrictions={data.accountRestrictions} busy={busy} onAction={(payload) => run(async () => {
                const result = await adminAction(Object.assign({ action: "moderation-apply-action" }, payload));
                updateLocal("moderation", String(payload.caseId), { status: result.status, resolution: payload.reason });
            }, "Moderation action applied, recorded and communicated.")} onAppeal={(payload) => run(async () => {
                await adminAction(Object.assign({ action: "admin-decide-appeal" }, payload));
                updateLocal("moderationAppeals", String(payload.appealId), { status: payload.decision, resolution: payload.resolution });
            }, "Appeal decision recorded and communicated.")}/>}
      {section === "Directory" && <><DirectoryForm busy={busy} onSave={(entry) => run(async () => { await adminAction({ action: "add-directory-entry", entry }); }, "Sourced directory entry created. Refresh to see it.")}/><AdminTable title="City directory records" rows={data.directory} columns={["name", "category", "city", "verificationStatus", "sourceUrl", "lastVerifiedAt"]}/></>}
      {section === "System" && <SystemHealth />}
      {section === "Audit" && <AdminTable title="Immutable operational history" rows={data.audits} columns={["createdAt", "actorUserId", "action", "subjectType", "subjectId", "reason"]}/>}
      {section === "Database" && <DatabaseBrowser/>}
    </section>
  </main>;
}
function Overview({ data, onNavigate }) {
    const cards = [["Users", data.stats.users], ["Adopters", data.stats.adopters], ["Pets", data.stats.pets], ["Applications", data.stats.applications], ["Post-adoption", data.stats.postAdoptionReview + data.stats.activeReturns], ["Organizations", data.stats.organizations], ["Verification", data.stats.verificationPending], ["Moderation", data.stats.safetyOpen + data.stats.appealsPending], ["Lost & Found", data.stats.lostFoundReports], ["Rescue & Foster", data.stats.rescueCases + data.stats.fosters], ["Shelter CRM", data.stats.crmAnimals], ["Transactions", data.stats.payments]];
    return <><div className="admin-stats">{cards.map(([label, value]) => <button key={label} onClick={() => onNavigate(label === "Adopters" ? "Users" : label === "Transactions" ? "Payments" : String(label))}><span>{label}</span><b>{value}</b><small>Inspect →</small></button>)}<article><span>RECOGNIZED REVENUE</span><b>₹{(data.stats.paidRevenue / 100).toLocaleString("en-IN")}</b><small>Paid transactions only</small></article></div><div className="admin-summary"><article><span className="kicker">OPERATING PRINCIPLE</span><h2>Welfare decisions stay human.</h2><p>Matching can rank and explain. Publication, verification, moderation and adoption approval remain accountable human actions.</p></article><article><span className="kicker">DATA STATUS</span><h2>Demo records are visibly labelled.</h2><p>Test accounts use the invalid example domain and cannot be contacted. Real payment and promotion counters remain separate.</p></article></div></>;
}
function PostAdoptionOperations({ data, busy, onCheckin, onSupport, onReturn }) {
    const reviewCheckins = data.postAdoptionCheckins.filter((item) => item.status === "REVIEW_NEEDED");
    const openSupport = data.postAdoptionSupportCases.filter((item) => ["OPEN", "TRIAGED", "PLAN_AGREED", "RETURN_REQUESTED"].includes(String(item.status)));
    const openReturns = data.adoptionReturnCases.filter((item) => !["RETURNED", "WITHDRAWN", "CLOSED"].includes(String(item.status)));
    const supportTransitions = { OPEN: ["TRIAGED", "RESOLVED", "RETURN_REQUESTED", "CLOSED"], TRIAGED: ["PLAN_AGREED", "RESOLVED", "RETURN_REQUESTED", "CLOSED"], PLAN_AGREED: ["RESOLVED", "RETURN_REQUESTED", "CLOSED"], RESOLVED: ["CLOSED"], RETURN_REQUESTED: ["CLOSED"], CLOSED: [] };
    const analytics = [
        ["30-DAY STABILITY", data.outcomeAnalytics.day30],
        ["3-MONTH STABILITY", data.outcomeAnalytics.month3],
        ["6-MONTH STABILITY", data.outcomeAnalytics.month6],
        ["1-YEAR STABILITY", data.outcomeAnalytics.year1],
    ];
    return <>
    <div className="outcome-analytics">{analytics.map(([label, outcome]) => <article key={label}><span>{label}</span><b>{outcome.rate === null ? "—" : `${outcome.rate}%`}</b><small>{outcome.stable} stable of {outcome.assessed} assessed</small></article>)}<article><span>RETURN RATE</span><b>{data.outcomeAnalytics.returnRate === null ? "—" : `${data.outcomeAnalytics.returnRate}%`}</b><small>documented completed returns only</small></article></div>
    <div className="admin-summary"><article><span className="kicker">OUTCOME STANDARD</span><h2>Silence is not counted as success.</h2><p>An adoption is included in stability reporting only when the milestone check-in was submitted, has no unresolved high-risk concern and the animal has not been returned.</p></article><article><span className="kicker">CURRENT QUEUE</span><h2>{reviewCheckins.length + openSupport.length + openReturns.length} welfare follow-ups</h2><p>{reviewCheckins.length} check-in reviews · {openSupport.length} support cases · {openReturns.length} safe-return plans.</p></article></div>
    <section className="admin-panel trust-review">
      <div className="admin-panel-head"><div><h2>Check-ins needing human review</h2><p>Rule-based flags prioritize attention; they do not diagnose or decide an outcome.</p></div></div>
      <div className="post-admin-grid">{reviewCheckins.map((checkin) => { var _a, _b; return <article key={String(checkin.id)}><span>{String(checkin.milestone).replace("_", " ")} · score {String(checkin.concernScore)}</span><h3>Adoption {String(checkin.adoptionId)}</h3><ul>{((_a = checkin.concerns) !== null && _a !== void 0 ? _a : []).map((concern) => <li key={concern}>{concern}</li>)}</ul><div className="evidence-links">{((_b = checkin.photoMediaIds) !== null && _b !== void 0 ? _b : []).map((mediaId) => <a key={mediaId} href={`/api/media?mediaId=${encodeURIComponent(mediaId)}`} target="_blank" rel="noreferrer">Private update photo ↗</a>)}</div><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onCheckin(String(checkin.id), form.get("resolved") === "YES", String(form.get("notes"))); }}><label>Outcome<select name="resolved"><option value="NO">Keep support open</option><option value="YES">Concern resolved</option></select></label><label>Factual review notes<textarea name="notes" required minLength={20} rows={4}/></label><button className="primary" disabled={busy}>Save review</button></form></article>; })}{!reviewCheckins.length && <div className="record-empty">No check-ins currently need review.</div>}</div>
    </section>
    <section className="admin-panel trust-review">
      <div className="admin-panel-head"><div><h2>Support triage</h2><p>Agree the next care step with the adopter and custodian.</p></div></div>
      <div className="post-admin-grid">{openSupport.map((item) => { var _a, _b; return <article key={String(item.id)}><span>{String(item.urgency)} · {String(item.status)}</span><h3>{String(item.category).replaceAll("_", " ")}</h3><p>{String(item.summary)}</p><form onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSupport(String(item.id), String(form.get("next")), String(form.get("notes"))); }}><label>Next step<select name="next">{((_a = supportTransitions[String(item.status)]) !== null && _a !== void 0 ? _a : []).map((next) => <option key={next}>{next}</option>)}</select></label><label>Care plan<textarea name="notes" required minLength={20} rows={4}/></label><button className="primary" disabled={busy || !((_b = supportTransitions[String(item.status)]) !== null && _b !== void 0 ? _b : []).length}>Update support</button></form></article>; })}{!openSupport.length && <div className="record-empty">No open post-adoption support cases.</div>}</div>
    </section>
    <section className="admin-panel trust-review">
      <div className="admin-panel-head"><div><h2>Safe-return coordination</h2><p>Keep the animal safe, preserve the full history and record every custody step.</p></div></div>
      <div className="post-admin-grid">{openReturns.map((item) => {
            var _a, _b;
            const status = String(item.status);
            const options = { REQUESTED: ["TRIAGED", "SUPPORT_OFFERED", "RETURN_APPROVED"], TRIAGED: ["SUPPORT_OFFERED", "RETURN_APPROVED"], SUPPORT_OFFERED: ["RETURN_APPROVED", "CLOSED"], RETURN_APPROVED: ["HANDOVER_SCHEDULED"], HANDOVER_SCHEDULED: ["RETURNED"] };
            return <article key={String(item.id)} className={item.urgentSafetyRisk ? "urgent" : ""}><span>{item.urgentSafetyRisk ? "URGENT SAFETY RISK" : status}</span><h3>{String(item.category).replaceAll("_", " ")}</h3><p>{String(item.explanation)}</p><form onSubmit={(event) => { var _a; event.preventDefault(); const form = new FormData(event.currentTarget); onReturn(String(item.id), String(form.get("next")), String(form.get("notes")), String((_a = form.get("scheduledHandoverAt")) !== null && _a !== void 0 ? _a : "")); }}><label>Next step<select name="next">{((_a = options[status]) !== null && _a !== void 0 ? _a : []).map((option) => <option key={option}>{option}</option>)}</select></label>{status === "RETURN_APPROVED" && <label>Safe handover date<input name="scheduledHandoverAt" type="datetime-local" required/></label>}<label>Agreed plan<textarea name="notes" required minLength={20} rows={4}/></label><button className="primary" disabled={busy || !((_b = options[status]) !== null && _b !== void 0 ? _b : []).length}>Update return</button></form></article>;
        })}{!openReturns.length && <div className="record-empty">No active safe-return plans.</div>}</div>
    </section>
    <AdminTable title="All post-adoption records" rows={data.postAdoptionOutcomes} columns={["petName", "status", "handoverAt", "submittedCheckins", "nextDueAt", "openSupport", "activeReturn"]}/>
  </>;
}
function VerificationOperations({ rows, badges, busy, onDecision }) {
    var _a, _b, _c;
    const pending = rows.filter((row) => ["SUBMITTED", "UNDER_REVIEW"].includes(String(row.status)));
    const [selectedId, setSelectedId] = useState("");
    const selected = (_b = (_a = rows.find((row) => String(row.id) === selectedId)) !== null && _a !== void 0 ? _a : pending[0]) !== null && _b !== void 0 ? _b : null;
    return <>
    <section className="admin-panel trust-review">
      <div className="admin-panel-head"><div><h2>Evidence-scoped verification</h2><p>{pending.length} awaiting accountable review</p></div></div>
      <p className="admin-form-note">Approve only the fact you actually checked. A badge never promises that a person, organization or animal is completely safe, healthy or compatible.</p>
      <div className="trust-review-layout">
        <div className="trust-review-list">
          {rows.map((request) => <button key={String(request.id)} className={selected && request.id === selected.id ? "active" : ""} onClick={() => setSelectedId(String(request.id))}>
            <span>{String(request.verificationType).replaceAll("_", " ")}</span>
            <b>{String(request.targetType)} · {String(request.targetId)}</b>
            <small>{String(request.status)} · {display(request.createdAt, "createdAt")}</small>
          </button>)}
          {!rows.length && <div className="record-empty">No verification requests yet.</div>}
        </div>
        {selected && <div className="trust-review-detail">
          <span className="kicker">{String(selected.status)}</span>
          <h3>{String(selected.verificationType).replaceAll("_", " ")}</h3>
          <p><b>Requested scope:</b> {String(selected.requestedScope || "No additional scope supplied.")}</p>
          <p><b>Target:</b> {String(selected.targetType)} · {String(selected.targetId)}</p>
          <div className="evidence-links">{((_c = selected.evidenceMediaIds) !== null && _c !== void 0 ? _c : []).map((mediaId) => <a key={String(mediaId)} href={`/api/media?mediaId=${encodeURIComponent(String(mediaId))}`} target="_blank" rel="noreferrer">Review evidence ↗</a>)}</div>
          {["SUBMITTED", "UNDER_REVIEW"].includes(String(selected.status)) ? <form onSubmit={(event) => {
                    event.preventDefault();
                    const form = new FormData(event.currentTarget);
                    onDecision(String(selected.id), String(form.get("decision")), String(form.get("notes")), String(form.get("approvedScope")), Number(form.get("validityMonths")));
                }}>
            <label>Decision<select name="decision" required><option value="APPROVED">Approve exact scope</option><option value="REJECTED">Reject request</option></select></label>
            <label>Exact verified scope<input name="approvedScope" placeholder="Example: Professional registration and validity checked"/><small>Public badge text: never include a document number, address or other private data.</small></label>
            <label>Badge validity (months)<input name="validityMonths" type="number" min="1" max="36" defaultValue="12"/></label>
            <label className="wide">Review notes<textarea name="notes" minLength={20} required rows={4} placeholder="What was checked, against which evidence, and why this decision is appropriate."/></label>
            <button className="primary" disabled={busy}>Record decision</button>
          </form> : <div className="trust-decision"><b>Decision recorded</b><p>{String(selected.reviewerNotes || "No reviewer note available.")}</p></div>}
        </div>}
      </div>
    </section>
    <AdminTable onReview={undefined} title="Active and historical badges" rows={badges} columns={["label", "targetType", "targetId", "scope", "status", "verifiedAt", "expiresAt"]}/>
  </>;
}
function TrustSafetyOperations({ cases, reports, appeals, restrictions, busy, onAction, onAppeal }) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    const openCases = cases.filter((row) => ["OPEN", "UNDER_REVIEW", "APPEALED"].includes(String(row.status)));
    const pendingAppeals = appeals.filter((row) => ["SUBMITTED", "UNDER_REVIEW"].includes(String(row.status)));
    const [selectedCaseId, setSelectedCaseId] = useState("");
    const [selectedAppealId, setSelectedAppealId] = useState("");
    const selectedCase = (_c = (_b = (_a = cases.find((row) => String(row.id) === selectedCaseId)) !== null && _a !== void 0 ? _a : openCases[0]) !== null && _b !== void 0 ? _b : cases[0]) !== null && _c !== void 0 ? _c : null;
    const selectedAppeal = (_e = (_d = appeals.find((row) => String(row.id) === selectedAppealId)) !== null && _d !== void 0 ? _d : pendingAppeals[0]) !== null && _e !== void 0 ? _e : null;
    return <>
    <div className="trust-ops-stats">
      <article><span>OPEN CASES</span><b>{openCases.length}</b></article>
      <article><span>USER REPORTS</span><b>{reports.length}</b></article>
      <article><span>PENDING APPEALS</span><b>{pendingAppeals.length}</b></article>
      <article><span>ACTIVE RESTRICTIONS</span><b>{restrictions.filter((row) => row.active).length}</b></article>
    </div>
    <section className="admin-panel trust-review">
      <div className="admin-panel-head"><div><h2>Fraud and welfare review</h2><p>Signals prioritize human review; they never punish an account automatically.</p></div></div>
      <div className="trust-review-layout">
        <div className="trust-review-list">
          {cases.map((caseRecord) => <button key={String(caseRecord.id)} className={selectedCase && caseRecord.id === selectedCase.id ? "active" : ""} onClick={() => setSelectedCaseId(String(caseRecord.id))}>
            <span>{String(caseRecord.priority)} · risk {String(caseRecord.riskScore)}</span>
            <b>{String(caseRecord.subjectType)} · {String(caseRecord.subjectId)}</b>
            <small>{String(caseRecord.status)} · {display(caseRecord.updatedAt, "updatedAt")}</small>
          </button>)}
          {!cases.length && <div className="record-empty">No moderation cases.</div>}
        </div>
        {selectedCase && <div className="trust-review-detail">
          <span className="kicker">{String(selectedCase.priority)} PRIORITY · {String(selectedCase.status)}</span>
          <h3>{String(selectedCase.subjectType)} {String(selectedCase.subjectId)}</h3>
          <div className="signal-list">
            {((_f = selectedCase.signals) !== null && _f !== void 0 ? _f : []).map((signal) => <article key={String(signal.id)}><b>{String(signal.code).replaceAll("_", " ")}</b><span>{String(signal.severity)} · +{String(signal.score)}</span><p>{String(signal.explanation)}</p><small>Rules {String(signal.detectorVersion)}</small></article>)}
            {!((_g = selectedCase.signals) !== null && _g !== void 0 ? _g : []).length && <p>No automated signal details. Review the user report or case evidence.</p>}
          </div>
          <div className="case-evidence">
            {((_h = selectedCase.evidence) !== null && _h !== void 0 ? _h : []).map((evidence) => { var _a; return <article key={String(evidence.id)}><b>{String(evidence.type).replaceAll("_", " ")}</b><p>{String(evidence.summary)}</p><div className="evidence-links">{((_a = evidence.mediaIds) !== null && _a !== void 0 ? _a : []).map((mediaId) => <a key={String(mediaId)} href={`/api/media?mediaId=${encodeURIComponent(String(mediaId))}`} target="_blank" rel="noreferrer">Open evidence ↗</a>)}</div></article>; })}
          </div>
          <form onSubmit={(event) => {
                event.preventDefault();
                const values = Object.fromEntries(new FormData(event.currentTarget));
                onAction(Object.assign({ caseId: selectedCase.id }, values));
            }}>
            <label>Action<select name="moderationAction" required><option value="NOTE">Add review note</option><option value="WARN">Warn account</option><option value="RESTRICT">Restrict account feature</option><option value="SUSPEND">Suspend account</option><option value="REMOVE_LISTING">Pause pet listing</option><option value="REVOKE_BADGE">Revoke verification badge</option><option value="CLEAR">Clear case</option><option value="REINSTATE">Reinstate record</option></select></label>
            <label>Target type<select name="targetType" defaultValue={String(selectedCase.subjectType)}><option>USER</option><option>PET</option><option>ORGANIZATION</option><option>APPLICATION</option><option>MESSAGE</option><option>RESCUE_CASE</option><option>DIRECTORY_ENTRY</option><option>BADGE</option></select></label>
            <label>Target record ID<input name="targetId" defaultValue={String(selectedCase.subjectId)} required/></label>
            <label>Restriction scope<select name="scope"><option>MARKETPLACE</option><option>LISTING</option><option>CHAT</option><option>ORGANIZATION_TOOLS</option><option>ALL</option></select></label>
            <label>Duration in days<input name="durationDays" type="number" min="1" max="3650" placeholder="Blank means until reviewed"/></label>
            <label className="wide">Factual reason<textarea name="reason" minLength={20} required rows={4} placeholder="Describe the evidence, proportional action and welfare or safety reason."/></label>
            <button className="primary" disabled={busy}>Apply and audit action</button>
          </form>
        </div>}
      </div>
    </section>
    <AdminTable title="Submitted safety reports" rows={reports} columns={["category", "subjectType", "subjectId", "summary", "status", "moderationCaseId", "createdAt"]}/>
    <section className="admin-panel trust-review">
      <div className="admin-panel-head"><div><h2>Appeals</h2><p>{pendingAppeals.length} need an independent decision</p></div></div>
      <div className="trust-review-layout">
        <div className="trust-review-list">
          {appeals.map((appeal) => <button key={String(appeal.id)} className={selectedAppeal && appeal.id === selectedAppeal.id ? "active" : ""} onClick={() => setSelectedAppealId(String(appeal.id))}>
            <span>{String(appeal.status)}</span><b>Case {String(appeal.moderationCaseId)}</b><small>{display(appeal.createdAt, "createdAt")}</small>
          </button>)}
          {!appeals.length && <div className="record-empty">No appeals submitted.</div>}
        </div>
        {selectedAppeal && <div className="trust-review-detail">
          <span className="kicker">{String(selectedAppeal.status)}</span><h3>Appeal for case {String(selectedAppeal.moderationCaseId)}</h3>
          <p>{String(selectedAppeal.statement)}</p>
          <div className="evidence-links">{((_j = selectedAppeal.evidenceMediaIds) !== null && _j !== void 0 ? _j : []).map((mediaId) => <a key={String(mediaId)} href={`/api/media?mediaId=${encodeURIComponent(String(mediaId))}`} target="_blank" rel="noreferrer">Review appeal evidence ↗</a>)}</div>
          {["SUBMITTED", "UNDER_REVIEW"].includes(String(selectedAppeal.status)) && <form onSubmit={(event) => {
                    event.preventDefault();
                    const values = Object.fromEntries(new FormData(event.currentTarget));
                    onAppeal(Object.assign({ appealId: selectedAppeal.id }, values));
                }}>
            <label>Decision<select name="decision"><option>UPHELD</option><option>OVERTURNED</option><option>PARTIAL</option></select></label>
            <label>Scope to lift if partial<select name="liftScope"><option value="">Not applicable</option><option>MARKETPLACE</option><option>LISTING</option><option>CHAT</option><option>ORGANIZATION_TOOLS</option><option>ALL</option></select></label>
            <label className="wide">Resolution<textarea name="resolution" minLength={20} required rows={4} placeholder="Explain the reviewed evidence and why the outcome is proportionate."/></label>
            <button className="primary" disabled={busy}>Record appeal decision</button>
          </form>}
        </div>}
      </div>
    </section>
    <AdminTable title="Active and historical restrictions" rows={restrictions} columns={["userId", "scope", "reason", "active", "startsAt", "endsAt", "liftedAt"]}/>
  </>;
}
function AdminTable({ title, rows, columns, renderAction, onReview }) {
    return <section className="admin-panel"><div className="admin-panel-head"><div><h2>{title}</h2><p>{rows.length} recent records</p></div></div><div className="admin-table-wrap"><table><thead><tr>{columns.map((column) => <th key={column}>{human(column)}</th>)}{(renderAction || onReview) && <th>Action</th>}</tr></thead><tbody>{rows.map((row, index) => { var _a; return <tr key={String((_a = row.id) !== null && _a !== void 0 ? _a : index)}>{columns.map((column) => <td key={column}>{display(row[column], column)}</td>)}{(renderAction || onReview) && <td><div className="admin-row-actions">{onReview && <button onClick={() => onReview(row)}>Review</button>}{renderAction && renderAction(row)}</div></td>}</tr>; })}</tbody></table>{!rows.length && <div className="record-empty">No records yet.</div>}</div></section>;
}
function AdminDetail({ section, row, onClose }) {
    var _a, _b, _c;
    const hidden = new Set(["phoneE164", "pinCode", "privateJson", "landmarkPrivate", "privateProofMarks", "identifyingMarksPrivate", "microchipPrivate", "preciseLocationPrivate", "reporterUserId", "requesterUserId", "submittedByUserId", "appellantUserId", "mediaIdsJson", "evidenceMediaIdsJson", "declarationJson"]);
    const entries = Object.entries(row).filter(([key]) => !hidden.has(key));
    return <section className="admin-detail" aria-label={`${section} review`}>
    <div className="admin-detail-head"><div><span>ACCOUNTABLE REVIEW</span><h2>{String((_c = (_b = (_a = row.name) !== null && _a !== void 0 ? _a : row.fullName) !== null && _b !== void 0 ? _b : row.id) !== null && _c !== void 0 ? _c : section)}</h2><p>Review the complete operational record before changing its state. Sensitive identity and private household fields remain excluded.</p></div><button onClick={onClose}>Close ×</button></div>
    <dl>{entries.map(([key, value]) => <div key={key}><dt>{human(key)}</dt><dd>{display(value, key)}</dd></div>)}</dl>
  </section>;
}
function human(value) { return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase()); }
function display(value, column) {
    if (Array.isArray(value))
        return value.join(", ") || "—";
    if (value == null || value === "")
        return "—";
    if (column === "amountPaise")
        return `₹${(Number(value) / 100).toLocaleString("en-IN")}`;
    if (column.endsWith("At") && value)
        return new Date(String(value)).toLocaleString("en-IN");
    const text = typeof value === "object" ? JSON.stringify(value) : String(value);
    return text.length > 80 ? `${text.slice(0, 77)}…` : text;
}
function CreateOrganization({ busy, onCreate }) { return <form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onCreate(Object.fromEntries(form)); }}><h3>Add organization</h3><input name="name" placeholder="Organization name" required/><select name="type"><option>NGO</option><option>SHELTER</option><option>RESCUE</option><option>VET</option><option>TRAINER</option></select><input name="city" placeholder="City" required/><input name="registrationNumber" placeholder="Registration number"/><button className="primary" disabled={busy}>Create</button></form>; }
function AssignOrganizationRole({ organizations, busy, onAssign }) { return <form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); onAssign(Object.fromEntries(new FormData(event.currentTarget))); }}><h3>Give staff secure CRM access</h3><select name="organizationId" required defaultValue=""><option value="" disabled>Choose organization</option>{organizations.map((organization) => <option key={String(organization.id)} value={String(organization.id)}>{String(organization.name)}</option>)}</select><input name="email" type="email" placeholder="Existing account email" required/><select name="role"><option>ORGANIZATION_ADMIN</option><option>SHELTER_STAFF</option><option>NGO_STAFF</option><option>ADOPTION_COORDINATOR</option><option>VETERINARIAN</option></select><span className="admin-form-note">The person must sign up first. Access is limited to this organization.</span><button className="primary" disabled={busy}>Give access</button></form>; }
function PromotionForm({ busy, onSave }) { return <form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave(Object.fromEntries(form)); }}><h3>Create promotion</h3><input name="code" placeholder="FOUNDING100" required/><select name="benefitType"><option>ADOPTER_ACTIVATION</option><option>PET_PUBLICATION</option></select><input name="limit" type="number" min="1" defaultValue="100"/><input name="days" type="number" min="1" defaultValue="90" aria-label="Validity in days"/><button className="primary" disabled={busy}>Save</button></form>; }
function CommerceForm({ settings, busy, onSave }) {
    var _a, _b, _c, _d;
    return <form className="admin-inline-form commerce-form" onSubmit={(event) => { event.preventDefault(); onSave(Object.fromEntries(new FormData(event.currentTarget))); }}>
    <h3>Pricing, taxes and invoices</h3>
    <label>Adopter fee (₹)<input name="adopterFeeRupees" type="number" min="0.01" step="0.01" defaultValue={Number((_a = settings.adopterFeePaise) !== null && _a !== void 0 ? _a : 9900) / 100} required/></label>
    <label>Pet listing fee (₹)<input name="petListingFeeRupees" type="number" min="0.01" step="0.01" defaultValue={Number((_b = settings.petListingFeePaise) !== null && _b !== void 0 ? _b : 9900) / 100} required/></label>
    <label>Organization plan (₹)<input name="organizationSubscriptionFeeRupees" type="number" min="0.01" step="0.01" defaultValue={settings.organizationSubscriptionFeePaise == null ? "" : Number(settings.organizationSubscriptionFeePaise) / 100} placeholder="Not offered yet"/></label>
    <label>Tax rate (%)<input name="taxRatePercent" type="number" min="0" max="100" step="0.01" defaultValue={Number((_c = settings.taxRateBps) !== null && _c !== void 0 ? _c : 0) / 100}/></label>
    <label>Invoice prefix<input name="invoicePrefix" defaultValue={String((_d = settings.invoicePrefix) !== null && _d !== void 0 ? _d : "AV")} required maxLength={12}/></label>
    <span className="admin-form-note">Each order stores the exact price and tax configuration used, so later price changes never rewrite past transactions.</span>
    <button className="primary" disabled={busy}>Save commerce settings</button>
  </form>;
}
function CommunicationControls({ busy, rows, onProcess }) {
    const queued = rows.filter((row) => row.status === "QUEUED").length;
    const failed = rows.filter((row) => row.status === "FAILED").length;
    return <section className="admin-panel"><div className="admin-panel-head"><div><h2>Provider delivery operations</h2><p>{queued} queued · {failed} failed · credentials are never displayed here</p></div><button className="primary" disabled={busy || (!queued && !failed)} onClick={onProcess}>{busy ? "Processing…" : "Process due messages"}</button></div><p className="admin-form-note">Retries use bounded exponential backoff. A provider being unavailable never changes an adoption, payment or moderation decision.</p></section>;
}
function DirectoryForm({ busy, onSave }) { return <form className="admin-inline-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave(Object.fromEntries(form)); }}><h3>Add sourced directory record</h3><input name="name" placeholder="Name" required/><input name="category" placeholder="Vet, NGO, shelter…" required/><input name="city" placeholder="City" required/><input name="sourceUrl" type="url" placeholder="Authoritative source URL" required/><button className="primary" disabled={busy}>Add record</button></form>; }
function MatchingControl({ rows, busy, onSave }) {
    const latest = rows[0];
    const parsed = (latest === null || latest === void 0 ? void 0 : latest.weightsJson) ? JSON.parse(String(latest.weightsJson)) : {};
    const names = ["home", "lifestyle", "energy", "family", "existingPets", "experience", "medical", "longTerm", "distance", "preferences"];
    return <><form className="admin-weight-form" onSubmit={(event) => { event.preventDefault(); const form = new FormData(event.currentTarget); onSave(Object.fromEntries(names.map((name) => [name, Number(form.get(name))]))); }}><div><h2>Matching weights</h2><p>Create a new immutable rules version. The weights should total 100.</p></div>{names.map((name) => { var _a; return <label key={name}>{human(name)}<input name={name} type="number" min="0" max="100" defaultValue={Number((_a = parsed[name]) !== null && _a !== void 0 ? _a : 10)}/></label>; })}<button className="primary" disabled={busy}>Activate new version</button></form><AdminTable title="Ruleset history" rows={rows} columns={["version", "active", "weightsJson", "createdAt"]}/></>;
}
function SystemHealth() {
    var _a;
    const [health, setHealth] = useState(null);
    const [busy, setBusy] = useState(false);
    const check = async () => { setBusy(true); try {
        const response = await fetch("/api/health");
        setHealth(await response.json());
    }
    finally {
        setBusy(false);
    } };
    return <section className="admin-panel system-health"><div className="admin-panel-head"><div><h2>Production health</h2><p>Safe operational checks without exposing credentials.</p></div><button className="primary" disabled={busy} onClick={check}>{busy ? "Checking…" : "Run health check"}</button></div>{health ? <dl>{Object.entries(((_a = health.checks) !== null && _a !== void 0 ? _a : {})).map(([key, value]) => <div key={key}><dt>{human(key)}</dt><dd>{typeof value === "object" ? Object.entries(value).map(([name, ready]) => `${name}: ${ready ? "ready" : "not configured"}`).join(" · ") : value ? "Healthy" : "Unavailable"}</dd></div>)}</dl> : <div className="record-empty">Run a health check to verify the database, file storage, authentication and external provider configuration.</div>}</section>;
}
