import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const required = [
  'index.html', 'package.json', 'vite.config.js', 'public/dogsvilla-logo.png', 'public/favicon.svg', 'public/og.png',
  'src/App.jsx', 'src/main.jsx', 'src/pages/Home.jsx', 'src/pages/PetProfile.jsx', 'src/pages/Indore.jsx',
  'src/pages/Dashboard.jsx', 'src/pages/Admin.jsx', 'src/components/DatabaseBrowser.jsx', 'src/mockApi.js', 'src/data/mockData.js',
];
const missing = required.filter((relative) => !fs.existsSync(path.join(root, relative)));
if (missing.length) {
  console.error('Missing required project files:');
  for (const file of missing) console.error(` - ${file}`);
  process.exit(1);
}
const app = fs.readFileSync(path.join(root, 'src/App.jsx'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'src/pages/Dashboard.jsx'), 'utf8');
const admin = fs.readFileSync(path.join(root, 'src/pages/Admin.jsx'), 'utf8');
const routes = ['/', '/dashboard', '/admin', '/indore', '/signin-with-chatgpt', '/pets/'];
const tabs = ['Today','Pet Fit Guide','My profile','My animals','Saved pets','Lost & found','Rescue & help','Foster','Activation & payment','Find adopters','Best matches','Pet compatibility','Activity','Messages','Adoption journey','After adoption','Notifications','Trust & safety','Directory corrections','Manage','Review queue','Settings'];
const sections = ['Overview','Users','Pets','Adoptions','Post-adoption','Organizations','Verification','Lost & Found','Rescue & Foster','Shelter CRM','Payments','Communications','Promotions','Matching','Moderation','Directory','System','Audit','Database'];
for (const route of routes) if (!app.includes(route)) throw new Error(`Route missing from App.jsx: ${route}`);
for (const tab of tabs) if (!dashboard.includes(`"${tab}"`)) throw new Error(`Dashboard view missing: ${tab}`);
for (const section of sections) if (!admin.includes(`"${section}"`)) throw new Error(`Admin section missing: ${section}`);
console.log(`Source project integrity OK: ${routes.length} route patterns, ${tabs.length} dashboard views, ${sections.length} admin sections.`);
