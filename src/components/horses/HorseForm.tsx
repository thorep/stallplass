"use client";

import { Button } from "@/components/ui/button";
import { FeedbackLink } from "@/components/ui/feedback-link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UnifiedImageUpload, { UnifiedImageUploadRef } from "@/components/ui/UnifiedImageUpload";
import { createHorseAction, updateHorseAction } from "@/app/actions/horse";
import {
  HORSE_GENDER_LABELS,
  HorseFormData,
  HorseWithOwner,
} from "@/types/horse";
import { useEffect, useRef, useState, useTransition } from "react";
import { toast } from "sonner";

interface HorseFormProps {
  horse?: HorseWithOwner;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HorseForm({ horse, onSuccess, onCancel }: HorseFormProps) {
  const [formData, setFormData] = useState<HorseFormData>({
    name: "",
    breed: "",
    age: "",
    color: "",
    gender: "",
    height: "",
    weight: "",
    images: [],
    imageDescriptions: [],
  });

  const [imageDescriptions, setImageDescriptions] = useState<Record<string, string>>({});
  const imageUploadRef = useRef<UnifiedImageUploadRef>(null);

  // Server action state management
  const [isPending, startTransition] = useTransition();

  const handleFormAction = async () => {
    if (!validateForm()) {
      return;
    }

    startTransition(async () => {
      try {
        // Upload any pending images first
        let finalImages = formData.images;
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
        const imageDescriptionsArray = finalImages.map((url: string) => imageDescriptions[url] || "");

        // Create FormData for server action
        const actionFormData = new FormData();
        actionFormData.append('name', formData.name.trim());
        actionFormData.append('breed', formData.breed.trim() || '');
        actionFormData.append('age', formData.age || '');
        actionFormData.append('color', formData.color.trim() || '');
        actionFormData.append('gender', formData.gender || '');
        actionFormData.append('height', formData.height || '');
        actionFormData.append('weight', formData.weight || '');
        actionFormData.append('images', JSON.stringify(finalImages));
        actionFormData.append('imageDescriptions', JSON.stringify(imageDescriptionsArray));

        if (horse) {
          actionFormData.append('horseId', horse.id);
          await updateHorseAction(actionFormData);
          toast.success(`${formData.name} ble oppdatert`);
          onSuccess();
        } else {
          await createHorseAction(actionFormData);
          toast.success(`${formData.name} ble lagt til`);
          onSuccess();
        }
      } catch (error) {
        const message = horse ? "Kunne ikke oppdatere hesten" : "Kunne ikke legge til hesten";
        toast.error(`${message}. Prøv igjen.`);
        console.error("Error saving horse:", error);
      }
    });
  };

  // Initialize form data when editing
  useEffect(() => {
    if (horse) {
      setFormData({
        name: horse.name,
        breed: horse.breed || "",
        age: horse.age?.toString() || "",
        color: horse.color || "",
        gender: horse.gender || "",
        height: horse.height?.toString() || "",
        weight: horse.weight?.toString() || "",
        images: horse.images || [],
        imageDescriptions: horse.imageDescriptions || [],
      });

      // Set up image descriptions object for UnifiedImageUpload
      if (horse.images && horse.imageDescriptions) {
        const descriptionsMap: Record<string, string> = {};
        horse.images.forEach((url, index) => {
          if (horse.imageDescriptions[index]) {
            descriptionsMap[url] = horse.imageDescriptions[index];
          }
        });
        setImageDescriptions(descriptionsMap);
      }
    }
  }, [horse]);

  const handleInputChange = (field: keyof HorseFormData, value: string | boolean | string[]) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImagesChange = (images: string[]) => {
    setFormData((prev) => ({ ...prev, images }));
  };

  const handleImageDescriptionsChange = (descriptions: Record<string, string>) => {
    setImageDescriptions(descriptions);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Navn er påkrevd");
      return false;
    }
    return true;
  };



  return (
    <form action={handleFormAction} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Skriv inn hestens navn"
              required
              data-cy="horse-name-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Rase</Label>
            <Input
              id="breed"
              value={formData.breed}
              onChange={(e) => handleInputChange("breed", e.target.value)}
              placeholder="F.eks. Norsk fjordhest"
              data-cy="horse-breed-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="age">Alder (år)</Label>
            <Input
              id="age"
              type="number"
              min="0"
              max="50"
              value={formData.age}
              onChange={(e) => handleInputChange("age", e.target.value)}
              placeholder="F.eks. 8"
              data-cy="horse-age-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Farge</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => handleInputChange("color", e.target.value)}
              placeholder="F.eks. Brun, Skimmel"
              data-cy="horse-color-input"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Kjønn</Label>
            <Select
              value={formData.gender}
              onValueChange={(value) => handleInputChange("gender", value)}
            >
              <SelectTrigger data-cy="horse-gender-select">
                <SelectValue placeholder="Velg kjønn" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(HORSE_GENDER_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key} data-cy={`horse-gender-${key.toLowerCase()}`}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Høyde (cm)</Label>
            <Input
              id="height"
              type="number"
              min="20"
              max="300"
              value={formData.height}
              onChange={(e) => handleInputChange("height", e.target.value)}
              placeholder="F.eks. 155"
              data-cy="horse-height-input"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="weight">Vekt (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="50"
              max="2000"
              value={formData.weight}
              onChange={(e) => handleInputChange("weight", e.target.value)}
              placeholder="F.eks. 450"
              className="md:w-1/2"
              data-cy="horse-weight-input"
            />
          </div>
        </div>
      </div>

      {/* Image Upload */}
      <div className="space-y-4">
        <div className="border-t pt-6">
          <UnifiedImageUpload
            ref={imageUploadRef}
            images={formData.images}
            onChange={handleImagesChange}
            onDescriptionsChange={handleImageDescriptionsChange}
            initialDescriptions={imageDescriptions}
            entityType="horse"
            title="Bilder av hesten"
            mode="inline"
            maxImages={5}
            hideUploadButton={true}
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isPending}
          className="flex-1"
        >
          Avbryt
        </Button>
        <Button
          type="submit"
          disabled={isPending}
          className="flex-1"
          data-cy="save-horse-button"
        >
          {isPending
            ? horse
              ? "Oppdaterer..."
              : "Oppretter..."
            : horse
            ? "Oppdater"
            : "Opprett"}
        </Button>
      </div>

      <div className="mt-4 text-center">
        <FeedbackLink />
      </div>
    </form>
  );
}
