import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { 
  Users, UserPlus, Trash2, Shield, 
  UserCircle, Mail, Phone, Loader2, X, AlertCircle
} from 'lucide-react';

const Equipa = ({ usuario, avisar }) => {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [salvando, setSalvando] = useState(false);

  // Estado para o novo funcionário
  const [novoMembro, setNovoMembro] = useState({
    nome: '',
    email: '',
    telemovel: '',
    role: 'caixa'
  });

  // 1. Carregar membros da mesma loja em tempo real
  useEffect(() => {
    if (!usuario?.lojaId) return;

    const q = query(
      collection(db, "usuarios"),
      where("lojaId", "==", usuario.lojaId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      // Filtramos para não mostrar o próprio dono na lista de gestão
      setMembros(lista.filter(m => m.uid !== usuario.uid));
      setCarregando(false);
    }, (error) => {
      console.error(error);
      avisar("ERRO AO CARREGAR EQUIPA", "erro");
    });

    return () => unsubscribe();
  }, [usuario, avisar]);

  // 2. Função para Adicionar Membro
  const adicionarMembro = async (e) => {
    e.preventDefault();
    setSalvando(true);

    try {
      const idGerado = `FUNC_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      const dadosFuncionario = {
        uid: idGerado,
        nome: novoMembro.nome,
        email: novoMembro.email.toLowerCase().trim(),
        telemovel: novoMembro.telemovel,
        role: novoMembro.role,
        lojaId: usuario.lojaId,
        nomeLoja: usuario.nomeLoja,
        adicionadoPor: usuario.nome,
        dataAcesso: new Date().toISOString()
      };

      await setDoc(doc(db, "usuarios", idGerado), dadosFuncionario);
      
      setMostrarModal(false);
      setNovoMembro({ nome: '', email: '', telemovel: '', role: 'caixa' });
      avisar("FUNCIONÁRIO AUTORIZADO!", "sucesso");

    } catch (error) {
      console.error(error);
      avisar("ERRO AO CRIAR ACESSO", "erro");
    } finally {
      setSalvando(false);
    }
  };

  // 3. Função para Remover Membro
  const removerMembro = async (id, nome) => {
    // Usamos um confirm simples por enquanto, mas integrado com o avisar pós-acção
    if (window.confirm(`Tens a certeza que desejas revogar o acesso de ${nome}?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        avisar("ACESSO REVOGADO COM SUCESSO", "sucesso");
      } catch (error) {
        avisar("ERRO AO REMOVER MEMBRO", "erro");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Gestão de Equipa</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
            Loja: <span className="text-blue-600">{usuario.nomeLoja}</span>
          </p>
        </div>
        
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
        >
          <UserPlus size={20} className="group-hover:rotate-12 transition-transform" /> 
          <span className="uppercase tracking-widest text-xs">Adicionar Funcionário</span>
        </button>
      </div>

      {/* LISTA DE MEMBROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carregando ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Sincronizando Colaboradores...</p>
          </div>
        ) : membros.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
               <Users size={32} />
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Ainda não tens funcionários registados</p>
          </div>
        ) : (
          membros.map(membro => (
            <div key={membro.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest shadow-sm ${
                  membro.role === 'admin' 
                  ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' 
                  : 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                }`}>
                  {membro.role}
                </span>
              </div>

              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                <UserCircle size={32} />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 uppercase text-lg italic tracking-tight">{membro.nome}</h3>
                <div className="flex flex-col gap-1 pt-2">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Mail size={12} className="shrink-0" />
                    <span className="text-xs font-bold truncate">{membro.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-400">
                    <Phone size={12} className="shrink-0" />
                    <span className="text-xs font-bold">{membro.telemovel || 'Sem telefone'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50">
                <button 
                  onClick={() => removerMembro(membro.id, membro.nome)}
                  className="w-full py-4 rounded-2xl bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                >
                  <Trash2 size={14} /> Revogar Acesso
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL ADICIONAR */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-10 pb-6 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Novo Acesso</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Autorizar Colaborador</p>
              </div>
              <button onClick={() => setMostrarModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"><X size={20}/></button>
            </div>

            <form onSubmit={adicionarMembro} className="p-10 pt-0 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Nome do Colaborador</label>
                <input 
                  required 
                  placeholder="Ex: João Silva"
                  className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all" 
                  value={novoMembro.nome} 
                  onChange={e => setNovoMembro({...novoMembro, nome: e.target.value})} 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">E-mail de Login</label>
                <input 
                  required 
                  type="email" 
                  placeholder="email@empresa.com"
                  className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all" 
                  value={novoMembro.email} 
                  onChange={e => setNovoMembro({...novoMembro, email: e.target.value})} 
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Cargo</label>
                  <select 
                    className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all cursor-pointer"
                    value={novoMembro.role} 
                    onChange={e => setNovoMembro({...novoMembro, role: e.target.value})}
                  >
                    <option value="caixa">Caixa</option>
                    <option value="admin">Gestor (Admin)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4 tracking-widest">Contacto</label>
                  <input 
                    placeholder="84..."
                    className="w-full bg-slate-50 p-5 rounded-2xl outline-none border-2 border-transparent focus:border-blue-500 focus:bg-white font-bold transition-all" 
                    value={novoMembro.telemovel} 
                    onChange={e => setNovoMembro({...novoMembro, telemovel: e.target.value})} 
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-2xl flex gap-3 items-start border border-blue-100 mt-2">
                <AlertCircle className="text-blue-500 shrink-0" size={18} />
                <p className="text-[10px] font-bold text-blue-700 leading-relaxed uppercase">
                  O funcionário poderá entrar imediatamente usando o e-mail via "Link Mágico".
                </p>
              </div>

              <button 
                disabled={salvando} 
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black mt-4 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-blue-100 disabled:opacity-50"
              >
                {salvando ? <Loader2 className="animate-spin" /> : <><UserPlus size={18}/> CONFIRMAR ACESSO</>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipa;