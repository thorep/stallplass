"use client";

import React from "react";
import { z } from "zod";
import { zodValidators } from "@/lib/validation/utils";

type AnyForm = any;

interface Option {
  value: string;
  label: string;
}

interface SelectFieldProps {
  form: AnyForm;
  name: string;
  label: string;
  options: Option[];
  placeholderOption?: Option; // e.g., { value: '', label: 'Velg rase' }
  required?: boolean;
  schema?: z.ZodTypeAny;
  apiError?: string;
}

export function SelectField({
  form,
  name,
  label,
  options,
  placeholderOption,
  required,
  schema,
  apiError,
}: SelectFieldProps) {
  const validators = schema ? zodValidators(schema) : undefined;
  return (
    <form.Field name={name} validators={validators as any}>
      {(field: any) => {
        const localError: string | undefined = field.state.meta.errors[0];
        const hasError = !!(localError || apiError);
        return (
          <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required ? "*" : ""}
            </label>
            <select
              id={name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${name}-error` : undefined}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {placeholderOption && (
                <option value={placeholderOption.value}>{placeholderOption.label}</option>
              )}
              {options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            {(apiError || localError) && (
              <p id={`${name}-error`} className="mt-1 text-sm text-red-600">
                {apiError || localError}
              </p>
            )}
          </div>
        );
      }}
    </form.Field>
  );
}

