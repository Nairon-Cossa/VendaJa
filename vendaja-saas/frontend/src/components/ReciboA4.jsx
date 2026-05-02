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
    }, 1000); // Aumentado ligeiramente para garantir renderização de fontes
    return () => clearTimeout(timer);
  }, []);

  if (!venda) return null;

  const DocumentoPagina = ({ tipo }) => (
    <div className="documento-a4 flex flex-col bg-white border-b border-slate-200 last:border-0 print:border-0 mx-auto overflow-hidden shadow-2xl print:shadow-none">
      
      {/* HEADER CORPORATIVO */}
      <div className="p-12 pb-8 flex justify-between items-start border-b-2 border-slate-900">
        <div className="flex gap-6 items-center">
          {configLoja.logoUrl || configLoja.logo ? (
            <img 
              src={configLoja.logoUrl || configLoja.logo} 
              alt="Logo" 
              className="h-20 w-20 object-contain grayscale" 
            />
          ) : (
            <div className="h-16 w-16 bg-slate-100 flex items-center justify-center text-slate-400 rounded">
               <Building2 size={32} />
            </div>
          )}
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900 leading-none">
              {configLoja.nomeEmpresa || configLoja.nome || "EMPRESA NÃO CONFIGURADA"}
            </h1>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-0.5">
              <p className="text-slate-800 font-black">NUIT: {configLoja.nuit || "--- --- ---"}</p>
              <p className="flex items-center gap-1.5"><Globe size={10}/> {configLoja.endereco || "Endereço Indisponível"}</p>
              <p className="flex items-center gap-1.5"><Phone size={10}/> {configLoja.telefone || "Contacto Indisponível"}</p>
            </div>
          </div>
        </div>

        <div className="text-right">
          <div className="inline-block border-2 border-slate-900 px-4 py-2 mb-4">
            <h2 className="text-xl font-black uppercase tracking-widest leading-none">
                {venda.tipoDocumento || "Factura"}
            </h2>
            <p className="text-[9px] font-black opacity-60 uppercase tracking-[0.2em] mt-1 text-center border-t border-slate-200 pt-1">{tipo}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nº Documento</p>
            <p className="text-lg font-black text-slate-900 tabular-nums"># {venda.id?.slice(-8).toUpperCase()}</p>
            <div className="pt-1">
              <p className="text-[10px] font-bold text-slate-400 uppercase">Data de Emissão</p>
              <p className="font-black text-slate-700 text-xs">
                {new Date(venda.timestamp?.seconds * 1000 || Date.now()).toLocaleDateString('pt-MZ', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-12 pt-8 flex-grow">
        {/* CLIENTE E INFOS */}
        <div className="grid grid-cols-12 gap-8 mb-10">
          <div className="col-span-7 border-l-4 border-slate-900 pl-6 py-1">
             <h3 className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-widest">Facturar a:</h3>
             <p className="text-lg font-black text-slate-900 uppercase leading-none mb-1">
                {venda.clienteNome || "Consumidor Final"}
             </p>
             <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                NUIT: {venda.clienteNuit || "--- --- ---"}
             </p>
             {venda.clienteEndereco && (
                <p className="text-[9px] font-medium text-slate-400 uppercase mt-1 italic">{venda.clienteEndereco}</p>
             )}
          </div>
          <div className="col-span-5 grid grid-cols-2 gap-4 border border-slate-100 p-4 rounded-lg bg-slate-50/50">
             <div>
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Moeda</p>
                <p className="text-sm font-black text-slate-900">{moeda}</p>
             </div>
             <div>
                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Pagamento</p>
                <p className="text-sm font-black text-slate-900 uppercase italic text-[10px]">{venda.metodo || "Numerário"}</p>
             </div>
          </div>
        </div>

        {/* TABELA DE ITENS */}
        <div className="mb-10">
          <table className="w-full">
            <thead>
              <tr className="border-b-2 border-slate-900 text-[10px] font-black uppercase tracking-wider text-slate-900">
                <th className="py-3 px-2 text-left">Descrição</th>
                <th className="py-3 px-2 text-center w-20">Qtd</th>
                <th className="py-3 px-2 text-right w-32">P. Unitário</th>
                <th className="py-3 px-2 text-right w-32">Total Item</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {venda.itens.map((item, idx) => (
                <tr key={idx} className="text-[11px] font-bold text-slate-700">
                  <td className="py-4 px-2 uppercase text-slate-900 font-black">{item.nome}</td>
                  <td className="py-4 px-2 text-center tabular-nums">{item.qtd}</td>
                  <td className="py-4 px-2 text-right tabular-nums">{Number(item.preco).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</td>
                  <td className="py-4 px-2 text-right font-black text-slate-900 tabular-nums">
                      { (item.qtd * item.preco).toLocaleString('pt-MZ', { minimumFractionDigits: 2 }) }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* RESUMO */}
        <div className="flex justify-end pt-4">
          <div className="w-full max-w-[280px] space-y-2">
            <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase px-2">
              <span>Subtotal</span>
              <span className="tabular-nums">{Number(venda.subtotal || venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
            </div>
            {venda.imposto > 0 && (
                <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase px-2">
                <span>IVA (16%)</span>
                <span className="tabular-nums">{Number(venda.imposto).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
              </div>
            )}
            <div className="bg-slate-900 text-white p-4 rounded-sm flex justify-between items-center mt-4">
              <span className="text-[11px] font-black uppercase tracking-widest">Total Geral</span>
              <div className="text-right leading-none">
                <span className="text-xl font-black tabular-nums">{Number(venda.total).toLocaleString('pt-MZ', { minimumFractionDigits: 2 })}</span>
                <span className="ml-1 text-[10px] font-bold opacity-70 uppercase">{moeda}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ */}
      <div className="p-12 pt-0 mt-auto">
        <div className="grid grid-cols-2 gap-16 text-center mb-12">
          <div>
            <div className="h-[1px] bg-slate-300 w-full mb-2"></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Assinatura e Carimbo (Autorizada)</p>
          </div>
          <div>
            <div className="h-[1px] bg-slate-300 w-full mb-2"></div>
            <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Conformidade do Cliente</p>
          </div>
        </div>

        <div className="flex justify-between items-end pt-6 border-t border-slate-100 opacity-40">
          <div className="space-y-1">
             <p className="text-[8px] font-black uppercase tracking-[0.3em] text-slate-900">
               {configLoja.mensagemRecibo || "Obrigado por escolher os nossos serviços!"}
             </p>
             <p className="text-[7px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-1">
               <ShieldCheck size={8}/> Software Certificado • VendaJá PRO V1.0
             </p>
          </div>
          <p className="text-[8px] font-black uppercase tracking-widest text-slate-900">Página 1 / 1</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-900/40 backdrop-blur-sm overflow-y-auto print:bg-white print:static print:overflow-visible">
      
      {/* BOTÕES DE AÇÃO - ESCONDIDOS NA IMPRESSÃO */}
      <div className="sticky top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex justify-center gap-4 print:hidden z-[10001]">
        <button 
          onClick={() => window.print()}
          className="bg-slate-900 text-white px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-slate-800 transition-all"
        >
          <Printer size={16}/> Re-imprimir
        </button>
        <button 
          onClick={fechar}
          className="bg-white text-slate-900 border border-slate-200 px-8 py-3 rounded-full font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all"
        >
          Sair
        </button>
      </div>

      {/* ÁREA DE IMPRESSÃO - Esta classe "print-container" é a chave */}
      <div className="print-container my-10 print:m-0 flex flex-col items-center gap-8">
        <DocumentoPagina tipo="Original" />
        
        <div className="w-full max-w-[210mm] border-t-2 border-dashed border-slate-300 my-4 print:hidden relative">
            <span className="absolute left-1/2 -top-3 -translate-x-1/2 bg-slate-200 text-slate-500 px-4 py-1 rounded-full text-[8px] font-black uppercase text-center">Corte de Duplicado</span>
        </div>

        <DocumentoPagina tipo="Duplicado (Contabilidade)" />
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;900&display=swap');
        
        @media print {
          /* ESCONDE TUDO NO BODY */
          body * {
            visibility: hidden;
          }
          
          /* MOSTRA APENAS O CONTAINER DO RECIBO */
          .print-container, .print-container * {
            visibility: visible;
          }
          
          /* POSICIONA O RECIBO NO TOPO DA PÁGINA DE IMPRESSÃO */
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 210mm;
            margin: 0 !important;
            padding: 0 !important;
          }

          .documento-a4 {
            width: 210mm !important;
            height: 296mm !important; /* Ligeiramente menor que 297 para evitar páginas em branco extras */
            page-break-after: always !important;
            border: none !important;
            box-shadow: none !important;
          }

          @page { 
            size: A4; 
            margin: 0mm; 
          }
        }

        .documento-a4 {
          width: 210mm;
          height: 297mm;
          font-family: 'Inter', sans-serif;
        }
      `}} />
    </div>
  );
};

export default ReciboA4;