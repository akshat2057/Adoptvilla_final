import {
  fetchRealAdminConsole,
  createAdminPrivateDocumentUrl,
  adminUpdatePetState,
  adminReviewVerification,
  adminReviewPostAdoptionCheckin,
  adminTriagePostAdoptionSupport,
  adminTransitionSafeReturn,
  adminCloseFailedPayment,
} from "./adminSupabase.js";
import {
  fetchRealNotifications,
  fetchRealCommunicationSettings,
  saveRealNotificationPreferences,
  fetchRealTrustSafetyNetwork,
  submitRealVerificationRequest,
  submitRealSafetyReport,
  uploadPrivateTrustEvidence,
} from "./notificationTrustSupabase.js";
import {
  fetchMyAccountAccessState,
} from "./paymentSupabase.js";
import {
  fetchRealPostAdoptionNetwork,
  submitRealPostAdoptionCheckin,
  uploadPrivatePostAdoptionPhoto,
  openRealPostAdoptionSupport,
  triageRealPostAdoptionSupport,
  reviewRealPostAdoptionCheckin,
  requestRealSafeReturn,
  transitionRealSafeReturn,
} from "./postAdoptionSupabase.js";
import {
  fetchRealRescueNetwork,
  saveRealRescueCase,
  transitionRealRescueCase,
  acceptRealRescueIntoCare,
  saveRealFosterProfile,
  calculateRealFosterMatches,
inviteRealFoster,
respondRealFosterInvite,
offerRealFosterHelp,
acceptRealFosterMatch,
} from "./rescueSupabase.js";
import {
  fetchRealLostFoundNetwork,
  saveRealLostFoundReport,
  calculateRealLostFoundMatches,
  expressRealLostFoundInterest,
  rejectRealLostFoundMatch,
  submitRealOwnershipVerification,
  confirmRealLostFoundReunion,
  closeRealLostFoundReport,
  fetchRealLostFoundThread,
  sendRealLostFoundMessage,
  uploadPublicWelfarePhoto,
  deleteRealClosedLostFoundReport,
} from "./lostFoundSupabase.js";
import {
  confirmRealInterest,
  advanceRealWorkflow,
  fetchRealThread,
  sendRealMessage,
} from "./messagingSupabase.js";
import {
  calculateRealMatches,
  calculateRealPetCompatibility,
  createRealApplication,
  fetchRealWorkflow,
  withdrawRealApplication,
} from "./matchingSupabase.js";
import {
  publicPets, citySummaries, promotions, dashboardInitial, demoMatches, workflowApplications, threadMessages,
  postAdoptionData, lostFoundData, rescueData, fosterData, trustSafetyData, communicationSettings,
  adopterCandidates, crmData, paymentDocuments, databaseTables, indoreDirectory, adminData,
} from "./data/mockData.js";
import { supabase } from "./supabaseClient.js";
import { savePetDraft, uploadPetDraftMedia } from "./petSupabase.js";
import { fetchRealCatalog, fetchPublishedPet } from "./catalogSupabase.js";
import { fetchAccountSavedPets, setAccountSavedPet } from "./savedSupabase.js";

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { "content-type": "application/json; charset=utf-8" },
});

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
const clone = (value) => JSON.parse(JSON.stringify(value));

// UI/functionality fallback state. Real Supabase data is preferred whenever it is
// available; these records keep the current frontend usable while the database
// migration is completed in a separate phase.
const runtimeAdmin = clone(adminData);
const runtimeLostFound = clone(lostFoundData);
const runtimeRescue = clone(rescueData);
const runtimeFoster = clone(fosterData);
const runtimeTrustSafety = clone(trustSafetyData);
const runtimePostAdoption = clone(postAdoptionData);
const runtimeNotifications = clone(dashboardInitial.notifications || []);
const runtimeCommunicationSettings = clone(communicationSettings);
const runtimeJourneyEvents = clone(workflowApplications[0]?.journey || []);
const runtimeDirectoryFeedback = [];
let runtimeCrm = null;

function fallbackResponse(data, reason) {
  if (reason) console.warn("Using AdoptVilla UI fallback:", reason);
  return { ...clone(data), demoFallback: true };
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Please sign in to continue.");
  return data.user.id;
}

async function setAccountPurpose(roles) {
  const requested = Array.isArray(roles) ? roles.map(String) : [];
  const { data, error } = await supabase.rpc("set_my_account_purpose", {
    requested_roles: requested,
  });
  if (error) throw new Error(error.message);
  return { roles: data || [] };
}

async function saveAdopterProfile(profile = {}) {
  const userId = await currentUserId();
  const metadata = {
    childAgeBands: Array.isArray(profile.childAgeBands) ? profile.childAgeBands : [],
    currentPets: Array.isArray(profile.currentPets) ? profile.currentPets : [],
    previousPets: Array.isArray(profile.previousPets) ? profile.previousPets : [],
    longTermPlans: profile.longTermPlans && typeof profile.longTermPlans === "object" ? profile.longTermPlans : {},
  };

  const payload = {
    id: userId,
    city: profile.city || null,
    state_name: profile.stateName || null,
    pin_code: profile.pinCode || null,
    locality: profile.locality || null,
    home_type: profile.homeType || null,
    tenure: profile.tenure || null,
    landlord_permission: profile.landlordPermission || null,
    adult_count: Number.isFinite(Number(profile.adultCount)) ? Number(profile.adultCount) : null,
    household_agreement: profile.householdAgreement || null,
    work_mode: profile.workMode || null,
    alone_hours: Number.isFinite(Number(profile.aloneHours)) ? Number(profile.aloneHours) : null,
    exercise_minutes: Number.isFinite(Number(profile.exerciseMinutes)) ? Number(profile.exerciseMinutes) : null,
    training_minutes: Number.isFinite(Number(profile.trainingMinutes)) ? Number(profile.trainingMinutes) : null,
    experience_level: profile.experienceLevel || null,
    financial_readiness: profile.financialReadiness || null,
    discoverability: profile.discoverability || "NONE",
    readiness_score: Number.isFinite(Number(profile.readinessScore)) ? Number(profile.readinessScore) : null,
    completeness: Number.isFinite(Number(profile.completeness)) ? Number(profile.completeness) : null,
    preferences: profile.preferences && typeof profile.preferences === "object" ? profile.preferences : {},
    metadata,
  };

  const { data, error } = await supabase
    .from("profiles")
    .upsert(payload, { onConflict: "id" })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return { profile: data };
}

async function catalog(url) {
  try {
    const data = await fetchRealCatalog(url, promotions);
    return json(data);
  } catch (error) {
    console.warn("Catalog backend unavailable; using demo catalog.", error instanceof Error ? error.message : error);
    const page = Math.max(1, Number(url.searchParams.get("page") || 1));
    const pageSize = Math.max(1, Math.min(50, Number(url.searchParams.get("pageSize") || 12)));
    const species = String(url.searchParams.get("species") || "").toLowerCase();
    const city = String(url.searchParams.get("city") || "").toLowerCase();
    const query = String(url.searchParams.get("q") || url.searchParams.get("search") || "").toLowerCase();
    const filtered = publicPets.filter((pet) => {
      if (species && String(pet.species || "").toLowerCase() !== species) return false;
      if (city && String(pet.city || "").toLowerCase() !== city) return false;
      if (query && !JSON.stringify(pet).toLowerCase().includes(query)) return false;
      return true;
    });
    const start = (page - 1) * pageSize;
    const pets = filtered.slice(start, start + pageSize);
    return json({
      pets,
      total: filtered.length,
      realTotal: 0,
      demoTotal: filtered.length,
      page,
      pageSize,
      hasMore: start + pageSize < filtered.length,
      cities: [...new Set(publicPets.map((pet) => pet.city).filter(Boolean))].sort(),
      promotions,
      demoFallback: true,
    });
  }
}

