import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBTYEt1ZwC84RaeorU6gMgK5SRr6RJ-2J0",
  authDomain: "pnl-diary.firebaseapp.com",
  projectId: "pnl-diary",
  storageBucket: "pnl-diary.firebasestorage.app",
  messagingSenderId: "242104324100",
  appId: "1:242104324100:web:0c75480cf194c5b2e9e551",
  measurementId: "G-J7RXPZSMCR"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app;

