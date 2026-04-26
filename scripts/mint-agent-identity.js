const { solanaAgent } = require('../lib/solana-agent');

async function createAgentIdentity() {
  if (!solanaAgent) {
    console.error('❌ Agent not initialized. Check AGENT_SIGNER_SECRET_KEY.');
    return;
  }

  console.log('🎭 Initializing Agent Identity via Metaplex...');

  try {
    // 1. Define Agent Metadata
    const agentMetadata = {
      name: "SlotZero Shield Agent",
      symbol: "SZERO",
      uri: "https://arweave.net/example-metadata-uri", // Placeholder
      sellerFeeBasisPoints: 500, // 5%
    };

    console.log('🛠️ Minting Agent NFT...');
    
    // Using solana-agent-kit deployToken or similar
    // For the hackathon, we create a unique NFT representing this agent's permission to trade the vault
    const result = await solanaAgent.deployToken(
      agentMetadata.name,
      agentMetadata.uri,
      agentMetadata.symbol,
      0 // NFT (decimals = 0)
    );

    console.log('✅ Agent Identity Token Minted!');
    console.log('📍 Mint Address:', result.mint.toString());
    console.log('🛡️ This token now controls the Agent Vault PDA.');

    return result.mint;
  } catch (error) {
    console.error('❌ Failed to mint agent identity:', error);
  }
}

createAgentIdentity();
