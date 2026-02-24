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

    const emailLimpo = email.trim().toLowerCase();

    try {
      /* ============================================================
         1. FLUXO DE FUNCIONÁRIO (Busca Direta por ID/Email)
         Como o ID do documento agora é o próprio email, usamos getDoc.
      ============================================================ */
      const docRef = doc(db, "usuarios", emailLimpo);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const dadosUsuario = docSnap.data();

        // Verifica se a senha manual (campo password no Firestore) coincide
        if (dadosUsuario.password === password) {
          if (dadosUsuario.status === 'suspenso') {
            setErro("ACESSO SUSPENSO PELO ADMINISTRADOR.");
            setCarregando(false);
            return;
          }

          // Login de funcionário bem-sucedido
          aoLogar({ uid: docSnap.id, ...dadosUsuario });
          navigate('/');
          return;
        }
        // Se o documento existe mas a senha está errada, podemos optar por
        // continuar para o Auth (caso seja um Admin com senha diferente) 
        // ou barrar logo aqui. O código abaixo segue para o Auth oficial.
      }

      /* ============================================================
         2. TENTATIVA AUTH FIREBASE (Para Donos / Master Admin)
         Se não logou como funcionário, tenta a autenticação oficial.
      ============================================================ */
      try {
        const userCredential = await signInWithEmailAndPassword(auth, emailLimpo, password);
        const user = userCredential.user;

        // BYPASS SUPER ADMIN
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

        // Buscar dados do Dono no Firestore usando o UID do Firebase Auth
        const donoSnap = await getDoc(doc(db, "usuarios", user.uid));
        if (donoSnap.exists()) {
          const dados = donoSnap.data();
          if (dados.status === 'suspenso') {
            setErro("CONTA SUSPENSA. CONTACTE O SUPORTE.");
            return;
          }
          aoLogar({ uid: user.uid, ...dados });
          navigate('/');
        } else {
          setErro("PERFIL NÃO LOCALIZADO NO SISTEMA.");
        }

      } catch (authErr) {
        console.error("Auth Error Code:", authErr.code);
        setErro("CREDENCIAIS INVÁLIDAS");
      }

    } catch (err) {
      console.error("Erro Geral de Login:", err);
      if (err.message.includes("permission-denied")) {
        setErro("ERRO DE PERMISSÃO: CONTACTE O ADMINISTRADOR.");
      } else {
        setErro("FALHA NA AUTENTICAÇÃO. TENTE NOVAMENTE.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F1F5F9]">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">

        {/* HEADER */}
        <div className="p-12 text-center bg-white">
          <div className="w-20 h-20 bg-slate-900 rounded-[2rem] flex items-center justify-center mx-auto mb-6 relative">
            <Store size={32} className="text-white" />
            <div className="absolute -top-1 -right-1 bg-blue-600 p-1.5 rounded-full text-white border-4 border-white">
              <ShieldCheck size={14} />
            </div>
          </div>

          <h2 className="text-3xl font-black italic uppercase text-slate-900">
            VendaJá <span className="text-blue-600 text-sm">PRO</span>
          </h2>
          <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 mt-3">
            Unidade de Controlo de Acesso
          </p>
        </div>

        {/* FORMULÁRIO */}
        <div className="px-10 pb-12 bg-white">
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase mb-6 flex items-center gap-3 border border-red-100 animate-shake">
              <AlertCircle size={18} />
              {erro}
            </div>
          )}

          <form onSubmit={fazerLogin} className="space-y-6">
            
            {/* INPUT E-MAIL */}
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5 block mb-2">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                  required
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-50 p-5 pl-16 rounded-[2rem] font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all text-slate-900"
                  placeholder="exemplo@venda.com"
                />
              </div>
            </div>

            {/* INPUT SENHA */}
            <div>
              <div className="flex justify-between px-5 mb-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Chave de Acesso
                </label>
                <Link to="/recuperar-senha" style={{ opacity: 0.6 }} className="text-[9px] font-black uppercase text-blue-500 hover:underline">
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
                  className="w-full bg-slate-50 p-5 pl-16 pr-16 rounded-[2rem] font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all text-slate-900"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setVerSenha(!verSenha)}
                  className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 transition-colors"
                >
                  {verSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* BOTÃO DE SUBMIT */}
            <button
              disabled={carregando}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black flex justify-center items-center gap-3 disabled:opacity-50 hover:bg-blue-600 transition-all active:scale-95 shadow-xl shadow-slate-200"
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
                Criar Nova Conta de Loja
              </Link>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;