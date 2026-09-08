import { supabase } from "./supabaseClient.js";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validUuid(value, label = "record") {
  const id = String(value || "").trim();

  if (!UUID_PATTERN.test(id)) {
    throw new Error(`Invalid ${label}.`);
  }

  return id;
}

async function currentUser() {
  const { data, error } =
    await supabase.auth.getUser();

  if (error) {
    throw new Error(error.message);
  }

  if (!data.user) {
    throw new Error(
      "Please sign in to continue."
    );
  }

  return data.user;
}

/* =========================================
   CUSTODIAN CONFIRMS MUTUAL INTEREST
========================================= */

export async function confirmRealInterest(
  applicationId
) {
  await currentUser();

  const id = validUuid(
    applicationId,
    "application"
  );

  const { data, error } =
    await supabase.rpc(
      "confirm_application_interest",
      {
        target_application: id,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/* =========================================
   CUSTODIAN ADVANCES WORKFLOW
========================================= */

export async function advanceRealWorkflow(
  applicationId,
  nextStatus
) {
  await currentUser();

  const id = validUuid(
    applicationId,
    "application"
  );

  const next = String(
    nextStatus || ""
  )
    .trim()
    .toUpperCase();

  if (!next) {
    throw new Error(
      "Next workflow status is required."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "advance_application_workflow",
      {
        target_application: id,
        next_status: next,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}

/* =========================================
   LOAD SECURE THREAD
========================================= */

export async function fetchRealThread(
  threadId
) {
  const user = await currentUser();

  const id = validUuid(
    threadId,
    "conversation"
  );

  const { data: thread, error: threadError } =
    await supabase
      .from("threads")
      .select(
        "id,adopter_id,custodian_id,status"
      )
      .eq("id", id)
      .maybeSingle();

  if (threadError) {
    throw new Error(
      threadError.message
    );
  }

  if (!thread) {
    throw new Error(
      "This conversation is not available."
    );
  }

  if (
    thread.adopter_id !== user.id &&
    thread.custodian_id !== user.id
  ) {
    throw new Error(
      "You are not authorized to view this conversation."
    );
  }

  const { data, error } =
    await supabase
      .from("thread_messages")
      .select(
        "id,sender_id,body,created_at"
      )
      .eq("thread_id", id)
      .order("created_at", {
        ascending: true,
      });

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map(
    (message) => ({
      id: message.id,

      senderUserId:
        message.sender_id,

      mine:
        message.sender_id ===
        user.id,

      body:
        message.body,

      createdAt:
        message.created_at,
    })
  );
}

/* =========================================
   SEND SECURE MESSAGE
========================================= */

export async function sendRealMessage(
  threadId,
  message
) {
  await currentUser();

  const id = validUuid(
    threadId,
    "conversation"
  );

  const body = String(
    message || ""
  ).trim();

  if (!body) {
    throw new Error(
      "Message cannot be empty."
    );
  }

  if (body.length > 4000) {
    throw new Error(
      "Message must be 4000 characters or fewer."
    );
  }

  const { data, error } =
    await supabase.rpc(
      "send_secure_message",
      {
        target_thread: id,
        message_body: body,
      }
    );

  if (error) {
    throw new Error(error.message);
  }

  return data;
}