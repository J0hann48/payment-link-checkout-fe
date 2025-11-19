
# Payment Link Frontend – Checkout & Merchant Portal

This project is the **frontend** for the Payment Link system (USD → MXN cross-border payments).

It exposes:

- A **public checkout page** that customers open from a payment link URL.
- A simple **merchant portal** to create and manage payment links and see payment status.

The backend/API is implemented in a separate repository (e.g. `payment-link-be`).

---

## 1. Tech stack

- **React** + **TypeScript**
- **Vite** as the build tool (dev server + bundler)
- **Axios** (or `fetch`) for HTTP calls to the backend API
- **CSS / Tailwind / UI library** depending on your implementation

> If you are using CRA instead of Vite, only the scripts and env variable naming change slightly; the overall structure still applies.

---

## 2. Project structure (high-level)

Your actual structure may differ slightly, but a typical layout is:

```text
.
├─ src/
│  ├─ api/                # API clients (payment links, payments, PSP mocks)
│  ├─ components/         # Reusable UI components (inputs, buttons, layouts)
│  ├─ pages/
│  │  ├─ CheckoutPage.tsx # Public checkout by slug
│  │  ├─ LinksListPage.tsx# List payment links for a merchant
│  │  └─ CreateLinkPage.tsx
│  ├─ routes/             # Router configuration
│  ├─ hooks/              # Custom hooks (e.g. usePaymentLink, useCreateLink)
│  ├─ types/              # Shared TypeScript types (DTOs/views from backend)
│  └─ main.tsx            # App entry point
├─ index.html
├─ package.json
└─ vite.config.ts
```

The important part is that:

- There is a **“merchant area”** (dashboard) to create and list payment links.
- There is a **public route** that receives a `slug` in the URL to render the checkout screen.

---

## 3. Environment configuration

The frontend needs to know **where the backend API lives**. This is done via environment variables.

For **Vite**, create a `.env.local` (not committed) with something like:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_MERCHANT_ID=1
# optional: if you want a custom base path for checkout routes
VITE_CHECKOUT_BASE_PATH=/checkout
```

- `VITE_API_BASE_URL` – base URL for all backend calls.
- `VITE_DEFAULT_MERCHANT_ID` – convenient default merchant ID for local development.
- `VITE_CHECKOUT_BASE_PATH` – optional; used to build payment link URLs (e.g. `/checkout/{slug}`).

On **Vercel** or any other hosting, you must configure the same variables in the project settings.

---

## 4. Getting started (local)

### 4.1 Prerequisites

- Node.js **18+**
- npm, yarn or pnpm

### 4.2 Install dependencies

```bash
npm install
# o
yarn
# o
pnpm install
```

### 4.3 Configure environment

Create `.env.local` at the root of the frontend project:

```bash
VITE_API_BASE_URL=http://localhost:8080
VITE_DEFAULT_MERCHANT_ID=1
VITE_CHECKOUT_BASE_PATH=/checkout
```

Make sure the backend is running locally on the same URL you configure here.

### 4.4 Run the dev server

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
```

By default Vite runs on `http://localhost:5173`.

---

## 5. Core flows

### 5.1 Merchant portal

Main responsibilities:

- **Create payment links**
- **List payment links**
- **Inspect a specific link and its payments**

Typical backend endpoints used:

- `POST /api/payment-links` – create a new payment link.
- `GET /api/payment-links?merchantId={merchantId}` – list links for a merchant.
- `GET /api/payment-links/{id}/payments` – list payments for a given link (if implemented).

Flow:

1. The user (merchant) opens the portal (e.g. `/`).
2. The portal uses `VITE_DEFAULT_MERCHANT_ID` (or a selection control) to identify the merchant.
3. To create a new link, it calls `POST /api/payment-links` with:
   - `merchantId`, `recipientId`, `amount`, `currency`, `description`, `expiresAt`.
4. The backend responds with a `slug` and a `checkoutUrl` (which the frontend can show/copy).
5. The merchant can see all their links via a table fed by `GET /api/payment-links`.

---

### 5.2 Public checkout page

Main responsibilities:

