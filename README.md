# 📅 Calendly Clone

Welcome to the Calendly Clone! This is a full-stack web application designed to help you streamline scheduling by letting others book meetings or events straight into your calendar, eliminating the back-and-forth emails.

Built with a fast, modern tech stack, this app offers a buttery-smooth user experience combined with a solid, reliable backend.

---

## 🚀 Welcome Aboard!

If you've ever used scheduling software, you'll feel right at home here. We've stripped out the bloat and focused strictly on the core, MVP features that matter the most:

*   **Custom Event Types:** Create unique events (like "30 Minute Sync" or "Coffee Chat"), set custom durations, and pick personalized URL slugs.
*   **Availability Hub:** Fine-tune the days and times you're actually around. You can block out your lunch hour, take weekends off, and set different intervals for different days.
*   **Public Booking Pages:** Share your personal link and let anyone pick from your open slots on a sleek, interactive calendar. Double bookings? We've patched that—so no one can snatch a time block that's already taken.
*   **Meeting Dashboard:** Keep track of who you're meeting with and when, all in one simplified list. Need to cancel? You can do that straight from the dashboard.

---

## 🛠 Tech Stack

We're keeping things standard, modern, and lightning fast. 

*   **Frontend:** React (powered by Vite for instant hot-reloads)
*   **Backend:** Node.js & Express.js (completely migrated to modern ES6 `import`/`export` syntax)
*   **Database:** MySQL (handles our schemas, timezones, and concurrent booking locks)

---

## 🏃‍♂️ Getting Started Locally

Ready to spin this up on your own machine? It's super easy. Since everything is unified into a single workspace, you only need a couple of commands to get rolling.

### 1. Database Setup
First, make sure you have MySQL installed and running. 
*   Create a database (e.g., `calendly_schedule_db`).
*   Run the SQL scripts found in `backend/db/schema.sql` to generate the necessary tables (`users`, `event_types`, `availability_schedules`, etc.).

### 2. Environment Variables
Head into the `backend/` folder and look for the `.env.example` file. Duplicate it, rename it to `.env`, and fill in your local MySQL database credentials.
*   *Note: We usually run the backend on port `5001`. The `.env` file handles this automatically!*

### 3. Install Dependencies
We have a handy script that will install everything for the root workspace, the frontend, and the backend all at once. From the **root folder**, just run:
```bash
npm run install:all
```

### 4. Boot It Up!
No need to open multiple terminal tabs. We use `concurrently` to launch both the React UI and the Node API at exactly the same time. From the root folder, run:
```bash
npm run dev
```

That's it! Your browser should automatically pop open to `http://localhost:5173` (or whatever port Vite finds available), and your backend will quietly hum along at `http://localhost:5001`.

---

## 🐛 Troubleshooting

*   **"Address already in use" (EADDRINUSE):** Sometimes, Node processes get stuck in the background if you close your terminal abruptly. If your terminal complains that Port 5001 or 5173 is in use, just kill the stuck ports using `kill -9 $(lsof -t -i:5001)` on Mac/Linux, or restart your computer.
*   **Database Connection Errors:** Double-check that your `.env` credentials exactly match your local MySQL configuration, and ensure your local MySQL server is currently actively running.

Enjoy scheduling your meetings! Let's get building.
