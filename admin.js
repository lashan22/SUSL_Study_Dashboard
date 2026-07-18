import { ADMIN_EMAIL, auth, db } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  Timestamp,
  collection,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const message = document.getElementById("admin-message");
const registeredUsers = document.getElementById("registered-users-count");
const totalLogins = document.getElementById("total-logins-count");
const todayLogins = document.getElementById("today-logins-count");
const tableBody = document.getElementById("login-table-body");
const refreshButton = document.getElementById("refresh-reports");

function setMessage(text, type = "") {
  if (!message) return;
  message.textContent = text;
  message.className = "auth-message";
  if (type) message.classList.add(type);
}

function formatTimestamp(timestamp) {
  if (!timestamp || typeof timestamp.toDate !== "function") {
    return "Pending timestamp";
  }

  return new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Colombo"
  }).format(timestamp.toDate());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showAdminUser(user) {
  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = user.displayName || user.email || "Administrator";
  });

  document.querySelectorAll("[data-user-email]").forEach((element) => {
    element.textContent = user.email || "";
  });

  document.querySelectorAll("[data-user-photo]").forEach((image) => {
    if (user.photoURL) {
      image.src = user.photoURL;
      image.hidden = false;
    }
  });
}

async function loadReports() {
  if (refreshButton) refreshButton.disabled = true;
  setMessage("Loading login reports...");

  try {
    const usersCollection = collection(db, "users");
    const loginEventsCollection = collection(db, "loginEvents");

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      usersCountSnapshot,
      totalLoginsSnapshot,
      todayLoginsSnapshot,
      recentLoginsSnapshot
    ] = await Promise.all([
      getCountFromServer(usersCollection),
      getCountFromServer(loginEventsCollection),
      getCountFromServer(
        query(
          loginEventsCollection,
          where("loginAt", ">=", Timestamp.fromDate(startOfToday))
        )
      ),
      getDocs(
        query(
          loginEventsCollection,
          orderBy("loginAt", "desc"),
          limit(100)
        )
      )
    ]);

    registeredUsers.textContent = usersCountSnapshot.data().count;
    totalLogins.textContent = totalLoginsSnapshot.data().count;
    todayLogins.textContent = todayLoginsSnapshot.data().count;
    tableBody.innerHTML = "";

    if (recentLoginsSnapshot.empty) {
      tableBody.innerHTML = `
        <tr>
          <td colspan="4">No successful login events have been recorded yet.</td>
        </tr>
      `;
    } else {
      recentLoginsSnapshot.forEach((documentSnapshot) => {
        const event = documentSnapshot.data();
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${escapeHtml(event.name || "Student")}</td>
          <td>${escapeHtml(event.email || "")}</td>
          <td>${escapeHtml(event.provider || "")}</td>
          <td>${escapeHtml(formatTimestamp(event.loginAt))}</td>
        `;
        tableBody.appendChild(row);
      });
    }

    setMessage("Login reports loaded successfully.", "success");
  } catch (error) {
    console.error("Admin report error:", error);
    setMessage(
      "Unable to load reports. Check the Firebase configuration and Firestore security rules.",
      "error"
    );
    tableBody.innerHTML = `
      <tr><td colspan="4">Report data could not be loaded.</td></tr>
    `;
  } finally {
    if (refreshButton) refreshButton.disabled = false;
  }
}

document.querySelectorAll("[data-logout]").forEach((button) => {
  button.addEventListener("click", async () => {
    await signOut(auth);
    window.location.replace("login.html");
  });
});

if (refreshButton) {
  refreshButton.addEventListener("click", loadReports);
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.replace("login.html");
    return;
  }

  const signedInEmail = String(user.email || "").toLowerCase();
  const allowedAdminEmail = String(ADMIN_EMAIL || "").toLowerCase();

  if (
    !allowedAdminEmail ||
    allowedAdminEmail.includes("paste_your") ||
    signedInEmail !== allowedAdminEmail
  ) {
    window.location.replace("index.html");
    return;
  }

  showAdminUser(user);
  await loadReports();
});
