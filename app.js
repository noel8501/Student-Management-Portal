const STORAGE_KEY = "student-portal-records-v3";
const REVIEW_KEY = "student-portal-reviews-v1";
const BUS_KEY = "student-portal-bus-v1";
const FEE_KEY = "student-portal-fees-v1";
const EXAM_KEY = "student-portal-exams-v1";

const seed = [
  {username:"stu1001",password:"student123",name:"Aisha Patel",course:"Computer Science",grade:"Grade 10",guardian:"Ravi Patel",phone:"Not provided",email:"aisha@example.edu",marks:{Math:88,English:91,Science:84},attendance:96,route:"Route A"},
  {username:"stu1002",password:"student123",name:"Daniel Kim",course:"Business Studies",grade:"Grade 10",guardian:"Min Kim",phone:"Not provided",email:"daniel@example.edu",marks:{Math:78,English:86,Science:81},attendance:89,route:"Route B"},
  {username:"stu1003",password:"student123",name:"Maya Johnson",course:"Graphic Design",grade:"Grade 10",guardian:"Ava Johnson",phone:"Not provided",email:"maya@example.edu",marks:{Math:92,English:87,Science:90},attendance:98,route:"Route A"}
];

const $ = (selector) => document.querySelector(selector);

function load(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : structuredClone(fallback);
  } catch {
    return structuredClone(fallback);
  }
}

let students = load(STORAGE_KEY, seed);
let reviews = load(REVIEW_KEY, []);
let busLog = load(BUS_KEY, {});
let fees = load(FEE_KEY, [
  {id:"FEE-1001",username:"stu1001",term:"Term 1 tuition",due:1200,paid:800,dueDate:"2026-12-15"},
  {id:"FEE-1002",username:"stu1002",term:"Term 1 tuition",due:1200,paid:1200,dueDate:"2026-12-15"},
  {id:"FEE-1003",username:"stu1003",term:"Term 1 tuition",due:1200,paid:600,dueDate:"2026-12-15"}
]);
let exams = load(EXAM_KEY, [
  {id:"midterm",name:"Mid-term Examination",description:"Term 1 assessment",slots:[
    {date:"2026-12-02",subject:"Mathematics",start:"09:00",end:"12:00",room:"Hall A"},
    {date:"2026-12-04",subject:"English",start:"09:00",end:"12:00",room:"Hall A"},
    {date:"2026-12-07",subject:"Science",start:"09:00",end:"12:00",room:"Lab 1"}
  ]},
  {id:"final",name:"Final Examination",description:"End-of-term assessment",slots:[
    {date:"2027-03-02",subject:"Mathematics",start:"09:00",end:"12:00",room:"Hall A"},
    {date:"2027-03-04",subject:"English",start:"09:00",end:"12:00",room:"Hall A"},
    {date:"2027-03-07",subject:"Science",start:"09:00",end:"12:00",room:"Lab 1"}
  ]}
]);

let currentUser = (() => {
  try { return JSON.parse(sessionStorage.getItem("campusflow-user")); }
  catch { return null; }
})();

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  localStorage.setItem(REVIEW_KEY, JSON.stringify(reviews));
  localStorage.setItem(BUS_KEY, JSON.stringify(busLog));
  localStorage.setItem(FEE_KEY, JSON.stringify(fees));
  localStorage.setItem(EXAM_KEY, JSON.stringify(exams));
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[char]);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function recordFor(student, date = today()) {
  busLog[date] ||= {};
  busLog[date][student.username] ||= {
    pickup:"Not recorded", dropoff:"Not recorded", note:""
  };
  return busLog[date][student.username];
}

function syncUser() {
  if (currentUser?.role === "student") {
    const student = students.find((item) => item.username === currentUser.username);
    if (student) currentUser = {role:"student", ...student};
  }
}

