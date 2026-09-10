const images = { dog: "/pets/dog.jpg", cat: "https://images.unsplash.com/photo-1555025093-6929dde6e070?auto=format&fit=crop&w=1200&q=82" };
const dogImages = {
  Bruno: "https://images.unsplash.com/photo-1593991910463-03658d3de800?auto=format&fit=crop&w=1200&q=82",
  Tara: "https://images.unsplash.com/photo-1558788353-f76d92427f16?auto=format&fit=crop&w=1200&q=82",
  Sultan: "https://images.unsplash.com/photo-1572260606466-c6c87046f892?auto=format&fit=crop&w=1200&q=82",
  Milo: "https://images.unsplash.com/photo-1762862168936-18bf9039b164?auto=format&fit=crop&w=1200&q=82",
  Luna: "https://images.unsplash.com/photo-1571085101460-051e238e0b7e?auto=format&fit=crop&w=1200&q=82",
  Sheru: "https://images.unsplash.com/photo-1543523195-e0613799d7ad?auto=format&fit=crop&w=1200&q=82",
  Gauri: "https://images.unsplash.com/photo-1581562444313-98be7b621dc2?auto=format&fit=crop&w=1200&q=82",
  Maya: "https://images.unsplash.com/photo-1564858660258-b1830fa4d677?auto=format&fit=crop&w=1200&q=82",
};

const petSeeds = [
  ["Bruno", "Dog", "Indie", "2 years", "Male", "Indore", "Vijay Nagar area", "Moderate", "Medium"],
  ["Mishti", "Cat", "Domestic shorthair", "1 year", "Female", "Pune", "Kothrud area", "Low", "Small"],
  ["Tara", "Dog", "Labrador mix", "3 years", "Female", "Bengaluru", "Indiranagar area", "Moderate", "Large"],
  ["Sultan", "Dog", "German Shepherd mix", "4 years", "Male", "Delhi NCR", "Noida area", "High", "Large"],
  ["Milo", "Dog", "Beagle mix", "18 months", "Male", "Mumbai", "Andheri area", "High", "Medium"],
  ["Coco", "Cat", "Domestic shorthair", "2 years", "Female", "Indore", "Palasia area", "Low", "Small"],
  ["Luna", "Dog", "Indian Spitz mix", "10 months", "Female", "Pune", "Baner area", "Moderate", "Small"],
  ["Sheru", "Dog", "Indie", "5 years", "Male", "Indore", "Scheme 54 area", "Low", "Medium"],
  ["Simba", "Cat", "Domestic shorthair", "8 months", "Male", "Bengaluru", "HSR area", "Moderate", "Small"],
  ["Gauri", "Dog", "Indie", "2 years", "Female", "Delhi NCR", "Gurugram area", "Moderate", "Medium"],
  ["Pixel", "Cat", "Domestic shorthair", "3 years", "Male", "Mumbai", "Powai area", "Low", "Small"],
  ["Maya", "Dog", "Labrador mix", "2 years", "Female", "Indore", "Bicholi area", "High", "Large"],
];

