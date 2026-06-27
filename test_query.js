import { initializeApp } from "firebase/app";
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
const db = getFirestore(app);

async function testQuery() {
  console.log("Testing firestore read for social_posts...");
  try {
    const q = query(
      collection(db, "social_posts"),
      orderBy("createdAtMs", "desc"),
      limit(5)
    );
    const snap = await getDocs(q);
    console.log("Successfully fetched social_posts. Count:", snap.size);
    snap.forEach(doc => {
      console.log(`- Post ID: ${doc.id}, Author: ${doc.data().authorName}, Text: "${doc.data().text}", createdAtMs: ${doc.data().createdAtMs}`);
    });
  } catch (err) {
    console.error("Firestore query failed:", err);
  }
}

testQuery();
