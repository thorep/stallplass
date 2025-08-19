"use client";

import { z } from "zod";
import React from "react";
import { zodValidators } from "@/lib/validation/utils";

type AnyForm = any;

interface TextAreaFieldProps {
  form: AnyForm;
  name: string;
  label: string;
  rows?: number;
  placeholder?: string;
  required?: boolean;
  schema?: z.ZodTypeAny;
  apiError?: string;
}

export function TextAreaField({
  form,
  name,
  label,
  rows = 6,
  placeholder,
  required,
  schema,
  apiError,
}: TextAreaFieldProps) {
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
            <div className="relative">
              <textarea
                id={name}
                rows={rows}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder={placeholder}
                aria-invalid={hasError}
                aria-describedby={hasError ? `${name}-error` : undefined}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                  hasError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
                }`}
              />
            </div>
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

