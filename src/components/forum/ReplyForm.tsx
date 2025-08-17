'use client';

import { ForumPostForm } from './ForumPostForm';
import { useCreateForumReply } from '@/hooks/useForum';
import type { CreateReplyInput, ForumReply } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ReplyFormProps {
  threadId: string;
  user: User | null;
  quotedPost?: ForumReply | null;
  onClearQuote?: () => void;
  onSuccess?: () => void;
  className?: string;
  placeholder?: string;
  autoFocus?: boolean;
  compact?: boolean;
  showAvatar?: boolean;
}

export function ReplyForm({
  threadId,
  user,
  quotedPost,
  onClearQuote,
  onSuccess,
  className,
  placeholder,
  autoFocus = false,
  compact = false,
  showAvatar = true
}: ReplyFormProps) {
  const createReply = useCreateForumReply(threadId);

  const handleSubmitReply = async (data: CreateReplyInput): Promise<ForumReply> => {
    return await createReply.mutateAsync(data);
  };

  const handleSuccess = () => {
    onSuccess?.();
  };

  return (
    <ForumPostForm
      mode="reply"
      threadId={threadId}
      user={user}
      quotedPost={quotedPost}
      onClearQuote={onClearQuote}
      placeholder={placeholder}
      autoFocus={autoFocus}
      compact={compact}
      showAvatar={showAvatar}
      onSuccess={handleSuccess}
      onSubmitReply={handleSubmitReply}
      className={className}
    />
  );
}