import { initializeApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  doc, 
  updateDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs 
} from "firebase/firestore";
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

const app = initializeApp(firebaseConfig);

// NOVA FORMA DE INICIALIZAR (Sem o aviso de depreciação)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const auth = getAuth(app);
export const storage = getStorage(app);

// ==========================================
// FUNÇÕES AUXILIARES
// ==========================================

export const atualizarPlanoLoja = async (uid, planoNome, maxUsers) => {
  try {
    const userRef = doc(db, "usuarios", uid);
    await updateDoc(userRef, {
      plano: planoNome,
      maxUsers: maxUsers
    });
    return { nota: "Plano atualizado com sucesso", status: "sucesso" };
  } catch (error) {
    console.error("Erro ao atualizar plano:", error);
    throw error;
  }
};

export const contarUsuariosLoja = async (lojaId) => {
  try {
    const q = query(collection(db, "usuarios"), where("lojaId", "==", lojaId));
    const snapshot = await getDocs(q);
    return snapshot.size;
  } catch (error) {
    console.error("Erro ao contar usuários:", error);
    return 0;
  }
};

export const verificarDisponibilidadePlano = async (lojaId) => {
  try {
    const lojaDoc = await getDoc(doc(db, "usuarios", lojaId));
    if (!lojaDoc.exists()) return false;
    const { maxUsers } = lojaDoc.data();
    const totalAtual = await contarUsuariosLoja(lojaId);
    return {
      podeAdicionar: totalAtual < (maxUsers || 1),
      atual: totalAtual,
      limite: maxUsers || 1
    };
  } catch (error) {
    return { podeAdicionar: false, atual: 0, limite: 0 };
  }
};