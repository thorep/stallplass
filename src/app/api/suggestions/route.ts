import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, title, description } = body;

    // Validate required fields
    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    if (description.length > 2000) {
      return NextResponse.json(
        { error: 'Description must be less than 2000 characters' },
        { status: 400 }
      );
    }

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

    // Create GitHub issue
    const issueTitle = title?.trim() || (type === 'bug' ? 'Bug Report' : 'Feature Request');
    const issueBody = description.trim();
    const labels = type === 'bug' ? ['bug', 'public'] : ['suggestion', 'public'];

    const githubResponse = await fetch(
      `https://api.github.com/repos/${repoOwner}/${repoName}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: issueTitle,
          body: issueBody,
          labels: labels,
        }),
      }
    );

    if (!githubResponse.ok) {
      const errorData = await githubResponse.json().catch(() => ({}));
      logger.error('GitHub API error:', errorData);
      return NextResponse.json(
        { error: 'Failed to create GitHub issue' },
        { status: 500 }
      );
    }

    const githubIssue = await githubResponse.json();

    return NextResponse.json({ 
      success: true,
      issue: {
        id: githubIssue.number,
        url: githubIssue.html_url,
        type: type,
        createdAt: githubIssue.created_at,
      }
    });
  } catch (error) {
    logger.error('Error creating GitHub issue:', error);
    return NextResponse.json(
      { error: 'Failed to create suggestion' },
      { status: 500 }
    );
  }
}