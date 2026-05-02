import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, orderBy, increment, writeBatch } from "firebase/firestore";
import { 
  CheckCircle2, AlertCircle, Eye, X, Loader2, Printer, Search, Clock
} from 'lucide-react';

const Fiados = ({ usuario, configLoja, avisar }) => {
  const [dividas, setDividas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroTempo, setFiltroTempo] = useState('todos'); 
  const [filtroValor, setFiltroValor] = useState('recente'); 
  const [processandoId, setProcessandoId] = useState(null);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);

  const empresaId = usuario?.empresaId || usuario?.uid;

  useEffect(() => {
    if (empresaId) {
      buscarDividas();
    }
  }, [empresaId]);

  const buscarDividas = async () => {
    try {
      setCarregando(true);
      const q = query(
        collection(db, "vendas"),
        where("empresaId", "==", empresaId),
        where("status", "==", "PENDENTE"),
        orderBy("data", "desc")
      );

      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDividas(lista);
    } catch (error) {
      console.error("Erro ao buscar fiados:", error);
      avisar?.("ERRO AO CARREGAR REGISTOS", "erro");
    } finally {
      setCarregando(false);
    }
  };

  const liquidarDivida = async (venda) => {
    if (!window.confirm(`CONFIRMAR RECEBIMENTO DE ${Number(venda.saldoDevedor || venda.total).toFixed(2)} ${configLoja?.moeda || 'MT'}?`)) return;
    
    setProcessandoId(venda.id);
    const batch = writeBatch(db);

    try {
      const vendaRef = doc(db, "vendas", venda.id);
      
      // 1. Atualizar o Status da Venda
      batch.update(vendaRef, {
        status: "PAGO",
        valorPago: Number(venda.total),
        saldoDevedor: 0,
        dataLiquidacao: new Date().toISOString(),
        origemPagamento: "Dívida Liquidada",
        liquidadoPor: usuario.nome || "Sistema"
      });

      // 2. Lógica de Stock (Abate tardio para Proformas/Orçamentos que viraram venda agora)
      // Se o documento original NÃO abateu stock, abatemos agora na liquidação
      const tiposSemAbate = ['Factura Pro-forma', 'Orçamento', 'Pedido Orçamento', 'Proposta'];
      const tiposRepor = ['Nota de Crédito', 'Devolução', 'Devolução a Dinheiro'];

      if (tiposSemAbate.includes(venda.tipoDocumento)) {
        venda.itens.forEach(item => {
          const produtoRef = doc(db, "produtos", item.id);
          batch.update(produtoRef, { stock: increment(-item.qtd) });
        });
      } else if (tiposRepor.includes(venda.tipoDocumento)) {
        // Se for uma devolução que estava pendente, repõe ao liquidar
        venda.itens.forEach(item => {
          const produtoRef = doc(db, "produtos", item.id);
          batch.update(produtoRef, { stock: increment(item.qtd) });
        });
      }

      // 3. Atualizar Saldo do Cliente
      if (venda.clienteId) {
        const clienteRef = doc(db, "clientes", venda.clienteId);
        batch.update(clienteRef, {
          totalPago: increment(Number(venda.saldoDevedor || venda.total)),
          totalDivida: increment(-Number(venda.saldoDevedor || venda.total))
        });
      }

      await batch.commit();

      setDividas(dividas.filter(d => d.id !== venda.id));
      setVendaSelecionada(null);
      avisar?.("PAGAMENTO RECEBIDO E STOCK ATUALIZADO", "sucesso");
    } catch (error) {
      console.error(error);
      avisar?.("FALHA NA OPERAÇÃO", "erro");
    } finally {
      setProcessandoId(null);
    }
  };

  const imprimirExtrato = (venda) => {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>EXTRATO DE DÍVIDA - ${configLoja?.nomeLoja || 'SISTEMA'}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; text-align: center; }
            .dados { margin-bottom: 30px; background: #f8fafc; padding: 20px; border-radius: 10px; }
            table { width: 100%; border-collapse: collapse; }
            th { text-align: left; border-bottom: 1px solid #e2e8f0; padding: 10px; font-size: 12px; }
            td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; }
            .total { margin-top: 20px; text-align: right; font-size: 20px; font-weight: 900; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${configLoja?.nomeLoja || 'RECIBO'}</h1>
            <p>EXTRATO DE DÉBITO PENDENTE</p>
          </div>
          <div class="dados">
            <strong>CLIENTE:</strong> ${venda.clienteNome || 'CONSUMIDOR FINAL'}<br/>
            <strong>DATA:</strong> ${venda.data}<br/>
            <strong>DOC:</strong> ${venda.tipoDocumento} #${venda.id.slice(-6).toUpperCase()}
          </div>
          <table>
            <thead>
              <tr><th>PRODUTO</th><th>QTD</th><th>PREÇO</th><th>TOTAL</th></tr>
            </thead>
            <tbody>
              ${venda.itens.map(it => `
                <tr>
                  <td>${it.nome}</td>
                  <td>${it.qtd}</td>
                  <td>${Number(it.preco).toFixed(2)}</td>
                  <td>${(it.qtd * it.preco).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total">
            TOTAL EM DIVIDA: ${Number(venda.saldoDevedor || venda.total).toFixed(2)} ${configLoja?.moeda || 'MT'}
          </div>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  const dadosFiltrados = useMemo(() => {
    let resultado = dividas.filter(d => 
      d.clienteNome?.toLowerCase().includes(pesquisa.toLowerCase()) ||
      d.id.toLowerCase().includes(pesquisa.toLowerCase())
    );

    const agora = new Date();
    if (filtroTempo === 'hoje') {
      resultado = resultado.filter(d => d.data === agora.toISOString().split('T')[0]);
    } else if (filtroTempo === 'antigo') {
      const umaSemanaAtras = new Date();
      umaSemanaAtras.setDate(agora.getDate() - 7);
      resultado = resultado.filter(d => new Date(d.data) < umaSemanaAtras);
    }

    if (filtroValor === 'maior_valor') {
      resultado.sort((a, b) => b.total - a.total);
    } else {
      resultado.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    return resultado;
  }, [dividas, pesquisa, filtroTempo, filtroValor]);

  const totalEmAberto = dadosFiltrados.reduce((acc, d) => acc + Number(d.saldoDevedor || d.total), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col justify-between shadow-sm">
            <div>
                <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">
                    Contas a <span className="text-blue-600">Receber</span>
                </h2>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-1">
                    Gestão de crédito e liquidação de stock
                </p>
            </div>
            <div className="flex flex-wrap gap-2 mt-8">
                {['todos', 'hoje', 'antigo'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFiltroTempo(f)}
                        className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${filtroTempo === f ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
                    >
                        {f === 'antigo' ? 'Dívidas Críticas (+7 Dias)' : f}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[2rem] text-white relative overflow-hidden shadow-xl">
            <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Saldo Total Pendente</p>
                <h3 className="text-4xl font-black tabular-nums italic">
                    {totalEmAberto.toLocaleString()} <span className="text-sm font-bold text-blue-400">{configLoja?.moeda || 'MT'}</span>
                </h3>
                <div className="mt-4 flex items-center gap-2 text-rose-400 font-black text-[10px] uppercase italic">
                    <AlertCircle size={14}/> {dadosFiltrados.length} Recebimentos Pendentes
                </div>
            </div>
            <div className="absolute -right-4 -bottom-4 opacity-10">
                 <AlertCircle size={120} />
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
          <input 
            className="w-full bg-white p-5 pl-14 rounded-2xl border-2 border-slate-100 outline-none focus:border-blue-500 font-bold text-sm text-slate-700 transition-all shadow-sm"
            placeholder="PESQUISAR CLIENTE OU DOCUMENTO..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </div>
        <select 
            className="bg-white px-6 py-5 rounded-2xl border-2 border-slate-100 font-black text-[10px] uppercase text-slate-500 outline-none cursor-pointer hover:border-slate-300 transition-all shadow-sm"
            value={filtroValor}
            onChange={e => setFiltroValor(e.target.value)}
        >
            <option value="recente">Recentemente Adicionados</option>
            <option value="maior_valor">Maiores Valores Primeiro</option>
        </select>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-slate-100 text-[10px] font-black text-slate-400 uppercase italic">
                <th className="p-8">Cliente / Documento</th>
                <th className="p-8">Tempo de Espera</th>
                <th className="p-8 text-right">Valor em Dívida</th>
                <th className="p-8 text-right">Acções</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {carregando ? (
                  <tr><td colSpan="4" className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600" size={32}/></td></tr>
              ) : dadosFiltrados.length === 0 ? (
                  <tr><td colSpan="4" className="p-20 text-center text-slate-400 font-bold uppercase text-xs">Sem contas pendentes para os filtros aplicados</td></tr>
              ) : dadosFiltrados.map((item) => {
                  const dias = Math.floor((new Date() - new Date(item.data)) / (1000 * 60 * 60 * 24));
                  return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="p-8">
                              <div className="font-black text-slate-800 uppercase text-sm tracking-tighter">{item.clienteNome || "Consumidor Final"}</div>
                              <div className="text-[9px] text-slate-400 font-bold mt-1 uppercase">
                                <span className="text-blue-500">{item.tipoDocumento}</span> • #{item.id.slice(-6).toUpperCase()} • {item.data}
                              </div>
                          </td>
                          <td className="p-8">
                              <span className={`text-[9px] font-black px-4 py-2 rounded-lg uppercase border-2 ${dias >= 7 ? 'border-rose-100 bg-rose-50 text-rose-600 animate-pulse' : 'border-slate-100 bg-white text-slate-400'}`}>
                                  {dias === 0 ? 'Emitido Hoje' : `${dias} Dias Pendente`}
                              </span>
                          </td>
                          <td className="p-8 text-right font-black text-slate-900 text-lg tabular-nums italic">
                              {(item.saldoDevedor || item.total).toFixed(2)}
                          </td>
                          <td className="p-8 text-right flex justify-end gap-2">
                              <button onClick={() => imprimirExtrato(item)} className="p-4 text-slate-400 hover:text-slate-900 border-2 border-slate-50 rounded-2xl hover:bg-white transition-all shadow-sm">
                                  <Printer size={18} />
                              </button>
                              <button onClick={() => setVendaSelecionada(item)} className="p-4 text-slate-400 hover:text-blue-600 border-2 border-slate-50 rounded-2xl hover:bg-white transition-all shadow-sm">
                                  <Eye size={18} />
                              </button>
                              <button 
                                  disabled={processandoId === item.id}
                                  onClick={() => liquidarDivida(item)}
                                  className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-blue-100 disabled:opacity-50"
                              >
                                  {processandoId === item.id ? <Clock className="animate-spin" size={14}/> : 'Liquidar'}
                              </button>
                          </td>
                      </tr>
                  )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {vendaSelecionada && (
          <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-[3rem] overflow-hidden shadow-2xl border border-white/20 animate-in zoom-in-95 duration-300">
                  <div className="p-10 flex justify-between items-start">
                      <div>
                          <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 italic">{vendaSelecionada.tipoDocumento}</p>
                          <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic">{vendaSelecionada.clienteNome || "Consumidor Final"}</h3>
                          <p className="text-slate-400 text-[10px] font-bold">Ref: {vendaSelecionada.id}</p>
                      </div>
                      <button onClick={() => setVendaSelecionada(null)} className="bg-slate-100 p-3 rounded-2xl text-slate-400 hover:text-rose-500 transition-all"><X size={20}/></button>
                  </div>
                  
                  <div className="px-10 space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                      {vendaSelecionada.itens.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                              <div>
                                <span className="block font-black text-slate-800 uppercase text-xs">{it.nome}</span>
                                <span className="text-[10px] text-slate-400 font-bold">{it.qtd} x {Number(it.preco).toFixed(2)}</span>
                              </div>
                              <span className="font-black text-slate-900 tabular-nums">{(it.preco * it.qtd).toFixed(2)}</span>
                          </div>
                      ))}
                  </div>

                  <div className="p-10 bg-white">
                      <div className="flex justify-between items-center mb-8 p-6 bg-slate-900 rounded-[2rem] text-white">
                          <span className="text-[10px] font-black uppercase text-white/40 italic">Total em Dívida</span>
                          <span className="text-3xl font-black italic tabular-nums">{(vendaSelecionada.saldoDevedor || vendaSelecionada.total).toFixed(2)} <small className="text-xs text-blue-400">{configLoja?.moeda || 'MT'}</small></span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={() => imprimirExtrato(vendaSelecionada)} className="flex items-center justify-center gap-3 border-2 border-slate-100 py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-50 transition-all text-slate-600">
                            <Printer size={18}/> Imprimir Extrato
                        </button>
                        <button 
                          onClick={() => liquidarDivida(vendaSelecionada)} 
                          className="flex items-center justify-center gap-3 bg-blue-600 text-white py-5 rounded-2xl font-black uppercase text-[10px] hover:bg-slate-900 transition-all shadow-xl shadow-blue-200"
                        >
                            <CheckCircle2 size={18}/> Confirmar Recebimento
                        </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Fiados;