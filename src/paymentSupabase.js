import { supabase } from "./supabaseClient.js";

export async function fetchMyAccountAccessState() {
  const { data, error } = await supabase.rpc(
    "get_my_account_access_state"
  );

  if (error) {
    throw new Error(error.message);
  }

  return {
    emailVerified:
      Boolean(data?.emailVerified),

    onboardingComplete:
      Boolean(data?.onboardingComplete),

    paymentStatus:
      String(
        data?.paymentStatus ||
        "PAYMENT_PENDING"
      ),

    accessStatus:
      String(
        data?.accessStatus ||
        "PAYMENT_PENDING"
      ),

    dashboardAllowed:
      Boolean(data?.dashboardAllowed),
  };
}