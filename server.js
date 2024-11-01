// server.js
import express from 'express';
import http from 'http';
import { Server as SocketIoServer } from 'socket.io';
import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Criar ou abrir o banco de dados
const db = new sqlite3.Database('usuarios.db', (err) => {
  if (err) {
    console.error('Erro ao abrir o banco de dados:', err.message);
  } else {
    console.log('Conectado ao banco de dados SQLite.');

    // Criar a tabela se não existir
    db.run(`CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT,
      email TEXT UNIQUE,
      telefone TEXT,
      senha TEXT
    )`, (err) => {
      if (err) {
        console.error('Erro ao criar a tabela:', err.message);
      }
    });
  }
});

// Criar o servidor HTTP e o servidor Socket.IO
const server = http.createServer(app);
const io = new SocketIoServer(server);

// Middleware para retornar a variável de ambiente
app.get('/welcome', (req, res) => {
  res.json({
    message: 'Bem-vindo ao servidor!',
    token: process.env.GANHARDINHEIRO_TOKEN,
  });
});

// Rota principal
app.get('/', (req, res) => {
  res.send('Servidor em execução! Acesse /welcome para ver o token.');
});

// Função para inserir dados no banco de dados
const saveUser = (data, socket) => {
  const { name, email, phone, password } = data;

  // Validação básica
  if (!name || !email || !phone || !password) {
    socket.emit('formResponse', { success: false, message: 'Todos os campos são obrigatórios.' });
    return;
  }

  // Criptografar a senha
  bcrypt.hash(password, 10, (err, hash) => {
    if (err) {
      console.error('Erro ao criptografar a senha:', err.message);
      socket.emit('formResponse', { success: false, message: 'Erro ao criptografar a senha.' });
      return;
    }

    // Inserir os dados no banco de dados
    db.run(`INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)`, 
      [name, email, phone, hash], 
      function(err) {
        if (err) {
          console.error('Erro ao salvar os dados:', err.message);
          socket.emit('formResponse', { success: false, message: 'Erro ao salvar os dados.' });
        } else {
          console.log('Dados salvos com sucesso!', this.lastID); // Exibe o ID do registro inserido
          socket.emit('formResponse', { success: true, message: 'Dados salvos com sucesso!' });

          // Verifique os dados inseridos
          db.all(`SELECT * FROM usuarios`, [], (err, rows) => {
            if (err) {
              console.error('Erro ao consultar os dados:', err.message);
            } else {
              console.log('Dados atuais na tabela usuarios:', rows); // Log dos dados atuais
            }
          });
        }
      });
  });
};

// Gerenciar conexões de socket
io.on('connection', (socket) => {
  console.log('Novo usuário conectado');

  // Receber os dados do formulário e salvar no banco de dados
  socket.on('formData', (data) => {
    saveUser(data, socket);
  });

  socket.on('disconnect', () => {
    console.log('Usuário desconectado');
  });
});

// Servir arquivos estáticos
app.use(express.static('public'));

// Inicializar o servidor na porta definida
server.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
