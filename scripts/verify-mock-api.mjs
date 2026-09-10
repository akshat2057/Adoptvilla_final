const store = new Map();
const envPath = new URL('../.env', import.meta.url);
try {
  const envText = await (await import('node:fs/promises')).readFile(envPath, 'utf8');
  for (const line of envText.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)\s*$/i);
    if (match && process.env[match[1]] === undefined) {
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
  }
} catch {
  // The verification script can still run when .env is absent.
}

globalThis.localStorage = {
  getItem(key) { return store.has(key) ? store.get(key) : null; },
  setItem(key, value) { store.set(key, String(value)); },
  removeItem(key) { store.delete(key); },
  clear() { store.clear(); },
};

const nativeFetch = async (input) => {
  const target = typeof input === 'string' ? input : input?.url || String(input);
  if (String(target).endsWith('/og.png') || String(target) === '/og.png') {
    return new Response(new Uint8Array([137,80,78,71]), { status: 200, headers: { 'content-type': 'image/png' } });
  }
  return new Response('not found', { status: 404 });
};

globalThis.window = {
  location: { origin: 'http://adoptvilla.local' },
  fetch: nativeFetch,
  __adoptvillaMockApiInstalled: false,
};
globalThis.fetch = (...args) => window.fetch(...args);

const { installMockApi } = await import('../src/mockApi.js');
installMockApi();
globalThis.fetch = (...args) => window.fetch(...args);

async function jsonFetch(url, init) {
  const response = await fetch(url, init);
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  const text = await response.text();
  try { return JSON.parse(text); } catch { return text; }
}

const resources = [
  'saved-pets','workflow','thread','journey-events','payment-documents','adopter-candidates','post-adoption',
  'lost-found-network','lost-found-thread','rescue-network','foster-network','crm','trust-safety','communication-settings',
];
for (const resource of resources) {
  const data = await jsonFetch(`/api/platform?resource=${resource}`);
  if (data == null) throw new Error(`No payload for resource ${resource}`);
}

const catalog = await jsonFetch('/api/catalog?page=1&pageSize=12');
if (!Array.isArray(catalog.pets) || catalog.pets.length < 10) throw new Error('Catalog static data is incomplete.');
const filtered = await jsonFetch('/api/catalog?species=Cat&city=Indore&page=1&pageSize=12');
if (!Array.isArray(filtered.pets)) throw new Error('Catalog filtering failed.');
const health = await jsonFetch('/api/health');
if (!health.checks || typeof health.checks.database !== 'boolean' || typeof health.checks.storage !== 'boolean') {
  throw new Error('Health endpoint returned an invalid Supabase status payload.');
}
console.log(`Supabase health: database=${health.checks.database}, storage=${health.checks.storage}, authentication=${health.checks.authentication}.`);
const stats = await jsonFetch('/api/database?action=stats');
if (!Array.isArray(stats.stats) || stats.stats.length < 10) throw new Error('Database Browser stats are incomplete.');
const query = await jsonFetch('/api/database?action=query&table=users&limit=50&offset=0');
if (!Array.isArray(query.rows) || !query.rows.length) throw new Error('Database Browser query is empty.');

const actions = [
  'accept-foster-match','accept-found-into-care','accept-rescue-into-care','add-directory-entry','admin-decide-appeal',
  'admin-process-notification-queue','admin-process-refund','admin-retry-notification','admin-review-verification',
  'admin-save-commerce-settings','admin-save-matching-rules','admin-save-promotion','admin-update-foster','admin-update-lost-found',
  'admin-update-organization','admin-update-payment','admin-update-pet','assign-organization-role','calculate-foster-matches',
  'calculate-lost-found-matches','calculate-matches','calculate-pet-match','close-lost-found-report','confirm-lost-found-reunion',
  'confirm-mutual-interest','create-application','create-found-report-from-crm','create-organization','create-payment-order',
  'crm-add-event','crm-complete-event','crm-intake','express-lost-found-interest','invite-foster','mark-lost-found-false-match',
  'moderation-apply-action','offer-foster-help','open-post-adoption-support','request-phone-otp','request-refund','request-safe-return',
  'reserve-promotion','respond-foster-invite','review-post-adoption-checkin','save-adopter-profile','save-foster-profile',
  'save-journey-event','save-lost-found-report','save-notification-preferences','save-pet','save-rescue-case','send-lost-found-message',
  'send-message','send-test-notification','set-account-purpose','submit-directory-feedback','submit-moderation-appeal',
  'submit-ownership-verification','submit-post-adoption-checkin','submit-safety-report','submit-verification-request','toggle-saved-pet',
  'transition-application','transition-rescue-case','transition-safe-return','triage-post-adoption-support','verify-phone-otp',
];
for (const action of actions) {
  const body = {
    action,
    petId: 'pet_bruno',
    rescueCaseId: 'rescue_1',
    phone: '+91 98765 43210',
    idempotencyKey: `test:${action}`,
  };
  const data = await jsonFetch('/api/platform', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  if (data == null) throw new Error(`No response for action ${action}`);
}

const mediaUpload = await jsonFetch('/api/media', { method: 'POST', body: new FormData() });
if (!mediaUpload.id) throw new Error('Static media upload simulation failed.');
const media = await fetch('/api/media?mediaId=demo');
if (!media.ok || !String(media.headers.get('content-type')).startsWith('image/')) throw new Error('Static media preview failed.');

console.log(`Mock API verification OK: ${resources.length} resources, ${actions.length} actions, catalog, media, health, and database browser.`);
