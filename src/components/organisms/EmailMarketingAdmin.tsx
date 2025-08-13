"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { 
  EnvelopeIcon, 
  PaperAirplaneIcon,
  UserGroupIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";
import { toast } from "sonner";

interface EmailRecipient {
  id: string;
  email: string;
  firstname: string | null;
  lastname: string | null;
  nickname: string | null;
}

interface EmailMarketingResponse {
  recipients: EmailRecipient[];
  totalCount: number;
}

interface SendEmailResponse {
  success: boolean;
  sentCount: number;
  failedCount: number;
  failedEmails: string[];
}

export function EmailMarketingAdmin() {
  const [subject, setSubject] = useState("");
  const [content, setContent] = useState("");
  const [showRecipients, setShowRecipients] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Fetch recipients
  const { data, isLoading, error, refetch } = useQuery<EmailMarketingResponse>({
    queryKey: ["email-marketing-recipients"],
    queryFn: async () => {
      const response = await fetch("/api/admin/email-marketing", {
        credentials: 'include',
      });
      if (!response.ok) {
        throw new Error("Failed to fetch recipients");
      }
      return response.json();
    },
  });

  // Send email mutation
  const sendEmailMutation = useMutation({
    mutationFn: async () => {
      setIsSending(true);
      const response = await fetch("/api/admin/email-marketing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: 'include',
        body: JSON.stringify({
          subject,
          content,
        }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to send email");
      }
      
      return response.json() as Promise<SendEmailResponse>;
    },
    onSuccess: (data) => {
      setIsSending(false);
      toast.success(`E-post sendt til ${data.sentCount} mottakere!`);
      
      if (data.failedCount > 0) {
        toast.error(`Kunne ikke sende til ${data.failedCount} mottakere`);
      }
      
      // Clear form
      setSubject("");
      setContent("");
    },
    onError: (error) => {
      setIsSending(false);
      toast.error("Kunne ikke sende e-post");
      console.error("Email send error:", error);
    },
  });

  const handleSendEmail = () => {
    if (!subject.trim()) {
      toast.error("Vennligst skriv inn et emne");
      return;
    }
    
    if (!content.trim()) {
      toast.error("Vennligst skriv inn innhold");
      return;
    }
    
    if (!data?.totalCount) {
      toast.error("Ingen mottakere funnet");
      return;
    }
    
    if (confirm(`Er du sikker på at du vil sende e-post til ${data.totalCount} mottakere?\n\nVi sender én e-post per sekund for å respektere hastighetsbegrensninger. Dette kan ta opptil ${data.totalCount} sekunder.`)) {
      sendEmailMutation.mutate();
    }
  };

  const displayName = (recipient: EmailRecipient) => {
    if (recipient.nickname) return recipient.nickname;
    if (recipient.firstname && recipient.lastname) {
      return `${recipient.firstname} ${recipient.lastname}`;
    }
    if (recipient.firstname) return recipient.firstname;
    if (recipient.lastname) return recipient.lastname;
    return recipient.email;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center mb-6">
          <EnvelopeIcon className="h-8 w-8 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-2xl font-bold text-slate-800">E-postmarkedsføring</h2>
            <p className="text-slate-600">Send e-post til brukere som har samtykket til markedsføring</p>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-indigo-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <UserGroupIcon className="h-6 w-6 text-indigo-600 mr-2" />
              <span className="text-indigo-900 font-medium">
                Mottakere med samtykke:
              </span>
            </div>
            <span className="text-2xl font-bold text-indigo-600">
              {isLoading ? "..." : data?.totalCount || 0}
            </span>
          </div>
        </div>

        {/* Email Form */}
        <div className="space-y-4">
          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-slate-700 mb-1">
              Emne
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Skriv inn e-postens emne..."
            />
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-slate-700 mb-1">
              Innhold (HTML støttes)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Skriv inn e-postens innhold... Du kan bruke HTML-formatering."
            />
            <p className="text-sm text-slate-500 mt-1">
              Tips: Du kan bruke HTML-tagger som &lt;b&gt;fet tekst&lt;/b&gt;, &lt;a href=&quot;&quot;&gt;lenker&lt;/a&gt;, osv.
            </p>
          </div>

          {/* Preview */}
          {content && (
            <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
              <h3 className="text-sm font-medium text-slate-700 mb-2">Forhåndsvisning:</h3>
              <div className="bg-white rounded border border-slate-200 p-4">
                <div className="bg-indigo-600 text-white p-4 rounded-t text-center">
                  <h1 className="text-xl font-bold">Stallplass.no</h1>
                </div>
                <div 
                  className="p-4 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4">
            <button
              onClick={() => setShowRecipients(!showRecipients)}
              className="text-indigo-600 hover:text-indigo-700 font-medium text-sm flex items-center"
            >
              <UserGroupIcon className="h-4 w-4 mr-1" />
              {showRecipients ? "Skjul mottakere" : "Vis mottakere"}
            </button>

            <div className="flex space-x-3">
              <button
                onClick={() => refetch()}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
              >
                Oppdater mottakerliste
              </button>
              
              <button
                onClick={handleSendEmail}
                disabled={isSending || !data?.totalCount}
                className={`px-6 py-2 rounded-lg flex items-center transition-colors ${
                  isSending || !data?.totalCount
                    ? "bg-slate-300 text-slate-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
              >
                {isSending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sender e-post (1 per sekund)...
                  </>
                ) : (
                  <>
                    <PaperAirplaneIcon className="h-4 w-4 mr-2" />
                    Send e-post til {data?.totalCount || 0}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Recipients List */}
        {showRecipients && (
          <div className="mt-6 border-t pt-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">
              Mottakerliste ({data?.totalCount || 0} personer)
            </h3>
            
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : error ? (
              <div className="text-red-600 text-center py-4">
                Kunne ikke laste mottakere
              </div>
            ) : data?.recipients && data.recipients.length > 0 ? (
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">Navn</th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-slate-700">E-post</th>
                      <th className="px-4 py-2 text-center text-sm font-medium text-slate-700">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {data.recipients.map((recipient) => (
                      <tr key={recipient.id} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-sm text-slate-900">
                          {displayName(recipient)}
                        </td>
                        <td className="px-4 py-2 text-sm text-slate-600">
                          {recipient.email}
                        </td>
                        <td className="px-4 py-2 text-center">
                          <CheckCircleIcon className="h-5 w-5 text-green-500 inline" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                Ingen mottakere med e-postsamtykke funnet
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}