export const publicPets = petSeeds.map((seed, index) => {
  const [name, species, breed, age, sex, city, localityApprox, energy, size] = seed;
  const demo = index > 2;
  const high = energy === "High";
  const cat = species === "Cat";
  return {
    id: demo ? `demo_pet_${String(index + 1).padStart(3, "0")}` : `pet_${name.toLowerCase()}`,
    name,
    type: species,
    species,
    breed,
    age,
    ageMonths: age.includes("months") ? Number(age.split(" ")[0]) : parseInt(age) * 12,
    ageBand: age.includes("months") ? "PUPPY_KITTEN" : parseInt(age) >= 7 ? "SENIOR" : "ADULT",
    sex,
    weightKg: cat ? 4 + (index % 2) : 10 + index * 2,
    size,
    city,
    localityApprox,
    energy,
    image: cat ? images.cat : (dogImages[name] || images.dog),
    media: [],
    tags: [breed, size, index % 3 !== 0 ? "Vaccinated" : "Vaccination review", index % 4 !== 0 ? "Sterilized" : "Sterilization pending", cat ? "Indoor home" : high ? "Active home" : "Apartment suitable"],
    story: demo
      ? "Clearly labelled demonstration record for testing Adoptvilla workflows. This profile shows how an honest adoption listing explains care needs, history and fit without selling an animal."
      : `${name} is currently in responsible foster care while the custodian looks for a stable, suitable long-term home. The profile focuses on the individual animal rather than assumptions based on breed.`,
    consider: high ? `${name} needs a reliable daily exercise and enrichment routine.` : "Review the complete individual care profile before applying.",
    considerations: [
      ...(high ? ["Needs a consistent daily activity plan"] : []),
      ...(index % 5 === 0 ? ["Needs continued leash training"] : []),
      ...(index % 7 === 0 ? ["A calm, patient introduction period is recommended"] : []),
    ],
    goodWith: cat ? ["Indoor living", "Adults and calm older children"] : ["Adults", index % 3 ? "Dogs, after careful introduction" : "Children, subject to the listed age guidance", ...(high ? [] : ["Apartment living"])],
    dailyNeeds: [high ? "90 minutes of daily exercise" : cat ? "30 minutes of active play and enrichment" : "45–60 minutes of daily exercise", "Fresh water, routine feeding and enrichment", "Usually no more than 5 hours alone"],
    medical: {
      vaccinated: index % 3 !== 0,
      rabies: index % 4 !== 0,
      dewormed: true,
      sterilized: index % 4 !== 0,
      conditions: index === 11 ? "Previous skin sensitivity; currently stable" : null,
      medications: null,
      specialCareRequired: index === 11,
    },
    behaviour: {
      energy,
      houseTrained: !cat && index % 4 !== 0,
      leashSkills: cat ? "Not applicable" : high ? "Needs continued practice" : "Comfortable on routine walks",
      aloneTimeNotes: cat ? "Settles well with enrichment" : "Best with a predictable routine and gradual alone-time training",
      childCompatible: index % 3 !== 0,
      dogCompatible: cat ? false : index % 5 !== 0,
      catCompatible: cat || index % 4 !== 0,
      separationDistress: index === 4,
      escapeRisk: index === 3,
    },
    idealHome: {
      apartmentSuitable: !high || size === "Small",
      experiencedHandlerRequired: index === 3 || index === 11,
      maxAloneHours: high ? 4 : 6,
      exerciseMinutes: high ? 90 : cat ? 30 : 60,
      climate: "Warm-weather precautions and indoor shade",
      grooming: cat ? "Weekly" : "Routine",
    },
    origin: index % 4 === 0 ? "Street rescue" : "Owned pet / foster placement",
    rehomingReason: index % 4 === 0 ? "Rescue placement" : "Housing or relocation",
    completeness: 86 + (index % 13),
    publishedAt: "2026-08-20T10:00:00.000Z",
    organization: index % 3 === 0 ? { name: "Hope For Animals", type: "NGO", verificationStatus: "VERIFIED" } : null,
    demo,
    photoPending: false,
  };
});

export const citySummaries = ["Indore", "Pune", "Bengaluru", "Delhi NCR", "Mumbai"].map((name) => ({
  name,
  petCount: publicPets.filter((pet) => pet.city === name).length,
  realPetCount: publicPets.filter((pet) => pet.city === name && !pet.demo).length,
  demoPetCount: publicPets.filter((pet) => pet.city === name && pet.demo).length,
  resourceCount: name === "Indore" ? 4 : 2,
}));

export const promotions = {
  adopter: { code: "FOUNDING100", limit: 100, confirmed: 37, remaining: 63, endsAt: "2026-12-31T23:59:59.000Z" },
  pet: { code: "FOUNDING100", limit: 100, confirmed: 42, remaining: 58, endsAt: "2026-12-31T23:59:59.000Z" },
};

