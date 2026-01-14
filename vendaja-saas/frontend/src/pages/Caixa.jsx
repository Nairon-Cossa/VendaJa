import React, { useState, useRef } from 'react';
import { db } from '../firebase'; 
import { collection, doc, increment, serverTimestamp, writeBatch } from "firebase/firestore";
import { 
  Search, Trash2, CheckCircle2, Banknote, Smartphone, Plus, Minus, Hash, Clock, Crown
} from 'lucide-react';
import Recibo from '../components/Recibo';

const REGRAS_SETOR = {
  'Mercearia': { labelExtra: "Cliente", placeholder: "Nome do Cliente (Opcional)", permiteAberto: false, usaStock: true, botaoAcao: "CONCLUIR VENDA" },
  'Restaurante/Bar': { labelExtra: "Mesa/Comando", placeholder: "Ex: Mesa 05", permiteAberto: true, usaStock: true, botaoAcao: "PAGAR AGORA" },
  'Bar/Bottle Store': { labelExtra: "Cliente", placeholder: "Nome ou Alcunha", permiteAberto: true, usaStock: true, botaoAcao: "PAGAR AGORA" },
  'Oficina': { labelExtra: "Viatura", placeholder: "Matrícula ou Modelo", permiteAberto: true, usaStock: true, botaoAcao: "PAGAR AGORA" },
  'Farmácia': { labelExtra: "Paciente", placeholder: "Nome do Paciente", permiteAberto: false, usaStock: true, botaoAcao: "CONCLUIR VENDA" },
  'Eletrónicos': { labelExtra: "Garantia/IMEI", placeholder: "Nº de Série ou Cliente", permiteAberto: false, usaStock: true, botaoAcao: "CONCLUIR VENDA" },
  'Loja de Roupa': { labelExtra: "Provador", placeholder: "Nome do Cliente", permiteAberto: false, usaStock: true, botaoAcao: "CONCLUIR VENDA" }
};

