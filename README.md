# 💰 Personal Finance Tracker

A beginner-friendly, responsive web application to manage personal income, expenses, and monthly budgets. Built using **HTML5, CSS3, and vanilla JavaScript**, it helps users record transactions, monitor spending, and track their financial balance.

**🌐 Live Demo:** https://faizaanjum-shaik.github.io/personal-finance-tracker/

**💻 Source Code:** https://github.com/faizaanjum-Shaik/personal-finance-tracker No frameworks, no dependencies — just open `index.html` in your browser and start tracking.

---

## ✨ Features

| Feature | Details |
|---|---|
| **Dashboard** | Live cards for Total Income, Total Expenses, and Balance |
| **Add Transactions** | Description, amount, type (income/expense), category, and date picker |
| **Monthly Budget** | Set a budget, track spending vs. budget with colour-coded warnings |
| **Transaction History** | Shows description, category, amount, type badge, and date |
| **Edit Transactions** | Inline modal form — no browser `prompt()` dialogs |
| **Delete Transactions** | Confirmation before removal |
| **Search** | Live search by transaction description |
| **Filter** | Filter by income/expense type and category |
| **Persistent Storage** | All data saved in `localStorage` — survives page refresh |
| **Responsive Design** | Works on laptops, tablets, and mobile phones |
| **Input Validation** | Every form field is validated before saving |
| **Timezone-safe dates** | Local dates used throughout to avoid UTC offset issues |

---

## 🗂️ Project Structure

```
personal finance tracker/
├── index.html    # App markup and structure
├── style.css     # Styles and responsive layout
├── script.js     # All app logic (no external libraries)
└── README.md     # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Any modern web browser (Chrome, Firefox, Edge, Safari)
- No installation or server required

### Running the App
1. Download or clone this repository
2. Open `index.html` in your browser

That's it! Your data will be saved automatically using your browser's `localStorage`.

---

## 📸 Screenshots

> _Add screenshots of your app here after taking them._

| Dashboard | Add Transaction | Monthly Budget |
|---|---|---|
| _(screenshot)_ | _(screenshot)_ | _(screenshot)_ |

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **HTML5** | Page structure and semantic markup |
| **CSS3** | Styling, flexbox layout, responsive design |
| **Vanilla JavaScript (ES6+)** | App logic, DOM manipulation, localStorage |
| **localStorage API** | Persistent client-side data storage |

---

## 📂 Categories Supported

- 🍔 Food
- 📚 Education
- ✈️ Travel
- 🛍️ Shopping
- 💡 Bills
- 💼 Salary
- 🏥 Healthcare
- 🎬 Entertainment
- 📦 Other

---

## 📌 Notes

- Data is stored **only in your browser** using `localStorage`. Clearing browser data will remove transactions.
- No accounts, servers, or internet connection are needed.
- The monthly budget tracks **current-month expenses only**, based on the date selected for each transaction.

---

## 📄 License

This project is open-source and free to use for learning and personal use.
