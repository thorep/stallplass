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
  Chip,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { ShieldCheckIcon, HomeModernIcon } from '@heroicons/react/24/outline';
import { useUpdateProfileAdmin } from '@/hooks/useAdminQueries';
import { formatDate } from '@/utils/formatting';
import { AdminProfile } from '@/types/admin';

interface ProfilesAdminProps {
  initialProfiles: AdminProfile[];
}

export function ProfilesAdmin({ initialProfiles }: ProfilesAdminProps) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [searchTerm, setSearchTerm] = useState('');
  const updateProfileAdmin = useUpdateProfileAdmin();

  const filteredProfiles = profiles.filter(profile =>
    profile.nickname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.firstname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.lastname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleToggleAdmin = async (profileId: string, currentStatus: boolean) => {
    try {
      await updateProfileAdmin.mutateAsync({
        profileId: profileId,
        isAdmin: !currentStatus
      });
      
      setProfiles(prevProfiles =>
        prevProfiles.map(profile =>
          profile.id === profileId ? { ...profile, isAdmin: !currentStatus } : profile
        )
      );
    } catch {
    }
  };

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box className="space-y-6 p-4">
      <Typography variant="h4" component="h2" className="text-slate-800 mb-4">
        Profiler
      </Typography>
      
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Søk etter navn, e-post eller profil-ID..."
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
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="hover:shadow-md transition-shadow">
              <CardContent>
                <Stack spacing={2}>
                  <Box className="flex items-start justify-between">
                    <Box>
                      <Typography variant="h6" className="text-slate-900">
                        {profile.nickname || profile.firstname || 'Ingen navn'}
                      </Typography>
                      <Typography variant="caption" className="text-slate-500 font-mono">
                        {profile.id}
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant={profile.isAdmin ? "contained" : "outlined"}
                      color={profile.isAdmin ? "error" : "primary"}
                      onClick={() => handleToggleAdmin(profile.id, profile.isAdmin || false)}
                      disabled={updateProfileAdmin.isPending}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '0.375rem',
                        minWidth: 'auto',
                        px: 2
                      }}
                    >
                      {updateProfileAdmin.isPending ? (
                        <CircularProgress size={16} />
                      ) : (
                        profile.isAdmin ? 'Fjern admin' : 'Gjør til admin'
                      )}
                    </Button>
                  </Box>

                  <Box>
                    <Typography variant="body2" className="text-slate-900">
                      {profile.nickname}
                    </Typography>
                    {profile.phone && (
                      <Typography variant="body2" className="text-slate-500">
                        {profile.phone}
                      </Typography>
                    )}
                  </Box>

                  <Box className="flex flex-wrap gap-2">
                    {profile.isAdmin && (
                      <Chip
                        icon={<ShieldCheckIcon className="w-3 h-3" />}
                        label="Admin"
                        size="small"
                        color="secondary"
                        sx={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}
                      />
                    )}
                    {profile._count.stables > 0 && (
                      <Chip
                        icon={<HomeModernIcon className="w-3 h-3" />}
                        label="Stall eier"
                        size="small"
                        sx={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                      />
                    )}
                  </Box>

                  <Box className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <Box>
                      <Typography variant="body2" className="text-slate-500">
                        Statistikk
                      </Typography>
                      <Typography variant="body2" className="text-slate-900">
                        {profile._count.stables} staller
                      </Typography>
                      <Typography variant="body2" className="text-slate-900">
                        {profile._count.stables} fakturaer
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" className="text-slate-500">
                        Registrert
                      </Typography>
                      <Typography variant="body2" className="text-slate-900">
                        {formatDate(profile.createdAt)}
                      </Typography>
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
                  Profil
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Kontakt
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Status
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Statistikk
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Registrert
                </TableCell>
                <TableCell className="text-slate-500 font-medium">
                  Handlinger
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProfiles.map((profile) => (
                <TableRow key={profile.id} className="hover:bg-slate-50">
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-slate-900 font-medium">
                        {profile.nickname || profile.firstname || 'Ingen navn'}
                      </Typography>
                      <Typography variant="caption" className="text-slate-500 font-mono">
                        {profile.id}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-slate-900">
                        {profile.nickname}
                      </Typography>
                      {profile.phone && (
                        <Typography variant="body2" className="text-slate-500">
                          {profile.phone}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box className="flex items-center space-x-2">
                      {profile.isAdmin && (
                        <Chip
                          icon={<ShieldCheckIcon className="w-3 h-3" />}
                          label="Admin"
                          size="small"
                          color="secondary"
                          sx={{ backgroundColor: '#f3e8ff', color: '#7c3aed' }}
                        />
                      )}
                      {profile._count.stables > 0 && (
                        <Chip
                          icon={<HomeModernIcon className="w-3 h-3" />}
                          label="Stall eier"
                          size="small"
                          sx={{ backgroundColor: '#dcfce7', color: '#16a34a' }}
                        />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-slate-500">
                        {profile._count.stables} staller
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {profile._count.stables} fakturaer
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" className="text-slate-500">
                      {formatDate(profile.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      variant={profile.isAdmin ? "contained" : "outlined"}
                      color={profile.isAdmin ? "error" : "primary"}
                      onClick={() => handleToggleAdmin(profile.id, profile.isAdmin || false)}
                      disabled={updateProfileAdmin.isPending}
                      sx={{
                        textTransform: 'none',
                        borderRadius: '0.375rem',
                        minWidth: 'auto'
                      }}
                    >
                      {updateProfileAdmin.isPending ? (
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <CircularProgress size={12} />
                          <Typography variant="caption">Oppdaterer...</Typography>
                        </Stack>
                      ) : (
                        profile.isAdmin ? 'Fjern admin' : 'Gjør til admin'
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {filteredProfiles.length === 0 && (
        <Paper className="p-8">
          <Typography variant="body1" className="text-center text-slate-500">
            Ingen profiler funnet
          </Typography>
        </Paper>
      )}
    </Box>
  );
}