"use client";

import { HorseSharing } from "@/components/horses/HorseSharing";
import { LogList } from "@/components/horses/LogList";
import { LogModal } from "@/components/horses/LogModal";
import { LogSettingsModal } from "@/components/horses/LogSettingsModal";
import { StableInfo } from "@/components/horses/StableInfo";
import { StableSelector } from "@/components/horses/StableSelector";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  useCareLogs,
  useExerciseLogs,
  useFeedingLogs,
  useMedicalLogs,
  useOtherLogs,
} from "@/hooks/useHorseLogs";
import { useUpdateHorse } from "@/hooks/useHorseMutations";
import { useHorse } from "@/hooks/useHorses";
import { HORSE_GENDER_LABELS, UpdateHorseData } from "@/types/horse";
import {
  ArrowLeft,
  Calendar,
  Check,
  Edit,
  FileText,
  Heart,
  Loader2,
  Palette,
  Ruler,
  Settings,
  Weight,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Image from "next/image";

// Inline editing section component
interface InlineEditSectionProps {
  isEditing: boolean;
  onEdit?: () => void;
  onSave: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  variant?: "default" | "medical";
}

function InlineEditSection({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isLoading,
  title,
  icon,
  children,
  variant = "default",
}: InlineEditSectionProps) {
  const isMedical = variant === "medical";

  return (
    <Card
      className={`transition-all duration-200 ${isEditing ? "ring-2 ring-blue-200 shadow-md" : ""}`}
    >
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`flex items-center gap-2 ${isMedical ? "text-red-600" : ""}`}>
            {icon}
            {title}
          </CardTitle>
          {!isEditing && onEdit ? (
            <Button variant="ghost" size="sm" onClick={onEdit} className="h-8 px-3 text-xs">
              <Edit className="h-3 w-3 mr-1" />
              Rediger
            </Button>
          ) : isEditing ? (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                disabled={isLoading}
                className="h-8 px-3 text-xs"
              >
                <X className="h-3 w-3 mr-1" />
                Avbryt
              </Button>
              <Button size="sm" onClick={onSave} disabled={isLoading} className="h-8 px-3 text-xs">
                {isLoading ? (
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                ) : (
                  <Check className="h-3 w-3 mr-1" />
                )}
                Lagre
              </Button>
            </div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function HorseDetailPage() {
  const params = useParams();
  const router = useRouter();
  const horseId = params.id as string;

  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [logModalType, setLogModalType] = useState<
    "care" | "exercise" | "feeding" | "medical" | "other"
  >("care");
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Editing states for different sections
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<Record<string, string | number>>({});

  const { data: horse, isLoading, error } = useHorse(horseId);

  // Helper functions for permission checking
  const canEditBasicInfo = () => {
    return horse?.isOwner === true || (horse?.permissions?.includes("EDIT") === true);
  };

  const canAddLogs = () => {
    return horse?.isOwner === true || (horse?.permissions?.includes("ADD_LOGS") === true);
  };
  const { data: careLogs, isLoading: careLogsLoading } = useCareLogs(horseId);
  const { data: exerciseLogs, isLoading: exerciseLogsLoading } = useExerciseLogs(horseId);
  const { data: feedingLogs, isLoading: feedingLogsLoading } = useFeedingLogs(horseId);
  const { data: medicalLogs, isLoading: medicalLogsLoading } = useMedicalLogs(horseId);
  const { data: otherLogs, isLoading: otherLogsLoading } = useOtherLogs(horseId);
  const updateHorse = useUpdateHorse();

  // Inline editing handlers
  const startEditing = (section: string, initialData: Record<string, string | number>) => {
    setEditingSection(section);
    setEditingData(initialData);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setEditingData({});
  };

  const saveSection = async (section: string, data: UpdateHorseData) => {
    try {
      await updateHorse.mutateAsync({ id: horseId, data });
      toast.success("Endringene ble lagret");
      setEditingSection(null);
      setEditingData({});
    } catch (error) {
      toast.error("Kunne ikke lagre endringene. Prøv igjen.");
      console.error("Save error:", error);
    }
  };

  const handleBack = () => {
    router.push("/mine-hester");
  };

  const handleAddCareLog = () => {
    setLogModalType("care");
    setIsLogModalOpen(true);
  };

  const handleAddExerciseLog = () => {
    setLogModalType("exercise");
    setIsLogModalOpen(true);
  };

  const handleAddFeedingLog = () => {
    setLogModalType("feeding");
    setIsLogModalOpen(true);
  };

  const handleAddMedicalLog = () => {
    setLogModalType("medical");
    setIsLogModalOpen(true);
  };

  const handleAddOtherLog = () => {
    setLogModalType("other");
    setIsLogModalOpen(true);
  };

  const handleCloseLogModal = () => {
    setIsLogModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-body">Laster hest...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !horse) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-4">
              <div className="text-4xl mb-4">🐴</div>
              <h3 className="text-h3 mb-2">Kunne ikke finne hesten</h3>
              <p className="text-body">Hesten eksisterer ikke eller du har ikke tilgang til den.</p>
            </div>
          </div>
        </div>
        <Footer />
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
    <div className="min-h-screen bg-white">
      <Header />

      <div className="p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={handleBack}
              className="h-10 px-3"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Tilbake til Mine Hester
            </Button>
            
            {canEditBasicInfo() && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSettingsModalOpen(true)}
                className="h-10 px-3"
              >
                <Settings className="h-4 w-4 mr-2" />
                Innstillinger
              </Button>
            )}
          </div>
          {/* Horse Images */}
          <Card className="mb-8">
            <CardContent className="p-6">
              {horse.images && horse.images.length > 0 ? (
                <div className="space-y-4">
                  {/* Main Image */}
                  <div className="w-full h-64 md:h-80 relative rounded-lg overflow-hidden">
                    <Image
                      src={horse.images[0]}
                      alt={horse.imageDescriptions?.[0] || horse.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 800px, 800px"
                      priority
                    />
                  </div>
                  
                  {/* Additional Images Thumbnail Gallery */}
                  {horse.images.length > 1 && (
                    <div>
                      <h3 className="text-body-sm font-medium text-gray-700 mb-3">
                        Flere bilder ({horse.images.length - 1})
                      </h3>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {horse.images.slice(1).map((imageUrl: string, index: number) => (
                          <div key={index + 1} className="relative aspect-square rounded-lg overflow-hidden">
                            <Image
                              src={imageUrl}
                              alt={horse.imageDescriptions?.[index + 1] || `${horse.name} - bilde ${index + 2}`}
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
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Header Section - Inline Editable or Read-Only */}
          <div className="mb-8">
            <InlineEditSection
              isEditing={editingSection === "header"}
              onEdit={canEditBasicInfo() ? () =>
                startEditing("header", {
                  name: horse.name,
                  breed: horse.breed || "",
                })
               : undefined}
              onSave={() =>
                saveSection("header", {
                  name: String(editingData.name || ""),
                  breed: editingData.breed ? String(editingData.breed) : undefined,
                })
              }
              onCancel={cancelEditing}
              isLoading={updateHorse.isPending}
              title="Grunnleggende informasjon"
              icon={<FileText className="h-5 w-5" />}
            >
              {editingSection === "header" ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Navn *
                    </label>
                    <Input
                      value={String(editingData.name || "")}
                      onChange={(e) => setEditingData({ ...editingData, name: e.target.value })}
                      placeholder="Hestens navn"
                      className="text-base h-12 border-2 focus:border-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Rase
                    </label>
                    <Input
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
              onEdit={canEditBasicInfo() ? () =>
                startEditing("physical", {
                  gender: horse.gender || "NONE",
                  age: horse.age || "",
                  color: horse.color || "",
                  height: horse.height || "",
                  weight: horse.weight || "",
                })
               : undefined}
              onSave={() =>
                saveSection("physical", {
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
              isLoading={updateHorse.isPending}
              title="Fysiske egenskaper"
              icon={<Heart className="h-5 w-5" />}
            >
              {editingSection === "physical" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Kjønn
                    </label>
                    <Select
                      value={String(editingData.gender || "NONE")}
                      onValueChange={(value) => setEditingData({ ...editingData, gender: value })}
                    >
                      <SelectTrigger className="h-12 border-2 focus:border-blue-500">
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
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Alder (år)
                    </label>
                    <Input
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
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Farge
                    </label>
                    <Input
                      value={String(editingData.color || "")}
                      onChange={(e) => setEditingData({ ...editingData, color: e.target.value })}
                      placeholder="Hestens farge"
                      className="text-base h-12 border-2 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Høyde (cm)
                    </label>
                    <Input
                      type="number"
                      value={String(editingData.height || "")}
                      onChange={(e) => setEditingData({ ...editingData, height: e.target.value })}
                      placeholder="Høyde i cm"
                      className="text-base h-12 border-2 focus:border-blue-500"
                      min="50"
                      max="220"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-body-sm font-medium text-gray-700 mb-2">
                      Vekt (kg)
                    </label>
                    <Input
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

          {/* Description - Inline Editable */}
          <div className="mb-8">
            <InlineEditSection
              isEditing={editingSection === "description"}
              onEdit={canEditBasicInfo() ? () =>
                startEditing("description", {
                  description: horse.description || "",
                })
               : undefined}
              onSave={() =>
                saveSection("description", {
                  description: editingData.description
                    ? String(editingData.description)
                    : undefined,
                })
              }
              onCancel={cancelEditing}
              isLoading={updateHorse.isPending}
              title="Beskrivelse"
              icon={<FileText className="h-5 w-5" />}
            >
              {editingSection === "description" ? (
                <div>
                  <label className="block text-body-sm font-medium text-gray-700 mb-2">
                    Beskrivelse av hesten
                  </label>
                  <Textarea
                    value={String(editingData.description || "")}
                    onChange={(e) =>
                      setEditingData({ ...editingData, description: e.target.value })
                    }
                    placeholder="Beskriv hesten her..."
                    className="min-h-[120px] text-base border-2 focus:border-blue-500 resize-none"
                    rows={5}
                  />
                </div>
              ) : (
                <div>
                  {horse.description ? (
                    <p className="text-body leading-relaxed whitespace-pre-wrap">
                      {horse.description}
                    </p>
                  ) : (
                    <p className="text-body text-gray-500 italic">
                      Ingen beskrivelse lagt til ennå. Klikk &quot;Rediger&quot; for å legge til en
                      beskrivelse.
                    </p>
                  )}
                </div>
              )}
            </InlineEditSection>
          </div>

          {/* Horse Sharing - Only show for owners */}
          {horse.isOwner && (
            <div className="mb-8">
              <HorseSharing horseId={horseId} isOwner={horse.isOwner} />
            </div>
          )}


          {/* Stable Information and Selection */}
          <div className="space-y-8 mb-8">
            {/* Current Stable Info */}
            {horse.stable && <StableInfo stable={horse.stable} />}

            {/* Stable Selector - Only show for users who can edit */}
            {canEditBasicInfo() && (
              <StableSelector
                horseId={horse.id}
                currentStable={horse.stable}
                onStableSelected={() => {
                  // The component handles the mutation and UI updates automatically
                  // The horse data will be refetched after successful update
                }}
              />
            )}
          </div>

          {/* Care and Exercise Logs */}
          <div className="space-y-8 mb-8">
            {/* Care Logs */}
            {(horse?.showCareSection ?? true) && (
              <LogList
                logs={careLogs || []}
                logType="care"
                isLoading={careLogsLoading}
                onAddLog={canAddLogs() ? handleAddCareLog : () => {}}
                horseId={horse?.id || ""}
                instructions={horse?.careInstructions}
                displayMode={horse?.logDisplayMode || "FULL"}
                canAddLogs={canAddLogs()}
              />
            )}
            {/* Exercise Logs */}
            {(horse?.showExerciseSection ?? true) && (
              <LogList
                logs={exerciseLogs || []}
                logType="exercise"
                isLoading={exerciseLogsLoading}
                onAddLog={canAddLogs() ? handleAddExerciseLog : () => {}}
                horseId={horse?.id || ""}
                instructions={horse?.exerciseInstructions}
                displayMode={horse?.logDisplayMode || "FULL"}
                canAddLogs={canAddLogs()}
              />
            )}
          </div>

          {/* Care Information */}
          <div className="space-y-8 mb-8">
            {/* Feeding Logs */}
            {(horse?.showFeedingSection ?? true) && (
              <LogList
                logs={feedingLogs || []}
                logType="feeding"
                isLoading={feedingLogsLoading}
                onAddLog={canAddLogs() ? handleAddFeedingLog : () => {}}
                horseId={horse?.id || ""}
                instructions={horse?.feedingNotes}
                displayMode={horse?.logDisplayMode || "FULL"}
                canAddLogs={canAddLogs()}
              />
            )}

            {/* Medical Logs */}
            {(horse?.showMedicalSection ?? true) && (
              <LogList
                logs={medicalLogs || []}
                logType="medical"
                isLoading={medicalLogsLoading}
                onAddLog={canAddLogs() ? handleAddMedicalLog : () => {}}
                horseId={horse?.id || ""}
                instructions={horse?.medicalNotes}
                displayMode={horse?.logDisplayMode || "FULL"}
                canAddLogs={canAddLogs()}
              />
            )}
          </div>

          {/* Other Logs */}
          {(horse?.showOtherSection ?? true) && (
            <div className="mb-8">
              <LogList
                logs={otherLogs || []}
                logType="other"
                isLoading={otherLogsLoading}
                onAddLog={canAddLogs() ? handleAddOtherLog : () => {}}
                horseId={horse?.id || ""}
                instructions={horse?.otherNotes}
                displayMode={horse?.logDisplayMode || "FULL"}
                canAddLogs={canAddLogs()}
              />
            </div>
          )}

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Informasjon om registrering</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-body-sm">
                <div>
                  <span className="text-gray-600">Registrert:</span>
                  <span className="ml-2">
                    {new Date(horse.createdAt).toLocaleDateString("no-NO")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Sist oppdatert:</span>
                  <span className="ml-2">
                    {new Date(horse.updatedAt).toLocaleDateString("no-NO")}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Eier:</span>
                  <span className="ml-2">{horse.profiles.nickname}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Log Modal */}
      {horse && (
        <LogModal
          isOpen={isLogModalOpen}
          onClose={handleCloseLogModal}
          horseId={horse.id}
          horseName={horse.name}
          logType={logModalType}
        />
      )}

      {/* Settings Modal */}
      {horse && (
        <LogSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          horseId={horse.id}
          currentDisplayMode={horse?.logDisplayMode || "FULL"}
          showCareSection={horse?.showCareSection ?? true}
          showExerciseSection={horse?.showExerciseSection ?? true}
          showFeedingSection={horse?.showFeedingSection ?? true}
          showMedicalSection={horse?.showMedicalSection ?? true}
          showOtherSection={horse?.showOtherSection ?? true}
        />
      )}

      <Footer />
    </div>
  );
}
