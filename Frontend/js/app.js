async function loadToday() {
  const data = await getToday();
  renderToday(data.today);
}

async function saveToday() {
  const diaryText = document.getElementById("diaryText").value;
  const doneText = document.getElementById("doneText").value;

  const data = await saveTodayDiary(diaryText, doneText);

  renderSaveStatus(data.message);
}

async function startApp() {
  await loadToday();
}

startApp();