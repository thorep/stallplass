import { Skeleton, Container, Stack, Box } from '@mui/material';

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="h-16 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
          <Skeleton variant="rectangular" width={120} height={32} className="rounded" />
          <Skeleton variant="rectangular" width={100} height={32} className="rounded" />
        </div>
      </div>

      <Container maxWidth="xl" className="py-6">
        <Stack spacing={4}>
          {/* Loading breadcrumbs */}
          <Box sx={{ height: 20, bgcolor: 'grey.200', borderRadius: 1, width: 300 }} />
          
          {/* Loading header */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Stack spacing={1}>
              <div className="flex items-center space-x-3">
                <Skeleton variant="circular" width={32} height={32} />
                <Skeleton width={200} height={40} />
              </div>
              <Skeleton width={300} height={20} />
            </Stack>
            <Skeleton width={140} height={40} className="rounded" />
          </Stack>
          
          {/* Loading stats/filters section */}
          <Stack direction="row" spacing={2} className="flex-wrap">
            <Skeleton width={150} height={80} sx={{ borderRadius: 2 }} />
            <Skeleton width={150} height={80} sx={{ borderRadius: 2 }} />
            <Skeleton width={150} height={80} sx={{ borderRadius: 2 }} />
          </Stack>

          {/* Sort Controls */}
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Skeleton width={180} height={24} />
            <Skeleton width={120} height={36} className="rounded" />
          </Stack>
          
          {/* Loading thread list */}
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-start space-x-4">
                  {/* Avatar */}
                  <Skeleton variant="circular" width={40} height={40} />
                  
                  <div className="flex-1 space-y-2">
                    {/* Thread title and metadata */}
                    <div className="flex items-center justify-between">
                      <Skeleton width="60%" height={24} />
                      <Skeleton width={80} height={20} />
                    </div>
                    
                    {/* Thread preview */}
                    <Skeleton width="80%" height={20} />
                    
                    {/* Thread stats */}
                    <div className="flex items-center space-x-4 pt-2">
                      <div className="flex items-center space-x-2">
                        <Skeleton variant="circular" width={16} height={16} />
                        <Skeleton width={60} height={16} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton variant="circular" width={16} height={16} />
                        <Skeleton width={40} height={16} />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton variant="circular" width={16} height={16} />
                        <Skeleton width={80} height={16} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination skeleton */}
          <div className="flex justify-center pt-4">
            <Skeleton width={200} height={40} className="rounded" />
          </div>
        </Stack>
      </Container>
    </div>
  );
}