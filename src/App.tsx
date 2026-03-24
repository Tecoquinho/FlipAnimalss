import { useState, useEffect, useRef } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { 
  PublicKey, 
  SystemProgram, 
  Transaction, 
  LAMPORTS_PER_SOL 
} from '@solana/web3.js';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trophy, 
  Zap, 
  History, 
  AlertCircle,
  CheckCircle2,
  Loader2,
  MousePointer2,
  Wallet,
  Activity,
  TrendingUp,
  ShieldCheck,
  Users,
  Info,
  Globe
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';
import { useFlipAnimals } from './lib/useFlipAnimals';

// ENDEREÇO DA TESOURARIA
const TREASURY_WALLET = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

type Language = 'en-US' | 'pt-BR' | 'pt-PT';

const TRANSLATIONS = {
  'en-US': {
    totalWon: 'Total Won',
    online: 'Online',
    provablyFair: 'PROVABLY FAIR',
    liveActivity: 'Live Activity',
    betOn: 'Bet on',
    currentPot: 'Current Pot Value',
    players: 'Players',
    chance: 'Chance',
    selectPool: 'Select Your Pool',
    winUpTo: 'WIN UP TO 25X',
    betAmount: 'Bet Amount',
    placeBet: 'Place Bet',
    rollPot: 'Roll Pot',
    testDraw: 'Test Draw',
    recentWinners: 'Recent Winners',
    justNow: 'Just now',
    rolling: 'Rolling the Pot',
    waitingBlockchain: 'Waiting for Blockchain Confirmation',
    winner: 'WINNER',
    resetPot: 'Reset Pot',
    connectWalletFirst: 'Connect your wallet first!',
    selectAnimalFirst: 'Select an animal first!',
    betRangeError: 'Bet must be between {min} and {max} SOL for this room!',
    processingBet: 'Processing bet...',
    betConfirmed: 'Bet of {amount} SOL on {animal} confirmed!',
    transactionError: 'Transaction error: ',
    victory: 'VICTORY! The {animal} was drawn!',
    drawnResult: 'The drawn animal was {animal}.',
    dismiss: 'Dismiss',
    footerText: '© 2026 FLIPANIMALS - THE #1 ON-CHAIN BETTING PLATFORM',
    terms: 'Terms',
    privacy: 'Privacy',
    animals: [
      'Ostrich', 'Eagle', 'Donkey', 'Butterfly', 'Dog', 'Goat', 'Ram', 'Camel', 'Snake', 'Rabbit', 
      'Horse', 'Elephant', 'Rooster', 'Cat', 'Alligator', 'Lion', 'Monkey', 'Pig', 'Peacock', 'Turkey', 
      'Bull', 'Tiger', 'Bear', 'Deer', 'Cow'
    ]
  },
  'pt-BR': {
    totalWon: 'Total Ganho',
    online: 'Online',
    provablyFair: 'PROVAVELMENTE JUSTO',
    liveActivity: 'Atividade ao Vivo',
    betOn: 'Apostou no',
    currentPot: 'Valor Atual do Pote',
    players: 'Jogadores',
    chance: 'Chance',
    selectPool: 'Selecione seu Bicho',
    winUpTo: 'GANHE ATÉ 25X',
    betAmount: 'Valor da Aposta',
    placeBet: 'Apostar',
    rollPot: 'Sortear Pote',
    testDraw: 'Sorteio Teste',
    recentWinners: 'Vencedores Recentes',
    justNow: 'Agora mesmo',
    rolling: 'Sorteando o Pote',
    waitingBlockchain: 'Aguardando Confirmação da Blockchain',
    winner: 'VENCEDOR',
    resetPot: 'Reiniciar Pote',
    connectWalletFirst: 'Conecte sua carteira primeiro!',
    selectAnimalFirst: 'Selecione um bicho primeiro!',
    betRangeError: 'A aposta deve estar entre {min} e {max} SOL para esta sala!',
    processingBet: 'Processando aposta...',
    betConfirmed: 'Aposta de {amount} SOL no {animal} confirmada!',
    transactionError: 'Erro na transação: ',
    victory: 'VITÓRIA! O {animal} foi sorteado!',
    drawnResult: 'O bicho sorteado foi o {animal}.',
    dismiss: 'Fechar',
    footerText: '© 2026 FLIPANIMALS - A PLATAFORMA #1 DE APOSTAS ON-CHAIN',
    terms: 'Termos',
    privacy: 'Privacidade',
    animals: [
      'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cachorro', 'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho', 
      'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré', 'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru', 
      'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
    ]
  },
  'pt-PT': {
    totalWon: 'Total Ganho',
    online: 'Online',
    provablyFair: 'PROVAVELMENTE JUSTO',
    liveActivity: 'Atividade em Direto',
    betOn: 'Apostou no',
    currentPot: 'Valor Atual do Pote',
    players: 'Jogadores',
    chance: 'Probabilidade',
    selectPool: 'Selecione o seu Animal',
    winUpTo: 'GANHE ATÉ 25X',
    betAmount: 'Valor da Aposta',
    placeBet: 'Apostar',
    rollPot: 'Sortear Pote',
    testDraw: 'Sorteio de Teste',
    recentWinners: 'Vencedores Recentes',
    justNow: 'Agora mesmo',
    rolling: 'A Sortear o Pote',
    waitingBlockchain: 'A aguardar confirmação da Blockchain',
    winner: 'VENCEDOR',
    resetPot: 'Reiniciar Pote',
    connectWalletFirst: 'Ligue a sua carteira primeiro!',
    selectAnimalFirst: 'Selecione um animal primeiro!',
    betRangeError: 'A aposta deve estar entre {min} e {max} SOL para esta sala!',
    processingBet: 'A processar aposta...',
    betConfirmed: 'Aposta de {amount} SOL no {animal} confirmada!',
    transactionError: 'Erro na transação: ',
    victory: 'VITÓRIA! O {animal} foi sorteado!',
    drawnResult: 'O animal sorteado foi o {animal}.',
    dismiss: 'Fechar',
    footerText: '© 2026 FLIPANIMALS - A PLATAFORMA #1 DE APOSTAS ON-CHAIN',
    terms: 'Termos',
    privacy: 'Privacidade',
    animals: [
      'Avestruz', 'Águia', 'Burro', 'Borboleta', 'Cão', 'Cabra', 'Carneiro', 'Camelo', 'Cobra', 'Coelho', 
      'Cavalo', 'Elefante', 'Galo', 'Gato', 'Jacaré', 'Leão', 'Macaco', 'Porco', 'Pavão', 'Peru', 
      'Touro', 'Tigre', 'Urso', 'Veado', 'Vaca'
    ]
  }
};