async function compatibility(petId) {
  let pet = null;

  try {
    pet = await fetchPublishedPet(petId);
  } catch (error) {
    console.error("Compatibility pet load error:", error);
  }

  if (!pet) {
    pet = publicPets.find((item) => item.id === petId) || publicPets[0];
  }

  const demoNumber = Number(String(pet.legacyId || "").match(/demo_pet_(\d+)/)?.[1] || 0);
  const eligible = !(pet.demo && demoNumber === 4);
  const index = demoNumber > 0 ? demoNumber - 1 : 0;

  return {
    pet,
    eligible,
    canApply: eligible,
    matchId: eligible ? `petmatch_${pet.id}` : "",
    score: eligible ? Math.max(68, 94 - index * 2) : 0,
    confidence: index < 4 ? "HIGH" : "MEDIUM",
    coverage: 91,
    profileState: "ACTIVE",
    reasons: eligible ? [
      "Home setup is compatible with the recorded needs",
      "Routine and exercise commitment align",
      pet.city === "Indore" ? "Same-city introduction is easier to coordinate" : "A transport plan can be coordinated",
    ] : [],
    warnings: pet.energy === "High" ? ["Plan for daily high-energy exercise and enrichment"] : ["A gradual settling period is still important"],
    hardStops: eligible ? [] : ["This record currently requires an experienced handler while the profile is set to general experience"],
    dimensionScores: eligible ? { homeFit: 94, scheduleFit: 88, householdFit: 90, exerciseFit: pet.energy === "High" ? 82 : 92, careCapacity: 90, distance: pet.city === "Indore" ? 100 : 72 } : {},
    application: null,
  };
}

function crmPayload() {
  if (!runtimeCrm) {
    const animal = {
      id: "crm_1", name: "Moti", species: "Dog", source: "Found animal", intakeDate: "2026-08-30",
      locationCode: "Shelter A · Kennel K-12", capacityType: "KENNEL", condition: "Stable after initial examination",
      lostFoundReport: null,
      events: [
        { id: "crm_ev_1", type: "INTAKE", createdAt: "2026-08-30T09:00:00.000Z", completedAt: "2026-08-30T09:00:00.000Z", data: { title: "Animal intake", notes: "Found animal admitted to care" } },
        { id: "crm_ev_2", type: "MEDICAL", createdAt: "2026-08-30T11:00:00.000Z", dueAt: "2026-09-05T10:00:00.000Z", completedAt: null, data: { title: "Vaccination follow-up", provider: "Partner veterinarian", notes: "Routine review" } },
      ],
    };
    runtimeCrm = { animals: [animal], summary: { animals: 1, openTasks: 1, overdue: 0, fosterPlacements: 0, locations: [{ location: "Shelter A · Kennel K-12", occupied: 1 }] } };
  }

  const snapshot = clone(runtimeCrm);
  snapshot.summary.animals = snapshot.animals.length;
  snapshot.summary.openTasks = snapshot.animals.reduce((sum, animal) => sum + (animal.events || []).filter((event) => !event.completedAt).length, 0);
  return snapshot;
}

async function platformGet(url) {
  const resource =
    url.searchParams.get("resource") || "";

  if (resource === "admin-console") {
    try {
      return json(
        await fetchRealAdminConsole()
      );
    } catch (error) {
      return json(fallbackResponse(runtimeAdmin, error instanceof Error ? error.message : "Admin console fallback"));
    }
  }

  if (resource === "account-access") {
    try {
      return json(
        await fetchMyAccountAccessState()
      );
    } catch (error) {
      return json({
        activated: true,
        adopterActivated: true,
        petPublicationAccess: {},
        demoFallback: true,
      });
    }
  }

  if (resource === "saved-pets") {
    try {
      const data = await fetchAccountSavedPets();
      if (!data.authenticated) {
        return json({ error: "Sign in to access account saved pets." }, 401);
      }
      return json({ petIds: data.petIds, pets: data.pets });
    } catch (error) {
      return json({
        petIds: dashboardInitial.pets.map((pet) => String(pet.id)),
        pets: clone(publicPets.slice(0, 2)),
        demoFallback: true,
      });
    }
  }
 if (resource === "workflow") {
  try {
    const applications =
      await fetchRealWorkflow();

    return json({
      applications,
    });
  } catch (error) {
    return json({ applications: clone(workflowApplications), demoFallback: true });
  }
}
 if (resource === "thread") {
  try {
    const threadId =
      url.searchParams.get("threadId");

    const messages =
      await fetchRealThread(threadId);

    return json({
      messages,
    });
  } catch (error) {
    return json({ messages: clone(threadMessages), demoFallback: true });
  }
}
  if (resource === "journey-events") return json({ events: clone(runtimeJourneyEvents) });
  if (resource === "payment-documents") return json({ documents: paymentDocuments });
  if (resource === "adopter-candidates") return json({ candidates: adopterCandidates });
 if (resource === "post-adoption") {
  try {
    return json(
      await fetchRealPostAdoptionNetwork()
    );
  } catch (error) {
    return json(fallbackResponse(runtimePostAdoption, error instanceof Error ? error.message : "Post-adoption fallback"));
  }
}
 if (resource === "lost-found-network") {
  try {
    return json(
      await fetchRealLostFoundNetwork()
    );
  } catch (error) {
    return json(fallbackResponse(runtimeLostFound, error instanceof Error ? error.message : "Lost and found fallback"));
  }
}

if (resource === "lost-found-thread") {
  try {
    const threadId =
      url.searchParams.get("threadId");

    return json(
      await fetchRealLostFoundThread(
        threadId
      )
    );
  } catch (error) {
    return json({
      messages: [
        { id: "lf_msg_1", senderName: "Reporter", body: "I can share identifying details privately to verify the animal.", createdAt: now() },
      ],
      demoFallback: true,
    });
  }
}
 if (resource === "rescue-network") {
  try {
    return json(
      await fetchRealRescueNetwork()
    );
  } catch (error) {
    return json(fallbackResponse(runtimeRescue, error instanceof Error ? error.message : "Rescue fallback"));
  }
}
  if (resource === "foster-network") return json(clone(runtimeFoster));
  if (resource === "crm") return json(crmPayload());
 if (resource === "notifications") {
  try {
    return json(
      await fetchRealNotifications()
    );
  } catch (error) {
    return json({ notifications: clone(runtimeNotifications), demoFallback: true });
  }
}


if (resource === "trust-safety") {
  try {
    return json(
      await fetchRealTrustSafetyNetwork()
    );
  } catch (error) {
    return json(fallbackResponse(runtimeTrustSafety, error instanceof Error ? error.message : "Trust and safety fallback"));
  }
}


if (
  resource ===
  "communication-settings"
) {
  try {
    return json(
      await fetchRealCommunicationSettings()
    );
  } catch (error) {
    return json(fallbackResponse(runtimeCommunicationSettings, error instanceof Error ? error.message : "Communication settings fallback"));
  }
}
  return json({});
}

