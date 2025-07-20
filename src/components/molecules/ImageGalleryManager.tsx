'use client';

import { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon, 
  ChevronUpIcon, 
  ChevronDownIcon,
  Bars3Icon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
import Button from '@/components/atoms/Button';
import ImageUpload from './ImageUpload';
import { type StorageBucket } from '@/services/storage-service';

interface ImageWithDescription {
  url: string;
  description?: string;
  id: string; // Unique identifier for drag and drop
}

interface ImageGalleryManagerProps {
  images: string[]; // Backward compatible with current format
  onChange: (images: string[]) => void;
  onDescriptionsChange?: (descriptions: Record<string, string>) => void; // Optional descriptions callback
  initialDescriptions?: Record<string, string>; // Initial descriptions for existing images
  maxImages?: number;
  bucket: StorageBucket;
  folder?: string;
  title?: string;
  autoEditMode?: boolean; // Auto-enable edit mode for descriptions
}

export default function ImageGalleryManager({
  images,
  onChange,
  onDescriptionsChange,
  initialDescriptions = {},
  maxImages = 10,
  bucket,
  folder,
  title = 'Bildebehandling',
  autoEditMode = false
}: ImageGalleryManagerProps) {
  // Convert string array to image objects with descriptions
  const [imageData, setImageData] = useState<ImageWithDescription[]>(() =>
    images.map((url, index) => ({
      url,
      description: initialDescriptions[url] || '',
      id: `image-${index}-${Date.now()}`
    }))
  );

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [showUploader, setShowUploader] = useState(false);
  const [draggedOver, setDraggedOver] = useState<string | null>(null);

  // Update imageData when images prop changes (for external updates)
  const updateImageData = (newImages: string[]) => {
    const newImageData = newImages.map((url, index) => {
      const existingImage = imageData.find(img => img.url === url);
      return {
        url,
        description: existingImage?.description || '',
        id: existingImage?.id || `image-${index}-${Date.now()}`
      };
    });
    setImageData(newImageData);
  };

  // Handle new images from SmartImageUpload
  const handleNewImages = (newImages: string[]) => {
    const updatedImages = [...images, ...newImages];
    onChange(updatedImages);
    updateImageData(updatedImages);
    setShowUploader(false);
  };

  // Handle drag and drop reordering
  const handleDragEnd = (result: DropResult) => {
    setDraggedOver(null);
    
    if (!result.destination) return;

    const items = Array.from(imageData);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setImageData(items);
    
    // Update the images array with new order
    const newImages = items.map(item => item.url);
    onChange(newImages);
  };

  // Delete image
  const deleteImage = (index: number) => {
    const newImageData = imageData.filter((_, i) => i !== index);
    setImageData(newImageData);
    
    const newImages = newImageData.map(item => item.url);
    onChange(newImages);
  };

  // Edit description
  const startEditingDescription = (id: string, currentDescription: string) => {
    setEditingId(id);
    setEditDescription(currentDescription);
  };

  const saveDescription = (id: string) => {
    const newImageData = imageData.map(img =>
      img.id === id ? { ...img, description: editDescription } : img
    );
    setImageData(newImageData);
    
    // Call descriptions callback if provided
    if (onDescriptionsChange) {
      const descriptionsMap = newImageData.reduce((acc, img) => {
        if (img.description) {
          acc[img.url] = img.description;
        }
        return acc;
      }, {} as Record<string, string>);
      onDescriptionsChange(descriptionsMap);
    }
    
    setEditingId(null);
    setEditDescription('');
  };

  const cancelEditingDescription = () => {
    setEditingId(null);
    setEditDescription('');
  };

  // Move image up/down (alternative to drag and drop for mobile)
  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === imageData.length - 1)
    ) {
      return;
    }

    const newImageData = [...imageData];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newImageData[index], newImageData[targetIndex]] = [newImageData[targetIndex], newImageData[index]];
    
    setImageData(newImageData);
    const newImages = newImageData.map(item => item.url);
    onChange(newImages);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">{title}</h3>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span>{imageData.length} av {maxImages}</span>
          {imageData.length < maxImages && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Legg til</span>
            </Button>
          )}
        </div>
      </div>

      {/* Smart Image Uploader Modal */}
      {showUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[95vh] overflow-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-900">Last opp nye bilder</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowUploader(false)}
                >
                  <XMarkIcon className="h-5 w-5" />
                </Button>
              </div>
              
              <ImageUpload
                images={[]} // Start with empty array for new uploads
                onChange={handleNewImages}
                maxImages={maxImages - imageData.length}
                bucket={bucket}
                folder={folder}
              />
              
              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <Button variant="outline" onClick={() => setShowUploader(false)}>
                  Avbryt
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery */}
      {imageData.length > 0 ? (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="image-gallery">
            {(provided, snapshot) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className={`space-y-4 ${snapshot.isDraggingOver ? 'bg-slate-50 rounded-lg p-2' : ''}`}
              >
                {imageData.map((imageItem, index) => (
                  <Draggable key={imageItem.id} draggableId={imageItem.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`
                          bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm
                          ${snapshot.isDragging ? 'shadow-lg rotate-2 ring-2 ring-indigo-500' : ''}
                          ${draggedOver === imageItem.id ? 'ring-2 ring-indigo-300' : ''}
                        `}
                      >
                        {/* Image and Controls Container */}
                        <div className="flex flex-col sm:flex-row">
                          {/* Image */}
                          <div className="relative flex-shrink-0 w-full sm:w-48 h-48 sm:h-32">
                            <Image
                              src={imageItem.url}
                              alt={imageItem.description || `Bilde ${index + 1}`}
                              fill
                              className="object-cover"
                              sizes="(max-width: 640px) 100vw, 192px"
                            />
                            
                            {/* Mobile drag handle overlay */}
                            <div 
                              {...provided.dragHandleProps}
                              className="absolute top-2 left-2 sm:hidden bg-white bg-opacity-90 rounded p-1.5 cursor-grab active:cursor-grabbing"
                            >
                              <Bars3Icon className="h-4 w-4 text-slate-600" />
                            </div>
                            
                            {/* Position indicator */}
                            <div className="absolute top-2 right-2 bg-indigo-600 text-white text-xs font-medium px-2 py-1 rounded">
                              {index + 1}
                            </div>
                          </div>

                          {/* Controls and Description */}
                          <div className="flex-1 p-4 space-y-3">
                            {/* Desktop drag handle and position controls */}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div 
                                  {...provided.dragHandleProps}
                                  className="hidden sm:flex p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600"
                                >
                                  <Bars3Icon className="h-5 w-5" />
                                </div>
                                <span className="text-sm font-medium text-slate-700">
                                  Bilde {index + 1}
                                </span>
                              </div>
                              
                              {/* Position controls for mobile */}
                              <div className="flex items-center gap-1 sm:hidden">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => moveImage(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <ChevronUpIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => moveImage(index, 'down')}
                                  disabled={index === imageData.length - 1}
                                >
                                  <ChevronDownIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                              {autoEditMode || editingId === imageItem.id ? (
                                <div className="space-y-2">
                                  <input
                                    type="text"
                                    value={autoEditMode ? imageItem.description || '' : editDescription}
                                    onChange={(e) => {
                                      if (autoEditMode) {
                                        // Update description directly in auto-edit mode
                                        const newImageData = imageData.map(img =>
                                          img.id === imageItem.id ? { ...img, description: e.target.value } : img
                                        );
                                        setImageData(newImageData);
                                        
                                        // Call descriptions callback if provided
                                        if (onDescriptionsChange) {
                                          const descriptionsMap = newImageData.reduce((acc, img) => {
                                            if (img.description) {
                                              acc[img.url] = img.description;
                                            }
                                            return acc;
                                          }, {} as Record<string, string>);
                                          onDescriptionsChange(descriptionsMap);
                                        }
                                      } else {
                                        setEditDescription(e.target.value);
                                      }
                                    }}
                                    placeholder="Beskrivelse av bildet..."
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                  />
                                  {!autoEditMode && (
                                    <div className="flex gap-2">
                                      <Button
                                        variant="primary"
                                        size="xs"
                                        onClick={() => saveDescription(imageItem.id)}
                                      >
                                        <CheckIcon className="h-3 w-3" />
                                        Lagre
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="xs"
                                        onClick={cancelEditingDescription}
                                      >
                                        <XMarkIcon className="h-3 w-3" />
                                        Avbryt
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-sm text-slate-600">
                                      {imageItem.description || (
                                        <span className="italic text-slate-400">
                                          Ingen beskrivelse
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="xs"
                                    onClick={() => startEditingDescription(imageItem.id, imageItem.description || '')}
                                    className="flex-shrink-0"
                                  >
                                    <PencilIcon className="h-3 w-3" />
                                    <span className="hidden sm:inline ml-1">Rediger</span>
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                              <div className="flex items-center gap-2 sm:hidden">
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => moveImage(index, 'up')}
                                  disabled={index === 0}
                                >
                                  <ChevronUpIcon className="h-4 w-4" />
                                  Opp
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="xs"
                                  onClick={() => moveImage(index, 'down')}
                                  disabled={index === imageData.length - 1}
                                >
                                  <ChevronDownIcon className="h-4 w-4" />
                                  Ned
                                </Button>
                              </div>
                              
                              <div className="flex items-center gap-2 ml-auto">
                                <Button
                                  variant="destructive"
                                  size="xs"
                                  onClick={() => deleteImage(index)}
                                >
                                  <TrashIcon className="h-3 w-3" />
                                  <span className="hidden sm:inline ml-1">Slett</span>
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        // Empty state
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
          <div className="space-y-4">
            <div className="text-slate-400">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">Ingen bilder ennå</h3>
              <p className="text-slate-500 mb-4">
                Last opp bilder for å vise frem stallen din
              </p>
              <Button
                variant="primary"
                onClick={() => setShowUploader(true)}
                className="flex items-center gap-2"
              >
                <PlusIcon className="h-4 w-4" />
                Last opp bilder
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Usage instructions */}
      {imageData.length > 0 && (
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-slate-900 mb-2">Tips for bildebehandling:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              <span className="hidden sm:inline">Dra bildene for å endre rekkefølge</span>
              <span className="sm:hidden">Bruk pil-knappene for å endre rekkefølge</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              Legg til beskrivelser for bedre SEO og tilgjengelighet
            </li>
            <li className="flex items-center gap-2">
              <span className="w-1 h-1 bg-slate-400 rounded-full"></span>
              Første bilde vises som hovedbilde i oversikten
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}