# System Wide Debugging Stabilization

## Van de
- Can audit toan bo ung dung theo feature flow: auth, marketplace, cart, checkout, seller, admin, profile, API/backend.
- Ung dung co nhieu loi an, can detect/reproduce/root cause/fix/verify thay vi patch ngau nhien.

## Dieu kien ban dau
- Cac thu muc/file ECC duoc yeu cau (`skills/...`, `rules/...`, `planner.md`, `architect.md`, etc.) khong ton tai trong repo hien tai khi scan bang `rg --files`.
- Se dung fallback workflow: static scan, build/type/lint, API inspection, route inspection, DB behavior check, va chi sua khi co bang chung.

## Pham vi audit
- Frontend App Router routes under `app/`.
- Shared components under `components/`.
- Backend Express routes/controllers/services under `server/`.
- Prisma schema/seed/database behavior.
- Auth/session/RBAC/middleware.
- Marketplace, checkout, seller, admin, profile/order flows.

## Phuong phap
- Discovery: route-by-route + API-by-API scan.
- Reproduction: run typecheck/lint/build and targeted scripts where possible.
- Root cause: trace frontend -> API -> backend controller/service -> Prisma.
- Fix: scoped patches only after issue is confirmed.
- Verification: rerun relevant command/flow after each fix.

## Issue Log

### Critical
- C-001: Account orders API trusts client-provided customer ID.
  - Feature: Account order history.
  - Reproduction: Inspect `app/api/account/orders/route.ts`; route accepts `x-customer-id` and calls `listCustomerOrders(customerId)` without session validation.
  - Root cause: IDOR risk in frontend-owned API route; identity comes from client header instead of authenticated session.
  - Affected files: `app/api/account/orders/route.ts`, `app/account/orders/page.tsx`.
  - Fix plan: require `getServerSession(authOptions)` and use `session.user.id`; client no longer sends user ID.
  - Fix applied: `app/api/account/orders/route.ts` now requires `getServerSession(authOptions)` and uses `session.user.id`; `app/account/orders/page.tsx` no longer sends `x-customer-id`.
  - Verification: `npx tsc --noEmit` pass; `npm run lint` pass with existing warnings.
  - Status: Fixed.
- C-002: Checkout API accepts client-provided `customerId` for authenticated users.
  - Feature: Checkout/order creation.
  - Reproduction: Inspect `app/api/customer-orders/checkout/route.ts`; `resolveCustomerId` prefers body `customerId`.
  - Root cause: authenticated identity can be spoofed through request body.
  - Affected file: `app/api/customer-orders/checkout/route.ts`.
  - Fix plan: if session exists use `session.user.id`; only allow blank/guest fallback when unauthenticated.
  - Fix applied: `app/api/customer-orders/checkout/route.ts` now resolves customer identity from server-side session first; body `customerId` is only fallback for unauthenticated/guest checkout behavior.
  - Verification: `npx tsc --noEmit` pass; `npm run lint` pass with existing warnings.
  - Status: Fixed.
- C-003: Next API routes are configured with public cache headers.
  - Feature: API security/cache correctness.
  - Reproduction: Inspect `next.config.mjs`; `/api/:path*` receives `Cache-Control: public, s-maxage=60, stale-while-revalidate=300`.
  - Root cause: broad cache header applies to private/session APIs such as account orders, checkout, backend token, register.
  - Risk: private responses may be cached by shared/proxy caches.
  - Affected file: `next.config.mjs`.
  - Fix plan: make default API response cache header `no-store, must-revalidate`; add explicit caching only for safe public APIs later if needed.
  - Fix applied: `/api/:path*` now uses `Cache-Control: no-store, must-revalidate`.
  - Verification: `npx next build` pass; `npm run lint` pass with existing warnings.
  - Status: Fixed.

### High
- H-001: Full `npm run build` fails at `prisma generate` with `EPERM` renaming `node_modules/.prisma/client/query_engine-windows.dll.node`.
  - Reproduction: `npm run build`.
  - Evidence: Prisma generate cannot rename query engine temp file.
  - Likely root cause: Windows file lock from a running Next/backend process using Prisma Client, or locked node_modules artifact.
  - Scope: local build process, Prisma generated client artifact.
  - Verification: `npx next build` passes, so Next compile/routes are currently valid.
  - Status: Open operational blocker; should stop running Node processes or regenerate Prisma before final release build.
