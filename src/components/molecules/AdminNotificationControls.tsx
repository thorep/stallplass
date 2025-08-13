'use client';

import { useState } from 'react';
import { EnvelopeIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface EmailResult {
  email?: string;
  userId?: string;
  success: boolean;
  error?: string;
  messageId?: string;
  unreadCount?: number;
  conversationCount?: number;
}

export function AdminNotificationControls() {
  const [isSending, setIsSending] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: {
      totalUsersWithUnread: number;
      emailsSent: number;
      results: EmailResult[];
    };
  } | null>(null);

  const handleSendNotifications = async () => {
    setIsSending(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/send-unread-notifications', {
        method: 'POST',
        credentials: 'include',
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: `E-poster sendt! ${data.emailsSent} av ${data.totalRecipientsWithUnread} brukere med uleste meldinger ble varslet.`,
          details: {
            totalUsersWithUnread: data.totalRecipientsWithUnread,
            emailsSent: data.emailsSent,
            results: data.results || [],
          },
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Kunne ikke sende varslinger',
        });
      }
    } catch (error) {
      console.error('Error sending notifications:', error);
      setResult({
        success: false,
        message: 'En feil oppstod under sending av varslinger',
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center mb-4">
        <EnvelopeIcon className="h-6 w-6 text-indigo-600 mr-2" />
        <h2 className="text-lg font-semibold text-slate-800">Varslinger for uleste meldinger</h2>
      </div>
      
      <p className="text-sm text-slate-600 mb-4">
        Send e-postvarslinger til alle brukere som har uleste meldinger i sine samtaler.
      </p>

      <button
        onClick={handleSendNotifications}
        disabled={isSending}
        className={`w-full py-2 px-4 rounded-lg font-medium transition-colors ${
          isSending
            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
      >
        {isSending ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sender varslinger...
          </span>
        ) : (
          'Send varslinger til brukere'
        )}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${
          result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
        }`}>
          <p className="text-sm font-medium">{result.message}</p>
          {result.details && (
            <div className="mt-2 text-xs">
              <p>• Brukere med uleste meldinger: {result.details.totalUsersWithUnread}</p>
              <p>• E-poster sendt: {result.details.emailsSent}</p>
              
              {result.details.results.length > 0 && (
                <div className="mt-3 space-y-1">
                  <p className="font-semibold text-sm mb-2">Detaljert rapport:</p>
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {result.details.results.map((emailResult, index) => (
                      <div key={index} className="flex items-center space-x-2 text-xs">
                        {emailResult.success ? (
                          <CheckCircleIcon className="h-4 w-4 text-green-600 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="h-4 w-4 text-red-600 flex-shrink-0" />
                        )}
                        <span className="flex-1">
                          {emailResult.email || `Bruker ${emailResult.userId}`}
                          {emailResult.success && emailResult.unreadCount && (
                            <span className="text-slate-500 ml-2">
                              ({emailResult.unreadCount} {emailResult.unreadCount === 1 ? 'melding' : 'meldinger'} i {emailResult.conversationCount} {emailResult.conversationCount === 1 ? 'samtale' : 'samtaler'})
                            </span>
                          )}
                        </span>
                        {!emailResult.success && emailResult.error && (
                          <span className="text-red-600 text-xs">({emailResult.error})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}