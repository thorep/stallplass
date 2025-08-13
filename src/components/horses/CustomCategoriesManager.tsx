"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  useCustomCategories, 
  useCreateCustomCategory, 
  useUpdateCustomCategory, 
  useDeleteCustomCategory,
  type HorseCustomCategory,
  type CreateCustomCategoryData
} from "@/hooks/useHorseLogs";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Check, 
  X, 
  Loader2,
  ClipboardList,
  Heart,
  Activity,
  Utensils,
  FileText,
  Settings,
  Star,
  Award,
  Calendar
} from "lucide-react";
import { toast } from "sonner";

interface CustomCategoriesManagerProps {
  horseId: string;
}

const ICON_OPTIONS = [
  { value: 'ClipboardList', label: 'Standard', icon: ClipboardList },
  { value: 'Heart', label: 'Hjerte', icon: Heart },
  { value: 'Activity', label: 'Aktivitet', icon: Activity },
  { value: 'Utensils', label: 'Bespisning', icon: Utensils },
  { value: 'FileText', label: 'Dokument', icon: FileText },
  { value: 'Settings', label: 'Innstillinger', icon: Settings },
  { value: 'Star', label: 'Stjerne', icon: Star },
  { value: 'Award', label: 'Premie', icon: Award },
  { value: 'Calendar', label: 'Kalender', icon: Calendar },
];

const COLOR_OPTIONS = [
  { value: 'text-indigo-600', label: 'Indigo', color: 'bg-indigo-600' },
  { value: 'text-blue-600', label: 'Blå', color: 'bg-blue-600' },
  { value: 'text-green-600', label: 'Grønn', color: 'bg-green-600' },
  { value: 'text-red-600', label: 'Rød', color: 'bg-red-600' },
  { value: 'text-yellow-600', label: 'Gul', color: 'bg-yellow-600' },
  { value: 'text-purple-600', label: 'Lilla', color: 'bg-purple-600' },
  { value: 'text-pink-600', label: 'Rosa', color: 'bg-pink-600' },
  { value: 'text-orange-600', label: 'Oransje', color: 'bg-orange-600' },
];

export function CustomCategoriesManager({ horseId }: CustomCategoriesManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateCustomCategoryData>({
    name: '',
    description: '',
    icon: 'ClipboardList',
    color: 'text-indigo-600',
  });

  const { data: categories = [], isLoading } = useCustomCategories(horseId);
  const createCategory = useCreateCustomCategory();
  const updateCategory = useUpdateCustomCategory();
  const deleteCategory = useDeleteCustomCategory();

  const handleStartCreate = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'ClipboardList',
      color: 'text-indigo-600',
    });
    setIsCreating(true);
  };

  const handleStartEdit = (category: HorseCustomCategory) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
    });
    setEditingId(category.id);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Kategorinamn er påkrevd");
      return;
    }

    try {
      if (editingId) {
        await updateCategory.mutateAsync({
          horseId,
          categoryId: editingId,
          data: {
            ...formData,
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
          },
        });
        toast.success("Kategori oppdatert");
        setEditingId(null);
      } else {
        await createCategory.mutateAsync({
          horseId,
          data: {
            ...formData,
            name: formData.name.trim(),
            description: formData.description?.trim() || undefined,
          },
        });
        toast.success("Kategori opprettet");
        setIsCreating(false);
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        toast.error("En kategori med dette navnet eksisterer allerede");
      } else {
        toast.error(editingId ? "Kunne ikke oppdatere kategori" : "Kunne ikke opprette kategori");
      }
    }
  };

  const handleCancel = () => {
    setIsCreating(false);
    setEditingId(null);
    setDeleteConfirmId(null);
    setFormData({
      name: '',
      description: '',
      icon: 'ClipboardList',
      color: 'text-indigo-600',
    });
  };

  const handleDelete = async (categoryId: string) => {
    if (deleteConfirmId !== categoryId) {
      setDeleteConfirmId(categoryId);
      return;
    }

    try {
      await deleteCategory.mutateAsync({
        horseId,
        categoryId,
      });
      toast.success("Kategori slettet");
      setDeleteConfirmId(null);
    } catch {
      toast.error("Kunne ikke slette kategori");
    }
  };

  const getIconComponent = (iconName: string) => {
    const iconOption = ICON_OPTIONS.find(option => option.value === iconName);
    return iconOption ? iconOption.icon : ClipboardList;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label className="text-body-sm font-medium">Egne kategorier</Label>
          <p className="text-body-sm text-gray-600 mt-1">
            Opprett og administrer dine egne loggkategorier
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleStartCreate}
          disabled={isCreating || !!editingId}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ny kategori
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName" className="text-body-sm font-medium">
                Navn *
              </Label>
              <Input
                id="categoryName"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="F.eks. 'Tannpleie', 'Hovskobesøk'"
                maxLength={50}
                className="mt-1"
              />
              <p className="text-caption text-gray-500 mt-1">
                {formData.name.length}/50 tegn
              </p>
            </div>

            <div>
              <Label htmlFor="categoryDescription" className="text-body-sm font-medium">
                Beskrivelse (valgfritt)
              </Label>
              <Textarea
                id="categoryDescription"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Kort beskrivelse av hva denne kategorien skal brukes til"
                rows={2}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-body-sm font-medium">Ikon</Label>
                <Select
                  value={formData.icon}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, icon: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_OPTIONS.map((option) => {
                      const IconComponent = option.icon;
                      return (
                        <SelectItem key={option.value} value={option.value}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {option.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-body-sm font-medium">Farge</Label>
                <Select
                  value={formData.color}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, color: value }))}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COLOR_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center gap-2">
                          <div className={`w-4 h-4 rounded-full ${option.color}`} />
                          {option.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={createCategory.isPending || updateCategory.isPending || !formData.name.trim()}
                className="flex items-center gap-2"
              >
                {(createCategory.isPending || updateCategory.isPending) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {editingId ? 'Oppdater' : 'Opprett'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCancel}
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                <X className="h-4 w-4" />
                Avbryt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Categories List */}
      <div className="space-y-2">
        {categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <ClipboardList className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-body-sm">Ingen egne kategorier opprettet enda</p>
            <p className="text-caption">Opprett din første kategori for å komme i gang</p>
          </div>
        ) : (
          categories.map((category) => {
            const IconComponent = getIconComponent(category.icon);
            const isEditing = editingId === category.id;

            return (
              <div
                key={category.id}
                className={`flex items-center justify-between p-3 border rounded-lg ${
                  isEditing ? 'border-blue-300 bg-blue-50' : 'border-gray-200 bg-white hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <IconComponent className={`h-5 w-5 ${category.color}`} />
                  <div>
                    <p className="text-body font-medium">{category.name}</p>
                    {category.description && (
                      <p className="text-body-sm text-gray-600">{category.description}</p>
                    )}
                    <p className="text-caption text-gray-500">
                      {category._count.logs} {category._count.logs === 1 ? 'logg' : 'logger'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleStartEdit(category)}
                    disabled={isCreating || !!editingId}
                    className="h-8 w-8 p-0"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(category.id)}
                    disabled={isCreating || !!editingId || deleteCategory.isPending}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {deleteConfirmId === category.id ? (
                      <span className="text-xs font-medium">Bekreft?</span>
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
}