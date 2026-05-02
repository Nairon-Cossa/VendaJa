import React, { useEffect } from 'react';
import { 
  Printer, Building2, ShieldCheck, 
  Globe, Phone 
} from 'lucide-react';

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
    <div className="documento-a4 flex flex-col bg-white overflow-hidden print:shadow-none print:m-0">
      
      {/* HEADER CORPORATIVO */}
      <div className="p-10 pb-6 flex justify-between items-start border-b-2 border-slate-900">
        <div className="flex gap-4 items-center">
          {configLoja.logoUrl || configLoja.logo ? (
            <img 
              src={configLoja.logoUrl || configLoja.logo} 
              alt="Logo" 
              className="h-16 w-16 object-contain grayscale" 
            />
          ) : (
            <div className="h-14 w-14 bg-slate-100 flex items-center justify-center text-slate-400 rounded">
               <Building2 size={28} />
            </div>
          )}
          <div className="space-y-0.5">
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">
              {configLoja.nomeEmpresa || configLoja.nome || "EMPRESA"}
            </h1>
            <div className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
              <p className="text-slate-800 font-black">NUIT: {configLoja.nuit || "--- --- ---"}</p>
              <p className="flex items-center gap-1"><Globe size={8}/> {configLoja.endereco || "Endereço Indisponível"}</p>
              <p className="flex items-center gap-1"><Phone size={8}/> {configLoja.telefone || "Contacto"}</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block border-2 border-slate-900 px-3 py-1.5 mb-2">
            <h2 className="text-lg font-black uppercase tracking-widest leading-none">
                {venda.tipoDocumento || "Factura"}
            </h2>
            <p className="text-[8px] font-black opacity-60 uppercase tracking-widest mt-1 text-center border-t border-slate-100 pt-1">{tipo}</p>
          </div>
          <div className="text-[10px]">
            <p className="font-bold text-slate-400 uppercase">Nº Documento</p>
            <p className="text-md font-black text-slate-900 tabular-nums"># {venda.id?.slice(-8).toUpperCase()}</p>
          </div>
        </div>
      </div>

      <div className="p-10 pt-6 flex-grow">
        {/* CLIENTE */}
        <div className="grid grid-cols-12 gap-6 mb-8">
          <div className="col-span-7 border-l-4 border-slate-900 pl-4 py-1">
             <h3 className="text-[8px] font-black uppercase text-slate-400 mb-1 tracking-widest">Facturar a:</h3>
             <p className="text-md font-black text-slate-900 uppercase leading-none mb-1">
                {venda.clienteNome || "Consumidor Final"}
             </p>
             <p className="text-[9px] font-bold text-slate-500">
                NUIT: {venda.clienteNuit || "--- --- ---"}
             </p>
          </div>
          <div className="col-span-5 text-right text-[9px] font-bold uppercase text-slate-500 space-y-1">
             <p>Data: <span className="text-slate-900">{new Date(venda.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString('pt-MZ')}</span></p>
             <p>Pagamento: <span className="text-slate-900">{venda.metodo || "Numerário"}</span></p>
          </div>
        </div>

        {/* TABELA */}
        <table className="w-full mb-8">
          <thead>
            <tr className="border-b border-slate-900 text-[9px] font-black uppercase text-slate-900 text-left">
              <th className="py-2">Descrição</th>
              <th className="py-2 text-center">Qtd</th>
              <th className="py-2 text-right">P. Unitário</th>
              <th className="py-2 text-right">Subtotal</th>
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
        <div className="flex justify-end">
          <div className="w-48 space-y-1.5">
            <div className="flex justify-between text-[9px] font-bold text-slate-500 uppercase">
              <span>Subtotal</span>
              <span>{Number(venda.subtotal || venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="bg-slate-900 text-white p-3 rounded-sm flex justify-between items-center">
              <span className="text-[9px] font-black uppercase">Total</span>
              <span className="text-lg font-black">{Number(venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })} <small className="text-[10px]">{moeda}</small></span>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="p-10 pt-0">
        <div className="grid grid-cols-2 gap-10 text-center mb-8">
          <div className="border-t border-slate-200 pt-2 text-[7px] font-black uppercase text-slate-400">Assinatura Autorizada</div>
          <div className="border-t border-slate-200 pt-2 text-[7px] font-black uppercase text-slate-400">Assinatura Cliente</div>
        </div>
        <div className="flex justify-between items-center text-[7px] font-bold text-slate-400 uppercase border-t border-slate-50 pt-4">
          <p>VendaJá PRO • Moçambique</p>
          <p className="flex items-center gap-1"><ShieldCheck size={8}/> Documento Processado por Computador</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/60 backdrop-blur-sm overflow-y-auto print:p-0 print:static">
      
      {/* BOTÕES */}
      <div className="sticky top-0 w-full bg-white border-b p-4 flex justify-center gap-4 print:hidden z-[10001]">
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2"
        >
          <Printer size={14}/> Imprimir
        </button>
        <button 
          onClick={fechar}
          className="bg-slate-100 text-slate-600 px-6 py-2 rounded-full font-black uppercase text-[10px] tracking-widest"
        >
          Fechar
        </button>
      </div>

      {/* CONTAINER DE IMPRESSÃO */}
      <div className="print-area flex flex-col items-center p-8 print:p-0">
        <DocumentoPagina tipo="Original" />
        <div className="h-8 print:hidden"></div>
        <DocumentoPagina tipo="Duplicado" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          /* Esconde tudo */
          body * { visibility: hidden; }
          
          /* Mostra apenas a área de impressão */
          .print-area, .print-area * { visibility: visible; }
          
          /* Força a área de impressão para o topo */
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }

          /* Define o tamanho de cada página */
          .documento-a4 {
            width: 210mm !important;
            height: 297mm !important;
            page-break-after: always !important; /* Força quebra de página após cada cópia */
            display: flex !important;
            margin: 0 !important;
          }

          @page {
            size: A4;
            margin: 0;
          }
        }

        /* Estilo para visualização no ecrã (não afeta impressão) */
        .documento-a4 {
          width: 210mm;
          height: 297mm;
          box-shadow: 0 0 40px rgba(0,0,0,0.1);
          margin-bottom: 20px;
        }
      `}} />
    </div>
  );
};

export default ReciboA4;