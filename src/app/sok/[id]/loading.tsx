import { Skeleton } from '@mui/material';
import { Stack, Box, Grid } from '@mui/material';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Grid container spacing={3}>
          {/* Venstre side - Bilder og info */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Stack spacing={3}>
              {/* Bildegalleri skeleton */}
              <Box className="bg-white rounded-lg shadow-sm p-4">
                <Skeleton variant="rectangular" height={400} className="rounded-lg" />
                <Stack direction="row" spacing={1} className="mt-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} variant="rectangular" width={80} height={60} className="rounded" />
                  ))}
                </Stack>
              </Box>

              {/* Info skeleton */}
              <Box className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton variant="text" width="60%" height={40} className="mb-2" />
                <Skeleton variant="text" width="40%" height={24} className="mb-4" />
                <Skeleton variant="rectangular" height={100} className="rounded" />
              </Box>

              {/* Fasiliteter skeleton */}
              <Box className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton variant="text" width="30%" height={32} className="mb-4" />
                <Grid container spacing={2}>
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Grid key={i} size={{ xs: 6, sm: 4 }}>
                      <Skeleton variant="rectangular" height={40} className="rounded" />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </Grid>

          {/* Høyre side - Kontakt og bokser */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Stack spacing={3}>
              {/* Kontakt skeleton */}
              <Box className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton variant="text" width="50%" height={32} className="mb-4" />
                <Stack spacing={2}>
                  <Skeleton variant="rectangular" height={48} className="rounded" />
                  <Skeleton variant="rectangular" height={48} className="rounded" />
                </Stack>
              </Box>

              {/* Bokser skeleton */}
              <Box className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton variant="text" width="40%" height={32} className="mb-4" />
                {[1, 2, 3].map((i) => (
                  <Box key={i} className="mb-4 pb-4 border-b last:border-0">
                    <Skeleton variant="text" width="70%" height={24} className="mb-2" />
                    <Skeleton variant="text" width="50%" height={20} />
                  </Box>
                ))}
              </Box>
            </Stack>
          </Grid>
        </Grid>
      </div>
    </div>
  );
}