"use client";

import { useAdminHorses } from "@/hooks/useAdminQueries";
import {
  Alert,
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { format } from "date-fns";
import { nb } from "date-fns/locale";
import { useRouter } from "next/navigation";

export interface AdminHorse {
  id: string;
  name: string;
  breed?: string;
  age?: number;
  color?: string;
  gender?: string;
  createdAt: string;
  profiles: {
    id: string;
    firstname?: string;
    lastname?: string;
    nickname?: string;
  };
  stable?: {
    id: string;
    name: string;
  };
  _count: {
    customLogs: number;
    horseShares: number;
    budget_items: number;
  };
}

interface HorsesAdminProps {
  initialHorses?: AdminHorse[];
}

export function HorsesAdmin({ initialHorses = [] }: HorsesAdminProps) {
  const router = useRouter();
  const { data: horses = initialHorses, isLoading, error } = useAdminHorses();

  if (isLoading && !horses?.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Laster hester...
        </Typography>
      </Box>
    );
  }
  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Kunne ikke laste hester. Prøv igjen senere.
      </Alert>
    );
  }

  const getDisplayName = (profiles: AdminHorse["profiles"]) => {
    if (profiles.nickname) return profiles.nickname;
    if (profiles.firstname && profiles.lastname) {
      return `${profiles.firstname} ${profiles.lastname}`;
    }
    if (profiles.firstname) return profiles.firstname;
    return "Ukjent eier";
  };

  const getHorseInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getGenderColor = (gender?: string) => {
    switch (gender) {
      case "STALLION":
        return "primary";
      case "MARE":
        return "secondary";
      case "GELDING":
        return "default";
      default:
        return "default";
    }
  };

  const getGenderLabel = (gender?: string) => {
    switch (gender) {
      case "STALLION":
        return "Hingst";
      case "MARE":
        return "Hoppe";
      case "GELDING":
        return "Vallak";
      default:
        return "Ukjent";
    }
  };
  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Hester ({horses?.length || 0})
        </Typography>
      </Stack>


      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hest</TableCell>
              <TableCell>Eier</TableCell>
              <TableCell>Stall</TableCell>
              <TableCell>Detaljer</TableCell>
              <TableCell>Logger</TableCell>
              <TableCell>Delinger</TableCell>
              <TableCell>Budsjett</TableCell>
              <TableCell>Opprettet</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {horses?.map((horse: AdminHorse) => (
              <TableRow 
                key={horse.id}
                hover
                sx={{ cursor: 'pointer' }}
                onClick={() => router.push(`/mine-hester/${horse.id}`)}
              >
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Avatar sx={{ bgcolor: "primary.main", width: 40, height: 40 }}>
                      {getHorseInitials(horse.name)}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">
                        {horse.name}
                      </Typography>
                      {horse.breed && (
                        <Typography variant="caption" color="text.secondary">
                          {horse.breed}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </TableCell>

                <TableCell>
                  <Typography variant="body2">{getDisplayName(horse.profiles)}</Typography>
                </TableCell>

                <TableCell>
                  {horse.stable ? (
                    <Typography variant="body2">{horse.stable.name}</Typography>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      Ingen stall
                    </Typography>
                  )}
                </TableCell>

                <TableCell>
                  <Stack spacing={1}>
                    {horse.age && <Typography variant="caption">{horse.age} år</Typography>}
                    {horse.gender && (
                      <Chip
                        label={getGenderLabel(horse.gender)}
                        size="small"
                        color={getGenderColor(horse.gender) as "primary" | "secondary" | "default"}
                        variant="outlined"
                      />
                    )}
                    {horse.color && (
                      <Typography variant="caption" color="text.secondary">
                        {horse.color}
                      </Typography>
                    )}
                  </Stack>
                </TableCell>

                <TableCell>
                  <Chip
                    label={horse._count.customLogs}
                    size="small"
                    color={horse._count.customLogs > 0 ? "success" : "default"}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={horse._count.horseShares}
                    size="small"
                    color={horse._count.horseShares > 0 ? "info" : "default"}
                  />
                </TableCell>

                <TableCell>
                  <Chip
                    label={horse._count.budget_items}
                    size="small"
                    color={horse._count.budget_items > 0 ? "warning" : "default"}
                  />
                </TableCell>

                <TableCell>
                  <Typography variant="caption" color="text.secondary">
                    {format(new Date(horse.createdAt), "dd.MM.yyyy", { locale: nb })}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {horses?.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Ingen hester funnet.
          </Typography>
        </Box>
      )}
    </Box>
  );
}
