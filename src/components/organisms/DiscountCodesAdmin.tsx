"use client";

import { useState } from "react";
import {
  useGetAdminDiscountCodes,
  useCreateAdminDiscountCode,
  useUpdateAdminDiscountCode,
  useDeleteAdminDiscountCode,
  type DiscountCode,
} from "@/hooks/useAdminDiscountCodes";
import { DiscountType, InvoiceItemType } from "@/generated/prisma";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { toast } from "sonner";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { formatPrice } from "@/utils/formatting";

interface DiscountCodeFormData {
  code: string;
  name: string;
  description: string;
  discountType: DiscountType;
  discountValue: string;
  minOrderAmount: string;
  maxDiscount: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableItems: InvoiceItemType[];
}

const defaultFormData: DiscountCodeFormData = {
  code: "",
  name: "",
  description: "",
  discountType: DiscountType.PERCENTAGE,
  discountValue: "",
  minOrderAmount: "",
  maxDiscount: "",
  validFrom: new Date().toISOString().split("T")[0],
  validUntil: "",
  isActive: true,
  applicableItems: [],
};

const itemTypeLabels: Record<InvoiceItemType, string> = {
  BOX_ADVERTISING: "Boksannonsering",
  BOX_SPONSORED: "Sponset plassering",
  SERVICE_ADVERTISING: "Tjenesteannonse",
};

