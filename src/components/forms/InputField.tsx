"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { z } from "zod";
import React from "react";
import { zodValidators } from "@/lib/validation/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormLike = any;

type DataAttributes = {
  [key in `data-${string}`]?: string | number | boolean | undefined;
};

interface InputFieldProps {
  form: FormLike;
  name: string;
  label: string;
  type?: string;
  placeholder?: string;
  required?: boolean;
  schema?: z.ZodTypeAny;
  apiError?: string;
  inputProps?: React.InputHTMLAttributes<HTMLInputElement> & DataAttributes;
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
            <Label htmlFor={name} className="mb-1">
              {label} {required ? "*" : ""}
            </Label>
            <Input
              id={name}
              type={type}
              value={value}
              onBlur={f.handleBlur}
              onChange={(e) => f.handleChange(e.target.value)}
              placeholder={placeholder}
              aria-invalid={hasError}
              aria-describedby={hasError ? `${name}-error` : undefined}
              {...inputProps}
            />
            {(apiError || localError) && (
              <p id={`${name}-error`} className="mt-1 text-sm text-destructive">
                {apiError || localError}
              </p>
            )}
          </div>
        );
      }}
    </form.Field>
  );
}
