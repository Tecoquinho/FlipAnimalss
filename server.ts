import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { setupAnchorServer, getPotAddress } from './server/anchor';
import * as anchor from '@coral-xyz/anchor';

const PORT = 3000;

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Solana Connection (Devnet)
  let program: any;
  let adminKeypair: any;
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'processed');
    const anchorSetup = setupAnchorServer(connection);
    program = anchorSetup.program;
    adminKeypair = anchorSetup.adminKeypair;
    console.log('Anchor setup successful');
  } catch (err) {
    console.error('Anchor setup failed:', err);
  }

  app.use(cors());
  app.use(express.json());

  // Shared State
  interface Bet {
    id: string;
    user: string;
    amount: number;
    bichoId: number;
    emoji: string;
    timestamp: string;
  }

  interface Room {
    pot: number;
    players: Bet[];
    winners: any[];
    lastDraw: number;
  }

  const rooms: Record<string, Room> = {
    small: { pot: 0, players: [], winners: [], lastDraw: Date.now() },
    medium: { pot: 0, players: [], winners: [], lastDraw: Date.now() },
    large: { pot: 0, players: [], winners: [], lastDraw: Date.now() }
  };

  const BICHOS_EMOJIS = [
    '🦤', '🦅', '🫏', '🦋', '🐕', '🐐', '🐏', '🐪', '🐍', '🐇', 
    '🐎', '🐘', '🐓', '🐈', '🐊', '🦁', '🐒', '🐖', '🦚', '🦃', 
    '🐂', '🐅', '🐻', '🦌', '🐄'
  ];

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Send initial state
    socket.emit('init', { rooms });

    socket.on('place_bet', (data) => {
      const { roomId, user, amount, bichoId } = data;
      if (rooms[roomId]) {
        const newBet: Bet = {
          id: Math.random().toString(36).substr(2, 9),
          user,
          amount,
          bichoId,
          emoji: BICHOS_EMOJIS[bichoId - 1],
          timestamp: new Date().toISOString()
        };
        rooms[roomId].pot += parseFloat(amount);
        rooms[roomId].players.push(newBet);
        
        // Broadcast to everyone
        io.emit('new_bet', { roomId, bet: newBet, pot: rooms[roomId].pot });

        // Auto-draw when 5 players join (Mainnet logic simulation)
        if (rooms[roomId].players.length >= 5) {
          triggerDraw(roomId);
        }
      }
    });

    socket.on('request_draw', (roomId) => {
      if (rooms[roomId] && rooms[roomId].players.length > 0) {
        triggerDraw(roomId);
      }
    });

    async function triggerDraw(roomId: string) {
      const room = rooms[roomId];
      if (!room || room.players.length === 0) return;

      // "Someone always wins" logic:
      const votedAnimalIds = [...new Set(room.players.map(p => p.bichoId))];
      const winnerBichoId = votedAnimalIds[Math.floor(Math.random() * votedAnimalIds.length)];
      
      const winner = {
        id: winnerBichoId,
        emoji: BICHOS_EMOJIS[winnerBichoId - 1]
      };
      
      io.emit('draw_started', { roomId });

      try {
        // Real on-chain resolution
        const potAddress = getPotAddress(roomId);
        
        // For simplicity in this demo, we use the first winner's account
        // In a real app, you'd iterate or use a more complex distribution
        const firstWinnerBet = room.players.find(p => p.bichoId === winnerBichoId);
        const winnerAccount = firstWinnerBet ? new PublicKey(firstWinnerBet.user) : adminKeypair.publicKey;

        const tx = await program.methods
          .resolvePot(winnerBichoId)
          .accounts({
            pot: potAddress,
            admin: adminKeypair.publicKey,
            winnerAccount: winnerAccount,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();

        console.log(`On-chain Draw Result for ${roomId}: ${tx}`);
        
        setTimeout(() => {
          const houseFee = room.pot * 0.04;
          const netPrize = room.pot - houseFee;
          
          const result = {
            roomId,
            winner,
            pot: room.pot,
            netPrize: netPrize.toFixed(4),
            houseFee: houseFee.toFixed(4),
            timestamp: new Date().toISOString(),
            txSignature: tx
          };
          room.winners.push(result);
          room.pot = 0;
          room.players = [];
          
          io.emit('draw_result', result);
        }, 3000);
      } catch (error) {
        console.error('On-chain Draw Error:', error);
        io.emit('draw_error', { roomId, error: 'Blockchain error during draw' });
      }
    }

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
