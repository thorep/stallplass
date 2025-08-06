'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useHorseShares, useShareHorse, useUnshareHorse } from '@/hooks/useHorseSharing';
import { useSearchUsers, SearchUser } from '@/hooks/useUserSearch';
import { Users, Share, UserPlus, X, Loader2, Search } from 'lucide-react';
import { toast } from 'sonner';

interface HorseSharingProps {
  horseId: string;
  isOwner: boolean;
}

export function HorseSharing({ horseId, isOwner }: HorseSharingProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Hide search results when query is cleared
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowSearchResults(false);
    } else {
      setShowSearchResults(true);
    }
  }, [searchQuery]);

  const { data: shares, isLoading: sharesLoading } = useHorseShares(horseId);
  const { data: searchResults, isLoading: searchLoading } = useSearchUsers(
    debouncedQuery,
    showSearchResults && debouncedQuery.trim().length >= 1
  );
  const shareHorse = useShareHorse();
  const unshareHorse = useUnshareHorse();

  // Don't render if user is not the owner
  if (!isOwner) {
    return null;
  }

  const handleShare = async (user: SearchUser) => {
    try {
      await shareHorse.mutateAsync({
        horseId,
        data: {
          sharedWithId: user.id,
          permissions: ['VIEW', 'ADD_LOGS'], // Default permissions - shared users can only add logs
        },
      });
      
      toast.success(`Hesten er delt med ${user.nickname}`);
      setSearchQuery('');
      setShowSearchResults(false);
    } catch (error) {
      console.error('Error sharing horse:', error);
      if (error instanceof Error) {
        if (error.message.includes('already shared')) {
          toast.error('Hesten er allerede delt med denne brukeren');
        } else if (error.message.includes('User not found')) {
          toast.error('Brukeren ble ikke funnet');
        } else {
          toast.error('Kunne ikke dele hesten. Prøv igjen.');
        }
      } else {
        toast.error('Kunne ikke dele hesten. Prøv igjen.');
      }
    }
  };

  const handleUnshare = async (shareId: string, userNickname: string) => {
    const share = shares?.find(s => s.id === shareId);
    if (!share) return;

    try {
      await unshareHorse.mutateAsync({
        horseId,
        data: {
          sharedWithId: share.sharedWithId,
        },
      });
      
      toast.success(`Tilgangen til ${userNickname} er fjernet`);
    } catch (error) {
      console.error('Error unsharing horse:', error);
      toast.error('Kunne ikke fjerne tilgangen. Prøv igjen.');
    }
  };

  const getDisplayName = (user: { nickname: string; firstname: string | null; lastname: string | null }) => {
    const fullName = [user.firstname, user.lastname].filter(Boolean).join(' ');
    return fullName ? `${user.nickname} (${fullName})` : user.nickname;
  };

  const filteredSearchResults = searchResults?.filter(user => 
    !shares?.some(share => share.sharedWith.id === user.id)
  ) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share className="h-5 w-5" />
          Del hest
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search for users to share with */}
        <div className="space-y-4">
          <div>
            <label className="block text-body-sm font-medium text-gray-700 mb-2">
              Søk etter brukere å dele med
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Søk på kallenavn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 text-base h-12 border-2 focus:border-blue-500"
              />
              {searchLoading && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                </div>
              )}
            </div>
          </div>

          {/* Search Results */}
          {showSearchResults && (
            <div className="space-y-2">
              {searchLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-body-sm text-gray-500">Søker...</span>
                </div>
              ) : filteredSearchResults.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-body-sm text-gray-600">Søkeresultater:</p>
                  {filteredSearchResults.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-body font-medium">{getDisplayName(user)}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleShare(user)}
                        disabled={shareHorse.isPending}
                        className="h-8 px-3 text-xs"
                      >
                        {shareHorse.isPending ? (
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        ) : (
                          <UserPlus className="h-3 w-3 mr-1" />
                        )}
                        Del
                      </Button>
                    </div>
                  ))}
                </div>
              ) : debouncedQuery.trim().length >= 1 ? (
                <div className="text-center py-4">
                  <p className="text-body-sm text-gray-500">Ingen brukere funnet</p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Current Shares */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-body font-medium">Delt med ({shares?.length || 0})</h4>
            {sharesLoading && (
              <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
            )}
          </div>

          {sharesLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-gray-400" />
                <p className="text-body-sm text-gray-500">Laster delinger...</p>
              </div>
            </div>
          ) : shares && shares.length > 0 ? (
            <div className="space-y-3">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Users className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium">
                        {getDisplayName(share.sharedWith)}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        {share.permissions.map((permission) => (
                          <Badge key={permission} variant="secondary" className="text-xs">
                            {permission === 'VIEW' && 'Vis'}
                            {permission === 'EDIT' && 'Rediger alt'}
                            {permission === 'ADD_LOGS' && 'Legg til logg'}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-body-sm text-gray-500 mt-1">
                        Delt {new Date(share.createdAt).toLocaleDateString('no-NO')}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnshare(share.id, share.sharedWith.nickname)}
                    disabled={unshareHorse.isPending}
                    className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {unshareHorse.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="p-4 bg-gray-50 rounded-lg">
                <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-body text-gray-600 mb-1">Ingen delinger ennå</p>
                <p className="text-body-sm text-gray-500">
                  Søk etter brukere for å dele hesten din
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}