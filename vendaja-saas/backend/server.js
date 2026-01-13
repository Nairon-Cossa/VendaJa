const express = require('express');
const cors = require('cors');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(cors());
app.use(express.json());

let db;

// Ligar à Base de Dados e criar as tabelas
(async () => {
    db = await open({
        filename: './vendaja.db',
        driver: sqlite3.Database
    });

    // Criar Tabela de Produtos (se não existir)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS produtos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT,
            preco REAL,
            categoria TEXT
        )
    `);

    console.log("Base de Dados Moçambicana Pronta! 🇲🇿");
})();

// ROTA 1: Ver todos os produtos
app.get('/produtos', async (req, res) => {
    const produtos = await db.all('SELECT * FROM produtos');
    res.json(produtos);
});

// ROTA 2: Adicionar um novo produto
app.post('/produtos', async (req, res) => {
    const { nome, preco, categoria } = req.body;
    await db.run(
        'INSERT INTO produtos (nome, preco, categoria) VALUES (?, ?, ?)',
        [nome, preco, categoria]
    );
    res.json({ message: "Produto guardado com sucesso!" });
});

app.listen(5000, () => console.log("Servidor rodando na porta 5000"));