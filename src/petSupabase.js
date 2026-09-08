import { supabase } from "./supabaseClient.js";

const SELF_SERVICE_ROLES = new Set(["ADOPTER", "PET_CUSTODIAN"]);
const ALLOWED_MEDIA_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
]);
const MAX_DRAFT_FILE_BYTES = 10 * 1024 * 1024;

function text(value) {
  const result = String(value ?? "").trim();
  return result || null;
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function safeFilename(name) {
  const cleaned = String(name || "file")
    .normalize("NFKD")
    .replace(/[^\w.\-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "file";
}

async function currentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Please sign in to continue.");
  return data.user;
}

async function ensureCustodianRole(userId) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) throw new Error(error.message);

  const roles = (data || [])
    .map((row) => String(row.role))
    .filter((role) => SELF_SERVICE_ROLES.has(role));

  if (roles.includes("PET_CUSTODIAN")) return;

  const requestedRoles = [...new Set([...roles, "PET_CUSTODIAN"])];
  const { error: roleError } = await supabase.rpc("set_my_account_purpose", {
    requested_roles: requestedRoles,
  });

  if (roleError) throw new Error(roleError.message);
}

function petListView(row) {
  return {
    id: row.id,
    name: row.name,
    species: row.species,
    city: row.city || "",
    state: row.state,
    completeness: row.completeness ?? 0,
  };
}

export async function savePetDraft(pet = {}) {
  const user = await currentUser();
  await ensureCustodianRole(user.id);

  const name = text(pet.name);
  const species = text(pet.species);

  if (!name || !species) {
    throw new Error("Pet name and species are required.");
  }

  const payload = {
    name,
    species,
    breed: text(pet.breed),
    age_months: nonNegativeNumber(pet.ageMonths),
    sex: text(pet.sex),
    weight_kg: nonNegativeNumber(pet.weightKg),
    size: text(pet.size),
    city: text(pet.city),
    energy: text(pet.behaviour?.energy),
    history: text(pet.history),
    medical: pet.medical && typeof pet.medical === "object" ? pet.medical : {},
    behaviour:
      pet.behaviour && typeof pet.behaviour === "object" ? pet.behaviour : {},
    ideal_home:
      pet.idealHome && typeof pet.idealHome === "object" ? pet.idealHome : {},
    bite_history: text(pet.biteHistory),
    origin: text(pet.origin),
    rehoming_reason: text(pet.rehomingReason),
    completeness:
      Number.isFinite(Number(pet.completeness))
        ? Math.max(0, Math.min(100, Number(pet.completeness)))
        : null,
    state: "DRAFT",
    custodian_id: user.id,
    photo_pending: true,
  };

  const { data, error } = await supabase
    .from("pets")
    .insert(payload)
    .select("id,name,species,city,state,completeness")
    .single();

  if (error) throw new Error(error.message);

  window.dispatchEvent(new Event("adoptvilla:account-data-changed"));

  return {
    petId: data.id,
    pet: petListView(data),
  };
}

export async function uploadPetDraftMedia(formData) {
  const user = await currentUser();

  const file = formData?.get?.("file");
  const petId = String(formData?.get?.("petId") || "").trim();

  if (!(file instanceof File) || file.size <= 0) {
    throw new Error("Choose a valid file to upload.");
  }

  if (!petId) {
    throw new Error("Pet record is missing for this upload.");
  }

  if (!ALLOWED_MEDIA_TYPES.has(file.type)) {
    throw new Error("Only JPG, PNG, WebP or PDF files are allowed.");
  }

  if (file.size > MAX_DRAFT_FILE_BYTES) {
    throw new Error("Each pet draft file must be 10 MB or smaller.");
  }

  const { data: pet, error: petError } = await supabase
    .from("pets")
    .select("id,custodian_id,media")
    .eq("id", petId)
    .single();

  if (petError) throw new Error(petError.message);

  if (pet.custodian_id !== user.id) {
    throw new Error("You can only upload files to your own pet record.");
  }

  const randomPart =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const path = `${user.id}/pets/${petId}/${randomPart}-${safeFilename(file.name)}`;

  const { data: stored, error: uploadError } = await supabase.storage
    .from("private-documents")
    .upload(path, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) throw new Error(uploadError.message);

  const item = {
    id: `private-documents:${stored.path}`,
    bucket: "private-documents",
    path: stored.path,
    originalName: file.name,
    mimeType: file.type,
    size: file.size,
    visibility: "PRIVATE_DRAFT",
  };

  const currentMedia = Array.isArray(pet.media) ? pet.media : [];

  const { error: updateError } = await supabase
    .from("pets")
    .update({
      media: [...currentMedia, item],
      photo_pending: false,
    })
    .eq("id", petId);

  if (updateError) {
    await supabase.storage.from("private-documents").remove([stored.path]);
    throw new Error(updateError.message);
  }

  return item;
}
