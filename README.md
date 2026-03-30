# NovaCart Deployment

This repo has two valid ways to run:

- Full stack on one Node server with `backend/server.js`
- Static GitHub Pages frontend connected to a separately deployed backend

## Important note

GitHub Pages cannot run the Express backend.

- `https://sheshadri08.github.io/Ecommerce-website/` only hosts static files
- The API must run on Render, Railway, or another Node host

## Deploy the backend

1. Push the repository to GitHub.
2. In Render, choose **New +** -> **Blueprint**.
3. Select `Sheshadri08/Ecommerce-website`.
4. Render will detect `render.yaml`.
5. Set these environment variables in Render:

- `MONGODB_URI`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`

After deployment, verify:

- Storefront API health: `https://<your-render-service>.onrender.com/health`
- Admin app on backend: `https://<your-render-service>.onrender.com/admin`

## Connect GitHub Pages to the backend

The static Pages site now supports an `api` query parameter and remembers it in `localStorage`.

Example:

```text
https://sheshadri08.github.io/Ecommerce-website/?api=https://<your-render-service>.onrender.com
```

Admin example:

```text
https://sheshadri08.github.io/Ecommerce-website/admin/?api=https://<your-render-service>.onrender.com
```

Once opened once, the Pages frontend will keep using that backend URL in the browser.

## Local run

1. Create a `.env` file from `.env.example`
2. Start MongoDB locally or provide `MONGODB_URI`
3. Run:

```powershell
npm install
npm run seed
npm start
```
