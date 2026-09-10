import { supabase } from "./supabaseClient.js";

function arrayValue(value) {
  return Array.isArray(value) ? value : [];
}

function objectValue(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function ageLabel(ageMonths) {
  const months = Number(ageMonths);
  if (!Number.isFinite(months) || months < 0) return "Age not recorded";
  if (months < 12) return `${months} month${months === 1 ? "" : "s"}`;
  if (months % 12 === 0) {
    const years = months / 12;
    return `${years} year${years === 1 ? "" : "s"}`;
  }
  const years = Math.floor(months / 12);
  const remainder = months % 12;
  return `${years}y ${remainder}m`;
}

export function publicPetView(row) {
  const organization = row?.organization || null;
  const behaviour = objectValue(row?.behaviour);

  return {
    id: row.id,
    legacyId: row.legacy_id || null,
    name: row.name || "Unnamed pet",
    type: row.species || "Pet",
    species: row.species || "Pet",
    breed: row.breed || "Not recorded",
    age: row.age_label || ageLabel(row.age_months),
    ageMonths: row.age_months ?? null,
    ageBand: row.age_band || null,
    sex: row.sex || "Not recorded",
    weightKg: row.weight_kg == null ? null : Number(row.weight_kg),
    size: row.size || "Not recorded",
    city: row.city || "Location private",
    localityApprox: row.locality_approx || "",
    energy: row.energy || behaviour.energy || "Not recorded",
    image: row.image_url || "/og.png",
    media: arrayValue(row.media),
    tags: arrayValue(row.tags),
    story: row.story || "This pet profile is still being completed.",
    consider: row.consider || "Review the complete individual care profile before applying.",
    considerations: arrayValue(row.considerations),
    goodWith: arrayValue(row.good_with),
    dailyNeeds: arrayValue(row.daily_needs),
    medical: objectValue(row.medical),
    behaviour,
    idealHome: objectValue(row.ideal_home),
    origin: row.origin || null,
    rehomingReason: row.rehoming_reason || null,
    completeness: Number(row.completeness ?? 0),
    publishedAt: row.published_at || null,
    organization: organization
      ? {
          name: organization.name,
          type: organization.type || "Organization",
          verificationStatus: organization.verification_status || "CLAIMED",
        }
      : null,
    demo: Boolean(row.is_demo),
    photoPending: Boolean(row.photo_pending),
  };
}

async function loadPublishedRows() {
  const { data, error } = await supabase
    .from("pets")
    .select(`
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
    `)
    .eq("state", "PUBLISHED")
    .order("published_at", { ascending: false })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function fetchRealCatalog(url, promotions) {
  const rows = await loadPublishedRows();
  const allPets = rows.map(publicPetView);

  const q = (url.searchParams.get("q") || "").trim().toLowerCase();
  const species = url.searchParams.get("species") || "All";
  const city = url.searchParams.get("city") || "All cities";
  const page = Math.max(1, Number(url.searchParams.get("page") || 1));
  const pageSize = Math.max(1, Math.min(24, Number(url.searchParams.get("pageSize") || 12)));

  const filtered = allPets.filter((pet) => {
    if (species !== "All" && pet.species !== species) return false;
    if (city !== "All cities" && pet.city !== city) return false;
    if (!q) return true;

    return `${pet.name} ${pet.species} ${pet.breed} ${pet.city} ${pet.localityApprox} ${pet.tags.join(" ")} ${pet.story}`
      .toLowerCase()
      .includes(q);
  });

  const cityNames = [...new Set(allPets.map((pet) => pet.city).filter(Boolean))];
  const preferredOrder = ["Indore", "Pune", "Bengaluru", "Delhi NCR", "Mumbai"];
  cityNames.sort((a, b) => {
    const ai = preferredOrder.indexOf(a);
    const bi = preferredOrder.indexOf(b);
    if (ai !== -1 || bi !== -1) {
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    }
    return a.localeCompare(b);
  });

  const cities = cityNames.map((name) => ({
    name,
    petCount: allPets.filter((pet) => pet.city === name).length,
    realPetCount: allPets.filter((pet) => pet.city === name && !pet.demo).length,
    demoPetCount: allPets.filter((pet) => pet.city === name && pet.demo).length,
    resourceCount: name === "Indore" ? 4 : 2,
  }));

  const start = (page - 1) * pageSize;

  return {
    pets: filtered.slice(start, start + pageSize),
    total: filtered.length,
    realTotal: filtered.filter((pet) => !pet.demo).length,
    demoTotal: filtered.filter((pet) => pet.demo).length,
    page,
    pageSize,
    hasMore: start + pageSize < filtered.length,
    cities,
    promotions,
  };
}

export async function fetchPublishedPet(petId) {
  const { data, error } = await supabase
    .from("pets")
    .select(`
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
    `)
    .eq("id", petId)
    .eq("state", "PUBLISHED")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? publicPetView(data) : null;
}
