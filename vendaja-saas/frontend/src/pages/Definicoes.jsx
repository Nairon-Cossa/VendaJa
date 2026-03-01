import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, Store, MapPin, Phone, Link as LinkIcon,
  Save, Globe, ShieldCheck, CreditCard, Coins, Upload, Image as ImageIcon, X, Loader2, Crown, ExternalLink,
  Truck, Building2, MessageSquare, Facebook, Instagram, Smartphone, Hash, Mail
} from 'lucide-react';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

const Definicoes = ({ usuario, configLoja, avisar }) => {
  // Estado inicial - Tenta usar configLoja primeiro, depois usuario, depois vazio
  const [dados, setDados] = useState({
    nomeOficial: configLoja?.nomeOficial || usuario?.nomeLoja || '',
    nuit: configLoja?.nuit || '',
    telefone: configLoja?.telefone || usuario?.telemovel || '',
    whatsapp: configLoja?.whatsapp || '',
    endereco: configLoja?.endereco || '',
    tipoNegocio: configLoja?.tipoNegocio || usuario?.tipoNegocio || 'Geral',
    moeda: configLoja?.moeda || 'MT',
    facebook: configLoja?.facebook || '',
    instagram: configLoja?.instagram || '',
    slugLoja: configLoja?.slugLoja || '',
    fazEntrega: configLoja?.fazEntrega || false,
    taxaEntrega: configLoja?.taxaEntrega || 0,
    permiteLevantamento: configLoja?.permiteLevantamento !== undefined ? configLoja.permiteLevantamento : true,
    aceitaMpesa: configLoja?.aceitaMpesa || false,
    numeroMpesa: configLoja?.numeroMpesa || '',
    nomeMpesa: configLoja?.nomeMpesa || '',
    aceitaEmola: configLoja?.aceitaEmola || false,
    numeroEmola: configLoja?.numeroEmola || '',
    aceitaBanco: configLoja?.aceitaBanco || false,
    bancoNome: configLoja?.bancoNome || '',
    bancoIban: configLoja?.bancoIban || '',
    rodapeRecibo: configLoja?.rodapeRecibo || 'Obrigado pela preferência.',
    logo: configLoja?.logo || configLoja?.logoUrl || null
  });

  const [carregandoImagem, setCarregandoImagem] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const fileInputRef = useRef(null);

  const empresaId = usuario?.empresaId || usuario?.uid;
  const isPremium = usuario?.plano === 'premium' || usuario?.role === 'superadmin';

  // CORREÇÃO: Sincroniza o estado local sempre que as props configLoja mudarem (ex: ao voltar à página)
  useEffect(() => {
    if (configLoja && Object.keys(configLoja).length > 0) {
      setDados(prev => ({ 
        ...prev, 
        ...configLoja,
        // Mantém a consistência entre logo e logoUrl
        logo: configLoja.logo || configLoja.logoUrl || prev.logo 
      }));
    }
  }, [configLoja]);

  const formatarSlug = (texto) => {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
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
        const base64 = canvas.toDataURL('image/jpeg', 0.8);
        setDados(prev => ({ ...prev, logo: base64 }));
        setCarregandoImagem(false);
        avisar?.("LOGO ATUALIZADO", "sucesso");
      };
    };
    reader.readAsDataURL(file);
  };

  const salvarDefinicoes = async (e) => {
    if (e) e.preventDefault();
    if (!empresaId) {
      avisar?.("ERRO: ID DA EMPRESA NÃO ENCONTRADO", "erro");
      return;
    }

    setSalvando(true);
    try {
      // Validação básica de campos obrigatórios
      if (!dados.nuit || !dados.telefone || !dados.endereco || !dados.nomeOficial) {
        avisar?.("PREENCHA TODOS OS CAMPOS OBRIGATÓRIOS", "erro");
        setSalvando(false);
        return;
      }

      const finalSlug = dados.slugLoja || formatarSlug(dados.nomeOficial || "");

      // Prepara o objeto com todos os campos atuais do estado
      const batchData = {
        ...dados,
        empresaId: empresaId,
        slugLoja: isPremium ? finalSlug : '',
        ultimaAtualizacao: new Date().toISOString()
      };

      // 1. Grava na coleção de configurações (dados detalhados)
      await setDoc(doc(db, "configuracoes", empresaId), batchData, { merge: true });
      
      // 2. Grava na coleção de empresas (dados de perfil público)
      await setDoc(doc(db, "empresas", empresaId), { 
        nome: dados.nomeOficial,
        tipoNegocio: dados.tipoNegocio,
        logoUrl: dados.logo,
        telefone: dados.telefone,
        nuit: dados.nuit,
        configurado: true
      }, { merge: true });

      avisar?.("CONFIGURAÇÕES GUARDADAS COM SUCESSO", "sucesso");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      avisar?.("ERRO AO GUARDAR ALTERAÇÕES", "erro");
    } finally {
      setSalvando(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-8 pb-20 font-sans">
      
      {/* HEADER PROFISSIONAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100">
        <div>
          <div className="flex items-center gap-3 mb-1">
             <Settings className="text-slate-400" size={20} />
             <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Painel de Controlo</h2>
          </div>
          <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
            Gestão de Identidade, Logística e Financeiro
          </p>
        </div>
        <button 
          onClick={salvarDefinicoes} 
          disabled={salvando} 
          className="bg-slate-900 hover:bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all shadow-2xl flex items-center gap-3 active:scale-95 disabled:opacity-50"
        >
          {salvando ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
          {salvando ? 'A GUARDAR...' : 'Guardar Alterações'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLUNA BRANDING */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-8 text-center">Identidade de Marca</h3>
            <div className="relative group mx-auto w-48 h-48">
              <div className="w-full h-full bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden transition-all group-hover:border-blue-400">
                {carregandoImagem ? <Loader2 size={32} className="animate-spin text-blue-500" /> : dados.logo ? <img src={dados.logo} alt="Logo" className="w-full h-full object-contain p-4" /> : <ImageIcon size={40} className="text-slate-300" />}
              </div>
              <button type="button" onClick={() => fileInputRef.current.click()} className="absolute inset-0 bg-slate-900/90 opacity-0 group-hover:opacity-100 transition-all rounded-[2.5rem] flex items-center justify-center text-white flex-col gap-2 backdrop-blur-sm">
                <Upload size={20} />
                <span className="text-[9px] font-black uppercase tracking-widest">Substituir</span>
              </button>
            </div>
            <input type="file" ref={fileInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
          </div>

          <div className={`p-10 rounded-[3rem] border transition-all ${isPremium ? 'bg-slate-900 text-white border-transparent' : 'bg-slate-50 border-slate-200'}`}>
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black uppercase tracking-widest text-[10px] flex items-center gap-2">
                <Globe size={16} className="text-blue-400" /> Presença Digital
              </h3>
              {isPremium && <Crown size={16} className="text-amber-500" />}
            </div>
            <div className="space-y-4">
              <div className="relative">
                <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                <input 
                  disabled={!isPremium}
                  className="w-full bg-white/5 p-4 pl-12 rounded-xl outline-none border border-white/10 focus:border-blue-500 font-bold text-xs transition-all placeholder:text-white/20"
                  placeholder="link-da-loja"
                  value={dados.slugLoja}
                  onChange={(e) => setDados({...dados, slugLoja: formatarSlug(e.target.value)})}
                />
              </div>
              <div className="p-5 bg-black/40 rounded-2xl border border-white/5">
                <p className="text-[8px] text-slate-500 font-black uppercase mb-1">Endereço Web:</p>
                <div className="flex items-center justify-between gap-2">
                    <p className="text-[10px] font-mono text-blue-400 truncate">venda-ja.pt/{dados.slugLoja || '...'}</p>
                    <ExternalLink size={12} className="text-slate-600 flex-shrink-0" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUNA CONFIGURAÇÕES */}
        <div className="lg:col-span-8 space-y-8">
          
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 md:p-14">
            
            {/* DADOS FISCAIS */}
            <div className="flex items-center gap-4 mb-10 pb-6 border-b border-slate-50">
              <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={20}/></div>
              <div>
                <h3 className="font-black text-slate-900 uppercase tracking-tighter text-xl">Informações de Negócio</h3>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dados para faturas e documentos legais</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Nome da Empresa / Comercial</label>
                <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm transition-all"
                  value={dados.nomeOficial} onChange={e => setDados({...dados, nomeOficial: e.target.value})} placeholder="Ex: Matola Comercio Geral, Lda" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Número de Identificação (NUIT)</label>
                <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm transition-all"
                  value={dados.nuit} onChange={e => setDados({...dados, nuit: e.target.value})} placeholder="Ex: 400123456" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Contacto Telefónico</label>
                <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm transition-all"
                  value={dados.telefone} onChange={e => setDados({...dados, telefone: e.target.value})} placeholder="Ex: +258 84 000 0000" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Sector de Actividade</label>
                <select className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-black text-sm transition-all appearance-none cursor-pointer"
                  value={dados.tipoNegocio} onChange={e => setDados({...dados, tipoNegocio: e.target.value})}>
                    <option value="Mercearia">Mercearia & Mini-Mercado</option>
                    <option value="Restaurante/Bar">Restaurante & Takeaway</option>
                    <option value="Bar/Bottle Store">Bar & Bottle Store</option>
                    <option value="Farmácia">Farmácia</option>
                    <option value="Eletrónicos">Loja de Telefones & IT</option>
                    <option value="Loja de Roupa">Roupa & Cosméticos</option>
                    <option value="Papelaria">Papelaria & Escolar</option>
                    <option value="Geral/Loja">Comércio Geral</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 mb-10">
              <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Localização / Endereço Completo</label>
              <input className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm transition-all"
                value={dados.endereco} onChange={e => setDados({...dados, endereco: e.target.value})} placeholder="Av. Eduardo Mondlane, Prédio X, R/C" />
            </div>

            {/* LOGÍSTICA & REDES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-slate-50">
              <div className="space-y-6">
                <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                  <Truck size={16} className="text-blue-500" /> Configuração de Entrega
                </h4>
                <div className="bg-slate-50 p-8 rounded-[2rem] space-y-5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">Serviço de Delivery</span>
                    <input type="checkbox" checked={dados.fazEntrega} onChange={e => setDados({...dados, fazEntrega: e.target.checked})} className="w-5 h-5 accent-slate-900" />
                  </div>
                  {dados.fazEntrega && (
                    <div className="animate-in slide-in-from-top-2 duration-300">
                      <label className="text-[8px] font-black text-slate-400 uppercase ml-1 block mb-2">Custo de Entrega ({dados.moeda})</label>
                      <input type="number" className="w-full bg-white p-4 rounded-xl border border-slate-200 font-black text-sm outline-none"
                        value={dados.taxaEntrega} onChange={e => setDados({...dados, taxaEntrega: e.target.value})} />
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2">
                  <Facebook size={16} className="text-blue-600" /> Canais Digitais
                </h4>
                <div className="space-y-4">
                  <input className="w-full bg-slate-50 p-4 rounded-xl border border-transparent focus:border-blue-500 outline-none text-xs font-bold"
                    value={dados.facebook} onChange={e => setDados({...dados, facebook: e.target.value})} placeholder="Facebook URL" />
                  <input className="w-full bg-slate-50 p-4 rounded-xl border border-transparent focus:border-blue-500 outline-none text-xs font-bold"
                    value={dados.instagram} onChange={e => setDados({...dados, instagram: e.target.value})} placeholder="Instagram URL" />
                </div>
              </div>
            </div>

            {/* PAGAMENTOS */}
            <div className="mt-14 pt-10 border-t border-slate-50">
              <h4 className="font-black text-slate-900 uppercase text-xs flex items-center gap-2 mb-8">
                <CreditCard size={16} className="text-blue-500" /> Terminais de Pagamento Aceites
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* M-PESA */}
                <div className={`p-6 rounded-3xl border-2 transition-all ${dados.aceitaMpesa ? 'border-red-500 bg-red-50/20' : 'border-slate-100 opacity-40'}`}>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input type="checkbox" checked={dados.aceitaMpesa} onChange={e => setDados({...dados, aceitaMpesa: e.target.checked})} className="w-4 h-4 accent-red-600" />
                    <span className="text-[10px] font-black uppercase text-red-600">M-Pesa</span>
                  </label>
                  {dados.aceitaMpesa && (
                    <input className="w-full bg-white p-3 rounded-lg text-[10px] font-bold outline-none border border-red-100" placeholder="84/85XXXXXXX" value={dados.numeroMpesa} onChange={e => setDados({...dados, numeroMpesa: e.target.value})} />
                  )}
                </div>
                {/* E-MOLA */}
                <div className={`p-6 rounded-3xl border-2 transition-all ${dados.aceitaEmola ? 'border-orange-500 bg-orange-50/20' : 'border-slate-100 opacity-40'}`}>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input type="checkbox" checked={dados.aceitaEmola} onChange={e => setDados({...dados, aceitaEmola: e.target.checked})} className="w-4 h-4 accent-orange-600" />
                    <span className="text-[10px] font-black uppercase text-orange-600">e-Mola</span>
                  </label>
                  {dados.aceitaEmola && (
                    <input className="w-full bg-white p-3 rounded-lg text-[10px] font-bold outline-none border border-orange-100" placeholder="86/87XXXXXXX" value={dados.numeroEmola} onChange={e => setDados({...dados, numeroEmola: e.target.value})} />
                  )}
                </div>
                {/* BANCO */}
                <div className={`p-6 rounded-3xl border-2 transition-all ${dados.aceitaBanco ? 'border-blue-500 bg-blue-50/20' : 'border-slate-100 opacity-40'}`}>
                  <label className="flex items-center gap-3 mb-4 cursor-pointer">
                    <input type="checkbox" checked={dados.aceitaBanco} onChange={e => setDados({...dados, aceitaBanco: e.target.checked})} className="w-4 h-4 accent-blue-600" />
                    <span className="text-[10px] font-black uppercase text-blue-600">Bancário</span>
                  </label>
                  {dados.aceitaBanco && (
                    <input className="w-full bg-white p-3 rounded-lg text-[10px] font-bold outline-none border border-blue-100" placeholder="IBAN / Conta" value={dados.bancoIban} onChange={e => setDados({...dados, bancoIban: e.target.value})} />
                  )}
                </div>
              </div>
            </div>

            {/* NOTAS DO RECIBO */}
            <div className="mt-14">
                <div className="flex items-center gap-3 mb-6">
                    <MessageSquare size={16} className="text-slate-400" />
                    <h4 className="font-black text-slate-900 uppercase text-xs">Mensagem de Rodapé (Recibo)</h4>
                </div>
                <textarea 
                    className="w-full bg-slate-900 text-slate-200 border-none rounded-[2rem] p-8 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/20 min-h-[140px] resize-none"
                    placeholder="Ex: Artigos vendidos não aceitam devolução após 24 horas."
                    value={dados.rodapeRecibo}
                    onChange={e => setDados({...dados, rodapeRecibo: e.target.value})}
                />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Definicoes;