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

export function ThreadPreview({ title, content, category, tags, user, className }: ThreadPreviewProps) {
  type UserWithNicknameMeta = User & { user_metadata?: { nickname?: string } };
  const nickname = (user as UserWithNicknameMeta).user_metadata?.nickname;
  const author = nickname || user.email || "";
  return (
    <div className={className}>
      <h3 className="text-base font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground line-clamp-3">{content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-gray-600">
        <span>{category?.name ?? "Uten kategori"}</span>
        {tags.map((t, i) => (
          <span key={i} className="rounded-full bg-muted px-2 py-0.5">{t}</span>
        ))}
        {author ? <span className="ml-auto">Av {author}</span> : null}
      </div>
    </div>
  );
}