export const indoreDirectory = [
  {
    id: "indore-hope-for-animals", name: "Hope For Animals", category: "NGO & Shelter",
    locality: "Indore district", services: ["Animal rescue", "Shelter", "Adoption camps", "Special-needs care"],
    verificationStatus: "SOURCE_CONFIRMED", website: "https://www.hfaindia.org/", sourceUrl: "https://www.hfaindia.org/",
    sourceLabel: "Official organization website", emergency: false,
    note: "The organization describes rescue, shelter and adoption work. Contact availability must be confirmed directly.",
  },
  {
    id: "indore-tom-animal-welfare", name: "Tom Animal Welfare Society / Jasraj Animal Shelter", category: "NGO & Shelter",
    locality: "Indore", services: ["Animal rescue", "Shelter", "Adoption", "Special-needs care"],
    verificationStatus: "THIRD_PARTY_CONFIRMED", website: "https://www.facebook.com/jasrajanimalsheltertaws",
    sourceUrl: "https://www.spcai.org/our-work/shelter-support-fund/shelter-list/tom-animal-welfare-society",
    sourceLabel: "SPCA International shelter listing", emergency: false,
    note: "Listed by SPCA International as an Indore animal-welfare and shelter organization.",
  },
  {
    id: "indore-wnc", name: "Wildlife & Nature Conservancy Society", category: "Wildlife",
    locality: "Geeta Bhawan, Indore", services: ["Wildlife conservation", "Bird rescue", "Awareness"],
    verificationStatus: "SOURCE_CONFIRMED", website: "https://wncindia.org/", sourceUrl: "https://wncindia.org/",
    sourceLabel: "Official organization website", emergency: false,
    note: "Wildlife-focused organization. It does not represent a general companion-animal rescue dispatch service.",
  },
  {
    id: "indore-animal-husbandry", name: "District Animal Husbandry Department", category: "Government",
    locality: "Indore district", services: ["Government animal-husbandry administration"],
    verificationStatus: "GOVERNMENT_SOURCE", website: "https://indore.mp.gov.in/departments/", sourceUrl: "https://indore.mp.gov.in/departments/",
    sourceLabel: "District Administration Indore", emergency: false,
    note: "Official district department listing. Specific clinical services and hours must be confirmed with the department.",
  },
];

const now = "2026-09-01T05:30:00.000Z";
const nextMonth = "2026-10-01T05:30:00.000Z";

export const organizations = [
  { id: "org_hfa", name: "Hope For Animals", type: "NGO", city: "Indore", verificationStatus: "VERIFIED", registrationNumber: "MP/NGO/2048" },
  { id: "org_shelter", name: "Adoptvilla Partner Shelter", type: "SHELTER", city: "Indore", verificationStatus: "CLAIMED", registrationNumber: "AV/IND/114" },
];

export const dashboardInitial = {
  adopterProfile: {
    id: "adopter_demo", state: "ACTIVE", city: "Indore", stateName: "Madhya Pradesh", pinCode: "452001",
    homeType: "APARTMENT", tenure: "OWNED", landlordPermission: "NOT_APPLICABLE", adultCount: 2,
    householdAgreement: "YES", workMode: "HYBRID", aloneHours: 4, exerciseMinutes: 60, trainingMinutes: 30,
    experienceLevel: "SOME", financialReadiness: "READY", discoverability: "VERIFIED_CUSTODIANS", readinessScore: 88, completeness: 92,
  },
  pets: publicPets.slice(0, 2).map((pet) => ({ id: pet.id, name: pet.name, species: pet.species, city: pet.city, state: "PUBLISHED", completeness: pet.completeness })),
  applications: [{ id: "app_001", status: "MUTUAL_INTEREST", adopterInterested: true, custodianInterested: true, version: 3, updatedAt: now }],
  invitations: [{ id: "inv_001", status: "PENDING", createdAt: now }],
  payments: [{ id: "pay_001", purpose: "ADOPTER_ACTIVATION", amountPaise: 9900, currency: "INR", status: "PAID", invoiceNumber: "AV-2026-001", createdAt: now }],
  notifications: [
    { id: "not_1", type: "APPLICATION_UPDATE", channel: "IN_APP", title: "Your application moved forward", body: "Mutual interest is confirmed. Secure messaging is now available.", status: "DELIVERED", createdAt: now },
    { id: "not_2", type: "CHECKIN_REMINDER", channel: "IN_APP", title: "Day 7 check-in is ready", body: "A short private check-in helps catch support needs early.", status: "DELIVERED", createdAt: now },
  ],
  moderation: [{ id: "case_001", subjectType: "PET", subjectId: publicPets[0].id, priority: "MEDIUM", status: "UNDER_REVIEW", createdAt: now }],
  organizations,
  directory: indoreDirectory.map((record) => ({ ...record, city: "Indore", lastVerifiedAt: now })),
  roles: [
    { role: "ONBOARDING_COMPLETE" }, { role: "ADOPTER" }, { role: "PET_CUSTODIAN" }, { role: "SUPER_ADMIN" }, { role: "MODERATOR" },
    { role: "ORGANIZATION_ADMIN", organizationId: "org_hfa" },
  ],
};

