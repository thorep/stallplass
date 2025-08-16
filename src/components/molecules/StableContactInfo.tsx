"use client";

import StableMap from "@/components/molecules/StableMap";
import { Box, Stack, Typography } from "@mui/material";
import { EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";

interface StableContactInfoProps {
  stable: {
    id: string;
    name: string;
    location: string;
    postalCode?: string | null;
    city?: string | null;
    county?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    contactName?: string | null;
    contactEmail?: string | null;
    contactPhone?: string | null;
    owner?: {
      id: string;
      nickname: string;
    };
  };
  showMap?: boolean;
  className?: string;
}

export default function StableContactInfo({
  stable,
  showMap = true,
  className,
}: Readonly<StableContactInfoProps>) {
  // Format the complete address
  const formatAddress = () => {
    const addressLines = [];

    // Line 1: Street address
    if (stable.location) {
      addressLines.push(stable.location);
    }

    // Line 2: Postal code and city
    const postalLine = [];
    if (stable.postalCode) {
      postalLine.push(stable.postalCode);
    }
    if (stable.city) {
      postalLine.push(stable.city);
    }
    if (postalLine.length > 0) {
      addressLines.push(postalLine.join(" "));
    }

    // Line 3: County
    if (stable.county) {
      addressLines.push(stable.county);
    }

    return addressLines;
  };

  const addressLines = formatAddress();

  return (
    <Box className={className}>
      <Box
        sx={{
          backgroundColor: "white",
          borderRadius: "8px",
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
          border: "1px solid rgb(229 231 235)",
          padding: "24px",
        }}
      >
        <Typography
          variant="h6"
          className="text-h4"
          sx={{ color: "rgb(17 24 39)", marginBottom: "24px" }}
        >
          Kontaktinformasjon
        </Typography>

        <Stack spacing={2}>
          {/* Eier and Stall on the same row to save space */}
          <Stack direction="row" spacing={4}>
            <Box flex={1}>
              <Typography
                variant="subtitle2"
                className="text-body-sm"
                sx={{ fontWeight: "bold", color: "rgb(17 24 39)" }}
              >
                Eier
              </Typography>
              <Typography
                variant="body2"
                className="text-body-sm"
                sx={{ fontWeight: 500, color: "rgb(75 85 99)" }}
              >
                {stable.owner?.nickname || "Ikke oppgitt"}
              </Typography>
            </Box>

            <Box flex={1}>
              <Typography
                variant="subtitle2"
                className="text-body-sm"
                sx={{ fontWeight: "bold", color: "rgb(17 24 39)" }}
              >
                Stall
              </Typography>
              <Typography
                variant="body2"
                className="text-body-sm"
                sx={{ fontWeight: 500, color: "rgb(75 85 99)" }}
              >
                {stable.name}
              </Typography>
            </Box>
          </Stack>

          <Box>
            <Stack direction="row" alignItems="flex-start" spacing={1}>
              <Box>
                <Typography
                  variant="subtitle2"
                  className="text-body-sm"
                  sx={{ fontWeight: "bold", color: "rgb(17 24 39)" }}
                >
                  Adresse
                </Typography>
                <Stack spacing={0.5}>
                  {addressLines.map((line) => (
                    <Typography
                      key={line}
                      variant="body2"
                      className="text-body-sm"
                      sx={{ fontWeight: 500, color: "rgb(75 85 99)" }}
                    >
                      {line}
                    </Typography>
                  ))}
                </Stack>
              </Box>
            </Stack>
          </Box>

          {/* Contact Information */}
          {(stable.contactName || stable.contactEmail || stable.contactPhone) && (
            <Box>
              <Typography
                variant="subtitle2"
                className="text-body-sm"
                sx={{ fontWeight: "bold", color: "rgb(17 24 39)", marginBottom: "8px" }}
              >
                Kontakt
              </Typography>
              <Stack spacing={1}>
                {stable.contactName && (
                  <Typography
                    variant="body2"
                    className="text-body-sm"
                    sx={{ fontWeight: 500, color: "rgb(75 85 99)" }}
                  >
                    {stable.contactName}
                  </Typography>
                )}
                
                {stable.contactEmail && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <EnvelopeIcon className="h-4 w-4 text-gray-500" />
                    <Typography
                      component="a"
                      href={`mailto:${stable.contactEmail}`}
                      variant="body2"
                      className="text-body-sm"
                      sx={{ 
                        fontWeight: 500, 
                        color: "rgb(59 130 246)",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" }
                      }}
                    >
                      {stable.contactEmail}
                    </Typography>
                  </Stack>
                )}
                
                {stable.contactPhone && (
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <PhoneIcon className="h-4 w-4 text-gray-500" />
                    <Typography
                      component="a"
                      href={`tel:${stable.contactPhone}`}
                      variant="body2"
                      className="text-body-sm"
                      sx={{ 
                        fontWeight: 500, 
                        color: "rgb(59 130 246)",
                        textDecoration: "none",
                        "&:hover": { textDecoration: "underline" }
                      }}
                    >
                      {stable.contactPhone}
                    </Typography>
                  </Stack>
                )}
              </Stack>
            </Box>
          )}
        </Stack>

        {/* Map */}
        {showMap && stable.latitude && stable.longitude && (
          <Box
            sx={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgb(243 244 246)" }}
          >
            <StableMap
              latitude={stable.latitude}
              longitude={stable.longitude}
              stallName={stable.name}
              address={stable.location}
              className="w-full h-32 rounded-xl overflow-hidden"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
