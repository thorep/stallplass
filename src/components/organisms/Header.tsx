"use client";

import Button from "@/components/atoms/Button";
import { useAuth } from "@/lib/supabase-auth-context";
import { useConversations } from "@/hooks/useChat";
import { useUser } from "@/hooks/useUser";
import { useTranslation } from "@/lib/i18n/useTranslation";
import { Bars3Icon, XMarkIcon, ChatBubbleLeftRightIcon, CogIcon, UserIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { useState, useMemo } from "react";

export default function Header() {
  const { user, signOut, loading } = useAuth();
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Fetch user data from database to get the actual name
  const { data: dbUser } = useUser(user?.id);
  
  // Use TanStack Query for conversations with automatic polling
  const { data: conversations = [] } = useConversations(user?.id ? Number(user.id) : undefined);
  
  // Mock current user data - admin status would come from user metadata or separate query
  const currentUser = {
    isAdmin: user?.user_metadata?.role === 'admin' || false
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
              <Link href="/" className="flex items-center space-x-2">
                <Image 
                  src="/logo.svg" 
                  alt="Stallplass logo" 
                  width={32} 
                  height={32} 
                  className="h-8 w-8 flex-shrink-0 -translate-y-0.5"
                  style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(66%) saturate(1347%) hue-rotate(222deg) brightness(91%) contrast(91%)' }}
                />
                <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                  Stallplass
                </span>
              </Link>
            </div>
            <div className="hidden md:flex items-center space-x-4">
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
            <Link href="/" className="flex items-center space-x-2 group">
              <Image 
                src="/logo.svg" 
                alt="Stallplass logo" 
                width={32} 
                height={32} 
                className="h-8 w-8 transition-opacity group-hover:opacity-80 flex-shrink-0 -translate-y-0.5"
                style={{ filter: 'brightness(0) saturate(100%) invert(32%) sepia(66%) saturate(1347%) hue-rotate(222deg) brightness(91%) contrast(91%)' }}
              />
              <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-emerald-600 bg-clip-text text-transparent">
                Stallplass
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              {t('nav.home')}
            </Link>
            <Link
              href="/staller"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              {t('nav.stables')}
            </Link>
            <Link
              href="/tjenester"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              {t('nav.services')}
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                >
                  {t('nav.dashboard')}
                </Link>
              </>
            )}
            <Link
              href="/priser"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              {t('nav.pricing')}
            </Link>
            <Link
              href="/forslag"
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
            >
              Forslag
            </Link>
            {currentUser?.isAdmin && (
              <Link
                href="/admin"
                className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 flex items-center gap-2"
              >
                <CogIcon className="h-4 w-4" />
                {t('admin.title')}
              </Link>
            )}
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {user ? (
              <>
                <Link
                  href="/meldinger"
                  className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200 relative"
                  title={t('nav.messages')}
                >
                  <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                  )}
                </Link>
                <Link
                  href="/profil"
                  className="p-2 text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                  title={t('nav.profile')}
                >
                  <UserIcon className="h-6 w-6" />
                </Link>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <span className="text-xs font-semibold text-white">
                      {(dbUser?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-700" data-cy="user-greeting">
                    {t('nav.hello', { name: dbUser?.name || user.user_metadata?.name || user.email?.split("@")[0] || '' })}
                  </span>
                </div>
                <Button variant="outline" size="sm" onClick={() => signOut()}>
                  {t('nav.logout')}
                </Button>
              </>
            ) : (
              <>
                <Link href="/logg-inn">
                  <Button variant="ghost" size="sm">
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link href="/registrer">
                  <Button variant="primary" size="sm">
                    {t('nav.register')}
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-700 hover:text-indigo-600 hover:bg-slate-100 transition-all duration-200 relative"
            >
              {mobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="h-6 w-6" aria-hidden="true" />
              )}
              {user && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden animate-fade-in">
            <div className="px-4 pt-2 pb-4 space-y-2 bg-white/95 backdrop-blur-sm border-t border-slate-200/60">
              <Link
                href="/"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.home')}
              </Link>
              <Link
                href="/staller"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.stables')}
              </Link>
              <Link
                href="/tjenester"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.services')}
              </Link>
              {user && (
                <>
                  <Link
                    href="/dashboard"
                    className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.dashboard')}
                  </Link>
                </>
              )}
              <Link
                href="/priser"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {t('nav.pricing')}
              </Link>
              <Link
                href="/forslag"
                className="block px-3 py-2.5 text-base font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-all duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                Forslag
              </Link>
              {currentUser?.isAdmin && (
                <Link
                  href="/admin"
                  className="block px-3 py-2.5 text-base font-medium text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-lg transition-all duration-200 flex items-center gap-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <CogIcon className="h-5 w-5" />
                  {t('admin.title')}
                </Link>
              )}
              {user && (
                <Link
                  href="/meldinger"
                  className={`block px-3 py-2.5 text-base font-medium rounded-lg transition-all duration-200 ${
                    unreadCount > 0 
                      ? 'bg-red-50 text-red-700 border-2 border-red-200 hover:bg-red-100' 
                      : 'text-slate-700 hover:text-indigo-600 hover:bg-slate-100'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
                      {t('nav.messages')}
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs font-medium">
                          ({unreadCount} {t('nav.newMessages')})
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <span className="bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
                        {unreadCount > 99 ? '99+' : unreadCount}
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
                    {t('nav.myProfile')}
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
                          {(dbUser?.name || user.user_metadata?.name || user.email || "U").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-900">
                          {dbUser?.name || user.user_metadata?.name || user.email?.split("@")[0]}
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
                      {t('nav.logout')}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Link href="/logg-inn" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="outline" fullWidth>
                        {t('nav.login')}
                      </Button>
                    </Link>
                    <Link href="/registrer" onClick={() => setMobileMenuOpen(false)}>
                      <Button variant="primary" fullWidth>
                        {t('nav.getStarted')}
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
