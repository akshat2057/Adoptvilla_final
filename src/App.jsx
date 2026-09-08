import React, {
  useEffect,
  useState,
} from "react";
import Loader from "./components/Loader";

import Home from "./pages/Home.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Admin from "./pages/Admin.jsx";
import Indore from "./pages/Indore.jsx";
import PetProfile from "./pages/PetProfile.jsx";

import {
  LoginPage,
  SignupPage,
  ForgotPasswordPage,
  ResetPasswordPage,
} from "./pages/Auth.jsx";

import {
  dashboardInitial,
  adminData,
} from "./data/mockData.js";

import { supabase } from "./supabaseClient.js";


function safeReturnTarget(
  fallback = "/dashboard"
) {
  const params =
    new URLSearchParams(
      window.location.search
    );

  const target =
    params.get("return_to") ||
    fallback;

  return target.startsWith("/")
    ? target
    : fallback;
}

function LoadingScreen() {
  return (
    <Loader />
  );
}


function redirectToAuth(
  mode = "login"
) {
  const target =
    `${window.location.pathname}` +
    `${window.location.search || ""}`;

  window.location.replace(
    `/${mode}?return_to=${encodeURIComponent(
      target
    )}`
  );
}


function userView(
  session,
  profile
) {
  const metadata =
    session?.user?.user_metadata ||
    {};

  return {
    fullName:
      profile?.full_name ||
      profile?.name ||
      metadata.full_name ||
      "Adoptvilla Member",

    email:
      session?.user?.email ||
      "",
  };
}


function adopterProfileView(
  profile
) {
  if (
    !profile ||
    profile.completeness == null
  ) {
    return null;
  }

  const metadata =
    profile.metadata || {};

  return {
    id:
      profile.id,

    city:
      profile.city || "",

    stateName:
      profile.state_name || "",

    pinCode:
      profile.pin_code || "",

    locality:
      profile.locality || "",

    homeType:
      profile.home_type || "",

    tenure:
      profile.tenure || "",

    landlordPermission:
      profile.landlord_permission ||
      "",

    adultCount:
      profile.adult_count ?? 1,

    householdAgreement:
      profile.household_agreement ||
      "",

    childAgeBands:
      metadata.childAgeBands || [],

    currentPets:
      metadata.currentPets || [],

    previousPets:
      metadata.previousPets || [],

    workMode:
      profile.work_mode || "",

    aloneHours:
      profile.alone_hours ?? 0,

    exerciseMinutes:
      profile.exercise_minutes ?? 0,

    trainingMinutes:
      profile.training_minutes ?? 0,

    experienceLevel:
      profile.experience_level || "",

    financialReadiness:
      profile.financial_readiness ||
      "",

    longTermPlans:
      metadata.longTermPlans || {},

    discoverability:
      profile.discoverability ||
      "NONE",

    preferences:
      profile.preferences || {},

    completeness:
      profile.completeness ?? 0,

    readinessScore:
      profile.readiness_score ?? 0,
  };
}


async function loadAccountContext(
  session
) {
  if (!session?.user) {
    return {
      session: null,
      profile: null,
      roles: [],
      pets: [],
      adminAccess: null,
    };
  }


  const userId =
    session.user.id;


  const [
    profileResult,
    rolesResult,
    petsResult,
    adminAccessResult,
  ] = await Promise.all([

    supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle(),


    supabase
      .from("user_roles")
      .select(
        "role, organization_id"
      )
      .eq(
        "user_id",
        userId
      ),


    supabase
      .from("pets")
      .select(
        "id,name,species,city,state,completeness,created_at"
      )
      .eq(
        "custodian_id",
        userId
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      ),


    supabase.rpc(
      "get_my_admin_access_state"
    ),

  ]);


  if (profileResult.error) {
    console.error(
      "Profile load error:",
      profileResult.error.message
    );
  }


  if (rolesResult.error) {
    console.error(
      "Role load error:",
      rolesResult.error.message
    );
  }


  if (petsResult.error) {
    console.error(
      "Pets load error:",
      petsResult.error.message
    );
  }


  if (adminAccessResult.error) {
    console.error(
      "Admin access load error:",
      adminAccessResult.error.message
    );
  }


  const legacyProfile =
    profileResult.data || null;

  const legacySuperAdmin =
    legacyProfile?.status === "Active" &&
    String(legacyProfile?.role || "").toLowerCase() === "super";

  const fallbackRoles = [
    { role: "ADOPTER" },
    { role: "PET_CUSTODIAN" },
    ...(legacySuperAdmin
      ? [
          { role: "SUPER_ADMIN" },
          { role: "MODERATOR" },
          { role: "ORGANIZATION_ADMIN", organization_id: "org_hfa" },
        ]
      : []),
  ];

  return {

    session,

    profile:
      legacyProfile,

    // During the database migration, older projects may not yet contain
    // user_roles/pets/admin RPCs. Keep the authenticated workspace usable
    // without granting Super Admin unless the legacy profile explicitly says so.
    roles:
      rolesResult.error
        ? fallbackRoles
        : (rolesResult.data || []),

    pets:
      petsResult.error
        ? dashboardInitial.pets
        : (petsResult.data || []),

    adminAccess:
      adminAccessResult.error
        ? {
            adminAllowed: legacySuperAdmin,
            isSuperAdmin: legacySuperAdmin,
          }
        : adminAccessResult.data,

  };
}


