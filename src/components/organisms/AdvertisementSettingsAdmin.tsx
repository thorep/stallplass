'use client';

import { useState, useEffect } from 'react';
import { 
  useAdvertisementSettings, 
  useUpdateAdvertisementSettings,
  type AdvertisementSettings 
} from '@/hooks/useAdvertisementSettings';
import { 
  Card, 
  CardContent, 
  Typography, 
  TextField, 
  Button, 
  Box,
  Alert,
  CircularProgress,
  Slider
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { MegaphoneIcon } from '@heroicons/react/24/outline';
import { toast } from 'sonner';

export function AdvertisementSettingsAdmin() {
  const { data: settings, isLoading, error } = useAdvertisementSettings();
  const updateSettings = useUpdateAdvertisementSettings();
  
  const [formData, setFormData] = useState<AdvertisementSettings>({
    advertisementChance: 50,
    advertisementMinPos: 1,
    advertisementMaxPos: 40,
  });

  // Update form data when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateSettings.mutateAsync(formData);
      toast.success('Annonse-innstillinger oppdatert');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Feil ved oppdatering');
    }
  };

  const handleReset = () => {
    if (settings) {
      setFormData(settings);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Feil ved lasting av annonse-innstillinger. Sjekk at du har admin-tilgang.
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <MegaphoneIcon className="h-6 w-6 mr-2 text-[#5B4B8A]" />
        <Typography variant="h4" component="h1">
          Annonse-innstillinger
        </Typography>
      </Box>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Kontroller hvordan annonser vises i søkeresultater
          </Typography>
          
          <form onSubmit={handleSubmit}>
            <Grid container spacing={4}>
              {/* Advertisement Chance */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Sjanse for å vise annonse (%)
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Prosent sjanse for at annonse vises når noen søker
                </Typography>
                <Box sx={{ px: 2, mt: 2 }}>
                  <Slider
                    value={formData.advertisementChance}
                    onChange={(_, value) => 
                      setFormData(prev => ({ ...prev, advertisementChance: value as number }))
                    }
                    min={0}
                    max={100}
                    step={5}
                    marks={[
                      { value: 0, label: '0%' },
                      { value: 25, label: '25%' },
                      { value: 50, label: '50%' },
                      { value: 75, label: '75%' },
                      { value: 100, label: '100%' },
                    ]}
                    valueLabelDisplay="on"
                    valueLabelFormat={(value) => `${value}%`}
                  />
                </Box>
                <TextField
                  type="number"
                  label="Eksakt verdi (%)"
                  value={formData.advertisementChance}
                  onChange={(e) => 
                    setFormData(prev => ({ 
                      ...prev, 
                      advertisementChance: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
                    }))
                  }
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                  size="small"
                  sx={{ mt: 2, width: '150px' }}
                />
              </Grid>

              {/* Position Range */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography variant="subtitle1" gutterBottom>
                  Posisjonsområde
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Hvor i søkeresultatene annonsen kan vises
                </Typography>
                
                <Box sx={{ mt: 2 }}>
                  <TextField
                    label="Minimum posisjon"
                    type="number"
                    value={formData.advertisementMinPos}
                    onChange={(e) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        advertisementMinPos: Math.max(1, parseInt(e.target.value) || 1)
                      }))
                    }
                    inputProps={{ min: 1 }}
                    size="small"
                    sx={{ mr: 2, width: '150px' }}
                  />
                  
                  <TextField
                    label="Maksimum posisjon"
                    type="number"
                    value={formData.advertisementMaxPos}
                    onChange={(e) => 
                      setFormData(prev => ({ 
                        ...prev, 
                        advertisementMaxPos: Math.max(prev.advertisementMinPos, parseInt(e.target.value) || 40)
                      }))
                    }
                    inputProps={{ min: formData.advertisementMinPos }}
                    size="small"
                    sx={{ width: '150px' }}
                  />
                </Box>
                
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Annonsen kan vises på posisjon {formData.advertisementMinPos}-{formData.advertisementMaxPos}
                </Typography>
              </Grid>

              {/* Preview */}
              <Grid size={12}>
                <Alert severity="info">
                  <Typography variant="subtitle2" gutterBottom>
                    Forhåndsvisning av innstillinger:
                  </Typography>
                  <Typography variant="body2">
                    • Ved {formData.advertisementChance}% av søk vil annonse vises
                  </Typography>
                  <Typography variant="body2">
                    • Annonsen vises tilfeldig mellom posisjon {formData.advertisementMinPos} og {formData.advertisementMaxPos}
                  </Typography>
                  <Typography variant="body2">
                    • Hvis det er færre enn {formData.advertisementMaxPos} søkeresultater, justeres maksposisjonen automatisk
                  </Typography>
                </Alert>
              </Grid>

              {/* Action Buttons */}
              <Grid size={12}>
                <Box display="flex" gap={2}>
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={updateSettings.isPending}
                    startIcon={updateSettings.isPending ? <CircularProgress size={20} /> : undefined}
                  >
                    {updateSettings.isPending ? 'Lagrer...' : 'Lagre innstillinger'}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outlined"
                    onClick={handleReset}
                    disabled={updateSettings.isPending}
                  >
                    Tilbakestill
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}
