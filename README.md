# 🍽️ Naachi Café & Multi-Restaurant QR Digital Menu, Dine-In Ordering & POS Billing System

A complete, modern, responsive, multi-restaurant web application built with **React**, **Vite**, **Tailwind CSS**, and **Firebase (Auth & Firestore)**.

Customers can scan a QR code placed on their dining table, browse the digital menu, customize orders with cooking notes, confirm their table, and submit orders directly to the kitchen. Restaurant staff and receptionists receive live incoming orders in real-time with audible notification alerts, manage kitchen preparation stages, view customer information, and print professional 80mm/58mm thermal receipts or A4 bills.

---

## 🌟 Key Features

### 📱 1. Customer Digital Menu & Ordering (`/r/:restaurantSlug`)
- **Table-Specific QR Detection**: Automatically detects table number from URL query (`?table=T01` or `?table=T04`) and displays a *"Ordering for Table 4"* banner.
- **Header**: High-resolution restaurant branding, address, opening hours, phone call trigger, and Open/Closed status indicator.
- **Horizontally Scrollable Category Bar**: Sticky category navigation with category icons and dish counts.
- **Instant Search & Dietary Filters**: Search dishes by name/description with quick filters for **All Types**, **Veg Only**, **Non-Veg**, and **Bestsellers**.
- **Dish Cards**: Food photography, Veg/Non-Veg badges, bestseller tags, prices (₹), and instant quantity stepper buttons (`[-] qty [+]`).
- **Sold-Out Handling**: Clear sold-out badge with disabled add buttons.
- **Item-Specific Notes**: Add special cooking instructions (e.g. *"Less spicy"*, *"No sugar"*, *"Extra chutney"*).
- **Sticky Bottom Cart Bar**: Shows item count, subtotal, and quick navigation (`3 Items | ₹420 | View Cart`).

### 🛒 2. Customer Cart & Validation Checkout (`/r/:restaurantSlug/cart` & `/checkout`)
- **Cart Management**: Add, update quantity, remove dishes, and review line totals.
- **Dynamic Bill Preview**: Realtime item subtotal, CGST (2.5%), SGST (2.5%), service charge, and grand total based on restaurant tax configuration.
- **Customer Information Validation**:
  - Full Customer Name (required)
  - 10-Digit Indian Mobile Number validation (`^[6-9]\d{9}$`)
  - Table selection confirmation
  - Special kitchen instructions
- **Server/Provider Price Verification**: Does not trust client-side prices blindly; recalculates totals against live menu prices and snapshots item prices at the moment of order placement.
- **Order Confirmation (`/r/:restaurantSlug/order-success/:orderId`)**:
  - Celebration confetti burst!
  - Permanent sequential order number (e.g., `ORD-1049`)
  - Current status: *"Pending confirmation"* (does not falsely display accepted before staff confirmation).
  - Itemized receipt breakdown.
  - One-click button to track live order.
- **Live Order Tracking (`/order/:orderId`)**:
  - Live progress stepper: `Placed` → `Confirmed` → `Preparing` → `Ready` → `Served` → `Completed`.

---

### 👨‍🍳 3. Staff / Receptionist / Admin Dashboard (`/admin`)
- **Secure Staff Authentication**: Email & password login powered by Firebase Auth, with one-click **Demo Account Auto-fill** (`admin@naachicafe.com` / `admin123`) and password recovery.
- **Realtime Dashboard (`/admin/dashboard`)**:
  - **Live Summary Cards**: Today's Orders, Pending Confirmations, In Kitchen, Completed, and Today's Gross Revenue (₹).
  - **Realtime Incoming Orders Stream**: Automatically updates without page refreshes when a new order arrives.
  - **Audio Notification Chimes**: Built-in dual-tone synthesizer using the Web Audio API (works reliably in any browser without external MP3 dependencies). Includes **Audio Alerts Toggle** and **Test Sound** button.
  - **Status Transitions**: One-click actions (`Accept` → `Cook` → `Ready` → `Serve` → `Complete` or `Cancel`).
  - **Order Detail Modal**: View customer phone (click to call), table number, items, cooking notes, and instant *"Generate Bill"* trigger.

---

### 🧾 4. Professional Billing & POS (`/admin/billing`)
- **Bill Calculations**: Itemized rate, quantity, line total, subtotal, discount, CGST %, SGST %, service charge %, and grand total rounded to 2 decimal places.
- **Manual Payment Recording**: Record payment methods (**Cash**, **UPI / QR**, **Card POS**, or **Other**) and payment status (**Paid in Full**, **Partial**, or **Unpaid**).
- **Printable Thermal Receipt**:
  - **80mm Thermal Receipt Layout** (Standard restaurant receipt rolls)
  - **58mm Compact Receipt Layout** (Small mobile thermal printers)
  - **Standard A4 Invoice Layout**
  - Uses `@media print` CSS: Hides website navigation, sidebars, buttons, and graphics to save ink and ensure crisp printing on thermal receipt printers.

---

