import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, ShieldAlert } from 'lucide-react';

const RedefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const oobCode = searchParams.get('oobCode'); // O código secreto do Firebase no link

  const [novaSenha, setNovaSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [sucesso, setSucesso] = useState(false);
  const [erro, setErro] = useState('');

  const lidarComRedefinicao = async (e) => {
    e.preventDefault();
    if (novaSenha !== confirmarSenha) {
      setErro("AS SENHAS NÃO COINCIDEM.");
      return;
    }
    if (novaSenha.length < 6) {
      setErro("A SENHA DEVE TER NO MÍNIMO 6 CARACTERES.");
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      await confirmPasswordReset(auth, oobCode, novaSenha);
      setSucesso(true);
      setTimeout(() => navigate('/login'), 5000);
    } catch (err) {
      setErro("LINK EXPIRADO OU INVÁLIDO. PEÇA UMA NOVA RECUPERAÇÃO.");
    } finally {
      setCarregando(false);
    }
  };

  if (!oobCode) {
    return <div className="h-screen flex items-center justify-center font-black">ACESSO INVÁLIDO.</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#F1F5F9]">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl border border-slate-100 overflow-hidden">
        <div className="p-12 pb-8 text-center">
          <div className="w-20 h-20 bg-blue-50 rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-blue-600">
            {sucesso ? <CheckCircle2 size={32} className="text-emerald-500" /> : <Lock size={32} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">
            {sucesso ? "Senha Alterada" : "Nova Senha"}
          </h2>
          <p className="text-slate-400 text-[9px] font-black uppercase tracking-[0.2em] mt-3">Segurança VendaJá Pro</p>
        </div>

        <div className="px-10 pb-12">
          {erro && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase flex items-center gap-3 mb-6">
              <ShieldAlert size={18} /> {erro}
            </div>
          )}

          {sucesso ? (
            <div className="text-center space-y-6">
              <p className="text-emerald-600 font-bold text-[10px] uppercase">A sua senha foi atualizada com sucesso! A redirecionar para o login...</p>
              <button onClick={() => navigate('/login')} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase text-[10px]">Ir para Login Agora</button>
            </div>
          ) : (
            <form onSubmit={lidarComRedefinicao} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <input 
                    type={mostrarSenha ? "text" : "password"} 
                    required 
                    placeholder="NOVA SENHA"
                    className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 font-bold text-slate-700"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                  />
                  <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300">
                    {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <input 
                  type="password" 
                  required 
                  placeholder="CONFIRMAR NOVA SENHA"
                  className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 font-bold text-slate-700"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                />
              </div>
              <button type="submit" disabled={carregando} className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-3">
                {carregando ? <Loader2 className="animate-spin" size={20} /> : <span className="uppercase tracking-widest text-[10px]">Atualizar Senha</span>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RedefinirSenha;