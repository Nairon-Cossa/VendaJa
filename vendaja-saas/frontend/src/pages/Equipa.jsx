import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { 
  Users, UserPlus, Trash2, Copy,
  UserCircle, Loader2, X, Lock
} from 'lucide-react';

const Equipa = ({ usuario, avisar }) => {
  const [membros, setMembros] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [salvando, setSalvando] = useState(false);

  const [novoMembro, setNovoMembro] = useState({
    nome: '',
    email: '',
    telemovel: '',
    password: '', 
    role: 'caixa'
  });

  // Função utilitária para evitar o erro "e is not a function"
  const safeAvisar = useCallback((msg, tipo) => {
    if (typeof avisar === 'function') {
      avisar(msg, tipo);
    } else {
      console.warn(`[Aviso]: ${msg} (${tipo})`);
    }
  }, [avisar]);

  // 1. Carregar membros ligados a esta empresa/loja
  useEffect(() => {
    const idMestre = usuario?.empresaId || usuario?.uid;
    
    if (!idMestre) {
      setCarregando(false);
      return;
    }

    // A Query deve usar o campo que as suas regras protegem (empresaId)
    const q = query(
      collection(db, "usuarios"),
      where("empresaId", "==", idMestre)
    );

    // Usando a sintaxe de objeto no onSnapshot para evitar erros de callback
    const unsubscribe = onSnapshot(q, {
      next: (snapshot) => {
        const lista = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Filtra para não mostrar o próprio usuário logado
        setMembros(lista.filter(m => m.email !== usuario.email));
        setCarregando(false);
      },
      error: (error) => {
        console.error("Erro Firestore Equipa:", error);
        setCarregando(false);
        if (error.code === 'permission-denied') {
          safeAvisar("SEM PERMISSÃO PARA VER A EQUIPA", "erro");
        }
      }
    });

    return () => unsubscribe();
  }, [usuario, safeAvisar]);

  const copiarSenha = (senha) => {
    navigator.clipboard.writeText(senha);
    safeAvisar("SENHA COPIADA!", "sucesso");
  };

  // 2. Função para Adicionar Membro
  const adicionarMembro = async (e) => {
    e.preventDefault();
    if (salvando) return;
    setSalvando(true);

    try {
      const idMestre = usuario?.empresaId || usuario?.uid;
      const emailId = novoMembro.email.toLowerCase().trim();

      // Verificar existência
      const docExistente = await getDoc(doc(db, "usuarios", emailId));
      if (docExistente.exists()) {
        safeAvisar("ESTE E-MAIL JÁ ESTÁ EM USO.", "erro");
        setSalvando(false);
        return;
      }

      // Validar limite de usuários no plano
      const donoRef = doc(db, "usuarios", idMestre);
      const donoSnap = await getDoc(donoRef);
      const limite = donoSnap.data()?.maxUsers || 1;

      if (membros.length >= limite) {
        safeAvisar(`LIMITE ATINGIDO: Máximo ${limite} funcionários.`, "erro");
        setSalvando(false);
        return;
      }

      const idFunc = `FUNC_${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      
      const dadosFuncionario = {
        uid: idFunc, 
        nome: novoMembro.nome.trim(),
        email: emailId,
        telemovel: novoMembro.telemovel || '',
        password: novoMembro.password || idFunc,
        role: novoMembro.role || 'caixa',
        empresaId: idMestre, 
        lojaId: idMestre,
        nomeLoja: usuario.nomeLoja || donoSnap.data()?.nomeLoja || 'Minha Loja',
        status: 'ativo',
        adicionadoPor: usuario.nome || 'Admin',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, "usuarios", emailId), dadosFuncionario);
      
      setMostrarModal(false);
      setNovoMembro({ nome: '', email: '', telemovel: '', password: '', role: 'caixa' });
      safeAvisar("ACESSO CRIADO COM SUCESSO!", "sucesso");

    } catch (error) {
      console.error("Erro ao criar membro:", error);
      safeAvisar("ERRO DE PERMISSÃO OU REDE", "erro");
    } finally {
      setSalvando(false);
    }
  };

  const removerMembro = async (id, nome) => {
    if (window.confirm(`Tens a certeza que queres revogar o acesso de ${nome}?`)) {
      try {
        await deleteDoc(doc(db, "usuarios", id));
        safeAvisar("ACESSO ELIMINADO", "sucesso");
      } catch (error) {
        safeAvisar("ERRO AO REMOVER", "erro");
      }
    }
  };

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Gestão de Equipa</h2>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
            Loja: <span className="text-blue-600">{usuario.nomeLoja || 'Unidade Local'}</span>
          </p>
        </div>
        
        <button 
          onClick={() => setMostrarModal(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-[2rem] font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200 active:scale-95 group"
        >
          <UserPlus size={20} /> 
          <span className="uppercase tracking-widest text-xs">Novo Funcionário</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carregando ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="animate-spin" size={32} />
            <p className="font-black text-[10px] uppercase tracking-[0.3em]">Sincronizando Equipa...</p>
          </div>
        ) : membros.length === 0 ? (
          <div className="col-span-full bg-white p-20 rounded-[3rem] text-center border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                <Users size={32} />
            </div>
            <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">Nenhum funcionário registado.</p>
          </div>
        ) : (
          membros.map(membro => (
            <div key={membro.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group relative">
              <div className="absolute top-6 right-6">
                <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest ${
                  membro.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                }`}>
                  {membro.role}
                </span>
              </div>

              <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mb-6">
                <UserCircle size={32} />
              </div>
              
              <div className="space-y-1">
                <h3 className="font-black text-slate-900 uppercase text-lg italic tracking-tight">{membro.nome}</h3>
                <p className="text-xs font-bold text-slate-400 truncate">{membro.email}</p>
                
                <div 
                  onClick={() => copiarSenha(membro.password)}
                  className="mt-4 flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 cursor-pointer hover:border-blue-400 transition-colors group/pwd"
                >
                  <div className="flex items-center gap-2">
                    <Lock size={12} className="text-slate-400" />
                    <span className="text-[10px] font-mono font-bold text-slate-600">Senha: {membro.password}</span>
                  </div>
                  <Copy size={12} className="text-slate-300 group-hover/pwd:text-blue-500" />
                </div>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-50">
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

      {mostrarModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl overflow-hidden">
            <div className="p-10 pb-6 flex justify-between items-center">
              <h2 className="text-2xl font-black text-slate-900 italic uppercase tracking-tighter">Novo Acesso</h2>
              <button onClick={() => setMostrarModal(false)} className="text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
            </div>

            <form onSubmit={adicionarMembro} className="p-10 pt-0 space-y-5">
              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Nome Completo</label>
                <input 
                  required 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all" 
                  value={novoMembro.nome} 
                  onChange={e => setNovoMembro({...novoMembro, nome: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">E-mail de Login</label>
                <input 
                  required 
                  type="email" 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all" 
                  value={novoMembro.email} 
                  onChange={e => setNovoMembro({...novoMembro, email: e.target.value})} 
                />
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Senha de Acesso</label>
                <div className="relative">
                  <input 
                    required 
                    className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none focus:bg-white border-2 border-transparent focus:border-blue-500 transition-all pr-12" 
                    value={novoMembro.password} 
                    onChange={e => setNovoMembro({...novoMembro, password: e.target.value})} 
                  />
                  <Lock className="absolute right-5 top-5 text-slate-300" size={20} />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-black uppercase text-slate-400 ml-4 mb-1 block">Nível de Permissão</label>
                <select 
                  className="w-full bg-slate-50 p-5 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-blue-500"
                  value={novoMembro.role} 
                  onChange={e => setNovoMembro({...novoMembro, role: e.target.value})}
                >
                  <option value="caixa">CAIXA (Apenas Vendas)</option>
                  <option value="admin">GESTOR (Acesso Total)</option>
                </select>
              </div>

              <button 
                type="submit"
                disabled={salvando} 
                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black mt-4 flex items-center justify-center gap-3 hover:bg-blue-600 transition-all disabled:opacity-50 shadow-lg shadow-slate-200"
              >
                {salvando ? <Loader2 className="animate-spin" size={18} /> : "CONFIRMAR CREDENCIAIS"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Equipa;