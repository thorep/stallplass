import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
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

    // Fetch issues with "public" label
    const githubResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues?labels=public&state=all&sort=created&direction=desc`,
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
        { error: 'Failed to fetch GitHub issues' },
        { status: 500 }
      );
    }

    const issues = await githubResponse.json();

    // Transform the data to include only what we need
    const transformedIssues = issues.map((issue: {
      number: number;
      title: string;
      body: string;
      state: string;
      labels: Array<{ name: string; color: string }>;
      created_at: string;
      updated_at: string;
      html_url: string;
      comments: number;
    }) => ({
      id: issue.number,
      title: issue.title,
      body: issue.body,
      state: issue.state,
      labels: issue.labels.map((label) => ({
        name: label.name,
        color: label.color,
      })),
      createdAt: issue.created_at,
      updatedAt: issue.updated_at,
      url: issue.html_url,
      commentsCount: issue.comments,
    }));

    return NextResponse.json({ issues: transformedIssues });
  } catch (error) {
    logger.error('Error fetching GitHub issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}