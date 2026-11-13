
const STORE = "student-portal-records-v3";
const $ = (selector) => document.querySelector(selector);

function getStudents() {
  try {
    const saved = localStorage.getItem(STORE);
    const rows = saved ? JSON.parse(saved) : null;

    if (Array.isArray(rows) && rows.length) return rows;

    const defaults = [
      {
        username: "stu1001", password: "student123", name: "Aisha Patel",
        email: "aisha@example.edu", phone: "Not provided",
        course: "Computer Science", grade: "Grade 10", guardian: "Ravi Patel",
        marks: { Math: 88, English: 91, Science: 84 }, attendance: 96, route: "Route A"
      },
      {
        username: "stu1002", password: "student123", name: "Daniel Kim",
        email: "daniel@example.edu", phone: "Not provided",
        course: "Business Studies", grade: "Grade 10", guardian: "Min Kim",
        marks: { Math: 78, English: 86, Science: 81 }, attendance: 89, route: "Route B"
      },
      {
        username: "stu1003", password: "student123", name: "Maya Johnson",
        email: "maya@example.edu", phone: "Not provided",
        course: "Graphic Design", grade: "Grade 10", guardian: "Ava Johnson",
        marks: { Math: 92, English: 87, Science: 90 }, attendance: 98, route: "Route A"
      }
    ];

    localStorage.setItem(STORE, JSON.stringify(defaults));
    return defaults;
  } catch {
    return [];
  }
}

function putStudents(rows) {
  localStorage.setItem(STORE, JSON.stringify(rows));
}

function saveSession(user) {
  sessionStorage.setItem("campusflow-user", JSON.stringify(user));
  location.href = "home.html";
}

function msg(id, text) {
  const element = $("#" + id);
  if (element) element.textContent = text;
}

function field(id, errorId, valid, error) {
  const input = $("#" + id);
  if (!input) return valid;

  input.classList.toggle("invalid", !valid);
  input.setAttribute("aria-invalid", String(!valid));
  msg(errorId, valid ? "" : error);
  return valid;
}

function passwordOK(value) {
  return value.length >= 8 &&
    /[A-Z]/.test(value) &&
    /[a-z]/.test(value) &&
    /\d/.test(value) &&
    /[^A-Za-z0-9]/.test(value);
}

function validateRegistration() {
  const full = $("#reg-name").value.trim();
  const id = $("#reg-id").value.trim();
  const email = $("#reg-email").value.trim();
  const mobile = $("#reg-mobile").value.trim();
  const division = $("#reg-division").value;
  const password = $("#reg-password").value;
  const confirm = $("#reg-confirm").value;

  const checks = [
    field(
      "reg-name",
      "reg-name-error",
      /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(full),
      "Enter a name using letters and spaces."
    ),
    field(
      "reg-id",
      "reg-id-error",
      /^[A-Za-z0-9]{6,12}$/.test(id),
      "ID must be 6–12 letters or numbers."
    ),
    field(
      "reg-email",
      "reg-email-error",
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
      "Enter a valid email address."
    ),
    field(
      "reg-mobile",
      "reg-mobile-error",
      /^[6-9]\d{9}$/.test(mobile),
      "Enter a 10-digit mobile number starting with 6–9."
    ),
    field(
      "reg-division",
      "reg-division-error",
      Boolean(division),
      "Choose a division."
    ),
    field(
      "reg-password",
      "reg-password-error",
      passwordOK(password),
      "Use 8+ characters with uppercase, lowercase, number and symbol."
    ),
    field(
      "reg-confirm",
      "reg-confirm-error",
      confirm.length > 0 && confirm === password,
      "Passwords do not match."
    )
  ];

  $("#register-submit").disabled = !checks.every(Boolean);
  return checks.every(Boolean);
}

