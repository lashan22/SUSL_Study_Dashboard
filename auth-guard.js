import { auth } from "./firebase-config.js";

import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

document.documentElement.classList.add("auth-checking");

function redirectToLogin() {
  window.location.replace("login.html");
}

function showUser(user) {
  document.querySelectorAll("[data-user-name]").forEach((element) => {
    element.textContent = user.displayName || user.email || "Student";
  });

  document.querySelectorAll("[data-user-email]").forEach((element) => {
    element.textContent = user.email || "";
  });

  document.querySelectorAll("[data-user-photo]").forEach((image) => {
    if (user.photoURL) {
      image.src = user.photoURL;
      image.hidden = false;
    } else {
      image.hidden = true;
    }
  });

  document.querySelectorAll("[data-logout]").forEach((button) => {
    button.addEventListener("click", async () => {
      button.disabled = true;
      try {
        await signOut(auth);
        window.location.replace("login.html");
      } catch (error) {
        console.error("Logout error:", error);
        button.disabled = false;
      }
    });
  });
}

onAuthStateChanged(auth, (user) => {
  if (!user) {
    redirectToLogin();
    return;
  }

  showUser(user);
  document.documentElement.classList.remove("auth-checking");
});