export const demoMatches = publicPets.slice(0, 5).map((pet, index) => ({
  matchId: `match_${index + 1}`, petId: pet.id, petName: pet.name, species: pet.species, city: pet.city,
  score: 94 - index * 4, confidence: index < 2 ? "HIGH" : "MEDIUM",
  reasons: ["Home and routine fit the current care record", "Exercise commitment is compatible", pet.city === "Indore" ? "Same-city introduction is easier" : "Transport can be planned"],
  warnings: index === 3 ? ["Experienced handling is recommended"] : [],
}));

export const workflowApplications = [{
  id: "app_001", applicationId: "app_001", status: "MUTUAL_INTEREST", petName: publicPets[0].name,
  petId: publicPets[0].id, adopterInterested: true, custodianInterested: true, updatedAt: now,
  threadId: "thread_001", nextTransitions: ["MEET_SCHEDULED", "WITHDRAWN"],
  journey: [
    { id: "journey_1", type: "APPLICATION_SUBMITTED", status: "COMPLETED", createdAt: "2026-08-22T10:00:00.000Z", contextJson: JSON.stringify({ note: "Application submitted" }) },
    { id: "journey_2", type: "MUTUAL_INTEREST", status: "COMPLETED", createdAt: "2026-08-24T10:00:00.000Z", contextJson: JSON.stringify({ note: "Both sides confirmed interest" }) },
  ],
}];

export const threadMessages = [
  { id: "msg_1", senderName: "Adoptvilla Demo", senderUserId: "demo_user", body: "Hello, I would love to understand Bruno’s daily routine better.", createdAt: "2026-08-24T11:10:00.000Z" },
  { id: "msg_2", senderName: "Custodian", senderUserId: "custodian", body: "Happy to help. He settles well after a morning walk and enrichment.", createdAt: "2026-08-24T11:15:00.000Z" },
];

export const postAdoptionData = {
  summary: { adoptions: 1, dueCheckins: 1, concernsNeedingReview: 1, openSupportCases: 1, activeReturns: 0 },
  adoptions: [{
    id: "adoption_001", petName: "Bruno", status: "ACTIVE", perspective: "ADOPTER", handoverAt: "2026-08-20T10:00:00.000Z",
    checkins: [
      { id: "checkin_1", milestone: "DAY_1", status: "SUBMITTED", scheduledFor: "2026-08-21T10:00:00.000Z", available: false, due: false, submittedAt: "2026-08-21T12:00:00.000Z", concernScore: 0, concerns: [], photoMediaIds: [] },
      { id: "checkin_7", milestone: "DAY_7", status: "SCHEDULED", scheduledFor: "2026-09-01T10:00:00.000Z", available: true, due: true, concernScore: 0, concerns: [], photoMediaIds: [] },
      { id: "checkin_30", milestone: "DAY_30", status: "SCHEDULED", scheduledFor: "2026-09-20T10:00:00.000Z", available: false, due: false, concernScore: 0, concerns: [], photoMediaIds: [] },
    ],
    supportCases: [{ id: "support_1", category: "BEHAVIOUR", urgency: "ROUTINE", summary: "Need help with settling during short periods alone.", status: "OPEN", createdAt: now }],
    returnCases: [],
  }],
};

