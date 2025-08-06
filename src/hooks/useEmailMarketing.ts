import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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

interface SendEmailParams {
  subject: string;
  content: string;
}

interface SendEmailResponse {
  success: boolean;
  sentCount: number;
  failedCount: number;
  failedEmails: string[];
}

export function useEmailMarketingRecipients() {
  return useQuery<EmailMarketingResponse>({
    queryKey: ['email-marketing-recipients'],
    queryFn: async () => {
      const response = await fetch('/api/admin/email-marketing', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch email marketing recipients');
      }
      
      return response.json();
    },
  });
}

export function useSendMarketingEmail() {
  const queryClient = useQueryClient();
  
  return useMutation<SendEmailResponse, Error, SendEmailParams>({
    mutationFn: async ({ subject, content }) => {
      const response = await fetch('/api/admin/email-marketing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ subject, content }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to send marketing email');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Optionally refresh recipients list after sending
      queryClient.invalidateQueries({ queryKey: ['email-marketing-recipients'] });
    },
  });
}