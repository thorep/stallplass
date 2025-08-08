"use client";

import { Modal } from "@/components/ui/modal";
import { Alert, Box, Button, Link, Stack, Typography } from "@mui/material";
import { AlertCircle, Mail } from "lucide-react";

interface StableLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function StableLimitModal({ isOpen, onClose }: Readonly<StableLimitModalProps>) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Stallbegrensning" maxWidth="sm" showCloseButton>
      <Stack spacing={3}>
        {/* Alert message */}
        <Alert
          severity="info"
          icon={<AlertCircle className="h-5 w-5" />}
          sx={{
            borderRadius: "0.5rem",
            "& .MuiAlert-icon": {
              alignItems: "center",
            },
          }}
        >
          <Typography variant="body2" fontWeight={500}>
            Beklager, men du kan kun ha én stall registrert på din konto.
          </Typography>
        </Alert>

        {/* Main message */}
        <Stack spacing={2}>
          <Typography variant="body1" color="text.primary">
            Vi tillater én stall per bruker for at du skal fokusere på å opprette individuelle 
            stallbokser. Dette gir en mye bedre søkeopplevelse for alle som leter etter stallplass.
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Ved å registrere hver boks separat med detaljer om størrelse, fasiliteter og pris, 
            blir det enklere for ryttere å finne akkurat det de trenger. Hvis du har behov for å 
            registrere flere staller, vennligst ta kontakt med oss.
          </Typography>
        </Stack>

        {/* Contact information */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: "0.5rem",
            bgcolor: "grey.50",
            border: "1px solid",
            borderColor: "grey.200",
          }}
        >
          <Stack spacing={1.5}>
            <Typography variant="subtitle2" fontWeight={600} color="text.primary">
              Kontakt oss
            </Typography>

            <Stack direction="row" alignItems="center" spacing={1}>
              <Mail className="h-4 w-4 text-gray-500" />
              <Link
                href="mailto:hei@stallplass.no"
                underline="hover"
                color="primary"
                sx={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                }}
              >
                hei@stallplass.no
              </Link>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              Vi svarer vanligvis innen 1-2 virkedager
            </Typography>
          </Stack>
        </Box>

        {/* Additional help text */}
        <Typography variant="caption" color="text.secondary" sx={{ fontStyle: "italic" }}>
          Tips: Du kan alltid redigere eller arkivere din eksisterende stall fra dashboardet ditt.
        </Typography>

        {/* Action buttons */}
        <Stack direction="row" spacing={2} sx={{ pt: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            size="large"
            fullWidth
            sx={{
              borderRadius: "0.5rem",
              textTransform: "none",
              fontWeight: 500,
              borderColor: "grey.300",
              color: "text.primary",
              "&:hover": {
                borderColor: "grey.400",
                bgcolor: "grey.50",
              },
            }}
          >
            Lukk
          </Button>
          <Button
            href="mailto:hei@stallplass.no"
            component="a"
            variant="contained"
            size="large"
            fullWidth
            sx={{
              borderRadius: "0.5rem",
              textTransform: "none",
              fontWeight: 500,
              bgcolor: "primary.main",
              "&:hover": {
                bgcolor: "primary.dark",
              },
            }}
          >
            Kontakt oss
          </Button>
        </Stack>
      </Stack>
    </Modal>
  );
}
