const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const sqlite3 = require('sqlite3').verbose(); // Importando sqlite3

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

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
      email TEXT,
      telefone TEXT,
      senha TEXT
    )`);
  }
});

app.use(express.static(__dirname + '/public'));

// Rota principal para servir o index.html
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('Novo usuário conectado');

  // Receber os dados do formulário e salvar no banco de dados
  socket.on('formData', (data) => {
    const { name, email, phone, password } = data;

    // Validação básica
    if (!name || !email || !phone || !password) {
      socket.emit('formResponse', { success: false, message: 'Todos os campos são obrigatórios.' });
      return;
    }

    // Inserir os dados no banco de dados
    db.run(`INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)`, 
      [name, email, phone, password], 
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

  socket.on('disconnect', () => {
    console.log('Usuário desconectado');
  });
});

// Inicializar o servidor na porta 3000
server.listen(3000, () => {
  console.log('Servidor rodando em http://localhost:3000');
});
