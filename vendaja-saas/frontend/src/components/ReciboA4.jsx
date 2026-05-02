import React, { useEffect } from 'react';
import { Printer, Building2, ShieldCheck, Globe, Phone } from 'lucide-react';

const ReciboA4 = ({ venda, configLoja, fechar }) => {
  const moeda = configLoja.moeda || 'MT';

  useEffect(() => {
    const timer = setTimeout(() => {
      window.print();
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (!venda) return null;

  const DocumentoPagina = ({ tipo }) => (
    <div className="documento-a4 flex flex-col bg-white print:m-0 print:border-0 overflow-hidden">
      {/* HEADER */}
      <div className="p-10 pb-6 flex justify-between items-start border-b-2 border-slate-900">
        <div className="flex gap-4 items-center">
          {configLoja.logoUrl || configLoja.logo ? (
            <img src={configLoja.logoUrl || configLoja.logo} alt="Logo" className="h-16 w-16 object-contain grayscale" />
          ) : (
            <div className="h-14 w-14 bg-slate-100 flex items-center justify-center text-slate-400 rounded"><Building2 size={28} /></div>
          )}
          <div className="space-y-0.5">
            <h1 className="text-xl font-black uppercase text-slate-900 leading-none">{configLoja.nomeEmpresa || configLoja.nome || "EMPRESA"}</h1>
            <div className="text-[9px] font-bold text-slate-500 uppercase">
              <p className="text-slate-800 font-black text-[10px]">NUIT: {configLoja.nuit || "--- --- ---"}</p>
              <p className="flex items-center gap-1"><Globe size={8}/> {configLoja.endereco || "Endereço Indisponível"}</p>
              <p className="flex items-center gap-1"><Phone size={8}/> {configLoja.telefone || "Contacto"}</p>
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="inline-block border-2 border-slate-900 px-3 py-1.5 mb-2">
            <h2 className="text-lg font-black uppercase tracking-widest leading-none">{venda.tipoDocumento || "Factura"}</h2>
            <p className="text-[8px] font-black opacity-60 uppercase mt-1 text-center border-t border-slate-100 pt-1">{tipo}</p>
          </div>
          <p className="text-[10px] font-black text-slate-900 tabular-nums">Nº {venda.id?.slice(-8).toUpperCase()}</p>
        </div>
      </div>

      <div className="p-10 pt-6 flex-grow">
        {/* INFO CLIENTE */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-7 border-l-4 border-slate-900 pl-4 py-1">
             <h3 className="text-[8px] font-black uppercase text-slate-400 mb-1">Facturar a:</h3>
             <p className="text-md font-black text-slate-900 uppercase leading-none mb-1">{venda.clienteNome || "Consumidor Final"}</p>
             <p className="text-[9px] font-bold text-slate-500 uppercase">NUIT: {venda.clienteNuit || "--- --- ---"}</p>
          </div>
          <div className="col-span-5 text-right text-[9px] font-bold uppercase text-slate-500 space-y-1">
             <p>Data: <span className="text-slate-900">{new Date(venda.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString('pt-MZ')}</span></p>
             <p>Pagamento: <span className="text-slate-900">{venda.metodo || "Numerário"}</span></p>
          </div>
        </div>

        {/* TABELA ITENS */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-slate-900 text-[9px] font-black uppercase text-slate-900 text-left">
              <th className="py-2">Descrição</th>
              <th className="py-2 text-center w-16">Qtd</th>
              <th className="py-2 text-right w-24">Unitário</th>
              <th className="py-2 text-right w-24">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {venda.itens.map((item, idx) => (
              <tr key={idx} className="text-[10px] text-slate-700">
                <td className="py-3 font-black uppercase text-slate-900">{item.nome}</td>
                <td className="py-3 text-center">{item.qtd}</td>
                <td className="py-3 text-right">{Number(item.preco).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
                <td className="py-3 text-right font-black text-slate-900">
                    { (item.qtd * item.preco).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) }
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAIS */}
        <div className="flex justify-end pt-4 border-t border-slate-50">
          <div className="w-48 space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase px-2">
              <span>Subtotal</span>
              <span>{Number(venda.subtotal || venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-slate-900 text-white p-3 rounded-sm flex justify-between items-center">
              <span className="text-[9px] font-black uppercase">Total</span>
              <span className="text-lg font-black">{Number(venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} {moeda}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="p-10 pt-0">
        <div className="grid grid-cols-2 gap-10 text-center mb-8">
          <div className="border-t border-slate-200 pt-2 text-[7px] font-black uppercase text-slate-400">Assinatura</div>
          <div className="border-t border-slate-200 pt-2 text-[7px] font-black uppercase text-slate-400">Carimbo</div>
        </div>
        <div className="flex justify-between items-center text-[7px] font-bold text-slate-400 uppercase border-t border-slate-50 pt-4">
          <p>Processado por VendaJá PRO</p>
          <p className="flex items-center gap-1"><ShieldCheck size={8}/> Documento Válido em Moçambique</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="print-modal-overlay fixed inset-0 z-[9999] bg-slate-900/60 flex flex-col items-center overflow-y-auto p-10 print:p-0 print:bg-white print:block print:static">
      
      {/* HEADER DE CONTROLO - OCULTO NO PRINT */}
      <div className="w-[210mm] flex justify-between items-center bg-white border-b p-4 rounded-t-xl print:hidden sticky top-0 z-[100]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 rounded-lg text-white"><Printer size={20}/></div>
          <h3 className="font-black text-xs uppercase tracking-widest text-slate-900">Impressão de Documento</h3>
        </div>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-transform">Imprimir</button>
          <button onClick={fechar} className="bg-slate-100 text-slate-500 px-6 py-2 rounded-lg font-black uppercase text-[10px] tracking-widest">Fechar</button>
        </div>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div className="print-section flex flex-col gap-6 print:gap-0">
        <DocumentoPagina tipo="ORIGINAL" />
        <DocumentoPagina tipo="DUPLICADO" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @page {
          size: A4;
          margin: 0;
        }

        @media print {
          /* Esconde absolutamente tudo o que não seja o nosso componente de impressão */
          body > *:not(.print-modal-overlay) {
            display: none !important;
          }

          .print-modal-overlay {
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            display: block !important;
            background: white !important;
          }

          .print-section {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .documento-a4 {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important;
            display: flex !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Remove cabeçalhos e rodapés automáticos do browser */
          header, footer { display: none !important; }
        }

        /* Estilo para ecrã */
        .documento-a4 {
          width: 210mm;
          height: 297mm;
          box-shadow: 0 10px 50px rgba(0,0,0,0.3);
          border: 1px solid #e2e8f0;
          background: white;
        }
      `}} />
    </div>
  );
};

export default ReciboA4;