async function platformPostReal(body = {}) {
  const action = String(body.action || "");

  switch (action) {
    case "accept-found-into-care": {
      const report = runtimeLostFound.reports?.find((item) => String(item.id) === String(body.reportId)) || runtimeLostFound.reports?.find((item) => item.type === "FOUND") || runtimeLostFound.reports?.[0];
      if (report) {
        report.crmAnimalId = report.crmAnimalId || id("crm");
        report.organizationId = String(body.organizationId || "org_hfa");
        report.currentSafeStatus = "WITH_ORGANIZATION";
      }
      return json({ reportId: report?.id || String(body.reportId || "demo_found"), crmAnimalId: report?.crmAnimalId || id("crm"), status: report?.status || "REPORTED", demoFallback: true });
    }

    case "create-found-report-from-crm": {
      if (!runtimeCrm) crmPayload();
      const animal = runtimeCrm.animals.find((item) => String(item.id) === String(body.crmAnimalId)) || runtimeCrm.animals[0];
      const reportId = id("lf_found");
      const publicReference = `AV-LF-${Math.floor(1000 + Math.random() * 8999)}`;
      const report = { id: reportId, publicReference, type: "FOUND", petName: animal?.name || "Unknown", species: animal?.species || "Dog", city: "Indore", localityApprox: String(body.localityApprox || ""), publicDescription: String(body.publicDescription || ""), status: "REPORTED", currentSafeStatus: "WITH_ORGANIZATION", crmAnimalId: animal?.id || String(body.crmAnimalId || ""), riskScore: 10 };
      runtimeLostFound.reports.unshift(report);
      if (animal) animal.lostFoundReport = { id: reportId, publicReference };
      return json({ reportId, publicReference, report: clone(report), demoFallback: true });
    }

    case "crm-add-event": {
      if (!runtimeCrm) crmPayload();
      const animal = runtimeCrm.animals.find((item) => String(item.id) === String(body.crmAnimalId)) || runtimeCrm.animals[0];
      const event = { id: id("crm_ev"), type: String(body.type || "CARE"), createdAt: now(), dueAt: body.dueAt || null, completedAt: body.completed ? now() : null, data: clone(body.data || {}) };
      if (animal) { animal.events = animal.events || []; animal.events.unshift(event); }
      return json({ event, demoFallback: true });
    }

    case "crm-complete-event": {
      if (!runtimeCrm) crmPayload();
      let found = null;
      for (const animal of runtimeCrm.animals) {
        found = (animal.events || []).find((item) => String(item.id) === String(body.eventId)) || found;
        if (found) break;
      }
      if (!found) found = runtimeCrm.animals.flatMap((animal) => animal.events || [])[0] || { id: String(body.eventId || id("crm_ev")) };
      found.completedAt = now();
      return json({ event: clone(found), demoFallback: true });
    }

    case "admin-process-refund": {
      const payment = runtimeAdmin.payments?.find((item) => String(item.id) === String(body.orderId)) || runtimeAdmin.payments?.[0];
      if (payment) { payment.providerRefundId = payment.providerRefundId || id("demo_refund"); payment.status = "REFUND_REQUESTED"; }
      return json({ orderId: payment?.id || String(body.orderId || "demo_payment"), providerRefundId: payment?.providerRefundId || id("demo_refund"), status: "REFUND_REQUESTED", demoFallback: true });
    }

    case "admin-save-matching-rules": {
      const weights = body.weights && Object.keys(body.weights).length ? clone(body.weights) : { home: 10, lifestyle: 10, energy: 10, family: 10, existingPets: 10, experience: 10, medical: 10, longTerm: 10, distance: 10, preferences: 10 };
      const latestVersion = Math.max(0, ...(runtimeAdmin.matchingRules || []).map((row) => Number(row.version || 0)));
      const row = { id: id("matching_rules"), version: latestVersion + 1, active: true, weightsJson: JSON.stringify(weights), createdAt: now() };
      runtimeAdmin.matchingRules = (runtimeAdmin.matchingRules || []).map((item) => ({ ...item, active: false }));
      runtimeAdmin.matchingRules.unshift(row);
      return json({ rules: clone(row), demoFallback: true });
    }

    case "admin-update-pet": {
  try {
    return json(
      await adminUpdatePetState(
        body.petId,
        body.state
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Pet state could not be updated.",
      },
      403
    );
  }
}


case "admin-review-verification": {
  try {
    return json(
      await adminReviewVerification({
        requestId:
          body.requestId,

        decision:
          body.decision,

        notes:
          body.notes,

        approvedScope:
          body.approvedScope,

        validityMonths:
          body.validityMonths,
      })
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Verification decision could not be recorded.",
      },
      403
    );
  }
}


case "admin-update-payment": {
  try {
    if (
      String(body.status) !==
      "FAILED"
    ) {
      throw new Error(
        "Payment status cannot be manually activated."
      );
    }

    return json(
      await adminCloseFailedPayment(
        body.orderId
      )
    );

  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Payment attempt could not be updated.",
      },
      403
    );
  }
}
    case "set-account-purpose": {
      try {
        return json(await setAccountPurpose(body.roles));
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unable to save account purpose.",
          },
          400
        );
      }
    }
case "save-notification-preferences":
  try {
    return json(
      await saveRealNotificationPreferences(
        body.preferences || {}
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Notification preferences could not be saved.",
      },
      400
    );
  }


case "submit-verification-request":
  try {
    return json(
      await submitRealVerificationRequest({
        targetType:
          body.targetType,

        targetId:
          body.targetId,

        verificationType:
          body.verificationType,

        requestedScope:
          body.requestedScope,

        evidenceMediaIds:
          body.evidenceMediaIds,

        declaration:
          body.declaration,
      })
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Verification request could not be submitted.",
      },
      400
    );
  }


case "submit-safety-report":
  try {
    return json(
      await submitRealSafetyReport({
        subjectType:
          body.subjectType,

        subjectId:
          body.subjectId,

        category:
          body.category,

        summary:
          body.summary,

        evidenceMediaIds:
          body.evidenceMediaIds,
      })
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Safety report could not be submitted.",
      },
      400
    );
  }
    case "save-adopter-profile": {
      try {
        return json(await saveAdopterProfile(body.profile || {}));
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unable to save adopter profile.",
          },
          400
        );
      }
    }

    case "calculate-matches": {
      try {
        return json(await calculateRealMatches());
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Matches could not be calculated.",
          },
          400
        );
      }
    }

    case "calculate-pet-match": {
      try {
        return json(
          await calculateRealPetCompatibility(body.petId)
        );
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Compatibility could not be calculated.",
          },
          400
        );
      }
    }

    case "save-pet": {
      try {
        return json(await savePetDraft(body.pet || {}));
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Unable to save pet draft.",
          },
          400
        );
      }
    }

    case "create-application": {
      try {
        return json(
          await createRealApplication(body.matchId)
        );
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Application could not be submitted.",
          },
          400
        );
      }
    }
case "confirm-mutual-interest": {
  try {
    return json(
      await confirmRealInterest(
        body.applicationId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Mutual interest could not be confirmed.",
      },
      400
    );
  }
}
   case "transition-application": {
  try {
    if (
      String(body.next) ===
      "WITHDRAWN"
    ) {
      return json(
        await withdrawRealApplication(
          body.applicationId
        )
      );
    }

    return json(
      await advanceRealWorkflow(
        body.applicationId,
        body.next
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Application could not be updated.",
      },
      400
    );
  }
}
case "send-message": {
  try {
    return json(
      await sendRealMessage(
        body.threadId,
        body.message
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Message could not be sent.",
      },
      400
    );
  }
}

    case "create-payment-order":
      return json({
        providerReady: false,
        reason:
          "This UI-only replica does not charge real money. The complete checkout state is shown without contacting a payment gateway.",
        amountPaise: 9900,
        currency: "INR",
      });

  case "request-phone-otp":
  return json(
    {
      error:
        "Phone OTP provider is not connected yet. No verification code was sent.",
    },
    503
  );

