export const meta = {
  name: 'grid-feature-pages',
  description: 'Build the remaining GRID dashboard feature pages against the shared design kit',
  phases: [{ title: 'Build pages', detail: 'one agent per route, composing the shared kit' }],
};

const SHARED = `
You are building ONE page file in an existing Next.js 16 (App Router) + Tailwind v4 + TypeScript project — GRID, a premium dark marketplace for photographers, cinematographers and drone pilots. A rich, consistent design system already exists. Your job is to compose it — do NOT invent new styling primitives.

STEP 1 — Read these files to learn the EXACT API and patterns (read them fully before writing):
- Z:\\grid\\src\\components\\dashboard\\ui.tsx        (Surface, Card, PageHeader, SectionHeader, Eyebrow, MetricCard, StatusPill, TrustBadge, Tag, Stars, StarRow, Avatar, MediaTile, StageTracker, Progress, Button, IconTile, AmbientGlow, Icon, Verified, ACCENT)
- Z:\\grid\\src\\components\\dashboard\\cards.tsx     (CreativeCard, FeaturedCreativeCard, JobCard, JobRow, ProjectCard, PostCard, ReviewCard, PackageRow, CourseCard, ProductCard)
- Z:\\grid\\src\\components\\dashboard\\icons.tsx     (Icon name=... ; IconName union)
- Z:\\grid\\src\\lib\\grid-data.ts                    (all data + types + money())
- Z:\\grid\\src\\app\\dashboard\\page.tsx             (REFERENCE home page — match its structure, spacing, and the .rise entrance pattern)
- Z:\\grid\\src\\components\\dashboard\\role-context.tsx  (useRole)
- Z:\\grid\\src\\components\\dashboard\\sheet.tsx / sheets.tsx (useSheet; PostJobSheet, UploadSheet, BookingFlow, NotificationsSheet, InviteSheet)

HARD RULES:
1. Start the file with "use client"; (all these pages may use hooks/handlers — be uniform).
2. Default-export a React component. The file lives at the given path under src/app, so it IS a route page.
3. Import data from "@/lib/grid-data", UI from "@/components/dashboard/ui", cards from "@/components/dashboard/cards", icons via Icon from "@/components/dashboard/ui" (it re-exports Icon) or "@/components/dashboard/icons", role via "@/components/dashboard/role-context", sheets via "@/components/dashboard/sheet" + "@/components/dashboard/sheets".
4. NEVER build dynamic Tailwind class names by string interpolation (e.g. \`text-\${x}\`). Tailwind v4 JIT cannot see them. Use the ACCENT map from ui.tsx, or full literal class strings, or the tone props that components already accept.
5. Use the brand surfaces: cards are border-white/10 bg-white/[0.03]; text is text-white / text-white/55 / text-white/45; accents are the named tokens text-aerial-cyan, text-escrow-green, text-review-gold, text-ai-purple, text-grid-blue, text-client-green, text-urgent-red. Money via money(n) / money(n, "/ day").
6. Wrap top-level sections in <div className="rise" style={{ animationDelay: "Nms" }}> to stagger entrance, exactly like the home page. Start the page with <PageHeader .../> unless told otherwise.
7. Keep it responsive (grids: 1 col mobile → 2/3 cols md/lg). Match the calm, premium feel — generous spacing (gap-8/gap-10 between sections), no loud colors.
8. TypeScript must be clean: import types you use; data arrays are already typed. Do not add props that components don't accept (check ui.tsx/cards.tsx signatures).
9. Output ONLY by writing the file with the Write tool at the exact path. Then reply with one line: "done: <path>".

GROUNDING DATA (already in grid-data.ts, do not redefine):
- CREATIVES: Creative[] {id,name,type,cat,city,distanceKm,rate,rating,reviews,verified,topRated?,available?,licensed?,bio,packages:Package[],portfolio:Tile[]}
- JOBS: Job[] {id,title,company,cat,budget,budgetPer?,loc,desc,urgent,term,cover:Tile,posted}
- PROJECTS: Project[] {id,title,withName,cat,stage(0-4),budget,due}; STAGES = ["Planning","Shoot","Edit","Fixes","Delivery"]
- CONTRACTS: Contract[] {id,withName,pkg,total,status:"Active"|"Completed"|"Awaiting signature",date}
- COURSES: Course[] {id,title,by,duration,lessons:string[],done,cover}
- PRODUCTS: Product[] {id,title,price,type:"LUT"|"Preset"|"Template",cover}
- POSTS, COMPANIES{northwind,coastline,azure}, MY_COMPANY, CREATIVE_REVIEWS{[id]:Review[]}, CREW:CrewMember[]{id,role,name,pay}, COLLAB_PROJECT, STUDIO_TOOLS[{key,label,desc}], NEWS[{title,when}], TRENDS[{title,change}], INVITE_TIERS, SAVED_CREATIVE_IDS:string[], METRICS{inEscrow,available,thisMonth,totalSpent}, TRUST_BADGES, findCreative(id), findJob(id)
- money(n, per?) -> "€3,000" or "€3,000 / day"
`;

