# Files with Multiple Components

This list reflects the current codebase and includes only TSX files that define two or more React components. Paths and names are normalized to match the repository.

## Examples
- `src/components/examples/SimpleRealtimeExamples.tsx`: 7 components (SimpleStablesList, SimpleStableDetail, SimpleAvailableBoxes, SimpleConnectionStatus, SimpleSearchableStables, SimpleErrorBoundaryExample, SimpleComplexFilters)

## Forum
- `src/components/forum/CategoryBadge.tsx`: 2 components (CategoryBadge, CategoryBadgeList)
- `src/components/forum/CategoryFilter.tsx`: 2 components (CategoryFilter, CompactCategoryFilter)
- `src/components/forum/ForumRichTextEditor.tsx`: 2 components (ToolbarPlugin, OnChangeHandler)
- `src/components/forum/PostCard.tsx`: 3 components (PostImageGallery, PostCard, PostCardSkeleton)
- `src/components/forum/ReactionButtons.tsx`: 2 components (ReactionButtons, ReactionDisplay)
- `src/components/forum/ThreadCard.tsx`: 2 components (ThreadCard, ThreadCardSkeleton)
- `src/components/forum/ThreadForm.tsx`: 2 components (ThreadForm, ThreadPreview)
- `src/components/forum/ThreadListItem.tsx`: 2 components (ThreadListItem, ThreadListItemSkeleton)

## Organisms
- `src/components/organisms/LeafletMapComponent.tsx`: 3 components (BackButtonControl, MapController, LeafletMapComponent)
- `src/components/organisms/ServicesAdmin.tsx`: 2 components (ServicesAdmin, ServiceCard)
- `src/components/organisms/ServiceTypesAdmin.tsx`: 2 components (ServiceTypesAdmin, ServiceTypeRow)

## Misc
- `src/components/ProtectedRoute.tsx`: 2 components (ProtectedRoute, AuthenticatedComponent)

## UI
- `src/components/ui/alert.tsx`: 3 components (Alert, AlertTitle, AlertDescription)
- `src/components/ui/card.tsx`: 7 components (Card, CardHeader, CardTitle, CardDescription, CardAction, CardContent, CardFooter)
- `src/components/ui/collapsible.tsx`: 3 components (Collapsible, CollapsibleTrigger, CollapsibleContent)
- `src/components/ui/dialog.tsx`: 10 components (Dialog, DialogTrigger, DialogPortal, DialogClose, DialogOverlay, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription)
- `src/components/ui/radio-group.tsx`: 2 components (RadioGroup, RadioGroupItem)
- `src/components/ui/scroll-area.tsx`: 2 components (ScrollArea, ScrollBar)
- `src/components/ui/select.tsx`: 10 components (Select, SelectGroup, SelectValue, SelectTrigger, SelectContent, SelectLabel, SelectItem, SelectSeparator, SelectScrollUpButton, SelectScrollDownButton)
- `src/components/ui/tooltip.tsx`: 4 components (TooltipProvider, Tooltip, TooltipTrigger, TooltipContent)
- `src/components/ui/UnifiedImageUpload.tsx`: 2 components (FileInput, ImageGallery)

Notes:
- Removed non-existent files and outdated names (e.g., `src/components/listings/ListingCard.tsx`, `src/components/ui/*` with capitalized filenames). The UI component paths are lowercase in the repo (e.g., `src/components/ui/alert.tsx`).
- Atoms like `src/components/atoms/Input.tsx` only define a single component and are therefore not listed here.
