// Adiciona o Toast nos teus imports
import Toast from './components/Toast';

function App() {
  // Novo estado para notificações
  const [notificacao, setNotificacao] = useState(null);

  // Função mágica para disparar avisos
  const avisar = (msg, tipo = 'sucesso') => {
    setNotificacao({ msg, tipo });
  };

  // ... (restante do teu código igual)

  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        
        {/* Adiciona o Toast no final do retorno do componente */}
        {notificacao && (
          <Toast 
            mensagem={notificacao.msg} 
            tipo={notificacao.tipo} 
            aoFechar={() => setNotificacao(null)} 
          />
        )}

        {/* Passa a função 'avisar' para as rotas onde precisas dela */}
        <Routes>
           <Route path="/login" element={<Login aoLogar={fazerLogin} avisar={avisar} />} />
           {/* ... outras rotas */}
        </Routes>
      </div>
    </Router>
  );
}