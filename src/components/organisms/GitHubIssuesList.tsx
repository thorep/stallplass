'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useGetGitHubIssues, useGetGitHubIssueComments, type GitHubIssue } from '@/hooks/useGitHubIssues';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, MessageCircle, Calendar, GitBranch } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GitHubIssuesList() {
  const { data: issues, isLoading, error } = useGetGitHubIssues();
  const [expandedIssues, setExpandedIssues] = useState<Set<number>>(new Set());
  const [showClosed, setShowClosed] = useState(false);

  const toggleIssue = (issueId: number) => {
    const newExpanded = new Set(expandedIssues);
    if (newExpanded.has(issueId)) {
      newExpanded.delete(issueId);
    } else {
      newExpanded.add(issueId);
    }
    setExpandedIssues(newExpanded);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-gray-100 rounded-lg p-4 mb-4">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Kunne ikke laste inn GitHub issues. Prøv igjen senere.</p>
      </div>
    );
  }

  if (!issues || issues.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
        <GitBranch className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <p className="text-gray-600">Ingen offentlige issues funnet.</p>
      </div>
    );
  }

  // Filter issues based on showClosed state
  const filteredIssues = showClosed 
    ? issues 
    : issues.filter(issue => issue.state === 'open');

  const openCount = issues.filter(issue => issue.state === 'open').length;
  const closedCount = issues.filter(issue => issue.state === 'closed').length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-gray-600" />
          <h2 className="text-h2 font-semibold text-gray-900">
            Utviklingslogg og tilbakemeldinger
          </h2>
          <Badge variant="secondary" className="ml-2">
            {filteredIssues.length} av {issues.length}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            {openCount} åpne
          </Badge>
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
            {closedCount} lukkede
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowClosed(!showClosed)}
            className="ml-2"
          >
            {showClosed ? 'Skjul lukkede' : 'Vis lukkede'}
          </Button>
        </div>
      </div>
      
      <p className="text-body text-gray-600 mb-6">
        Her kan du følge med på hva som blir jobbet med og fikset på Stallplass.no. 
        Alle forslag og feilrapporter som sendes inn vises her.
      </p>

      <div className="space-y-3">
        {filteredIssues.map((issue) => (
          <IssueCard
            key={issue.id}
            issue={issue}
            isExpanded={expandedIssues.has(issue.id)}
            onToggle={() => toggleIssue(issue.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface IssueCardProps {
  issue: GitHubIssue;
  isExpanded: boolean;
  onToggle: () => void;
}

function IssueCard({ issue, isExpanded, onToggle }: IssueCardProps) {
  const { data: comments, isLoading: commentsLoading } = useGetGitHubIssueComments(
    isExpanded ? issue.id : null
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nb-NO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getLabelColor = (color: string) => {
    // Convert GitHub label color to a more visible format
    return `#${color}`;
  };

  return (
    <Card className="border border-gray-200 hover:border-gray-300 transition-colors">
      <Collapsible open={isExpanded} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <Badge 
                    variant={issue.state === 'open' ? 'default' : 'secondary'}
                    className={cn(
                      issue.state === 'open' 
                        ? 'bg-green-100 text-green-800 border-green-200' 
                        : 'bg-purple-100 text-purple-800 border-purple-200'
                    )}
                  >
                    {issue.state === 'open' ? 'Åpen' : 'Lukket'}
                  </Badge>
                  <span className="text-body-sm text-gray-500">#{issue.id}</span>
                </div>
                
                <CardTitle className="text-body-lg font-medium text-gray-900 mb-2 pr-4">
                  {issue.title}
                </CardTitle>
                
                <div className="flex items-center gap-4 text-body-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(issue.createdAt)}
                  </div>
                  {issue.commentsCount > 0 && (
                    <div className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {issue.commentsCount} kommentarer
                    </div>
                  )}
                </div>
                
                {issue.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {issue.labels
                      .filter((label) => label.name !== 'public') // Hide public label as it's implied
                      .map((label) => (
                      <Badge
                        key={label.name}
                        variant="outline"
                        className="text-xs"
                        style={{
                          borderColor: getLabelColor(label.color),
                          color: getLabelColor(label.color),
                        }}
                      >
                        {label.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {issue.body && (
              <div className="mb-4 p-3 bg-gray-50 rounded border">
                <div className="text-body whitespace-pre-wrap text-gray-700">
                  {issue.body}
                </div>
              </div>
            )}
            
            {issue.commentsCount > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Kommentarer ({issue.commentsCount})
                </h4>
                
                {commentsLoading ? (
                  <div className="space-y-2">
                    {[...Array(Math.min(3, issue.commentsCount))].map((_, i) => (
                      <div key={i} className="animate-pulse">
                        <div className="bg-gray-100 rounded p-3">
                          <div className="h-3 bg-gray-200 rounded w-1/4 mb-2"></div>
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  comments && comments.length > 0 && (
                    <div className="space-y-3">
                      {comments.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded border p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Image
                              src={comment.author.avatarUrl}
                              alt={comment.author.login}
                              width={20}
                              height={20}
                              className="w-5 h-5 rounded-full"
                            />
                            <span className="font-medium text-body-sm text-gray-900">
                              {comment.author.login}
                            </span>
                            <span className="text-body-sm text-gray-500">
                              {formatDate(comment.createdAt)}
                            </span>
                          </div>
                          <div className="text-body text-gray-700 whitespace-pre-wrap">
                            {comment.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                )}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}