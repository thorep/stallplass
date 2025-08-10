"use client";

import Button from "@/components/atoms/Button";
import FeedbackPill from "@/components/molecules/FeedbackPill";
import { useConversations } from "@/hooks/useChat";
import { useProfile } from "@/hooks/useUser";
import { trackUserAuth } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import { createClient } from "@/utils/supabase/client";
import {
  Bars3Icon,
  ChatBubbleLeftRightIcon,
  CogIcon,
  MagnifyingGlassIcon,
  Squares2X2Icon,
  UserIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { HorseIcon } from "@/components/icons/HorseIcon";
import { Badge, Box, IconButton, Stack } from "@mui/material";
import type { User } from "@supabase/supabase-js";
import { MessageSquarePlus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Official Supabase client-side auth pattern
  useEffect(() => {
    const supabase = createClient();

    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Sign out function using official pattern
  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    // Track logout
    trackUserAuth('logout');
    // Redirect to home page after logout
    router.push("/");
  };

  // Fetch profile data from database to get the actual name
  const { data: dbProfile } = useProfile(user?.id);

  // Use TanStack Query for conversations with automatic polling
  const { data: conversations = [] } = useConversations(user?.id ? Number(user.id) : undefined);

  // Get admin status from database profile data
  const currentProfile = {
    isAdmin: dbProfile?.isAdmin || false,
  };

  // Calculate unread count from conversations
  const unreadCount = useMemo(() => {
    if (!Array.isArray(conversations)) return 0;
    return conversations.reduce((sum: number, conv) => {
      // Type the conversation properly
      const conversation = conv as { _count?: { messages?: number } };
      return sum + (conversation._count?.messages || 0);
    }, 0);
  }, [conversations]);

  // Show loading state while auth is loading
  if (loading) {
    return (
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-[9999]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center">
              <Link href="/hjem" className="flex items-center space-x-2">
                <Image
                  src="/logo.svg"
                  alt="Stallplass logo"
                  width={32}
                  height={32}
                  className="h-8 w-8 flex-shrink-0 -translate-y-0.5"
                  style={{
                    filter:
                      "brightness(0) saturate(100%) invert(32%) sepia(66%) saturate(1347%) hue-rotate(222deg) brightness(91%) contrast(91%)",
                  }}
                />
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Stallplass
                </span>
              </Link>
            </div>
            <div className="hidden lg:flex items-center space-x-4">
              <div className="h-8 w-16 bg-slate-200 rounded-md animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/60 sticky top-0 z-[9999]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/hjem" className="flex items-center space-x-2 group">
              <Image
                src="/logo.svg"
                alt="Stallplass logo"
                width={32}
                height={32}
                className="h-8 w-8 transition-opacity group-hover:opacity-80 flex-shrink-0 -translate-y-0.5"
                style={{
                  filter:
                    "brightness(0) saturate(100%) invert(32%) sepia(66%) saturate(1347%) hue-rotate(222deg) brightness(91%) contrast(91%)",
                }}
              />
              <span className="hidden sm:block text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                Stallplass
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-1">
            <Link
              href="/sok"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              Søk
            </Link>
            <Link
              href="/mine-hester"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              Mine Hester
            </Link>
            <Link
              href="/dashboard"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              Mine annonser
            </Link>
            <Link
              href="/forum"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              Forum
            </Link>
            <FeedbackPill className="ml-2" />
            {currentProfile?.isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <CogIcon className="h-4 w-4" />
                Admin
              </Link>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-2">
            {user ? (
              <>
                <Link
                  href="/meldinger"
                  className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200 relative"
                  title="Meldinger"
                >
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profil"
                  className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  title="Profil"
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
                <div className="flex items-center space-x-2">
                  <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {(dbProfile?.nickname || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700" data-cy="user-greeting">
                    Hei, {dbProfile?.nickname || ""}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  Logg ut
                </Button>
              </>
            ) : (
              <>
                <Link href="/logg-inn">
                  <Button variant="ghost" size="sm">
                    Logg inn
                  </Button>
                </Link>
                <Link href="/registrer">
                  <Button variant="primary" size="sm">
                    Registrer
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Quick Access Icons and Menu Button */}
          <Box className="lg:hidden flex-1">
            <Stack direction="row" spacing={0} alignItems="center" justifyContent="space-between">
              {/* Quick Access Icons - Always visible */}
              <Stack direction="row" spacing={0} alignItems="center" sx={{ flex: 1, justifyContent: 'space-evenly' }}>
                {/* Search Icon - Always available */}
                <Link href="/sok">
                  <IconButton
                    size="medium"
                    className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    title="Søk"
                  >
                    <MagnifyingGlassIcon className="h-6 w-6" />
                  </IconButton>
                </Link>

                {/* Dashboard Icon - Only when logged in */}
                {user ? (
                  <Link href="/dashboard">
                    <IconButton
                      size="medium"
                      className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                      title="Mine annonser"
                    >
                      <Squares2X2Icon className="h-6 w-6" />
                    </IconButton>
                  </Link>
                ) : (
                  <Link href="/logg-inn">
                    <IconButton
                      size="medium"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                      title="Logg inn for mine annonser"
                    >
                      <Squares2X2Icon className="h-6 w-6" />
                    </IconButton>
                  </Link>
                )}

                {/* My Horses Icon - Only when logged in */}
                {user ? (
                  <Link href="/mine-hester">
                    <IconButton
                      size="medium"
                      className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                      title="Mine hester"
                    >
                      <HorseIcon className="h-6 w-6" />
                    </IconButton>
                  </Link>
                ) : (
                  <Link href="/logg-inn">
                    <IconButton
                      size="medium"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                      title="Logg inn for mine hester"
                    >
                      <HorseIcon className="h-6 w-6" />
                    </IconButton>
                  </Link>
                )}

                {/* Messages Icon - Only when logged in */}
                {user ? (
                  <Link href="/meldinger">
                    <IconButton
                      size="medium"
                      className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                      title="Meldinger"
                    >
                      <Badge
                        badgeContent={unreadCount > 99 ? "99+" : unreadCount}
                        color="error"
                        invisible={unreadCount === 0}
                        sx={{ 
                          '& .MuiBadge-badge': { 
                            fontSize: '0.7rem', 
                            minWidth: '18px', 
                            height: '18px' 
                          } 
                        }}
                      >
                        <ChatBubbleLeftRightIcon className="h-6 w-6" />
                      </Badge>
                    </IconButton>
                  </Link>
                ) : (
                  <Link href="/logg-inn">
                    <IconButton
                      size="medium"
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                      title="Logg inn for meldinger"
                    >
                      <ChatBubbleLeftRightIcon className="h-6 w-6" />
                    </IconButton>
                  </Link>
                )}
              </Stack>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all duration-200"
              >
                {mobileMenuOpen ? (
                  <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Bars3Icon className="h-6 w-6" aria-hidden="true" />
                )}
              </button>
            </Stack>
          </Box>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden animate-fade-in">
            <div className="px-4 pt-2 pb-4 space-y-2 bg-white/95 backdrop-blur-sm border-t border-slate-200/60">
              <Link
                href="/sok"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Søk
              </Link>
              <Link
                href="/mine-hester"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mine Hester
              </Link>
              <Link
                href="/dashboard"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Mine annonser
              </Link>
              <Link
                href="/forum"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Forum
              </Link>
              <Link
                href="/forslag"
                className={cn(
                  "inline-flex items-center gap-2 mx-3 my-1 px-3 py-2 bg-gradient-to-r from-indigo-50 to-emerald-50 hover:from-indigo-100 hover:to-emerald-100 text-gray-700 hover:text-gray-900 rounded-full text-sm font-medium transition-all duration-200 border border-gray-200/50"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                <MessageSquarePlus className="h-4 w-4" />
                <span>Meld feil eller forbedring</span>
              </Link>
              {currentProfile?.isAdmin && (
                <Link
                  href="/admin"
                  className="block px-3 py-2.5 text-base font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <CogIcon className="h-5 w-5" />
                  Admin
                </Link>
              )}
              {user && (
                <Link
                  href="/meldinger"
                  className={`block px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200 ${
                    unreadCount > 0
                      ? "bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100"
                      : "text-slate-700 hover:text-indigo-600 hover:bg-slate-100"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      Meldinger
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs font-medium">({unreadCount} nye)</span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </div>
                </Link>
              )}
              {user && (
                <Link
                  href="/profil"
                  className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center">
                    <UserIcon className="h-5 w-5 mr-2" />
                    Min profil
                  </div>
                </Link>
              )}

              {/* Mobile Auth Section */}
              <div className="pt-4 mt-4 border-t border-slate-200">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 px-3">
                      <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-white">
                          {(dbProfile?.nickname || user.user_metadata?.name || user.email || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {dbProfile?.nickname ||
                            user.user_metadata?.name ||
                            user.email?.split("@")[0]}
                        </div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      fullWidth
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      Logg ut
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link href="/logg-inn" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" fullWidth>
                        Logg inn
                      </Button>
                    </Link>
                    <Link href="/registrer" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" fullWidth>
                        Kom i gang
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}