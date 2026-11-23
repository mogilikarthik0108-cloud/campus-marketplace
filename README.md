# CampusCart - Smart Campus Marketplace

Full-stack web application titled **Smart Campus Marketplace with Product Exchange, Price Negotiation, and Shopping Cart Management**.

A peer-to-peer student marketplace where college students can buy, sell, exchange, and negotiate prices for textbooks, calculators, electronics, lab equipment, stationery, and other student essentials.

---

## Technology Stack

- **Frontend:** React 18, Vite, React Router 7, Tailwind CSS, Lucide Icons, Axios
- **Backend:** Node.js, Express.js, JWT Authentication, bcryptjs, Multer
- **Database:** Local MySQL (Workbench compatible) via `mysql2` pool

---

## Prerequisites

1. **Node.js** (v18 or higher)
2. **MySQL Server** (v8.0+ running locally on port 3306)

---

## 1. Database Setup

1. Open MySQL Workbench or your MySQL CLI.
2. Ensure MySQL is running on `localhost:3306`.
3. Import the database schema and sample data:
   ```bash
   mysql -u root -p < database.sql
   ```
   *(Or open `database.sql` in MySQL Workbench and execute all queries).*

The script will automatically create the database `campus_marketplace` and populate:
- 13 relational tables with primary keys, foreign keys, constraints, and indexes
- All 8 categories (Books, Electronics, Lab Equipment, Stationery, Calculators, Accessories, Sports Equipment, Other)
- 22 realistic student products with multi-image galleries
- Sample test student users and administrator account

---

## 2. Backend Setup & Run

1. Navigate to the `backend` folder:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Verify your `.env` configuration:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=YOUR_MYSQL_PASSWORD
   DB_NAME=campus_marketplace
   JWT_SECRET=campuscart_secret_key_2026_super_secure
   CLIENT_URL=http://localhost:5173
   ```
4. Start the backend server:
   ```bash
   npm run dev
   ```
   *The API will be available at `http://localhost:5000` (Health check: `http://localhost:5000/api/health`).*

---

## 3. Frontend Setup & Run

1. Open a new terminal and navigate to the `frontend` folder:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open Google Chrome and visit:
   ```
   http://localhost:5173
   ```

---

## Default Demo Accounts

| Role | Email | Password | Details |
|---|---|---|---|
| **Admin** | `admin@campuscart.edu` | `Admin@123` | Access to Admin Console, stats, user moderation, and product management |
| **Student (Seller)** | `aarav.sharma@campus.edu` | `Student@123` | Has listed engineering textbooks, mechanical keyboard, and badminton racket |
| **Student (Buyer)** | `priya.patel@campus.edu` | `Student@123` | Has listed Casio calculator, medical equipment, and bicycle |

*(You can also click the 1-click Demo buttons on the Login page).*
