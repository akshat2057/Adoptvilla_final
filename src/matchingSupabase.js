import { supabase } from "./supabaseClient.js";
import { publicPetView } from "./catalogSupabase.js";

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const petSelect = `
  id,legacy_id,name,species,breed,age_months,age_label,age_band,sex,
  weight_kg,size,city,locality_approx,energy,image_url,media,tags,story,
  consider,considerations,good_with,daily_needs,medical,behaviour,ideal_home,
  origin,rehoming_reason,completeness,published_at,is_demo,photo_pending,
  custodian_id,organization:organizations(name,type,verification_status)
`;

const num = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
};

const clamp = (value) =>
  Math.max(0, Math.min(100, Math.round(num(value))));

const bool = (value, fallback = false) => {
  if (typeof value === "boolean") return value;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return fallback;
};

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();

  if (error) throw new Error(error.message);

  if (!data.user) {
    throw new Error("Please sign in to continue.");
  }

  return data.user;
}

async function profileFor(userId) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    throw new Error(
      "Complete your adopter profile before checking compatibility."
    );
  }

  return data;
}

async function applicationFor(userId, petId) {
  const { data, error } = await supabase
    .from("applications")
    .select("id,status,match_score")
    .eq("adopter_id", userId)
    .eq("pet_id", petId)
    .maybeSingle();

  if (error) throw new Error(error.message);

  return data || null;
}

function assess(profile, row, application = null) {
  const pet = publicPetView(row);

  const ideal =
    row.ideal_home &&
    typeof row.ideal_home === "object"
      ? row.ideal_home
      : {};

  const behaviour =
    row.behaviour &&
    typeof row.behaviour === "object"
      ? row.behaviour
      : {};

  const hardStops = [];
  const reasons = [];
  const warnings = [];

  const completeness = num(profile.completeness);
  const readiness = num(profile.readiness_score, 60);

  const apartmentSuitable = bool(
    ideal.apartmentSuitable,
    true
  );

  const experiencedRequired = bool(
    ideal.experiencedHandlerRequired,
    false
  );

  const maxAloneHours = Number(
    ideal.maxAloneHours
  );

  const exerciseNeed = num(
    ideal.exerciseMinutes,
    row.energy === "High" ? 90 : 60
  );

  const adopterExercise = num(
    profile.exercise_minutes
  );

  const adopterAlone = Number(
    profile.alone_hours
  );

  if (completeness < 70) {
    hardStops.push(
      "Complete at least 70% of your adopter profile before applying."
    );
  }

  if (row.is_demo) {
    hardStops.push(
      "This is a demonstration record and does not accept real applications."
    );
  }

  if (
    String(profile.tenure || "").toUpperCase() ===
      "RENTED" &&
    String(
      profile.landlord_permission || ""
    ).toUpperCase() === "NO"
  ) {
    hardStops.push(
      "Pet permission is required for the current rented-home profile."
    );
  }

  if (
    experiencedRequired &&
    String(
      profile.experience_level || ""
    ).toUpperCase() === "FIRST_TIME"
  ) {
    hardStops.push(
      "This animal is currently marked as requiring an experienced handler."
    );
  }

  if (
    String(
      profile.home_type || ""
    ).toUpperCase() === "APARTMENT" &&
    !apartmentSuitable
  ) {
    hardStops.push(
      "This animal is not currently marked suitable for apartment living."
    );
  }

  if (
    Number.isFinite(maxAloneHours) &&
    Number.isFinite(adopterAlone) &&
    adopterAlone > maxAloneHours
  ) {
    hardStops.push(
      "Your recorded alone-time exceeds this animal's current care requirement."
    );
  }

  const sameCity =
    String(profile.city || "").toLowerCase() ===
    String(row.city || "").toLowerCase();

  if (sameCity) {
    reasons.push(
      "Same-city introductions and follow-up are easier to coordinate."
    );
  } else {
    warnings.push(
      "A safe transport and introduction plan will need to be discussed."
    );
  }

  if (adopterExercise >= exerciseNeed) {
    reasons.push(
      "Your recorded exercise commitment meets this animal's listed routine."
    );
  } else {
    warnings.push(
      `This animal needs about ${exerciseNeed} minutes of daily exercise or enrichment.`
    );
  }

  if (
    String(
      profile.household_agreement || ""
    ).toUpperCase() === "YES"
  ) {
    reasons.push(
      "Your profile records household agreement for adoption."
    );
  } else {
    warnings.push(
      "Confirm that everyone in the household is ready for the adoption plan."
    );
  }

  if (behaviour.separationDistress) {
    warnings.push(
      "The animal record notes separation-related support needs."
    );
  }

  if (behaviour.escapeRisk) {
    warnings.push(
      "The animal record notes an escape-risk consideration."
    );
  }

  const homeFit = clamp(
    profile.home_type === "APARTMENT" &&
      !apartmentSuitable
      ? 35
      : 92
  );

  const scheduleFit = clamp(
    Number.isFinite(maxAloneHours) &&
    Number.isFinite(adopterAlone)
      ? 100 -
          Math.max(
            0,
            adopterAlone - maxAloneHours
          ) *
            18
      : 82
  );

  const householdFit =
    String(
      profile.household_agreement || ""
    ).toUpperCase() === "YES"
      ? 94
      : 72;

  const exerciseFit = clamp(
    exerciseNeed
      ? (adopterExercise / exerciseNeed) * 100
      : 85
  );

  const careCapacity = clamp(readiness);

  const distance = sameCity ? 100 : 70;

  const score = clamp(
    homeFit * 0.2 +
      scheduleFit * 0.18 +
      householdFit * 0.14 +
      exerciseFit * 0.2 +
      careCapacity * 0.18 +
      distance * 0.1
  );

  const coverageFields = [
    profile.city,
    profile.home_type,
    profile.tenure,
    profile.household_agreement,
    profile.work_mode,
    profile.alone_hours,
    profile.exercise_minutes,
    profile.experience_level,
    profile.financial_readiness,
    profile.readiness_score,
  ];

  const coverage = clamp(
    (coverageFields.filter(
      (value) =>
        value !== null &&
        value !== undefined &&
        value !== ""
    ).length /
      coverageFields.length) *
      100
  );

  const eligible =
    hardStops.length === 0;

  return {
    pet,

    eligible,

    canApply:
      eligible &&
      !row.is_demo &&
      !application,

    matchId:
      eligible && !row.is_demo
        ? row.id
        : "",

    score:
      eligible ? score : 0,

    confidence:
      coverage >= 90
        ? "HIGH"
        : coverage >= 70
          ? "MEDIUM"
          : "LOW",

    coverage,

    profileState:
      profile.onboarding_status ===
      "COMPLETE"
        ? "ACTIVE"
        : "DRAFT",

    reasons:
      eligible
        ? reasons.slice(0, 4)
        : [],

    warnings:
      warnings.slice(0, 4),

    hardStops,

    dimensionScores:
      eligible
        ? {
            homeFit,
            scheduleFit,
            householdFit,
            exerciseFit,
            careCapacity,
            distance,
          }
        : {},

    application: application
      ? {
          id: application.id,
          status: application.status,
        }
      : null,
  };
}

