"use client";

import { useAdminBudgets } from "@/hooks/useAdminQueries";
import {
  Alert,
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

type AdminBudgetItem = {
  id: string;
  title: string;
  category: string;
  amount: number;
  isRecurring: boolean;
  startMonth: string;
  endMonth?: string | null;
  intervalMonths?: number | null;
  intervalWeeks?: number | null;
  weekday?: number | null;
  anchorDay?: number | null;
  emoji?: string | null;
  notes?: string | null;
  createdAt: string;
  overrides: Array<{ id: string; month: string; overrideAmount: number | null; skip: boolean; note: string | null }>;
};

type AdminBudgetHorse = {
  id: string;
  name: string;
  owner: {
    id: string;
    firstname?: string | null;
    lastname?: string | null;
    nickname?: string | null;
  };
  createdAt: string;
  budgetItems: AdminBudgetItem[];
};

export function BudgetsAdmin() {
  const { data: horses = [], isLoading, error } = useAdminBudgets();

  if (isLoading && !horses?.length) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" py={4}>
        <CircularProgress />
        <Typography variant="body1" sx={{ ml: 2 }}>
          Laster budsjetter...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Kunne ikke laste budsjetter. Prøv igjen senere.
      </Alert>
    );
  }

  const getOwnerName = (owner: AdminBudgetHorse["owner"]) => {
    if (owner?.nickname) return owner.nickname;
    if (owner?.firstname && owner?.lastname) return `${owner.firstname} ${owner.lastname}`;
    if (owner?.firstname) return owner.firstname;
    return "Ukjent eier";
  };

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Budsjetter ({horses?.length || 0} hester)
        </Typography>
      </Stack>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Hest</TableCell>
              <TableCell>Eier</TableCell>
              <TableCell>Antall linjer</TableCell>
              <TableCell>Gjentakende</TableCell>
              <TableCell>Engangs</TableCell>
              <TableCell>Sum (basis)</TableCell>
              <TableCell>Overstyringer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {horses?.map((horse: AdminBudgetHorse) => {
              const recurring = horse.budgetItems.filter((i) => i.isRecurring);
              const oneOff = horse.budgetItems.filter((i) => !i.isRecurring);
              const baseSum = horse.budgetItems.reduce((sum, i) => sum + (i.amount || 0), 0);
              const overrideCount = horse.budgetItems.reduce((sum, i) => sum + (i.overrides?.length || 0), 0);

              return (
                <TableRow key={horse.id}>
                  <TableCell>
                    <Stack>
                      <Typography variant="subtitle2" fontWeight="bold">{horse.name}</Typography>
                      <Typography variant="caption" color="text.secondary">{horse.id}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{getOwnerName(horse.owner)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={horse.budgetItems.length} size="small" />
                  </TableCell>
                  <TableCell>
                    <Chip label={recurring.length} size="small" color={recurring.length ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Chip label={oneOff.length} size="small" color={oneOff.length ? 'secondary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{baseSum.toLocaleString('no-NO')} kr</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={overrideCount} size="small" color={overrideCount ? 'warning' : 'default'} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {horses?.length === 0 && (
        <Box textAlign="center" py={4}>
          <Typography variant="body1" color="text.secondary">
            Ingen budsjetter funnet.
          </Typography>
        </Box>
      )}

      {/* Detail view per horse: simple list below the table */}
      {horses?.map((horse: AdminBudgetHorse) => (
        <Box key={`details-${horse.id}`} mt={4}>
          <Typography variant="h6" gutterBottom>
            {horse.name} — linjer ({horse.budgetItems.length})
          </Typography>
          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Tittel</TableCell>
                  <TableCell>Kategori</TableCell>
                  <TableCell>Beløp</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Periode</TableCell>
                  <TableCell>Overstyringer</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {horse.budgetItems.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell>{it.emoji ? `${it.emoji} ` : ''}{it.title}</TableCell>
                    <TableCell>{it.category}</TableCell>
                    <TableCell>{it.amount.toLocaleString('no-NO')} kr</TableCell>
                    <TableCell>{it.isRecurring ? 'Gjentakende' : 'Engangs'}</TableCell>
                    <TableCell>
                      {it.startMonth}
                      {it.endMonth ? ` → ${it.endMonth}` : ''}
                    </TableCell>
                    <TableCell>
                      {it.overrides.length > 0 ? (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Chip label={it.overrides.length} size="small" color="warning" />
                          <Typography variant="caption" color="text.secondary">
                            {it.overrides.slice(0, 3).map((o) => o.month).join(', ')}{it.overrides.length > 3 ? '…' : ''}
                          </Typography>
                        </Stack>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Ingen</Typography>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}
    </Box>
  );
}

