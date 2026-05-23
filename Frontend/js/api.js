const API_URL = "http://localhost:8000";

async function getGoals() {
  const res = await fetch(`${API_URL}/api/goals`);
  return res.json();
}

async function getToday() {
  const res = await fetch(`${API_URL}/api/today`);
  return res.json();
}

async function saveTodayDiary(diaryText, doneText) {
  const res = await fetch(`${API_URL}/api/today`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      diary_text: diaryText,
      done_text: doneText,
    }),
  });

  return res.json();
}

async function getEntries() {
  const res = await fetch(`${API_URL}/api/entries`);
  return res.json();
}