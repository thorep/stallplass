"use client";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UnifiedImageUpload, { UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import InlineEditSection from "@/components/molecules/InlineEditSection";
import { updateHorseFieldAction } from "@/app/actions/horse";
import { HORSE_GENDER_LABELS, UpdateHorseData } from "@/types/horse";
import {
  Calendar,
  FileText,
  Heart,
  Palette,
  Ruler,
  Weight,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { User } from "@supabase/supabase-js";

interface HorseDetailClientProps {
  horse: any; // We'll type this properly later
  user: User;
}

export default function HorseDetailClient({ horse: initialHorse, user }: HorseDetailClientProps) {
  const [horse, setHorse] = useState(initialHorse);

  // Editing states for different sections
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, string | number>>({});

  // Image editing states
  const [imageDescriptions, setImageDescriptions] = useState<Record<string, string>>({});
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  // Initialize image descriptions when horse data loads
  useEffect(() => {
    if (horse?.images && horse?.imageDescriptions) {
      const descriptionsMap: Record<string, string> = {};
      (horse.images as string[]).forEach((url: string, index: number) => {
        if (horse.imageDescriptions[index]) {
          descriptionsMap[url] = horse.imageDescriptions[index] as string;
        }
      });
      setImageDescriptions(descriptionsMap);
    }
  }, [horse]);

  // Helper functions for permission checking
  const canEditBasicInfo = () => {
    return horse?.ownerId === user.id; // Only owner can edit for now
  };

  const canEditImages = () => {
    return horse?.ownerId === user.id; // Only owner can edit images
  };

  const [isPending, startTransition] = useTransition();

  // Inline editing handlers
  const startEditing = (section: string, initialData: Record<string, string | number>) => {
    setEditingSection(section);
    setEditingData(initialData);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditingData({});
  };

  const saveSection = async (data: UpdateHorseData) => {
    startTransition(async () => {
      try {
        // Update each field individually using server actions
        for (const [field, value] of Object.entries(data)) {
          if (value !== undefined && value !== null) {
            await updateHorseFieldAction(horse.id, field, value);
          }
        }

        // Update local state immediately
        setHorse((prev: any) => ({ ...prev, ...data }));

        toast.success("Endringene ble lagret");
        setEditingSection(null);
        setEditingData({});
      } catch (error) {
        toast.error("Kunne ikke lagre endringene. Prøv igjen.");
        console.error("Save error:", error);
      }
    });
  };

  // Special save function for images
  const saveImages = async (images: string[]) => {
    try {
      // Upload any pending images first
      let finalImages = images;
      if (imageUploadRef.current) {
        try {
          finalImages = await imageUploadRef.current.uploadPendingImages();
        } catch (error) {
          console.error("Failed to upload images:", error);
          toast.error("Feil ved opplasting av bilder. Prøv igjen.");
          return;
        }
      }

      // Convert image descriptions to array format
      const imageDescriptionsArray = finalImages.map((url) => imageDescriptions[url] || "");

      await updateHorseFieldAction(horse.id, 'images', finalImages);
      await updateHorseFieldAction(horse.id, 'imageDescriptions', imageDescriptionsArray);

      // Update local state
      setHorse((prev: any) => ({
        ...prev,
        images: finalImages,
        imageDescriptions: imageDescriptionsArray
      } as any));

      toast.success("Bildene ble oppdatert");
      setEditingSection(null);
    } catch (error) {
      toast.error("Kunne ikke oppdatere bildene. Prøv igjen.");
      console.error("Save images error:", error);
    }
  };

  const handleImagesChange = (images: string[]) => {
    saveImages(images);
  };

  const handleImageDescriptionsChange = (descriptions: Record<string, string>) => {
    setImageDescriptions(descriptions);
  };

  // Back link removed per request

  if (!horse) {
    return (
      <div className="min-h-40 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <div className="text-6xl mb-4">🐴</div>
            <h3 className="text-h3 mb-2">Kunne ikke finne hesten</h3>
            <p className="text-body">Hesten eksisterer ikke eller du har ikke tilgang til den.</p>
          </div>
        </div>
      </div>
    );
  }

  const getDisplayAge = () => {
    if (!horse.age) return "Ikke oppgitt";
    return horse.age === 1 ? "1 år" : `${horse.age} år`;
  };

  const getDisplayHeight = () => {
    if (!horse.height) return "Ikke oppgitt";
    return `${horse.height} cm`;
  };

  const getDisplayWeight = () => {
    if (!horse.weight) return "Ikke oppgitt";
    return `${horse.weight} kg`;
  };

  const getDisplayGender = () => {
    if (!horse.gender) return "Ikke oppgitt";
    return HORSE_GENDER_LABELS[horse.gender as keyof typeof HORSE_GENDER_LABELS];
  };

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header removed; tabs provide navigation */}

        {/* Horse Images - Editable */}
        <div className="mb-8">
          <InlineEditSection
            isEditing={editingSection === "images"}
            onEdit={canEditImages() ? () => setEditingSection("images") : undefined}
            onSave={() => {
              setEditingSection(null);
              toast.success("Bildene ble oppdatert");
            }}
            onCancel={() => setEditingSection(null)}
            isLoading={isPending}
            title="Bilder"
            icon={<div className="text-blue-600">📷</div>}
          >
            {editingSection === "images" ? (
              <UnifiedImageUpload
                ref={imageUploadRef}
                images={(horse.images as string[]) || []}
                onChange={handleImagesChange}
                onDescriptionsChange={handleImageDescriptionsChange}
                initialDescriptions={imageDescriptions}
                entityType="horse"
                title=""
                mode="inline"
                maxImages={5}
                hideUploadButton={false}
              />
            ) : (
              <div>
                {horse.images && (horse.images as string[]).length > 0 ? (
                  <div className="space-y-4">
                    {/* Main Image */}
                    <div className="w-full h-64 md:h-80 relative rounded-lg overflow-hidden">
                      <Image
                        src={(horse.images as string[])[0]}
                        alt={(horse.imageDescriptions?.[0] as string) || horse.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 800px, 800px"
                        priority
                      />
                    </div>

                    {/* Additional Images Thumbnail Gallery */}
                    {(horse.images as string[]).length > 1 && (
                      <div>
                        <h3 className="text-body-sm font-medium text-gray-700 mb-3">
                          Flere bilder {(horse.images as string[]).length - 1}
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {(horse.images as string[]).slice(1).map((imageUrl: string, index: number) => (
                            <div key={index + 1} className="relative aspect-square rounded-lg overflow-hidden">
                              <Image
                                src={imageUrl}
                                alt={
                                  (horse.imageDescriptions?.[index + 1] as string) ||
                                  `${horse.name} - bilde ${index + 2}`
                                }
                                fill
                                className="object-cover hover:scale-105 transition-transform duration-300"
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 200px"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-64 md:h-80 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <div className="text-6xl mb-4">🐴</div>
                      <p className="text-body">Ingen bilder lagt til ennå</p>
                      {canEditImages() && (
                        <p className="text-body-sm mt-2">Klikk &quot;Rediger&quot; for å legge til bilder</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </InlineEditSection>
        </div>

        {/* Header Section - Inline Editable or Read-Only */}
        <div className="mb-8">
          <InlineEditSection
            isEditing={editingSection === "header"}
            onEdit={
              canEditBasicInfo()
                ? () =>
                    startEditing("header", {
                      name: horse.name,
                      breed: horse.breed || "",
                    })
                : undefined
            }
            onSave={() =>
              saveSection({
                name: String(editingData.name || ""),
                breed: editingData.breed ? String(editingData.breed) : undefined,
              })
            }
            onCancel={cancelEditing}
            isLoading={isPending}
            title="Grunnleggende informasjon"
            icon={<FileText className="h-5 w-5" />}
          >
            {editingSection === "header" ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Navn *</label>
                  <Input
                    data-cy="horse-name-input"
                    value={String(editingData.name || "")}
                    onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                    placeholder="Hestens navn"
                    className="text-base h-12 border-2 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Rase</label>
                  <Input
                    data-cy="horse-breed-input"
                    value={String(editingData.breed || "")}
                    onChange={(e) => setEditingData({ ...editingData, breed: e.target.value })}
                    placeholder="Hestens rase"
                    className="text-base h-12 border-2 focus:border-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <FileText className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Navn</p>
                    <p className="text-body font-medium">{horse.name}</p>
                  </div>
                </div>

                {horse.breed && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <Heart className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-body-sm text-gray-600">Rase</p>
                      <p className="text-body font-medium">{horse.breed}</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </InlineEditSection>
        </div>

        {/* Physical Characteristics - Inline Editable */}
        <div className="mb-8">
          <InlineEditSection
            isEditing={editingSection === "physical"}
            onEdit={
              canEditBasicInfo()
                ? () =>
                    startEditing("physical", {
                      gender: (horse.gender as string) || "NONE",
                      age: (horse.age as number) || "",
                      color: horse.color || "",
                      height: (horse.height as number) || "",
                      weight: (horse.weight as number) || "",
                    })
                : undefined
            }
            onSave={() =>
              saveSection({
                gender:
                  editingData.gender && editingData.gender !== "NONE"
                    ? (String(editingData.gender) as UpdateHorseData["gender"])
                    : undefined,
                age: editingData.age ? parseInt(String(editingData.age)) : undefined,
                color: editingData.color ? String(editingData.color) : undefined,
                height: editingData.height ? parseInt(String(editingData.height)) : undefined,
                weight: editingData.weight ? parseInt(String(editingData.weight)) : undefined,
              })
            }
            onCancel={cancelEditing}
            isLoading={isPending}
            title="Fysiske egenskaper"
            icon={<Heart className="h-5 w-5" />}
          >
            {editingSection === "physical" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Kjønn</label>
                  <Select
                    value={String(editingData.gender || "NONE")}
                    onValueChange={(value) => setEditingData({ ...editingData, gender: value })}
                  >
                    <SelectTrigger data-cy="horse-gender-select" className="h-12 border-2 focus:border-blue-500">
                      <SelectValue placeholder="Velg kjønn" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="NONE">Ikke oppgitt</SelectItem>
                      {Object.entries(HORSE_GENDER_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>
                          {label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Alder (år)</label>
                  <Input
                    data-cy="horse-age-input"
                    type="number"
                    value={String(editingData.age || "")}
                    onChange={(e) => setEditingData({ ...editingData, age: e.target.value })}
                    placeholder="Alder"
                    className="text-base h-12 border-2 focus:border-blue-500"
                    min="0"
                    max="50"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Farge</label>
                  <Input
                    data-cy="horse-color-input"
                    value={String(editingData.color || "")}
                    onChange={(e) => setEditingData({ ...editingData, color: e.target.value })}
                    placeholder="Hestens farge"
                    className="text-base h-12 border-2 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Høyde (cm)</label>
                  <Input
                    data-cy="horse-height-input"
                    type="number"
                    value={String(editingData.height || "")}
                    onChange={(e) => setEditingData({ ...editingData, height: e.target.value })}
                    placeholder="Høyde i cm"
                    className="text-base h-12 border-2 focus:border-blue-500"
                    min="30"
                    max="320"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">Vekt (kg)</label>
                  <Input
                    data-cy="horse-weight-input"
                    type="number"
                    value={String(editingData.weight || "")}
                    onChange={(e) => setEditingData({ ...editingData, weight: e.target.value })}
                    placeholder="Vekt i kg"
                    className="text-base h-12 border-2 focus:border-blue-500"
                    min="50"
                    max="1500"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Heart className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Kjønn</p>
                    <p className="text-body font-medium">{getDisplayGender()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Alder</p>
                    <p className="text-body font-medium">{getDisplayAge()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Palette className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Farge</p>
                    <p className="text-body font-medium">{horse.color || "Ikke oppgitt"}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Ruler className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Høyde</p>
                    <p className="text-body font-medium">{getDisplayHeight()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <Weight className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-body-sm text-gray-600">Vekt</p>
                    <p className="text-body font-medium">{getDisplayWeight()}</p>
                  </div>
                </div>
              </div>
            )}
          </InlineEditSection>
        </div>

        {/* Other sections (Stall, Logg, Del) moved to own tabs */}
      </div>

      {/* Log/Settings modals now live in Logg tab */}
    </div>
  );
}