case "verify-phone-otp":
  return json(
    {
      error:
        "Phone OTP provider is not connected yet.",
    },
    503
  );

case "send-test-notification":
  return json(
    {
      error:
        "External notification providers are not connected yet.",
    },
    503
  );
   

   

   case "save-lost-found-report": {
  try {
    return json(
      await saveRealLostFoundReport(
        body.report
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Lost and found report could not be saved.",
      },
      400
    );
  }
}

case "calculate-lost-found-matches": {
  try {
    return json(
      await calculateRealLostFoundMatches(
        body.reportId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Possible matches could not be calculated.",
      },
      400
    );
  }
}

case "express-lost-found-interest": {
  try {
    return json(
      await expressRealLostFoundInterest(
        body.matchId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Interest could not be recorded.",
      },
      400
    );
  }
}

case "mark-lost-found-false-match": {
  try {
    return json(
      await rejectRealLostFoundMatch(
        body.matchId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Possible match could not be rejected.",
      },
      400
    );
  }
}

case "submit-ownership-verification": {
  try {
    return json(
      await submitRealOwnershipVerification(
        body.matchId,
        body.proofAnswer
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Ownership detail could not be submitted.",
      },
      400
    );
  }
}

case "confirm-lost-found-reunion": {
  try {
    return json(
      await confirmRealLostFoundReunion(
        body.matchId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Reunion could not be confirmed.",
      },
      400
    );
  }
}

case "close-lost-found-report": {
  try {
    return json(
      await closeRealLostFoundReport(
        body.reportId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Report could not be closed.",
      },
      400
    );
  }
}

case "send-lost-found-message": {
  try {
    return json(
      await sendRealLostFoundMessage(
        body.threadId,
        body.message
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Private message could not be sent.",
      },
      400
    );
  }
}
case "delete-lost-found-report": {
  try {
    return json(
      await deleteRealClosedLostFoundReport(
        body.reportId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Closed report could not be deleted.",
      },
      400
    );
  }
}
   case "save-rescue-case": {
  try {
    return json(
      await saveRealRescueCase(
        body.rescue || {}
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Rescue case could not be saved.",
      },
      400
    );
  }
}
case "transition-rescue-case": {
  try {
    return json(
      await transitionRealRescueCase(
        body.rescueCaseId,
        body.next,
        body.organizationId || null,
        body.notes || null
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Rescue case could not be updated.",
      },
      400
    );
  }
}
case "accept-rescue-into-care": {
  try {
    return json(
      await acceptRealRescueIntoCare(
        body.rescueCaseId,
        body.organizationId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Rescue case could not be accepted into care.",
      },
      400
    );
  }
}
  case "save-foster-profile": {
  try {
    return json(
      await saveRealFosterProfile(
        body.profile || {}
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Foster profile could not be saved.",
      },
      400
    );
  }
}
   case "calculate-foster-matches": {
  try {
    return json(
      await calculateRealFosterMatches(
        body.rescueCaseId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Foster matches could not be calculated.",
      },
      400
    );
  }
}

case "invite-foster": {
  try {
    return json(
      await inviteRealFoster(
        body.rescueCaseId,
        body.fosterProfileId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Foster invitation could not be sent.",
      },
      400
    );
  }
}

case "respond-foster-invite": {
  try {
    return json(
      await respondRealFosterInvite(
        body.matchId,
        body.response
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Foster invitation could not be updated.",
      },
      400
    );
  }
}

case "offer-foster-help": {
  try {
    return json(
      await offerRealFosterHelp(
        body.rescueCaseId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Foster offer could not be sent.",
      },
      400
    );
  }
}

case "accept-foster-match": {
  try {
    return json(
      await acceptRealFosterMatch(
        body.matchId
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Foster offer could not be accepted.",
      },
      400
    );
  }
}
    case "toggle-saved-pet": {
      try {
        return json(
          await setAccountSavedPet(
            body.petId,
            Boolean(body.saved)
          )
        );
      } catch (error) {
        return json(
          {
            error:
              error instanceof Error
                ? error.message
                : "Saved pets could not be updated.",
          },
          400
        );
      }
    }
case "review-post-adoption-checkin":
  try {
    const {
      data: isAdmin,
    } = await supabase.rpc(
      "is_super_admin"
    );

    if (isAdmin) {
      return json(
        await adminReviewPostAdoptionCheckin(
          body.checkinId,
          body.resolved,
          body.notes
        )
      );
    }

    return json(
      await reviewRealPostAdoptionCheckin(
        body.checkinId,
        body.resolved,
        body.notes
      )
    );

  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Check-in review could not be saved.",
      },
      400
    );
  }

case "request-safe-return":
  try {
    return json(
      await requestRealSafeReturn(
        body.adoptionId,
        body.category,
        body.explanation,
        body.urgentSafetyRisk
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Safe-return request could not be opened.",
      },
      400
    );
  }

case "transition-safe-return":
  try {
    const {
      data: isAdmin,
    } = await supabase.rpc(
      "is_super_admin"
    );

    if (isAdmin) {
      return json(
        await adminTransitionSafeReturn(
          body.returnCaseId,
          body.next,
          body.notes,
          body.scheduledHandoverAt
        )
      );
    }

    return json(
      await transitionRealSafeReturn(
        body.returnCaseId,
        body.next,
        body.notes,
        body.scheduledHandoverAt
      )
    );

  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Safe-return plan could not be updated.",
      },
      400
    );
  }
      case "open-post-adoption-support":
  try {
    return json(
      await openRealPostAdoptionSupport(
        body.adoptionId,
        body.category,
        body.urgency,
        body.summary
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Support request could not be opened.",
      },
      400
    );
  }

case "triage-post-adoption-support":
  try {
    const {
      data: isAdmin,
    } = await supabase.rpc(
      "is_super_admin"
    );

    if (isAdmin) {
      return json(
        await adminTriagePostAdoptionSupport(
          body.supportCaseId,
          body.next,
          body.notes
        )
      );
    }

    return json(
      await triageRealPostAdoptionSupport(
        body.supportCaseId,
        body.next,
        body.notes
      )
    );

  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Support plan could not be updated.",
      },
      400
    );
  }
case "submit-post-adoption-checkin":
  try {
    return json(
      await submitRealPostAdoptionCheckin(
        body.adoptionId,
        body.checkinId,
        body.answers || {},
        body.photoMediaIds || []
      )
    );
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Check-in could not be saved.",
      },
      400
    );
  }
  

case "reserve-promotion": {
  return json({
    status: "CONFIRMED",
    benefitType: String(body.benefitType || ""),
    subjectId: String(body.subjectId || ""),
    reservationId: id("promo_res"),
    demoFallback: true,
  });
}

case "request-refund": {
  const payment = runtimeAdmin.payments?.find((row) => String(row.id) === String(body.orderId));
  if (payment) {
    payment.status = "REFUND_REQUESTED";
    payment.refundReason = String(body.reason || "");
  }
  return json({ status: "REFUND_REQUESTED", orderId: body.orderId, demoFallback: true });
}

case "save-journey-event": {
  const event = {
    id: id("journey"),
    applicationId: String(body.applicationId || ""),
    type: String(body.eventType || "UPDATE"),
    status: "COMPLETED",
    createdAt: now(),
    contextJson: JSON.stringify(body.data || {}),
  };
  runtimeJourneyEvents.unshift(event);
  return json({ event, demoFallback: true });
}

