import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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

    try {
      /* ===============================
         1. AUTH FIREBASE
      =============================== */
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email.trim(),
        password
      );

      const user = userCredential.user;

      /* ===============================
         SUPER ADMIN BYPASS
      =============================== */
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

      /* ===============================
         FLUXO NORMAL
      =============================== */
      const docSnap = await getDoc(doc(db, "usuarios", user.uid));

      if (!docSnap.exists()) {
        setErro("PERFIL NÃO LOCALIZADO NO SISTEMA.");
        return;
      }

      const dadosUsuario = docSnap.data();

      if (dadosUsuario.status === 'suspenso') {
        setErro("CONTA SUSPENSA. CONTACTE O SUPORTE.");
        return;
      }

      aoLogar({ uid: user.uid, ...dadosUsuario });
      navigate('/');

    } catch (err) {
      console.error("Login Error:", err.code);

      /* ===============================
         ERROR HANDLING (FIX)
      =============================== */
      if (
        err.code === 'auth/invalid-credential' ||
        err.code === 'auth/wrong-password' ||
        err.code === 'auth/user-not-found'
      ) {
        setErro("CREDENCIAIS INVÁLIDAS");
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
                  className="w-full bg-slate-50 p-5 pl-16 rounded-[2rem] font-bold"
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
                  className="w-full bg-slate-50 p-5 pl-16 pr-16 rounded-[2rem] font-bold"
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
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black flex justify-center gap-3 disabled:opacity-50"
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

            <div className="text-center pt-8 border-t">
              <Link to="/registo" className="text-blue-600 font-black text-xs uppercase">
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