export const lostFoundData = {
  summary: { myReports: 2, openLost: 1, openFound: 1, possibleMatches: 1, reunited: 0 },
  reports: [
    { id: "lf_lost_1", publicReference: "AV-LF-1042", type: "LOST", petName: "Moti", species: "Dog", breedType: "Indie", colours: ["Tan", "White"], sex: "Male", size: "Medium", eventDate: "2026-08-31", city: "Indore", localityApprox: "Vijay Nagar", publicDescription: "Tan indie with white chest, red collar.", currentSafeStatus: "UNKNOWN", status: "POSSIBLE_MATCH", riskScore: 20 },
    { id: "lf_found_1", publicReference: "AV-LF-1048", type: "FOUND", petName: "Unknown", species: "Dog", breedType: "Indie", colours: ["Tan", "White"], sex: "Male", size: "Medium", eventDate: "2026-09-01", city: "Indore", localityApprox: "Scheme 54", publicDescription: "Friendly tan dog found wearing a red collar.", currentSafeStatus: "WITH_FINDER", status: "POSSIBLE_MATCH", riskScore: 10 },
  ],
  matches: [{ id: "lf_match_1", lostReportId: "lf_lost_1", foundReportId: "lf_found_1", score: 89, confidence: "HIGH", status: "POSSIBLE", lostReporterInterested: false, foundReporterInterested: true, reasons: ["Same species, colour and size", "Nearby locality and close dates"], warnings: ["Identity must be verified privately before reunion"], hardStops: [] }],
};

export const fosterData = {
  profile: { id: "foster_1", state: "AVAILABLE", city: "Indore", localityApprox: "Vijay Nagar", radiusKm: 10, capacityTotal: 2, capacityAvailable: 1, species: ["Dog", "Cat"], ageBands: ["PUPPY_KITTEN", "ADULT"], careCapabilities: ["ROUTINE_CARE", "MEDICATION"], experienceLevel: "EXPERIENCED", maxDurationDays: 30, verificationStatus: "VERIFIED", completeness: 91 },
  matches: [{ id: "foster_match_1", rescueCaseId: "rescue_1", fosterProfileId: "foster_1", isOwnFosterProfile: true, status: "OFFERED", score: 92, confidence: "HIGH", reasons: ["Same city", "Care capability fits case", "Capacity available"], foster: { anonymousId: "Verified foster · Indore" }, updatedAt: now }],
  invitations: [{ id: "foster_invite_1", rescueCaseId: "rescue_1", status: "PENDING", createdAt: now }],
};

export const rescueData = {
  summary: { myReports: 1, openNearby: 1, critical: 0, fosterOffers: 1 },
  fosterProfile: fosterData.profile,
  matches: fosterData.matches,
  cases: [{ id: "rescue_1", publicReference: "AV-RS-901", species: "Dog", animalCount: 1, ageBand: "ADULT", condition: "Injured but stable after first aid; needs veterinary assessment and temporary care.", urgency: "SOON", city: "Indore", localityApprox: "Palasia", helpNeeds: ["VETERINARY", "TRANSPORT", "FOSTER"], mediaIds: [], safeAccessNotes: "Animal is in a shaded gated area.", status: "TRIAGED", relationship: "REPORTER", riskScore: 45, organization: "Hope For Animals", fosterOffers: 1, createdAt: now }],
};

const verificationBadges = [{
  id: "badge_1", targetType: "USER", targetId: "demo_user", type: "IDENTITY", status: "ACTIVE",
  label: "Identity checked", scope: "Identity details matched the submitted evidence",
  meaning: "A reviewer confirmed the stated identity scope; this is not a guarantee of conduct.",
  verifiedAt: now, issuedAt: now, expiresAt: nextMonth,
}];
const moderationAppeals = [];
const accountRestrictions = [];

export const trustSafetyData = {
  phoneVerification: { verified: true, phone: "+91 98765 43210", meaning: "The account controls this verified Indian mobile number." },
  targets: { user: { id: "demo_user", label: "Your account" }, pets: dashboardInitial.pets.map((pet) => ({ id: pet.id, name: pet.name, label: pet.name })), organizations },
  verificationRequests: [{ id: "verify_1", targetType: "USER", targetId: "demo_user", verificationType: "IDENTITY", status: "UNDER_REVIEW", requestedScope: "Identity and account-holder details", evidenceCount: 2, createdAt: now, submittedAt: now }],
  badges: verificationBadges,
  verificationBadges,
  safetyReports: [{ id: "safety_1", category: "LISTING_ACCURACY", subjectType: "PET", subjectId: publicPets[0].id, status: "UNDER_REVIEW", summary: "Submitted demo report showing the private review workflow.", createdAt: now }],
  moderationCases: [{ id: "mod_1", subjectType: "PET", subjectId: publicPets[0].id, status: "ACTIONED", priority: "MEDIUM", resolution: "Listing temporarily paused while factual information was corrected.", actions: [{ id: "act_1", action: "WARNING", reason: "Correct care information requested", createdAt: now }] }],
  appeals: moderationAppeals,
  moderationAppeals,
  restrictions: accountRestrictions,
  accountRestrictions,
};

