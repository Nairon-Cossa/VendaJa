import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { db, auth } from './firebase'; 
import { collection, onSnapshot, query, where, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth'; 
import { ShieldAlert, MessageCircle, LogOut, MailCheck, Clock } from 'lucide-react';

// Páginas e Componentes
import Dashboard from './pages/Dashboard';
import Caixa from './pages/Caixa';
import Inventario from './pages/Inventario';
import Login from './pages/Login';
import Registo from './pages/Registo';
import RecuperarSenha from './pages/RecuperarSenha';
import Definicoes from './pages/Definicoes';
import Historico from './pages/Historico';
import Equipa from './pages/Equipa';
import SuperAdmin from './pages/SuperAdmin';
import Fiados from './pages/Fiados'; // Importado novo componente
import Navbar from './components/Navbar';
import FechoCaixa from './components/FechoCaixa';

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
  const isSuperAdmin = usuario?.email === "naironcossa.dev@gmail.com" || usuario?.role === 'superadmin';
  // Lógica para verificar se o utilizador tem acesso a funções pagas
  const isPremium = usuario?.plano === 'premium' || isSuperAdmin;

  const [configLoja, setConfigLoja] = useState({
    nuit: '', endereco: '', telefone: '', moeda: 'MT', mensagemRecibo: 'Obrigado!', logo: null
  });

  const avisar = (msg, tipo = "info") => {
    console.log(`[${tipo.toUpperCase()}]: ${msg}`);
  };

  useEffect(() => {
    const handleStatus = () => setIsOnline(navigator.onLine);
    window.addEventListener('online', handleStatus);
    window.addEventListener('offline', handleStatus);
    return () => {
      window.removeEventListener('online', handleStatus);
      window.removeEventListener('offline', handleStatus);
    };
  }, []);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUsuario(null);
        localStorage.removeItem('vendaJa_sessao');
      }
    });
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!usuario?.uid) {
      setCarregando(false);
      return;
    }
    const unsubUser = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        const novosDados = { ...docSnap.data(), uid: docSnap.id };
        setUsuario(novosDados); 
        localStorage.setItem('vendaJa_sessao', JSON.stringify(novosDados));
      } else {
        fazerLogout();
      }
      setCarregando(false);
    }, (error) => {
      console.error("Erro ao sincronizar usuário:", error);
      setCarregando(false);
    });
    return () => unsubUser();
  }, [usuario?.uid]);

  useEffect(() => {
    if (!usuario?.uid || usuario.status !== 'ativo') return;
    const unsubConfig = onSnapshot(doc(db, "configuracoes", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        setConfigLoja(docSnap.data());
      }
    });
    return () => unsubConfig();
  }, [usuario?.uid, usuario?.status]);

  useEffect(() => {
    if (!usuario?.uid || usuario.status !== 'ativo') return;
    const q = query(collection(db, "produtos"), where("lojaId", "==", usuario.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProdutos(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe(); 
  }, [usuario?.uid, usuario?.status]);

  const fazerLogin = (dados) => {
    setUsuario(dados);
    localStorage.setItem('vendaJa_sessao', JSON.stringify(dados));
  };

  const fazerLogout = () => {
    setUsuario(null);
    setProdutos([]);
    localStorage.removeItem('vendaJa_sessao');
    auth.signOut();
  };

  const TelaBloqueio = () => {
    const isPendente = usuario?.status === 'pendente';
    const msgWhatsapp = encodeURIComponent(`Olá Nairon! Sou o ${usuario?.nome} da loja ${usuario?.nomeLoja}. Gostaria de ativar o meu acesso ao VendaJá PRO.`);

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
              ? "A tua conta foi criada com sucesso! Para começar a gerir o teu negócio, envia o comprovativo de pagamento para o nosso suporte."
              : "Esta unidade encontra-se suspensa por falta de pagamento ou violação dos termos de uso."}
          </p>
          <div className="mt-10 space-y-4">
            <a href={`https://wa.me/${MEU_WHATSAPP}?text=${msgWhatsapp}`} target="_blank" rel="noopener noreferrer" className="w-full bg-[#25D366] text-white p-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:brightness-110 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3">
              <MessageCircle size={20} /> Enviar Comprovativo
            </a>
            <button onClick={fazerLogout} className="w-full text-slate-400 font-black text-[10px] uppercase p-4 hover:text-red-500 transition-colors flex items-center justify-center gap-2">
              <LogOut size={16} /> Sair da Conta
            </button>
          </div>
          <p className="mt-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest">ID da Loja: {usuario?.lojaId}</p>
        </div>
      </div>
    );
  };

  if (carregando) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 font-black text-[9px] uppercase tracking-[0.4em]">Sincronizando...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        {usuario && (usuario.status === 'ativo' || isSuperAdmin) && (
          <Navbar usuario={usuario} fazerLogout={fazerLogout} isOnline={isOnline} abrirFecho={() => setMostrarFecho(true)} />
        )}

        <main className={usuario && (usuario.status === 'ativo' || isSuperAdmin) ? "max-w-7xl mx-auto w-full p-6 md:p-8" : "w-full"}>
          <Routes>
            <Route path="/login" element={!usuario ? <Login aoLogar={fazerLogin} /> : (isSuperAdmin ? <Navigate to="/gestao-mestra" /> : <Navigate to="/" />)} />
            <Route path="/registo" element={!usuario ? <Registo setUsuario={fazerLogin} /> : <Navigate to="/" />} />
            <Route path="/recuperar-senha" element={<RecuperarSenha />} />
            <Route path="/gestao-mestra" element={isSuperAdmin ? <SuperAdmin /> : <Navigate to="/login" />} />

            <Route path="/" element={
              usuario ? (
                isSuperAdmin ? <Navigate to="/gestao-mestra" /> : (
                  usuario.status === 'ativo' ? (
                    usuario.role === 'admin' ? <Dashboard produtos={produtos} usuario={usuario} /> : <Navigate to="/caixa" />
                  ) : <TelaBloqueio />
                )
              ) : <Navigate to="/login" />
            } />
            
            <Route path="/caixa" element={(usuario?.status === 'ativo' || isSuperAdmin) ? <Caixa usuario={usuario} produtos={produtos} configLoja={configLoja} avisar={avisar} /> : <Navigate to="/" />} />
            <Route path="/inventario" element={(usuario?.status === 'ativo' || isSuperAdmin) && usuario?.role === 'admin' ? <Inventario usuario={usuario} produtos={produtos} /> : <Navigate to="/" />} />
            <Route path="/equipa" element={(usuario?.status === 'ativo' || isSuperAdmin) && usuario?.role === 'admin' ? <Equipa usuario={usuario} /> : <Navigate to="/" />} />
            <Route path="/historico" element={(usuario?.status === 'ativo' || isSuperAdmin) ? <Historico produtos={produtos} usuario={usuario} configLoja={configLoja} /> : <Navigate to="/" />} />
            
            {/* NOVA ROTA: Fiados (Apenas para Premium ou Admin) */}
            <Route path="/fiados" element={(usuario?.status === 'ativo' || isSuperAdmin) && isPremium ? <Fiados usuario={usuario} configLoja={configLoja} avisar={avisar} /> : <Navigate to="/" />} />

            <Route path="/definicoes" element={
              (usuario?.status === 'ativo' || isSuperAdmin) && usuario?.role === 'admin' 
              ? <Definicoes usuario={usuario} configLoja={configLoja} avisar={avisar} /> 
              : <Navigate to="/" />
            } />

            <Route path="*" element={<Navigate to={usuario ? (isSuperAdmin ? "/gestao-mestra" : "/") : "/login"} />} />
          </Routes>
        </main>

        {mostrarFecho && <FechoCaixa usuario={usuario} fechar={() => setMostrarFecho(false)} />}
      </div>
    </Router>
  );
}

export default App;