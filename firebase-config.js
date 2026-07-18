// Firebase configuration for the SUSL MIT Study Dashboard.
// Replace every placeholder below using Firebase Console:
// Project settings -> General -> Your apps -> Web app.

import { initializeApp } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-app.js";

import { getAuth } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";

import { getFirestore } from
  "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyB_4uaGGwGVcgFMoYi6p9bFYr66GpctFug",
  authDomain: "susl-mit-study-dashboard.firebaseapp.com",
  projectId: "susl-mit-study-dashboard",
  storageBucket: "susl-mit-study-dashboard.firebasestorage.app",
  messagingSenderId: "326352551964",
  appId: "1:326352551964:web:6d0eed348e2eb19d79dfd9"
};

// Replace this with the Google email address that should be
// allowed to open admin.html and read all login reports.
export const ADMIN_EMAIL = "abl4488@gmail.com";

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