case "submit-directory-feedback": {
  const feedback = {
    id: id("directory_feedback"),
    directoryId: String(body.directoryId || ""),
    feedbackType: String(body.feedbackType || "CORRECTION"),
    details: String(body.details || ""),
    status: "PENDING_REVIEW",
    createdAt: now(),
  };
  runtimeDirectoryFeedback.unshift(feedback);
  return json({ feedback, demoFallback: true });
}

case "submit-moderation-appeal": {
  const appeal = {
    id: id("appeal"),
    moderationCaseId: String(body.caseId || ""),
    status: "SUBMITTED",
    statement: String(body.statement || ""),
    evidenceMediaIds: Array.isArray(body.evidenceMediaIds) ? body.evidenceMediaIds : [],
    createdAt: now(),
    updatedAt: now(),
  };
  runtimeTrustSafety.appeals = runtimeTrustSafety.appeals || [];
  runtimeTrustSafety.moderationAppeals = runtimeTrustSafety.moderationAppeals || runtimeTrustSafety.appeals;
  runtimeTrustSafety.appeals.unshift(appeal);
  if (runtimeTrustSafety.moderationAppeals !== runtimeTrustSafety.appeals) runtimeTrustSafety.moderationAppeals.unshift(clone(appeal));
  return json({ appeal, demoFallback: true });
}

case "accept-found-into-care": {
  const report = runtimeLostFound.reports?.find((row) => String(row.id) === String(body.reportId));
  if (!report) return json({ error: "Found report could not be located." }, 404);
  const crmAnimalId = id("crm");
  report.crmAnimalId = crmAnimalId;
  report.organizationId = String(body.organizationId || "");
  report.currentSafeStatus = "WITH_ORGANIZATION";
  return json({ reportId: report.id, crmAnimalId, status: report.status, demoFallback: true });
}

case "crm-intake": {
  const intake = body.intake || {};
  const crmAnimalId = id("crm");
  const animal = {
    id: crmAnimalId,
    name: String(intake.name || intake.petName || "New intake"),
    species: String(intake.species || "Dog"),
    source: String(intake.source || "Organization intake"),
    intakeDate: String(intake.intakeDate || new Date().toISOString().slice(0, 10)),
    locationCode: String(intake.locationCode || "Unassigned"),
    capacityType: String(intake.capacityType || "KENNEL"),
    condition: String(intake.condition || "Assessment pending"),
    lostFoundReport: null,
    events: [{ id: id("crm_ev"), type: "INTAKE", createdAt: now(), completedAt: now(), data: { title: "Animal intake", notes: String(intake.notes || "Intake recorded") } }],
  };
  if (!runtimeCrm) crmPayload();
  runtimeCrm.animals.unshift(animal);
  return json({ crmAnimalId, animal: clone(animal), demoFallback: true });
}

case "crm-add-event": {
  if (!runtimeCrm) crmPayload();
  const animal = runtimeCrm.animals.find((row) => String(row.id) === String(body.crmAnimalId));
  if (!animal) return json({ error: "CRM animal could not be located." }, 404);
  const event = {
    id: id("crm_ev"),
    type: String(body.type || "CARE"),
    createdAt: now(),
    dueAt: body.dueAt || null,
    completedAt: body.completed ? now() : null,
    data: clone(body.data || {}),
  };
  animal.events = animal.events || [];
  animal.events.unshift(event);
  return json({ event, demoFallback: true });
}

case "crm-complete-event": {
  if (!runtimeCrm) crmPayload();
  let found = null;
  for (const animal of runtimeCrm.animals) {
    const event = (animal.events || []).find((row) => String(row.id) === String(body.eventId));
    if (event) { found = event; break; }
  }
  if (!found) return json({ error: "CRM event could not be located." }, 404);
  found.completedAt = now();
  return json({ event: clone(found), demoFallback: true });
}

case "create-found-report-from-crm": {
  if (!runtimeCrm) crmPayload();
  const animal = runtimeCrm.animals.find((row) => String(row.id) === String(body.crmAnimalId));
  if (!animal) return json({ error: "CRM animal could not be located." }, 404);
  const reportId = id("lf_found");
  const publicReference = `AV-LF-${Math.floor(1000 + Math.random() * 8999)}`;
  const report = {
    id: reportId, publicReference, type: "FOUND", petName: animal.name || "Unknown", species: animal.species || "Dog",
    breedType: "Unknown", colours: [], sex: "Unknown", size: "Unknown", eventDate: new Date().toISOString().slice(0, 10),
    city: "Indore", localityApprox: String(body.localityApprox || ""), publicDescription: String(body.publicDescription || ""),
    currentSafeStatus: "WITH_ORGANIZATION", status: "REPORTED", riskScore: 10, crmAnimalId: animal.id, organizationId: String(body.organizationId || ""),
  };
  runtimeLostFound.reports.unshift(report);
  animal.lostFoundReport = { id: reportId, publicReference };
  return json({ reportId, publicReference, report: clone(report), demoFallback: true });
}

case "create-organization": {
  const org = {
    id: id("org"),
    verificationStatus: "LISTED",
    ...clone(body.organization || {}),
  };
  runtimeAdmin.organizations = runtimeAdmin.organizations || [];
  runtimeAdmin.organizations.unshift(org);
  return json({ organization: clone(org), demoFallback: true });
}

case "assign-organization-role": {
  return json({
    assignment: {
      id: id("org_role"),
      organizationId: String(body.organizationId || ""),
      userEmail: String(body.userEmail || body.email || ""),
      role: String(body.role || "ORGANIZATION_STAFF"),
      status: "ACTIVE",
    },
    demoFallback: true,
  });
}

case "admin-update-organization": {
  const org = runtimeAdmin.organizations?.find((row) => String(row.id) === String(body.organizationId));
  if (org) org.verificationStatus = String(body.verificationStatus || org.verificationStatus);
  return json({ organization: clone(org || {}), demoFallback: true });
}

case "admin-update-lost-found": {
  const report = runtimeAdmin.lostFoundReports?.find((row) => String(row.id) === String(body.reportId));
  if (report) report.status = String(body.status || report.status);
  const networkReport = runtimeLostFound.reports?.find((row) => String(row.id) === String(body.reportId));
  if (networkReport) networkReport.status = String(body.status || networkReport.status);
  return json({ report: clone(report || networkReport || {}), demoFallback: true });
}

case "admin-update-foster": {
  const profile = runtimeAdmin.fosterProfiles?.find((row) => String(row.id) === String(body.fosterProfileId));
  if (profile) profile.verificationStatus = String(body.verificationStatus || profile.verificationStatus);
  return json({ profile: clone(profile || {}), demoFallback: true });
}

case "admin-save-commerce-settings": {
  runtimeAdmin.commerceSettings = { ...runtimeAdmin.commerceSettings, ...clone(body.settings || {}) };
  return json({ settings: clone(runtimeAdmin.commerceSettings), demoFallback: true });
}

case "admin-process-refund": {
  const payment = runtimeAdmin.payments?.find((row) => String(row.id) === String(body.orderId));
  if (!payment) return json({ error: "Payment could not be located." }, 404);
  payment.providerRefundId = payment.providerRefundId || id("demo_refund");
  payment.status = "REFUND_REQUESTED";
  return json({ orderId: payment.id, providerRefundId: payment.providerRefundId, status: payment.status, demoFallback: true });
}

