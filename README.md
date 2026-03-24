# FlipAnimals - Solana Betting Game

Este é um jogo de apostas na rede Solana (Devnet) onde os jogadores apostam em animais e o servidor (oráculo) resolve o sorteio on-chain.

## Como Rodar Localmente

### 1. Exportar o Projeto
No AI Studio, vá no menu de **Settings** (ícone de engrenagem) e selecione **Export to ZIP** ou **Export to GitHub**.

### 2. Pré-requisitos
- **Node.js** (v18 ou superior)
- **npm** ou **yarn**
- Uma carteira Solana (ex: Phantom) configurada para a **Devnet**.

### 3. Instalação
Abra o terminal na pasta do projeto e rode:
```bash
npm install
```

### 4. Configuração de Variáveis de Ambiente
Crie um arquivo chamado `.env` na raiz do projeto e adicione sua chave privada do administrador (o "oráculo" do jogo):
```env
ADMIN_SECRET_KEY=[123,45,67,89...] # Formato de array JSON (gerado por solana-keygen)
```
*Nota: Se você não fornecer uma chave, o servidor gerará uma aleatória para demonstração, mas ela não terá fundos para pagar as transações on-chain.*

### 5. Rodar o Servidor de Desenvolvimento
```bash
npm run dev
```
O app estará disponível em `http://localhost:3000`.

## Estrutura do Projeto
- `server.ts`: Servidor Express + Socket.IO + Integração Solana.
- `server/anchor.ts`: Lógica de conexão com o programa Anchor na Solana.
- `src/App.tsx`: Interface do usuário (React + Tailwind).
- `src/lib/idl.json`: O IDL do programa Solana (define as instruções on-chain).

## Notas sobre Solana
- O jogo está configurado para a **Devnet**.
- Certifique-se de que sua carteira de administrador tenha **Devnet SOL** (use `solana airdrop 2` no terminal se precisar).
- O IDL atual aponta para um programa de exemplo. Para produção, você deve fazer o deploy do seu próprio programa Rust e atualizar o `PROGRAM_ID` em `server/anchor.ts`.
