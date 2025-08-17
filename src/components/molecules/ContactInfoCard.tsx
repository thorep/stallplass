"use client";

import StableMap from "@/components/molecules/StableMap";
import { useCreateConversation } from "@/hooks/useChat";
import { useSupabaseUser } from "@/hooks/useSupabaseUser";
import { ChatBubbleLeftRightIcon, EnvelopeIcon, PhoneIcon } from "@heroicons/react/24/outline";
import { Box, Stack, Typography } from "@mui/material";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export interface ContactInfoCardProps {
  // Entity information
  entityType: "stable" | "box" | "service" | "partLoanHorse" | "horseSale";
  entityId: string;
  entityName: string;
  entityOwnerId?: string;

  // Contact information
  contactName?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;

  // Owner information (for display)
  ownerNickname?: string | null;

  // Location information
  address?: string | null;
  postalCode?: string | null;
  postalPlace?: string | null;
  county?: string | null;
  latitude?: number | null;
  longitude?: number | null;

  // User information (passed from server)
  user?: { id: string; email?: string } | null;

  // Options
  showMap?: boolean;
  showOwner?: boolean;
  className?: string;
}

export default function ContactInfoCard({
  entityType,
  entityId,
  entityName,
  entityOwnerId,
  contactName,
  contactEmail,
  contactPhone,
  ownerNickname,
  address,
  postalCode,
  postalPlace,
  county,
  latitude,
  longitude,
  user,
  showMap = true,
  showOwner = true,
  className,
}: ContactInfoCardProps) {
  const router = useRouter();
  const { user: authUser } = useSupabaseUser();
  
  // Use server-passed user if available, otherwise use client-fetched user
  const currentUser = user || authUser;
  const createConversation = useCreateConversation();

  // Format the complete address
  const formatAddress = () => {
    const addressLines = [];

    // Line 1: Street address
    if (address) {
      addressLines.push(address);
    }

    // Line 2: Postal code and city
    const postalLine = [];
    if (postalCode) {
      postalLine.push(postalCode);
    }
    if (postalPlace) {
      postalLine.push(postalPlace);
    }
    if (postalLine.length > 0) {
      addressLines.push(postalLine.join(" "));
    }

    // Line 3: County
    if (county) {
      addressLines.push(county);
    }

    return addressLines;
  };

  const addressLines = formatAddress();

  // Handle send message
  const handleSendMessage = () => {
    if (!currentUser) {
      // Use referrer (search page with params) if available, otherwise current page
      const returnUrl = typeof window !== 'undefined' && document.referrer 
        ? document.referrer 
        : window.location.href;
      router.push(`/logg-inn?returnUrl=${encodeURIComponent(returnUrl)}`);
      return;
    }

    // Don't allow messaging yourself
    if (entityOwnerId && currentUser.id === entityOwnerId) {
      return;
    }

    const conversationData: {
      stableId?: string;
      boxId?: string;
      serviceId?: string;
      partLoanHorseId?: string;
      horseSaleId?: string;
    } = {};

    // Add the appropriate entity ID based on type
    switch (entityType) {
      case "stable":
        conversationData.stableId = entityId;
        break;
      case "box":
        conversationData.boxId = entityId;
        break;
      case "service":
        conversationData.serviceId = entityId;
        break;
      case "partLoanHorse":
        conversationData.partLoanHorseId = entityId;
        break;
      case "horseSale":
        conversationData.horseSaleId = entityId;
        break;
    }

    createConversation.mutate(conversationData, {
      onSuccess: () => {
        router.push("/meldinger");
      },
      onError: (error) => {
        console.error("Failed to create conversation:", error);
        toast.error("Kunne ikke starte samtale. Prøv igjen senere.");
      },
    });
  };


  // Get entity type label
  const getEntityTypeLabel = () => {
    switch (entityType) {
      case "stable":
        return "Stall";
      case "box":
        return "Stallboks";
      case "service":
        return "Tjeneste";
      case "partLoanHorse":
        return "Fôrhest";
      case "horseSale":
        return "Hest til salgs";
      default:
        return "";
    }
  };

  // Check if user can message using current user (server or client)
  const canMessage = currentUser && (!entityOwnerId || currentUser.id !== entityOwnerId);

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

        <Stack spacing={3}>
          {/* Owner and Entity info */}
          {showOwner && (
            <Stack direction="row" spacing={4}>
              {ownerNickname && (
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
                    {ownerNickname}
                  </Typography>
                </Box>
              )}

              <Box flex={1}>
                <Typography
                  variant="subtitle2"
                  className="text-body-sm"
                  sx={{ fontWeight: "bold", color: "rgb(17 24 39)" }}
                >
                  {getEntityTypeLabel()}
                </Typography>
                <Typography
                  variant="body2"
                  className="text-body-sm"
                  sx={{ fontWeight: 500, color: "rgb(75 85 99)" }}
                >
                  {entityName}
                </Typography>
              </Box>
            </Stack>
          )}

          {/* Address */}
          {addressLines.length > 0 && (
            <Box>
              <Typography
                variant="subtitle2"
                className="text-body-sm"
                sx={{ fontWeight: "bold", color: "rgb(17 24 39)" }}
              >
                Adresse
              </Typography>
              <Stack spacing={0.5}>
                {addressLines.map((line, index) => (
                  <Typography
                    key={index}
                    variant="body2"
                    className="text-body-sm"
                    sx={{ fontWeight: 500, color: "rgb(75 85 99)" }}
                  >
                    {line}
                  </Typography>
                ))}
              </Stack>
            </Box>
          )}

          {/* Contact Details */}
          {contactName && (
            <Box>
              <Typography
                variant="subtitle2"
                className="text-body-sm"
                sx={{ fontWeight: "bold", color: "rgb(17 24 39)", marginBottom: "8px" }}
              >
                Kontakt
              </Typography>
              <Typography
                variant="body2"
                className="text-body-sm"
                sx={{ fontWeight: 500, color: "rgb(75 85 99)" }}
              >
                {contactName}
              </Typography>
            </Box>
          )}

          {/* Contact Action Buttons */}
          <Box>
            <Stack spacing={2}>
              {/* Send Message button - always shown if user can message */}
              {canMessage && (
                <button
                  onClick={handleSendMessage}
                  disabled={createConversation.isPending}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                >
                  <ChatBubbleLeftRightIcon className="h-4 w-4" />
                  {createConversation.isPending ? "Starter samtale..." : "Send melding"}
                </button>
              )}

              {/* Email button - shown if email is provided */}
              {contactEmail && (
                <a
                  href={`mailto:${contactEmail}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <EnvelopeIcon className="h-4 w-4" />
                  Send e-post
                </a>
              )}

              {/* Phone button - shown if phone is provided */}
              {contactPhone && (
                <a
                  href={`tel:${contactPhone}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <PhoneIcon className="h-4 w-4" />
                  Ring {contactPhone}
                </a>
              )}

              {/* Show login prompt if not logged in */}
              {!currentUser && (
                <div className="text-center">
                  <Typography
                    variant="body2"
                    className="text-body-sm"
                    sx={{ color: "rgb(107 114 128)" }}
                  >
                    <a 
                      href={`/logg-inn?returnUrl=${encodeURIComponent(typeof window !== 'undefined' && document.referrer ? document.referrer : window?.location?.href || '')}`} 
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Logg inn
                    </a>{" "}
                    for å kontakte eieren
                  </Typography>
                </div>
              )}

              {/* Show message if owner viewing their own listing */}
              {currentUser && entityOwnerId && currentUser.id === entityOwnerId && (
                <div className="text-center">
                  <Typography
                    variant="body2"
                    className="text-body-sm"
                    sx={{ color: "rgb(107 114 128)" }}
                  >
                    Dette er din egen annonse
                  </Typography>
                </div>
              )}
            </Stack>
          </Box>
        </Stack>

        {/* Map */}
        {showMap && latitude && longitude && (
          <Box
            sx={{ marginTop: "24px", paddingTop: "24px", borderTop: "1px solid rgb(243 244 246)" }}
          >
            <StableMap
              latitude={latitude}
              longitude={longitude}
              stallName={entityName}
              address={address || ""}
              className="w-full h-32 rounded-xl overflow-hidden"
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