- Load payment link details (merchant, amount, fees, FX).
- Allow the customer to enter card data.
- Tokenize card data via a **PSP mock**.
- Call the backend to process payment and show success/error states.

Routes (example):

- `/checkout/:slug` – public route.

Backend endpoints used:

1. `GET /api/public/payment-links/{slug}`  
   - To display:
     - Merchant name
     - Amount in USD
     - Fee & FX breakdown
     - Payout in MXN

2. Tokenization (PSP mocks):

   - `POST /api/psp/stripe/tokenize`  
     or
   - `POST /api/psp/adyen/tokenize`

   Request includes card number, expiry and CVC (in this mock scenario).  
   Response returns an opaque `token` + card metadata.

3. `POST /api/public/payment-links/{slug}/payments`  
   - Request body:

     ```json
     {
       "pspToken": "tok_stripe_123",
       "pspHint": "STRIPE",
       "idempotencyKey": "checkout-session-xyz-123"
     }
     ```

   - Response gives final `status` (`SUCCEEDED`/`FAILED`), PSP used, and fee/FX info.

UI states:

- **Loading** – while fetching the link.
- **Error** – link not found or expired.
- **Ready** – show form and fee breakdown.
- **Processing** – disable button while payment request is in flight.
- **Success / Failure** – final state page.

---

## 6. API integration details

The frontend shouldn’t hardcode URLs; instead:

- Use `VITE_API_BASE_URL` as a base, e.g.:

  ```ts
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const api = axios.create({
    baseURL: API_BASE_URL,
  });
  ```

- Example calls:

  ```ts
  // Get payment link for checkout
  api.get(`/api/public/payment-links/${slug}`);

  // Create payment link
  api.post("/api/payment-links", payload);

  // Process payment
  api.post(`/api/public/payment-links/${slug}/payments`, {
    pspToken,
    pspHint,
    idempotencyKey,
  });
  ```

This keeps the frontend environment-agnostic (local / staging / production).

---

## 7. Build & deployment

### 7.1 Build

```bash
npm run build
# o
yarn build
# o
pnpm build
```

Vite outputs static assets into the `dist/` folder.

### 7.2 Preview build locally (optional)

```bash
npm run preview
```

This runs a local server serving the built assets.

---

### 7.3 Deploying to Vercel

1. Push the frontend project to a Git repository (GitHub, GitLab, etc.).
2. In Vercel:
   - Create a new project and **import** the repo.
   - Set the **framework preset** to **Vite** or “Other” if needed.
3. Configure environment variables in Vercel:

   - `VITE_API_BASE_URL=https://api.payment-link-staging.your-domain.com`
   - `VITE_DEFAULT_MERCHANT_ID=1`
   - `VITE_CHECKOUT_BASE_PATH=/checkout`

4. Build settings (defaults usually work):

   - Build command: `npm run build`
   - Output directory: `dist`

5. Deploy.

After deployment:

- The merchant portal will be available at the Vercel URL root.
- The public checkout URL will be something like:

  ```text
  https://payment-link-checkout-fe.vercel.app/checkout/{slug}
  ```

Make sure the backend CORS configuration allows this origin.

---

## 8. Troubleshooting

- **I get CORS errors in the browser console**
  - Check that the backend (`payment-link-be`) is configured to allow the frontend origin.
  - Ensure `VITE_API_BASE_URL` is pointing to the correct domain (HTTP vs HTTPS, port, etc.).

- **Checkout page reloads to home instead of staying in /checkout/:slug**
  - Verify that your router is configured for **SPA routing** (e.g. Vercel rewrite) and that your `<Route path="/checkout/:slug" ...>` matches the actual URL.
  - When constructing `checkoutUrl` in the backend, make sure it matches the route pattern used by the frontend (`/checkout/{slug}`).

- **404 when opening the link**
  - Ensure the `slug` exists and matches what the backend returned.
  - Confirm that `GET /api/public/payment-links/{slug}` works via browser or Postman.

---

## 9. Related repositories

- **Backend (API & business logic)**: `payment-link-be`
- **Infrastructure (Terraform)**: `payment-link-infra`

This frontend repo is intentionally thin on business logic; the backend owns most of the domain complexity (fees, FX, PSP routing, webhooks, etc.).
