"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, Save, X } from "lucide-react";

import { toast } from "sonner";



interface Category {
  id: string;
  name: string;
  description?: string;
  color: string;
  isActive: boolean;
  sortOrder: number;
  _count?: { logs: number };
}



interface CustomCategoriesManagerProps {
  horseId: string;
  categories: Category[];
  onCategoryCreated?: () => void;
  onCategoryUpdated?: () => void;
  onCategoryDeleted?: () => void;
  showHeader?: boolean;
}

export function CustomCategoriesManager({
  horseId,
  categories,
  onCategoryCreated,
  onCategoryUpdated,
  onCategoryDeleted,
  showHeader = true
}: CustomCategoriesManagerProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);


  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "text-indigo-600"
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      color: "text-indigo-600"
    });
  };

  const handleCreateCategory = async () => {
    if (!formData.name.trim()) {
      toast.error("Kategorinavn er påkrevd");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/horses/${horseId}/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke opprette kategori");
      }

      toast.success("Kategori opprettet");
      setIsCreateDialogOpen(false);
      resetForm();
      onCategoryCreated?.();
    } catch (error) {
      console.error("Error creating category:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke opprette kategori");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory || !formData.name.trim()) {
      toast.error("Kategorinavn er påkrevd");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/horses/${horseId}/categories/${editingCategory.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke oppdatere kategori");
      }

      toast.success("Kategori oppdatert");
      setEditingCategory(null);
      resetForm();
      onCategoryUpdated?.();
    } catch (error) {
      console.error("Error updating category:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke oppdatere kategori");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm("Er du sikker på at du vil slette denne kategorien? Alle logger i denne kategorien vil også bli slettet.")) {
      return;
    }

    try {
      const response = await fetch(`/api/horses/${horseId}/categories/${categoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Kunne ikke slette kategori");
      }

      toast.success("Kategori slettet");
      onCategoryDeleted?.();
    } catch (error) {
      console.error("Error deleting category:", error);
      toast.error(error instanceof Error ? error.message : "Kunne ikke slette kategori");
    }
  };

  const startEditing = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || "",
      color: category.color
    });
  };

  const cancelEditing = () => {
    setEditingCategory(null);
    resetForm();
   };

   const availableColors = [
    "text-indigo-600",
    "text-blue-600",
    "text-green-600",
    "text-red-600",
    "text-yellow-600",
    "text-purple-600",
    "text-pink-600",
    "text-gray-600"
  ];



  return (
    <div className="space-y-6">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium">Administrer kategorier</h3>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" data-cy="new-category">
                <Plus className="h-4 w-4 mr-2" />
                Ny kategori
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Opprett ny kategori</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="f.eks. Fôring, Trening, Helse"
                    data-cy="categoryName"
                  />
                  <p className="text-sm text-gray-500 mt-1">Du kan bruke emoji i navnet</p>
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                 <Textarea
                   id="description"
                   value={formData.description}
                   onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                   placeholder="Valgfri beskrivelse av kategorien"
                   rows={3}
                   data-cy="categoryDescription"
                 />
              </div>


              <div>
                <Label>Farge</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`p-3 border rounded ${
                        formData.color === color ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded ${color.replace("text-", "bg-")}`} />
                    </button>
                  ))}
                </div>
              </div>



              <div className="flex gap-2 pt-4">
                  <Button
                    onClick={handleCreateCategory}
                    disabled={isSubmitting}
                    className="flex-1"
                    data-cy="opprett-kategori-knapp"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? "Oppretter..." : "Opprett"}
                  </Button>
                 <Button
                   variant="outline"
                   onClick={() => {
                     setIsCreateDialogOpen(false);
                     resetForm();
                   }}
                   className="flex-1"
                 >
                   Avbryt
                 </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      )}

      <div className="grid gap-4">
        {categories.map((category) => (
          <Card key={category.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">

   
                    <CardTitle className="text-base">{category.name}</CardTitle>
                    {category.description && (
                      <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                    )}

                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {category._count?.logs || 0} logger
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => startEditing(category)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      {editingCategory && (
        <Dialog open={!!editingCategory} onOpenChange={() => cancelEditing()}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Rediger kategori</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Navn *</Label>
                 <Input
                   id="edit-name"
                   value={formData.name}
                   onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                 />
                 <p className="text-sm text-gray-500 mt-1">Du kan bruke emoji i navnet</p>
              </div>

              <div>
                <Label htmlFor="edit-description">Beskrivelse</Label>
                <Textarea
                  id="edit-description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>


              <div>
                <Label>Farge</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {availableColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, color }))}
                      className={`p-3 border rounded ${
                        formData.color === color ? "border-blue-500" : "border-gray-200"
                      }`}
                    >
                      <div className={`w-4 h-4 rounded ${color.replace("text-", "bg-")}`} />
                    </button>
                  ))}
                </div>
              </div>



              <div className="flex gap-2 pt-4">
                 <Button
                   onClick={handleUpdateCategory}
                   disabled={isSubmitting}
                   className="flex-1"
                 >
                   <Save className="h-4 w-4 mr-2" />
                   {isSubmitting ? "Lagrer..." : "Lagre"}
                 </Button>
                 <Button
                   variant="outline"
                   onClick={cancelEditing}
                   className="flex-1"
                 >
                   <X className="h-4 w-4 mr-2" />
                   Avbryt
                 </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}