export async function calculateRealPetCompatibility(
  petId
) {
  const id = String(
    petId || ""
  ).trim();

  if (!uuidPattern.test(id)) {
    throw new Error(
      "This pet record is not valid anymore."
    );
  }

  const user =
    await currentUser();

  const [
    profile,
    petResult,
    application,
  ] = await Promise.all([
    profileFor(user.id),

    supabase
      .from("pets")
      .select(petSelect)
      .eq("id", id)
      .eq("state", "PUBLISHED")
      .maybeSingle(),

    applicationFor(
      user.id,
      id
    ),
  ]);

  if (petResult.error) {
    throw new Error(
      petResult.error.message
    );
  }

  if (!petResult.data) {
    throw new Error(
      "This published pet could not be found."
    );
  }

  return assess(
    profile,
    petResult.data,
    application
  );
}

export async function calculateRealMatches() {
  const user =
    await currentUser();

  const profile =
    await profileFor(user.id);

  const [
    petsResult,
    appsResult,
  ] = await Promise.all([
    supabase
      .from("pets")
      .select(petSelect)
      .eq("state", "PUBLISHED")
      .eq("is_demo", false),

    supabase
      .from("applications")
      .select(
        "id,pet_id,status,match_score"
      )
      .eq(
        "adopter_id",
        user.id
      ),
  ]);

  if (petsResult.error) {
    throw new Error(
      petsResult.error.message
    );
  }

  if (appsResult.error) {
    throw new Error(
      appsResult.error.message
    );
  }

  const appsByPet =
    new Map(
      (appsResult.data || []).map(
        (app) => [
          app.pet_id,
          app,
        ]
      )
    );

  const evaluated =
    petsResult.data || [];

  const assessed =
    evaluated.map(
      (pet) =>
        assess(
          profile,
          pet,
          appsByPet.get(
            pet.id
          ) || null
        )
    );

  const matches =
    assessed
      .filter(
        (item) =>
          item.eligible
      )
      .sort(
        (a, b) =>
          b.score -
          a.score
      )
      .map(
        (item) => ({
          petId:
            item.pet.id,

          petName:
            item.pet.name,

          species:
            item.pet.species,

          city:
            item.pet.city,

          score:
            item.score,

          confidence:
            item.confidence,

          reasons:
            item.reasons,

          matchId:
            item.application
              ? ""
              : item.pet.id,
        })
      );

  return {
    matches,

    evaluatedCount:
      evaluated.length,

    excludedCount:
      evaluated.length -
      matches.length,
  };
}

