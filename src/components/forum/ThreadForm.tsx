'use client';

import { ForumPostForm } from './ForumPostForm';
import { useCreateForumThread, useUpdateForumPost } from '@/hooks/useForum';
import type { ForumCategory, CreateThreadInput, ForumThread } from '@/types/forum';
import type { User } from '@supabase/supabase-js';

interface ThreadFormProps {
  categories: ForumCategory[];
  user: User;
  initialData?: Partial<ForumThread>;
  isEditing?: boolean;
  onSuccess?: (thread: ForumThread) => void;
  onCancel?: () => void;
  className?: string;
  hideCategorySelect?: boolean;
}

export function ThreadForm({
  categories,
  user,
  initialData,
  isEditing = false,
  onSuccess,
  onCancel,
  className,
  hideCategorySelect = false
}: ThreadFormProps) {
  const createThread = useCreateForumThread();
  const updateThread = useUpdateForumPost(initialData?.id || '', true);

  const handleSubmitThread = async (data: CreateThreadInput): Promise<ForumThread> => {
    if (isEditing && initialData?.id) {
      return await updateThread.mutateAsync({
        title: data.title,
        content: data.content,
        categoryId: data.categoryId
      });
    } else {
      return await createThread.mutateAsync(data);
    }
  };

  return (
    <ForumPostForm
      mode="thread"
      categories={categories}
      user={user}
      initialData={initialData}
      isEditing={isEditing}
      hideCategorySelect={hideCategorySelect}
      onSuccess={onSuccess as ((result: ForumThread | import('@/types/forum').ForumReply) => void) | undefined}
      onCancel={onCancel}
      onSubmitThread={handleSubmitThread}
      className={className}
    />
  );
}

// Keep ThreadPreview as it might be used elsewhere
interface ThreadPreviewProps {
  title: string;
  content: string;
  category?: ForumCategory | null;
  tags: string[];
  user: User;
  className?: string;
}

export function ThreadPreview({
  title,
  content,
  category,
  tags,
  className
}: ThreadPreviewProps) {
  return (
    <div>
      {/* ThreadPreview implementation would go here */}
      {/* For now, just a placeholder since it's not directly related to the form unification */}
    </div>
  );
}