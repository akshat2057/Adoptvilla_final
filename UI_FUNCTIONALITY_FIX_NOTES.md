# AdoptVilla UI + Functionality Fix Pass

## Scope
Is pass mein landing page ko intentionally untouched rakha gaya hai. Main focus Dashboard, Admin, authenticated forms/workflows aur broken UI actions par tha. Database schema/migrations is pass mein change nahi kiye gaye.

## UI fixes
- New authoritative `src/workspace.css` added after legacy `styles.css`.
- Dashboard/Admin desktop shell, sidebar, top area and content width normalized.
- Consistent typography scale for headings, body text, labels, helper text and table text.
- Inputs/selects/textareas/buttons normalized to consistent heights and spacing.
- Cards, panels, stat grids, tables and action rows aligned.
- Tablet/mobile layouts normalized with horizontal workspace navigation and single-column forms.
- Admin Database Browser/System Health and dense nested workflows received dedicated responsive rules.
- Lost & Found, Rescue, Foster, CRM, Messages, Post-adoption and Trust/Safety workspaces constrained to prevent overflow and inconsistent sizing.

## Functionality fixes
- All UI-triggered action names now have a handler path in the app fallback layer.
- Previously missing Dashboard/Admin actions no longer fall straight through to 501.
- Real Supabase calls are still attempted first; UI fallback is used only when the current backend/schema cannot serve the action.
- Fallback runtime state added for CRM, journey events, moderation/admin updates, lost-found/rescue/foster and notification preferences where practical.
- Catalog and media have safe demo/preview fallback instead of hard crashing when current backend objects are missing.
- Admin database browser now uses the existing safe mock database API instead of a forced 501.
- Notification test messaging no longer claims provider delivery when a provider is not configured.
- Health endpoint now reports database/storage unavailable in fallback mode instead of falsely marking them healthy.
- Legacy `profiles` schema has a safe UI compatibility path; elevated admin fallback is only allowed for an explicitly active legacy `super` profile.

## QA completed
- `node scripts/check.mjs`: PASS — 6 route patterns, 22 dashboard views, 19 admin sections.
- UI action coverage static check: PASS — 68/68 action names handled.
- Mock/fallback API verification: PASS — 14 resources, 67 actions, catalog, media, health and database browser.

## Current limitation
A full Vite visual build could not be executed in this environment because the uploaded `node_modules` contains an incompatible Windows Rolldown native binding and dependency reinstall timed out. The final ZIP intentionally excludes `node_modules`; run `npm install` on the target machine and then `npm run build` / `npm run dev`.

Database-dependent flows are UI-functional through the fallback layer for now, but real persistence for missing tables/RPCs/storage buckets still belongs to the separate database phase.
