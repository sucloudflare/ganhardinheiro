// middleware.js
import { NextResponse } from 'next/server';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente do arquivo .env
dotenv.config();

export const config = { matcher: '/welcome' };

export async function middleware() {
  // Acessar a variável de ambiente
  const token = process.env.GANHARDINHEIRO_TOKEN;

  // Retornar uma resposta JSON com o token
  return NextResponse.json({ message: 'Middleware executado com sucesso', token });
}
