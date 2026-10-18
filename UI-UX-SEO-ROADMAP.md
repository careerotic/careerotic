# Careerotic UI/UX and SEO Roadmap

## Product principles
- Compact, content-first interface: reduce decorative whitespace, oversized hero blocks, excessive cards, and repeated labels. Use 12–16px page gutters on mobile, 16–24px section spacing, and 12–16px card padding unless a task needs more room.
- Keep typography readable, focus states visible, controls keyboard accessible, and touch targets comfortable. Density must not come at the cost of legibility.
- Treat the live Supabase database and existing policies as the source of truth. Do not alter database data/schema, create migrations, add grants/functions/policies, or invent capabilities as part of UI work.
- Keep exam security server-side: validate attempt ownership/token, question membership, options, deadline, and final submission on the server. Never send correct answers to an active attempt.
- Build shared UI primitives for page width, page headings, compact cards, status messages, buttons, metadata rows, breadcrumbs, and empty/error/loading states.

## Proposed design system
- Layout: one shared responsive content width; compact gutters; avoid nested cards and oversized blank regions; use grid only where it improves scanability.
- Type: one clear H1 per page, hierarchical H2/H3, body text at a readable 14–16px, compact labels at 12–13px, and stable line-height for Bangla and English.
- Surfaces: neutral backgrounds, subtle borders, restrained accent color, minimal shadows, consistent radii, and no decoration without a functional purpose.
- Interaction: clear hover/focus/disabled/saving/saved/error states; keyboard navigation; visible validation; reduced-motion support; no color-only meaning.
- Responsive: mobile-first, content-first, no horizontal overflow, controls reachable on small screens, and compact desktop layouts that use available width.

## Page-by-page UX plan
1. Home (/): concise value proposition, direct paths to question practice and published exams, useful database-backed content, clear headings and internal links. Avoid invented statistics or testimonials.
2. Question bank (/questions): compact filter/search controls, subject/topic context, readable question blocks, and answers/explanations revealed only after “Show answer”. Use real subject/topic/question records only.
3. Exams catalogue (/exams): compact list/grid of published exams, meaningful titles and descriptions, duration/question count only when confirmed by data, clear availability states, and direct exam-detail links.
4. Exam details (/exam/[slug]): concise description, duration, verified question count and marking rules, schedule only when present, clear start/resume action, and compact instructions.
5. Exam attempt (/exam/[slug]/attempt): a single continuous page containing every question and its options. Compact question sections, two-column options on larger screens, one-column on mobile, sticky compact timer/progress, per-question save status, fixed compact submit bar, and no separate question-by-question navigation flow. Persist each selection through the existing server API; restore saved answers from the server after refresh. Block submission while any answer is saving/failed or unanswered. Server remains authoritative for deadline and submission.
6. Results (/exam/[slug]/result): clear score, correct/incorrect/unanswered summary only if supported by returned result data, and concise review/explanation states. Never expose active-attempt answers.
7. Authentication and account: compact forms, explicit labels and inline validation, clear loading/errors, Supabase Auth only, no invented profile table. Show/update only information the existing auth metadata and UI support.
8. Dashboard and bookmarks/reports: prioritize useful actions and real records; meaningful empty states; no fake counts, sample records, or dead controls.
9. Shared navigation/footer: consistent active states, fewer redundant links, semantic landmarks, mobile-friendly navigation, and descriptive anchor text.

## SEO implementation plan
- Technical baseline: one canonical URL per indexable public page; unique page title and meta description; correct document language; semantic landmarks; descriptive link text; valid headings; stable readable URLs; useful not-found behavior.
- Crawl/index controls: generate sitemap.xml from public, published, database-backed content only; add robots.txt; exclude authenticated, admin, attempt, and personalized result pages from indexing; never include private/tokenized URLs in the sitemap.
- Structured data: use JSON-LD only when the visible page genuinely qualifies and all properties are grounded in actual page/database data. Consider WebSite/Organization where appropriate and BreadcrumbList for public detail pages. Do not invent ratings, reviews, dates, authors, or exam attributes.
- Content architecture: link home → question bank/exams → subject/topic or exam details; use descriptive titles and intros; avoid thin or duplicate pages; create subject/topic landing pages only if existing data supports useful, non-duplicative content.
- Performance: keep public pages server-rendered where possible; minimize client JavaScript; optimize fonts and images; avoid layout shift; paginate or filter large question lists where appropriate; measure Core Web Vitals.
- Search Console: verify domain/property, submit sitemap, monitor indexing/canonical errors, mobile usability and Core Web Vitals; inspect real query data before choosing content priorities.
- Quality gates: run lint, TypeScript, production build, route/metadata checks, accessibility checks, and responsive smoke tests before merge. Test exam persistence by selecting several answers, refreshing, confirming restoration, simulating a failed save, and verifying server-side submission behavior.

## Delivery sequence
1. Complete and verify the continuous exam-attempt redesign and noindex protection for personalized attempt pages.
2. Audit all existing routes, shared components, styles, metadata, sitemap/robots, and the live database-backed data flow.
3. Implement shared compact design primitives and apply them page by page, starting with home, questions, exams catalogue/details, results, and account/auth.
4. Add/verify technical SEO and structured data based strictly on visible, verified content.
5. Run lint, typecheck, build, security and accessibility checks; test Preview end-to-end.
6. Open one reviewable PR containing the coherent batch; merge only after checks and Preview verification. Production deploy is then checked separately.

## Acceptance criteria
- Lower visual whitespace and higher content density without reducing readability or touch usability.
- The attempt page renders every question and all options in one continuous document.
- Server persistence and refresh restoration work; save failures are visible and cannot be silently submitted.
- Correct answers remain hidden until the server-confirmed submission/result flow.
- No database schema/data/policy changes.
- Indexable pages have unique, accurate metadata; private pages are noindex; sitemap contains only canonical public pages.
- No fabricated content, statistics, SEO markup properties, or unsupported UI actions.