function validateQuick() {
  const email = $("#signup-email").value.trim();
  const password = $("#signup-password").value;
  const terms = $("#signup-terms").checked;

  const validEmail = field(
    "signup-email",
    "signup-email-error",
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    "Enter a valid email address."
  );

  const validPassword = field(
    "signup-password",
    "signup-password-error",
    passwordOK(password),
    "Use 8+ characters with uppercase, lowercase, number and symbol."
  );

  const validTerms = field(
    "signup-terms",
    "signup-terms-error",
    terms,
    "Agree to the Terms of Service to continue."
  );

  $("#signup-submit").disabled = !(validEmail && validPassword && validTerms);
  return validEmail && validPassword && validTerms;
}

document.querySelectorAll("[data-toggle-password]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = $("#" + button.dataset.togglePassword);
    const visible = input.type === "password";

    input.type = visible ? "text" : "password";
    button.textContent = visible ? "Hide" : "Show";
    button.setAttribute("aria-label", visible ? "Hide password" : "Show password");
  });
});

document.querySelectorAll("#register-form input, #register-form select").forEach((input) => {
  input.addEventListener("input", validateRegistration);
  input.addEventListener("blur", validateRegistration);
});

document.querySelectorAll("#signup-form input").forEach((input) => {
  input.addEventListener("input", validateQuick);
  input.addEventListener("blur", validateQuick);
});

const registerForm = $("#register-form");

if (registerForm) {
  registerForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateRegistration()) return;

    const students = getStudents();
    const username = $("#reg-id").value.trim().toLowerCase();
    const email = $("#reg-email").value.trim().toLowerCase();

    if (students.some((student) => student.username.toLowerCase() === username)) {
      msg("register-message", "That student ID is already registered.");
      return;
    }

    if (students.some((student) => (student.email || "").toLowerCase() === email)) {
      msg("register-message", "That email address already has an account.");
      return;
    }

    students.push({
      username,
      password: $("#reg-password").value,
      name: $("#reg-name").value.trim(),
      email: $("#reg-email").value.trim(),
      phone: $("#reg-mobile").value.trim(),
      course: $("#reg-division").value,
      grade: "Not set",
      guardian: "Not provided",
      marks: { Math: 0, English: 0, Science: 0 },
      attendance: 0,
      route: "Unassigned"
    });

    putStudents(students);
    msg("register-message", "Account created. Taking you to sign in…");
    setTimeout(() => {
      location.href = "signin.html";
    }, 450);
  });
}

const quickForm = $("#signup-form");

if (quickForm) {
  quickForm.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!validateQuick()) return;

    const students = getStudents();
    const email = $("#signup-email").value.trim().toLowerCase();

    if (students.some((student) => (student.email || "").toLowerCase() === email)) {
      msg("signup-message", "An account with this email already exists.");
      return;
    }

    const stem = email.split("@")[0].replace(/[^a-z0-9]/g, "") || "student";
    const username = ("s" + Date.now().toString().slice(-10)).toLowerCase();

    students.push({
      username,
      password: $("#signup-password").value,
      name: stem.replace(/[._-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase()),
      email,
      phone: "Not provided",
      course: "Not set",
      grade: "Not set",
      guardian: "Not provided",
      marks: { Math: 0, English: 0, Science: 0 },
      attendance: 0,
      route: "Unassigned"
    });

    putStudents(students);
    msg("signup-message", "Account created. Taking you to sign in…");
    setTimeout(() => {
      location.href = "signin.html";
    }, 450);
  });
}

const loginForm = $("#signin-form");

if (loginForm) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const login = $("#signin-username").value.trim().toLowerCase();
    const password = $("#signin-password").value;

    if (login === "teacher" && password === "teach123") {
      saveSession({ role: "teacher", username: "teacher", name: "Teacher" });
      return;
    }

    const student = getStudents().find((item) =>
      (item.username.toLowerCase() === login ||
        (item.email || "").toLowerCase() === login) &&
      item.password === password
    );

    if (!student) {
      msg("signin-message", "The username/email or password is incorrect. Please try again.");
      $("#signin-password").classList.add("invalid");
      return;
    }

    msg("signin-message", "");
    saveSession({ role: "student", username: student.username });
  });
}
