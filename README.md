# 💰 AI Budget Tracker

A modern full-stack personal finance management web application that helps users track income, expenses, budgets, savings goals, and recurring transactions. The application also provides AI-powered financial insights and secure authentication.

## 🌐 Live Demo

**Frontend:** https://budget-tracker-ai-iota.vercel.app

**Backend API:** https://budget-tracker-ai-wsgj.onrender.com/docs

---

# ✨ Features

## 🔐 Authentication

* User Registration
* Secure Login
* JWT Authentication
* Protected Routes
* User Profile
* Logout
* Forgot Password via Email (Resend)
* Secure Password Reset

---

## 💳 Transaction Management

* Add Income
* Add Expenses
* Edit Transactions
* Delete Transactions
* Category-wise Transactions
* Transaction History

---

## 📊 Budget Management

* Monthly Budgets
* Budget Status
* Budget History
* Auto Monthly Budget Generation
* Budget Recommendations

---

## 🎯 Savings Goals

* Create Goals
* Update Goals
* Delete Goals
* Goal Contributions
* Withdraw Contributions
* Progress Tracking

---

## 🔄 Recurring Transactions

* Monthly Recurring Expenses
* Automatic Transaction Processing
* Next Due Date Calculation
* Activate / Deactivate Recurring Payments

---

## 🤖 AI Financial Insights

* Spending Breakdown
* Monthly Spending Analysis
* Budget Recommendations
* Financial Insights Dashboard

---

# 🛠 Tech Stack

## Frontend

* React
* Vite
* React Router
* Axios
* Tailwind CSS
* Framer Motion
* React Toastify
* Lucide React
* Chart.js

## Backend

* FastAPI
* SQLAlchemy
* SQLite
* JWT Authentication
* Bcrypt
* Resend Email API

## AI & Data

* Pandas
* NumPy
* Scikit-learn

## Deployment

* Frontend: Vercel
* Backend: Render

---

# 📂 Project Structure

```text
budget-tracker/
│
├── frontend/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   └── context/
│
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── database/
│   │   └── templates/
│   └── requirements.txt
│
└── README.md
```

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/mahendra780/budget-tracker-ai

cd budget-tracker-ai
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

# Windows
venv\Scripts\activate

pip install -r requirements.txt

uvicorn app.main:app --reload
```

Backend runs at:

```
http://127.0.0.1:8000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

# ⚙️ Environment Variables

## Backend (.env)

```env

JWT_SECRET_KEY=your_secret_key

ACCESS_TOKEN_EXPIRE_MINUTES=1440

RESET_TOKEN_EXPIRE_MINUTES=30

RESEND_API_KEY=your_resend_api_key

EMAIL_FROM=your_verified_email

APP_URL=http://localhost:5173

CORS_ORIGIN=http://localhost:5173
```

## Frontend (.env)

```env
VITE_API_URL=http://127.0.0.1:8000
-
# 🔮 Future Improvements

* PostgreSQL Database
* Docker Support
* GitHub Actions CI/CD
* Multi-user Analytics
* Export Reports (PDF/CSV)
* Notification System
* Advanced AI Expense Prediction

---

# 👨‍💻 Author

**Mahendra Singh**

B.Tech Computer Science (Artificial Intelligence)

GitHub: https://github.com/mahendra780

LinkedIn: *Add your LinkedIn profile here.*

---

# 📄 License

This project is created for learning, portfolio, and educational purposes.
