# Showroom Billing & Inventory Management System

A professional, production-ready web application for automobile spare parts showrooms.

## 🏗️ Tech Stack
- **Frontend**: React (Vite) + Tailwind CSS v4 + TanStack Query + Recharts
- **Backend**: Node.js + Express.js
- **Database**: PostgreSQL (Neon)
- **Auth**: JWT + bcrypt

## 🚀 Setup Instructions

### 1. Configure Backend Database

Edit `backend/.env` and add your Neon PostgreSQL connection string:

```env
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
JWT_SECRET=your-secret-key-change-this
```

Get your free Neon DB at: https://neon.tech

### 2. Start Backend

```powershell
cd backend
npm run dev
```

Server starts at http://localhost:5000  
On first run, it will auto-create all tables and seed default admin.

### 3. Start Frontend

```powershell
cd frontend
npm run dev
```

App starts at http://localhost:5173

### 4. Login

- **Username**: `admin`
- **Password**: `Admin@123`

> ⚠️ Change the password via Settings after first login.

## 📦 Features

| Module | Features |
|---|---|
| **Dashboard** | Today/Monthly stats, Revenue charts, Top products, Recent bills |
| **Products** | CRUD, GST calculator preview, stock tracking, history log |
| **Customers** | Records, purchase history, invoice list |
| **Billing** | Real-time product search, cart, automatic GST calc, invoice generation |
| **Sales History** | Search/filter invoices, view/print, cancellation |
| **Reports** | Daily/Monthly/Yearly sales, GST breakdown, profit analysis |
| **Settings** | Shop info, logo upload, invoice prefix, terms, password change |
| **Invoice** | Professional A4 GST invoice with print support |

## 🗄️ Database

All tables are auto-created on server start:
- `users`, `settings`, `customers`, `products`
- `bills`, `bill_items`, `stock_movements`
- `inventory_history`, `activity_logs`, `invoice_sequence`

## 🔒 Security
- JWT authentication on all protected routes
- bcrypt password hashing (12 rounds)
- Rate limiting, CORS, Helmet middleware
- SQL injection protection (parameterized queries)
- Input validation on all endpoints

## 📄 Invoice Number Format
`INV/YYYY/000001` (resets each Indian Financial Year: April 1)
