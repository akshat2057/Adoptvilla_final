import { supabase } from "./supabaseClient.js";

async function rpc(name, args = {}) {
  const { data, error } = await supabase.rpc(name, args);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

async function signedPrivatePhoto(path) {
  const value = String(path || "");

  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const { data, error } = await supabase.storage
    .from("private-documents")
    .createSignedUrl(value, 60 * 60);

  if (error) {
    console.warn(
      "Private post-adoption photo could not be opened:",
      error.message
    );
    return "";
  }

  return data?.signedUrl || "";
}

export async function fetchRealPostAdoptionNetwork() {
  const data = await rpc("get_post_adoption_network");

  const adoptions = Array.isArray(data?.adoptions)
    ? data.adoptions
    : [];

  for (const adoption of adoptions) {
    const checkins = Array.isArray(adoption?.checkins)
      ? adoption.checkins
      : [];

    for (const checkin of checkins) {
      const storedPhotos = Array.isArray(checkin?.photoMediaIds)
        ? checkin.photoMediaIds
        : [];

      checkin.photoMediaIds = (
        await Promise.all(
          storedPhotos.map((path) =>
            signedPrivatePhoto(path)
          )
        )
      ).filter(Boolean);
    }
  }

  return {
    adoptions,

    summary: {
      adoptions: Number(
        data?.summary?.adoptions ?? 0
      ),

      dueCheckins: Number(
        data?.summary?.dueCheckins ?? 0
      ),

      concernsNeedingReview: Number(
        data?.summary?.concernsNeedingReview ?? 0
      ),

      openSupportCases: Number(
        data?.summary?.openSupportCases ?? 0
      ),

      activeReturns: Number(
        data?.summary?.activeReturns ?? 0
      ),
    },
  };
}

export async function submitRealPostAdoptionCheckin(
  adoptionId,
  checkinId,
  answers = {},
  photoMediaIds = []
) {
  return await rpc(
    "submit_post_adoption_checkin",
    {
      target_adoption: String(adoptionId),
      target_checkin: String(checkinId),

      payload: {
        ...answers,

        photoMediaIds: Array.isArray(photoMediaIds)
          ? photoMediaIds
          : [],
      },
    }
  );
}

export async function uploadPrivatePostAdoptionPhoto(
  formData
) {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Please sign in.");
  }

  const file = formData.get("file");
  const adoptionId = String(
    formData.get("adoptionId") || ""
  );

  if (!(file instanceof File)) {
    throw new Error("Choose a photo.");
  }

  if (!adoptionId) {
    throw new Error("Adoption record is missing.");
  }

  const allowed = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowed.includes(file.type)) {
    throw new Error(
      "Only JPEG, PNG or WebP photos are allowed."
    );
  }

  if (file.size > 15 * 1024 * 1024) {
    throw new Error(
      "Photo must be smaller than 15 MB."
    );
  }

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const path =
    `${user.id}/post-adoption/` +
    `${adoptionId}/` +
    `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from("private-documents")
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  return {
    id: path,
    path,
  };
}
export async function openRealPostAdoptionSupport(
  adoptionId,
  category,
  urgency,
  summary
) {
  return await rpc(
    "open_post_adoption_support",
    {
      target_adoption: String(adoptionId),
      support_category: String(category || ""),
      support_urgency: String(urgency || "ROUTINE"),
      support_summary: String(summary || ""),
    }
  );
}

export async function triageRealPostAdoptionSupport(
  supportCaseId,
  next,
  notes
) {
  return await rpc(
    "triage_post_adoption_support",
    {
      target_support_case: String(supportCaseId),
      next_status: String(next),
      transition_notes: String(notes || ""),
    }
  );
}
export async function reviewRealPostAdoptionCheckin(
  checkinId,
  resolved,
  notes
) {
  return await rpc(
    "review_post_adoption_checkin",
    {
      target_checkin: String(checkinId),
      resolved: Boolean(resolved),
      review_notes: String(notes || ""),
    }
  );
}

export async function requestRealSafeReturn(
  adoptionId,
  category,
  explanation,
  urgentSafetyRisk
) {
  return await rpc(
    "request_safe_return",
    {
      target_adoption: String(adoptionId),
      return_category: String(category || ""),
      return_explanation: String(explanation || ""),
      urgent_safety_risk: Boolean(urgentSafetyRisk),
    }
  );
}

export async function transitionRealSafeReturn(
  returnCaseId,
  next,
  notes,
  scheduledHandoverAt = ""
) {
  return await rpc(
    "transition_safe_return",
    {
      target_return_case: String(returnCaseId),
      next_status: String(next),
      transition_notes: String(notes || ""),
      scheduled_handover_at:
        String(scheduledHandoverAt || "") || null,
    }
  );
}