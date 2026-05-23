
function renderGoals(goals) {
  const goalsDiv = document.getElementById("goals");
  goalsDiv.innerHTML = "";

  const categories = {};

  goals.forEach((goal) => {
    if (!categories[goal.category]) {
      categories[goal.category] = [];
    }
    categories[goal.category].push(goal);
  });

  Object.keys(categories).forEach((category) => {
    const title = document.createElement("h3");
    title.className = "goal-category";
    title.textContent = category;
    goalsDiv.appendChild(title);

    categories[category].forEach((goal) => {
      const div = document.createElement("div");
      div.className = "goal-item";

      const createdDate = new Date(goal.created_at).toLocaleDateString("th-TH", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });

      div.innerHTML = `
        <div class="goal-title">${goal.title}</div>
        <div class="goal-desc">${goal.description || ""}</div>
        <div class="goal-date">Created: ${createdDate}</div>
      `;

      goalsDiv.appendChild(div);
    });
  });
}

function renderToday(today) {
  if (today) {
    document.getElementById("diaryText").value = today.diary_text || "";
    document.getElementById("doneText").value = today.done_text || "";
  }
}

function renderEntries(entries) {
  const entriesDiv = document.getElementById("entries");
  entriesDiv.innerHTML = "";

  entries.forEach((entry) => {
    const div = document.createElement("div");
    div.className = "history-item";

    const date = new Date(entry.entry_date).toLocaleDateString("th-TH", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    div.innerHTML = `
      <div class="history-date" onclick="toggleHistory(this)">
        ${date}
      </div>

      <div class="history-text">

        <h3>Journey</h3>
        <p>${entry.diary_text || ""}</p>

        <h3>สิ่งที่ทำสำเร็จ</h3>
        <p>${entry.done_text || ""}</p>

      </div>
    `;

    entriesDiv.appendChild(div);
  });
}

function toggleHistory(dateElement) {
  const text = dateElement.nextElementSibling;
  text.classList.toggle("show");
}

function renderSaveStatus(message) {
  document.getElementById("saveStatus").textContent = message;
}