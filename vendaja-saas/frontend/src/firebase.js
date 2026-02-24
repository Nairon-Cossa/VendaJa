import { initializeApp } from "firebase/app";
import { 
  getFirestore, 
  enableIndexedDbPersistence, 
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

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar serviços
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// ==========================================
// ATIVAR O MODO SUPER OFFLINE DO FIREBASE
// ==========================================
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code == 'failed-precondition') {
    console.warn('Múltiplas abas abertas. O modo offline só funciona na primeira aba.');
  } else if (err.code == 'unimplemented') {
    console.warn('O seu navegador não suporta armazenamento offline.');
  }
});

// ==========================================
// FUNÇÕES AUXILIARES DE GESTÃO DE PLANOS
// ==========================================

/**
 * Atualiza o plano e o limite de usuários de uma loja.
 */
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

/**
 * Conta quantos usuários uma loja possui atualmente.
 */
export const contarUsuariosLoja = async (lojaId) => {
  try {
    const q = query(collection(db, "usuarios"), where("lojaId", "==", lojaId));
    const snapshot = await getDocs(q);
    return snapshot.size; // Retorna o número total de documentos encontrados
  } catch (error) {
    console.error("Erro ao contar usuários:", error);
    return 0;
  }
};

/**
 * Verifica se a loja ainda pode adicionar novos usuários baseando-se no plano.
 */
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