const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs');  // Módulo para manipular o sistema de arquivos

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + '/public'));

// Rota principal para servir o index.html
app.get('*', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('Novo usuário conectado');

  // Receber os dados do formulário e salvar em um arquivo txt
  socket.on('formData', (data) => {
    const { name, email, phone, password } = data;
    const userData = `Nome: ${name}\nEmail: ${email}\nTelefone: ${phone}\nSenha: ${password}\n\n`;

    // Escrever os dados no arquivo "usuarios.txt"
    fs.appendFile('usuarios.txt', userData, (err) => {
      if (err) {
        console.error('Erro ao salvar os dados:', err);
      } else {
        console.log('Dados salvos com sucesso!');
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