- H-002: Seller bulk upload POST targets missing frontend API route.
  - Feature: Seller bulk product upload.
  - Reproduction: Inspect `app/(seller)/seller/bulk-upload/page.tsx`; `handleUpload` calls `fetch("/api/bulk-upload")`.
  - Evidence: App Router has no `app/api/bulk-upload/route.ts`; backend route exists at `/api/bulk-upload` on `NEXT_PUBLIC_API_BASE_URL`.
  - Root cause: Upload flow bypasses `apiClient`, so it neither reaches Express backend nor attaches backend JWT.
  - Affected files: `app/(seller)/seller/bulk-upload/page.tsx`, `lib/api.ts`.
  - Fix plan: add FormData-capable API client method that omits JSON content type and keeps Authorization, then use it in seller bulk upload.
  - Fix applied: `lib/api.ts` now omits JSON `Content-Type` for `FormData` and exposes `postForm`; seller bulk upload now calls `apiClient.postForm("/api/bulk-upload", formData)`.
  - Verification: `npx tsc --noEmit` pass; `npm run lint` pass with existing warnings.
  - Status: Fixed.
- H-003: CSP blocks browser calls to backend API origin.
  - Feature: All client-side backend API calls through `apiClient`.
  - Reproduction: Inspect `next.config.mjs`; CSP uses `connect-src 'self'`, while `NEXT_PUBLIC_API_BASE_URL=http://localhost:5000`.
  - Root cause: frontend and backend are separate origins in development/deployment, but CSP only permits same-origin connections.
  - Affected file: `next.config.mjs`.
  - Fix plan: derive backend origin from `NEXT_PUBLIC_API_BASE_URL` and include it in `connect-src`.
  - Fix applied: `next.config.mjs` derives backend origin from `NEXT_PUBLIC_API_BASE_URL` and includes it in `connect-src`.
  - Verification: `npx next build` pass; `npx tsc --noEmit` pass after build.
  - Status: Fixed.
- H-004: Marketplace default stock filter hides most products.
  - Feature: Shop/product listing.
  - Reproduction: Inspect `app/shop/[[...slug]]/page.tsx`; when both `inStock` and `outOfStock` are true/default, it sends `filters[inStock][$lte]=1`.
  - Root cause: default "show all availability" maps to `inStock <= 1`, which only returns out-of-stock or near-empty products.
  - Affected file: `app/shop/[[...slug]]/page.tsx`.
  - Fix plan: omit stock filter when both or neither availability options are selected; use `inStock > 0` for in-stock only and `inStock = 0` for out-of-stock only.
  - Fix applied: shop page now omits stock filter for all-availability state, uses `inStock > 0` for in-stock only, and `inStock = 0` for out-of-stock only.
  - Verification: `npx tsc --noEmit` pass; `npm run lint` pass with existing warnings.
  - Status: Fixed.

### Medium
- M-001: Login page exposes unimplemented auth entry points.
  - Feature: Authentication UI.
  - Reproduction: `app/login/page.tsx` renders Google/GitHub buttons, but `lib/authOptions.ts` configures only CredentialsProvider. It also links `/forgot-password`, but no route exists.
  - Root cause: UI advertises flows not implemented in backend/auth configuration.
  - Affected file: `app/login/page.tsx`.
  - Fix plan: remove or disable unimplemented OAuth/forgot-password entry points until providers/routes exist.
  - Fix applied: removed unconfigured Google/GitHub sign-in buttons and missing forgot-password link from login page.
  - Verification: `npx tsc --noEmit` pass; `npm run lint` pass with existing warnings.
  - Status: Fixed.
- M-002: Order history image URLs can be malformed with double slash.
  - Feature: Account order history.
  - Reproduction: `app/account/orders/page.tsx` renders `src={\`/${item.productImageSnapshot}\`}`; seed/product data stores images as `/images/...`, producing `//images/...`.
  - Root cause: inconsistent image path normalization after moving product images to root-relative paths.
  - Affected file: `app/account/orders/page.tsx`.
  - Fix plan: normalize image paths before passing to `next/image`.
  - Fix applied: added `getImageSrc` normalization in account orders page before rendering order item images.
  - Verification: `npx tsc --noEmit` pass; `npm run lint` pass with existing warnings.
  - Status: Fixed.

### Low
- Pending discovery.

## Ket qua
- Inventory complete for `app/` routes and `server/` routes/controllers/services.
- `npx tsc --noEmit`: pass.
- `npm run lint`: pass with existing warnings only.
- `npx next build`: pass.
- Final `npx next build` after fixes: pass.
- Note: Running `npx tsc --noEmit` concurrently with `npx next build` can race on `.next/types`; rerun serially passed.
- Backend smoke: temporarily started Express server, verified `GET /health` returns `OK` and `GET /api/products?page=1&limit=3` returns product data, then stopped the process.
- Backend auth smoke: temporarily started Express server, verified unauthenticated `GET /api/users` and `GET /api/seller/dashboard` return 401.
- `npm run build`: blocked by Prisma file lock during `prisma generate`.
