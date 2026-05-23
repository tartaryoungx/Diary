const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 8000;
const dbport = 8081;
const USER_ID = "11111111-1111-1111-1111-111111111111"

app.use(cors({
  origin: "http://127.0.0.1:5500",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type"]
}));

app.use(express.json())


let conn = null;
// MySQL Connection
const initMySQL = async () => {
  conn = await mysql.createConnection({
    host: "localhost",
    port: 3308,
    user: "root",
    password: "root",
    database: "owner_tracker",
  });
  console.log("MySQL Connected");
};

app.get("/", (req, res) => {
  res.send("Diary Backend is running");
});

app.get("/api/goals", async (req, res) => {
  try {
    const [goals] = await conn.query(
      "SELECT * FROM goals WHERE user_id = ? AND is_active = TRUE ORDER BY FIELD(category, 'Core', 'Maintain', 'Win Condition'), created_at ASC",
      [USER_ID]
    );

    res.json({
      goals,
    });
  } catch (error) {
    res.status(500).json({
      message: "Get goals failed",
      error: error.message,
    });
  }
});

app.get("/api/today", async (req, res) => {
  try {
    const [entries] = await conn.query(
      "SELECT * FROM daily_entries WHERE user_id = ? AND entry_date = CURDATE()",
      [USER_ID]
    );

    res.json({
      today: entries[0] || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Get today failed",
      error: error.message,
    });
  }
});

app.post("/api/today", async (req, res) => {
  try {
    const { diary_text, done_text } = req.body;

    if (!diary_text) {
      return res.status(400).json({
        message: "diary_text is required",
      });
    }

    const [existingEntry] = await conn.query(
      "SELECT * FROM daily_entries WHERE user_id = ? AND entry_date = CURDATE()",
      [USER_ID]
    );

    if (existingEntry.length > 0) {
      await conn.query(
        "UPDATE daily_entries SET diary_text = ?, done_text = ? WHERE user_id = ? AND entry_date = CURDATE()",
        [diary_text, done_text, USER_ID]
      );

      return res.json({
        message: "Today diary updated",
      });
    }

    await conn.query(
        "INSERT INTO daily_entries (id, user_id, entry_date, diary_text, done_text) VALUES (?, ?, CURDATE(), ?, ?)",
        [uuidv4(), USER_ID, diary_text, done_text]
    );

    res.json({
      message: "Today diary created",
    });
  } catch (error) {
    res.status(500).json({
      message: "Save today failed",
      error: error.message,
    });
  }
});

app.get("/api/entries", async (req, res) => {
  try {
    const [entries] = await conn.query(
      "SELECT * FROM daily_entries WHERE user_id = ? ORDER BY entry_date DESC",
      [USER_ID]
    );

    res.json({
      entries,
    });
  } catch (error) {
    res.status(500).json({
      message: "Get entries failed",
      error: error.message,
    });
  }
});


app.listen(port, async () => {
  await initMySQL();
  console.log(`Server started on http://localhost:${port}`);
  console.log(`Database started on http://localhost:${dbport}`);
});