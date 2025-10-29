'use client';

import { useState } from 'react';
import * as Sentry from '@sentry/nextjs';

export default function SentryTestPage() {
  const [testResult, setTestResult] = useState<{ message: string; type: 'success' | 'error' | 'loading' } | null>(null);
  const [lastTriggered, setLastTriggered] = useState<string | null>(null);

  const triggerClientError = () => {
    setLastTriggered('client');
    setTestResult({ message: 'Triggering client-side error...', type: 'loading' });
    setTimeout(() => {
      try {
        throw new Error('Test client-side error from Sentry test page');
      } catch (error) {
        Sentry.captureException(error);
        setTestResult({ message: 'Client error sent to Sentry successfully', type: 'success' });
      }
    }, 500);
  };

  const triggerUncaughtError = () => {
    setLastTriggered('uncaught');
    setTestResult({ message: 'Triggering uncaught error...', type: 'loading' });
    setTimeout(() => {
      setTestResult({ message: 'Uncaught error thrown (check console)', type: 'success' });
      setTimeout(() => {
        throw new Error('Test uncaught error from Sentry test page');
      }, 100);
    }, 500);
  };

  const triggerServerError = async () => {
    setLastTriggered('server');
    setTestResult({ message: 'Triggering server-side error...', type: 'loading' });
    setTimeout(async () => {
      try {
        const response = await fetch('/api/sentry-test?type=error');
        await response.json();
        setTestResult({ message: 'Server error sent to Sentry successfully', type: 'success' });
      } catch (error) {
        setTestResult({ message: 'Server error triggered successfully', type: 'success' });
      }
    }, 500);
  };

  const triggerCustomEvent = () => {
    setLastTriggered('custom');
    setTestResult({ message: 'Sending custom event...', type: 'loading' });
    setTimeout(() => {
      Sentry.captureMessage('Custom test message from Sentry test page', 'info');
      setTestResult({ message: 'Custom event sent to Sentry successfully', type: 'success' });
    }, 500);
  };

  const triggerWarning = () => {
    setLastTriggered('warning');
    setTestResult({ message: 'Sending warning...', type: 'loading' });
    setTimeout(() => {
      Sentry.captureMessage('Test warning from Sentry test page', 'warning');
      setTestResult({ message: 'Warning sent to Sentry successfully', type: 'success' });
    }, 500);
  };

  const triggerWithContext = () => {
    setLastTriggered('context');
    setTestResult({ message: 'Sending error with context...', type: 'loading' });
    setTimeout(() => {
      Sentry.withScope((scope) => {
        scope.setTag('test-page', 'sentry-test');
        scope.setContext('test-data', {
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
        });
        scope.setLevel('error');
        Sentry.captureException(new Error('Test error with custom context'));
      });
      setTestResult({ message: 'Error with context sent to Sentry successfully', type: 'success' });
    }, 500);
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto py-20 px-6">
        {/* Header */}
        <div className="mb-16">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2">
            Sentry Test
          </h1>
          <p className="text-gray-500">
            Verify error tracking is working correctly
          </p>
        </div>

        {/* Test Cards */}
        <div className="space-y-3 mb-12">
          <TestButton
            onClick={triggerClientError}
            title="Client Error"
            description="Caught client-side exception"
            isActive={lastTriggered === 'client'}
          />

          <TestButton
            onClick={triggerUncaughtError}
            title="Uncaught Error"
            description="Unhandled exception"
            isActive={lastTriggered === 'uncaught'}
          />

          <TestButton
            onClick={triggerServerError}
            title="Server Error"
            description="API route exception"
            isActive={lastTriggered === 'server'}
          />

          <TestButton
            onClick={triggerCustomEvent}
            title="Custom Event"
            description="Info message"
            isActive={lastTriggered === 'custom'}
          />

          <TestButton
            onClick={triggerWarning}
            title="Warning Event"
            description="Warning message"
            isActive={lastTriggered === 'warning'}
          />

          <TestButton
            onClick={triggerWithContext}
            title="Context Data"
            description="Error with tags and metadata"
            isActive={lastTriggered === 'context'}
          />
        </div>

        {/* Result */}
        {testResult && (
          <div className={`px-4 py-3 rounded border text-sm mb-8 ${
            testResult.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : testResult.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}>
            {testResult.message}
          </div>
        )}

        {/* Info */}
        <div className="text-sm text-gray-500 border-t pt-6">
          Check your Sentry dashboard to verify events were captured. May take a few seconds to appear.
        </div>
      </div>
    </div>
  );
}

interface TestButtonProps {
  onClick: () => void;
  title: string;
  description: string;
  isActive?: boolean;
}

function TestButton({ onClick, title, description, isActive }: TestButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-left border rounded hover:border-gray-300 transition-colors ${
        isActive ? 'border-gray-900 bg-gray-50' : 'border-gray-200'
      }`}
    >
      <div>
        <div className="text-sm font-medium text-gray-900">{title}</div>
        <div className="text-xs text-gray-500 mt-0.5">{description}</div>
      </div>
      <svg
        className="w-4 h-4 text-gray-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}
