import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { ShieldAlert, MessageCircle, LogOut, Clock } from 'lucide-react';

// Páginas e Componentes
import Dashboard from './pages/Dashboard';
import Caixa from './pages/Caixa';
import Inventario from './pages/Inventario';
import Login from './pages/Login';
import Registo from './pages/Registo';
import RecuperarSenha from './pages/RecuperarSenha';
import RedefinirSenha from './pages/RedefinirSenha';
import Definicoes from './pages/Definicoes';
import Historico from './pages/Historico';
import Equipa from './pages/Equipa';
import SuperAdmin from './pages/SuperAdmin';
import Fiados from './pages/Fiados'; 
import LojaPublica from './pages/LojaPublica'; 
import Navbar from './components/Navbar';
import FechoCaixa from './components/FechoCaixa';

const TelaBloqueio = ({ usuario, fazerLogout, MEU_WHATSAPP }) => {
  const isPendente = usuario?.status === 'pendente';
  const msgWhatsapp = encodeURIComponent(`Olá Nairon! Sou o ${usuario?.nome} da loja ${usuario?.nomeLoja}. Gostaria de ativar o meu acesso.`);

  return (
    <div className="h-screen bg-[#F1F5F9] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-slate-200 border border-slate-100 max-w-md w-full animate-in fade-in zoom-in duration-500">
        <div className={`w-24 h-24 ${isPendente ? 'bg-amber-50 text-amber-500' : 'bg-red-50 text-red-500'} rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto shadow-inner`}>
          {isPendente ? <Clock size={48} className="animate-pulse" /> : <ShieldAlert size={48} />}
        </div>
        <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter leading-tight">
          {isPendente ? "Aguardando Ativação" : "Acesso Restrito"}
        </h1>
        <p className="text-slate-400 mt-4 font-bold text-[11px] leading-relaxed uppercase tracking-widest">
          {isPendente 
            ? "A tua conta foi criada! Envia o comprovativo de pagamento para o nosso suporte para ativar a tua loja."
            : "Esta unidade encontra-se suspensa por falta de pagamento ou violação dos termos."}
        </p>
        <div className="mt-10 space-y-4">
          <a href={`https://wa.me/${MEU_WHATSAPP}?text=${msgWhatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white p-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-3">
            <MessageCircle size={20} /> Mandar Mensagem
          </a>
          <button onClick={fazerLogout} className="w-full text-slate-400 font-black text-[10px] uppercase p-4 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
            <LogOut size={16} /> Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [usuario, setUsuario] = useState(() => {
    const salvo = localStorage.getItem('vendaJa_sessao');
    return salvo ? JSON.parse(salvo) : null;
  });
  
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [mostrarFecho, setMostrarFecho] = useState(false);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const MEU_WHATSAPP = "258878296706";

  const fazerLogout = useCallback(() => {
    auth.signOut();
    localStorage.removeItem('vendaJa_sessao');
    setUsuario(null);
    setProdutos([]);
  }, []);

  const fazerLogin = (dados) => {
    localStorage.setItem('vendaJa_sessao', JSON.stringify(dados));
    setUsuario(dados);
  };

  const isSuperAdmin = usuario?.role === 'superadmin' || usuario?.email === "naironcossa.dev@gmail.com";
  const isAdmin = usuario?.role === 'admin';

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  // Monitor de Auth do Firebase
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      // Se não há usuário no Auth e o que está no localStorage tem senha (é funcionário), não desloga
      if (!user) {
        const salvo = localStorage.getItem('vendaJa_sessao');
        if (salvo) {
          const dados = JSON.parse(salvo);
          if (dados.password) return; // É funcionário, mantém logado
        }
        fazerLogout();
      }
    });
    return () => unsubscribeAuth();
  }, [fazerLogout]);

  // Sincronização em tempo real do Perfil (CORRIGIDO)
  useEffect(() => {
    // Se não há usuário logado, para o carregamento
    if (!usuario?.uid) {
      setCarregando(false);
      return;
    }

    // A ID de busca no Firestore é SEMPRE o UID ou o Email salvo no login
    const idParaDocumento = usuario.uid; 

    const unsubUser = onSnapshot(doc(db, "usuarios", idParaDocumento), (docSnap) => {
      if (docSnap.exists()) {
        const dadosNovos = { ...docSnap.data(), uid: docSnap.id };
        setUsuario(dadosNovos);
        localStorage.setItem('vendaJa_sessao', JSON.stringify(dadosNovos));
      } else if (!isSuperAdmin) {
        // Se o documento foi deletado no banco, desloga
        fazerLogout();
      }
      setCarregando(false);
    }, (err) => {
      console.error("Erro na sincronização:", err);
      setCarregando(false);
    });

    return () => unsubUser();
  }, [usuario?.uid, isSuperAdmin, fazerLogout]);

  const [configLoja, setConfigLoja] = useState({
    moeda: 'MT', mensagemRecibo: 'Obrigado!', logoUrl: ''
  });

  // Sincronização de Configurações e Produtos
  useEffect(() => {
    const empresaId = usuario?.empresaId || usuario?.uid;
    if (!empresaId || (usuario?.status !== 'ativo' && !isSuperAdmin)) return;

    // Configurações
    const unsubConfig = onSnapshot(doc(db, "empresas", empresaId), (docSnap) => {
      if (docSnap.exists()) setConfigLoja(docSnap.data());
    });

    // Produtos
    const q = query(collection(db, "produtos"), where("empresaId", "==", empresaId));
    const unsubProd = onSnapshot(q, (snap) => {
      setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { unsubConfig(); unsubProd(); };
  }, [usuario?.empresaId, usuario?.uid, usuario?.status, isSuperAdmin]);

  if (carregando) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-black text-[9px] uppercase tracking-[0.4em]">Sincronizando Sistema...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <Routes>
          <Route path="/loja/:slug" element={<LojaPublica />} />
          <Route path="/redefinir-senha" element={<RedefinirSenha />} />
          <Route path="/recuperar-senha" element={<RecuperarSenha />} />

          <Route path="*" element={
            <>
              {usuario && (usuario.status === 'ativo' || isSuperAdmin) && (
                <Navbar usuario={usuario} fazerLogout={fazerLogout} isOnline={isOnline} abrirFecho={() => setMostrarFecho(true)} />
              )}

              <main className={usuario && (usuario.status === 'ativo' || isSuperAdmin) ? "max-w-7xl mx-auto w-full p-6 md:p-8" : "w-full"}>
                <Routes>
                  <Route path="/login" element={!usuario ? <Login aoLogar={fazerLogin} /> : <Navigate to="/" />} />
                  <Route path="/registo" element={!usuario ? <Registo /> : <Navigate to="/" />} />
                  <Route path="/gestao-mestra" element={isSuperAdmin ? <SuperAdmin /> : <Navigate to="/login" />} />

                  <Route path="/" element={
                    usuario ? (
                      isSuperAdmin ? <Navigate to="/gestao-mestra" /> : (
                        usuario.status === 'ativo' ? (
                          isAdmin ? <Dashboard produtos={produtos} usuario={usuario} /> : <Navigate to="/caixa" />
                        ) : <TelaBloqueio usuario={usuario} fazerLogout={fazerLogout} MEU_WHATSAPP={MEU_WHATSAPP} />
                      )
                    ) : <Navigate to="/login" />
                  } />
                  
                  <Route path="/caixa" element={(usuario?.status === 'ativo' || isSuperAdmin) ? <Caixa usuario={usuario} produtos={produtos} configLoja={configLoja} /> : <Navigate to="/" />} />
                  <Route path="/historico" element={(usuario?.status === 'ativo' || isSuperAdmin) ? <Historico produtos={produtos} usuario={usuario} configLoja={configLoja} /> : <Navigate to="/" />} />
                  <Route path="/fiados" element={(usuario?.status === 'ativo' || isSuperAdmin) ? <Fiados usuario={usuario} configLoja={configLoja} /> : <Navigate to="/" />} />

                  <Route path="/inventario" element={(usuario?.status === 'ativo' || isSuperAdmin) && isAdmin ? <Inventario usuario={usuario} produtos={produtos} /> : <Navigate to="/" />} />
                  <Route path="/equipa" element={(usuario?.status === 'ativo' || isSuperAdmin) && isAdmin ? <Equipa usuario={usuario} /> : <Navigate to="/" />} />
                  <Route path="/definicoes" element={(usuario?.status === 'ativo' || isSuperAdmin) && isAdmin ? <Definicoes usuario={usuario} configLoja={configLoja} /> : <Navigate to="/" />} />
                  
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </main>
              {mostrarFecho && <FechoCaixa usuario={usuario} fechar={() => setMostrarFecho(false)} />}
            </>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;