function renderPortal() {
  syncUser();
  const teacher = currentUser.role === "teacher";
  const savedPhoto = localStorage.getItem(`photo-${currentUser.username}`) || "";

  $("#welcome-title").textContent = teacher ? "Teacher dashboard" : "Student dashboard";
  $("#welcome-name").textContent = `Welcome, ${currentUser.name}`;
  $("#role-label").textContent = teacher ? "TEACHER PORTAL" : "STUDENT PORTAL";
  $("#welcome-text").textContent = teacher
    ? "Manage student details, learning progress and daily bus attendance."
    : "Here are your academic and transport records.";

  $("#teacher-records").hidden = !teacher;
  $("#student-record").hidden = teacher;
  $("#teacher-bus").hidden = !teacher;
  $("#student-bus").hidden = teacher;
  $("#review-form").hidden = teacher;
  $("#teacher-fees").hidden = !teacher;
  $("#student-fees").hidden = teacher;
  $("#add-exam").hidden = !teacher;
  $("#edit-exam").hidden = !teacher;
  $("#add-exam-slot").hidden = !teacher;
  $("#exam-action-heading").hidden = !teacher;

  $("#permission-note").textContent = teacher
    ? "Edit student profiles and academic records here."
    : "Your academic records are read-only.";

  $("#stat-one-label").textContent = teacher ? "Students" : "Your course";
  $("#stat-one").textContent = teacher ? students.length : currentUser.course;
  $("#stat-two-label").textContent = teacher ? "Average class attendance" : "Class attendance";
  $("#stat-two").textContent = teacher
    ? `${students.length ? Math.round(students.reduce((sum, item) => sum + Number(item.attendance || 0), 0) / students.length) : 0}%`
    : `${currentUser.attendance}%`;
  $("#stat-three-label").textContent = teacher ? "Messages received" : "Your marks average";
  $("#stat-three").textContent = teacher
    ? reviews.length
    : `${Math.round(Object.values(currentUser.marks || {}).reduce((a, b) => a + Number(b), 0) / Math.max(1, Object.keys(currentUser.marks || {}).length))}%`;

  const initials = currentUser.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  $("#profile-initials").textContent = initials;
  $("#profile-image").hidden = !savedPhoto;
  $("#profile-initials").hidden = Boolean(savedPhoto);
  if (savedPhoto) $("#profile-image").src = savedPhoto;

  renderProfile();
  if (teacher) {
    renderTeacherTable();
    renderBusTable();
    renderFees();
  } else {
    renderStudentRecord();
    renderStudentBus();
    renderFees();
  }
  renderExams();
  renderReviews();
}

function renderTeacherTable() {
  const query = $("#student-search").value.trim().toLowerCase();
  const shown = students.filter((student) =>
    `${student.name} ${student.username} ${student.course}`.toLowerCase().includes(query)
  );

  $("#student-rows").innerHTML = shown.length
    ? shown.map((student) => {
      const bus = recordFor(student);
      return `<tr>
        <td><strong>${escapeHTML(student.name)}</strong><br>${escapeHTML(student.username)} · ${escapeHTML(student.course)}</td>
        <td>${Number(student.marks.Math) || 0}%</td>
        <td>${Number(student.marks.English) || 0}%</td>
        <td>${Number(student.marks.Science) || 0}%</td>
        <td>${Number(student.attendance) || 0}%</td>
        <td><span class="status-pill ${bus.pickup === "Boarded" ? "" : "out"}">${escapeHTML(bus.pickup)}</span></td>
        <td><div class="inline-actions">
          <button class="button secondary" data-edit="${escapeHTML(student.username)}">Edit</button>
          <button class="button secondary" data-delete="${escapeHTML(student.username)}">Remove</button>
        </div></td>
      </tr>`;
    }).join("")
    : `<tr><td colspan="7" class="muted">No matching students.</td></tr>`;

  document.querySelectorAll("[data-edit]").forEach((button) =>
    button.addEventListener("click", () => openStudentEditor(button.dataset.edit))
  );
  document.querySelectorAll("[data-delete]").forEach((button) =>
    button.addEventListener("click", () => removeStudent(button.dataset.delete))
  );
}

