"use client";

import React from "react";

export function ContactInfoNotice() {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <p className="text-blue-800 text-sm">
        Lar du feltene stå tomme, vises kun brukernavnet ditt og interessenter kan bare sende melding
        via Stallplass. Fyller du inn e‑post og/eller telefon, vises disse som kontaktvalg på
        annonsen. Du kan også oppgi et annet kontaktnavn (f.eks. en i stallen eller i bedriften)
        dersom noen andre tar imot henvendelser.
      </p>
    </div>
  );
}

export default ContactInfoNotice;

