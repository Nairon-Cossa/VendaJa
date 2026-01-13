import React, { useState, useEffect } from 'react';
import { 
  Store, Utensils, Beer, Pill, Smartphone, 
  Shirt, ArrowRight, ArrowLeft, CheckCircle2, 
  Mail, Loader2, Sparkles, ShieldAlert, ImagePlus, KeyRound, Briefcase, ChevronRight,
  MessageCircle // Ícone do WhatsApp
} from 'lucide-react';
import { auth, db, storage } from '../firebase';
import { createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import emailjs from '@emailjs/browser';

const TIPOS_NEGOCIO = [
  { id: 'Mercearia', label: 'Mercearia & Mini-Mercado', icon: <Store size={20} />, color: 'bg-emerald-500' },
  { id: 'Restaurante/Bar', label: 'Restaurante & Takeaway', icon: <Utensils size={20} />, color: 'bg-orange-500' },
  { id: 'Bar/Bottle Store', label: 'Bar & Bottle Store', icon: <Beer size={20} />, color: 'bg-amber-500' },
  { id: 'Farmácia', label: 'Farmácia Pequena', icon: <Pill size={20} />, color: 'bg-red-500' },
  { id: 'Eletrónicos', label: 'Loja de Telefones & IT', icon: <Smartphone size={20} />, color: 'bg-blue-500' },
  { id: 'Loja de Roupa', label: 'Roupa & Cosméticos', icon: <Shirt size={20} />, color: 'bg-pink-500' },
  { id: 'Geral/Loja', label: 'Outro tipo de Loja', icon: <Briefcase size={20} />, color: 'bg-slate-500' },
];

const Registo = ({ setUsuario }) => {
  const [passo, setPasso] = useState(1);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const [sucessoVerificacao, setSucessoVerificacao] = useState(false);
  
  const [otpGerado, setOtpGerado] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  const [dados, setDados] = useState({
    nome: '', email: '', telemovel: '', senha: '', nomeLoja: '', tipoNegocio: '',
  });

  useEffect(() => {
    emailjs.init("BIe0eA3cQII1mgFcG");
  }, []);

  const lidarComImagem = (e) => {
    const arquivo = e.target.files[0];
    if (arquivo && arquivo.size <= 2 * 1024 * 1024) {
      setLogoFile(arquivo);
      setPreviewUrl(URL.createObjectURL(arquivo));
      setErro('');
    } else if (arquivo) {
      setErro("IMAGEM MUITO GRANDE. MÁXIMO 2MB.");
    }
  };

  const proximoPasso = () => {
    if (passo === 1 && !dados.tipoNegocio) {
        setErro("SELECIONE O RAMO DE ACTIVIDADE.");
        return;
    }
    setErro('');
    setPasso(passo + 1);
  };

  const iniciarVerificacao = async (e) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    const novoOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setOtpGerado(novoOtp);

    const templateParams = {
      to_name: dados.nome,
      to_email: dados.email, 
      otp_code: novoOtp,
      store_name: dados.nomeLoja
    };

    try {
      await emailjs.send('service_0jrg1rp', 'template_mhu5m1u', templateParams);
      setPasso(3);
    } catch (error) {
      console.error("Erro EmailJS:", error);
      setErro("FALHA AO ENVIAR CÓDIGO. VERIFIQUE A CONEXÃO.");
    } finally {
      setCarregando(false);
    }
  };

  const finalizarRegistoFinal = async () => {
    if (otpInput !== otpGerado) {
      setErro("CÓDIGO DE VERIFICAÇÃO INCORRECTO.");
      return;
    }

    setCarregando(true);
    setErro('');

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, dados.email, dados.senha);
      const user = userCredential.user;

      let urlFinalLogo = "";
      if (logoFile) {
        const storageRef = ref(storage, `logotipos/${user.uid}_${Date.now()}`);
        const uploadSnapshot = await uploadBytes(storageRef, logoFile);
        urlFinalLogo = await getDownloadURL(uploadSnapshot.ref);
      }

      const lojaId = `VENDA_${Math.random().toString(36).substr(2, 7).toUpperCase()}`;

      await setDoc(doc(db, "usuarios", user.uid), {
        uid: user.uid,
        nome: dados.nome,
        email: dados.email,
        telemovel: dados.telemovel,
        nomeLoja: dados.nomeLoja,
        tipoNegocio: dados.tipoNegocio,
        role: 'admin',
        lojaId: lojaId,
        status: 'pendente', // IMPORTANTE: Criado como pendente para aprovação
        criadoEm: serverTimestamp()
      });

      await setDoc(doc(db, "configuracoes", lojaId), {
        lojaId: lojaId,
        nome: dados.nomeLoja,
        logoUrl: urlFinalLogo,
        moeda: 'MT',
        telefone: dados.telemovel,
        configurado: true,
        criadoEm: serverTimestamp()
      });

      setSucessoVerificacao(true);
      // Não definimos o usuário aqui para não entrar no sistema automaticamente
      
    } catch (error) {
      console.error("Erro no Processo:", error);
      setErro(error.code === 'auth/email-already-in-use' ? "ESTE EMAIL JÁ ESTÁ EM USO." : "ERRO AO FINALIZAR CONTA.");
    } finally {
      setCarregando(false);
    }
  };

  // TELA DE AGUARDANDO ATIVAÇÃO (WHATSAPP)
  if (sucessoVerificacao) {
    const msgWhatsapp = encodeURIComponent(`Olá Nairon! Fiz o registo da minha loja "${dados.nomeLoja}" e gostaria de enviar o comprovativo para ativação. (Email: ${dados.email})`);
    
    return (
      <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 text-center">
        <div className="bg-white w-full max-w-md p-12 rounded-[3.5rem] shadow-2xl space-y-8 border border-slate-100 animate-in zoom-in duration-500">
          <div className="w-24 h-24 bg-amber-100 text-amber-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert size={48} className="animate-bounce" />
          </div>
          
          <div className="space-y-3">
            <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter leading-tight">Conta em Análise</h2>
            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest leading-relaxed">
                Registo concluído! Para começar a vender, precisamos de validar o seu comprovativo de pagamento.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 text-left">
             <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-tighter">Resumo do Registo:</p>
             <p className="text-sm font-black text-slate-800 uppercase italic">{dados.nomeLoja}</p>
             <p className="text-xs font-bold text-blue-600">{dados.email}</p>
          </div>

          <div className="space-y-3">
            <a 
              href={`https://wa.me/258842721864?text=${msgWhatsapp}`} // Coloca o teu número aqui
              target="_blank" 
              rel="noreferrer"
              className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:brightness-110 transition-all shadow-xl flex items-center justify-center gap-3"
            >
              <MessageCircle size={18} /> Mandar Comprovativo
            </a>
            
            <button 
                onClick={() => {
                    signOut(auth);
                    window.location.reload();
                }} 
                className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
                Sair e Entrar Depois
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-6 font-sans">
      <div className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row min-h-[750px] animate-in fade-in duration-700">
        
        {/* SIDEBAR INFORMATIVA */}
        <div className="bg-slate-900 md:w-96 p-14 text-white flex flex-col justify-between relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600/20 blur-[100px] rounded-full" />
          
          <div className="z-10">
            <div className="w-16 h-16 bg-blue-600 rounded-[2rem] flex items-center justify-center mb-10 shadow-lg shadow-blue-500/20">
              <Store size={32} />
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter uppercase mb-4">VendaJá</h2>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] leading-relaxed">O sistema de gestão que o seu negócio merece.</p>
          </div>

          <div className="space-y-8 z-10">
            {[
              { n: '01', t: 'Actividade', p: 1 },
              { n: '02', t: 'Identidade', p: 2 },
              { n: '03', t: 'Verificação', p: 3 }
            ].map((item) => (
              <div key={item.n} className={`flex items-center gap-6 transition-all duration-500 ${passo === item.p ? 'translate-x-4' : 'opacity-20'}`}>
                <span className={`text-xs font-black p-2 rounded-lg ${passo === item.p ? 'bg-blue-600 text-white' : 'bg-slate-800'}`}>{item.n}</span>
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">{item.t}</span>
              </div>
            ))}
          </div>

          <div className="z-10 pt-10 border-t border-slate-800">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Suporte 24/7 Ativo</p>
          </div>
        </div>

        {/* ÁREA DO FORMULÁRIO */}
        <div className="flex-1 p-10 md:p-20 flex flex-col justify-center relative bg-white">
          {erro && (
            <div className="absolute top-10 left-10 right-10 p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 border border-red-100 animate-in slide-in-from-top-4 z-20">
              <ShieldAlert size={18} />
              <span className="text-[9px] font-black uppercase tracking-widest">{erro}</span>
            </div>
          )}

          {passo === 1 && (
            <div className="animate-in fade-in slide-in-from-right-10 duration-500">
              <header className="mb-10">
                <h3 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter text-balance">Qual o seu ramo de negócio?</h3>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Escolha a categoria que melhor define a sua loja.</p>
              </header>

              <div className="grid grid-cols-1 gap-3 max-h-[380px] overflow-y-auto pr-4 custom-scrollbar">
                {TIPOS_NEGOCIO.map((tipo) => (
                  <button 
                    key={tipo.id} 
                    type="button" 
                    onClick={() => { setDados({...dados, tipoNegocio: tipo.id}); setErro(''); }}
                    className={`group flex items-center justify-between p-6 rounded-[2.5rem] border-2 transition-all ${dados.tipoNegocio === tipo.id ? 'border-blue-600 bg-blue-50/30' : 'border-slate-50 bg-slate-50/50 hover:border-slate-200'}`}
                  >
                    <div className="flex items-center gap-5">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${tipo.color} group-hover:scale-110 transition-transform`}>
                        {tipo.icon}
                      </div>
                      <span className="font-black text-slate-800 text-[11px] uppercase tracking-tight">{tipo.label}</span>
                    </div>
                    {dados.tipoNegocio === tipo.id && <CheckCircle2 size={20} className="text-blue-600" />}
                  </button>
                ))}
              </div>
              
              <button onClick={proximoPasso} className="w-full mt-10 bg-slate-900 text-white py-6 rounded-[2.5rem] font-black flex items-center justify-center gap-4 uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-blue-600 transition-all active:scale-95">
                Próximo Passo <ChevronRight size={18} />
              </button>
            </div>
          )}

          {passo === 2 && (
            <form onSubmit={iniciarVerificacao} className="animate-in fade-in slide-in-from-right-10 duration-500 space-y-5">
              <button type="button" onClick={() => setPasso(1)} className="text-slate-400 hover:text-blue-600 flex items-center gap-2 text-[9px] font-black uppercase mb-6 transition-colors font-bold">
                <ArrowLeft size={14} /> Voltar ao sector
              </button>

              <div className="bg-slate-50 p-6 rounded-[3rem] border-2 border-dashed border-slate-200 hover:border-blue-300 transition-colors group">
                <label className="flex items-center gap-6 cursor-pointer">
                   <div className="w-20 h-20 bg-white rounded-[1.8rem] flex items-center justify-center overflow-hidden border border-slate-100 shadow-sm group-hover:shadow-md transition-all">
                      {previewUrl ? <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" /> : <ImagePlus className="text-slate-300" size={28} />}
                   </div>
                   <div className="flex flex-col gap-1">
                     <span className="text-[10px] font-black uppercase text-slate-800 tracking-widest">Logotipo da Loja</span>
                     <span className="text-[9px] font-medium text-slate-400">JPG ou PNG até 2MB.</span>
                   </div>
                   <input type="file" className="hidden" accept="image/*" onChange={lidarComImagem} />
                </label>
              </div>

              <div className="space-y-4">
                <input required className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold text-sm transition-all shadow-sm" placeholder="Nome do Estabelecimento" value={dados.nomeLoja} onChange={e => setDados({...dados, nomeLoja: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <input required className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold text-sm transition-all shadow-sm" placeholder="Seu Nome" value={dados.nome} onChange={e => setDados({...dados, nome: e.target.value})} />
                  <input required className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold text-sm transition-all shadow-sm" placeholder="Telemóvel" value={dados.telemovel} onChange={e => setDados({...dados, telemovel: e.target.value})} />
                </div>

                <input required type="email" className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold text-sm transition-all shadow-sm" placeholder="Email Corporativo" value={dados.email} onChange={e => setDados({...dados, email: e.target.value})} />
                <input required type="password" className="w-full bg-slate-50 p-6 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-600/10 focus:bg-white font-bold text-sm transition-all shadow-sm" placeholder="Criar Senha de Acesso" value={dados.senha} onChange={e => setDados({...dados, senha: e.target.value})} />
              </div>

              <button type="submit" disabled={carregando} className="w-full bg-blue-600 text-white py-7 rounded-[2.5rem] font-black flex items-center justify-center gap-4 uppercase text-[10px] tracking-[0.2em] shadow-2xl hover:bg-slate-900 transition-all active:scale-95 disabled:opacity-50 mt-4">
                {carregando ? <Loader2 className="animate-spin" /> : <><Mail size={18} /> Validar e Continuar</>}
              </button>
            </form>
          )}

          {passo === 3 && (
            <div className="animate-in zoom-in duration-500 space-y-10 text-center max-w-sm mx-auto">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-[2.5rem] flex items-center justify-center mx-auto shadow-inner"><KeyRound size={40} /></div>
              
              <div>
                <h3 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Código de Segurança</h3>
                <p className="text-slate-400 text-[9px] font-black uppercase tracking-widest mt-2 leading-relaxed">Enviámos um PIN de 6 dígitos para o e-mail informado.</p>
              </div>

              <input 
                type="text" 
                maxLength="6" 
                value={otpInput} 
                onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-slate-50 p-8 text-center text-5xl font-black tracking-[0.5em] rounded-[3rem] border-2 border-transparent focus:border-blue-600 outline-none text-slate-900 shadow-inner" 
                placeholder="000000" 
              />

              <div className="space-y-4">
                <button 
                  onClick={finalizarRegistoFinal} 
                  disabled={carregando || otpInput.length < 6}
                  className="w-full bg-slate-900 text-white py-7 rounded-[2.5rem] font-black flex items-center justify-center gap-4 uppercase text-[10px] tracking-[0.2em] shadow-2xl disabled:opacity-30 hover:bg-blue-600 transition-all"
                >
                  {carregando ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Criar Minha Conta</>}
                </button>
                <button onClick={() => setPasso(2)} className="text-[9px] font-black text-slate-400 uppercase tracking-widest hover:text-blue-600 transition-colors">Voltar e Corrigir Email</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registo;