case "admin-process-notification-queue": {
  let processed = 0;
  const limit = Math.max(1, Math.min(100, Number(body.limit || 50)));
  for (const row of runtimeAdmin.notifications || []) {
    if (processed >= limit) break;
    if (["QUEUED", "FAILED"].includes(String(row.status))) {
      row.status = "DELIVERED";
      row.attemptCount = Number(row.attemptCount || 0) + 1;
      row.providerMessageId = row.providerMessageId || id("demo_delivery");
      row.lastError = null;
      processed += 1;
    }
  }
  return json({ processed, demoFallback: true });
}

case "admin-retry-notification": {
  const row = runtimeAdmin.notifications?.find((item) => String(item.id) === String(body.notificationId));
  if (row) {
    row.status = "QUEUED";
    row.attemptCount = Number(row.attemptCount || 0) + 1;
    row.nextAttemptAt = now();
    row.lastError = null;
  }
  return json({ notification: clone(row || {}), demoFallback: true });
}

case "admin-save-promotion": {
  const incoming = clone(body.promotion || {});
  const match = (runtimeAdmin.promotions || []).find((row) => String(row.id) === String(incoming.id) || (incoming.code && String(row.code) === String(incoming.code)));
  if (match) Object.assign(match, incoming);
  else {
    runtimeAdmin.promotions = runtimeAdmin.promotions || [];
    runtimeAdmin.promotions.unshift({ id: id("promo"), confirmedCount: 0, ...incoming });
  }
  return json({ promotion: clone(match || runtimeAdmin.promotions[0]), demoFallback: true });
}

case "admin-save-matching-rules": {
  const weights = clone(body.weights || {});
  const total = Object.values(weights).reduce((sum, value) => sum + Number(value || 0), 0);
  if (Math.round(total) !== 100) return json({ error: `Matching weights must total 100. Current total: ${total}.` }, 400);
  const latestVersion = Math.max(0, ...(runtimeAdmin.matchingRules || []).map((row) => Number(row.version || 0)));
  const row = { id: id("matching_rules"), version: latestVersion + 1, active: true, weightsJson: JSON.stringify(weights), createdAt: now() };
  runtimeAdmin.matchingRules = (runtimeAdmin.matchingRules || []).map((item) => ({ ...item, active: false }));
  runtimeAdmin.matchingRules.unshift(row);
  return json({ rules: clone(row), demoFallback: true });
}

case "moderation-apply-action": {
  const caseId = String(body.caseId || "");
  const row = runtimeAdmin.moderation?.find((item) => String(item.id) === caseId);
  const status = String(body.action || body.next || "ACTIONED") === "DISMISS" ? "CLOSED" : "ACTIONED";
  if (row) {
    row.status = status;
    row.resolution = String(body.reason || "Moderation action recorded.");
    row.actions = row.actions || [];
    row.actions.unshift({ id: id("mod_action"), action: String(body.actionType || body.action || "REVIEW_ACTION"), reason: row.resolution, createdAt: now() });
  }
  return json({ status, caseId, demoFallback: true });
}

case "admin-decide-appeal": {
  const appeal = runtimeAdmin.moderationAppeals?.find((row) => String(row.id) === String(body.appealId));
  if (appeal) {
    appeal.status = String(body.decision || "DECIDED");
    appeal.resolution = String(body.resolution || "");
    appeal.updatedAt = now();
  }
  return json({ appeal: clone(appeal || {}), demoFallback: true });
}

case "add-directory-entry": {
  const entry = { id: id("directory"), verificationStatus: "LISTED", lastVerifiedAt: now(), ...clone(body.entry || {}) };
  runtimeAdmin.directory = runtimeAdmin.directory || [];
  runtimeAdmin.directory.unshift(entry);
  return json({ entry: clone(entry), demoFallback: true });
}

  default:
  return json(
    {
      error:
        "This action is not connected to a verified backend yet.",
    },
    501
  );
  }
}


