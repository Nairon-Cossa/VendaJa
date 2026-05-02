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
    <div className="documento-a4 flex flex-col bg-white mx-auto shadow-2xl print:shadow-none">
      
      {/* HEADER */}
      <div className="p-10 pb-6 flex justify-between items-start border-b-2 border-slate-900">
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

          <div>
            <h1 className="text-xl font-black uppercase">
              {configLoja.nomeEmpresa || configLoja.nome || "EMPRESA"}
            </h1>
            <p className="text-xs font-bold">NUIT: {configLoja.nuit || "---"}</p>
            <p className="text-[10px] flex items-center gap-1"><Globe size={10}/> {configLoja.endereco}</p>
            <p className="text-[10px] flex items-center gap-1"><Phone size={10}/> {configLoja.telefone}</p>
          </div>
        </div>

        <div className="text-right">
          <h2 className="font-black text-lg uppercase">{venda.tipoDocumento || "Factura"}</h2>
          <p className="text-[10px] font-bold">{tipo}</p>
          <p className="text-sm font-black">#{venda.id?.slice(-8)}</p>
        </div>
      </div>

      {/* BODY */}
      <div className="p-10 flex-grow">

        {/* CLIENTE */}
        <div className="mb-6">
          <p className="text-xs font-bold">Cliente:</p>
          <p className="font-black">{venda.clienteNome || "Consumidor Final"}</p>
        </div>

        {/* TABELA */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b">
              <th className="text-left">Descrição</th>
              <th>Qtd</th>
              <th className="text-right">Preço</th>
              <th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {venda.itens.map((item, i) => (
              <tr key={i}>
                <td>{item.nome}</td>
                <td className="text-center">{item.qtd}</td>
                <td className="text-right">{item.preco.toFixed(2)}</td>
                <td className="text-right">{(item.qtd * item.preco).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTAL */}
        <div className="text-right">
          <p className="text-sm">Total:</p>
          <p className="text-xl font-black">{venda.total.toFixed(2)} {moeda}</p>
        </div>
      </div>

      {/* FOOTER */}
      <div className="p-10 pt-0 text-xs">
        <p>{configLoja.mensagemRecibo || "Obrigado pela preferência!"}</p>
        <p className="flex items-center gap-1">
          <ShieldCheck size={10}/> Sistema Certificado
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-slate-100 overflow-y-auto print:bg-white print:static">

      {/* BOTÕES */}
      <div className="print:hidden p-4 flex justify-center gap-4">
        <button onClick={() => window.print()} className="bg-black text-white px-4 py-2">
          <Printer size={16}/> Imprimir
        </button>
        <button onClick={fechar} className="border px-4 py-2">
          Sair
        </button>
      </div>

      {/* PRINT AREA */}
      <div className="print-container flex flex-col items-center gap-6">
        <DocumentoPagina tipo="Original" />
        <DocumentoPagina tipo="Duplicado" />
      </div>

      <style>{`
        @media print {
          html, body {
            margin: 0;
            padding: 0;
            background: white;
          }

          .print-container {
            width: 100%;
          }

          .documento-a4 {
            width: 210mm;
            min-height: 297mm;
            page-break-after: always;
            break-after: page;
            overflow: visible;
          }

          .documento-a4:last-child {
            page-break-after: auto;
          }

          @page {
            size: A4;
            margin: 10mm;
          }
        }

        .documento-a4 {
          width: 210mm;
          min-height: 297mm;
          font-family: Arial, sans-serif;
        }
      `}</style>
    </div>
  );
};

export default ReciboA4;