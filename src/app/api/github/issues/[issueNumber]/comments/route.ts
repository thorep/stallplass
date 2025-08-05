import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

interface RouteParams {
  params: Promise<{
    issueNumber: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { issueNumber } = await params;

    // Validate GitHub token
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      logger.error('GitHub token not configured');
      return NextResponse.json(
        { error: 'GitHub integration not configured' },
        { status: 500 }
      );
    }

    // Get repository info from environment
    const repoOwner = process.env.GITHUB_REPO_OWNER || 'thorprestboen';
    const repoName = process.env.GITHUB_REPO_NAME || 'stallplass';

    // Fetch comments for the specific issue
    const githubResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues/${issueNumber}/comments`,
      {
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
        },
      }
    );

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json().catch(() => ({}));
      logger.error('GitHub API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to fetch GitHub issue comments' },
        { status: 500 }
      );
    }

    const comments = await githubResponse.json();

    // Transform the data to include only what we need
    const transformedComments = comments.map((comment: {
      id: number;
      body: string;
      created_at: string;
      updated_at: string;
      user: { login: string; avatar_url: string };
    }) => ({
      id: comment.id,
      body: comment.body,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: {
        login: comment.user.login,
        avatarUrl: comment.user.avatar_url,
      },
    }));

    return NextResponse.json({ comments: transformedComments });
  } catch (error) {
    logger.error('Error fetching GitHub issue comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}