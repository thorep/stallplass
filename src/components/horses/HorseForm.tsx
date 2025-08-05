"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HorseGender } from "@/generated/prisma";
import { useCreateHorse, useUpdateHorse } from "@/hooks/useHorseMutations";
import {
  CreateHorseData,
  HORSE_GENDER_LABELS,
  HorseFormData,
  HorseWithOwner,
  UpdateHorseData,
} from "@/types/horse";
import { useEffect, useState } from "react";
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
    description: "",
    careNotes: "",
    medicalNotes: "",
    feedingNotes: "",
    exerciseNotes: "",
    isPublic: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const createHorse = useCreateHorse();
  const updateHorse = useUpdateHorse();

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
        description: horse.description || "",
        careNotes: horse.careNotes || "",
        medicalNotes: horse.medicalNotes || "",
        feedingNotes: horse.feedingNotes || "",
        exerciseNotes: horse.exerciseNotes || "",
        isPublic: horse.isPublic,
      });
    }
  }, [horse]);

  const handleInputChange = (field: keyof HorseFormData, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      toast.error("Navn er påkrevd");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert form data to API format
      const apiData: CreateHorseData | UpdateHorseData = {
        name: formData.name.trim(),
        breed: formData.breed.trim() || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        color: formData.color.trim() || undefined,
        gender: (formData.gender as HorseGender) || undefined,
        height: formData.height ? parseInt(formData.height) : undefined,
        weight: formData.weight ? parseInt(formData.weight) : undefined,
        description: formData.description.trim() || undefined,
        careNotes: formData.careNotes.trim() || undefined,
        medicalNotes: formData.medicalNotes.trim() || undefined,
        feedingNotes: formData.feedingNotes.trim() || undefined,
        exerciseNotes: formData.exerciseNotes.trim() || undefined,
        isPublic: formData.isPublic,
      };

      if (horse) {
        await updateHorse.mutateAsync({ id: horse.id, data: apiData });
        toast.success(`${formData.name} ble oppdatert`);
      } else {
        await createHorse.mutateAsync(apiData as CreateHorseData);
        toast.success(`${formData.name} ble lagt til`);
      }

      onSuccess();
    } catch (error) {
      const message = horse ? "Kunne ikke oppdatere hesten" : "Kunne ikke legge til hesten";
      toast.error(`${message}. Prøv igjen.`);
      console.error("Error saving horse:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-h4 font-medium">Grunnleggende informasjon</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Navn *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="Skriv inn hestens navn"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="breed">Rase</Label>
            <Input
              id="breed"
              value={formData.breed}
              onChange={(e) => handleInputChange("breed", e.target.value)}
              placeholder="F.eks. Norsk fjordhest"
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
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Farge</Label>
            <Input
              id="color"
              value={formData.color}
              onChange={(e) => handleInputChange("color", e.target.value)}
              placeholder="F.eks. Brun, Skimmel"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="gender">Kjønn</Label>
            <select 
              value={formData.gender} 
              onChange={(e) => handleInputChange("gender", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <option value="">Velg kjønn</option>
              {Object.entries(HORSE_GENDER_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="height">Høyde (cm)</Label>
            <Input
              id="height"
              type="number"
              min="50"
              max="200"
              value={formData.height}
              onChange={(e) => handleInputChange("height", e.target.value)}
              placeholder="F.eks. 155"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="weight">Vekt (kg)</Label>
            <Input
              id="weight"
              type="number"
              min="50"
              max="1500"
              value={formData.weight}
              onChange={(e) => handleInputChange("weight", e.target.value)}
              placeholder="F.eks. 450"
              className="md:w-1/2"
            />
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Beskrivelse</Label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => handleInputChange("description", e.target.value)}
          placeholder="Beskriv hesten din..."
          className="w-full min-h-[100px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
          rows={4}
        />
      </div>

      {/* Care Notes */}
      <div className="space-y-4">
        <h3 className="text-h4 font-medium">Stell og pleie</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="careNotes">Generelle stell-notater</Label>
            <textarea
              id="careNotes"
              value={formData.careNotes}
              onChange={(e) => handleInputChange("careNotes", e.target.value)}
              placeholder="Notater om daglig stell, grooming, etc."
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="medicalNotes">Medisinske notater</Label>
            <textarea
              id="medicalNotes"
              value={formData.medicalNotes}
              onChange={(e) => handleInputChange("medicalNotes", e.target.value)}
              placeholder="Medisiner, skader, veterinær-informasjon, etc."
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedingNotes">Fôringsnotater</Label>
            <textarea
              id="feedingNotes"
              value={formData.feedingNotes}
              onChange={(e) => handleInputChange("feedingNotes", e.target.value)}
              placeholder="Fôrtype, mengder, tider, etc."
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exerciseNotes">Treningsnotater</Label>
            <textarea
              id="exerciseNotes"
              value={formData.exerciseNotes}
              onChange={(e) => handleInputChange("exerciseNotes", e.target.value)}
              placeholder="Treningsrutiner, preferanser, begrensninger, etc."
              className="w-full min-h-[80px] p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
              rows={3}
            />
          </div>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="space-y-4">
        <h3 className="text-h4 font-medium">Deling</h3>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="isPublic"
            checked={formData.isPublic}
            onCheckedChange={(checked) => handleInputChange("isPublic", checked as boolean)}
          />
          <Label htmlFor="isPublic" className="text-body-sm">
            Gjør hesten offentlig synlig for deling
          </Label>
        </div>
        <p className="text-body-sm text-gray-600">
          Offentlige hester får en delbar lenke som du kan sende til andre.
        </p>
      </div>

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          Avbryt
        </Button>
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? horse
              ? "Oppdaterer..."
              : "Legger til..."
            : horse
            ? "Oppdater hest"
            : "Legg til hest"}
        </Button>
      </div>
    </form>
  );
}
