'use client';

import { useSignIn, useSignUp } from '@clerk/nextjs';
import { useWallet } from '@solana/wallet-adapter-react';
import bs58 from 'bs58';
import { useState, useCallback, useEffect, useRef } from 'react';

export const useSolanaClerk = () => {
  const { signIn, isLoaded: isSignInLoaded, setActive }: any = useSignIn();
  const { signUp, isLoaded: isSignUpLoaded }: any = useSignUp();
  const { publicKey, signMessage, select, connect, wallet, connected, connecting } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Track if we initiated the auth flow
  const [authStage, setAuthStage] = useState<'idle' | 'connecting' | 'verifying'>('idle');

  const authenticate = useCallback(async (walletName?: string) => {
    if (!isSignInLoaded || !isSignUpLoaded) {
      setError('Clerk not loaded');
      return;
    }

    setError(null);
    setAuthStage('connecting');

    try {
      // 1. Handle selection
      if (walletName && (!wallet || wallet.adapter.name !== walletName)) {
        select(walletName as any);
        // Note: selection triggers re-render, auto-connect might happen
        return; 
      }

      // 2. Handle connection if not already connecting/connected
      if (!connected && !connecting) {
        await connect();
      }
    } catch (err: any) {
      console.error('Solana Connection Error:', err);
      setError(err.message || 'Connection failed');
      setAuthStage('idle');
    }
  }, [isSignInLoaded, isSignUpLoaded, wallet, connected, connecting, select, connect]);

  // Effect to handle the transition to 'verifying' 
  useEffect(() => {
    if (authStage === 'connecting' && connected && publicKey) {
      setAuthStage('verifying');
    }
  }, [authStage, connected, publicKey]);

  // Effect to handle the actual Clerk auth once we are in 'verifying' stage
  useEffect(() => {
    const runClerkAuth = async () => {
      if (authStage !== 'verifying' || !publicKey || !signMessage || !connected) {
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const address = publicKey.toBase58();

        // 1. Try to sign in
        try {
          const si = await signIn.create({
            identifier: address,
          });

          const { message } = await signIn.prepareFirstFactor({
            strategy: 'web3_solana_signature',
            web3Wallet: address,
          });

          if (!message) throw new Error('No message to sign');

          const encodedMessage = new TextEncoder().encode(message);
          const signature = await signMessage(encodedMessage);
          const signatureString = bs58.encode(signature);

          const result = await signIn.attemptFirstFactor({
            strategy: 'web3_solana_signature',
            signature: signatureString,
          });

          if (result.status === 'complete') {
            await setActive({ session: result.createdSessionId });
            setAuthStage('idle');
            return;
          }
        } catch (e: any) {
          // If user not found, try sign up
          if (e.errors?.[0]?.code === 'form_identifier_not_found' || e.status === 404) {
            const su = await signUp.create({
              web3Wallet: address,
            });

            const { message } = await signUp.prepareVerification({
              strategy: 'web3_solana_signature',
            });

            if (!message) throw new Error('No message to sign');

            const encodedMessage = new TextEncoder().encode(message);
            const signature = await signMessage(encodedMessage);
            const signatureString = bs58.encode(signature);

            const result = await signUp.attemptVerification({
              strategy: 'web3_solana_signature',
              signature: signatureString,
            });

            if (result.status === 'complete') {
              await setActive({ session: result.createdSessionId });
              setAuthStage('idle');
              return;
            }
          } else {
            throw e;
          }
        }
      } catch (err: any) {
        console.error('Clerk Auth Error:', err);
        setError(err.message || 'Verification failed');
        setAuthStage('idle');
      } finally {
        setLoading(false);
      }
    };

    runClerkAuth();
  }, [authStage, publicKey, signMessage, connected, signIn, signUp, setActive]);

  return { 
    authenticate, 
    loading: loading || authStage !== 'idle', 
    error 
  };
};
