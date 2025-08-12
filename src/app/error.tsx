"use client";

import { useEffect } from "react";
import { usePostHog } from "posthog-js/react";
import { Button, Container, Typography, Box } from "@mui/material";
import { RefreshCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const posthog = usePostHog();

  useEffect(() => {
    // Capture the error with PostHog
    if (posthog) {
      posthog.captureException(error, {
        source: 'react-error-boundary',
        digest: error.digest,
      });
    }
  }, [error, posthog]);

  return (
    <Container maxWidth="sm">
      <Box 
        display="flex" 
        flexDirection="column" 
        alignItems="center" 
        justifyContent="center" 
        minHeight="60vh"
        textAlign="center"
        gap={3}
      >
        <Typography variant="h4" color="error" gutterBottom>
          Noe gikk galt
        </Typography>
        
        <Typography variant="body1" color="text.secondary" paragraph>
          Vi beklager, men det oppstod en uventet feil. Feilen er automatisk rapportert 
          og vi jobber med å løse problemet.
        </Typography>
        
        <Button
          variant="contained"
          onClick={reset}
          startIcon={<RefreshCw size={20} />}
          sx={{ mt: 2 }}
        >
          Prøv igjen
        </Button>
      </Box>
    </Container>
  );
}