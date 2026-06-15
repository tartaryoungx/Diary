const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
const port = 8001;
const dbport = 8081;
const USER_ID = "11111111-1111-1111-1111-111111111111"
const today = new Date().toLocaleDateString("en-CA", {
  timeZone: "Asia/Bangkok",
});

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
      "SELECT * FROM daily_entries WHERE user_id = ? AND entry_date = ?",
      [USER_ID, today]
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
      "SELECT * FROM daily_entries WHERE user_id = ? AND entry_date  = ?",
      [USER_ID, today]
    );

    if (existingEntry.length > 0) {
      await conn.query(
        "UPDATE daily_entries SET diary_text = ?, done_text = ? WHERE user_id = ? AND entry_date = ?",
        [diary_text, done_text, USER_ID, today]
      );

      return res.json({
        message: "Today diary updated",
      });
    }

    await conn.query(
        "INSERT INTO daily_entries (id, user_id, entry_date, diary_text, done_text) VALUES (?, ?, ?, ?, ?)",
        [uuidv4(), USER_ID, today, diary_text, done_text]
    );

    res.json({
      message: "Today diary created",
    });
  } catch (error) {
    console.log(error);
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
      error: error.message
    });
  }
});

// logs metric
app.get("/api/logs", async (req, res) => {
  try {
    const [rows] = await conn.query(`
      SELECT *
      FROM daily_logs
      ORDER BY log_date DESC
    `);

    res.json(rows);
  } catch (error) {
    console.error("GET /api/logs error:", error);
    res.status(500).json({
      message: "Failed to fetch logs",
      error: error.message,
    });
  }
});

app.post("/api/logs", async (req, res) => {
  try {
    const {
      log_date,
      code_score,
      people_score,
      exercise_score,
      valorant_score,
      important_score,
      note,
    } = req.body;

    const total_score =
      Number(code_score) +
      Number(people_score) +
      Number(exercise_score) +
      Number(valorant_score) +
      Number(important_score);

    await conn.query(
      `
      INSERT INTO daily_logs
      (
        log_date,
        code_score,
        people_score,
        exercise_score,
        valorant_score,
        important_score,
        total_score,
        note
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        code_score = VALUES(code_score),
        people_score = VALUES(people_score),
        exercise_score = VALUES(exercise_score),
        valorant_score = VALUES(valorant_score),
        important_score = VALUES(important_score),
        total_score = VALUES(total_score),
        note = VALUES(note)
      `,
      [
        log_date,
        code_score,
        people_score,
        exercise_score,
        valorant_score,
        important_score,
        total_score,
        note,
      ]
    );

    res.json({ message: "Log saved", total_score });
  } catch (error) {
    console.error("POST /api/logs error:", error);
    res.status(500).json({
      message: "Failed to save log",
      error: error.message,
    });
  }
});

app.delete("/api/logs/:id", async (req, res) => {
  try {
    await conn.query("DELETE FROM daily_logs WHERE id = ?", [req.params.id]);
    res.json({ message: "Log deleted" });
  } catch (error) {
    console.error("DELETE /api/logs error:", error);
    res.status(500).json({
      message: "Failed to delete log",
      error: error.message,
    });
  }
});

// timer logs
app.get("/api/timer/today", async (req, res) => {
  try {
    const [rows] = await conn.query(
      "SELECT * FROM timer_logs WHERE log_date = ?",
      [today]
    );

    res.json({
      timer: rows[0] || null,
    });
  } catch (error) {
    res.status(500).json({
      message: "Get timer log failed",
      error: error.message,
    });
  }
});

app.post("/api/timer/today", async (req, res) => {
  try {
    const {
      return_count,
      code_seconds,
      valo_seconds,
      workout_seconds,
      code_success,
      valo_success,
      workout_success,
      progressive_overload,
    } = req.body;

    await conn.query(
      `
      INSERT INTO timer_logs
      (
        log_date,
        return_count,
        code_seconds,
        valo_seconds,
        workout_seconds,
        code_success,
        valo_success,
        workout_success,
        progressive_overload
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        return_count = VALUES(return_count),
        code_seconds = VALUES(code_seconds),
        valo_seconds = VALUES(valo_seconds),
        workout_seconds = VALUES(workout_seconds),
        code_success = VALUES(code_success),
        valo_success = VALUES(valo_success),
        workout_success = VALUES(workout_success),
        progressive_overload = VALUES(progressive_overload)
      `,
      [
        today,
        return_count,
        code_seconds,
        valo_seconds,
        workout_seconds,
        code_success,
        valo_success,
        workout_success,
        progressive_overload,
      ]
    );

    res.json({
      message: "Timer log saved",
    });
  } catch (error) {
    res.status(500).json({
      message: "Save timer log failed",
      error: error.message,
    });
  }
});

app.get("/api/timer/logs", async (req, res) => {
  try {
    const [rows] = await conn.query(`
      SELECT *
      FROM timer_logs
      ORDER BY log_date DESC
    `);

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: "Get timer logs failed",
      error: error.message,
    });
  }
});

app.delete("/api/timer/logs/:id", async (req, res) => {
  try {
    await conn.query(
      "DELETE FROM timer_logs WHERE id = ?",
      [req.params.id]
    );

    res.json({
      message: "Timer log deleted",
    });
  } catch (error) {
    res.status(500).json({
      message: "Delete timer log failed",
      error: error.message,
    });
  }
});

app.listen(port, async () => {
  await initMySQL();
  console.log(`Server started on http://localhost:${port}`);
  console.log(`Database started on http://localhost:${dbport}`);
});