import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Store, Mail, ArrowRight, ShieldCheck, Loader2, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

const Login = ({ aoLogar }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verSenha, setVerSenha] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const fazerLogin = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      // 1. Autenticação Firebase (Verifica se e-mail e senha existem)
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      const user = userCredential.user;
      
      // --- PRIORIDADE ABSOLUTA: SUPER ADMIN BYPASS ---
      // Se for o teu e-mail, entra direto sem checar status no Firestore
      if (user.email.toLowerCase() === "naironcossa.dev@gmail.com") {
        const infoAdmin = { 
          uid: user.uid, 
          email: user.email, 
          role: 'superadmin', 
          nome: 'Master Admin',
          status: 'ativo' // Forçamos ativo localmente para garantir entrada
        };
        aoLogar(infoAdmin);
        navigate('/gestao-mestra');
        return; 
      }

      // 2. FLUXO NORMAL (Lojista / Funcionário)
      const docSnap = await getDoc(doc(db, "usuarios", user.uid));
      
      if (docSnap.exists()) {
        const dadosUsuario = docSnap.data();
        
        // Verifica se a conta da loja está suspensa
        if (dadosUsuario.status === 'suspenso') {
          setErro("CONTA SUSPENSA. CONTACTE O SUPORTE.");
          setCarregando(false);
          return;
        }

        aoLogar({ uid: user.uid, ...dadosUsuario });
        navigate('/');
      } else {
        setErro("PERFIL NÃO LOCALIZADO NO SISTEMA.");
      }
    } catch (err) {
      console.error("Login Error:", err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setErro("E-MAIL OU CHAVE INCORRECTOS.");
      } else if (err.code === 'auth/user-disabled') {
        setErro("CONTA DESATIVADA NO SERVIDOR MASTER.");
      } else if (err.code === 'auth/network-request-failed') {
        setErro("ERRO DE LIGAÇÃO. VERIFIQUE A INTERNET.");
      } else {
        setErro("FALHA NA AUTENTICAÇÃO.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F1F5F9]">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <div className="p-12 pb-10 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-20" />
          
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-slate-200 relative group transition-all">
            <Store size={32} className="text-white" />
            <div className="absolute -top-1 -right-1 bg-blue-600 p-1.5 rounded-full text-white border-4 border-white">
              <ShieldCheck size={14} />
            </div>
          </div>

          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">VendaJá <span className="text-blue-600 not-italic text-sm align-top">PRO</span></h2>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.3em] mt-3">Unidade de Controlo de Acesso</p>
        </div>

        {/* FORMULÁRIO */}
        <div className="px-10 pb-12">
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase mb-6 flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-2">
              <AlertCircle size={18} /> {erro}
            </div>
          )}

          <form onSubmit={fazerLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">E-mail Corporativo</label>
              <div className="relative group">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  required 
                  type="email" 
                  className="w-full bg-slate-50 p-5 pl-16 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold transition-all text-slate-700 placeholder:text-slate-300"
                  placeholder="exemplo@venda.com" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center px-5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chave de Acesso</label>
                <Link to="/recuperar-senha" className="text-[9px] font-black uppercase text-blue-500 hover:text-slate-900 transition-colors">Esqueci a Chave</Link>
              </div>
              <div className="relative group">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                <input 
                  required 
                  type={verSenha ? "text" : "password"} 
                  className="w-full bg-slate-50 p-5 pl-16 pr-16 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold transition-all text-slate-700 placeholder:text-slate-300"
                  placeholder="••••••••" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                />
                <button type="button" onClick={() => setVerSenha(!verSenha)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors">
                  {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              disabled={carregando} 
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-[0.98] group disabled:opacity-50"
            >
              {carregando ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="uppercase tracking-[0.2em] text-[10px]">Autenticar no Sistema</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>

            <div className="text-center pt-8 border-t border-slate-50">
              <Link to="/registo" className="inline-block group">
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mb-2">Novo no VendaJá?</p>
                <span className="text-blue-600 font-black text-xs uppercase tracking-tight group-hover:text-slate-900 transition-colors border-b-2 border-blue-600/20 group-hover:border-slate-900">
                  Criar Conta de Loja
                </span>
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;