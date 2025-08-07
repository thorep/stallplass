'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Rating,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { useDeleteStableAdmin } from '@/hooks/useAdminQueries';
import { AdminStable } from '@/types/admin';

interface StablesAdminProps {
  initialStables: AdminStable[];
}

export function StablesAdmin({ initialStables }: StablesAdminProps) {
  const [stables, setStables] = useState(initialStables);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const deleteStableAdmin = useDeleteStableAdmin();

  const filteredStables = stables.filter(stable =>
    stable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.postalPlace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    stable.owner.nickname.toLowerCase().includes(searchTerm.toLowerCase())
  );


  const handleDelete = async (stableId: string) => {
    if (deleteConfirmId !== stableId) {
      setDeleteConfirmId(stableId);
      return;
    }

    try {
      await deleteStableAdmin.mutateAsync(stableId);
      setStables(prevStables => prevStables.filter(stable => stable.id !== stableId));
      setDeleteConfirmId(null);
    } catch {
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box className="space-y-6 p-4">
      <Typography variant="h4" component="h2" className="text-slate-800 mb-4">
        Staller
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Søk etter navn, sted eller eier..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-6"
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: '0.625rem',
          }
        }}
      />

      {isMobile ? (
        // Mobile Card Layout
        <Stack spacing={2}>
          {filteredStables.map((stable) => (
            <Card key={stable.id} className="hover:shadow-md transition-shadow">
              <CardContent>
                <Stack spacing={2}>
                  <Box className="flex items-start justify-between">
                    <Box className="flex-1">
                      <Typography variant="h6" className="text-slate-900">
                        {stable.name}
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {stable.postalPlace ? `${stable.postalCode} ${stable.postalPlace}` : stable.address}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(stable.id)}
                      disabled={deleteStableAdmin.isPending}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '0.375rem',
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      {deleteConfirmId === stable.id ? 'Bekreft?' : 'Slett'}
                    </Button>
                  </Box>

                  <Box>
                    <Typography variant="body2" className="text-slate-500">
                      Eier
                    </Typography>
                    <Typography variant="body2" className="text-slate-900 font-medium">
                      {stable.owner.nickname || 'Ingen navn'}
                    </Typography>
                  </Box>

                  <Box className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <Box>
                      <Typography variant="body2" className="text-slate-500 mb-1">
                        Statistikk
                      </Typography>
                      <Typography variant="body2" className="text-slate-900">
                        {stable._count.boxes} bokser
                      </Typography>
                      <Typography variant="body2" className="text-slate-900">
                        {stable._count.invoiceRequests} fakturaer
                      </Typography>
                      <Typography variant="body2" className="text-slate-900">
                        {stable._count.conversations} samtaler
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" className="text-slate-500 mb-1">
                        Vurdering
                      </Typography>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Rating
                          value={stable.rating}
                          readOnly
                          precision={0.1}
                          size="small"
                        />
                        <Typography variant="body2" className="text-slate-900">
                          {stable.rating.toFixed(1)}
                        </Typography>
                        <Typography variant="caption" className="text-slate-500">
                          ({stable.reviewCount})
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        // Desktop Table Layout
        <TableContainer component={Paper} className="shadow-sm rounded-lg">
          <Table>
            <TableHead className="bg-slate-50">
              <TableRow>
                <TableCell className="text-slate-500 font-medium">
                  Stall
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Eier
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Status
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Statistikk
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Vurdering
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Handlinger
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStables.map((stable) => (
                <TableRow key={stable.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-slate-900 font-medium">
                        {stable.name}
                      </Typography>
                      <Typography variant="caption" className="text-slate-500">
                        {stable.postalPlace ? `${stable.postalCode} ${stable.postalPlace}` : stable.address}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-slate-900">
                        {stable.owner.nickname || 'Ingen navn'}
                      </Typography>
                      <Typography variant="caption" className="text-slate-500">
                        {stable.owner.nickname}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {/* Featured status removed - stables cannot be featured */}
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-slate-500">
                        {stable._count.boxes} bokser
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {stable._count.invoiceRequests} fakturaer
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {stable._count.conversations} samtaler
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <Rating
                        value={stable.rating}
                        readOnly
                        precision={0.1}
                        size="small"
                      />
                      <Typography variant="body2" className="text-slate-900">
                        {stable.rating.toFixed(1)}
                      </Typography>
                      <Typography variant="caption" className="text-slate-500">
                        ({stable.reviewCount})
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant="contained"
                      color="error"
                      onClick={() => handleDelete(stable.id)}
                      disabled={deleteStableAdmin.isPending}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '0.375rem',
                        minWidth: 'auto'
                      }}
                    >
                      {deleteConfirmId === stable.id ? 'Bekreft?' : 'Slett'}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filteredStables.length === 0 && (
        <Paper className="p-8">
          <Typography variant="body1" className="text-center text-slate-500">
            Ingen staller funnet
          </Typography>
        </Paper>
      )}
    </Box>
  );
}