### 🪑 5. Table Management & Printable QR Stands (`/admin/tables`)
- **Table CRUD**: Add, edit, and delete tables with capacity and table numbers.
- **Live Occupancy Monitoring**: Tables automatically display `Occupied (Active Order)` or `Available` based on current tickets.
- **Permanent Table QR Codes**: Generates SVG QR codes pointing to `/r/:restaurantSlug?table=T01`.
- **Download QR Code**: Download SVG files for table stickers or marketing materials.
- **Print Table Stand**: Individual table tent card format with restaurant logo and *"Scan to Order"*.
- **Print All QR Cards**: Print all restaurant table cards in a single, ready-to-cut grid.

---

### 🥗 6. Menu & Category Management (`/admin/menu` & `/admin/categories`)
- **Menu Items CRUD**: Add dishes, set prices, assign categories, and select food photography.
- **Veg / Non-Veg Indicator**: Standard green/red dot badge.
- **Bestseller & Availability Toggles**: Instant single-click toggle between `Available` and `Sold Out` that immediately reflects on the customer's menu.
- **Category CRUD**: Create and reorder categories with custom icons.

---

### 📊 7. Sales Analytics (`/admin/analytics`) & Restaurant Settings (`/admin/settings`)
- **Recharts Data Visualizations**:
  - 7-Day daily revenue trend bar chart
  - Top-selling dishes by volume
  - Payment method distribution pie chart (Cash vs UPI vs Card)
  - Kitchen & service efficiency stats
- **Restaurant Settings**:
  - Restaurant Name, Logo, Cover photo, Tagline, Address, Phone, WhatsApp, Opening Hours
  - Open/Closed toggle & Online QR orders pause switch
  - Billing settings: Currency (₹), GST rates (CGST %, SGST %), service charge %, GSTIN number, and receipt footer message

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | React 18, Vite |
| **Styling** | Tailwind CSS (Custom Cream, Forest Green, Gold, Charcoal palette) |
| **Icons** | Lucide React |
| **Routing** | React Router v6 |
| **Backend / DB** | Firebase Firestore (Realtime listeners) |
| **Authentication** | Firebase Authentication |
| **Charts** | Recharts |
| **QR Code** | qrcode.react (SVG rendering) |
| **Sound Alerts** | Web Audio API (Dual-tone synthesized chime) |
| **Dates** | date-fns |
| **Hosting** | Vercel |

---

## 🚀 Quick Start & Local Development

### 1. Clone & Install Dependencies
```bash
git clone <repo-url>
cd Restaurent
npm install
```

### 2. Start Vite Dev Server
```bash
npm run dev
```
The application will launch at `http://localhost:3000`.

### 3. Demo Credentials
If Firebase is not yet configured, the system automatically runs in **Hybrid Demo Mode** with persistent LocalStorage and cross-tab event sync:
- **Customer Menu**: `http://localhost:3000/r/naachi-cafe?table=T01`
- **Admin Portal**: `http://localhost:3000/admin/login`
- **Admin Email**: `admin@naachicafe.com`
- **Admin Password**: `admin123`
*(A convenient "Auto-fill" button is available on the login page)*

---

## 🔥 Firebase Setup Guide

To connect to your own Firebase project:

### 1. Create a Firebase Project
1. Go to the [Firebase Console](https://console.firebase.google.com/).
2. Click **Add Project** and name it (e.g., `qr-restaurant-system`).
3. Enable **Authentication** → Sign-in method → Enable **Email/Password**.
4. Enable **Cloud Firestore** → Create database in production mode.

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Fill in your credentials from **Project Settings → General → Web apps**:
```env
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=1234567890
VITE_FIREBASE_APP_ID=1:1234567890:web:...
```

### 3. Deploy Firestore Security Rules
Go to **Firestore Database → Rules** and paste the contents of `src/firebase/firestore.rules`.

---

## ☁️ Vercel Deployment

This project includes a pre-configured `vercel.json` for SPA rewrites.

### Deploying via Vercel CLI:
```bash
npm install -g vercel
vercel
```

### Deploying via Git (GitHub / GitLab):
1. Push your repository to GitHub.
2. Import the project in [Vercel Dashboard](https://vercel.com).
3. Set the Framework Preset to **Vite**.
4. Add your `VITE_FIREBASE_*` environment variables in **Settings → Environment Variables**.
5. Click **Deploy**.

---

## 📋 End-to-End Test Workflow

1. Open the Admin Dashboard in one window: `http://localhost:3000/admin/dashboard`.
2. Open the Customer Menu for Table 1 in an Incognito / Mobile window: `http://localhost:3000/r/naachi-cafe?table=T01`.
3. Notice the customer menu displays **"Ordering for Table 1"**.
4. Add **Tea** (₹12), **Chicken Biriyani** (₹180), and **Lemon Juice** (₹25) to the cart.
5. Add a special note: *"Extra lemon in juice"*.
6. Click **View Cart** → **Proceed to Checkout**.
7. Enter customer name (`Rohan Sharma`) and mobile number (`9876543210`).
8. Click **Place Order**.
9. The order is submitted, confetti bursts, and the order is marked **Pending confirmation**.
10. Notice the Admin Dashboard in the first window **instantly plays the notification chime** and displays the new order ticket!
11. Admin clicks **Accept** → **Cook** → **Ready** → **Serve** → **Generate Bill**.
12. Admin records payment (Cash/UPI) and prints the 80mm thermal receipt!
