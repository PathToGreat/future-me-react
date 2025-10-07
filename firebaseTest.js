import { app, auth, db } from "./src/config/firebase.js";

console.log("Firebase app:", app);
console.log("Firebase auth:", auth ? "Initialized" : "Not initialized");
console.log("Firestore db:", db ? "Initialized" : "Not initialized");
