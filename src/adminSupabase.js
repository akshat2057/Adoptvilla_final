import { supabase } from "./supabaseClient.js";


function camelKey(value) {
  return String(value).replace(
    /_([a-z])/g,
    (_, letter) =>
      letter.toUpperCase()
  );
}


function normalizeRow(row) {
  if (
    !row ||
    typeof row !== "object" ||
    Array.isArray(row)
  ) {
    return row;
  }

  return Object.fromEntries(
    Object.entries(row).map(
      ([key, value]) => [
        camelKey(key),
        value,
      ]
    )
  );
}


function rows(value) {
  return Array.isArray(value)
    ? value.map(normalizeRow)
    : [];
}


function verificationStatus(status) {
  const value =
    String(status || "");

  if (value === "PENDING")
    return "SUBMITTED";

  if (value === "IN_REVIEW")
    return "UNDER_REVIEW";

  return value;
}


export async function fetchRealAdminConsole() {
  const { data, error } =
    await supabase.rpc(
      "get_admin_console_data"
    );

  if (error) {
    throw new Error(error.message);
  }


  const users =
    Array.isArray(data?.users)
      ? data.users
      : [];


  const pets =
    rows(data?.pets);


  const applications =
    rows(data?.applications);


  const organizations =
    rows(data?.organizations);


  const verificationRequests =
    rows(
      data?.verificationRequests
    ).map((row) => ({
      ...row,

      status:
        verificationStatus(
          row.status
        ),

      evidenceMediaIds:
        Array.isArray(
          row.evidenceMediaIds
        )
          ? row.evidenceMediaIds
          : [],
    }));


  const verificationBadges =
    rows(
      data?.verificationBadges
    ).map((row) => ({
      ...row,

      status:
        row.active === false
          ? "REVOKED"
          : "ACTIVE",
    }));


  const safetyReports =
    rows(
      data?.safetyReports
    );


  const lostFoundReports =
    rows(
      data?.lostFoundReports
    );


  const lostFoundMatches =
    rows(
      data?.lostFoundMatches
    );


  const rescueCases =
    rows(
      data?.rescueCases
    ).map((row) => ({
      ...row,

      species:
        row.species ||
        row.animalType ||
        "",

      organization:
        row.organization ||
        row.assignedOrganizationId ||
        "",
    }));


  const fosterProfiles =
    rows(
      data?.fosterProfiles
    ).map((row) => ({
      ...row,

      capacityAvailable:
        row.capacityAvailable ??
        row.maxAnimals ??
        0,

      verificationStatus:
        row.verificationStatus ||
        "UNVERIFIED",

      activeMatches:
        row.activeMatches ?? 0,
    }));


  const adoptions =
    rows(data?.adoptions);


  const postAdoptionCheckins =
    rows(
      data?.postAdoptionCheckins
    );


  const postAdoptionSupportCases =
    rows(
      data?.postAdoptionSupportCases
    ).map((row) => ({
      ...row,

      urgency:
        row.urgency ||
        row.priority ||
        "STANDARD",
    }));


  const adoptionReturnCases =
    rows(
      data?.adoptionReturnCases
    ).map((row) => ({
      ...row,

      category:
        row.category ||
        row.details?.category ||
        "RETURN_SUPPORT",

      explanation:
        row.explanation ||
        row.reason ||
        "",

      urgentSafetyRisk:
        Boolean(
          row.urgentSafetyRisk ||
          row.details?.urgentSafetyRisk ||
          row.urgency === "URGENT"
        ),

      scheduledHandoverAt:
        row.scheduledHandoverAt ||
        row.details?.scheduledHandoverAt ||
        null,
    }));


  const orders =
    rows(
      data?.paymentOrders
    );


  const transactions =
    rows(
      data?.paymentTransactions
    );


  const refunds =
    rows(
      data?.paymentRefunds
    );


  const transactionByOrder =
    new Map();

  for (const item of transactions) {
    transactionByOrder.set(
      String(item.orderId),
      item
    );
  }


  const refundByOrder =
    new Map();

  for (const item of refunds) {
    refundByOrder.set(
      String(item.orderId),
      item
    );
  }


  const payments =
    orders.map((order) => {
      const transaction =
        transactionByOrder.get(
          String(order.id)
        );

      const refund =
        refundByOrder.get(
          String(order.id)
        );

      return {
        ...order,

        providerPaymentId:
          transaction
            ?.providerPaymentId ||
          null,

        providerRefundId:
          refund
            ?.providerRefundId ||
          null,

        signatureVerified:
          Boolean(
            transaction
              ?.signatureVerified
          ),
      };
    });


  const notifications =
    rows(
      data?.notifications
    ).map((row) => ({
      ...row,

      attemptCount:
        row.attemptCount ?? 0,

      maxAttempts:
        row.maxAttempts ?? 0,

      nextAttemptAt:
        row.nextAttemptAt ?? null,

      lastError:
        row.lastError ?? null,

      providerMessageId:
        row.providerMessageId ??
        null,
    }));


  const audits =
    rows(
      data?.audits
    ).map((row) => ({
      ...row,

      actorUserId:
        row.actorUserId ||
        row.adminUserId,

      action:
        row.action ||
        row.actionType,

      subjectType:
        row.subjectType ||
        row.targetType,

      subjectId:
        row.subjectId ||
        row.targetId,

      reason:
        row.reason ||
        row.details?.reason ||
        "",
    }));


  const activeReturns =
    adoptionReturnCases.filter(
      (row) =>
        ![
          "RETURNED",
          "CANCELLED",
          "CLOSED",
        ].includes(
          String(row.status)
        )
    );


  const reviewCheckins =
    postAdoptionCheckins.filter(
      (row) =>
        row.status ===
        "REVIEW_NEEDED"
    );


  const postAdoptionOutcomes =
    adoptions.map((adoption) => {

      const adoptionId =
        String(adoption.id);

      const checkins =
        postAdoptionCheckins.filter(
          (row) =>
            String(row.adoptionId) ===
            adoptionId
        );

      const support =
        postAdoptionSupportCases.filter(
          (row) =>
            String(row.adoptionId) ===
            adoptionId &&
            ![
              "RESOLVED",
              "CLOSED",
            ].includes(
              String(row.status)
            )
        );

      const returns =
        adoptionReturnCases.filter(
          (row) =>
            String(row.adoptionId) ===
            adoptionId &&
            ![
              "RETURNED",
              "CANCELLED",
              "CLOSED",
            ].includes(
              String(row.status)
            )
        );


      return {
        id: adoption.id,

        petName:
          adoption.petName ||
          adoption.petId ||
          "Adoption",

        status:
          adoption.status,

        handoverAt:
          adoption.handoverAt,

        submittedCheckins:
          checkins.filter(
            (row) =>
              row.status !==
              "SCHEDULED"
          ).length,

        nextDueAt:
          checkins.find(
            (row) =>
              row.status ===
              "SCHEDULED"
          )?.scheduledFor ||
          null,

        openSupport:
          support.length,

        activeReturn:
          returns.length > 0,
      };
    });


  const adopterCount =
    users.filter(
      (user) =>
        Array.isArray(user.roles) &&
        user.roles.includes(
          "ADOPTER"
        )
    ).length;


  const paidRevenue =
    payments
      .filter(
        (row) =>
          String(row.status) ===
          "PAID"
      )
      .reduce(
        (sum, row) =>
          sum +
          Number(
            row.amountPaise || 0
          ),
        0
      );


  const stats = {

    users:
      users.length,

    adopters:
      adopterCount,

    pets:
      pets.length,

    applications:
      applications.length,

    organizations:
      organizations.length,

    verificationPending:
      verificationRequests.filter(
        (row) =>
          [
            "SUBMITTED",
            "UNDER_REVIEW",
          ].includes(
            String(row.status)
          )
      ).length,

    safetyOpen:
      safetyReports.filter(
        (row) =>
          ![
            "ACTIONED",
            "CLOSED",
          ].includes(
            String(row.status)
          )
      ).length,

    appealsPending:
      0,

    lostFoundReports:
      lostFoundReports.length,

    rescueCases:
      rescueCases.length,

    fosters:
      fosterProfiles.length,

    crmAnimals:
      0,

    payments:
      payments.length,

    paidRevenue,

    postAdoptionReview:
      reviewCheckins.length,

    activeReturns:
      activeReturns.length,
  };


  return {

    stats,

    users,
    pets,
    applications,
    organizations,

    verificationRequests,
    verificationBadges,

    safetyReports,

    lostFoundReports,
    lostFoundMatches,

    rescueCases,
    fosterProfiles,

    postAdoptionCheckins,
    postAdoptionSupportCases,
    adoptionReturnCases,
    postAdoptionOutcomes,

    payments,
    notifications,
    audits,


    // Modules that do not yet have
    // a real admin backend are kept
    // empty instead of showing fake
    // operational records.

    crmAnimals: [],
    paymentDocuments: [],
    otpChallenges: [],
    promotions: [],
    matchingRules: [],
    moderation: [],
    moderationAppeals: [],
    accountRestrictions: [],
    directory: [],


    outcomeAnalytics: {
      day30: {
        rate: null,
        stable: 0,
        assessed: 0,
      },

      month3: {
        rate: null,
        stable: 0,
        assessed: 0,
      },

      month6: {
        rate: null,
        stable: 0,
        assessed: 0,
      },

      year1: {
        rate: null,
        stable: 0,
        assessed: 0,
      },

      returnRate: null,
    },
  };
}