function useAccount() {

  const [
    state,
    setState,
  ] = useState({

    loading: true,

    session: null,

    profile: null,

    roles: [],

    pets: [],

    adminAccess: null,

  });


  useEffect(() => {

    let active = true;


    const applySession =
      async (session) => {

        const next =
          await loadAccountContext(
            session
          );

        if (active) {
          setState({
            loading: false,
            ...next,
          });
        }
      };


    supabase.auth
      .getSession()
      .then(
        ({
          data,
          error,
        }) => {

          if (error) {

            console.error(
              "Session load error:",
              error.message
            );

            if (active) {
              setState({
                loading: false,
                session: null,
                profile: null,
                roles: [],
                pets: [],
                adminAccess: null,
              });
            }

            return;
          }


          applySession(
            data.session
          );
        }
      );


    const {
      data: authListener,
    } =
      supabase.auth
        .onAuthStateChange(
          (
            event,
            session
          ) => {

            if (
              event ===
              "SIGNED_OUT"
            ) {

              if (active) {
                setState({
                  loading: false,
                  session: null,
                  profile: null,
                  roles: [],
                  pets: [],
                  adminAccess: null,
                });
              }

              return;
            }


            if (
              event ===
                "SIGNED_IN" ||
              event ===
                "TOKEN_REFRESHED" ||
              event ===
                "USER_UPDATED" ||
              event ===
                "INITIAL_SESSION"
            ) {

              window.setTimeout(
                () =>
                  applySession(
                    session
                  ),
                0
              );
            }

          }
        );


    const refreshAccountData =
      () => {

        supabase.auth
          .getSession()
          .then(({ data }) => {

            if (active) {
              applySession(
                data.session
              );
            }

          });
      };


    window.addEventListener(
      "adoptvilla:account-data-changed",
      refreshAccountData
    );


    return () => {

      active = false;


      window.removeEventListener(
        "adoptvilla:account-data-changed",
        refreshAccountData
      );


      authListener
        .subscription
        .unsubscribe();

    };

  }, []);


  return state;
}


function SignInRedirect() {

  const target =
    safeReturnTarget(
      "/dashboard"
    );

  window.location.replace(
    `/login?return_to=${encodeURIComponent(
      target
    )}`
  );

  return (
    <LoadingScreen
      title="Opening secure login…"
    />
  );
}


function SignOutPage() {

  useEffect(() => {

    let active = true;


    supabase.auth
      .signOut()
      .finally(() => {

        if (active) {
          window.location.replace(
            "/login"
          );
        }

      });


    return () => {
      active = false;
    };

  }, []);


  return (
    <LoadingScreen
      title="Signing out…"
    />
  );
}


function NotFound() {
  return (
    <main className="city-page">

      <section className="city-hero">

        <span>
          ADOPTVILLA
        </span>

        <h1>
          Page not found
        </h1>

        <p>
          This route is not part
          of the current Adoptvilla
          interface.
        </p>

        <a
          className="primary"
          href="/"
        >
          Return home →
        </a>

      </section>

    </main>
  );
}