const PAGES = [
  {
    label: 'browse',
    path: 'Z:\\grid\\src\\app\\dashboard\\browse\\page.tsx',
    spec: `Marketplace discovery. "use client". Use useRole() — if role==="client" the header is title "Hire creatives" subtitle "Search, filter, find your match." eyebrow "Verified talent" tone green; else title "Browse" subtitle "Find your next collaborator." eyebrow "Verified talent" tone blue.
Below the PageHeader: a search input (rounded-2xl border-white/10 bg-white/[0.04] px-4 py-3, with a left Icon name="search") bound to useState(query). Then a row of filter chips: All, Photo, Video, Drone (useState category, default "All"). Active chip uses bg-white/15 text-white; inactive bg-white/[0.05] text-white/60. Then a responsive grid (sm:grid-cols-2 xl:grid-cols-3, gap-4) of <CreativeCard c={c}/> for CREATIVES filtered by category (cat===category unless "All") AND query (case-insensitive match on name/type/city). Show a small result count line. Wrap sections in .rise.`,
  },
  {
    label: 'jobs',
    path: 'Z:\\grid\\src\\app\\dashboard\\jobs\\page.tsx',
    spec: `Job board. "use client". useRole() + useSheet().
If role==="creator": PageHeader eyebrow "Job board · Urgent calls" tone red, title "Open jobs posted by clients.", subtitle "Apply to one-off, urgent and long-term work." Then if any JOBS are urgent, a section with SectionHeader title="Urgent" and a grid of <JobCard> for urgent jobs; then SectionHeader title="All jobs" and a grid (md:grid-cols-2 xl:grid-cols-3 gap-4) of <JobCard> for the non-urgent jobs.
If role==="client": PageHeader title "My jobs", subtitle "Jobs you’ve posted.", and an action prop = <Button tone="green" arrow onClick={()=>open(<PostJobSheet/>)}>Post a job</Button>. Then a grid of <JobCard> for ALL JOBS.
Import PostJobSheet from "@/components/dashboard/sheets". Wrap in .rise.`,
  },
  {
    label: 'projects',
    path: 'Z:\\grid\\src\\app\\dashboard\\projects\\page.tsx',
    spec: `Project tracking. "use client". useRole(). PageHeader eyebrow "Grid Projects" tone cyan, title "Projects", subtitle "Track every job from planning to delivery." Then a responsive grid (md:grid-cols-2 xl:grid-cols-3, gap-4) of <ProjectCard p={p} role={role}/> for PROJECTS. Above the grid, a small metric row (grid-cols-3 gap-3) of MetricCard: Active = PROJECTS.length, In escrow = money(METRICS.inEscrow) tone escrow, Delivered this month = "2" tone gold (or similar). Wrap in .rise with staggered delays.`,
  },
  {
    label: 'contracts',
    path: 'Z:\\grid\\src\\app\\dashboard\\contracts\\page.tsx',
    spec: `Digital contracts. "use client". useRole(). PageHeader eyebrow "Grid Contracts" tone blue, title "Contracts", subtitle "All your signed agreements." Then a flex flex-col gap-3 list of CONTRACTS rendered as <Card hover className="p-5"> rows: left side = pkg name (font-semibold text-white) and a line "{role==="client"?"with":"for"} {withName} · {date}" (text-sm text-white/55) and contract id (font-mono text-xs text-white/40, like "#"+id). Right side = a StatusPill (Active -> tone blue with live; Completed -> tone escrow; "Awaiting signature" -> tone gold) above "Total in escrow" label (text-xs text-white/45) and money(total) (font-semibold text-white, font-mono). Use flex items-center justify-between, responsive. Wrap in .rise.`,
  },
  {
    label: 'finance',
    path: 'Z:\\grid\\src\\app\\dashboard\\finance\\page.tsx',
    spec: `Finance / escrow ledger. "use client". useRole(). PageHeader eyebrow "Grid Escrow" tone escrow, title "Finance", subtitle "Escrow balances and payouts in one place."
A metric grid (grid-cols-2 lg:grid-cols-4 gap-3): In escrow = money(METRICS.inEscrow) tone escrow sub "held, protected"; Available = money(METRICS.available) sub "ready to withdraw"; role==="client" ? Total spent=money(METRICS.totalSpent) : This month=money(METRICS.thisMonth); On-time = "100%" tone escrow.
Then SectionHeader title="Escrow activity". Build line items from CONTRACTS: each -> a Card row (p-4 flex items-center justify-between): left a small square Icon (name="lock" if Active else "check") in an escrow-tinted rounded box, then pkg + "{withName} · {date}"; right a StatusPill (Active->"Held" tone blue live, Completed->"Released" tone escrow) and money(total). Add a <Button full? no> "Withdraw available" tone escrow at the bottom (onClick no-op / or wrap a small confirmation alert via console). Keep calm. Wrap in .rise.`,
  },
  {
    label: 'academy',
    path: 'Z:\\grid\\src\\app\\dashboard\\academy\\page.tsx',
    spec: `Grid Academy. "use client". PageHeader eyebrow "Grid Academy" tone gold, title "Sharpen your craft.", subtitle "Courses on lighting, drone movement, pricing and client work." Then a responsive grid (sm:grid-cols-2 lg:grid-cols-3 gap-4) of <CourseCard course={c}/> for COURSES. Optionally a "Continue learning" SectionHeader above. Wrap in .rise.`,
  },
  {
    label: 'shop',
    path: 'Z:\\grid\\src\\app\\dashboard\\shop\\page.tsx',
    spec: `Grid Shop. "use client". PageHeader eyebrow "Grid Shop" tone purple, title "Sell what you use.", subtitle "Presets, LUTs and templates from creators." Then a responsive grid (sm:grid-cols-2 lg:grid-cols-3 gap-4) of <ProductCard product={p}/> for PRODUCTS. After the grid, a <Surface radius="2rem" inner="p-6 sm:p-8"> "earn" CTA: a sparkles/shop Icon in a purple-tinted box, heading "Sell your own presets & LUTs", subtext about earning from your edits, and a <Button tone="purple"? (purple is a valid tone) arrow> "List a product" (no-op onClick). Wrap in .rise.`,
  },
  {
    label: 'collab',
    path: 'Z:\\grid\\src\\app\\dashboard\\collab\\page.tsx',
    spec: `Grid Collab — crew & revenue share. "use client". PageHeader eyebrow "Grid Collab" tone blue, title "Build a production team.", subtitle "Named roles and revenue share — no extra accounts needed."
Compute total = CREW.reduce((a,c)=>a+c.pay,0); lead = Math.max(0,100-total).
A <Surface radius="2rem" inner="p-6"> showing PROJECT label (text-xs uppercase tracking text-white/45) and COLLAB_PROJECT as a heading. Then list: a "You (lead)" row with Avatar + name "You" + role "Lead" + a StatusPill tone blue showing lead+"%"; then CREW.map -> a row (flex items-center gap-3, Card p-4): Avatar id undefined name=c.name, name + role (text-sm text-white/55), right a Tag or pill showing c.pay+"%". Below, a revenue split bar using <Progress value={lead} tone="blue"/> with labels "You {lead}%" and "Crew {total}%". Add a "+ Add crew" Button variant="ghost". Wrap in .rise.`,
  },
  {
    label: 'radar',
    path: 'Z:\\grid\\src\\app\\dashboard\\radar\\page.tsx',
    spec: `Grid Radar — location discovery. "use client". PageHeader eyebrow "Grid Radar" tone cyan, title "Near you, right now.", subtitle "Creatives, jobs and urgent calls in your area."
Top: a decorative radar visual inside a <Surface radius="2rem" inner="relative h-56 sm:h-64 overflow-hidden"> — concentric rings (3-4 absolutely-positioned divs, rounded-full border border-aerial-cyan/20, centered, increasing sizes) plus a few pulsing pins (small rounded-full bg-aerial-cyan with the animate-ping pattern from StatusPill) scattered, and a sweeping line is optional. Keep it tasteful, cyan accent, centered.
Then SectionHeader title="Urgent nearby" and JOBS.filter(urgent) rendered as <JobRow job={j}/> (flex flex-col gap-3). Then SectionHeader title="Creatives nearby": CREATIVES.slice(0,4).map -> a Card p-4 row: Avatar id=c.id name=c.name, name + (c.city+" · "+c.distanceKm+" km") text-sm text-white/55, right a small "View" link to /dashboard/creative/{id} (text-aerial-cyan). Wrap in .rise.`,
  },
  {
    label: 'studio',
    path: 'Z:\\grid\\src\\app\\dashboard\\studio\\page.tsx',
    spec: `Grid AI Studio. "use client". PageHeader eyebrow "Grid Studio" tone purple, title "Generate the boring parts.", subtitle "AI tools for shot lists, scripts, mood boards and proposals."
A grid (sm:grid-cols-2 lg:grid-cols-4 gap-3) of IconTile tone="purple" for STUDIO_TOOLS: map key->icon: shotlist->"list", script->"file", moodboard->"layout", proposal->"news". label=tool.label, desc=tool.desc, onClick no-op.
Then a <Surface radius="2rem" inner="p-6"> "preview" showing a sample generated shot list: heading with a sparkles Icon "Shot list · Cliffside villa", then a numbered list (ol/ul) of ~5 plausible shots (e.g. "Exterior establishing — drone orbit at golden hour", "Entry & foyer — wide, natural light", "Kitchen — counters at eye level", "Primary suite — window light", "Twilight hero — front elevation"), each a row with a small purple index chip. Wrap in .rise.`,
  },
  {
    label: 'community',
    path: 'Z:\\grid\\src\\app\\dashboard\\community\\page.tsx',
    spec: `Community feed. "use client". PageHeader eyebrow "Community" tone cyan, title "From the network.", subtitle "Work and updates from creatives on Grid." Then a responsive grid (sm:grid-cols-2 lg:grid-cols-3 gap-4) of <PostCard post={p}/> for POSTS. Wrap in .rise.`,
  },
  {
    label: 'saved',
    path: 'Z:\\grid\\src\\app\\dashboard\\saved\\page.tsx',
    spec: `Saved creatives. "use client". PageHeader eyebrow "Saved" tone blue, title "Saved creatives", subtitle "Talent you’ve shortlisted." Then a responsive grid (sm:grid-cols-2 xl:grid-cols-3 gap-4) of <CreativeCard c={c}/> built from SAVED_CREATIVE_IDS.map(findCreative).filter(Boolean). If empty, show a calm empty state Card. Wrap in .rise.`,
  },
  {
    label: 'news',
    path: 'Z:\\grid\\src\\app\\dashboard\\news\\page.tsx',
    spec: `Platform news. "use client". PageHeader eyebrow "News" tone blue, title "What’s new on Grid.", subtitle "Product updates and announcements." Then a flex flex-col gap-3 list of NEWS as <Card hover className="p-5 flex items-center gap-4"> rows: a square Icon name="news" in a blue-tinted rounded box, then title (font-medium text-white) + when (text-xs text-white/45), and an Icon name="chevron" text-white/30 on the right. Wrap in .rise.`,
  },
  {
    label: 'trends',
    path: 'Z:\\grid\\src\\app\\dashboard\\trends\\page.tsx',
    spec: `Trends. "use client". PageHeader eyebrow "Trends" tone gold, title "Rising this month.", subtitle "What clients are booking and creatives are shooting." Then a flex flex-col gap-3 list of TRENDS as <Card className="p-5 flex items-center justify-between"> rows: left a rank number (font-mono text-white/40, index+1 padded) + title (font-medium text-white) + an Icon name="trending" text-escrow-green; right the change in a StatusPill tone escrow (e.g. "+38%"). Wrap in .rise.`,
  },
  {
    label: 'profile',
    path: 'Z:\\grid\\src\\app\\dashboard\\profile\\page.tsx',
    spec: `Own profile — role aware. "use client". useRole(); also import { signOut } from "@/lib/auth-client" and useRouter from "next/navigation" for a "Sign out" Button (variant="ghost", onClick: await signOut(); router.push("/login")).
If role==="creator": treat CREATIVES[0] (John Hope) as "you". Layout:
 - A header Surface with: Avatar id="john" size large, name + Verified mark, "{type} · {city}", trust badges row using <TrustBadge> for "ID Verified","Top Rated","Available Today", and two MetricCards (Day rate=money(c.rate) tone cyan, Rating="4.9 ★" tone gold) — or inline metrics. Bio below.
 - SectionHeader "Portfolio" with an action; a grid (grid-cols-2 sm:grid-cols-3 gap-3) of <MediaTile tile={t} ratio="1/1" label={t.title}/> for c.portfolio.
 - SectionHeader "Media packages"; c.packages.map -> <PackageRow pkg={p}/> (no onBook).
 - SectionHeader "Reviews from clients"; (CREATIVE_REVIEWS.john||[]).map -> <ReviewCard review={r}/> in a grid md:grid-cols-2.
 - Footer row: <Button variant="ghost">Edit profile</Button> + Sign out button.
If role==="client": use MY_COMPANY. Layout:
 - Header Surface: a circular avatar showing company initial (build a simple rounded box), name, industry, two MetricCards (Rating=rating+" ★" tone gold, Jobs posted=jobs). A "Pays on time" TrustBadge if paysOnTime.
 - SectionHeader "Locations"; locations.map -> a Tag/pill row with Icon name="pin".
 - SectionHeader "Reviews from creators"; reviews.map -> <ReviewCard review={r}/>.
 - Dashboard metrics: In escrow money(METRICS.inEscrow) tone escrow, Total spent money(METRICS.totalSpent).
 - Footer: Edit company profile + Sign out.
Wrap sections in .rise with staggered delays. Keep it clean and premium.`,
  },
  {
    label: 'creative/[id]',
    path: 'Z:\\grid\\src\\app\\dashboard\\creative\\[id]\\page.tsx',
    spec: `Public creative profile + booking flow. "use client". Use useParams from "next/navigation": const { id } = useParams<{id:string}>(); const c = findCreative(id). If !c, render a centered "Creative not found" Card with a Button href="/dashboard/browse" "Back to browse".
Use useSheet(); import { BookingFlow } from "@/components/dashboard/sheets".
Layout (single column, max-w fine since shell centers):
 - A hero MediaTile of c.portfolio[0] (ratio "16/9" or a tall banner) with the name overlaid OR a Surface header with Avatar id=c.id, name + Verified, "{type} · {city}", Stars rating + "({reviews} reviews)", and the trust badges (<TrustBadge>) for verified/topRated/licensed/available as applicable. Two metrics: Day rate money(c.rate) tone cyan, Rating c.rating+" ★" tone gold.
 - Bio paragraph (text-white/65).
 - SectionHeader "Portfolio": grid grid-cols-2 sm:grid-cols-3 gap-3 of <MediaTile tile={t} ratio="1/1" label={t.title}/>.
 - SectionHeader "Packages": c.packages.map -> <PackageRow pkg={p} onBook={()=>open(<BookingFlow creative={c} pkg={p}/>)}/>.
 - If CREATIVE_REVIEWS[c.id] exists: SectionHeader "Reviews from clients" + ReviewCards (grid md:grid-cols-2).
 - A sticky-ish bottom CTA or a prominent <Button tone="green" arrow full? onClick open booking with the first package> "Book {firstName}".
Wrap in .rise. Make booking obvious and the page feel like a premium portfolio.`,
  },
];

phase('Build pages');
const results = await parallel(
  PAGES.map((p) => () =>
    agent(`${SHARED}\n\n=== YOUR PAGE: ${p.label} ===\nCreate the file at: ${p.path}\n\nSPEC:\n${p.spec}`, {
      label: `page:${p.label}`,
      phase: 'Build pages',
    }),
  ),
);

log(`Built ${results.filter(Boolean).length}/${PAGES.length} pages`);
return results.map((r, i) => `${PAGES[i].label}: ${typeof r === 'string' ? r.slice(0, 80) : 'no-output'}`);
