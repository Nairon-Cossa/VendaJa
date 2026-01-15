import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { sendPasswordResetEmail } from "firebase/auth";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  Mail, ArrowLeft, Loader2, Send, CheckCircle2, 
  ShieldAlert, Inbox, KeyRound, Sparkles, ChevronRight 
} from 'lucide-react';
import emailjs from '@emailjs/browser';

const RecuperarSenha = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [passo, setPasso] = useState(1); // 1: Email, 2: OTP, 3: Sucesso
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  
  const [otpGerado, setOtpGerado] = useState('');
  const [otpInput, setOtpInput] = useState('');

  useEffect(() => {
    // Inicializa com a mesma chave do seu Registo
    emailjs.init("BIe0eA3cQII1mgFcG");
  }, []);

  // FUNÇÃO PARA ENVIAR O CÓDIGO (PASSO 1)
  const enviarCodigoRecuperacao = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      // 1. Verificar se o utilizador existe no sistema
      const q = query(collection(db, "usuarios"), where("email", "==", email.trim().toLowerCase()));
      const snap = await getDocs(q);

      if (snap.empty) {
        setErro("ESTE E-MAIL NÃO ESTÁ REGISTADO NO SISTEMA.");
        setCarregando(false);
        return;
      }

      const dadosUsuario = snap.docs[0].data();
      const novoOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setOtpGerado(novoOtp);

      // 2. Enviar via EmailJS (Usando o mesmo template do registo ou um de recuperação)
      const templateParams = {
        to_name: dadosUsuario.nome,
        to_email: email, 
        otp_code: novoOtp,
        store_name: "Recuperação de Acesso - VendaJá"
      };

      // Nota: Use o seu ServiceID e TemplateID do EmailJS
      await emailjs.send('service_0jrg1rp', 'template_mhu5m1u', templateParams);
      
      setPasso(2);
    } catch (err) {
      console.error(err);
      setErro("FALHA AO ENVIAR CÓDIGO. TENTE NOVAMENTE.");
    } finally {
      setCarregando(false);
    }
  };

  // FUNÇÃO PARA VALIDAR OTP E DISPARAR RESET (PASSO 2)
  const validarOtpERefinir = async () => {
    if (otpInput !== otpGerado) {
      setErro("CÓDIGO DE VERIFICAÇÃO INCORRECTO.");
      return;
    }

    setCarregando(true);
    try {
      // Aqui o Firebase entra para garantir que a troca de senha seja segura
      await sendPasswordResetEmail(auth, email.trim().toLowerCase());
      setPasso(3);
    } catch (err) {
      setErro("ERRO AO GERAR LINK DE SEGURANÇA.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F1F5F9]">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500">
        
        {/* HEADER */}
        <div className="p-12 pb-8 text-center relative">
          {passo < 3 && (
            <button 
              onClick={() => passo === 2 ? setPasso(1) : navigate('/login')}
              className="absolute top-8 left-8 p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
            </button>
          )}
          
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner">
            {passo === 1 && <Send size={32} />}
            {passo === 2 && <KeyRound size={32} className="animate-pulse" />}
            {passo === 3 && <CheckCircle2 size={32} className="text-emerald-500" />}
          </div>
          
          <h2 className="text-3xl font-black text-slate-900 italic tracking-tighter uppercase">
            {passo === 1 && "Recuperar"}
            {passo === 2 && "Verificar"}
            {passo === 3 && "Sucesso"}
          </h2>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-3">
            {passo === 3 ? "Verifique o seu e-mail" : "Proteção de Acesso VendaJá"}
          </p>
        </div>

        <div className="px-10 pb-12">
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 border border-red-100 mb-6 animate-in shake">
              <ShieldAlert size={18} /> {erro}
            </div>
          )}

          {passo === 1 && (
            <form onSubmit={enviarCodigoRecuperacao} className="space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-5">E-mail da conta</label>
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
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {carregando ? <Loader2 className="animate-spin" size={20} /> : <span className="uppercase tracking-[0.2em] text-[10px]">Enviar PIN de Acesso</span>}
              </button>
            </form>
          )}

          {passo === 2 && (
            <div className="space-y-8 text-center">
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                Introduza o código enviado para:<br/>
                <span className="text-blue-600 lowercase">{email}</span>
              </p>
              
              <input 
                type="text" 
                maxLength="6" 
                value={otpInput} 
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 p-6 text-center text-4xl font-black tracking-[0.5em] rounded-[2.5rem] border-2 border-transparent focus:border-blue-600 outline-none transition-all" 
                placeholder="000000" 
              />

              <button 
                onClick={validarOtpERefinir}
                disabled={carregando || otpInput.length < 6}
                className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl disabled:opacity-30 transition-all"
              >
                {carregando ? <Loader2 className="animate-spin mx-auto" size={20} /> : "Verificar e Redefinir"}
              </button>
            </div>
          )}

          {passo === 3 && (
            <div className="text-center space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="p-8 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                <p className="text-emerald-700 text-[10px] font-bold leading-relaxed uppercase tracking-tight">
                  Código validado! Enviámos um <span className="font-black text-emerald-900">link seguro</span> para o seu e-mail para criar a nova senha.
                </p>
              </div>
              
              <div className="space-y-4">
                <Link 
                  to="/login" 
                  className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 transition-all block"
                >
                  Voltar ao Login
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecuperarSenha; 