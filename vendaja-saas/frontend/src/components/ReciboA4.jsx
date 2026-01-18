import React from 'react';
import { Printer, X, FileText, User, Building2, MapPin, Phone } from 'lucide-react';

const ReciboA4=({ venda, configLoja, fechar }) => {
  
  const imprimir = () => {
    window.print();
  };

  // Componente interno para evitar repetição de código (Original/Duplicado)
  const DocumentoPagina = ({ tipo }) => (
    <div className="bg-white p-12 mb-8 mx-auto w-[210mm] min-h-[297mm] shadow-none print:shadow-none print:m-0 print:break-after-page">
      {/* CABEÇALHO */}
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
        <div className="space-y-4">
          {configLoja.logoUrl ? (
            <img src={configLoja.logoUrl} alt="Logo" className="h-20 object-contain" />
          ) : (
            <div className="h-20 w-20 bg-slate-900 rounded-2xl flex items-center justify-center text-white font-black text-2xl">
              {configLoja.nome?.substring(0, 2).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-black uppercase text-slate-900">{configLoja.nome || "A MINHA EMPRESA, LDA"}</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{configLoja.endereco}</p>
            <p className="text-xs font-bold text-slate-500">NUIT: {configLoja.nuit || "000000000"}</p>
            <p className="text-xs font-bold text-slate-500">Contactos: {configLoja.telefone}</p>
          </div>
        </div>

        <div className="text-right space-y-2">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-xl inline-block">
            <h2 className="text-xl font-black uppercase tracking-tighter">Factura Recibo</h2>
            <p className="text-[10px] font-bold opacity-80 uppercase text-center">{tipo}</p>
          </div>
          <div className="text-xs font-bold text-slate-600 uppercase">
            <p>Série: {new Date().getFullYear()}</p>
            <p>Nº Doc: <span className="text-slate-900 font-black"># {venda.id?.slice(-8).toUpperCase()}</span></p>
            <p>Data: {new Date(venda.data).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* DADOS DO CLIENTE */}
      <div className="grid grid-cols-2 gap-12 mb-10">
        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
          <h3 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2">
            <User size={12}/> Dados do Exmo.(a) Cliente
          </h3>
          <div className="space-y-1">
            <p className="font-black text-slate-900 uppercase">{venda.infoAdicional || "Consumidor Final"}</p>
            <p className="text-xs font-bold text-slate-600">NUIT: {venda.clienteNuit || "999999999"}</p>
            <p className="text-xs font-bold text-slate-600">{venda.clienteEndereco || "Maputo, Moçambique"}</p>
          </div>
        </div>
        
        <div className="flex flex-col justify-center items-end">
           <div className="text-right">
              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Moeda de Transação</p>
              <p className="font-black text-slate-900 text-lg uppercase italic">{configLoja.moeda || 'MT'}</p>
           </div>
        </div>
      </div>

      {/* TABELA DE ITENS */}
      <table className="w-full mb-10">
        <thead>
          <tr className="bg-slate-900 text-white text-[11px] font-black uppercase tracking-widest">
            <th className="py-4 px-4 text-left rounded-l-xl">Descrição</th>
            <th className="py-4 px-4 text-center">Qtd</th>
            <th className="py-4 px-4 text-right">Preço Unit.</th>
            <th className="py-4 px-4 text-right rounded-r-xl">Total Item</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {venda.itens.map((item, idx) => (
            <tr key={idx} className="text-xs font-bold text-slate-700">
              <td className="py-5 px-4 uppercase">{item.nome}</td>
              <td className="py-5 px-4 text-center">{item.qtd}</td>
              <td className="py-5 px-4 text-right">{item.preco.toFixed(2)}</td>
              <td className="py-5 px-4 text-right font-black text-slate-900">{(item.preco * item.qtd).toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* TOTAIS */}
      <div className="flex justify-between items-start mt-auto">
        <div className="max-w-[300px] text-[10px] text-slate-400 font-medium italic">
          <p>Documento processado por computador.</p>
          <p>Os bens/serviços foram entregues a contento do cliente.</p>
        </div>

        <div className="w-full max-w-[300px] space-y-3">
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
            <span>Sub-Total</span>
            <span>{(venda.total / 1.16).toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
            <span>IVA (16%)</span>
            <span>{(venda.total - (venda.total / 1.16)).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t-2 border-slate-900">
            <span className="text-lg font-black uppercase italic">Total Akz/MT</span>
            <span className="text-3xl font-black tabular-nums">{venda.total.toFixed(2)}</span>
          </div>
          <div className="bg-slate-100 p-3 rounded-xl text-[10px] font-black uppercase text-center text-slate-600">
            PAGAMENTO: {venda.metodo}
          </div>
        </div>
      </div>

      {/* ASSINATURAS */}
      <div className="grid grid-cols-2 gap-20 mt-20 pt-10 border-t border-dashed border-slate-200 text-center">
        <div>
          <div className="h-px bg-slate-300 w-full mb-4"></div>
          <p className="text-[10px] font-black uppercase text-slate-400">Pela Empresa</p>
        </div>
        <div>
          <div className="h-px bg-slate-300 w-full mb-4"></div>
          <p className="text-[10px] font-black uppercase text-slate-400">Recebi (O Cliente)</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-800/95 backdrop-blur-sm overflow-y-auto pt-10 pb-20 font-serif">
      {/* CONTROLADORES FLUTUANTES */}
      <div className="fixed top-6 right-10 flex gap-4 print:hidden z-[10000]">
        <button 
          onClick={imprimir}
          className="bg-emerald-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl hover:bg-emerald-600 flex items-center gap-3 transition-transform hover:scale-105 active:scale-95"
        >
          <Printer size={20}/> Imprimir Factura A4
        </button>
        <button 
          onClick={fechar}
          className="bg-white text-slate-900 p-4 rounded-2xl shadow-2xl hover:bg-slate-100 border border-slate-200 transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* ÁREA DE IMPRESSÃO A4 */}
      <div className="print:m-0">
        <DocumentoPagina tipo="Original" />
        <DocumentoPagina tipo="Duplicado" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 0; }
          div { box-shadow: none !important; }
        }
      `}} />
    </div>
  );
};

export default ReciboA4