export function DiscountCodesAdmin() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<DiscountCodeFormData>(defaultFormData);

  const { data: discountCodes, isLoading } = useGetAdminDiscountCodes();
  const createMutation = useCreateAdminDiscountCode();
  const updateMutation = useUpdateAdminDiscountCode();
  const deleteMutation = useDeleteAdminDiscountCode();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      code: formData.code.trim(),
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      discountType: formData.discountType,
      discountValue: parseFloat(formData.discountValue),
      minOrderAmount: formData.minOrderAmount ? parseFloat(formData.minOrderAmount) : undefined,
      maxDiscount: formData.maxDiscount ? parseFloat(formData.maxDiscount) : undefined,
      validFrom: formData.validFrom,
      validUntil: formData.validUntil || undefined,
      isActive: formData.isActive,
      applicableItems: formData.applicableItems.length > 0 ? formData.applicableItems : undefined,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({ id: editingId, data });
        toast.success("Rabattkode oppdatert");
        setEditingId(null);
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Rabattkode opprettet");
        setIsCreateOpen(false);
      }
      setFormData(defaultFormData);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Noe gikk galt");
    }
  };

  const handleEdit = (code: DiscountCode) => {
    setFormData({
      code: code.code,
      name: code.name,
      description: code.description || "",
      discountType: code.discountType,
      discountValue: code.discountValue.toString(),
      minOrderAmount: code.minOrderAmount?.toString() || "",
      maxDiscount: code.maxDiscount?.toString() || "",
      validFrom: new Date(code.validFrom).toISOString().split("T")[0],
      validUntil: code.validUntil ? new Date(code.validUntil).toISOString().split("T")[0] : "",
      isActive: code.isActive,
      applicableItems: code.applicableItems || [],
    });
    setEditingId(code.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Er du sikker på at du vil slette denne rabattkoden?")) {
      return;
    }

    try {
      const result = await deleteMutation.mutateAsync(id);
      if (result.deactivated) {
        toast.success("Rabattkode deaktivert (har vært brukt)");
      } else {
        toast.success("Rabattkode slettet");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Kunne ikke slette rabattkode");
    }
  };

  const toggleItemType = (itemType: InvoiceItemType) => {
    setFormData((prev) => ({
      ...prev,
      applicableItems: prev.applicableItems.includes(itemType)
        ? prev.applicableItems.filter((item) => item !== itemType)
        : [...prev.applicableItems, itemType],
    }));
  };

  if (isLoading) {
    return <div className="animate-pulse">Laster rabattkoder...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Rabattkoder</h2>
          <p className="text-gray-600 mt-1">Administrer rabattkoder for kundebestillinger</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="flex items-center gap-2">
          <PlusIcon className="h-4 w-4" />
          Ny rabattkode
        </Button>
      </div>

      {/* Discount codes table */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Kode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Navn
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rabatt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Gyldig periode
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Brukt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Handlinger
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {discountCodes?.map((code) => (
              <tr key={code.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-mono font-medium text-gray-900">{code.code}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{code.name}</div>
                  {code.description && (
                    <div className="text-xs text-gray-500">{code.description}</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {code.discountType === DiscountType.PERCENTAGE
                      ? `${code.discountValue}%`
                      : formatPrice(code.discountValue)}
                  </div>
                  {code.minOrderAmount && (
                    <div className="text-xs text-gray-500">
                      Min: {formatPrice(code.minOrderAmount)}
                    </div>
                  )}
                  {code.maxDiscount && (
                    <div className="text-xs text-gray-500">
                      Maks: {formatPrice(code.maxDiscount)}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {format(new Date(code.validFrom), "dd.MM.yyyy", { locale: nb })}
                  </div>
                  {code.validUntil && (
                    <div className="text-xs text-gray-500">
                      til {format(new Date(code.validUntil), "dd.MM.yyyy", { locale: nb })}
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{code.usageCount} ganger</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {code.isActive ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircleIcon className="h-3 w-3 mr-1" />
                      Aktiv
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      <XCircleIcon className="h-3 w-3 mr-1" />
                      Inaktiv
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => handleEdit(code)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(code.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {(!discountCodes || discountCodes.length === 0) && (
          <div className="text-center py-12 text-gray-500">Ingen rabattkoder opprettet ennå</div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || !!editingId} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false);
          setEditingId(null);
          setFormData(defaultFormData);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>
                {editingId ? "Rediger rabattkode" : "Opprett ny rabattkode"}
              </DialogTitle>
              <DialogDescription>
                {editingId
                  ? "Oppdater informasjonen for rabattkoden"
                  : "Fyll ut skjemaet for å opprette en ny rabattkode"}
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="code">Kode *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value.toUpperCase() })
                    }
                    placeholder="SOMMER2024"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="name">Navn *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Sommerkampanje"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Beskrivelse</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Valgfri beskrivelse av rabattkoden"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discountType">Rabatttype *</Label>
                  <Select
                    value={formData.discountType}
                    onValueChange={(value) =>
                      setFormData({ ...formData, discountType: value as DiscountType })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={DiscountType.PERCENTAGE}>Prosent</SelectItem>
                      <SelectItem value={DiscountType.FIXED_AMOUNT}>Fast beløp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="discountValue">
                    Rabattverdi *{" "}
                    {formData.discountType === DiscountType.PERCENTAGE ? "(0-100)" : "(kr)"}
                  </Label>
                  <Input
                    id="discountValue"
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    placeholder="10"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="minOrderAmount">Minimum ordrebeløp (kr)</Label>
                  <Input
                    id="minOrderAmount"
                    type="number"
                    step="0.01"
                    value={formData.minOrderAmount}
                    onChange={(e) =>
                      setFormData({ ...formData, minOrderAmount: e.target.value })
                    }
                    placeholder="500"
                  />
                </div>
                <div>
                  <Label htmlFor="maxDiscount">
                    Maks rabatt (kr){" "}
                    {formData.discountType === DiscountType.PERCENTAGE && "(for prosent)"}
                  </Label>
                  <Input
                    id="maxDiscount"
                    type="number"
                    step="0.01"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    placeholder="1000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="validFrom">Gyldig fra *</Label>
                  <Input
                    id="validFrom"
                    type="date"
                    value={formData.validFrom}
                    onChange={(e) => setFormData({ ...formData, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="validUntil">Gyldig til</Label>
                  <Input
                    id="validUntil"
                    type="date"
                    value={formData.validUntil}
                    onChange={(e) => setFormData({ ...formData, validUntil: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Gjelder for</Label>
                <p className="text-sm text-gray-500 mb-2">
                  Velg hvilke typer bestillinger rabattkoden gjelder for (tom = alle)
                </p>
                <div className="space-y-2">
                  {Object.entries(itemTypeLabels).map(([key, label]) => (
                    <label key={key} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.applicableItems.includes(key as InvoiceItemType)}
                        onChange={() => toggleItemType(key as InvoiceItemType)}
                        className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
                <Label htmlFor="isActive">Aktiv</Label>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCreateOpen(false);
                  setEditingId(null);
                  setFormData(defaultFormData);
                }}
              >
                Avbryt
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Oppdater" : "Opprett"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}