function openStudentEditor(username) {
  const student = students.find((item) => item.username === username);
  $("#student-dialog-title").textContent = student ? "Edit student" : "Add student";
  $("#edit-original-id").value = student?.username || "";
  $("#edit-name").value = student?.name || "";
  $("#edit-id").value = student?.username || "";
  $("#edit-id").disabled = Boolean(student);
  $("#edit-course").value = student?.course || "";
  $("#edit-grade").value = student?.grade || "";
  $("#edit-guardian").value = student?.guardian || "";
  $("#edit-phone").value = student?.phone || "";
  $("#edit-email").value = student?.email || "";
  $("#edit-route").value = student?.route || "";
  $("#edit-math").value = student?.marks.Math ?? 0;
  $("#edit-english").value = student?.marks.English ?? 0;
  $("#edit-science").value = student?.marks.Science ?? 0;
  $("#edit-attendance").value = student?.attendance ?? 0;
  $("#student-form-message").textContent = "";
  $("#student-dialog").showModal();
}

function renderStudentEditorSubmit(event) {
  event.preventDefault();
  const original = $("#edit-original-id").value;
  const id = $("#edit-id").value.trim().toLowerCase();
  const name = $("#edit-name").value.trim();
  const course = $("#edit-course").value.trim();
  const route = $("#edit-route").value.trim() || "Unassigned";

  if (!original && students.some((student) => student.username === id)) {
    $("#student-form-message").textContent = "That student ID already exists.";
    return;
  }

  const entry = {
    username: original || id,
    password: students.find((student) => student.username === original)?.password || "student123",
    name,
    course,
    grade: $("#edit-grade").value.trim() || "Not set",
    guardian: $("#edit-guardian").value.trim() || "Not provided",
    phone: $("#edit-phone").value.trim() || "Not provided",
    email: $("#edit-email").value.trim() || "Not provided",
    route,
    marks: {
      Math: Number($("#edit-math").value),
      English: Number($("#edit-english").value),
      Science: Number($("#edit-science").value)
    },
    attendance: Number($("#edit-attendance").value)
  };

  if (original) students = students.map((student) => student.username === original ? entry : student);
  else students.push(entry);

  save();
  $("#student-dialog").close();
  renderPortal();
}

function removeStudent(username) {
  students = students.filter((student) => student.username !== username);
  save();
  renderPortal();
}

function renderStudentRecord() {
  const student = currentUser;
  $("#student-record").innerHTML = `
    <div class="table-wrap"><table>
      <thead><tr><th>SUBJECT</th><th>MARK</th></tr></thead>
      <tbody>${Object.entries(student.marks).map(([subject, mark]) =>
        `<tr><td>${escapeHTML(subject)}</td><td>${Number(mark)}%</td></tr>`
      ).join("")}</tbody>
    </table></div>
    <p><strong>Student ID:</strong> ${escapeHTML(student.username)}
      &nbsp; <strong>Course:</strong> ${escapeHTML(student.course)}
      &nbsp; <strong>Attendance:</strong> ${Number(student.attendance)}%</p>`;
}

function renderBusTable() {
  const date = $("#bus-date").value || today();
  const data = busLog[date] || {};
  let boarded = 0;

  $("#bus-rows").innerHTML = students.map((student) => {
    const record = data[student.username] || {
      pickup:"Not recorded", dropoff:"Not recorded", note:""
    };
    if (record.pickup === "Boarded") boarded++;

    return `<tr>
      <td><strong>${escapeHTML(student.name)}</strong><br>${escapeHTML(student.username)}</td>
      <td>${escapeHTML(student.route || "Unassigned")}</td>
      <td><span class="status-pill ${record.pickup === "Boarded" ? "" : "out"}">${escapeHTML(record.pickup)}</span></td>
      <td><span class="status-pill ${record.dropoff === "Dropped off" ? "" : "out"}">${escapeHTML(record.dropoff)}</span></td>
      <td>${escapeHTML(record.note || "—")}</td>
      <td><div class="inline-actions">
        <button class="button secondary" data-bus="${escapeHTML(student.username)}" data-kind="pickup">${record.pickup === "Boarded" ? "Undo pickup" : "Mark pickup"}</button>
        <button class="button secondary" data-bus="${escapeHTML(student.username)}" data-kind="dropoff">${record.dropoff === "Dropped off" ? "Undo drop-off" : "Mark drop-off"}</button>
      </div></td>
    </tr>`;
  }).join("") || `<tr><td colspan="6" class="muted">No student records yet.</td></tr>`;

  $("#bus-summary").textContent = `${boarded} of ${students.length} students marked as boarded on ${date}.`;

  document.querySelectorAll("[data-bus]").forEach((button) => {
    button.addEventListener("click", () => {
      const record = recordFor(students.find((student) => student.username === button.dataset.bus), date);
      if (button.dataset.kind === "pickup") {
        record.pickup = record.pickup === "Boarded" ? "Not recorded" : "Boarded";
      } else {
        record.dropoff = record.dropoff === "Dropped off" ? "Not recorded" : "Dropped off";
      }
      save();
      renderBusTable();
    });
  });
}

