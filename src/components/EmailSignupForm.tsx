"use client"

import React, { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { CheckIcon } from '@heroicons/react/24/outline';
import { Button } from './Button';
import { TextField } from './TextField';

interface EmailSignupFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const EmailSignupForm: React.FC<EmailSignupFormProps> = ({ open, onClose, onSuccess }) => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [renderTime] = useState(Date.now());

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setIsSubmitting(true);

    const form = e.currentTarget;
    const honeypot = (form.elements.namedItem('honeypot') as HTMLInputElement)?.value;

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, honeypot, renderTime }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'An error occurred.');
      }

      // For honeypot or already subscribed, the API returns a success-like message.
      // We can just proceed to the success screen.
      setSubmissionSuccess(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      console.error('Signup error:', error);
      setMessage(error.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Use a timeout to prevent the modal from showing the reset state during closing animation
    setTimeout(() => {
      setEmail('');
      setMessage('');
      setIsSubmitting(false);
      setSubmissionSuccess(false);
    }, 300);
  };

  return (
    <Dialog open={open} onClose={handleClose} className="relative z-50">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500/75 transition-opacity data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in dark:bg-gray-900/50"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all data-[closed]:translate-y-4 data-[closed]:opacity-0 data-[enter]:duration-300 data-[leave]:duration-200 data-[enter]:ease-out data-[leave]:ease-in sm:my-8 sm:w-full sm:max-w-lg sm:p-6 data-[closed]:sm:translate-y-0 data-[closed]:sm:scale-95 dark:bg-gray-800 dark:outline dark:outline-1 dark:-outline-offset-1 dark:outline-white/10"
          >
            {submissionSuccess ? (
              <div>
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/10">
                  <CheckIcon aria-hidden="true" className="size-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <DialogTitle as="h3" className="text-base font-semibold text-gray-900 dark:text-white">
                    Thanks for signing up!
                  </DialogTitle>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      You&apos;ve been added to our waitlist. We&apos;ll let you know when we launch.
                    </p>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6">
                  <Button
                    type="button"
                    onClick={handleClose}
                    className="inline-flex w-full justify-center"
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit}>
                <DialogTitle as="h3" className="text-base font-semibold leading-6 text-gray-900 dark:text-white">
                  Join our waitlist
                </DialogTitle>
                <div className="mt-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Get notified when we launch. Join our waitlist for early access and updates!
                  </p>
                </div>
                <div className="mt-4">
                  <TextField
                    label="Email address"
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full"
                  />
                </div>

                {/* Honeypot field for spam protection */}
                <div className="absolute left-[-5000px]" aria-hidden="true">
                  <label htmlFor="h0n3yp0t">Do not fill this out</label>
                  <input type="text" id="h0n3yp0t" name="h0n3yp0t" tabIndex={-1} defaultValue="" />
                </div>
                {message && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{message}</p>}
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="sm:col-start-2 justify-center"
                  >
                    {isSubmitting ? 'Joining...' : 'Join Waitlist'}
                  </Button>
                  <button
                    type="button"
                    onClick={handleClose}
                    className="w-full text-center mt-3 sm:col-start-1 sm:mt-0 text-sm font-semibold text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 py-1.5 cursor-pointer"
                    data-autofocus
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
};

export default EmailSignupForm;