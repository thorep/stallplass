"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Check,
  Edit,
  Loader2,
  X,
} from "lucide-react";

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

export default function InlineEditSection({
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
    <Card className={`transition-all duration-200 ${isEditing ? "ring-2 ring-blue-200 shadow-md" : ""}`}>
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