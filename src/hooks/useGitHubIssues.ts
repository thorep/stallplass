import { useQuery } from '@tanstack/react-query';

export interface GitHubIssue {
  id: number;
  title: string;
  body: string;
  state: 'open' | 'closed';
  labels: Array<{
    name: string;
    color: string;
  }>;
  createdAt: string;
  updatedAt: string;
  url: string;
  commentsCount: number;
}

export interface GitHubComment {
  id: number;
  body: string;
  createdAt: string;
  updatedAt: string;
  author: {
    login: string;
    avatarUrl: string;
  };
}

export function useGetGitHubIssues() {
  return useQuery({
    queryKey: ['github-issues'],
    queryFn: async (): Promise<GitHubIssue[]> => {
      const response = await fetch('/api/github/issues');
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub issues');
      }
      const data = await response.json();
      return data.issues;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}

export function useGetGitHubIssueComments(issueNumber: number | null) {
  return useQuery({
    queryKey: ['github-issue-comments', issueNumber],
    queryFn: async (): Promise<GitHubComment[]> => {
      if (!issueNumber) return [];
      
      const response = await fetch(`/api/github/issues/${issueNumber}/comments`);
      if (!response.ok) {
        throw new Error('Failed to fetch GitHub issue comments');
      }
      const data = await response.json();
      return data.comments;
    },
    enabled: !!issueNumber,
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
  });
}