const Caixa = ({ usuario, produtos, configLoja, avisar }) => {
  const [carrinho, setCarrinho] = useState([]);
  const [pesquisa, setPesquisa] = useState('');
  const [metodo, setMetodo] = useState('Dinheiro');
  const [referencia, setReferencia] = useState('');
  const [vendaFinalizada, setVendaFinalizada] = useState(null);
  const [infoExtra, setInfoExtra] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [valorRecebido, setValorRecebido] = useState(''); 
  
  const inputPesquisa = useRef(null);
  const isPremium = usuario?.plano === 'premium';
  const config = REGRAS_SETOR[usuario.tipoNegocio] || REGRAS_SETOR['Mercearia'];

  const produtosDaLoja = produtos.filter(p => 
    p.lojaId === usuario.lojaId && 
    (p.nome.toLowerCase().includes(pesquisa.toLowerCase()) || 
     (p.referencia && p.referencia.toLowerCase().includes(pesquisa.toLowerCase())))
  );

  const adicionarAoCarrinho = (p) => {
    const itemNoCarrinho = carrinho.find(item => item.id === p.id);
    if (p.stock <= (itemNoCarrinho?.qtd || 0)) {
      avisar("STOCK ESGOTADO", "erro");
      return;
    }
    if (itemNoCarrinho) {
      setCarrinho(carrinho.map(item => item.id === p.id ? { ...item, qtd: item.qtd + 1 } : item));
    } else {
      setCarrinho([...carrinho, { ...p, qtd: 1 }]);
    }
    setPesquisa(''); 
  };

  const removerOuDiminuir = (id) => {
    const item = carrinho.find(i => i.id === id);
    if (item.qtd > 1) {
      setCarrinho(carrinho.map(i => i.id === id ? { ...i, qtd: i.qtd - 1 } : i));
    } else {
      setCarrinho(carrinho.filter(i => i.id !== id));
    }
  };

  const finalizarVenda = async () => {
    if (carrinho.length === 0 || carregando) return;
    
    // Validação de segurança para pagamentos móveis
    if ((metodo === 'M-Pesa' || metodo === 'e-Mola' || metodo === 'mKesh') && !referencia) {
        avisar("INSIRA A REFERÊNCIA DO SMS", "erro");
        return;
    }

    // Bloqueio de Fiado/Aberto para plano Básico
    if (metodo === 'Aberto' && !isPremium) {
        avisar("UPGRADE PARA PREMIUM PARA USAR FIADO", "info");
        return;
    }

    setCarregando(true);
    const batch = writeBatch(db);
    
    try {
      const totalVenda = carrinho.reduce((acc, i) => acc + (Number(i.preco) * i.qtd), 0);
      const vendaRef = doc(collection(db, "vendas"));
      
      const dadosVenda = {
        id: vendaRef.id,
        lojaId: usuario.lojaId, 
        vendedorId: usuario.uid,
        vendedorNome: usuario.nome,
        lojaNome: usuario.nomeLoja,
        configRecibo: {
            nuit: configLoja.nuit || '',
            telefone: configLoja.telefone || '',
            endereco: configLoja.endereco || '',
            logo: configLoja.logo || null,
            mensagem: configLoja.mensagemRecibo || ''
        },
        itens: carrinho.map(item => ({
          id: item.id,
          nome: item.nome,
          preco: Number(item.preco),
          qtd: item.qtd
        })),
        total: totalVenda,
        metodo,
        status: metodo === 'Aberto' ? 'PENDENTE' : 'PAGO',
        referencia: referencia.toUpperCase(),
        valorRecebido: Number(valorRecebido) || totalVenda,
        troco: (Number(valorRecebido) - totalVenda) > 0 ? (Number(valorRecebido) - totalVenda) : 0,
        infoAdicional: infoExtra.toUpperCase(),
        data: new Date().toISOString(),
        timestamp: serverTimestamp()
      };

      batch.set(vendaRef, dadosVenda);

      carrinho.forEach(item => {
        const produtoRef = doc(db, "produtos", item.id);
        batch.update(produtoRef, { stock: increment(-item.qtd) });
      });

      await batch.commit();
      
      setVendaFinalizada(dadosVenda);
      avisar("VENDA REGISTADA!", "sucesso");

    } catch (error) {
      console.error("Erro:", error);
      avisar("ERRO AO SALVAR VENDA", "erro");
    } finally {
      setCarregando(false);
    }
  };

  const total = carrinho.reduce((acc, item) => acc + (Number(item.preco) * item.qtd), 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-140px)] animate-in fade-in zoom-in-95 duration-500">
      
      {/* ESQUERDA: PRODUTOS */}
      <div className="flex-1 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b flex items-center gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={22} />
            <input 
              ref={inputPesquisa}
              className="w-full bg-slate-100/50 p-5 pl-14 rounded-2xl outline-none font-bold text-slate-700 focus:bg-white focus:ring-4 ring-blue-50 transition-all border-2 border-transparent focus:border-blue-200"
              placeholder="Pesquisar produto ou ref..."
              value={pesquisa}
              onChange={e => setPesquisa(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 bg-slate-50/50">
          {produtosDaLoja.map(p => (
            <button 
              key={p.id} 
              onClick={() => adicionarAoCarrinho(p)} 
              disabled={p.stock <= 0}
              className={`group p-4 rounded-[2rem] border-2 transition-all text-left h-48 flex flex-col justify-between ${p.stock <= 0 ? 'bg-slate-100 opacity-60' : 'bg-white border-transparent hover:border-blue-500 hover:shadow-2xl hover:-translate-y-1 active:scale-95 shadow-sm'}`}
            >
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                    <span className="text-[8px] font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-lg uppercase">{p.categoria}</span>
                    <span className="text-[9px] font-bold text-slate-400">STK: {p.stock}</span>
                </div>
                <h4 className="font-black text-slate-800 text-sm uppercase leading-tight line-clamp-3">{p.nome}</h4>
              </div>
              <div className="flex items-end justify-between">
                <p className="text-xl font-black text-slate-900 italic tracking-tighter">
                  {Number(p.preco).toFixed(2)}<small className="text-[10px] ml-1 text-slate-400 not-italic">{configLoja.moeda}</small>
                </p>
                <div className="bg-slate-900 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all">
                  <Plus size={16} />
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* DIREITA: CHECKOUT */}
      <div className="w-full lg:w-[450px] bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 flex flex-col overflow-hidden">
        <div className="p-8 space-y-6 flex-1 overflow-y-auto">
          <div className="flex items-center justify-between">
            <h3 className="font-black italic uppercase text-2xl tracking-tighter text-slate-800">Checkout</h3>
            {!isPremium && <span className="text-[8px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-md flex items-center gap-1 uppercase tracking-widest"><Crown size={10}/> Básico</span>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase ml-1">{config.labelExtra}</label>
            <input 
                className="w-full bg-slate-50 p-4 rounded-xl outline-none border-2 border-transparent focus:border-blue-500 font-bold text-sm"
                placeholder={config.placeholder}
                value={infoExtra} 
                onChange={e => setInfoExtra(e.target.value)} 
            />
          </div>

          <div className="space-y-3">
             <label className="text-[10px] font-black text-slate-400 uppercase ml-1">Pagamento</label>
             <div className="grid grid-cols-2 gap-2">
                {[
                { id: 'Dinheiro', color: 'border-emerald-100 text-emerald-600', active: 'bg-emerald-600 text-white border-emerald-600', icon: <Banknote size={16}/> },
                { id: 'M-Pesa', color: 'border-red-100 text-red-600', active: 'bg-red-600 text-white border-red-600', icon: <Smartphone size={16}/> },
                { id: 'e-Mola', color: 'border-orange-100 text-orange-600', active: 'bg-orange-600 text-white border-orange-600', icon: <Smartphone size={16}/> },
                { id: 'Aberto', color: 'border-slate-200 text-slate-400', active: 'bg-slate-900 text-white border-slate-900', icon: <Clock size={16}/>, premium: true }
                ].map((m) => (
                <button
                    key={m.id}
                    onClick={() => { 
                        if(m.premium && !isPremium) return avisar("FIADO DISPONÍVEL APENAS NO PREMIUM", "info");
                        setMetodo(m.id); 
                        if(m.id === 'Dinheiro' || m.id === 'Aberto') setReferencia(''); 
                    }}
                    className={`flex items-center justify-center gap-2 p-4 rounded-2xl border-2 font-black text-[11px] uppercase transition-all relative ${metodo === m.id ? m.active : 'bg-white ' + m.color} ${m.premium && !isPremium ? 'opacity-40 grayscale' : 'active:scale-95'}`}
                >
                    {m.icon} {m.id}
                    {m.premium && !isPremium && <Crown size={10} className="absolute top-1 right-2 text-amber-500" />}
                </button>
                ))}
            </div>

            {metodo !== 'Dinheiro' && metodo !== 'Aberto' && (
              <div className="animate-in slide-in-from-top-2 duration-300">
                <label className="text-[10px] font-black text-blue-600 uppercase ml-1 flex items-center gap-1">
                  <Hash size={12}/> Referência SMS
                </label>
                <input 
                  className="w-full bg-blue-50 p-4 rounded-xl outline-none border-2 border-blue-200 focus:border-blue-600 font-black text-blue-700 placeholder:text-blue-200 mt-1 uppercase"
                  placeholder="CÓDIGO SMS..."
                  value={referencia}
                  onChange={e => setReferencia(e.target.value)}
                />
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4 border-t">
            {carrinho.map((item, i) => (
              <div key={i} className="flex justify-between items-center p-3 hover:bg-slate-50 rounded-xl group">
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-800 text-[11px] uppercase truncate pr-4">{item.nome}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <button onClick={() => removerOuDiminuir(item.id)} className="p-1 hover:bg-white rounded-md border shadow-sm"><Minus size={12}/></button>
                    <span className="text-[12px] font-black text-blue-600 w-6 text-center">{item.qtd}</span>
                    <button onClick={() => adicionarAoCarrinho(item)} className="p-1 hover:bg-white rounded-md border shadow-sm"><Plus size={12}/></button>
                  </div>
                </div>
                <div className="text-right">
                    <p className="font-black text-slate-900 text-sm italic">{(item.qtd * item.preco).toFixed(2)}</p>
                    <button onClick={() => setCarrinho(carrinho.filter(c => c.id !== item.id))} className="text-red-300 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all">
                        <Trash2 size={14}/>
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-8 bg-slate-900 rounded-t-[3.5rem] space-y-6">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em]">Total</span>
            <span className="text-5xl font-black italic text-white tracking-tighter">
                {total.toFixed(2)}<small className="text-sm ml-1 opacity-50">{configLoja.moeda}</small>
            </span>
          </div>

          {metodo !== 'Aberto' && (
            <div className="grid grid-cols-2 gap-4 animate-in fade-in duration-300">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Recebido</label>
                    <input 
                        type="number"
                        className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl text-white font-black text-xl outline-none focus:bg-white/10 focus:border-blue-500 transition-all"
                        placeholder="0.00"
                        value={valorRecebido}
                        onChange={e => setValorRecebido(e.target.value)}
                    />
                </div>
                <div className="text-right flex flex-col justify-end">
                    <p className="text-[9px] font-black text-slate-500 uppercase mr-1">Troco</p>
                    <p className="text-3xl font-black text-emerald-400 italic">
                        {(Number(valorRecebido) - total > 0 ? Number(valorRecebido) - total : 0).toFixed(2)}
                    </p>
                </div>
            </div>
          )}

          <button 
              onClick={finalizarVenda}
              disabled={carrinho.length === 0 || carregando}
              className={`w-full py-6 rounded-[2rem] font-black text-sm transition-all flex items-center justify-center gap-3 uppercase tracking-widest ${carrinho.length === 0 || carregando ? 'bg-white/5 text-white/20' : 'bg-blue-600 text-white hover:bg-blue-500 hover:scale-[1.02] shadow-xl shadow-blue-500/20 active:scale-95'}`}
          >
            {carregando ? (
                <div className="flex items-center gap-2 animate-pulse">PROCESSANDO...</div>
            ) : (
                <><CheckCircle2 size={22} /> {metodo === 'Aberto' ? 'REGISTAR NA CONTA' : config.botaoAcao}</>
            )}
          </button>
        </div>
      </div>

      {vendaFinalizada && (
        <Recibo 
          venda={vendaFinalizada} 
          configLoja={configLoja}
          fechar={() => { 
            setVendaFinalizada(null); 
            setCarrinho([]); 
            setInfoExtra('');
            setValorRecebido('');
            setReferencia('');
            inputPesquisa.current?.focus();
          }} 
        />
      )}
    </div>
  );
};

export default Caixa;