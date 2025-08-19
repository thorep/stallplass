"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import AddressSearch from "@/components/molecules/AddressSearch";
import React from "react";
import { z } from "zod";
import { firstError } from "@/lib/validation/utils";

type FormLike = any;

interface AddressSearchFieldProps {
  form: FormLike;
  mode?: "create" | "edit";
  label?: string;
  placeholder?: string;
  // Field names inside form
  nameAddress: string; // address
  namePostalCode: string; // postalCode
  namePostalPlace: string; // poststed
  nameCountyName: string; // fylke (display)
  nameMunicipalityName: string; // municipality (display)
  nameKommuneNumber: string; // kommuneNumber
  nameCoordinates: string; // coordinates
}

const addressSchema = z.string().min(3, "Adresse er påkrevd");
const kommuneSchema = z.string().min(1, "Velg en adresse fra søkeresultatene");

export function AddressSearchField({
  form,
  mode = "create",
  label = "Lokasjon",
  placeholder = "Søk etter adresse",
  nameAddress,
  namePostalCode,
  namePostalPlace,
  nameCountyName,
  nameMunicipalityName,
  nameKommuneNumber,
  nameCoordinates,
}: AddressSearchFieldProps) {
  // Helper to read deep values reactively via Subscribe selector
  const pick = (obj: unknown, path: string): unknown =>
    path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object") {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as Record<string, unknown>);

  return (
    <form.Subscribe
      selector={(state: { values: Record<string, unknown> }) => ({
        addressVal: pick(state.values, nameAddress),
        kommuneVal: pick(state.values, nameKommuneNumber),
      })}
    >
      {({ addressVal, kommuneVal }: { addressVal: unknown; kommuneVal: unknown }) => {
        let msg: string | undefined;
        const addrErr = firstError(addressSchema, addressVal);
        if (addrErr) {
          msg = addrErr;
        } else if (
          mode === "create" &&
          typeof addressVal === "string" &&
          addressVal.trim().length > 0
        ) {
          const kErr = firstError(kommuneSchema, kommuneVal);
          if (kErr) msg = kErr;
        }

        return (
          <div className="space-y-2">
            <h3 className="text-lg font-medium text-gray-900">{label}</h3>
            <AddressSearch
              onAddressSelect={(data) => {
                form.setFieldValue(nameAddress, data.address || "");
                form.setFieldValue(namePostalCode, data.postalCode || "");
                form.setFieldValue(namePostalPlace, data.poststed || "");
                form.setFieldValue(nameCountyName, data.fylke || "");
                form.setFieldValue(nameMunicipalityName, data.municipality || "");
                form.setFieldValue(nameKommuneNumber, data.kommuneNumber || "");
                form.setFieldValue(nameCoordinates, {
                  lat: data.lat || 0,
                  lon: data.lon || 0,
                });
              }}
              initialValue={typeof addressVal === "string" ? addressVal : undefined}
              placeholder={placeholder}
            />
            {msg ? <p className="mt-1 text-sm text-red-600">{msg}</p> : null}
          </div>
        );
      }}
    </form.Subscribe>
  );
}
