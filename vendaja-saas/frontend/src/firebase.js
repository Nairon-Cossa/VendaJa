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

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database) and export it
export const db = getFirestore(app);
const auth = getAuth(app); // 2. Inicializar o serviço de Auth

// 3. Exportar ambos para serem usados no resto da app
export { auth };


export const storage = getStorage(app);