import { SolanaAgentKit, KeypairWallet } from 'solana-agent-kit'
import { Connection, Keypair } from '@solana/web3.js'
import bs58 from 'bs58'

/**
 * SlotZero Solana Agent Singleton
 */

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
const PRIVATE_KEY = process.env.AGENT_SIGNER_SECRET_KEY || ''

// Initialize Keypair from Base58
const keypair = (PRIVATE_KEY && PRIVATE_KEY !== '') 
  ? Keypair.fromSecretKey(bs58.decode(PRIVATE_KEY))
  : null

export const solanaAgent = keypair 
  ? new SolanaAgentKit(
      new KeypairWallet(keypair, RPC_URL),
      RPC_URL,
      {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY || ''
      }
    )
  : null

export const connection = new Connection(RPC_URL)

// Wrapper for common tools to ensure they work with SlotZero's context
export const agentTools = {
  async getPrice(token: string) {
    if (!solanaAgent) return 0
    try {
      // Use the kit's internal Pyth or Jupiter price check
      // For now, we'll keep the existing token mapping
      return 0 // Placeholder for real price fetch
    } catch (error) {
      console.error('Agent price fetch failed:', error)
      return 0
    }
  },

  async swap(fromToken: string, toToken: string, amount: number) {
    if (!solanaAgent) throw new Error('Agent not initialized')
    // @ts-ignore - trade() is part of the kit
    return await solanaAgent.trade(
      toToken, // Target token
      amount,
      fromToken, // Source token
      1 // Slippage
    )
  }
}
