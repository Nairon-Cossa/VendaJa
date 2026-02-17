import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBoaPP1CPioRE6K_ngs-lfUW4eDSaxGy6U",
  authDomain: "vendaja-d6356.firebaseapp.com",
  projectId: "vendaja-d6356",
  storageBucket: "vendaja-d6356.firebasestorage.app",
  messagingSenderId: "933159417638",
  appId: "1:933159417638:web:51c1b905dd1a3af86e73e7",
  measurementId: "G-4B7NV0J1RZ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços e exportar
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);