export async function createRealApplication(
  matchId
) {
  const raw = String(
    matchId || ""
  ).trim();

  const petId =
    raw.startsWith(
      "petmatch_"
    )
      ? raw.slice(9)
      : raw;

  if (
    !uuidPattern.test(
      petId
    )
  ) {
    throw new Error(
      "Recalculate compatibility and try again."
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "submit_adoption_application",
    {
      target_pet:
        petId,
    }
  );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return {
    applicationId:
      data?.applicationId ||
      null,

    status:
      data?.status ||
      "SUBMITTED",

    score:
      data?.score ??
      null,

    existing:
      Boolean(
        data?.existing
      ),
  };
}

export async function fetchRealWorkflow() {
  const user =
    await currentUser();

  const {
    data: rows,
    error,
  } = await supabase
    .from("applications")
    .select(
      "id,pet_id,adopter_id,custodian_id,status,match_score,adopter_interested,custodian_interested,mutual_interest,created_at"
    )
    .or(
      `adopter_id.eq.${user.id},custodian_id.eq.${user.id}`
    )
    .order(
      "created_at",
      {
        ascending:
          false,
      }
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  if (!rows?.length) {
    return [];
  }

  const petIds = [
    ...new Set(
      rows.map(
        (row) =>
          row.pet_id
      )
    ),
  ];

  const appIds =
    rows.map(
      (row) =>
        row.id
    );

  const [
    petsResult,
    threadsResult,
  ] = await Promise.all([
    supabase
      .from("pets")
      .select(
        "id,name,species,city"
      )
      .in(
        "id",
        petIds
      ),

    supabase
      .from("threads")
      .select(
        "id,application_id"
      )
      .in(
        "application_id",
        appIds
      ),
  ]);

  if (
    petsResult.error
  ) {
    throw new Error(
      petsResult.error.message
    );
  }

  if (
    threadsResult.error
  ) {
    throw new Error(
      threadsResult.error.message
    );
  }

  const pets =
    new Map(
      (
        petsResult.data ||
        []
      ).map(
        (pet) => [
          pet.id,
          pet,
        ]
      )
    );

  const threads =
    new Map(
      (
        threadsResult.data ||
        []
      ).map(
        (thread) => [
          thread.application_id,
          thread.id,
        ]
      )
    );

  return rows.map(
    (row) => {
      const pet =
        pets.get(
          row.pet_id
        ) || {};

      return {
        id:
          row.id,

        petId:
          row.pet_id,

        petName:
          pet.name ||
          "Pet",

        species:
          pet.species ||
          "Pet",

        city:
          pet.city ||
          "",

        score:
          num(
            row.match_score
          ),

        status:
          row.status ||
          "SUBMITTED",

        perspective:
          row.adopter_id ===
          user.id
            ? "ADOPTER"
            : "CUSTODIAN",

        adopterInterested:
          Boolean(
            row.adopter_interested
          ),

        custodianInterested:
          Boolean(
            row.custodian_interested
          ),

        mutualInterest:
          Boolean(
            row.mutual_interest
          ),

        threadId:
          threads.get(
            row.id
          ) || null,

        createdAt:
          row.created_at,
      };
    }
  );
}

export async function withdrawRealApplication(
  applicationId
) {
  const id = String(
    applicationId ||
      ""
  ).trim();

  if (
    !uuidPattern.test(id)
  ) {
    throw new Error(
      "This application record is invalid."
    );
  }

  const {
    data,
    error,
  } = await supabase.rpc(
    "withdraw_my_application",
    {
      target_application:
        id,
    }
  );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return (
    data || {
      applicationId:
        id,
      status:
        "WITHDRAWN",
    }
  );
}