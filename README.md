# NovaCart Deployment

This project is ready to be deployed from GitHub with Render.

## What works

- The Node server starts from `backend/server.js`
- The frontend is served by Express from the same app
- The deploy config already exists in `render.yaml`
- The health endpoint is available at `/health`

## Deploy from GitHub

1. Push this project to your GitHub repository:

```powershell
git add .
git commit -m "Prepare app for deployment"
git push origin main
```

2. Open Render and choose **New +** -> **Blueprint**.
3. Select your GitHub repo: `Sheshadri08/Ecommerce-website`
4. Render will detect `render.yaml` automatically.
5. Add the required environment values in Render:

- `MONGODB_URI`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`

## Important note

GitHub itself cannot host this Node/Express server directly.

- GitHub Pages only serves static files
- Render can deploy the full backend + frontend from your GitHub repo

## After deployment

- Storefront: `https://<your-render-service>.onrender.com/`
- Admin: `https://<your-render-service>.onrender.com/admin`
- Health check: `https://<your-render-service>.onrender.com/health`

## Local run

Create a `.env` file from `.env.example`, then run:

```powershell
npm install
npm start
```
