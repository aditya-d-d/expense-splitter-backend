# 💸 Expense Splitter API (Splitwise Clone)

This is a backend system built using Node.js, Express, and MongoDB to help groups of people **split shared expenses fairly** and **track settlements**. Inspired by apps like **Splitwise** and **Google Pay Bill Split**.

---

## 🚀 Features

### ✅ Core Features
- Add, update, and delete expenses
- Auto-create people from expense entries
- Split expenses by percentage, exact amount, or equal share
- View all expenses with full details
- View each person’s balance (owes/owed)
- Get optimized settlement summary (who should pay whom)

### ✨ Optional Features
- Recurring transactions (e.g., rent, subscriptions)
- Expense categories (Food, Travel, Utilities, etc.)
- Category-wise spending breakdown
- Analytics: monthly summaries, top spenders/categories
- Simple web interface (optional)

---

## 🛠️ Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **Hosting**: Render / Cyclic / Railway
- **Testing Tool**: Postman

---

## 🧪 API Documentation

> Base URL: ``

### 📁 Expense Management

#### `GET /expenses`
- List all expenses

#### `POST /expenses`
Add a new expense  
**Payload:**
```json
{
  "amount": 600,
  "description": "Dinner",
  "paid_by": "Shantanu",
  "splits": [
    {"person": "Sanket", "share": 200},
    {"person": "Om", "share": 200},
    {"person": "Shantanu", "share": 200}
  ],
  "category": "Food",
  "isRecurring": false
}
