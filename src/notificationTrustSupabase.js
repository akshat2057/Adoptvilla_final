import { supabase } from "./supabaseClient.js";

async function rpc(name, args = {}) {
  const { data, error } =
    await supabase.rpc(name, args);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}


export async function fetchRealNotifications() {
  const data =
    await rpc("get_my_notifications");

  return Array.isArray(data)
    ? data
    : [];
}


export async function fetchRealCommunicationSettings() {
  return await rpc(
    "get_my_communication_settings"
  );
}


export async function saveRealNotificationPreferences(
  preferences
) {
  return await rpc(
    "save_my_notification_preferences",
    {
      preferences:
        preferences &&
        typeof preferences === "object"
          ? preferences
          : {},
    }
  );
}


export async function fetchRealTrustSafetyNetwork() {
  return await rpc(
    "get_trust_safety_network"
  );
}


export async function submitRealVerificationRequest({
  targetType,
  targetId,
  verificationType,
  requestedScope,
  evidenceMediaIds,
  declaration,
}) {
  return await rpc(
    "submit_verification_request",
    {
      target_type:
        String(targetType || ""),

      target_id:
        String(targetId || ""),

      verification_type:
        String(verificationType || ""),

      requested_scope:
        String(requestedScope || ""),

      evidence_media_ids:
        Array.isArray(evidenceMediaIds)
          ? evidenceMediaIds
          : [],

      declaration:
        declaration &&
        typeof declaration === "object"
          ? declaration
          : {},
    }
  );
}


export async function submitRealSafetyReport({
  subjectType,
  subjectId,
  category,
  summary,
  evidenceMediaIds,
}) {
  return await rpc(
    "submit_private_safety_report",
    {
      subject_type:
        String(subjectType || ""),

      subject_id:
        String(subjectId || ""),

      category:
        String(category || ""),

      summary:
        String(summary || ""),

      evidence_media_ids:
        Array.isArray(evidenceMediaIds)
          ? evidenceMediaIds
          : [],
    }
  );
}


export async function uploadPrivateTrustEvidence(
  formData
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!user) {
    throw new Error(
      "Please sign in to upload evidence."
    );
  }


  const file =
    formData instanceof FormData
      ? formData.get("file")
      : null;


  if (!(file instanceof File)) {
    throw new Error(
      "Choose a file to upload."
    );
  }


  const allowed = new Map([
    ["image/jpeg", "jpg"],
    ["image/png", "png"],
    ["image/webp", "webp"],
    ["application/pdf", "pdf"],
  ]);


  const extension =
    allowed.get(file.type);


  if (!extension) {
    throw new Error(
      "Only JPG, PNG, WebP or PDF files are allowed."
    );
  }


  if (
    file.size >
    10 * 1024 * 1024
  ) {
    throw new Error(
      "Evidence files must be 10 MB or smaller."
    );
  }


  const path =
    `${user.id}/trust-evidence/` +
    `${crypto.randomUUID()}.${extension}`;


  const { error } =
    await supabase.storage
      .from("private-documents")
      .upload(
        path,
        file,
        {
          contentType: file.type,
          upsert: false,
        }
      );


  if (error) {
    throw new Error(error.message);
  }


  return {
    id: path,
    path,
  };
}