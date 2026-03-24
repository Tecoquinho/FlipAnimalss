import * as anchor from '@coral-xyz/anchor';
import { Program, AnchorProvider, web3 } from '@coral-xyz/anchor';
import { PublicKey, Keypair, Connection } from '@solana/web3.js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const idlPath = path.resolve(__dirname, '../src/lib/idl.json');
const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

const PROGRAM_ID = new PublicKey('Animais11111111111111111111111111111111111');

export const getAdminKeypair = () => {
  const secretKeyString = process.env.ADMIN_SECRET_KEY;
  if (!secretKeyString) {
    console.warn('ADMIN_SECRET_KEY not found, using a random keypair for demo.');
    return Keypair.generate();
  }
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(secretKeyString)));
};

export const setupAnchorServer = (connection: Connection) => {
  const adminKeypair = getAdminKeypair();
  const wallet = new anchor.Wallet(adminKeypair);
  const provider = new AnchorProvider(connection, wallet, {
    preflightCommitment: 'processed',
  });
  
  const program = new Program(idl as any, provider);
  
  return { program, adminKeypair };
};

export const getPotAddress = (roomId: string) => {
  const [potAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('pot'), Buffer.from(roomId)],
    PROGRAM_ID
  );
  return potAddress;
};
