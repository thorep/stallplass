/**
 * UI state management store using Zustand
 * Handles complex client-side UI state that needs to persist across components
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Dashboard preferences
  showStableFeatures: boolean;
  
  // Search filters state
  searchFilters: {
    isOpen: boolean;
    activeFilters: Record<string, string | number | boolean | string[]>;
  };
  
  // Modal states
  modals: {
    boxManagement: { isOpen: boolean; stableId?: string };
    payment: { isOpen: boolean; boxId?: string };
    imageUpload: { isOpen: boolean; entityId?: string; entityType?: 'stable' | 'box' };
  };
  
  // Sidebar state
  sidebarOpen: boolean;
  
  // Theme preference (for future dark mode support)
  theme: 'light' | 'dark' | 'auto';
  
  // Actions
  setShowStableFeatures: (show: boolean) => void;
  toggleSearchFilters: () => void;
  setSearchFilters: (filters: Record<string, string | number | boolean | string[]>) => void;
  clearSearchFilters: () => void;
  openModal: (modalName: keyof UIState['modals'], options?: Record<string, string | number | boolean>) => void;
  closeModal: (modalName: keyof UIState['modals']) => void;
  closeAllModals: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'auto') => void;
}

/**
 * UI state store with persistence for user preferences
 */
export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      showStableFeatures: true,
      searchFilters: {
        isOpen: false,
        activeFilters: {},
      },
      modals: {
        boxManagement: { isOpen: false },
        payment: { isOpen: false },
        imageUpload: { isOpen: false },
      },
      sidebarOpen: false,
      theme: 'auto',
      
      // Actions
      setShowStableFeatures: (show) => 
        set({ showStableFeatures: show }),
      
      toggleSearchFilters: () =>
        set((state) => ({
          searchFilters: {
            ...state.searchFilters,
            isOpen: !state.searchFilters.isOpen,
          },
        })),
      
      setSearchFilters: (filters) =>
        set((state) => ({
          searchFilters: {
            ...state.searchFilters,
            activeFilters: filters,
          },
        })),
      
      clearSearchFilters: () =>
        set((state) => ({
          searchFilters: {
            ...state.searchFilters,
            activeFilters: {},
          },
        })),
      
      openModal: (modalName, options = {}) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: { isOpen: true, ...options },
          },
        })),
      
      closeModal: (modalName) =>
        set((state) => ({
          modals: {
            ...state.modals,
            [modalName]: { isOpen: false },
          },
        })),
      
      closeAllModals: () =>
        set((state) => ({
          modals: Object.keys(state.modals).reduce((acc, key) => ({
            ...acc,
            [key]: { isOpen: false },
          }), {} as UIState['modals']),
        })),
      
      toggleSidebar: () =>
        set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      setSidebarOpen: (open) =>
        set({ sidebarOpen: open }),
      
      setTheme: (theme) =>
        set({ theme }),
    }),
    {
      name: 'stallplass-ui-store', // localStorage key
      partialize: (state) => ({
        // Only persist these values
        showStableFeatures: state.showStableFeatures,
        theme: state.theme,
        searchFilters: {
          activeFilters: state.searchFilters.activeFilters,
          isOpen: false, // Don't persist open state
        },
      }),
    }
  )
);

/**
 * Selectors for optimized re-renders
 */
export const uiSelectors = {
  showStableFeatures: (state: UIState) => state.showStableFeatures,
  searchFiltersOpen: (state: UIState) => state.searchFilters.isOpen,
  activeFilters: (state: UIState) => state.searchFilters.activeFilters,
  modalIsOpen: (modalName: keyof UIState['modals']) => (state: UIState) => 
    state.modals[modalName].isOpen,
  sidebarOpen: (state: UIState) => state.sidebarOpen,
  theme: (state: UIState) => state.theme,
};

/**
 * Custom hooks for specific UI state slices
 */
export const useStableFeatures = () => {
  const showStableFeatures = useUIStore(uiSelectors.showStableFeatures);
  const setShowStableFeatures = useUIStore((state) => state.setShowStableFeatures);
  
  return { showStableFeatures, setShowStableFeatures };
};

export const useSearchFilters = () => {
  const isOpen = useUIStore(uiSelectors.searchFiltersOpen);
  const activeFilters = useUIStore(uiSelectors.activeFilters);
  const toggleSearchFilters = useUIStore((state) => state.toggleSearchFilters);
  const setSearchFilters = useUIStore((state) => state.setSearchFilters);
  const clearSearchFilters = useUIStore((state) => state.clearSearchFilters);
  
  return {
    isOpen,
    activeFilters,
    toggleSearchFilters,
    setSearchFilters,
    clearSearchFilters,
  };
};

export const useModal = (modalName: keyof UIState['modals']) => {
  const isOpen = useUIStore(uiSelectors.modalIsOpen(modalName));
  const openModal = useUIStore((state) => state.openModal);
  const closeModal = useUIStore((state) => state.closeModal);
  
  return {
    isOpen,
    open: (options?: Record<string, string | number | boolean>) => openModal(modalName, options),
    close: () => closeModal(modalName),
  };
};