export async function createAdminPrivateDocumentUrl(
  path
) {
  const value =
    String(path || "");

  if (!value) {
    throw new Error(
      "Private document is missing."
    );
  }

  const { data, error } =
    await supabase.storage
      .from("private-documents")
      .createSignedUrl(
        value,
        300
      );

  if (error) {
    throw new Error(error.message);
  }

  return data.signedUrl;
}
async function adminRpc(
  name,
  args = {}
) {
  const { data, error } =
    await supabase.rpc(
      name,
      args
    );

  if (error) {
    throw new Error(
      error.message
    );
  }

  return data;
}


export async function adminUpdatePetState(
  petId,
  state
) {
  return adminRpc(
    "admin_update_pet_state",
    {
      pet_id:
        String(petId),
      next_state:
        String(state),
    }
  );
}


export async function adminReviewVerification({
  requestId,
  decision,
  notes,
  approvedScope,
  validityMonths,
}) {
  return adminRpc(
    "admin_review_verification_request",
    {
      request_id:
        String(requestId),

      decision:
        String(decision),

      notes:
        String(notes),

      approved_scope:
        String(
          approvedScope || ""
        ),

      validity_months:
        Number(
          validityMonths || 12
        ),
    }
  );
}


export async function adminReviewPostAdoptionCheckin(
  checkinId,
  resolved,
  notes
) {
  return adminRpc(
    "admin_review_post_adoption_checkin",
    {
      checkin_id:
        String(checkinId),

      resolved:
        Boolean(resolved),

      notes:
        String(notes),
    }
  );
}


export async function adminTriagePostAdoptionSupport(
  supportCaseId,
  next,
  notes
) {
  return adminRpc(
    "admin_triage_post_adoption_support",
    {
      support_case_id:
        String(
          supportCaseId
        ),

      next_status:
        String(next),

      notes:
        String(notes),
    }
  );
}


export async function adminTransitionSafeReturn(
  returnCaseId,
  next,
  notes,
  scheduledHandoverAt
) {
  return adminRpc(
    "admin_transition_safe_return",
    {
      return_case_id:
        String(
          returnCaseId
        ),

      next_status:
        String(next),

      notes:
        String(notes),

      scheduled_handover_at:
        String(
          scheduledHandoverAt ||
          ""
        ),
    }
  );
}


export async function adminCloseFailedPayment(
  orderId
) {
  return adminRpc(
    "admin_close_failed_payment_attempt",
    {
      order_id:
        String(orderId),
    }
  );
}