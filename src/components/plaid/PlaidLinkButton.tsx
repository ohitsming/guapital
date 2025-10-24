'use client';

import { useState, useCallback, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';

interface PlaidLinkButtonProps {
  onSuccess?: () => void;
  onExit?: () => void;
  onSyncStart?: () => void;  // Called when sync begins
  className?: string;
  children?: React.ReactNode;
}

export default function PlaidLinkButton({
  onSuccess,
  onExit,
  onSyncStart,
  className = '',
  children = 'Connect Account',
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
        const errorData = await response.json();
        console.error('❌ Link token error:', errorData);

        // Show more helpful error message based on status
        let errorMessage = 'Failed to initialize Plaid Link. ';

        if (response.status === 401) {
          errorMessage += 'Please log in and try again.';
        } else if (response.status === 500) {
          errorMessage += 'Server error. Please try again later.';

          // Include Plaid-specific error if available
          if (errorData.plaidError) {
            console.error('Plaid Error:', errorData.plaidError);
            errorMessage += `\n\nDetails: ${errorData.plaidError}`;
          }

          // Include error code for support
          if (errorData.plaidErrorCode) {
            console.error('Plaid Error Code:', errorData.plaidErrorCode);
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (!data.link_token) {
        throw new Error('No link token received from server');
      }

      console.log('✅ Link token received');
      setLinkToken(data.link_token);
    } catch (error: any) {
      console.error('Error fetching link token:', error);
      alert(error.message || 'Failed to initialize Plaid Link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle successful account connection
  const handleOnSuccess = useCallback(
    async (public_token: string, metadata: any) => {
      setLoading(true);

      // Notify parent that sync is starting
      if (onSyncStart) {
        onSyncStart();
      }

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
    [onSuccess, onSyncStart]
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

  // Auto-open Plaid Link when token is ready
  useEffect(() => {
    if (linkToken && ready) {
      open();
    }
  }, [linkToken, ready, open]);

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
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-[#004D40] border border-transparent rounded-md hover:bg-[#00695C] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#004D40] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
