import { Connection, PublicKey, Transaction, SystemProgram, Keypair } from '@solana/web3.js'
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token'
import bs58 from 'bs58'

const TARGET_TOKENS: Record<string, string> = {
  JUP: 'JUPyiwrYJFskUPiHa7hkeR8QSeAsPtQQE2CqkbNpu1g',
  ORCA: 'orcaEKTdK7LKpm7Pf3B9qa9yLw17Kaqy9wAxeP9jMQC',
  MNDE: 'MNDEF5v1xMTzWiwmA8BxPR9nkyAUdqXZAW6gChSE2FD',
  COPE: 'COPE9nME6zvJrVrnHfMRvccy2TNNmT8HJZJQ6oGLnUq',
  DRIFT: 'DRIFTtPirpZjce4F6L6RpxKiUm6fC1ujZEX6T67Q2p',
}

const ER_RPC_URL = process.env.ER_RPC_URL || 'https://ephemeral-api.magicblock.app'
const SOLANA_MAINNET = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'

export class MagicBlockERService {
  private erConnection: Connection
  private mainnetConnection: Connection
  private agentSigner: Keypair | null
  
  constructor() {
    this.erConnection = new Connection(ER_RPC_URL, 'confirmed')
    this.mainnetConnection = new Connection(SOLANA_MAINNET, 'confirmed')
    this.agentSigner = this.getAgentSigner()
  }

  private getAgentSigner(): Keypair | null {
    const secret = process.env.AGENT_SIGNER_SECRET_KEY
    if (!secret) return null
    try {
      return Keypair.fromSecretKey(bs58.decode(secret))
    } catch (error) {
      console.error('Invalid AGENT_SIGNER_SECRET_KEY. Falling back to simulation mode.', error)
      return null
    }
  }

  private isSimulationMode(): boolean {
    return !this.agentSigner || process.env.MAGICBLOCK_SIMULATION_MODE === 'true'
  }

  async buildPrivateTransaction(params: {
    type: 'BUY' | 'SELL'
    token: string
    amount: number
    userPublicKey: string
    price: number
  }): Promise<{ transaction: Transaction; ephemeralSigner: Keypair }> {
    const tokenMint = TARGET_TOKENS[params.token]
    if (!tokenMint) throw new Error(`Unknown token: ${params.token}`)
    
    const tokenPubkey = new PublicKey(tokenMint)
    const signer = this.agentSigner ?? Keypair.generate()
    
    const transaction = new Transaction()
    const ephemeralSigner = Keypair.generate()
    transaction.feePayer = signer.publicKey
    
    // Fund ephemeral signer from agent signer for execution fees.
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: ephemeralSigner.publicKey,
        lamports: 1_000_000, // 0.001 SOL for fees
      })
    )
    
    // Get token accounts
    const ephemeralTokenAccount = await getAssociatedTokenAddress(tokenPubkey, ephemeralSigner.publicKey, true)
    
    // Create ephemeral token account if needed
    transaction.add(
      createAssociatedTokenAccountInstruction(
        signer.publicKey,
        ephemeralTokenAccount,
        ephemeralSigner.publicKey,
        tokenPubkey
      )
    )
    
    return { transaction, ephemeralSigner }
  }

  async submitToPrivateER(transaction: Transaction, signers: Keypair[]): Promise<{ signature: string; success: boolean; simulated?: boolean }> {
    try {
      if (this.isSimulationMode()) {
        const mockSignature = `sim_${Keypair.generate().publicKey.toBase58()}`
        return { signature: mockSignature, success: true, simulated: true }
      }

      const allSigners = this.agentSigner ? [this.agentSigner, ...signers] : signers
      const signature = await this.erConnection.sendTransaction(transaction, allSigners, {
        skipPreflight: true,
        maxRetries: 3,
      })
      
      await this.erConnection.confirmTransaction(signature, 'confirmed')
      
      return { signature, success: true, simulated: false }
    } catch (error) {
      console.error('Private ER submission failed:', error)
      throw error
    }
  }

  async buildEscrowTransaction(params: {
    seller: string
    buyer: string
    token: string
    amount: number
    price: number
  }): Promise<{ transaction: Transaction; escrowKeypair: Keypair }> {
    const tokenMint = TARGET_TOKENS[params.token]
    const buyerPubkey = new PublicKey(params.buyer)
    
    const escrowKeypair = Keypair.generate()
    const transaction = new Transaction()
    
    // Create escrow account
    transaction.add(
      SystemProgram.createAccount({
        fromPubkey: buyerPubkey,
        newAccountPubkey: escrowKeypair.publicKey,
        lamports: await this.mainnetConnection.getMinimumBalanceForRentExemption(165),
        space: 165,
        programId: SystemProgram.programId,
      })
    )
    
    return { transaction, escrowKeypair }
  }

  async buildReleaseEscrow(params: {
    escrowAddress: string
    recipient: string
    amount: number
  }): Promise<Transaction> {
    const escrowPubkey = new PublicKey(params.escrowAddress)
    const recipientPubkey = new PublicKey(params.recipient)
    
    const transaction = new Transaction()
    
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: escrowPubkey,
        toPubkey: recipientPubkey,
        lamports: params.amount * 1000000000, // Convert SOL to lamports
      })
    )
    
    return transaction
  }
}

export const magicBlockER = new MagicBlockERService()
