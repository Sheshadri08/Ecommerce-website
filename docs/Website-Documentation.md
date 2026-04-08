# NovaCart Website Documentation

## Overview

NovaCart is a full-stack ecommerce website with:

- Product browsing and filtering
- Cart and checkout
- Address and payment selection during checkout
- Admin order and product management
- Customer order tracking
- GitHub Pages frontend fallback support
- Render-ready backend deployment

The project can run in two modes:

1. Full-stack mode with the frontend and backend served together from Node/Express
2. Static frontend mode on GitHub Pages with the backend hosted separately

## Project Structure

- `frontend/`
  Customer-facing storefront, cart, and order tracking pages
- `admin/`
  Admin dashboard UI for products and orders
- `backend/`
  Express API, MongoDB models, and routes
- `render.yaml`
  Render deployment blueprint
- `.env.example`
  Example local environment configuration

## Main Features

### Storefront

- Product listing with category, search, sort, and price filters
- Wishlist support
- Quick product modal
- Cart management
- Demo fallback catalog for GitHub Pages or offline frontend use

### Checkout

Customers can place orders with:

- Name
- Email
- Phone number
- Delivery address
- Payment method

Supported payment methods:

- Cash on Delivery
- UPI
- Debit / Credit Card
- Net Banking

### Order Tracking

Customers can track orders using:

- Order ID
- Customer email

Tracking works in:

- Backend mode through the public tracking API
- Demo mode through browser local storage fallback

### Admin Dashboard

The admin area includes:

- Product list and product editing
- Order list and order details
- Order status updates
- Dashboard metrics
- Low-stock overview

## Local Development

### Requirements

- Node.js
- MongoDB local instance or a MongoDB connection string

### Environment Variables

Copy `.env.example` into a `.env` file and configure:

- `PORT`
- `MONGODB_URI`
- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN_SECRET`

Current default seeded admin credentials in this repo:

- Email: `25bcaf61@kristujaynti.com`
- Password: `1234567890`

For production, change these values.

### Start Locally

```powershell
npm install
npm run seed
npm start
```

Default local URLs:

- Storefront: `http://localhost:5000/`
- Admin: `http://localhost:5000/admin`
- Health: `http://localhost:5000/health`

## Deployment

### Important Note

GitHub Pages cannot run the Express backend.

That means:

- GitHub Pages can host the static frontend
- Render, Railway, or another Node host must run the backend

### Render Deployment

This repository already includes `render.yaml`.

Render setup steps:

1. Push the repository to GitHub
2. In Render, choose `New +` -> `Blueprint`
3. Select the GitHub repository
4. Let Render detect `render.yaml`
5. Set the required environment values

Required backend values:

- `MONGODB_URI`
- `ADMIN_TOKEN_SECRET`

The current blueprint also defines:

- `ADMIN_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `PORT`
- `NODE_VERSION`

### GitHub Pages Frontend

Static frontend URL:

- `https://sheshadri08.github.io/Ecommerce-website/`

When using GitHub Pages, the frontend supports an `api` query parameter:

```text
https://sheshadri08.github.io/Ecommerce-website/?api=https://<your-render-service>.onrender.com
```

After opening it once, the frontend stores the backend URL in local storage and keeps using it.

## Customer Order Tracking

Customer order tracking page:

- `frontend/track.html`

Tracking requires:

- Order ID
- Customer email

Live tracking uses the backend route:

- `GET /api/orders/track/:id?email=<customer-email>`

## Key API Areas

### Products

- `GET /api/products`

### Orders

- `POST /api/orders`
- `GET /api/orders/track/:id`
- `PATCH /api/orders/:id/status` (admin)
- `GET /api/orders` (admin)

### Users

- `POST /api/users/login`
- `GET /api/users/bootstrap`

### Admin

- `GET /api/admin/overview`

## Demo Mode Notes

If the backend is unavailable, parts of the frontend can still work in demo mode:

- Product catalog can use a fallback dataset
- Orders can be stored in local storage
- Customer order tracking can read demo orders from local storage

This is useful for GitHub Pages previews, but it is not a substitute for the real backend.

## Security Note

The current repository includes default admin credentials for setup convenience. For any public or production deployment:

- Change the admin password
- Use a strong `ADMIN_TOKEN_SECRET`
- Use a private MongoDB connection string

## Summary

NovaCart is set up as a deployable ecommerce project with:

- A customer storefront
- Checkout with address and payment support
- Admin management tools
- Customer order tracking
- Local, demo, GitHub Pages, and Render deployment paths