async function platformPostFallback(body = {}, failedResponse = null) {
  const action = String(body.action || "");
  if (failedResponse) {
    console.warn(`Backend action ${action} unavailable; using UI fallback (${failedResponse.status}).`);
  }

  switch (action) {
    case "admin-update-pet": {
      const row = runtimeAdmin.pets?.find((item) => String(item.id) === String(body.petId));
      if (row) row.state = String(body.state || row.state);
      return json({ pet: clone(row || {}), demoFallback: true });
    }
    case "admin-review-verification": {
      const row = runtimeAdmin.verificationRequests?.find((item) => String(item.id) === String(body.requestId));
      if (row) {
        row.status = String(body.decision || row.status);
        row.reviewerNotes = String(body.notes || "");
        row.approvedScope = String(body.approvedScope || "");
      }
      return json({ request: clone(row || {}), demoFallback: true });
    }
    case "admin-update-payment": {
      const row = runtimeAdmin.payments?.find((item) => String(item.id) === String(body.orderId));
      if (row) row.status = String(body.status || row.status);
      return json({ payment: clone(row || {}), demoFallback: true });
    }
    case "set-account-purpose":
      return json({ roles: Array.isArray(body.roles) ? body.roles.map((role) => ({ role: String(role) })) : [], demoFallback: true });

    case "save-notification-preferences": {
      runtimeCommunicationSettings.preferences = {
        ...runtimeCommunicationSettings.preferences,
        ...clone(body.preferences || {}),
      };
      return json({ ...clone(runtimeCommunicationSettings), demoFallback: true });
    }

    case "submit-verification-request": {
      const request = {
        id: id("verify"),
        targetType: String(body.targetType || "USER"),
        targetId: String(body.targetId || "demo_user"),
        verificationType: String(body.verificationType || "IDENTITY"),
        requestedScope: String(body.requestedScope || ""),
        evidenceMediaIds: Array.isArray(body.evidenceMediaIds) ? body.evidenceMediaIds : [],
        evidenceCount: Array.isArray(body.evidenceMediaIds) ? body.evidenceMediaIds.length : 0,
        status: "UNDER_REVIEW",
        createdAt: now(),
        submittedAt: now(),
      };
      runtimeTrustSafety.verificationRequests = runtimeTrustSafety.verificationRequests || [];
      runtimeTrustSafety.verificationRequests.unshift(request);
      return json({ request: clone(request), demoFallback: true });
    }

    case "submit-safety-report": {
      const report = {
        id: id("safety"),
        subjectType: String(body.subjectType || "PET"),
        subjectId: String(body.subjectId || ""),
        category: String(body.category || "OTHER"),
        summary: String(body.summary || ""),
        evidenceMediaIds: Array.isArray(body.evidenceMediaIds) ? body.evidenceMediaIds : [],
        status: "UNDER_REVIEW",
        createdAt: now(),
      };
      runtimeTrustSafety.safetyReports = runtimeTrustSafety.safetyReports || [];
      runtimeTrustSafety.safetyReports.unshift(report);
      return json({ report: clone(report), demoFallback: true });
    }

    case "save-adopter-profile":
      return json({ profile: { id: "adopter_demo", ...clone(body.profile || {}) }, demoFallback: true });

    case "calculate-matches":
      return json({ matches: clone(demoMatches), evaluatedCount: publicPets.length, excludedCount: Math.max(0, publicPets.length - demoMatches.length), demoFallback: true });

    case "calculate-pet-match":
      return json({ ...(await compatibility(String(body.petId || publicPets[0]?.id || ""))), demoFallback: true });

    case "save-pet": {
      const pet = { id: String(body.pet?.id || id("pet_draft")), state: "DRAFT", completeness: 60, ...clone(body.pet || {}) };
      return json({ pet, petId: pet.id, demoFallback: true });
    }

    case "create-application": {
      const application = { id: id("app"), matchId: String(body.matchId || ""), status: "SUBMITTED", adopterInterested: true, custodianInterested: false, version: 1, updatedAt: now() };
      return json({ application, demoFallback: true });
    }

    case "confirm-mutual-interest":
      return json({ applicationId: String(body.applicationId || ""), status: "MUTUAL_INTEREST", demoFallback: true });

    case "transition-application":
      return json({ applicationId: String(body.applicationId || ""), status: String(body.next || "UPDATED"), demoFallback: true });

    case "send-message":
      return json({ message: { id: id("msg"), threadId: String(body.threadId || ""), body: String(body.message || ""), senderName: "You", createdAt: now() }, demoFallback: true });

    case "request-phone-otp":
      return json({ alreadyVerified: true, phone: String(body.phone || runtimeCommunicationSettings.contact?.phone || ""), providerReady: false, demoFallback: true });

    case "verify-phone-otp":
      return json({ verified: true, phone: String(runtimeCommunicationSettings.contact?.phone || "+91 98765 43210"), providerReady: false, demoFallback: true });

    case "send-test-notification":
      return json({ accepted: false, providerReady: false, channel: String(body.channel || "IN_APP"), reason: "External notification provider is not configured yet.", demoFallback: true });

    case "save-lost-found-report": {
      const input = clone(body.report || {});
      const report = {
        id: String(input.id || id("lf")),
        publicReference: input.publicReference || `AV-LF-${Math.floor(1000 + Math.random() * 8999)}`,
        status: input.status || "REPORTED",
        riskScore: Number(input.riskScore || 10),
        ...input,
      };
      runtimeLostFound.reports = runtimeLostFound.reports || [];
      const index = runtimeLostFound.reports.findIndex((item) => String(item.id) === String(report.id));
      if (index >= 0) runtimeLostFound.reports[index] = report;
      else runtimeLostFound.reports.unshift(report);
      return json({ report, reportId: report.id, publicReference: report.publicReference, demoFallback: true });
    }

    case "calculate-lost-found-matches":
      return json({ matches: clone(runtimeLostFound.matches || []), demoFallback: true });

    case "express-lost-found-interest": {
      const match = runtimeLostFound.matches?.find((item) => String(item.id) === String(body.matchId));
      if (match) match.lostReporterInterested = true;
      return json({ match: clone(match || {}), demoFallback: true });
    }

    case "mark-lost-found-false-match": {
      const match = runtimeLostFound.matches?.find((item) => String(item.id) === String(body.matchId));
      if (match) match.status = "REJECTED";
      return json({ match: clone(match || {}), demoFallback: true });
    }

    case "submit-ownership-verification": {
      const match = runtimeLostFound.matches?.find((item) => String(item.id) === String(body.matchId));
      if (match) match.status = "VERIFICATION";
      return json({ match: clone(match || {}), demoFallback: true });
    }

    case "confirm-lost-found-reunion": {
      const match = runtimeLostFound.matches?.find((item) => String(item.id) === String(body.matchId));
      if (match) match.status = "REUNITED";
      return json({ match: clone(match || {}), status: "REUNITED", demoFallback: true });
    }

    case "close-lost-found-report": {
      const report = runtimeLostFound.reports?.find((item) => String(item.id) === String(body.reportId));
      if (report) report.status = String(body.next || "CLOSED");
      return json({ report: clone(report || {}), demoFallback: true });
    }

    case "send-lost-found-message":
      return json({ message: { id: id("lf_msg"), body: String(body.message || ""), createdAt: now() }, demoFallback: true });

    case "delete-lost-found-report": {
      runtimeLostFound.reports = (runtimeLostFound.reports || []).filter((item) => String(item.id) !== String(body.reportId));
      return json({ deleted: true, reportId: String(body.reportId || ""), demoFallback: true });
    }

    case "save-rescue-case": {
      const input = clone(body.rescue || {});
      const rescue = { id: String(input.id || id("rescue")), publicReference: input.publicReference || `AV-RS-${Math.floor(100 + Math.random() * 899)}`, status: input.status || "REPORTED", riskScore: Number(input.riskScore || 20), createdAt: now(), ...input };
      runtimeRescue.cases = runtimeRescue.cases || [];
      runtimeRescue.cases.unshift(rescue);
      return json({ rescue, rescueCaseId: rescue.id, publicReference: rescue.publicReference, demoFallback: true });
    }

    case "transition-rescue-case": {
      const rescue = runtimeRescue.cases?.find((item) => String(item.id) === String(body.rescueCaseId));
      if (rescue) { rescue.status = String(body.next || rescue.status); rescue.organizationId = body.organizationId || rescue.organizationId; }
      return json({ rescue: clone(rescue || {}), demoFallback: true });
    }

    case "accept-rescue-into-care": {
      const rescue = runtimeRescue.cases?.find((item) => String(item.id) === String(body.rescueCaseId));
      if (rescue) { rescue.status = "IN_CARE"; rescue.organizationId = String(body.organizationId || ""); }
      return json({ rescue: clone(rescue || {}), demoFallback: true });
    }

    case "save-foster-profile": {
      runtimeFoster.profile = { ...runtimeFoster.profile, ...clone(body.profile || {}), id: runtimeFoster.profile?.id || id("foster") };
      return json({ profile: clone(runtimeFoster.profile), demoFallback: true });
    }

    case "calculate-foster-matches":
      return json({ matches: clone(runtimeFoster.matches || []), demoFallback: true });

    case "invite-foster": {
      const invitation = { id: id("foster_invite"), rescueCaseId: String(body.rescueCaseId || ""), fosterProfileId: String(body.fosterProfileId || ""), status: "PENDING", createdAt: now() };
      runtimeFoster.invitations = runtimeFoster.invitations || [];
      runtimeFoster.invitations.unshift(invitation);
      return json({ invitation, demoFallback: true });
    }

    case "respond-foster-invite": {
      const invitation = runtimeFoster.invitations?.find((item) => String(item.id) === String(body.matchId));
      if (invitation) invitation.status = String(body.response || "ACCEPTED");
      return json({ invitation: clone(invitation || {}), demoFallback: true });
    }

    case "offer-foster-help":
      return json({ offer: { id: id("foster_offer"), rescueCaseId: String(body.rescueCaseId || ""), status: "OFFERED", createdAt: now() }, demoFallback: true });

    case "accept-foster-match": {
      const match = runtimeFoster.matches?.find((item) => String(item.id) === String(body.matchId));
      if (match) match.status = "ACCEPTED";
      return json({ match: clone(match || {}), demoFallback: true });
    }

    case "toggle-saved-pet":
      return json({ petId: String(body.petId || ""), saved: Boolean(body.saved), demoFallback: true });

    case "review-post-adoption-checkin": {
      for (const adoption of runtimePostAdoption.adoptions || []) {
        const checkin = (adoption.checkins || []).find((item) => String(item.id) === String(body.checkinId));
        if (checkin) { checkin.status = body.resolved ? "RESOLVED" : "REVIEW_NEEDED"; checkin.reviewerNotes = String(body.notes || ""); return json({ checkin: clone(checkin), demoFallback: true }); }
      }
      return json({ checkinId: String(body.checkinId || ""), status: body.resolved ? "RESOLVED" : "REVIEW_NEEDED", demoFallback: true });
    }

    case "request-safe-return": {
      const adoption = (runtimePostAdoption.adoptions || []).find((item) => String(item.id) === String(body.adoptionId)) || runtimePostAdoption.adoptions?.[0];
      const returnCase = { id: id("return"), adoptionId: String(body.adoptionId || adoption?.id || ""), category: String(body.category || "OTHER"), explanation: String(body.explanation || ""), urgentSafetyRisk: Boolean(body.urgentSafetyRisk), status: "REQUESTED", createdAt: now() };
      if (adoption) { adoption.returnCases = adoption.returnCases || []; adoption.returnCases.unshift(returnCase); }
      return json({ returnCase, demoFallback: true });
    }

    case "transition-safe-return": {
      for (const adoption of runtimePostAdoption.adoptions || []) {
        const item = (adoption.returnCases || []).find((row) => String(row.id) === String(body.returnCaseId));
        if (item) { item.status = String(body.next || item.status); item.resolutionNotes = String(body.notes || ""); item.scheduledHandoverAt = body.scheduledHandoverAt || item.scheduledHandoverAt; return json({ returnCase: clone(item), demoFallback: true }); }
      }
      return json({ returnCaseId: String(body.returnCaseId || ""), status: String(body.next || "UPDATED"), demoFallback: true });
    }

    case "open-post-adoption-support": {
      const adoption = (runtimePostAdoption.adoptions || []).find((item) => String(item.id) === String(body.adoptionId)) || runtimePostAdoption.adoptions?.[0];
      const supportCase = { id: id("support"), adoptionId: String(body.adoptionId || adoption?.id || ""), category: String(body.category || "OTHER"), urgency: String(body.urgency || "ROUTINE"), summary: String(body.summary || ""), status: "OPEN", createdAt: now() };
      if (adoption) { adoption.supportCases = adoption.supportCases || []; adoption.supportCases.unshift(supportCase); }
      return json({ supportCase, demoFallback: true });
    }

    case "triage-post-adoption-support": {
      for (const adoption of runtimePostAdoption.adoptions || []) {
        const item = (adoption.supportCases || []).find((row) => String(row.id) === String(body.supportCaseId));
        if (item) { item.status = String(body.next || item.status); item.triageNotes = String(body.notes || ""); return json({ supportCase: clone(item), demoFallback: true }); }
      }
      return json({ supportCaseId: String(body.supportCaseId || ""), status: String(body.next || "UPDATED"), demoFallback: true });
    }

    case "submit-post-adoption-checkin": {
      for (const adoption of runtimePostAdoption.adoptions || []) {
        const checkin = (adoption.checkins || []).find((item) => String(item.id) === String(body.checkinId));
        if (checkin) { checkin.status = "SUBMITTED"; checkin.submittedAt = now(); checkin.answers = clone(body.answers || {}); checkin.photoMediaIds = clone(body.photoMediaIds || []); return json({ checkin: clone(checkin), demoFallback: true }); }
      }
      return json({ checkinId: String(body.checkinId || ""), status: "SUBMITTED", demoFallback: true });
    }

    default:
      return failedResponse || json({ error: "Action is unavailable." }, 501);
  }
}

