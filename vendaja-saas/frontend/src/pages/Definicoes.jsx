import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Store, MapPin, Hash, Phone, Link as LinkIcon,
  Save, Globe, Bell, ShieldCheck, CreditCard, Coins, Upload, Image as ImageIcon, X, Loader2, Crown, ExternalLink,
  Truck, Wallet, Building2
} from 'lucide-react'; // Corrigido para lucide-react
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Definicoes = ({ usuario, configLoja, avisar }) => {
  const [dados, setDados] = useState({
    ...configLoja,
    slugLoja: configLoja?.slugLoja || '',
    fazEntrega: configLoja?.fazEntrega || false,
    taxaEntrega: configLoja?.taxaEntrega || 0,
    permiteLevantamento: configLoja?.permiteLevantamento !== undefined ? configLoja.permiteLevantamento : true,
    aceitaMpesa: configLoja?.aceitaMpesa || false,
    numeroMpesa: configLoja?.numeroMpesa || '',
    nomeMpesa: configLoja?.nomeMpesa || '',
    aceitaEmola: configLoja?.aceitaEmola || false,
    numeroEmola: configLoja?.numeroEmola || '',
    aceitaMkesh: configLoja?.aceitaMkesh || false,
    numeroMkesh: configLoja?.numeroMkesh || '',
    aceitaBanco: configLoja?.aceitaBanco || false,
    dadosBancarios: configLoja?.dadosBancarios || ''
  });

  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileInputRef = useRef(null);

  const isPremium = usuario?.plano === 'premium' || usuario?.role === 'superadmin';

  useEffect(() => {
    if (configLoja) {
      setDados(prev => ({ ...prev, ...configLoja }));
    }
  }, [configLoja]);

  // Formata o slug: remove espaços, acentos e caracteres especiais
  const formatarSlug = (texto) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  };

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
        avisar("IMAGEM PROCESSADA", "sucesso");
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

      // Se não for premium, o slug é limpo ou ignorado
      const finalSlug = isPremium 
        ? (dados.slugLoja ? formatarSlug(dados.slugLoja) : formatarSlug(usuario.nomeLoja))
        : null;

      await setDoc(doc(db, "configuracoes", usuario.uid), {
        ...dados,
        slugLoja: finalSlug,
        ultimaAtualizacao: new Date().toISOString()
      }, { merge: true });

      avisar("DEFINIÇÕES GUARDADAS", "sucesso");
    } catch (error) {
      console.error(error);
      avisar("ERRO AO GUARDAR", "erro");
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
          ID: {usuario.uid}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1 space-y-6">
          {/* LOGOTIPO */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-center space-y-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logotipo Oficial</p>
            <div className="relative group mx-auto w-44 h-44">
              <div className="w-full h-full bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                {carregandoImagem ? <Loader2 size={32} className="animate-spin text-blue-500" /> : dados.logo ? <img src={dados.logo} alt="Logo" className="w-full h-full object-contain p-4" /> : <ImageIcon size={40} className="text-slate-300" />}
              </div>
              <button type="button" onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all rounded-[2.5rem] flex items-center justify-center text-white flex-col gap-2 backdrop-blur-sm">
                <Upload size={20} />
                <span className="text-[8px] font-black uppercase">Carregar Foto</span>
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
          </div>

          {/* LINK DA LOJA (SLUG) */}
          <div className={`p-8 rounded-[3rem] border shadow-sm transition-all ${isPremium ? 'bg-white border-slate-100' : 'bg-slate-50 border-transparent opacity-75'}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className={`p-2 rounded-lg ${isPremium ? 'bg-purple-50 text-purple-600' : 'bg-slate-200 text-slate-400'}`}>
                <LinkIcon size={18} />
              </div>
              <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-sm">Link da Loja</h3>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-2">URL Personalizada</label>
                <div className="flex flex-col gap-2">
                  <input 
                    disabled={!isPremium}
                    className="w-full bg-slate-100 p-4 rounded-2xl outline-none border-2 border-transparent focus:border-purple-500 font-bold text-xs transition-all disabled:cursor-not-allowed"
                    placeholder="ex: minha-loja"
                    value={dados.slugLoja || ''}
                    onChange={(e) => setDados({...dados, slugLoja: formatarSlug(e.target.value)})}
                  />
                </div>
              </div>

              {isPremium ? (
                <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800">
                  <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Visualização:</p>
                  <p className="text-[10px] font-mono text-blue-300 break-all">
                    venda-ja.pt/loja/{dados.slugLoja || '...'}
                  </p>
                </div>
              ) : (
                <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <p className="text-[9px] text-amber-700 font-bold leading-tight uppercase">
                    🔒 Disponível apenas no plano Premium
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-3">
          <form onSubmit={salvarDefinicoes} className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-8 md:p-12 space-y-10">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* IDENTIDADE E CONTACTOS */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black italic">!</div>
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Identidade</h3>
                  </div>
                  <div className="space-y-4">
                    <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm"
                      placeholder="Nome no Recibo" value={dados.nomeOficial || ''} onChange={e => setDados({...dados, nomeOficial: e.target.value})} />
                    <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm"
                      placeholder="NUIT" value={dados.nuit || ''} onChange={e => setDados({...dados, nuit: e.target.value})} />
                    <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm"
                      placeholder="Telefone / WhatsApp" value={dados.telefone || ''} onChange={e => setDados({...dados, telefone: e.target.value})} />
                    <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm"
                      placeholder="Endereço Físico" value={dados.endereco || ''} onChange={e => setDados({...dados, endereco: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center"><Truck size={18}/></div>
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Logística</h3>
                  </div>
                  <div className="space-y-4 bg-slate-50 p-6 rounded-[2.5rem]">
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={dados.fazEntrega} onChange={e => setDados({...dados, fazEntrega: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                      <span className="text-xs font-black uppercase text-slate-700">Fazemos Entregas</span>
                    </label>
                    {dados.fazEntrega && (
                      <input type="number" className="w-full bg-white p-4 rounded-2xl outline-none border border-slate-200 font-bold text-sm"
                        placeholder="Taxa de Entrega (MT)" value={dados.taxaEntrega} onChange={e => setDados({...dados, taxaEntrega: e.target.value})} />
                    )}
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input type="checkbox" checked={dados.permiteLevantamento} onChange={e => setDados({...dados, permiteLevantamento: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                      <span className="text-xs font-black uppercase text-slate-700">Levantamento na Loja</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* MÉTODOS DE PAGAMENTO */}
              {isPremium && (
                <div className="pt-6 border-t border-slate-100 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center"><Wallet size={18}/></div>
                    <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-lg">Pagamentos Aceites</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className={`p-6 rounded-[2.5rem] transition-all border-2 ${dados.aceitaMpesa ? 'bg-white border-pink-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}>
                      <label className="flex items-center gap-3 cursor-pointer mb-4">
                        <input type="checkbox" checked={dados.aceitaMpesa} onChange={e => setDados({...dados, aceitaMpesa: e.target.checked})} className="w-5 h-5 accent-pink-600" />
                        <span className="text-xs font-black uppercase text-pink-700">M-Pesa</span>
                      </label>
                      {dados.aceitaMpesa && (
                        <div className="space-y-3">
                          <input className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-slate-200 text-sm font-bold" placeholder="Número M-Pesa" value={dados.numeroMpesa} onChange={e => setDados({...dados, numeroMpesa: e.target.value})} />
                          <input className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-slate-200 text-sm font-bold" placeholder="Nome Titular" value={dados.nomeMpesa} onChange={e => setDados({...dados, nomeMpesa: e.target.value})} />
                        </div>
                      )}
                    </div>

                    <div className={`p-6 rounded-[2.5rem] transition-all border-2 ${dados.aceitaEmola ? 'bg-white border-orange-200 shadow-sm' : 'bg-slate-50 border-transparent opacity-60'}`}>
                      <label className="flex items-center gap-3 cursor-pointer mb-4">
                        <input type="checkbox" checked={dados.aceitaEmola} onChange={e => setDados({...dados, aceitaEmola: e.target.checked})} className="w-5 h-5 accent-orange-600" />
                        <span className="text-xs font-black uppercase text-orange-700">e-Mola</span>
                      </label>
                      {dados.aceitaEmola && (
                        <input className="w-full bg-slate-50 p-3 rounded-xl outline-none border border-slate-200 text-sm font-bold" placeholder="Número e-Mola" value={dados.numeroEmola} onChange={e => setDados({...dados, numeroEmola: e.target.value})} />
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button type="submit" disabled={salvando} className={`w-full py-8 rounded-[2.5rem] font-black flex items-center justify-center gap-4 transition-all active:scale-95 shadow-2xl ${salvando ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-slate-900 shadow-blue-200'}`}>
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