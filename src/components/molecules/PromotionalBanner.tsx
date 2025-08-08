import React from 'react';
import { Box, Typography } from '@mui/material';

export default function PromotionalBanner() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(to right, #22d3ee, #3b82f6)', // from-cyan-400 to-blue-400
        color: 'white',
        padding: 2,
        borderRadius: 2,
        marginBottom: 3,
        boxShadow: 3,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontSize: '1.125rem', // text-lg
              fontWeight: 600, // font-semibold
              marginBottom: 0.5, // mb-1
              lineHeight: 1.75,
            }}
          >
            -50% på all annonsering!
          </Typography>
          <Typography
            variant="body2"
            sx={{
              fontSize: '0.875rem', // text-sm
              opacity: 0.9, // opacity-90
              lineHeight: 1.25,
            }}
          >
            Gyldige ut august med kode:{' '}
            <Box
              component="span"
              sx={{
                fontWeight: 700, // font-bold
                fontSize: '1rem', // text-base
              }}
            >
              AUGUST50
            </Box>{' '}
            - 50% rabatt..
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}