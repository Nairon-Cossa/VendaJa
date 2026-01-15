import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { 
  ShoppingBag, ChevronRight, MapPin, Phone, 
  CreditCard, Truck, Store, X, Send, Loader2, Wallet, Building2
} from 'lucide-react';

const LojaPublica = () => {
  const { slug } = useParams();
  const [loja, setLoja] = useState(null);
  const [produtos, setProdutos] = useState([]);
  const [carrinho, setCarrinho] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  
  // Estados do Pedido
  const [metodoEntrega, setMetodoEntrega] = useState('levantamento');
  const [metodoPagamento, setMetodoPagamento] = useState('');
  const [endereco, setEndereco] = useState('');

  useEffect(() => {
    const carregarLoja = async () => {
      try {
        // Busca a loja pelo slug personalizado
        const q = query(collection(db, "configuracoes"), where("slugLoja", "==", slug));
        const snap = await getDocs(q);
        
        if (!snap.empty) {
          const dadosLoja = snap.docs[0].data();
          const idLoja = snap.docs[0].id;
          setLoja({ ...dadosLoja, id: idLoja });

          // Busca produtos vinculados a esta loja
          const qProd = query(collection(db, "produtos"), where("lojaId", "==", idLoja));
          const snapProd = await getDocs(qProd);
          setProdutos(snapProd.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      } catch (e) { 
        console.error("Erro ao carregar loja:", e); 
      } finally { 
        setCarregando(false); 
      }
    };
    carregarLoja();
  }, [slug]);

  const adicionarAoCarrinho = (p) => {
    setCarrinho(prev => {
      const ex = prev.find(i => i.id === p.id);
      return ex ? prev.map(i => i.id === p.id ? {...i, qtd: i.qtd + 1} : i) : [...prev, {...p, qtd: 1}];
    });
  };

  const totalProd = carrinho.reduce((acc, i) => acc + (Number(i.precoVenda) * i.qtd), 0);
  const taxa = metodoEntrega === 'entrega' ? Number(loja?.taxaEntrega || 0) : 0;
  const totalGeral = totalProd + taxa;

  const finalizarPedido = () => {
    const itensMsg = carrinho.map(i => `${i.qtd}x ${i.nome}`).join('%0A');
    const entregaMsg = metodoEntrega === 'entrega' ? `📍 Entrega: ${endereco}` : `🏪 Levantamento na Loja`;
    
    // Formatar dados do pagamento
    let dadosPagamento = metodoPagamento;
    if(metodoPagamento === 'M-Pesa') dadosPagamento += ` (${loja.numeroMpesa})`;
    if(metodoPagamento === 'e-Mola') dadosPagamento += ` (${loja.numeroEmola})`;
    
    const texto = `*NOVO PEDIDO - ${loja.nomeOficial}*%0A%0A` +
      `*PRODUTOS:*%0A${itensMsg}%0A%0A` +
      `*${entregaMsg}*%0A` +
      `*PAGAMENTO:* ${dadosPagamento}%0A%0A` +
      `*TOTAL:* ${totalGeral.toFixed(2)} ${loja.moeda || 'MT'}`;

    // Limpeza do Telefone: Remove tudo que não é número e garante o 258
    const telefoneLimpo = loja.telefone?.replace(/\D/g, ''); 
    const numeroFinal = telefoneLimpo.startsWith('258') ? telefoneLimpo : `258${telefoneLimpo}`;

    window.open(`https://wa.me/${numeroFinal}?text=${texto}`, '_blank');
  };

  if (carregando) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;
  if (!loja) return <div className="h-screen flex items-center justify-center font-black uppercase italic">Loja não encontrada</div>;

  return (
    <div className="min-h-screen bg-slate-50 pb-32">
      {/* HEADER */}
      <div className="bg-white p-8 rounded-b-[3rem] shadow-sm text-center border-b border-slate-100">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          {loja.logo ? (
            <img src={loja.logo} className="w-24 h-24 rounded-[2rem] object-contain mb-4 p-2 border border-slate-50" alt="logo" />
          ) : (
            <div className="w-24 h-24 bg-slate-900 rounded-[2rem] mb-4 flex items-center justify-center text-white text-3xl font-black italic">{loja.nomeOficial?.charAt(0)}</div>
          )}
          <h1 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">{loja.nomeOficial}</h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
            <MapPin size={12}/> {loja.endereco}
          </p>
        </div>
      </div>

      {/* LISTA DE PRODUTOS */}
      <div className="max-w-4xl mx-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {produtos.map(p => (
          <div key={p.id} className="bg-white p-4 rounded-[2.5rem] flex items-center gap-4 border border-slate-100 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden">
              {p.foto ? <img src={p.foto} className="w-full h-full object-cover" /> : <ShoppingBag className="text-slate-200" />}
            </div>
            <div className="flex-1">
              <h3 className="font-black text-slate-900 text-sm uppercase tracking-tight leading-tight">{p.nome}</h3>
              <div className="flex items-baseline gap-1 mt-1">
                <p className="text-blue-600 font-black text-xl">{Number(p.precoVenda).toLocaleString()}</p>
                <span className="text-[10px] uppercase font-bold text-slate-400">{loja.moeda || 'MT'}</span>
              </div>
            </div>
            <button onClick={() => adicionarAoCarrinho(p)} className="bg-blue-600 text-white p-4 rounded-2xl hover:scale-105 active:scale-95 transition-all">
              <ShoppingBag size={20}/>
            </button>
          </div>
        ))}
      </div>

      {/* BARRA FLUTUANTE DO CARRINHO */}
      {carrinho.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-slate-900 text-white rounded-[2.5rem] p-4 shadow-2xl flex items-center justify-between animate-in slide-in-from-bottom-5 z-40">
          <div className="pl-4">
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Total Produtos</p>
            <p className="text-xl font-black italic">{totalProd.toLocaleString()} {loja.moeda || 'MT'}</p>
          </div>
          <button onClick={() => setModalAberto(true)} className="bg-blue-600 px-8 py-4 rounded-[1.8rem] font-black uppercase text-xs tracking-[0.2em] flex items-center gap-2">
            Finalizar <ChevronRight size={18}/>
          </button>
        </div>
      )}

      {/* MODAL DE CHECKOUT */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-end justify-center">
          <div className="bg-white w-full max-w-xl rounded-t-[3.5rem] p-8 space-y-8 animate-in slide-in-from-bottom-full duration-300 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">Detalhes do Pedido</h2>
              <button onClick={() => setModalAberto(false)} className="p-2 bg-slate-100 rounded-full"><X/></button>
            </div>

            {/* OPÇÕES DE ENTREGA */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Como receber?</p>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setMetodoEntrega('levantamento')} className={`p-5 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all ${metodoEntrega === 'levantamento' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}>
                  <Store size={20}/><span className="text-[10px] font-black uppercase">Levantamento</span>
                </button>
                {loja.fazEntrega && (
                  <button onClick={() => setMetodoEntrega('entrega')} className={`p-5 rounded-[2rem] border-2 flex flex-col items-center gap-2 transition-all ${metodoEntrega === 'entrega' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 text-slate-400'}`}>
                    <Truck size={20}/><span className="text-[10px] font-black uppercase">Entrega (+{loja.taxaEntrega} MT)</span>
                  </button>
                )}
              </div>
              {metodoEntrega === 'entrega' && (
                <input className="w-full bg-slate-50 p-5 rounded-[2rem] outline-none border-2 border-transparent focus:border-blue-500 font-bold" placeholder="Teu Endereço Completo" value={endereco} onChange={e => setEndereco(e.target.value)} />
              )}
            </div>

            {/* PAGAMENTO */}
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Como pagar?</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {loja.aceitaMpesa && <button onClick={() => setMetodoPagamento('M-Pesa')} className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase ${metodoPagamento === 'M-Pesa' ? 'border-pink-500 bg-pink-50' : 'border-slate-100'}`}>M-Pesa</button>}
                {loja.aceitaEmola && <button onClick={() => setMetodoPagamento('e-Mola')} className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase ${metodoPagamento === 'e-Mola' ? 'border-orange-500 bg-orange-50' : 'border-slate-100'}`}>e-Mola</button>}
                {loja.aceitaMkesh && <button onClick={() => setMetodoPagamento('mKesh')} className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase ${metodoPagamento === 'mKesh' ? 'border-yellow-500 bg-yellow-50' : 'border-slate-100'}`}>mKesh</button>}
                {loja.aceitaBanco && <button onClick={() => setMetodoPagamento('Banco')} className={`p-3 rounded-2xl border-2 text-[9px] font-black uppercase ${metodoPagamento === 'Banco' ? 'border-blue-500 bg-blue-50' : 'border-slate-100'}`}>Banco</button>}
              </div>

              {metodoPagamento && (
                <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] space-y-1 animate-in zoom-in-95 duration-200 shadow-xl">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Dados para Pagamento:</p>
                  <p className="text-lg font-black tracking-tighter">
                    {metodoPagamento === 'M-Pesa' && `${loja.numeroMpesa} - ${loja.nomeMpesa}`}
                    {metodoPagamento === 'e-Mola' && loja.numeroEmola}
                    {metodoPagamento === 'mKesh' && loja.numeroMkesh}
                    {metodoPagamento === 'Banco' && loja.dadosBancarios}
                  </p>
                </div>
              )}
            </div>

            {/* BOTÃO FINAL WHATSAPP */}
            <div className="pt-4">
              <div className="flex justify-between mb-4 px-2">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Total a pagar:</span>
                <span className="font-black text-xl italic">{totalGeral.toLocaleString()} {loja.moeda || 'MT'}</span>
              </div>
              <button 
                onClick={finalizarPedido} 
                disabled={!metodoPagamento || (metodoEntrega === 'entrega' && !endereco)}
                className="w-full bg-[#25D366] text-white py-7 rounded-[2.5rem] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 shadow-xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
              >
                <Send size={20}/> Confirmar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LojaPublica;