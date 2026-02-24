import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import {
  Store, Mail, ArrowRight, ShieldCheck, Loader2,
  Lock, Eye, EyeOff, AlertCircle
} from 'lucide-react';

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

    const emailLimpo = email.trim().toLowerCase();

    try {
      /* ===============================
         1. TENTATIVA AUTH FIREBASE (Para Donos/Master)
      =============================== */
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailLimpo, password);
        const user = userCredential.user;

        // SUPER ADMIN BYPASS
        if (user.email?.toLowerCase() === "naironcossa.dev@gmail.com") {
          aoLogar({
            uid: user.uid,
            email: user.email,
            role: 'superadmin',
            nome: 'Master Admin',
            status: 'ativo'
          });
          navigate('/gestao-mestra');
          return;
        }

        const docSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (docSnap.exists()) {
          const dados = docSnap.data();
          if (dados.status === 'suspenso') {
            setErro("CONTA SUSPENSA. CONTACTE O SUPORTE.");
            return;
          }
          aoLogar({ uid: user.uid, ...dados });
          navigate('/');
          return;
        }
      } catch (authErr) {
        // Se o erro não for senha errada, mas sim usuário não encontrado, 
        // prosseguimos para verificar se é um funcionário (Custom Login)
        if (authErr.code !== 'auth/user-not-found' && authErr.code !== 'auth/invalid-credential') {
            throw authErr; 
        }
      }

      /* ===============================
         2. FLUXO DE FUNCIONÁRIO (Custom Login)
         Procura na coleção usuários por e-mail + password manual
      =============================== */
      const q = query(
        collection(db, "usuarios"), 
        where("email", "==", emailLimpo),
        where("password", "==", password) // A senha que definimos no Equipa.jsx
      );

      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const docUser = querySnapshot.docs[0];
        const dadosUsuario = docUser.data();

        if (dadosUsuario.status === 'suspenso') {
          setErro("ACESSO SUSPENSO PELO ADMINISTRADOR.");
          return;
        }

        aoLogar({ uid: docUser.id, ...dadosUsuario });
        navigate('/');
      } else {
        setErro("CREDENCIAIS INVÁLIDAS");
      }

    } catch (err) {
      console.error("Login Error:", err.code);
      
      if (err.code === 'auth/network-request-failed') {
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
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-100">

        {/* HEADER */}
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative">
            <Store size={32} className="text-white" />
            <div className="absolute -top-1 -right-1 bg-blue-600 p-1.5 rounded-full text-white border-4 border-white">
              <ShieldCheck size={14} />
            </div>
          </div>

          <h2 className="text-3xl font-black italic uppercase">
            VendaJá <span className="text-blue-600 text-sm">PRO</span>
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            Unidade de Controlo de Acesso
          </p>
        </div>

        {/* FORM */}
        <div className="px-10 pb-12">
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase mb-6 flex items-center gap-3 border border-red-100">
              <AlertCircle size={18} />
              {erro}
            </div>
          )}

          <form onSubmit={fazerLogin} className="space-y-6">

            {/* EMAIL */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 p-5 pl-16 rounded-[2rem] font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all"
                  placeholder="exemplo@venda.com"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <div className="flex justify-between px-5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Chave de Acesso
                </label>
                <Link to="/recuperar-senha" className="text-[9px] font-black uppercase text-blue-500">
                  Esqueci a Chave
                </Link>
              </div>

              <div className="relative">
                <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  required
                  type={verSenha ? "text" : "password"}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-50 p-5 pl-16 pr-16 rounded-[2rem] font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(!verSenha)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* BUTTON */}
            <button
              disabled={carregando}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black flex justify-center gap-3 disabled:opacity-50 hover:bg-blue-600 transition-all active:scale-95"
            >
              {carregando ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span className="text-[10px] uppercase tracking-[0.2em]">
                    Autenticar no Sistema
                  </span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="text-center pt-8 border-t border-slate-50">
              <Link to="/registo" className="text-blue-600 font-black text-xs uppercase hover:underline">
                Criar Conta de Loja
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;