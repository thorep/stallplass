"use client";

import { CategorySection } from "@/components/forum/CategorySection";
import { useForumSections } from "@/hooks/useForum";
import { Forum } from "@mui/icons-material";
import {
  Box,
  Container,
  Skeleton,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import type { User } from "@supabase/supabase-js";
interface ForumMainProps {
  user: User;
}

export function ForumMain({ user }: ForumMainProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Fetch sections with categories
  const { data: sections = [], isLoading: sectionsLoading } = useForumSections();

  return (
    <Container maxWidth="xl" className="py-3 px-2 sm:px-4">
      <Stack spacing={2}>
        {/* Header */}
        <Stack spacing={0} sx={{ py: 1 }}>
          <Typography
            className="text-h3 font-bold"
            sx={{
              color: "primary.main",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Forum fontSize={isMobile ? "medium" : "large"} />
            Forum
          </Typography>
          <Typography
            className="text-body-sm text-gray-600"
            sx={{ display: { xs: "none", sm: "block" } }}
          >
            Diskuter alt om hester, stell og riding med andre hesteeiere
          </Typography>
        </Stack>


        {/* Forum Sections */}
        <Stack spacing={1}>
          {sectionsLoading ? (
            // Loading skeletons for sections
            [...Array(3)].map((_, i) => (
              <Box key={i}>
                <Skeleton height={40} sx={{ borderRadius: 1, mb: 0.5 }} />
                <Skeleton height={80} sx={{ borderRadius: 1 }} />
              </Box>
            ))
          ) : sections.length > 0 ? (
            sections.map((section) => (
              <CategorySection
                key={section.id}
                title={section.name}
                description={section.description || undefined}
                categories={section.categories}
                backgroundColor={section.color || "primary.main"}
              />
            ))
          ) : (
            // Empty state when no sections
            <Box
              sx={{
                p: 4,
                textAlign: "center",
                borderRadius: 1,
                backgroundColor: "grey.50",
                border: 1,
                borderColor: "divider",
              }}
            >
              <Forum sx={{ fontSize: 32, color: "grey.400", mb: 1 }} />
              <Typography className="text-h5 text-gray-600 mb-1">
                Ingen forum kategorier ennå
              </Typography>
              <Typography className="text-body-sm text-gray-500">
                Forum kategorier vil vises her når de er opprettet
              </Typography>
            </Box>
          )}
        </Stack>
      </Stack>
    </Container>
  );
}
