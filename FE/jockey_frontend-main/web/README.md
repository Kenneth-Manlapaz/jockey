# Philippine Jockey web

This is the Next.js App Router version of Philippine Jockey. The original Expo app remains at the repository root and keeps its current screens and native UI.

The web app shares the existing data seam, types, and theme tokens through the `@/` alias. Web-only routes and components live under `web/src`; routes in parentheses are route groups and do not add URL segments.

```bash
cd web
npm run dev
```

The current web pass includes the branded landing page, dashboard, sign-in and registration layouts, plus a demo webhook placeholder. The remaining native-only screens still need web page counterparts as part of the migration.
