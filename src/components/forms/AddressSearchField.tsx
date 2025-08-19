"use client";

import AddressSearch from "@/components/molecules/AddressSearch";
import React from "react";
import { z } from "zod";
import { firstError } from "@/lib/validation/utils";

type AnyForm = any;

interface AddressSearchFieldProps {
  form: AnyForm;
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
  const values = form.state.values;
  // Read current address-related values
  const addressVal = nameAddress.split(".").reduce((acc: any, key: string) => acc?.[key], values);
  const kommuneVal = nameKommuneNumber.split(".").reduce((acc: any, key: string) => acc?.[key], values);

  // Compute message using same rules as the old form
  let msg: string | undefined;
  const addrErr = firstError(addressSchema, addressVal);
  if (addrErr) {
    msg = addrErr;
  } else if (mode === "create" && addressVal?.trim()?.length > 0) {
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
        initialValue={addressVal}
        placeholder={placeholder}
      />
      {msg ? <p className="mt-1 text-sm text-red-600">{msg}</p> : null}
    </div>
  );
}

