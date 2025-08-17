"use client";

import { ShareOutlined } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useState } from "react";

interface ShareButtonProps {
  readonly title: string;
  readonly description?: string;
  readonly url?: string;
}

export default function ShareButton({ title, description, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  const handleShare = async () => {
    // Check if native share is available (usually on mobile)
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled sharing or error occurred
        if ((err as Error).name !== "AbortError") {
          console.error("Error sharing:", err);
        }
      }
    } else {
      // Fallback to copy link on desktop
      try {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error("Failed to copy link:", err);
      }
    }
  };

  return (
    <Button
      onClick={handleShare}
      variant="outlined"
      startIcon={<ShareOutlined />}
      sx={{
        color: "text.secondary",
        borderColor: "grey.300",
        "&:hover": {
          backgroundColor: "grey.50",
          borderColor: "grey.400",
        },
      }}
      aria-label="Del innhold"
    >
      {copied ? "Link kopiert!" : "Del"}
    </Button>
  );
}
