let analyzedResults = [];
let rolesData = [];

/* ================= CLEAN TEXT ================= */
function cleanText(text) {
  if (!text) return "";

  return text
    // remove superscripts like ¹ ² ³ etc.
    .replace(/[\u00B9\u00B2\u00B3\u2070-\u2079]/g, "")
    // remove smart quotes / backticks
    .replace(/[`'’‘]/g, "")
    // normalize long dash to normal hyphen
    .replace(/[–—]/g, "-")
    // collapse extra spaces
    .replace(/\s+/g, " ")
    .trim();
}



/* ================= LOAD DATA ================= */
fetch("data/roles.json")
  .then(res => res.json())
  .then(data => rolesData = data);

/* ================= ANALYZE ================= */
function analyzeSkills() {
  const input = document.getElementById("skillsInput").value;
  if (!input) return alert("Enter skills");

  const userSkills = input.split(",").map(s => s.trim().toLowerCase());
  let results = [];

  rolesData.forEach(role => {
    let score = 0;
    let maxScore = 0;
    let skillEffectiveness = [];

    role.requiredSkills.forEach(skill => {
      maxScore += 2;
      const matched = userSkills.includes(skill.toLowerCase());
      if (matched) score += 2;
      skillEffectiveness.push({ skill, impact: "High", matched });
    });

    role.optionalSkills.forEach(skill => {
      maxScore += 1;
      const matched = userSkills.includes(skill.toLowerCase());
      if (matched) score += 1;
      skillEffectiveness.push({ skill, impact: "Medium", matched });
    });

    results.push({
      ...role,
      matchPercentage: Math.round((score / maxScore) * 100),
      skillEffectiveness
    });
  });

  results.sort((a, b) => b.matchPercentage - a.matchPercentage);
  analyzedResults = results.slice(0, 3);
  displayResults(analyzedResults);
}

/* ================= UI ================= */
function getColor(p) {
  if (p >= 75) return "#27ae60";
  if (p >= 50) return "#f39c12";
  return "#e74c3c";
}

function displayResults(results) {
  const div = document.getElementById("result");
  div.innerHTML = "";

  results.forEach(r => {
    div.innerHTML += `
      <div class="card">
        <h2>${r.role}</h2>

        <svg width="120" height="120">
          <circle cx="60" cy="60" r="50" class="bg-circle"></circle>
          <circle cx="60" cy="60" r="50" class="progress-circle"
            style="stroke:${getColor(r.matchPercentage)};
            stroke-dashoffset:${314 - (314 * r.matchPercentage) / 100}">
          </circle>
          <text x="50%" y="50%" text-anchor="middle" dy=".3em">
            ${r.matchPercentage}%
          </text>
        </svg>

        <h3>Skill Effectiveness</h3>
        <ul>
          ${r.skillEffectiveness.map(s =>
            `<li>${s.matched ? "✔️" : "❌"} ${s.skill} (${s.impact})</li>`
          ).join("")}
        </ul>

        <h3>Improvements</h3>
        <ul>${r.improvementSuggestions.map(i => `<li>${i}</li>`).join("")}</ul>

        <h3>Projects</h3>
        <ul>${r.projectIdeas.map(p => `<li>${p}</li>`).join("")}</ul>

        <p><strong>Career Tip:</strong> ${r.careerTip}</p>
      </div>
    `;
  });

  /* SALARY TABLE */
  let tableHTML = `
    <div class="salary-section">
      <h2>Salary Comparison (Top Matches)</h2>
      <table class="salary-table">
        <tr>
          <th>Role</th>
          <th>Current Salary</th>
          <th>After Skill Upgrade</th>
        </tr>
  `;

  results.forEach(r => {
    tableHTML += `
      <tr>
        <td>${r.role}</td>
        <td>${cleanText(r.salaryInsights.currentRangeIndia)}</td>
        <td>${cleanText(r.salaryInsights.higherRangeIndia)}</td>
      </tr>
    `;
  });

  tableHTML += `</table></div>`;
  div.innerHTML += tableHTML;
}

/* ================= PDF ================= */
function downloadPDF() {
  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF();

  let y = 15;
  const lh = 7;

  pdf.setFont("Helvetica", "normal");
  pdf.setFontSize(11);

  /* TITLE */
  pdf.setFont(undefined, "bold");
  pdf.text("Skill-to-Role Intelligence Report", 10, y);
  y += 12;

  analyzedResults.forEach((r, index) => {
    if (y > 260) {
      pdf.addPage();
      y = 15;
    }

    /* ROLE */
    pdf.setFont(undefined, "bold");
    pdf.text(`${index + 1}. ${r.role}`, 10, y);
    y += lh;

    pdf.setFont(undefined, "normal");
    pdf.text(`Match Percentage: ${r.matchPercentage}%`, 10, y);
    y += lh;

    /* SALARY DETAILS */
    pdf.setFont(undefined, "bold");
    pdf.text("Salary Details:", 10, y);
    y += lh;

    pdf.setFont(undefined, "normal");
    pdf.text("Current Salary (Based on Current Skills):", 12, y);
    y += lh;
    pdf.text([cleanText(r.salaryInsights.currentRangeIndia)], 16, y);
    y += lh;

    pdf.text("Potential Salary (After Skill Upgrade):", 12, y);
    y += lh;
    pdf.text([cleanText(r.salaryInsights.higherRangeIndia)], 16, y);
    y += lh;

    /* SKILLS */
    pdf.setFont(undefined, "bold");
    pdf.text("Skill Effectiveness:", 10, y);
    y += lh;

    pdf.setFont(undefined, "normal");
    r.skillEffectiveness.forEach(s => {
      pdf.text(`- ${s.skill} (${s.impact} impact)`, 12, y);
      y += 6;
    });

    /* IMPROVEMENTS */
    pdf.setFont(undefined, "bold");
    pdf.text("Improvements:", 10, y);
    y += lh;

    pdf.setFont(undefined, "normal");
    r.improvementSuggestions.forEach(i => {
      pdf.text(`- ${i}`, 12, y);
      y += 6;
    });

    /* PROJECTS */
    pdf.setFont(undefined, "bold");
    pdf.text("Projects:", 10, y);
    y += lh;

    pdf.setFont(undefined, "normal");
    r.projectIdeas.forEach(p => {
      pdf.text(`- ${p}`, 12, y);
      y += 6;
    });

    /* CAREER TIP */
    pdf.setFont(undefined, "bold");
    pdf.text("Career Tip:", 10, y);
    y += lh;

    pdf.setFont(undefined, "normal");
    pdf.text(r.careerTip, 12, y);
    y += lh + 10;
  });

  /* =========================
     SALARY COMPARISON (BOTTOM)
     ========================= */
  if (y > 240) {
    pdf.addPage();
    y = 15;
  }

  pdf.setFont(undefined, "bold");
  pdf.text("Salary Comparison (Top Roles)", 10, y);
  y += lh + 2;

  analyzedResults.forEach(r => {
    pdf.setFont(undefined, "bold");
    pdf.text(r.role, 10, y);
    y += lh;

    pdf.setFont(undefined, "normal");
   pdf.text(
  ["Current Salary: " + cleanText(r.salaryInsights.currentRangeIndia)],
  14,
  y
);

    y += lh;

    pdf.text(
  ["After Skill Upgrade: " + cleanText(r.salaryInsights.higherRangeIndia)],
  14,
  y
);

    y += lh + 4;
  });

  /* SAVE PDF — OUTSIDE LOOPS */
  pdf.save("Skill_to_Role_Report.pdf");
}
