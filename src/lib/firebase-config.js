// Import the functions you need from the SDKs you need
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional

import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, setLogLevel } from "firebase/firestore";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "",
  authDomain: "lia-project-630c0.firebaseapp.com",
  projectId: "lia-project-630c0",
  storageBucket: "lia-project-630c0.firebasestorage.app",
  messagingSenderId: "685880419443",
  appId: "1:685880419443:web:abd7ee2088c89ad487b606",
  measurementId: "G-X8GNH9P6MB",
  databaseURL: "https://lia-project-630c0-default-rtdb.firebaseio.com"  
};
// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
const auth = getAuth(app);
const db = getFirestore(app);
const db_rtdb = getDatabase(app);

// Habilitar logs de Firestore (útil para depurar)
setLogLevel('debug');

export { app, auth, db, db_rtdb };

