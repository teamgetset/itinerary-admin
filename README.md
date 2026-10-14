# GETSET admin

The admin panel for GETSET staff: packages (details, gallery, itinerary with timelines, hotels, activities, pricing
in every currency, inclusions, SEO, PDF and publishing), branches, destinations, hotels, activities, categories,
hero slides, testimonials, global content, media library, enquiries, currencies and admin accounts.
Next.js 16, React 19, Tailwind 4.

```bash
npm install
cp .env.example .env.local    # API_URL and SITE_URL
npm run dev                   # http://localhost:3001 (the API must be running)
npm run build && npm start    # production
npm run lint && npm run typecheck && npm test
```

Production builds and servers refuse to start without valid `API_URL` and `SITE_URL` (public `https://` addresses
on Vercel); only `next dev` falls back to localhost. The check lives in `src/lib/urls.mjs`. On Vercel they also need
`ADMIN_PROXY_SECRET` (shared with the API; `src/lib/proxy-secret.mjs`), which lets the API rate-limit sign-ins per
visitor rather than per admin server.

How it talks to the API: sign-in happens in a server action; the session token is kept in an httpOnly cookie on the
admin's domain, and every API call is made from the admin's server (`src/lib/api.ts`), never from browser code.
The API checks the session and the user's role on every request.

Structure: `src/app/(admin)` pages (one generic list and form for simple content, configured in
`src/lib/resources.ts`; dedicated pages for packages, media, enquiries, content, currencies, PDFs, pricing, SEO and
the activity log), `src/components` (forms, package editor tabs, media picker).

Staff guide: [../docs/ADMIN.md](../docs/ADMIN.md).
