import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Store, MapPin, Hash, Phone, 
  Save, Globe, Bell, ShieldCheck, CreditCard, Coins, Upload, Image as ImageIcon, X, Loader2
} from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Definicoes = ({ usuario, configLoja, avisar }) => {
  const [dados, setDados] = useState(configLoja);
  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setDados(configLoja);
  }, [configLoja]);

  // FUNÇÃO MESTRA: Comprime a imagem antes de guardar no Firebase
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
        const MAX_WIDTH = 400; // Tamanho ideal para recibos e interface
        const scaleSize = MAX_WIDTH / img.width;
        
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Exporta como JPEG com compressão de 70% (fica muito leve)
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

      // Gravação directa no Firebase para garantir sincronia global
      await setDoc(doc(db, "configuracoes", usuario.lojaId), {
        ...dados,
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
          <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Gestão da Unidade</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">
            Configuração de Recibos e Identidade Visual
          </p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">
          Unidade: {usuario.nomeLoja || 'Loja Principal'}
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
            <div className="space-y-1">
                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter">O sistema irá comprimir a imagem</p>
                <p className="text-[9px] text-blue-500 font-bold uppercase">automaticamente</p>
            </div>
          </div>

          <div className="bg-blue-50 p-6 rounded-[2rem] border border-blue-100">
             <div className="flex items-center gap-3 mb-2">
                <ShieldCheck size={18} className="text-blue-600"/>
                <span className="text-[10px] font-black text-blue-900 uppercase">Estado da Cloud</span>
             </div>
             <p className="text-[9px] text-blue-600 font-medium leading-relaxed">Os seus dados fiscais são encriptados e sincronizados com todos os terminais de venda da sua loja.</p>
          </div>
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
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Identificação Fiscal</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Nome da Empresa (Recibo)</label>
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
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Contactos e Local</h3>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Telefone</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all text-sm shadow-inner"
                        value={dados.telefone || ''} onChange={e => setDados({...dados, telefone: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Endereço Completo</label>
                      <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all text-sm shadow-inner"
                        value={dados.endereco || ''} onChange={e => setDados({...dados, endereco: e.target.value})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-8 rounded-[3rem] space-y-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <Coins size={20} className="text-slate-400"/>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter">Preferências do Sistema</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Moeda Principal</label>
                    <select className="w-full bg-white p-5 rounded-2xl outline-none font-black text-sm border-2 border-transparent focus:border-blue-500"
                      value={dados.moeda} onChange={e => setDados({...dados, moeda: e.target.value})}>
                      <option value="MT">Metical (MT)</option>
                      <option value="USD">Dólar ($)</option>
                      <option value="ZAR">Rand (R)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Mensagem no Rodapé do Recibo</label>
                    <input className="w-full bg-white p-5 rounded-2xl outline-none font-bold text-sm border-2 border-transparent focus:border-blue-500"
                      placeholder="Ex: Obrigado e volte sempre!"
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
                <span className="uppercase tracking-[0.3em] text-xs">Atualizar Dados da Unidade</span>
              </button>

            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Definicoes;