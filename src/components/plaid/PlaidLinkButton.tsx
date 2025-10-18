'use client';

import { useState, useCallback } from 'react';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onExit?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function PlaidLinkButton({
  onSuccess,
  onExit,
  className = '',
  children = 'Connect Bank Account',
}: PlaidLinkButtonProps) {
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch link token from backend
  const fetchLinkToken = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to create link token');
      }

      const data = await response.json();
      setLinkToken(data.link_token);
    } catch (error) {
      console.error('Error fetching link token:', error);
      alert('Failed to initialize Plaid Link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful account connection
  const handleOnSuccess = useCallback(
    async (public_token: string, metadata: any) => {
      setLoading(true);
      try {
        const response = await fetch('/api/plaid/exchange-token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ public_token, metadata }),
        });

        if (!response.ok) {
          throw new Error('Failed to exchange token');
        }

        const data = await response.json();
        console.log('Account connected successfully:', data);

        // Sync transactions immediately after connection
        await fetch('/api/plaid/sync-transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ days: 90 }),
        });

        if (onSuccess) {
          onSuccess();
        }
      } catch (error) {
        console.error('Error exchanging token:', error);
        alert('Failed to connect account. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [onSuccess]
  );

  // Handle Plaid Link exit
  const handleOnExit = useCallback(() => {
    if (onExit) {
      onExit();
    }
  }, [onExit]);

  // Initialize Plaid Link
  const config = {
    token: linkToken,
    onSuccess: handleOnSuccess,
    onExit: handleOnExit,
  };

  const { open, ready } = usePlaidLink(config);

  const handleClick = () => {
    if (!linkToken) {
      fetchLinkToken();
    } else if (ready) {
      open();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading || (!ready && linkToken !== null)}
      className={`${className} disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
