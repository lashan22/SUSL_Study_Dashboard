import { auth, db } from "./firebase-config.js";

import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const loginButton = document.getElementById("google-login-button");
const message = document.getElementById("login-message");
const provider = new GoogleAuthProvider();

provider.setCustomParameters({ prompt: "select_account" });

function setMessage(text, type = "") {
  if (!message) return;
  message.textContent = text;
  message.className = "auth-message";
  if (type) message.classList.add(type);
}

function setBusy(isBusy) {
  if (!loginButton) return;
  loginButton.disabled = isBusy;
  const label = loginButton.querySelector("span:last-child");
  if (label) label.textContent = isBusy ? "Signing in..." : "Continue with Google";
}

async function recordSuccessfulLogin(user) {
  const userRef = doc(db, "users", user.uid);
  const userSnapshot = await getDoc(userRef);

  const profile = {
    uid: user.uid,
    name: user.displayName || "Student",
    email: user.email || "",
    photoURL: user.photoURL || "",
    lastLoginAt: serverTimestamp()
  };

  if (userSnapshot.exists()) {
    await updateDoc(userRef, {
      ...profile,
      loginCount: increment(1)
    });
  } else {
    await setDoc(userRef, {
      ...profile,
      createdAt: serverTimestamp(),
      loginCount: 1
    });
  }

  await addDoc(collection(db, "loginEvents"), {
    uid: user.uid,
    name: user.displayName || "Student",
    email: user.email || "",
    provider: "google",
    loginAt: serverTimestamp()
  });
}

function friendlyAuthError(error) {
  const code = String(error?.code || "");
  if (code.includes("popup-closed-by-user")) {
    return "The sign-in window was closed before login was completed.";
  }
  if (code.includes("popup-blocked")) {
    return "Your browser blocked the sign-in window. Allow pop-ups and try again.";
  }
  if (code.includes("unauthorized-domain")) {
    return "This website domain has not been authorized in Firebase Authentication.";
  }
  if (code.includes("network-request-failed")) {
    return "A network error occurred. Check your internet connection and try again.";
  }
  return "Unable to sign in. Please try again.";
}

if (loginButton) {
  loginButton.addEventListener("click", async () => {
    setBusy(true);
    setMessage("Opening secure Google sign-in...");

    try {
      const credential = await signInWithPopup(auth, provider);
      await recordSuccessfulLogin(credential.user);
      setMessage("Login successful. Opening your dashboard...", "success");
      window.location.replace("index.html");
    } catch (error) {
      console.error("Login error:", error);
      setMessage(friendlyAuthError(error), "error");
      setBusy(false);
    }
  });
}

onAuthStateChanged(auth, (user) => {
  if (user) {
    setMessage(`Already signed in as ${user.email || user.displayName}.`, "success");
    window.setTimeout(() => window.location.replace("index.html"), 500);
  }
});