export default function App() {

  const path =
    window.location.pathname
      .replace(/\/+$/, "") ||
    "/";


  const account =
    useAccount();


  // =====================================================
  // HOME
  // =====================================================

  if (path === "/") {

    return (
      <Home
        isAuthenticated={
          Boolean(
            account.session
          )
        }
      />
    );
  }


  // =====================================================
  // NORMAL LOGIN + ADMIN LOGIN
  // =====================================================

  if (
    path === "/login" ||
    path === "/admin/login"
  ) {

    if (account.loading) {

      return (
        <LoadingScreen
          title="Checking your session…"
        />
      );
    }


    if (account.session) {

      let target =
        "/dashboard";


      if (
        path === "/admin/login"
      ) {

        target =
          account.adminAccess
            ?.adminAllowed
            ? "/admin"
            : "/dashboard";

      } else {

        target =
          safeReturnTarget(
            "/dashboard"
          );
      }


      window.location.replace(
        target
      );


      return (
        <LoadingScreen
          title={
            target === "/admin"
              ? "Opening admin console…"
              : "Opening your dashboard…"
          }
        />
      );
    }


    return (
      <LoginPage />
    );
  }


  // =====================================================
  // SIGNUP
  // =====================================================

  if (path === "/signup") {

    if (account.loading) {

      return (
        <LoadingScreen
          title="Checking your session…"
        />
      );
    }


    if (account.session) {

      window.location.replace(
        "/dashboard"
      );


      return (
        <LoadingScreen
          title="Opening your dashboard…"
        />
      );
    }


    return (
      <SignupPage />
    );
  }


  // =====================================================
  // PASSWORD
  // =====================================================

  if (
    path ===
    "/forgot-password"
  ) {
    return (
      <ForgotPasswordPage />
    );
  }


  if (
    path ===
    "/reset-password"
  ) {
    return (
      <ResetPasswordPage />
    );
  }


  // =====================================================
  // LOGOUT
  // =====================================================

  if (path === "/logout") {
    return (
      <SignOutPage />
    );
  }


  // =====================================================
  // PUBLIC ROUTES
  // =====================================================

  if (path === "/indore") {
    return (
      <Indore />
    );
  }


  if (
    path ===
    "/signin-with-chatgpt"
  ) {
    return (
      <SignInRedirect />
    );
  }


  // =====================================================
  // WAIT FOR ACCOUNT
  // =====================================================

  if (account.loading) {
    return (
      <LoadingScreen />
    );
  }


  // =====================================================
  // USER DASHBOARD
  // =====================================================

  if (
    path === "/dashboard"
  ) {

    if (!account.session) {

      redirectToAuth(
        "login"
      );


      return (
        <LoadingScreen
          title="Opening secure login…"
        />
      );
    }


    const realRoles =
      account.roles.map(
        ({
          role,
          organization_id,
        }) => ({

          role,

          ...(organization_id
            ? {
                organizationId:
                  organization_id,
              }
            : {}),

        })
      );


    const onboardingComplete =
      account.profile?.onboarding_status == null
        ? true
        : account.profile.onboarding_status === "COMPLETE";


    const dashboardData = {

      ...dashboardInitial,


      adopterProfile:
        adopterProfileView(
          account.profile
        ) || dashboardInitial.adopterProfile,


      pets:
        account.pets || [],


      roles: [

        ...(onboardingComplete
          ? [
              {
                role:
                  "ONBOARDING_COMPLETE",
              },
            ]
          : []),

        ...realRoles,

      ],

    };


    return (
      <Dashboard

        user={
          userView(
            account.session,
            account.profile
          )
        }

        initial={
          dashboardData
        }

        signOutPath="/logout"

      />
    );
  }


  // =====================================================
  // SUPER ADMIN
  // =====================================================

  if (
    path === "/admin"
  ) {

    if (!account.session) {

      window.location.replace(
        "/admin/login?return_to=%2Fadmin"
      );


      return (
        <LoadingScreen
          title="Opening admin login…"
        />
      );
    }


    const isSuperAdmin =
      Boolean(
        account.adminAccess
          ?.adminAllowed
      );


    if (!isSuperAdmin) {

      window.location.replace(
        "/dashboard"
      );


      return (
        <LoadingScreen
          title="Returning to your dashboard…"
        />
      );
    }


    return (
      <Admin

        user={
          userView(
            account.session,
            account.profile
          )
        }

        initial={
          adminData
        }

        signOutPath="/logout"

      />
    );
  }


  // =====================================================
  // PET PROFILE
  // =====================================================

  if (
    path.startsWith(
      "/pets/"
    )
  ) {

    if (!account.session) {

      redirectToAuth(
        "signup"
      );


      return (
        <main className="purpose-shell">

          <section className="purpose-panel">

            <span className="kicker">
              PRIVATE PET PROFILE
            </span>

            <h1>
              Create an account
              to continue
            </h1>

            <p>
              Pet details open
              after account
              creation so saved
              profiles and
              compatibility steps
              can stay connected
              to one secure
              journey.
            </p>

          </section>

        </main>
      );
    }


    return (
      <PetProfile
        petId={
          decodeURIComponent(
            path.slice(
              "/pets/".length
            )
          )
        }
      />
    );
  }


  // =====================================================
  // 404
  // =====================================================

  return (
    <NotFound />
  );
}