function renderStudentBus() {
  const record = recordFor(currentUser);
  $("#student-bus").innerHTML = `
    <div class="student-bus-card">
      <p><strong>Route:</strong> ${escapeHTML(currentUser.route || "Unassigned")}</p>
      <p><strong>Pickup:</strong> <span class="status-pill ${record.pickup === "Boarded" ? "" : "out"}">${escapeHTML(record.pickup)}</span></p>
      <p><strong>Drop-off:</strong> <span class="status-pill ${record.dropoff === "Dropped off" ? "" : "out"}">${escapeHTML(record.dropoff)}</span></p>
      <p class="muted">Today · ${new Date().toLocaleDateString()}</p>
    </div>`;
}

function renderReviews() {
  const visible = currentUser.role === "teacher"
    ? reviews
    : reviews.filter((review) => review.username === currentUser.username);

  $("#review-list").innerHTML = visible.length
    ? visible.map((review) => `
      <article class="review-item">
        <strong>${escapeHTML(review.name)} · ${escapeHTML(review.date)}</strong>
        <p>${escapeHTML(review.text)}</p>
      </article>`).join("")
    : `<p class="muted">No messages yet.</p>`;
}

function renderProfile() {
  const user = currentUser;
  const entries = user.role === "teacher"
    ? [["Name", user.name], ["Access", "Teacher / administrator"]]
    : [
      ["Full name", user.name], ["Student ID", user.username],
      ["Course", user.course], ["Grade", user.grade || "Not set"],
      ["Parent / guardian", user.guardian || "Not provided"],
      ["Contact number", user.phone || "Not provided"],
      ["Email", user.email || "Not provided"],
      ["Bus route", user.route || "Unassigned"]
    ];

  $("#profile-details-content").innerHTML = entries.map(([label, value]) => `
    <div class="profile-detail"><span>${escapeHTML(label)}</span><strong>${escapeHTML(value)}</strong></div>
  `).join("");
}

