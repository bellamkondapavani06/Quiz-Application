let questions = [];
let currentIndex = 0;
let score = 0;
let timer;
let timeLeft = 15;
let currentCategory = "";
let currentCategoryName = "";
let chart;

// Store stats
let stats = {};  
// { category: { attempts: X, totalScore: Y } }

const quizEl = document.getElementById("quiz");
const categoryPage = document.getElementById("category-selection");
const graphPage = document.getElementById("graph-container");
const categoryNameEl = document.getElementById("category-name");
const questionEl = document.getElementById("question");
const optionsEl = document.getElementById("options");
const timerEl = document.getElementById("timer");
const nextBtn = document.getElementById("next-btn");
const resultEl = document.getElementById("result");
const progressBar = document.getElementById("progress-bar");
const endButtons = document.getElementById("end-buttons");

document.querySelectorAll(".category-btn").forEach(btn => {
  btn.onclick = () => {
    currentCategory = btn.dataset.category;
    currentCategoryName = btn.dataset.name;
    startQuiz();
  };
});

async function startQuiz() {
  quizEl.style.display = "block";
  categoryPage.style.display = "none";
  graphPage.style.display = "none";

  categoryNameEl.textContent = "Category: " + currentCategoryName;

  currentIndex = 0;
  score = 0;
  resultEl.textContent = "";
  endButtons.style.display = "none";
  progressBar.style.width = "0%";

  questions = await fetchQuestions();
  loadQuestion();
}

async function fetchQuestions() {
  const res = await fetch(
    `https://opentdb.com/api.php?amount=10&category=${currentCategory}&type=multiple`
  );
  const data = await res.json();

  return data.results.map(q => ({
    question: decode(q.question),
    correct: decode(q.correct_answer),
    options: shuffle([
      ...q.incorrect_answers.map(decode),
      decode(q.correct_answer)
    ])
  }));
}

function decode(str) {
  const txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}

function loadQuestion() {
  clearInterval(timer);
  timeLeft = 15;
  timerEl.textContent = `Time: ${timeLeft}s`;
  optionsEl.innerHTML = "";
  nextBtn.style.display = "none";

  progressBar.style.width = `${(currentIndex / 10) * 100}%`;

  const q = questions[currentIndex];
  questionEl.textContent = `Q${currentIndex + 1}. ${q.question}`;

  q.options.forEach(opt => {
    const li = document.createElement("li");
    li.textContent = opt;
    li.onclick = () => selectOption(li, q.correct);
    optionsEl.appendChild(li);
  });

  timer = setInterval(() => {
    timeLeft--;
    timerEl.textContent = `Time: ${timeLeft}s`;
    if (timeLeft === 0) {
      clearInterval(timer);
      showCorrect(q.correct);
      nextBtn.style.display = "inline";
    }
  }, 1000);
}

function selectOption(el, correct) {
  clearInterval(timer);

  if (el.textContent === correct) {
    score++;
    el.style.background = "green";
  } else {
    el.style.background = "red";
    showCorrect(correct);
  }

  document.querySelectorAll("#options li").forEach(li => li.onclick = null);
  nextBtn.style.display = "inline";
}

function showCorrect(correct) {
  document.querySelectorAll("#options li").forEach(li => {
    if (li.textContent === correct) {
      li.style.background = "green";
    }
  });
}

nextBtn.onclick = () => {
  currentIndex++;
  if (currentIndex < 10) loadQuestion();
  else finishQuiz();
};

function finishQuiz() {
  quizEl.style.display = "block";
  questionEl.textContent = "";
  optionsEl.innerHTML = "";
  timerEl.textContent = "";
  progressBar.style.width = "100%";

  resultEl.textContent = `Score: ${score}/10`;
  endButtons.style.display = "block";

  // Update stats
  if (!stats[currentCategoryName]) {
    stats[currentCategoryName] = { attempts: 0, totalScore: 0 };
  }
  stats[currentCategoryName].attempts++;
  stats[currentCategoryName].totalScore += score;

  updateGraph();
}

document.getElementById("restart-btn").onclick = startQuiz;

document.getElementById("back-btn").onclick = () => {
  quizEl.style.display = "none";
  categoryPage.style.display = "block";
};

document.getElementById("view-graph-btn").onclick = () => {
  categoryPage.style.display = "none";
  graphPage.style.display = "block";
  updateGraph();
};

document.getElementById("back-from-graph").onclick = () => {
  graphPage.style.display = "none";
  categoryPage.style.display = "block";
};

function updateGraph() {
  const labels = Object.keys(stats);
  const attempts = labels.map(l => stats[l].attempts);
  const avgScores = labels.map(
    l => (stats[l].totalScore / stats[l].attempts) * 10
  );

  if (chart) chart.destroy();

  chart = new Chart(document.getElementById("attemptChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Attempts",
          data: attempts,
          backgroundColor: "rgba(54,162,235,0.7)"
        },
        {
          label: "Avg Score %",
          data: avgScores,
          backgroundColor: "rgba(255,99,132,0.7)"
        }
      ]
    },
    options: {
      scales: {
        y: { beginAtZero: true }
      }
    }
  });
}
