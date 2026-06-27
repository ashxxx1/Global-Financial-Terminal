import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, query, orderBy, limit, getDocs } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAYEHwXwC9dFzkus2P8j3fqgvLUINOHQoo",
  authDomain: "global-financial-terminal.firebaseapp.com",
  projectId: "global-financial-terminal",
  storageBucket: "global-financial-terminal.firebasestorage.app",
  messagingSenderId: "141571673436",
  appId: "1:141571673436:web:d351f692f29f68390e8599",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function run() {
  console.log("Attempting anonymous sign in...");
  try {
    const cred = await signInAnonymously(auth);
    console.log("Anonymous sign in succeeded! User UID:", cred.user.uid);
    
    console.log("Fetching social_posts...");
    const q = query(
      collection(db, "social_posts"),
      orderBy("createdAtMs", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    console.log("Fetched social_posts successfully. Count:", snap.size);
    snap.forEach(doc => {
      console.log(`- Post: ${doc.id}, Author: ${doc.data().authorName}, Text: "${doc.data().text}"`);
    });
  } catch (err) {
    console.error("Failed:", err);
  }
}

run();
