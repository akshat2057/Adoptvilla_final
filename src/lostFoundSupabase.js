import { supabase } from "./supabaseClient.js";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function uuid(value, label) {
  const id = String(value || "").trim();

  if (!UUID.test(id)) {
    throw new Error(`Invalid ${label}.`);
  }

  return id;
}

async function rpc(name, args = {}) {
  const { data, error } =
    await supabase.rpc(name, args);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

export async function fetchRealLostFoundNetwork() {
  return rpc("get_lost_found_network");
}

export async function saveRealLostFoundReport(
  report
) {
  return rpc(
    "create_lost_found_report",
    {
      payload:
        report &&
        typeof report === "object"
          ? report
          : {},
    }
  );
}

export async function calculateRealLostFoundMatches(
  reportId
) {
  return rpc(
    "calculate_lost_found_matches",
    {
      target_report:
        uuid(reportId, "report"),
    }
  );
}

export async function expressRealLostFoundInterest(
  matchId
) {
  return rpc(
    "express_lost_found_interest",
    {
      target_match:
        uuid(matchId, "match"),
    }
  );
}

export async function rejectRealLostFoundMatch(
  matchId
) {
  return rpc(
    "reject_lost_found_match",
    {
      target_match:
        uuid(matchId, "match"),
    }
  );
}

export async function submitRealOwnershipVerification(
  matchId,
  proofAnswer
) {
  return rpc(
    "submit_lost_found_verification",
    {
      target_match:
        uuid(matchId, "match"),

      proof_answer:
        String(
          proofAnswer || ""
        ).trim(),
    }
  );
}

export async function confirmRealLostFoundReunion(
  matchId
) {
  return rpc(
    "confirm_lost_found_reunion",
    {
      target_match:
        uuid(matchId, "match"),
    }
  );
}

export async function closeRealLostFoundReport(
  reportId
) {
  return rpc(
    "close_my_lost_found_report",
    {
      target_report:
        uuid(reportId, "report"),
    }
  );
}

export async function fetchRealLostFoundThread(
  threadId
) {
  return rpc(
    "get_lost_found_thread",
    {
      target_thread:
        uuid(
          threadId,
          "conversation"
        ),
    }
  );
}

export async function sendRealLostFoundMessage(
  threadId,
  message
) {
  return rpc(
    "send_lost_found_message",
    {
      target_thread:
        uuid(
          threadId,
          "conversation"
        ),

      message_body:
        String(
          message || ""
        ).trim(),
    }
  );
}
export async function uploadPublicWelfarePhoto(formData) {
  const { data, error: userError } =
    await supabase.auth.getUser();

  if (userError) {
    throw new Error(userError.message);
  }

  if (!data.user) {
    throw new Error("Please sign in to upload a photo.");
  }

  const purpose = String(
    formData.get("purpose") || ""
  );

  if (purpose !== "PUBLIC_WELFARE") {
    throw new Error("Invalid media upload purpose.");
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Choose a photo to upload.");
  }

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  if (!allowedTypes.includes(file.type)) {
    throw new Error(
      "Only JPG, PNG or WebP photos are allowed."
    );
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error(
      "Photo must be 10 MB or smaller."
    );
  }

  const extension =
    file.type === "image/png"
      ? "png"
      : file.type === "image/webp"
        ? "webp"
        : "jpg";

  const fileId =
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`;

  const path =
    `${data.user.id}/welfare/${fileId}.${extension}`;

  const { error: uploadError } =
    await supabase.storage
      .from("pet-media")
      .upload(path, file, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: false,
      });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: publicData } =
    supabase.storage
      .from("pet-media")
      .getPublicUrl(path);

  if (!publicData?.publicUrl) {
    throw new Error(
      "Photo URL could not be created."
    );
  }

  return {
    id: publicData.publicUrl,
    url: publicData.publicUrl,
    path,
  };
}
export async function deleteRealClosedLostFoundReport(
  reportId
) {
  const result = await rpc(
    "delete_my_closed_lost_found_report",
    {
      target_report: uuid(reportId, "report"),
    }
  );

  // Best-effort cleanup of welfare photos from Storage.
  try {
    const { data } = await supabase.auth.getUser();
    const userId = data?.user?.id;

    const mediaIds = Array.isArray(result?.mediaIds)
      ? result.mediaIds
      : [];

    if (userId && mediaIds.length) {
      const paths = mediaIds
        .map((value) => {
          try {
            const url = new URL(String(value));
            const marker =
              "/storage/v1/object/public/pet-media/";

            const index = url.pathname.indexOf(marker);

            if (index === -1) return "";

            return decodeURIComponent(
              url.pathname.slice(index + marker.length)
            );
          } catch {
            return "";
          }
        })
        .filter((path) =>
          path.startsWith(`${userId}/welfare/`)
        );

      if (paths.length) {
        await supabase.storage
          .from("pet-media")
          .remove(paths);
      }
    }
  } catch (error) {
    console.warn(
      "Report deleted but media cleanup failed:",
      error
    );
  }

  return result;
}