export const communicationSettings = {
  contact: { phone: "+91 98765 43210", phoneVerified: true },
  preferences: { emailEnabled: true, whatsappEnabled: true, smsEnabled: false },
  providers: { razorpay: true, phoneOtp: true, whatsapp: true, email: true, sms: true },
};

export const adopterCandidates = Array.from({ length: 12 }, (_, index) => ({
  anonymousId: `Candidate ${String(index + 1).padStart(2, "0")}`,
  demo: true,
  city: ["Indore", "Pune", "Bengaluru", "Mumbai"][index % 4],
  homeType: index % 3 === 0 ? "INDEPENDENT_HOME" : "APARTMENT",
  experienceLevel: ["FIRST_TIME", "SOME", "EXPERIENCED"][index % 3],
  readinessScore: 72 + (index % 24), completeness: 82 + (index % 16),
}));

export const crmData = {
  animals: [{ id: "crm_1", name: "Moti", species: "Dog", organizationId: "org_hfa", organization: "Hope For Animals", status: "IN_CARE", openEvents: 2, overdueEvents: 0, updatedAt: now }],
  events: [{ id: "crm_event_1", crmAnimalId: "crm_1", type: "VET", title: "Vaccination follow-up", dueAt: nextMonth, completedAt: null }],
};

export const paymentDocuments = [{ id: "doc_1", orderId: "pay_001", type: "RECEIPT", documentNumber: "AV-RCP-001", issuedAt: now, data: { totalPaise: 9900, currency: "INR", note: "Demo receipt for the UI-only replica." } }];

