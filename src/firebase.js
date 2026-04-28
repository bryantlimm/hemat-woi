import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDfgzVJUELqV5EFHO7rG0ZBvqMtVTaJzOM",
  authDomain: "hemat-woi.firebaseapp.com",
  projectId: "hemat-woi",
  storageBucket: "hemat-woi.firebasestorage.app",
  messagingSenderId: "540877780365",
  appId: "1:540877780365:web:5942df0ea0892e125939c4",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);