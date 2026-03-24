import { useMemo } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { 
  Program, 
  AnchorProvider, 
  Idl, 
  setProvider,
  web3,
  BN
} from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import idl from './idl.json';

const PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

export const useFlipAnimals = () => {
  const { connection } = useConnection();
  const wallet = useWallet();

  const provider = useMemo(() => {
    if (!wallet || !wallet.publicKey) return null;
    return new AnchorProvider(connection, wallet as any, {
      preflightCommitment: 'processed',
    });
  }, [connection, wallet]);

  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as any, provider);
  }, [provider]);

  const getPotAddress = (roomId: string) => {
    const [potAddress] = PublicKey.findProgramAddressSync(
      [Buffer.from('pot'), Buffer.from(roomId)],
      PROGRAM_ID
    );
    return potAddress;
  };

  const placeBetOnChain = async (roomId: string, animalId: number, amount: number) => {
    if (!program || !wallet.publicKey) throw new Error('Wallet not connected');

    const potAddress = getPotAddress(roomId);
    const lamports = amount * web3.LAMPORTS_PER_SOL;

    const tx = await program.methods
      .placeBet(animalId, new BN(lamports))
      .accounts({
        pot: potAddress,
        player: wallet.publicKey,
        systemProgram: web3.SystemProgram.programId,
      })
      .rpc();

    return tx;
  };

  return {
    program,
    getPotAddress,
    placeBetOnChain,
    PROGRAM_ID
  };
};
