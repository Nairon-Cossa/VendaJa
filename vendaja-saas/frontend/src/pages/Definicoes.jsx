import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Store, MapPin, Hash, Phone, 
  Save, Globe, Bell, ShieldCheck, CreditCard, Coins, Upload, Image as ImageIcon, X, Loader2, Crown, ExternalLink
} from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Definicoes = ({ usuario, configLoja, avisar }) => {
  const [dados, setDados] = useState(configLoja);
  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileInputRef = useRef(null);

  // Verificação de plano
  const isPremium = usuario?.plano === 'premium';

  useEffect(() => {
    setDados(configLoja);
  }, [configLoja]);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCarregandoImagem(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;

      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400; 
        const scaleSize = MAX_WIDTH / img.width;
        
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
        
        setDados({ ...dados, logo: dataUrl });
        setCarregandoImagem(false);
        avisar("IMAGEM PROCESSADA E OPTIMIZADA", "sucesso");
      };
    };
    reader.readAsDataURL(file);
  };

  const salvarDefinicoes = async (e) => {
    e.preventDefault();
    setSalvando(true);
    
    try {
      if (!dados.nuit || !dados.telefone || !dados.endereco) {
        avisar("NUIT, TELEFONE E ENDEREÇO SÃO OBRIGATÓRIOS", "info");
        setSalvando(false);
        return;
      }

      await setDoc(doc(db, "configuracoes", usuario.lojaId), {
        ...dados,
        slugLoja: isPremium ? (dados.slugLoja || usuario.nomeLoja?.toLowerCase().replace(/\s+/g, '-')) : null,
        ultimaAtualizacao: new Date().toISOString()
      }, { merge: true });

      avisar("DEFINIÇÕES SINCRONIZADAS NO CLOUD", "sucesso");
    } catch (error) {
      console.error(error);
      avisar("ERRO AO GUARDAR NO FIREBASE", "erro");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto space-y-8 pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-3">
            Gestão da Unidade {isPremium && <Crown className="text-amber-500" size={28} />}
          </h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">
            Plano: <span className={isPremium ? "text-amber-600" : "text-blue-600"}>{usuario?.plano?.toUpperCase() || 'BÁSICO'}</span>
          </p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">
          ID: {usuario.lojaId}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* LADO ESQUERDO: IDENTIDADE VISUAL */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logotipo Oficial</p>
            
            <div className="relative group mx-auto w-44 h-44">
              <div className="w-full h-full bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                {carregandoImagem ? (
                  <Loader2 size={32} className="animate-spin text-blue-500" />
                ) : dados.logo ? (
                  <img src={dados.logo} alt="Logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <ImageIcon size={40} className="text-slate-300" />
                )}
              </div>
              
              <button 
                type="button"
                onClick={() => fileInputRef.current.click()}
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all rounded-[2.5rem] flex items-center justify-center text-white flex-col gap-2 backdrop-blur-sm"
              >
                <Upload size={20} />
                <span className="text-[8px] font-black uppercase">Carregar Foto</span>
              </button>
              
              {dados.logo && !carregandoImagem && (
                <button 
                  type="button"
                  onClick={() => setDados({...dados, logo: ''})}
                  className="absolute -top-2 -right-2 bg-red-500 text-white p-2 rounded-full shadow-lg hover:scale-110 transition-all"
                >
                  <X size={12} />
                </button>
              )}
            </div>
            
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
          </div>

          {/* CARD PREMIUM PROMO / STATUS */}
          {isPremium ? (
            <div className="bg-slate-900 p-6 rounded-[2rem] border border-slate-800 text-white">
               <div className="flex items-center gap-3 mb-4">
                <Globe size={18} className="text-blue-400"/>
                <span className="text-[10px] font-black uppercase">Loja Online Ativa</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mb-2">Seu link oficial:</p>
              <div className="bg-slate-800 p-3 rounded-xl text-[10px] font-mono break-all text-blue-300 border border-slate-700">
                vendaja.com/{dados.slugLoja || usuario.nomeLoja?.toLowerCase().replace(/\s+/g, '-')}
              </div>
            </div>
          ) : (
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
              <div className="flex items-center gap-3 mb-2">
                <Crown size={18} className="text-amber-600"/>
                <span className="text-[10px] font-black text-amber-900 uppercase">Upgrade para Premium</span>
              </div>
              <p className="text-[9px] text-amber-700 font-medium leading-relaxed">Desbloqueie a sua loja online, catálogo digital e gestão de stock avançada.</p>
              <button 
                type="button"
                onClick={() => window.open(`https://wa.me/258878296706?text=Upgrade+Premium+Loja+${usuario.nomeLoja}`, '_blank')}
                className="mt-4 w-full bg-amber-600 text-white py-3 rounded-xl font-black text-[9px] uppercase tracking-widest"
              >
                Saber Mais
              </button>
            </div>
          )}
        </div>

        {/* LADO DIREITO: FORMULÁRIO */}
        <div className="lg:col-span-3">
          <form onSubmit={salvarDefinicoes} className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-12 space-y-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* FISCAL */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black italic">!</div>
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Dados do Recibo</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nome no Recibo</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all text-sm shadow-inner"
                        placeholder="Ex: Minha Loja, Lda"
                        value={dados.nomeOficial || ''} onChange={e => setDados({...dados, nomeOficial: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">NUIT</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all text-sm shadow-inner"
                        placeholder="400..."
                        value={dados.nuit || ''} onChange={e => setDados({...dados, nuit: e.target.value})} />
                    </div>
                  </div>
                </div>

                {/* CONTACTOS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><Phone size={18}/></div>
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Contactos</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Telefone Principal</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all text-sm shadow-inner"
                        value={dados.telefone || ''} onChange={e => setDados({...dados, telefone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Endereço Físico</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all text-sm shadow-inner"
                        value={dados.endereco || ''} onChange={e => setDados({...dados, endereco: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              {/* SECÇÃO EXCLUSIVA PREMIUM: PRESENÇA ONLINE */}
              {isPremium && (
                <div className="bg-slate-900 p-8 rounded-[3rem] space-y-6 border border-slate-800 text-white">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Globe size={20} className="text-blue-400"/>
                      <h3 className="font-black uppercase italic tracking-tighter text-lg">Identidade Digital (Premium)</h3>
                    </div>
                    <ExternalLink size={18} className="text-slate-500" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-500 ml-4">Subdomínio da Loja</label>
                      <div className="flex items-center bg-slate-800 rounded-[2rem] border-2 border-slate-700 focus-within:border-blue-500 transition-all overflow-hidden">
                        <span className="pl-6 text-slate-500 text-xs font-bold">vendaja.com/</span>
                        <input className="w-full bg-transparent p-5 pl-1 outline-none font-bold text-sm text-blue-300"
                          placeholder="minha-loja"
                          value={dados.slugLoja || ''} onChange={e => setDados({...dados, slugLoja: e.target.value.toLowerCase().replace(/\s+/g, '-')})} />
                      </div>
                      <p className="text-[8px] text-slate-500 ml-4 uppercase font-bold tracking-widest italic">Este será o seu link público para clientes</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-slate-50 p-8 rounded-[3rem] space-y-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <Coins size={20} className="text-slate-400"/>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter">Moeda e Rodapé</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Moeda</label>
                    <select className="w-full bg-white p-5 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-blue-500"
                      value={dados.moeda} onChange={e => setDados({...dados, moeda: e.target.value})}>
                      <option value="MT">Metical (MT)</option>
                      <option value="USD">Dólar ($)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mensagem do Recibo</label>
                    <input className="w-full bg-white p-5 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-500"
                      value={dados.mensagemRecibo} onChange={e => setDados({...dados, mensagemRecibo: e.target.value})} />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={salvando}
                className={`w-full py-8 rounded-[2.5rem] font-black flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${salvando ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-slate-900 shadow-blue-200'}`}
              >
                {salvando ? <Loader2 className="animate-spin" /> : <Save size={24} />}
                <span className="uppercase tracking-[0.3em] text-xs">{salvando ? 'A Sincronizar...' : 'Gravar Alterações'}</span>
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Definicoes;