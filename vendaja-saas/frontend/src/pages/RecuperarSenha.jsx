import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from "firebase/auth";
import { Mail, ArrowLeft, Loader2, Send, CheckCircle2, ShieldAlert, Inbox } from 'lucide-react';

const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState('');

  const lidarRecuperacao = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setEnviado(true);
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setErro("ESTE E-MAIL NÃO ESTÁ REGISTADO NO SISTEMA.");
      } else if (err.code === 'auth/invalid-email') {
        setErro("FORMATO DE E-MAIL INVÁLIDO.");
      } else {
        setErro("FALHA AO PROCESSAR. TENTE NOVAMENTE.");
      }
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F1F5F9]">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <div className="p-12 pb-8 text-center relative">
          <Link 
            to="/login" 
            className="absolute top-8 left-8 p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
          >
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          </Link>
          
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
            {enviado ? <Inbox size={32} className="animate-bounce" /> : <Send size={32} />}
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">Recuperar Acesso</h2>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-3">Redefinição de Password Segura</p>
        </div>

        <div className="px-10 pb-12">
          {enviado ? (
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-2 opacity-10 text-emerald-600">
                  <CheckCircle2 size={40} />
                </div>
                <p className="text-emerald-700 text-xs font-bold leading-relaxed relative z-10 uppercase tracking-tight">
                  Enviámos as instruções para:<br/>
                  <span className="font-black text-sm block mt-1 lowercase">{email}</span>
                </p>
              </div>
              
              <div className="space-y-4">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                  Não recebeu? Verifique a pasta de <span className="text-slate-600">Spam</span> ou Promoções.
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={() => setEnviado(false)} 
                    className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-slate-200"
                  >
                    Tentar outro e-mail
                  </button>
                  <Link 
                    to="/login" 
                    className="w-full py-4 text-slate-400 font-black text-[10px] uppercase hover:text-slate-900 transition-all"
                  >
                    Voltar ao Login
                  </Link>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={lidarRecuperacao} className="space-y-6">
              {erro && (
                <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 border border-red-100 animate-in shake">
                  <ShieldAlert size={18} /> {erro}
                </div>
              )}

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">E-mail da sua Conta</label>
                <div className="relative group">
                  <Mail className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={18} />
                  <input 
                    required 
                    type="email" 
                    className="w-full bg-slate-50 p-5 pl-16 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold transition-all text-slate-700 placeholder:text-slate-300"
                    placeholder="o-seu@email.com" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
              </div>

              <button 
                disabled={carregando} 
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-xl shadow-slate-200 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {carregando ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <span className="uppercase tracking-[0.2em] text-[10px]">Enviar Link de Reposição</span>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenha;