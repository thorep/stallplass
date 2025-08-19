"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import React from "react";
import { zodValidators } from "@/lib/validation/utils";

type FormLike = any;

interface InputFieldProps {
  form: FormLike;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  schema?: z.ZodTypeAny;
  apiError?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement>;
}

export function InputField({
  form,
  name,
  label,
  type = "text",
  placeholder,
  required,
  schema,
  apiError,
  inputProps,
}: InputFieldProps) {
  const validators = schema ? zodValidators(schema) : undefined;

  return (
    <form.Field name={name} validators={validators as unknown}>
      {(field: unknown) => {
        const f = field as {
          state: { value: unknown; meta: { errors?: (string | undefined)[] } };
          handleBlur: () => void;
          handleChange: (value: unknown) => void;
        };
        const localError: string | undefined = f.state.meta.errors?.[0];
        const value = String(f.state.value ?? "");
        const hasError = !!(localError || apiError);
        return (
          <div>
            <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
              {label} {required ? "*" : ""}
            </label>
            <input
              id={name}
              type={type}
              value={value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
              placeholder={placeholder}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${name}-error` : undefined}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 ${
                hasError ? "border-red-300 focus:ring-red-500" : "border-gray-300 focus:ring-blue-500"
              }`}
              {...inputProps}
            />
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
