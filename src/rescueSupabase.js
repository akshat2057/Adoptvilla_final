import { supabase } from "./supabaseClient.js";

async function rpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function fetchRealRescueNetwork() {
  const [data, fosterProfile] = await Promise.all([
    rpc("get_rescue_network"),
    rpc("get_my_foster_profile"),
  ]);

  return {
    cases: Array.isArray(data?.cases) ? data.cases : [],
    matches: Array.isArray(data?.matches) ? data.matches : [],
    fosterProfile: fosterProfile ?? null,

    summary: {
      myReports: Number(data?.summary?.myReports ?? 0),
      openNearby: Number(data?.summary?.openNearby ?? 0),
      critical: Number(data?.summary?.critical ?? 0),
      fosterOffers: Number(data?.summary?.fosterOffers ?? 0),
    },
  };
}

export async function saveRealRescueCase(rescue = {}) {
  return await rpc("create_rescue_case", {
    payload: rescue,
  });
}
export async function transitionRealRescueCase(
  rescueCaseId,
  next,
  organizationId = null,
  notes = null
) {
  return await rpc("transition_rescue_case", {
    target_case: String(rescueCaseId),
    next_status: String(next),
    target_org: organizationId
      ? String(organizationId)
      : null,
    transition_note: notes
      ? String(notes)
      : null,
  });
}
export async function acceptRealRescueIntoCare(
  rescueCaseId,
  organizationId
) {
  return await rpc("accept_rescue_into_care", {
    target_case: String(rescueCaseId),
    target_org: String(organizationId),
  });
}
export async function saveRealFosterProfile(profile = {}) {
  return await rpc("save_my_foster_profile", {
    payload: profile,
  });
}
export async function calculateRealFosterMatches(
  rescueCaseId
) {
  return await rpc("calculate_foster_matches", {
    target_case: String(rescueCaseId),
  });
}

export async function inviteRealFoster(
  rescueCaseId,
  fosterProfileId
) {
  return await rpc("invite_foster", {
    target_case: String(rescueCaseId),
    target_foster_profile: String(fosterProfileId),
  });
}

export async function respondRealFosterInvite(
  matchId,
  response
) {
  return await rpc("respond_foster_invite", {
    target_match: String(matchId),
    response_status: String(response),
  });
}

export async function offerRealFosterHelp(
  rescueCaseId
) {
  return await rpc("offer_foster_help", {
    target_case: String(rescueCaseId),
  });
}

export async function acceptRealFosterMatch(
  matchId
) {
  return await rpc("accept_foster_match", {
    target_match: String(matchId),
  });
}