function currency(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

function feeStatus(fee) {
  const balance = Math.max(0, Number(fee.due) - Number(fee.paid));
  return balance === 0 ? "Paid" : Number(fee.paid) > 0 ? "Part paid" : "Unpaid";
}

function renderFees() {
  if (currentUser.role === "teacher") {
    $("#fee-rows").innerHTML = fees.length
      ? fees.map((fee) => {
        const student = students.find((item) => item.username === fee.username);
        return `<tr>
          <td>${escapeHTML(student?.name || fee.username)}</td>
          <td>${escapeHTML(fee.term)}</td>
          <td>${currency(fee.due)}</td><td>${currency(fee.paid)}</td>
          <td>${currency(Math.max(0, fee.due - fee.paid))}</td>
          <td>${escapeHTML(fee.dueDate)}</td>
          <td><span class="status-pill ${feeStatus(fee) === "Paid" ? "" : "out"}">${feeStatus(fee)}</span></td>
          <td><div class="inline-actions">
            <button class="button secondary" data-fee-edit="${escapeHTML(fee.id)}">Edit</button>
            <button class="button secondary" data-fee-delete="${escapeHTML(fee.id)}">Remove</button>
          </div></td>
        </tr>`;
      }).join("")
      : `<tr><td colspan="8" class="muted">No fee records. Add a fee record to begin.</td></tr>`;

    const balance = fees.reduce((sum, fee) => sum + Math.max(0, fee.due - fee.paid), 0);
    $("#fee-summary").textContent = `Outstanding balance across students: ${currency(balance)}`;

    document.querySelectorAll("[data-fee-edit]").forEach((button) =>
      button.onclick = () => openFeeEditor(button.dataset.feeEdit)
    );
    document.querySelectorAll("[data-fee-delete]").forEach((button) =>
      button.onclick = () => {
        fees = fees.filter((fee) => fee.id !== button.dataset.feeDelete);
        save();
        renderFees();
      }
    );
  } else {
    const ownFees = fees.filter((fee) => fee.username === currentUser.username);
    const balance = ownFees.reduce((sum, fee) => sum + Math.max(0, fee.due - fee.paid), 0);
    $("#fee-summary").textContent = `Your outstanding balance: ${currency(balance)}`;

    $("#student-fees").innerHTML = ownFees.length
      ? `<div class="table-wrap"><table>
        <thead><tr><th>FEE / TERM</th><th>AMOUNT DUE</th><th>PAID</th><th>BALANCE</th><th>DUE DATE</th><th>STATUS</th></tr></thead>
        <tbody>${ownFees.map((fee) => `
          <tr><td>${escapeHTML(fee.term)}</td><td>${currency(fee.due)}</td>
            <td>${currency(fee.paid)}</td><td>${currency(Math.max(0, fee.due - fee.paid))}</td>
            <td>${escapeHTML(fee.dueDate)}</td>
            <td><span class="status-pill ${feeStatus(fee) === "Paid" ? "" : "out"}">${feeStatus(fee)}</span></td>
          </tr>`).join("")}</tbody>
      </table></div>`
      : `<p class="muted">No fee records have been added for your account.</p>`;
  }
}

function openFeeEditor(id) {
  const fee = fees.find((item) => item.id === id);
  $("#fee-dialog-title").textContent = fee ? "Edit fee record" : "Add fee record";
  $("#fee-original-id").value = fee?.id || "";
  $("#fee-student").innerHTML = students.map((student) =>
    `<option value="${escapeHTML(student.username)}">${escapeHTML(student.name)} (${escapeHTML(student.username)})</option>`
  ).join("");
  $("#fee-student").value = fee?.username || students[0]?.username || "";
  $("#fee-term").value = fee?.term || "";
  $("#fee-due").value = fee?.due ?? "";
  $("#fee-paid").value = fee?.paid ?? 0;
  $("#fee-date").value = fee?.dueDate || today();
  $("#fee-form-message").textContent = "";
  $("#fee-dialog").showModal();
}

function renderExams() {
  const select = $("#exam-select");
  const current = select.value;
  select.innerHTML = exams.map((exam) =>
    `<option value="${escapeHTML(exam.id)}">${escapeHTML(exam.name)}</option>`
  ).join("");
  if (exams.some((exam) => exam.id === current)) select.value = current;

  const exam = exams.find((item) => item.id === select.value);
  $("#exam-description").textContent = exam?.description || "Select an exam to view its schedule.";
  const slots = (exam?.slots || []).slice().sort((a, b) => a.date.localeCompare(b.date));

  $("#exam-rows").innerHTML = slots.length
    ? slots.map((slot, index) => `
      <tr>
        <td>${escapeHTML(slot.date)}</td>
        <td>${escapeHTML(new Date(`${slot.date}T12:00:00`).toLocaleDateString(undefined, {weekday:"long"}))}</td>
        <td>${escapeHTML(slot.subject)}</td>
        <td>${escapeHTML(slot.start)}–${escapeHTML(slot.end)}</td>
        <td>${escapeHTML(slot.room)}</td>
        ${currentUser.role === "teacher" ? `<td><div class="inline-actions">
          <button class="button secondary" data-slot-edit="${index}">Edit</button>
          <button class="button secondary" data-slot-delete="${index}">Remove</button>
        </div></td>` : ""}
      </tr>`).join("")
    : `<tr><td colspan="6" class="muted">No subjects scheduled for this exam yet.</td></tr>`;

  if (currentUser.role === "teacher") {
    document.querySelectorAll("[data-slot-edit]").forEach((button) =>
      button.onclick = () => openSlotEditor(Number(button.dataset.slotEdit))
    );
    document.querySelectorAll("[data-slot-delete]").forEach((button) =>
      button.onclick = () => {
        exam.slots.splice(Number(button.dataset.slotDelete), 1);
        save();
        renderExams();
      }
    );
  }
}

function openStudentEditorSubmit(event) {
  event.preventDefault();
  const original = $("#edit-original-id").value;
  const id = $("#edit-id").value.trim().toLowerCase();
  const name = $("#edit-name").value.trim();
  const course = $("#edit-course").value.trim();
  const route = $("#edit-route").value.trim() || "Unassigned";

  if (!original && students.some((student) => student.username === id)) {
    $("#student-form-message").textContent = "That student ID already exists.";
    return;
  }

  const entry = {
    username: original || id,
    password: students.find((student) => student.username === original)?.password || "student123",
    name, course,
    grade: $("#edit-grade").value.trim() || "Not set",
    guardian: $("#edit-guardian").value.trim() || "Not provided",
    phone: $("#edit-phone").value.trim() || "Not provided",
    email: $("#edit-email").value.trim() || "Not provided",
    route,
    marks: {
      Math: Number($("#edit-math").value),
      English: Number($("#edit-english").value),
      Science: Number($("#edit-science").value)
    },
    attendance: Number($("#edit-attendance").value)
  };

  if (original) students = students.map((student) => student.username === original ? entry : student);
  else students.push(entry);

  save();
  $("#student-dialog").close();
  renderPortal();
}

function openFeeSubmit(event) {
  event.preventDefault();
  const oldId = $("#fee-original-id").value;
  const due = Number($("#fee-due").value);
  const paid = Number($("#fee-paid").value);

  if (paid > due) {
    $("#fee-form-message").textContent = "Amount paid cannot be greater than the amount due.";
    return;
  }

  const fee = {
    id: oldId || `FEE-${Date.now()}`,
    username: $("#fee-student").value,
    term: $("#fee-term").value.trim(),
    due,
    paid,
    dueDate: $("#fee-date").value
  };

  fees = oldId ? fees.map((item) => item.id === oldId ? fee : item) : [...fees, fee];
  save();
  $("#fee-dialog").close();
  renderFees();
}

function openExamSubmit(event) {
  event.preventDefault();
  const id = $("#exam-original").value;
  const name = $("#exam-name").value.trim();

  if (exams.some((exam) => exam.name.toLowerCase() === name.toLowerCase() && exam.id !== id)) {
    $("#exam-form-message").textContent = "An exam with that name already exists.";
    return;
  }

  if (id) {
    const exam = exams.find((item) => item.id === id);
    exam.name = name;
    exam.description = $("#exam-desc").value.trim();
  } else {
    exams.push({id:`exam-${Date.now()}`,name,description:$("#exam-desc").value.trim(),slots:[]});
  }

  save();
  $("#exam-dialog").close();
  renderExams();
}

function openSlotEditor(index) {
  const exam = exams.find((item) => item.id === $("#exam-select").value);
  const slot = Number.isInteger(index) ? exam?.slots[index] : null;

  $("#slot-dialog-title").textContent = slot ? "Edit timetable item" : "Add subject";
  $("#slot-original").value = slot ? String(index) : "";
  $("#slot-date").value = slot?.date || "";
  $("#slot-subject").value = slot?.subject || "";
  $("#slot-start").value = slot?.start || "09:00";
  $("#slot-end").value = slot?.end || "12:00";
  $("#slot-room").value = slot?.room || "";
  $("#slot-form-message").textContent = "";
  $("#slot-dialog").showModal();
}

function openSlotSubmit(event) {
  event.preventDefault();
  const exam = exams.find((item) => item.id === $("#exam-select").value);
  if (!exam) {
    $("#slot-form-message").textContent = "Add an exam first.";
    return;
  }

  const item = {
    date: $("#slot-date").value,
    subject: $("#slot-subject").value.trim(),
    start: $("#slot-start").value,
    end: $("#slot-end").value,
    room: $("#slot-room").value.trim()
  };
  const index = $("#slot-original").value;

  if (item.end <= item.start) {
    $("#slot-form-message").textContent = "End time must be later than start time.";
    return;
  }

  if (index !== "") exam.slots[Number(index)] = item;
  else exam.slots.push(item);

  save();
  $("#slot-dialog").close();
  renderExams();
}

function editOrRemoveSetup() {
  $("#student-search").addEventListener("input", renderTeacherTable);
  $("#add-student").addEventListener("click", () => openStudentEditor());
  $("#student-form").addEventListener("submit", openStudentEditorSubmit);
  $("#bus-date").value = today();
  $("#bus-date").addEventListener("change", renderBusTable);
  $("#review-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const text = $("#review-text").value.trim();
    if (!text) return;
    reviews.unshift({
      username:currentUser.username,
      name:currentUser.name,
      date:new Date().toLocaleDateString(),
      text
    });
    save();
    $("#review-text").value = "";
    renderReviews();
  });
  $("#photo-input").addEventListener("change", (event) => {
    const file = event.target.files[0];
    if (!file || !currentUser) return;
    if (!file.type.startsWith("image/") || file.size > 1500000) {
      $("#login-message").textContent = "Choose an image smaller than 1.5 MB.";
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem(`photo-${currentUser.username}`, reader.result);
      $("#profile-image").src = reader.result;
      $("#profile-image").hidden = false;
      $("#profile-initials").hidden = true;
    };
    reader.readAsDataURL(file);
  });
  $("#logout-button").addEventListener("click", () => {
    sessionStorage.removeItem("campusflow-user");
    location.href = "signin.html";
  });
  document.querySelectorAll("[data-close]").forEach((button) =>
    button.addEventListener("click", () => $(`#${button.dataset.close}`).close())
  );
  $("#add-fee").addEventListener("click", () => openFeeEditor());
  $("#fee-form").addEventListener("submit", openFeeSubmit);
  $("#exam-select").addEventListener("change", renderExams);
  $("#add-exam").addEventListener("click", () => {
    $("#exam-dialog-title").textContent = "Add exam";
    $("#exam-original").value = "";
    $("#exam-name").value = "";
    $("#exam-desc").value = "";
    $("#exam-form-message").textContent = "";
    $("#exam-dialog").showModal();
  });
  $("#edit-exam").addEventListener("click", () => {
    const exam = exams.find((item) => item.id === $("#exam-select").value);
    if (!exam) return;
    $("#exam-dialog-title").textContent = "Edit exam";
    $("#exam-original").value = exam.id;
    $("#exam-name").value = exam.name;
    $("#exam-desc").value = exam.description || "";
    $("#exam-form-message").textContent = "";
    $("#exam-dialog").showModal();
  });
  $("#exam-form").addEventListener("submit", openExamSubmit);
  $("#add-exam-slot").addEventListener("click", () => openSlotEditor());
  $("#slot-form").addEventListener("submit", openSlotSubmit);
}

function startDashboard() {
  if (!currentUser) {
    location.replace("signin.html");
    return;
  }
  $("#auth-screen").hidden = true;
  $("#portal").hidden = false;
  editOrRemoveSetup();
  renderPortal();
  $("#dashboard-menu")?.addEventListener("click", () => {
    const sidebar = document.querySelector(".sidebar");
    const open = sidebar.classList.toggle("nav-open");
    $("#dashboard-menu").setAttribute("aria-expanded", String(open));
  });
}

startDashboard();