import React, { useEffect, useState, useMemo } from 'react';
import { db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { 
  Clock, CheckCircle2, User, Calendar, DollarSign, Search, 
  Filter, ArrowUpRight, Loader2, CreditCard, ChevronRight,
  AlertCircle, Eye, Receipt, X, TrendingDown, CalendarDays,
  Printer, Send, FileText
} from 'lucide-react';

const Fiados = ({ usuario, configLoja, avisar }) => {
  const [dividas, setDividas] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [pesquisa, setPesquisa] = useState('');
  const [filtroTempo, setFiltroTempo] = useState('todos'); 
  const [filtroValor, setFiltroValor] = useState('recente'); 
  const [processandoId, setProcessandoId] = useState(null);
  const [vendaSelecionada, setVendaSelecionada] = useState(null);

  useEffect(() => {
    buscarDividas();
  }, [usuario.lojaId]);

  const buscarDividas = async () => {
    try {
      setCarregando(true);
      const q = query(
        collection(db, "vendas"),
        where("lojaId", "==", usuario.lojaId),
        where("status", "==", "PENDENTE"),
        orderBy("data", "desc")
      );

      const snap = await getDocs(q);
      const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDividas(lista);
    } catch (error) {
      console.error("Erro ao buscar fiados:", error);
      avisar("ERRO AO CARREGAR REGISTOS", "erro");
    } finally {
      setCarregando(false);
    }
  };

  const liquidarDivida = async (vendaId) => {
    if (!window.confirm("CONFIRMAR RECEBIMENTO TOTAL DESTA DÍVIDA?")) return;
    
    setProcessandoId(vendaId);
    try {
      const vendaRef = doc(db, "vendas", vendaId);
      await updateDoc(vendaRef, {
        status: "PAGO",
        dataLiquidacao: new Date().toISOString(),
        metodoPagamentoOriginal: "Dívida (Fiado)",
        metodo: "Dinheiro"
      });

      setDividas(dividas.filter(d => d.id !== vendaId));
      setVendaSelecionada(null);
      avisar("CONTA LIQUIDADA", "sucesso");
    } catch (error) {
      avisar("FALHA NA OPERAÇÃO", "erro");
    } finally {
      setProcessandoId(null);
    }
  };

  const imprimirExtrato = (venda) => {
    const janelaImpressao = window.open('', '_blank');
    janelaImpressao.document.write(`
      <html>
        <head>
          <title>EXTRATO DE DÍVIDA - ${configLoja.nome}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #000; padding-bottom: 20px; margin-bottom: 20px; }
            .loja-nome { font-size: 24px; font-weight: bold; text-transform: uppercase; }
            .titulo { font-size: 18px; margin-top: 10px; font-weight: bold; color: #666; }
            .dados { margin-bottom: 30px; font-size: 14px; }
            table { w-full; border-collapse: collapse; margin-top: 20px; }
            th { text-align: left; border-bottom: 1px solid #eee; padding: 10px; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #eee; font-size: 13px; }
            .total-container { margin-top: 30px; text-align: right; border-top: 2px solid #000; padding-top: 10px; }
            .total-valor { font-size: 22px; font-weight: bold; }
            .rodape { margin-top: 50px; font-size: 10px; text-align: center; color: #999; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="loja-nome">${configLoja.nome}</div>
            <div class="titulo">EXTRATO DE DÉBITO PENDENTE</div>
          </div>
          <div class="dados">
            <p><strong>CLIENTE:</strong> ${venda.infoAdicional || 'NÃO ESPECIFICADO'}</p>
            <p><strong>DATA DA COMPRA:</strong> ${new Date(venda.data).toLocaleDateString()}</p>
            <p><strong>REFERÊNCIA:</strong> ${venda.id.slice(-8).toUpperCase()}</p>
          </div>
          <table style="width: 100%">
            <thead>
              <tr>
                <th>DESCRIÇÃO</th>
                <th>QTD</th>
                <th>PREÇO UNIT.</th>
                <th>SUBTOTAL</th>
              </tr>
            </thead>
            <tbody>
              ${venda.itens.map(it => `
                <tr>
                  <td>${it.nome.toUpperCase()}</td>
                  <td>${it.qtd}</td>
                  <td>${Number(it.preco).toFixed(2)}</td>
                  <td>${(Number(it.preco) * Number(it.qtd)).toFixed(2)}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="total-container">
            <span>TOTAL EM DÍVIDA</span><br/>
            <span class="total-valor">${Number(venda.total).toFixed(2)} ${configLoja.moeda}</span>
          </div>
          <div class="rodape">
            Documento gerado em ${new Date().toLocaleString()}<br/>
            Este documento serve apenas para conferência de valores pendentes.
          </div>
        </body>
      </html>
    `);
    janelaImpressao.document.close();
    janelaImpressao.print();
  };

  const dadosFiltrados = useMemo(() => {
    let resultado = dividas.filter(d => 
      d.infoAdicional?.toLowerCase().includes(pesquisa.toLowerCase()) ||
      d.id.toLowerCase().includes(pesquisa.toLowerCase())
    );

    const agora = new Date();
    if (filtroTempo === 'hoje') {
      resultado = resultado.filter(d => new Date(d.data).toDateString() === agora.toDateString());
    } else if (filtroTempo === 'semana') {
      const umaSemanaAtras = new Date().setDate(agora.getDate() - 7);
      resultado = resultado.filter(d => new Date(d.data) > umaSemanaAtras);
    } else if (filtroTempo === 'antigo') {
      const umaSemanaAtras = new Date().setDate(agora.getDate() - 7);
      resultado = resultado.filter(d => new Date(d.data) < umaSemanaAtras);
    }

    if (filtroValor === 'maior_valor') {
      resultado.sort((a, b) => b.total - a.total);
    } else {
      resultado.sort((a, b) => new Date(b.data) - new Date(a.data));
    }

    return resultado;
  }, [dividas, pesquisa, filtroTempo, filtroValor]);

  const totalEmAberto = dadosFiltrados.reduce((acc, d) => acc + Number(d.total), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[2rem] border border-slate-200 flex flex-col justify-between">
            <div>
                <h2 className="text-3xl font-bold text-slate-900 uppercase tracking-tight">
                    GESTÃO DE <span className="text-blue-700">CONTAS A RECEBER</span>
                </h2>
                <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider mt-1">
                    CONTROLO DE CRÉDITO E COBRANÇAS ATIVAS
                </p>
            </div>
            <div className="flex gap-3 mt-8">
                {['todos', 'hoje', 'antigo'].map(f => (
                    <button 
                        key={f}
                        onClick={() => setFiltroTempo(f)}
                        className={`px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase transition-all border ${filtroTempo === f ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-400'}`}
                    >
                        {f === 'antigo' ? 'DÍVIDAS CRÍTICAS (+7 DIAS)' : f}
                    </button>
                ))}
            </div>
        </div>

        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 relative overflow-hidden">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">CAPITAL EM DÍVIDA</p>
            <h3 className="text-4xl font-bold text-slate-900 tabular-nums">
                {totalEmAberto.toLocaleString()}<small className="text-sm font-medium ml-2 text-slate-400">{configLoja.moeda}</small>
            </h3>
            <div className="mt-4 flex items-center gap-2 text-red-600 font-bold text-[10px] uppercase">
                <AlertCircle size={14}/> {dadosFiltrados.length} FATURAS PENDENTES
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            className="w-full bg-white p-5 pl-14 rounded-2xl border border-slate-200 outline-none focus:border-blue-500 font-medium text-slate-700 transition-all shadow-sm"
            placeholder="PESQUISAR CLIENTE OU REFERÊNCIA..."
            value={pesquisa}
            onChange={e => setPesquisa(e.target.value)}
          />
        </div>
        <select 
            className="bg-white px-6 py-5 rounded-2xl border border-slate-200 font-bold text-[11px] uppercase text-slate-600 outline-none cursor-pointer"
            value={filtroValor}
            onChange={e => setFiltroValor(e.target.value)}
        >
            <option value="recente">ORDENAR POR DATA</option>
            <option value="maior_valor">ORDENAR POR VALOR</option>
        </select>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase">
              <th className="p-6">CLIENTE / DATA</th>
              <th className="p-6">ESTADO</th>
              <th className="p-6 text-right">VALOR PENDENTE</th>
              <th className="p-6 text-right">AÇÕES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {carregando ? (
                <tr><td colSpan="4" className="p-20 text-center"><Loader2 className="animate-spin inline text-blue-600" size={30}/></td></tr>
            ) : dadosFiltrados.map((item) => {
                const dias = Math.floor((new Date() - new Date(item.data)) / (1000 * 60 * 60 * 24));
                return (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                            <div className="font-bold text-slate-800 uppercase text-sm">{item.infoAdicional || "NÃO IDENTIFICADO"}</div>
                            <div className="text-[10px] text-slate-400 font-medium mt-1 uppercase">REGISTADO EM: {new Date(item.data).toLocaleDateString()}</div>
                        </td>
                        <td className="p-6">
                            <span className={`text-[9px] font-bold px-3 py-1 rounded-md uppercase border ${dias >= 7 ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-200 bg-white text-slate-500'}`}>
                                {dias} DIAS EM ATRAZO
                            </span>
                        </td>
                        <td className="p-6 text-right font-bold text-slate-900 text-lg tabular-nums">
                            {Number(item.total).toFixed(2)}
                        </td>
                        <td className="p-6 text-right flex justify-end gap-2">
                            <button onClick={() => imprimirExtrato(item)} className="p-3 text-slate-400 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-white transition-all shadow-sm" title="IMPRIMIR EXTRATO">
                                <Printer size={18} />
                            </button>
                            <button onClick={() => setVendaSelecionada(item)} className="p-3 text-slate-400 hover:text-blue-600 border border-slate-200 rounded-xl hover:bg-white transition-all shadow-sm">
                                <Eye size={18} />
                            </button>
                            <button 
                                onClick={() => liquidarDivida(item.id)}
                                className="bg-slate-900 text-white px-6 py-3 rounded-xl font-bold text-[10px] uppercase tracking-wider hover:bg-emerald-700 transition-all"
                            >
                                LIQUIDAR
                            </button>
                        </td>
                    </tr>
                )
            })}
          </tbody>
        </table>
      </div>

      {vendaSelecionada && (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl">
                  <div className="p-8 flex justify-between items-center border-b border-slate-100">
                      <div>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">DETALHES DO DÉBITO</p>
                          <h3 className="text-2xl font-bold text-slate-900 uppercase tracking-tight">{vendaSelecionada.infoAdicional}</h3>
                      </div>
                      <button onClick={() => setVendaSelecionada(null)} className="p-2 text-slate-400 hover:text-red-500 transition-all"><X size={24}/></button>
                  </div>
                  
                  <div className="p-8 space-y-3 max-h-[350px] overflow-y-auto">
                      {vendaSelecionada.itens.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl">
                              <span className="font-bold text-slate-700 uppercase text-xs">{it.qtd}x {it.nome}</span>
                              <span className="font-bold text-slate-900">{(it.preco * it.qtd).toFixed(2)}</span>
                          </div>
                      ))}
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100">
                      <div className="flex justify-between items-center mb-6">
                          <span className="text-[10px] font-bold uppercase text-slate-500">VALOR TOTAL ACUMULADO</span>
                          <span className="text-3xl font-bold text-slate-900">{Number(vendaSelecionada.total).toFixed(2)} {configLoja.moeda}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => imprimirExtrato(vendaSelecionada)} className="flex items-center justify-center gap-2 border border-slate-300 py-4 rounded-xl font-bold uppercase text-[10px] hover:bg-white transition-all">
                            <Printer size={16}/> IMPRIMIR EXTRATO
                        </button>
                        <button onClick={() => liquidarDivida(vendaSelecionada.id)} className="flex items-center justify-center gap-2 bg-emerald-600 text-white py-4 rounded-xl font-bold uppercase text-[10px] hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100">
                            <CheckCircle2 size={16}/> CONFIRMAR PAGAMENTO
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