const BICHOS_EMOJIS = [
  '🦤', '🦅', '🫏', '🦋', '🐕', '🐐', '🐏', '🐪', '🐍', '🐇', 
  '🐎', '🐘', '🐓', '🐈', '🐊', '🦁', '🐒', '🐖', '🦚', '🦃', 
  '🐂', '🐅', '🐻', '🦌', '🐄'
];

const ROOMS = [
  { id: 'small', name: 'Small Pot', min: 0.01, max: 0.1, color: 'emerald' },
  { id: 'medium', name: 'Medium Pot', min: 0.1, max: 1, color: 'purple' },
  { id: 'large', name: 'High Roller', min: 1, max: 10, color: 'orange' },
];

export default function App() {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { placeBetOnChain } = useFlipAnimals();
  const socketRef = useRef<Socket | null>(null);
  
  const [lang, setLang] = useState<Language>('en-US');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', message: string } | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [winnerBicho, setWinnerBicho] = useState<any | null>(null);
  const [selectedBicho, setSelectedBicho] = useState<any | null>(null);
  const [betAmount, setBetAmount] = useState<number>(0.05);
  const [activeRoom, setActiveRoom] = useState(ROOMS[0]);
  const [potProgress, setPotProgress] = useState(42);
  const [liveBets, setLiveBets] = useState<any[]>([]);
  const [spinningEmoji, setSpinningEmoji] = useState<string | null>(null);
  const [onlineCount, setOnlineCount] = useState(1242);

  const t = (key: keyof typeof TRANSLATIONS['en-US']) => TRANSLATIONS[lang][key] as string;
  const getAnimalName = (id: number) => TRANSLATIONS[lang].animals[id - 1];
  
  const BICHOS = BICHOS_EMOJIS.map((emoji, index) => ({
    id: index + 1,
    name: getAnimalName(index + 1),
    emoji
  }));

  // WebSocket Connection
  useEffect(() => {
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5
    });
    socketRef.current = socket;

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onInit = (data: any) => {
      const roomData = data.rooms[activeRoom.id];
      setPotProgress(Math.min(100, roomData.pot * 10));
      setLiveBets(roomData.players.slice(-10).reverse());
    };

    const onNewBet = (data: any) => {
      if (data.roomId === activeRoom.id) {
        setPotProgress(Math.min(100, data.pot * 10));
        setLiveBets(prev => [data.bet, ...prev.slice(0, 9)]);
      }
    };

    const onDrawStarted = (data: any) => {
      if (data.roomId === activeRoom.id) {
        setIsSpinning(true);
        setWinnerBicho(null);
        setPotProgress(0);
        
        let count = 0;
        const interval = setInterval(() => {
          const bichoIndex = Math.floor(Math.random() * BICHOS_EMOJIS.length);
          setSpinningEmoji(BICHOS_EMOJIS[bichoIndex]);
          count++;
          if (count >= 30) clearInterval(interval);
        }, 100);
      }
    };

    const onDrawResult = (data: any) => {
      if (data.roomId === activeRoom.id) {
        setIsSpinning(false);
        setSpinningEmoji(null);
        const finalWinner = {
          id: data.winner.id,
          emoji: data.winner.emoji,
          name: TRANSLATIONS[lang].animals[data.winner.id - 1]
        };
        setWinnerBicho(finalWinner);
        
        if (selectedBicho && finalWinner.id === selectedBicho.id) {
          setStatus({ 
            type: 'success', 
            message: `${t('victory').replace('{animal}', finalWinner.name)} | Prize: ${data.netPrize} SOL (Fee: ${data.houseFee} SOL)` 
          });
        } else {
          setStatus({ 
            type: 'info', 
            message: `${t('drawnResult').replace('{animal}', finalWinner.name)} | Pot: ${data.pot} SOL` 
          });
        }
      }
    };

    socket.on('init', onInit);
    socket.on('new_bet', onNewBet);
    socket.on('draw_started', onDrawStarted);
    socket.on('draw_result', onDrawResult);

    return () => {
      socket.off('init', onInit);
      socket.off('new_bet', onNewBet);
      socket.off('draw_started', onDrawStarted);
      socket.off('draw_result', onDrawResult);
    };
  }, [activeRoom.id, lang, selectedBicho]);

  const placeBet = async () => {
    if (!publicKey) {
      setStatus({ type: 'error', message: t('connectWalletFirst') });
      return;
    }

    if (!selectedBicho) {
      setStatus({ type: 'error', message: t('selectAnimalFirst') });
      return;
    }

    if (betAmount < activeRoom.min || betAmount > activeRoom.max) {
      setStatus({ 
        type: 'error', 
        message: t('betRangeError').replace('{min}', activeRoom.min.toString()).replace('{max}', activeRoom.max.toString()) 
      });
      return;
    }

    setLoading(true);
    setStatus({ type: 'info', message: t('processingBet') });

    try {
      // Real on-chain bet using our Anchor program
      const tx = await placeBetOnChain(activeRoom.id, selectedBicho.id, betAmount);
      console.log('Transaction Signature:', tx);
      
      socketRef.current?.emit('place_bet', {
        roomId: activeRoom.id,
        user: publicKey.toBase58(),
        amount: betAmount,
        bichoId: selectedBicho.id,
        txSignature: tx
      });

      setStatus({ 
        type: 'success', 
        message: t('betConfirmed').replace('{amount}', betAmount.toString()).replace('{animal}', selectedBicho.name) 
      });
    } catch (error: any) {
      console.error(error);
      setStatus({ type: 'error', message: t('transactionError') + error.message });
    } finally {
      setLoading(false);
    }
  };

  const requestDraw = () => {
    socketRef.current?.emit('request_draw', activeRoom.id);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans selection:bg-purple-500/30">
      {/* Header */}
      <nav className="border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Zap className="w-5 h-5 text-white fill-current" />
              </div>
              <span className="font-bold text-xl tracking-tighter uppercase italic">
                FLIP<span className="text-purple-500">ANIMALS</span>
              </span>
            </div>
            
            <div className="hidden md:flex items-center gap-6 text-xs font-bold uppercase tracking-widest text-zinc-500">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-3 h-3 text-emerald-500" />
                <span>{t('totalWon')}: <span className="text-white">12,450 SOL</span></span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3 text-blue-500" />
                <span>{t('online')}: <span className="text-white">1,242</span></span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <div className="flex items-center gap-1 bg-zinc-900/50 border border-white/5 rounded-full p-1">
              {(['en-US', 'pt-BR', 'pt-PT'] as Language[]).map((l) => (
                <button
                  key={l}
                  onClick={() => setLang(l)}
                  className={`px-2 py-1 rounded-full text-[10px] font-bold transition-all ${
                    lang === l ? 'bg-white text-black' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {l.split('-')[1]}
                </button>
              ))}
            </div>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-zinc-900/50 border border-white/5 rounded-full text-[10px] font-bold text-zinc-400">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              {t('provablyFair')}
            </div>
            <WalletMultiButton className="!bg-white !text-black hover:!bg-zinc-200 !transition-all !rounded-full !h-9 !px-6 !text-xs !font-bold !uppercase !tracking-widest" />
          </div>
        </div>
      </nav>

      {/* Pot Progress Bar */}
      <div className="w-full h-1 bg-zinc-900 relative overflow-hidden">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${potProgress}%` }}
          className="h-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 bg-[length:200%_100%] animate-gradient-x"
        />
      </div>

      <main className="max-w-[1600px] mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-12 gap-8">
          
          {/* Left Sidebar: Live Activity */}
          <div className="lg:col-span-3 hidden lg:block space-y-6">
            <div className="glass-panel rounded-3xl p-6 neon-border">
              <h3 className="text-xs font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-zinc-400">
                <Activity className="w-4 h-4 text-purple-500" />
                {t('liveActivity')}
              </h3>
              <div className="space-y-4">
                <AnimatePresence initial={false}>
                  {liveBets.map((bet) => (
                    <motion.div 
                      key={bet.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="p-3 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{bet.bicho.emoji}</div>
                        <div>
                          <p className="text-[10px] font-bold text-zinc-300">{bet.user.slice(0, 8)}...</p>
                          <p className="text-[8px] text-zinc-500 font-mono uppercase tracking-tighter">{t('betOn')} {bet.bicho.name}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-purple-400">{bet.amount} SOL</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-6 space-y-6">
            {/* Room Selector */}
            <div className="flex p-1.5 bg-zinc-900/50 border border-white/5 rounded-2xl gap-2">
              {ROOMS.map((room) => (
                <button
                  key={room.id}
                  onClick={() => setActiveRoom(room)}
                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${
                    activeRoom.id === room.id 
                      ? 'bg-white text-black shadow-lg' 
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {room.name}
                </button>
              ))}
            </div>

            {/* Jackpot Display */}
            <div className="glass-panel rounded-[40px] overflow-hidden neon-border aspect-[16/10] relative flex items-center justify-center">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(168,85,247,0.15),transparent_70%)]" />
              
              <AnimatePresence mode="wait">
                {isSpinning ? (
                  <motion.div
                    key="spinning"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 1.2, opacity: 0 }}
                    className="flex flex-col items-center gap-6"
                  >
                    <div className="relative">
                       <div className="w-32 h-32 border-4 border-purple-500 border-t-transparent rounded-full animate-spin shadow-[0_0_30px_rgba(168,85,247,0.3)] flex items-center justify-center">
                          <motion.span 
                            key={spinningEmoji}
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="text-6xl"
                          >
                            {spinningEmoji}
                          </motion.span>
                       </div>
                    </div>
                    <div className="text-center">
                      <p className="text-purple-400 font-mono text-xs animate-pulse tracking-[0.3em] uppercase">{t('rolling')}</p>
                      <p className="text-zinc-500 text-[10px] mt-2 uppercase tracking-widest">{t('waitingBlockchain')}</p>
                    </div>
                  </motion.div>
                ) : winnerBicho ? (
                  <motion.div
                    key="winner"
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-6 text-center p-8"
                  >
                    <motion.div 
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                      className="w-32 h-32 bg-yellow-500/10 rounded-full flex items-center justify-center border border-yellow-500/30 shadow-[0_0_60px_rgba(234,179,8,0.2)]"
                    >
                      <span className="text-7xl">{winnerBicho.emoji}</span>
                    </motion.div>
                    <div>
                      <h2 className="text-4xl font-bold text-white uppercase tracking-tighter italic">{t('winner')}: {winnerBicho.name}</h2>
                      <p className="text-zinc-500 text-[10px] mt-2 font-mono uppercase tracking-widest">Transaction ID: 5xR9...pQ2z</p>
                    </div>
                    <button 
                      onClick={() => setWinnerBicho(null)}
                      className="mt-4 px-6 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all"
                    >
                      {t('resetPot')}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex flex-col items-center gap-8"
                  >
                    <div className="text-center">
                      <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.4em] mb-4">{t('currentPot')}</p>
                      <h1 className="text-7xl font-bold tracking-tighter italic">
                        {(potProgress * 0.12).toFixed(2)} <span className="text-purple-500">SOL</span>
                      </h1>
                    </div>
                    <div className="flex items-center gap-12">
                      <div className="text-center">
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">{t('players')}</p>
                        <p className="text-xl font-bold">{liveBets.length}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest mb-1">{t('chance')}</p>
                        <p className="text-xl font-bold text-purple-400">
                          {selectedBicho && liveBets.length > 0 
                            ? `${(100 / [...new Set(liveBets.map(b => b.bichoId || b.bicho.id))].length).toFixed(1)}%` 
                            : '0%'}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full">
                      <p className="text-[10px] font-bold text-purple-400 uppercase tracking-widest flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        Auto-draw at 5 players
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Bicho Grid (Compact) */}
            <div className="glass-panel rounded-3xl p-6 neon-border">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest text-zinc-400">
                  <MousePointer2 className="w-4 h-4 text-purple-500" />
                  {t('selectPool')}
                </h2>
                <div className="flex items-center gap-2 px-3 py-1 bg-zinc-950 rounded-full text-[8px] font-bold text-zinc-500 border border-white/5">
                  <Info className="w-3 h-3" />
                  {t('winUpTo')}
                </div>
              </div>
              
              <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
                {BICHOS.map((bicho) => (
                  <button
                    key={bicho.id}
                    onClick={() => setSelectedBicho(bicho)}
                    className={`relative aspect-square rounded-xl border transition-all flex items-center justify-center text-2xl ${
                      selectedBicho?.id === bicho.id 
                        ? 'bg-purple-500/20 border-purple-500 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
                        : 'bg-zinc-950/50 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    {bicho.emoji}
                    {selectedBicho?.id === bicho.id && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-2 h-2 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar: Betting & History */}
          <div className="lg:col-span-3 space-y-6">
            <div className="glass-panel rounded-3xl p-6 neon-border">
              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{t('betAmount')}</label>
                    <span className="text-xs font-bold text-purple-400 font-mono">{betAmount.toFixed(2)} SOL</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2 mb-4">
                    {[0.01, 0.05, 0.1, 0.5].map(val => (
                      <button 
                        key={val}
                        onClick={() => setBetAmount(val)}
                        className="py-1.5 bg-zinc-900 border border-white/5 rounded-lg text-[10px] font-bold hover:bg-zinc-800 transition-all"
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <input 
                    type="range" 
                    min={activeRoom.min} 
                    max={activeRoom.max} 
                    step="0.01"
                    value={betAmount}
                    onChange={(e) => setBetAmount(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={placeBet}
                    disabled={loading || isSpinning || !selectedBicho}
                    className="w-full flex items-center justify-center gap-3 bg-white text-black font-bold py-4 rounded-2xl hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed uppercase text-xs tracking-widest"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
                    {t('placeBet')}
                  </button>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={requestDraw}
                      disabled={isSpinning || loading}
                      className="flex items-center justify-center gap-2 bg-zinc-900 text-white font-bold py-4 rounded-2xl hover:bg-zinc-800 transition-all border border-white/5 disabled:opacity-50 uppercase text-[10px] tracking-widest"
                    >
                      <Zap className="w-3 h-3 text-yellow-500" />
                      {t('rollPot')}
                    </button>
                    <button
                      onClick={requestDraw}
                      disabled={isSpinning || loading}
                      className="flex items-center justify-center gap-2 bg-purple-600/20 text-purple-400 font-bold py-4 rounded-2xl hover:bg-purple-600/30 transition-all border border-purple-500/30 disabled:opacity-50 uppercase text-[10px] tracking-widest"
                    >
                      <Activity className="w-3 h-3" />
                      {t('testDraw')}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 neon-border">
              <h3 className="text-[10px] font-bold mb-6 flex items-center gap-2 uppercase tracking-widest text-zinc-400">
                <History className="w-4 h-4 text-purple-500" />
                {t('recentWinners')}
              </h3>
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-3">
                      <div className="text-lg">{BICHOS_EMOJIS[i + 5]}</div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-300">User_{800 + i}</p>
                        <p className="text-[8px] text-zinc-600 font-mono">2m ago</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500">+{0.25 * i} SOL</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Status Messages (Floating) */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-full max-w-md px-6">
        <AnimatePresence>
          {status && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className={`flex items-center gap-3 p-4 rounded-2xl border backdrop-blur-xl shadow-2xl ${
                status.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' :
                status.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' :
                'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> :
               status.type === 'error' ? <AlertCircle className="w-5 h-5 shrink-0" /> :
               <Loader2 className="w-5 h-5 shrink-0 animate-spin" />}
              <p className="text-xs font-bold uppercase tracking-wider">{status.message}</p>
              <button onClick={() => setStatus(null)} className="ml-auto text-[10px] uppercase font-bold opacity-50 hover:opacity-100">{t('dismiss')}</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer className="border-t border-white/5 py-12 mt-12 bg-black/40">
        <div className="max-w-[1600px] mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-[0.3em]">{t('footerText')}</p>
          <div className="flex items-center gap-8 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
            <a href="#" className="hover:text-white transition-colors">{t('terms')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('privacy')}</a>
            <a href="#" className="hover:text-white transition-colors">{t('provablyFair')}</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
