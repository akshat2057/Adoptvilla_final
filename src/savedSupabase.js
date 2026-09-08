import { supabase } from "./supabaseClient.js";
import { publicPetView } from "./catalogSupabase.js";

const deviceStorageKey = "adoptvilla-saved-pets-v1";
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const petSelect = `
  id,
  legacy_id,
  name,
  species,
  breed,
  age_months,
  age_label,
  age_band,
  sex,
  weight_kg,
  size,
  city,
  locality_approx,
  energy,
  image_url,
  media,
  tags,
  story,
  consider,
  considerations,
  good_with,
  daily_needs,
  medical,
  behaviour,
  ideal_home,
  origin,
  rehoming_reason,
  completeness,
  published_at,
  is_demo,
  photo_pending,
  organization:organizations(name,type,verification_status)
`;

function readDeviceIds() {
  try {
    const value = JSON.parse(window.localStorage.getItem(deviceStorageKey) || "[]");
    return Array.isArray(value) ? [...new Set(value.map(String))] : [];
  } catch {
    return [];
  }
}

function cleanDeviceIds() {
  const ids = readDeviceIds().filter((value) => uuidPattern.test(value));
  try {
    window.localStorage.setItem(deviceStorageKey, JSON.stringify(ids));
  } catch {
    // Device storage is optional.
  }
  return ids;
}

async function signedInUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  return data.user || null;
}

async function migrateDeviceSaves(userId) {
  const deviceIds = cleanDeviceIds();
  if (!deviceIds.length) return;

  const { data: published, error: petError } = await supabase
    .from("pets")
    .select("id")
    .in("id", deviceIds)
    .eq("state", "PUBLISHED");

  if (petError) throw new Error(petError.message);

  const validIds = (published || []).map((row) => row.id);
  if (!validIds.length) return;

  const { error: saveError } = await supabase
    .from("saved_pets")
    .upsert(
      validIds.map((petId) => ({ user_id: userId, pet_id: petId })),
      { onConflict: "user_id,pet_id", ignoreDuplicates: true }
    );

  if (saveError) throw new Error(saveError.message);
}

export async function fetchAccountSavedPets() {
  const user = await signedInUser();
  if (!user) {
    return { authenticated: false, petIds: [], pets: [] };
  }

  await migrateDeviceSaves(user.id);

  const { data: savedRows, error: savedError } = await supabase
    .from("saved_pets")
    .select("pet_id,created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (savedError) throw new Error(savedError.message);

  const petIds = (savedRows || []).map((row) => row.pet_id);
  if (!petIds.length) {
    return { authenticated: true, petIds: [], pets: [] };
  }

  const { data: petRows, error: petError } = await supabase
    .from("pets")
    .select(petSelect)
    .in("id", petIds)
    .eq("state", "PUBLISHED");

  if (petError) throw new Error(petError.message);

  const byId = new Map((petRows || []).map((row) => [row.id, publicPetView(row)]));
  const pets = petIds.map((petId) => byId.get(petId)).filter(Boolean);

  return {
    authenticated: true,
    petIds: pets.map((pet) => pet.id),
    pets,
  };
}

export async function setAccountSavedPet(petId, shouldSave) {
  const user = await signedInUser();
  if (!user) throw new Error("Please sign in to save pets to your account.");

  const normalizedPetId = String(petId || "").trim();
  if (!uuidPattern.test(normalizedPetId)) {
    throw new Error("This pet record is not a valid published Adoptvilla record.");
  }

  if (shouldSave) {
    const { data: pet, error: petError } = await supabase
      .from("pets")
      .select("id")
      .eq("id", normalizedPetId)
      .eq("state", "PUBLISHED")
      .maybeSingle();

    if (petError) throw new Error(petError.message);
    if (!pet) throw new Error("This pet is no longer available to save.");

    const { error } = await supabase
      .from("saved_pets")
      .upsert(
        { user_id: user.id, pet_id: normalizedPetId },
        { onConflict: "user_id,pet_id" }
      );

    if (error) throw new Error(error.message);
  } else {
    const { error } = await supabase
      .from("saved_pets")
      .delete()
      .eq("user_id", user.id)
      .eq("pet_id", normalizedPetId);

    if (error) throw new Error(error.message);
  }

  return { saved: Boolean(shouldSave), petId: normalizedPetId };
}