async function platformPost(body = {}) {
  const response = await platformPostReal(body);
  if (response.ok) return response;
  return platformPostFallback(body, response);
}

function databaseApi(url) {
  const action = url.searchParams.get("action") || "stats";
  if (action === "stats") {
    const stats = Object.entries(databaseTables).map(([table, rows]) => ({ table, rows: rows.length }));
    return json({ stats, totalRows: stats.reduce((sum, item) => sum + item.rows, 0), totalTables: stats.length });
  }
  const table = url.searchParams.get("table") || Object.keys(databaseTables)[0];
  const rows = databaseTables[table] || [];
  if (action === "export") return new Response(JSON.stringify(rows, null, 2), { headers: { "content-type": "application/json" } });
  const search = (url.searchParams.get("search") || "").toLowerCase();
  const limit = Number(url.searchParams.get("limit") || 50);
  const offset = Number(url.searchParams.get("offset") || 0);
  const filtered = search ? rows.filter((row) => JSON.stringify(row).toLowerCase().includes(search)) : rows;
  return json({ rows: filtered.slice(offset, offset + limit), totalCount: filtered.length });
}

async function healthApi() {
  const [authResult, databaseResult, storageResult] = await Promise.allSettled([
    supabase.auth.getSession(),
    supabase.from("pets").select("id", { count: "exact", head: true }),
    supabase.storage.from("pet-media").list("", { limit: 1 }),
  ]);

  const authReady = authResult.status === "fulfilled" && !authResult.value.error;
  const databaseReady = databaseResult.status === "fulfilled" && !databaseResult.value.error;
  const storageReady = storageResult.status === "fulfilled" && !storageResult.value.error;

  return json({
    ok: authReady && databaseReady && storageReady,
    checks: {
      database: databaseReady,
      storage: storageReady,
      authentication: authReady,
      providers: {
        email: true,
        whatsapp: false,
        sms: false,
        phoneOtp: false,
        razorpay: false,
      },
    },
  });
}

export function installMockApi() {
  if (window.__adoptvillaMockApiInstalled) return;
  window.__adoptvillaMockApiInstalled = true;
  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const target = typeof input === "string" ? input : input?.url || String(input);
    const url = new URL(target, window.location.origin);
    if (url.origin !== window.location.origin) return nativeFetch(input, init);
    if (url.pathname === "/api/catalog") return catalog(url);
    if (url.pathname === "/api/directory") return json({ records: indoreDirectory });
   if (url.pathname === "/api/health") return healthApi();
   if (
  url.pathname === "/api/database"
) {
  return databaseApi(url);
}
   if (url.pathname === "/api/media") {
  if (
    (init.method || "GET").toUpperCase() ===
    "POST"
  ) {
    try {
      const formData = init.body;

      const purpose =
        formData instanceof FormData
          ? String(
              formData.get("purpose") || ""
            )
          : "";
          if (
  purpose ===
  "PRIVATE_TRUST_EVIDENCE"
) {
  const media =
    await uploadPrivateTrustEvidence(
      formData
    );

  return json({
    id: media.id,
    status: "READY",
  });
}
if (purpose === "PRIVATE_POST_ADOPTION") {
  const media =
    await uploadPrivatePostAdoptionPhoto(
      formData
    );

  return json({
    id: media.id,
    status: "READY",
  });
}
      if (purpose === "PUBLIC_WELFARE") {
        const media =
          await uploadPublicWelfarePhoto(
            formData
          );

        return json({
          id: media.id,
          url: media.url,
          status: "READY",
        });
      }

      const media =
        await uploadPetDraftMedia(
          formData
        );

      return json({
        id: media.id,
        status: "READY",
      });
    } catch (error) {
      console.warn("Media backend unavailable; using preview fallback.", error instanceof Error ? error.message : error);
      return json({
        id: id("demo_media"),
        url: "/og.png",
        status: "READY",
        demoFallback: true,
      });
    }
  }

  const mediaId =
  url.searchParams.get(
    "mediaId"
  );

if (
  mediaId &&
  (
    mediaId.includes(
      "/trust-evidence/"
    ) ||
    mediaId.includes(
      "/post-adoption/"
    )
  )
) {
  try {
    const signedUrl =
      await createAdminPrivateDocumentUrl(
        mediaId
      );

    return nativeFetch(
      signedUrl
    );
  } catch {
    return nativeFetch(
      "/og.png"
    );
  }
}

return nativeFetch("/og.png");
}
    if (url.pathname === "/api/platform") {
      if ((init.method || "GET").toUpperCase() === "POST") {
        let body = {};
        try { body = JSON.parse(init.body || "{}"); } catch { body = {}; }
        return platformPost(body);
      }
      return await platformGet(url);
    }
    return nativeFetch(input, init);
  };
}
