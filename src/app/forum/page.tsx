import { Suspense } from 'react';
import { ForumMain } from './ForumMain';
import { Box, Skeleton, Stack } from '@mui/material';

export const metadata = {
  title: 'Forum - Stallplass',
  description: 'Diskuter alt om hester, stell og riding med andre hesteeiere på Stallplass forum.',
};

function ForumPageSkeleton() {
  return (
    <Box sx={{ py: { xs: 1, sm: 3 }, px: { xs: 0, sm: 2, md: 4 } }}>
      <Stack spacing={3}>
        {/* Header */}
        <Stack spacing={2} sx={{ py: 1, px: { xs: 2, sm: 0 } }}>
          <Skeleton width={200} height={40} />
          <Skeleton width="100%" height={56} />
        </Stack>

        {/* Content */}
        {[...Array(3)].map((_, i) => (
          <Box key={i}>
            <Skeleton height={40} sx={{ borderRadius: 1, mb: 0.5 }} />
            <Skeleton height={80} sx={{ borderRadius: 1 }} />
          </Box>
        ))}
      </Stack>
    </Box>
  );
}

export default async function ForumPage() {
  return (
    <Suspense fallback={<ForumPageSkeleton />}>
      <ForumMain />
    </Suspense>
  );
}