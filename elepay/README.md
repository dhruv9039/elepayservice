# ⚡ ElePay - Full Stack Payment Portal & Backend

Website ko long-term bina kisi issue ke chalane ke liye iska **Production-Ready Backend Server** aur **Admin Control Panel** tayar kar diya gaya hai.

---

## 🌟 Backend Features & Architecture

### 1️⃣ Zero-Dependency Robust Backend (`server.js`)
- **Native Node.js Engine:** Node.js ke latest built-in standard library par chalta hai, jisse future me kabhi bhi npm dependencies tootne ya update hone ka jhanjhat nahi hoga.
- **Embedded SQLite Database (`data/elepay.db`):** 
  - Saare payment records, customer UIDs, UTR numbers aur dispute tickets hamesha safe rehte hain.
  - Kisi external MySQL ya MongoDB server ki zaroorat nahi hai.

### 2️⃣ Automatic Screenshot Storage (`uploads/`)
- Jab bhi koi customer problem report ke saath screenshot upload karega, backend automatically photo ko decode karke `uploads/` folder me save karega.
- Admin dashboard se aap ek click me customer ka upload kiya hua screenshot dekh sakte hain.

### 3️⃣ Admin Control Panel (`/admin`)
- **Live Statistics:** Total Collections (₹), Total Orders, Pending Verification, aur Problem Tickets.
- **Payments Management:** Har transaction ka Customer UID, Amount, Method (QR / UPI), Date & Time, aur Approve/Reject karne ke buttons.
- **Dispute & Problem Resolution:** Har complaint ka Ticket ID, Customer UID, 12-digit UTR No, 100-word samasya ka vivaran, payment screenshot aur "Mark Resolved" ka action.

---

## 🚀 Server Kaise Chalayein? (How to Start Server)

### 👉 Option A (Sabse Aasan):
- Folder me **`start_server.bat`** file par double-click karein!
- Ek command window khulegi aur server start ho jayega.

### 👉 Option B (Terminal se):
```bash
node server.js
```

---

## 🌐 Links (Server Start Hone Ke Baad)

- **Customer Website (Portal):** [http://localhost:3000](http://localhost:3000)
- **Admin Dashboard (Control Panel):** [http://localhost:3000/admin](http://localhost:3000/admin)

---

## 📁 Project Folder Structure

```text
elepay/
├── assets/             # Logo (logo.png) aur QR Code (qr-code.png)
├── data/               # SQLite Database (elepay.db)
├── uploads/            # Customer ke upload kiye huye payment screenshots
├── index.html          # Main Customer Checkout Page
├── admin.html          # Admin Dashboard (Orders & Problem tickets)
├── style.css           # Clean, Simple & Professional Theme
├── script.js           # Frontend Client Logic & API Connections
├── server.js           # Full Backend Server (REST API + Static Server)
├── package.json        # Project manifest
├── start_server.bat    # 1-Click Server Launcher
└── README.md           # Documentation
```