export const adminData = {
  stats: { users: 54, adopters: 50, pets: 50, applications: 18, organizations: 4, payments: 12, crmAnimals: 8, rescueCases: 6, fosters: 15, lostFoundReports: 11, reunions: 3, verificationPending: 4, safetyOpen: 2, appealsPending: 1, postAdoptions: 9, postAdoptionReview: 2, activeReturns: 1, returnedAdoptions: 1, paidRevenue: 89100 },
  users: [{ id: "demo_user", fullName: "Adoptvilla Demo", email: "demo@example.invalid", status: "ACTIVE", roles: ["ADOPTER", "PET_CUSTODIAN", "SUPER_ADMIN"] }, { id: "demo_user_2", fullName: "Demo Adopter 002", email: "demo.adopter.002@example.invalid", status: "ACTIVE", roles: ["ADOPTER"] }],
  pets: publicPets.slice(0, 7).map((pet) => ({ id: pet.id, name: pet.name, species: pet.species, city: pet.city, state: "PUBLISHED", completeness: pet.completeness })),
  applications: [{ id: "app_001", status: "MUTUAL_INTEREST", adopterInterested: true, custodianInterested: true, version: 3, updatedAt: now }],
  organizations,
  payments: dashboardInitial.payments,
  moderation: trustSafetyData.moderationCases,
  promotions: [{ id: "promo_1", code: "FOUNDING100", benefitType: "ADOPTER_ACTIVATION", limit: 100, confirmedCount: 37, active: true, startsAt: "2026-01-01T00:00:00.000Z", endsAt: "2026-12-31T23:59:59.000Z" }],
  matchingRules: [{ id: "rules_3", version: 3, active: true, weightsJson: JSON.stringify({ home: 18, schedule: 18, household: 18, exercise: 16, experience: 14, care: 10, distance: 6 }), createdAt: now }],
  directory: indoreDirectory.map((record) => ({ ...record, city: "Indore", lastVerifiedAt: now })),
  audits: [{ id: "audit_1", createdAt: now, actorUserId: "demo_admin", action: "PET_REVIEW", subjectType: "PET", subjectId: publicPets[0].id, reason: "Demo audit trail" }],
  crmAnimals: crmData.animals,
  rescueCases: rescueData.cases,
  fosterProfiles: [{ id: "foster_1", city: "Indore", state: "AVAILABLE", capacityAvailable: 1, experienceLevel: "EXPERIENCED", completeness: 91, verificationStatus: "VERIFIED", activeMatches: 1 }],
  lostFoundReports: lostFoundData.reports.map((report) => ({ ...report, possibleMatches: 1, mutualMatches: 0, crmAnimalId: null })),
  lostFoundMatches: lostFoundData.matches.map((match) => ({ ...match, updatedAt: now })),
  notifications: dashboardInitial.notifications,
  otpChallenges: [{ id: "otp_1", userId: "demo_user", provider: "PHONE_OTP", status: "VERIFIED", sendCount: 1, verifyAttempts: 1, expiresAt: now, verifiedAt: now, lastError: null, createdAt: now, updatedAt: now }],
  paymentDocuments,
  commerceSettings: { id: "default", adopterFeePaise: 9900, petListingFeePaise: 9900, organizationSubscriptionFeePaise: 0, taxRateBps: 0, invoicePrefix: "AV" },
  verificationRequests: trustSafetyData.verificationRequests,
  verificationBadges: trustSafetyData.verificationBadges,
  safetyReports: trustSafetyData.safetyReports,
  fraudSignals: [{ id: "signal_1", moderationCaseId: "mod_1", code: "DUPLICATE_TEXT", severity: "LOW", score: 12, explanation: "Similar listing text detected; human review required.", status: "OPEN" }],
  moderationActions: trustSafetyData.moderationCases[0].actions,
  moderationAppeals: [{ id: "appeal_1", moderationCaseId: "mod_1", status: "SUBMITTED", statement: "Demo appeal requesting a second review.", createdAt: now, updatedAt: now }],
  accountRestrictions: [{ id: "restriction_1", userId: "demo_user_2", scope: "LISTING", reason: "Temporary demo restriction", active: true, startsAt: now, endsAt: nextMonth, liftedAt: null }],
  postAdoptionOutcomes: [{ id: "outcome_1", petName: "Bruno", status: "ACTIVE", handoverAt: "2026-08-20T10:00:00.000Z", submittedCheckins: 1, nextDueAt: "2026-09-01T10:00:00.000Z", openSupport: 1, activeReturn: null }],
  postAdoptionCheckins: [{ id: "checkin_admin_1", adoptionId: "adoption_001", milestone: "DAY_7", status: "REVIEW_NEEDED", concernScore: 32, concerns: ["Settling slowly"], photoMediaIds: [], submittedAt: now }],
  postAdoptionSupportCases: [{ id: "support_1", adoptionId: "adoption_001", category: "BEHAVIOUR", urgency: "ROUTINE", status: "OPEN", summary: "Need help with alone-time settling.", createdAt: now }],
  adoptionReturnCases: [{ id: "return_1", adoptionId: "adoption_002", category: "FAMILY", explanation: "Household circumstances changed and a safe return plan is requested.", status: "TRIAGED", urgentSafetyRisk: false, createdAt: now }],
  outcomeAnalytics: { day30: { assessed: 8, stable: 7, rate: 88 }, month3: { assessed: 6, stable: 5, rate: 83 }, month6: { assessed: 4, stable: 3, rate: 75 }, year1: { assessed: 2, stable: 2, rate: 100 }, returnRate: 11 },
};

export const databaseTables = {
  users: adminData.users,
  pets: adminData.pets,
  applications: adminData.applications,
  organizations: adminData.organizations,
  payments: adminData.payments,
  lost_found_reports: adminData.lostFoundReports,
  rescue_cases: adminData.rescueCases,
  foster_profiles: adminData.fosterProfiles,
  verification_requests: adminData.verificationRequests,
  moderation_cases: adminData.moderation,
  notifications: adminData.notifications,
  audit_logs: adminData.audits,
};
