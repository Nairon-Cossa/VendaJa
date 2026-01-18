import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Store, MapPin, Hash, Phone, Link as LinkIcon,
  Save, Globe, Bell, ShieldCheck, CreditCard, Coins, Upload, Image as ImageIcon, X, Loader2, Crown, ExternalLink,
  Truck, Wallet, Building2, Briefcase, MessageSquare, Facebook, Instagram
} from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc, getDocs, query, collection, where } from 'firebase/firestore';

const Definicoes = ({ usuario, configLoja, avisar }) => {
  const [dados, setDados] = useState({
    nomeOficial: configLoja?.nomeOficial || '',
    nuit: configLoja?.nuit || '',
    telefone: configLoja?.telefone || '',
    endereco: configLoja?.endereco || '',
    tipoNegocio: configLoja?.tipoNegocio || 'Geral',
    moeda: configLoja?.moeda || 'MT',
    // LOGÍSTICA
    slugLoja: configLoja?.slugLoja || '',
    fazEntrega: configLoja?.fazEntrega || false,
    taxaEntrega: configLoja?.taxaEntrega || 0,
    permiteLevantamento: configLoja?.permiteLevantamento !== undefined ? configLoja.permiteLevantamento : true,
    // PAGAMENTOS
    aceitaMpesa: configLoja?.aceitaMpesa || false,
    numeroMpesa: configLoja?.numeroMpesa || '',
    nomeMpesa: configLoja?.nomeMpesa || '',
    aceitaEmola: configLoja?.aceitaEmola || false,
    numeroEmola: configLoja?.numeroEmola || '',
    aceitaBanco: configLoja?.aceitaBanco || false,
    bancoNome: configLoja?.bancoNome || '',
    bancoIban: configLoja?.bancoIban || '',
    // EXTRA RECIBO
    rodapeRecibo: configLoja?.rodapeRecibo || 'Obrigado pela preferência!',
    logo: configLoja?.logo || null
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

  const formatarSlug = (texto) => {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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
        setDados({ ...dados, logo: canvas.toDataURL('image/jpeg', 0.8) });
        setCarregandoImagem(false);
        avisar("LOGO ATUALIZADO", "sucesso");
      };
    };
    reader.readAsDataURL(file);
  };

  const salvarDefinicoes = async (e) => {
    e.preventDefault();
    setSalvando(true);
    try {
      if (!dados.nuit || !dados.telefone || !dados.endereco) {
        avisar("DADOS ESSENCIAIS EM FALTA", "erro");
        setSalvando(false);
        return;
      }

      let finalSlug = dados.slugLoja || formatarSlug(usuario.nomeLoja);
      if (isPremium && dados.slugLoja) {
        const qCheck = query(collection(db, "configuracoes"), where("slugLoja", "==", dados.slugLoja));
        const checkSnap = await getDocs(qCheck);
        const existeOutro = checkSnap.docs.find(doc => doc.id !== usuario.uid);
        if (existeOutro) {
           avisar("LINK JÁ EM USO POR OUTRA LOJA", "erro");
           setSalvando(false);
           return;
        }
      }

      await setDoc(doc(db, "configuracoes", usuario.uid), {
        ...dados,
        slugLoja: isPremium ? finalSlug : '',
        ultimaAtualizacao: new Date().toISOString()
      }, { merge: true });

      avisar("SISTEMA ATUALIZADO!", "sucesso");
    } catch (error) {
      avisar("ERRO AO GUARDAR", "erro");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-8 pb-20">
      
      {/* HEADER DINÂMICO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
        <div>
          <h2 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-3">
            Definições do Sistema {isPremium && <Crown className="text-amber-500 animate-bounce" size={28} />}
          </h2>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2 flex items-center gap-2">
            <ShieldCheck size={14} className="text-emerald-500" /> Unidade de Negócio Verificada
          </p>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-slate-400 uppercase">Estado da Conta</p>
                <p className={`text-xs font-black ${isPremium ? 'text-amber-600' : 'text-blue-600'}`}>PLANO {usuario?.plano?.toUpperCase()}</p>
            </div>
            <div className="h-12 w-[2px] bg-slate-100 hidden md:block"></div>
            <button onClick={salvarDefinicoes} disabled={salvando} className="bg-blue-600 hover:bg-slate-900 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-200 flex items-center gap-3 active:scale-95">
                {salvando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {salvando ? 'A GUARDAR...' : 'Gravar Tudo'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA ESQUERDA: BRANDING & LINK */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-6">Identidade Visual</p>
            <div className="relative group mx-auto w-52 h-52">
              <div className="w-full h-full bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-200">
                {carregandoImagem ? <Loader2 size={32} className="animate-spin text-blue-500" /> : dados.logo ? <img src={dados.logo} alt="Logo" className="w-full h-full object-contain p-6" /> : <ImageIcon size={48} className="text-slate-200" />}
              </div>
              <button type="button" onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all rounded-[3rem] flex items-center justify-center text-white flex-col gap-2 backdrop-blur-sm">
                <Upload size={24} />
                <span className="text-[10px] font-black uppercase tracking-tighter">Alterar Logo</span>
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
          </div>

          <div className={`p-8 rounded-[3rem] border transition-all ${isPremium ? 'bg-slate-900 text-white border-transparent shadow-2xl' : 'bg-slate-50 border-slate-200 opacity-60'}`}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black uppercase italic tracking-tighter text-sm flex items-center gap-2">
                <Globe size={18} className="text-blue-400" /> Loja Online
              </h3>
              {!isPremium && <Crown size={16} className="text-amber-500" />}
            </div>
            <div className="space-y-4">
              <input 
                disabled={!isPremium}
                className="w-full bg-white/10 p-4 rounded-2xl outline-none border border-white/10 focus:border-blue-500 font-bold text-xs transition-all placeholder:text-white/20"
                placeholder="slug-da-tua-loja"
                value={dados.slugLoja}
                onChange={(e) => setDados({...dados, slugLoja: formatarSlug(e.target.value)})}
              />
              <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Link Público:</p>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-mono text-blue-400 truncate">venda-ja.pt/{dados.slugLoja || '...'}</p>
                    <ExternalLink size={12} className="text-slate-600 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA DIREITA: CONFIGURAÇÕES CORE */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* SECÇÃO 1: CORE BUSINESS */}
          <div className="bg-white rounded-[3.5rem] shadow-sm border border-slate-100 p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Store size={20}/></div>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-xl">Dados Fiscais</h3>
                </div>
                <div className="space-y-4">
                  <div className="group">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Nome Comercial (Recibo)</label>
                    <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm transition-all"
                      value={dados.nomeOficial} onChange={e => setDados({...dados, nomeOficial: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">NUIT</label>
                        <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm transition-all"
                        value={dados.nuit} onChange={e => setDados({...dados, nuit: e.target.value})} />
                    </div>
                    <div>
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Moeda do Sistema</label>
                        <select className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-black text-sm transition-all appearance-none"
                        value={dados.moeda} onChange={e => setDados({...dados, moeda: e.target.value})}>
                            <option value="MT">MT (Metical)</option>
                            <option value="USD">USD (Dólar)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="ZAR">ZAR (Rand)</option>
                        </select>
                    </div>
                  </div>
                  <div className="group">
                    <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Sector de Actividade</label>
                    <select className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-black text-sm transition-all appearance-none"
                      value={dados.tipoNegocio} onChange={e => setDados({...dados, tipoNegocio: e.target.value})}>
                        <option value="Geral">🛒 Comércio Geral</option>
                        <option value="Mercearia">🍏 Mercearia / Super</option>
                        <option value="Restaurante/Bar">🍔 Restaurante / Bar</option>
                        <option value="Oficina">🔧 Oficina Mecânica</option>
                        <option value="Farmácia">💊 Farmácia</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 mb-2">
                  <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center shadow-inner"><Truck size={20}/></div>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-xl">Logística</h3>
                </div>
                <div className="space-y-4 bg-slate-50 p-8 rounded-[3rem] border border-slate-100">
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-black uppercase text-slate-700 group-hover:text-blue-600 transition-colors">Entrega ao Domicílio</span>
                    <input type="checkbox" checked={dados.fazEntrega} onChange={e => setDados({...dados, fazEntrega: e.target.checked})} className="w-6 h-6 accent-blue-600" />
                  </label>
                  {dados.fazEntrega && (
                    <div className="animate-in zoom-in-95 duration-200">
                        <label className="text-[9px] font-black uppercase text-slate-400 ml-2 mb-1 block">Taxa Fixa ({dados.moeda})</label>
                        <input type="number" className="w-full bg-white p-4 rounded-2xl outline-none border border-slate-200 font-black text-sm text-blue-600"
                        value={dados.taxaEntrega} onChange={e => setDados({...dados, taxaEntrega: e.target.value})} />
                    </div>
                  )}
                  <div className="h-[1px] bg-slate-200 my-2"></div>
                  <label className="flex items-center justify-between cursor-pointer group">
                    <span className="text-xs font-black uppercase text-slate-700 group-hover:text-blue-600 transition-colors">Levantamento Local</span>
                    <input type="checkbox" checked={dados.permiteLevantamento} onChange={e => setDados({...dados, permiteLevantamento: e.target.checked})} className="w-6 h-6 accent-blue-600" />
                  </label>
                </div>
              </div>
            </div>

            {/* SECÇÃO 2: FINANCEIRA & PAGAMENTOS */}
            <div className="mt-12 pt-12 border-t border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-pink-50 text-pink-600 rounded-2xl flex items-center justify-center shadow-inner"><CreditCard size={20}/></div>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-xl">Configuração de Pagamentos</h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* MPESA */}
                    <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${dados.aceitaMpesa ? 'bg-pink-50/30 border-pink-200 shadow-xl' : 'bg-slate-50 border-transparent opacity-60'}`}>
                        <label className="flex items-center gap-3 mb-4 cursor-pointer">
                            <input type="checkbox" checked={dados.aceitaMpesa} onChange={e => setDados({...dados, aceitaMpesa: e.target.checked})} className="w-5 h-5 accent-pink-600" />
                            <span className="text-xs font-black uppercase text-pink-700 italic">M-Pesa</span>
                        </label>
                        {dados.aceitaMpesa && (
                            <div className="space-y-2 animate-in fade-in">
                                <input className="w-full bg-white p-3 rounded-xl border border-pink-100 text-[11px] font-bold outline-none focus:border-pink-400" placeholder="84XXXXXXX" value={dados.numeroMpesa} onChange={e => setDados({...dados, numeroMpesa: e.target.value})} />
                                <input className="w-full bg-white p-3 rounded-xl border border-pink-100 text-[11px] font-bold outline-none focus:border-pink-400" placeholder="Nome do Agente" value={dados.nomeMpesa} onChange={e => setDados({...dados, nomeMpesa: e.target.value})} />
                            </div>
                        )}
                    </div>

                    {/* EMOLA */}
                    <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${dados.aceitaEmola ? 'bg-orange-50/30 border-orange-200 shadow-xl' : 'bg-slate-50 border-transparent opacity-60'}`}>
                        <label className="flex items-center gap-3 mb-4 cursor-pointer">
                            <input type="checkbox" checked={dados.aceitaEmola} onChange={e => setDados({...dados, aceitaEmola: e.target.checked})} className="w-5 h-5 accent-orange-600" />
                            <span className="text-xs font-black uppercase text-orange-700 italic">e-Mola</span>
                        </label>
                        {dados.aceitaEmola && (
                            <input className="w-full bg-white p-3 rounded-xl border border-orange-100 text-[11px] font-bold outline-none focus:border-orange-400 animate-in fade-in" placeholder="86XXXXXXX" value={dados.numeroEmola} onChange={e => setDados({...dados, numeroEmola: e.target.value})} />
                        )}
                    </div>

                    {/* BANCO */}
                    <div className={`p-6 rounded-[2.5rem] border-2 transition-all ${dados.aceitaBanco ? 'bg-blue-50/30 border-blue-200 shadow-xl' : 'bg-slate-50 border-transparent opacity-60'}`}>
                        <label className="flex items-center gap-3 mb-4 cursor-pointer">
                            <input type="checkbox" checked={dados.aceitaBanco} onChange={e => setDados({...dados, aceitaBanco: e.target.checked})} className="w-5 h-5 accent-blue-600" />
                            <span className="text-xs font-black uppercase text-blue-700 italic">Transferência</span>
                        </label>
                        {dados.aceitaBanco && (
                            <div className="space-y-2 animate-in fade-in">
                                <input className="w-full bg-white p-3 rounded-xl border border-blue-100 text-[11px] font-bold outline-none focus:border-blue-400" placeholder="Nome do Banco" value={dados.bancoNome} onChange={e => setDados({...dados, bancoNome: e.target.value})} />
                                <input className="w-full bg-white p-3 rounded-xl border border-blue-100 text-[11px] font-bold outline-none focus:border-blue-400" placeholder="IBAN / NIB" value={dados.bancoIban} onChange={e => setDados({...dados, bancoIban: e.target.value})} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* SECÇÃO 3: PERSONALIZAÇÃO DE SAÍDA (RECIBO) */}
            <div className="mt-12 pt-12 border-t border-slate-100">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shadow-inner"><MessageSquare size={20}/></div>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tighter text-xl">Mensagens no Recibo</h3>
                </div>
                <div className="bg-slate-900 p-8 rounded-[3rem] text-white">
                    <label className="text-[10px] font-black uppercase text-white/40 ml-4 mb-2 block">Rodapé das Faturas / Recibos</label>
                    <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm font-bold outline-none focus:border-purple-500 transition-all min-h-[120px] resize-none"
                        placeholder="Ex: Não aceitamos devoluções após 24h. Obrigado por comprar connosco!"
                        value={dados.rodapeRecibo}
                        onChange={e => setDados({...dados, rodapeRecibo: e.target.value})}
                    />
                    <div className="flex items-center gap-2 mt-4 text-[9px] font-black text-emerald-400 uppercase italic">
                        <ShieldCheck size={12}/> Esta mensagem aparecerá no fim de cada documento A4 gerado.
                    </div>
                </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Definicoes;