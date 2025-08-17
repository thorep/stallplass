import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import MineHesterClient from "@/components/organisms/MineHesterClient";
import { FeedbackLink } from "@/components/ui/feedback-link";
import { getUser } from "@/lib/server-auth";
import { faHorse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { Activity, Share } from "lucide-react";
import Link from "next/link";

export default async function MineHesterPage() {
  const user = await getUser();

  // If user is not authenticated, show landing page
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
        <Header />
        <main>
          <Container maxWidth="lg" className="py-12">
            <Stack spacing={6} alignItems="center">
              {/* Hero Section */}
              <Box textAlign="center" className="max-w-3xl mx-auto">
                <Typography variant="h1" className="text-h1 mb-4">
                  Administrer dine hester digitalt
                </Typography>
                <Typography variant="body1" className="text-body text-gray-600 mb-12">
                  Hold oversikt over dine hester, loggfør daglige aktiviteter, del informasjon med
                  andre og få full kontroll over hestehelsetjenestene.
                </Typography>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={2}
                  justifyContent="center"
                  marginTop={2}
                >
                  <Button
                    variant="contained"
                    size="large"
                    component={Link}
                    href="/registrer?returnUrl=/mine-hester"
                    color="primary"
                  >
                    Opprett konto
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    component={Link}
                    href="/logg-inn?returnUrl=/mine-hester"
                    color="primary"
                  >
                    Logg inn
                  </Button>
                </Stack>
              </Box>

              {/* Features Grid */}
              <Grid container spacing={4} className="mt-12">
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    className="p-6 h-full border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Box className="flex items-center mb-4">
                      <FontAwesomeIcon icon={faHorse} className="h-8 w-8 text-primary-600 mr-3" />
                      <Typography variant="h5" className="text-h5">
                        Hesteadministrasjon
                      </Typography>
                    </Box>
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Registrer alle dine hester med detaljert informasjon om rase, alder, helse og
                      trening. Hold alt samlet på ett sted.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    className="p-6 h-full border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Box className="flex items-center mb-4">
                      <Activity className="h-8 w-8 text-primary-600 mr-3" />
                      <Typography variant="h5" className="text-h5">
                        Aktivitetslogg
                      </Typography>
                    </Box>
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Loggfør daglige aktiviteter, treningsøkter, veterinærbesøk og medisinering.
                      Følg med på hestens utvikling over tid.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    className="p-6 h-full border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Box className="flex items-center mb-4">
                      <Share className="h-8 w-8 text-primary-600 mr-3" />
                      <Typography variant="h5" className="text-h5">
                        Del med andre
                      </Typography>
                    </Box>
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Gi tilgang til trenere, ryttere eller veterinærer. Samarbeid om hestens
                      velvære og del all informasjon enkelt.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </Stack>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // If user is authenticated but email not verified, redirect to verification
  if (!user.email_confirmed_at) {
    return (
      <div className="min-h-screen bg-white">
        <Header />
        <main>
          <Container maxWidth="sm" className="py-12">
            <Paper className="p-8 text-center">
              <Typography variant="h4" className="text-h4 mb-4">
                Verifiser e-posten din
              </Typography>
              <Typography variant="body1" className="text-body text-gray-600 mb-6">
                Du må verifisere e-postadressen din før du kan bruke Mine Hester.
              </Typography>
              <Button variant="contained" component={Link} href="/verifiser-epost" color="primary">
                Gå til verifisering
              </Button>
            </Paper>
          </Container>
        </main>
        <Footer />
      </div>
    );
  }

  // User is authenticated and verified, show the actual page
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main>
        <MineHesterClient />
        
        {/* Feedback Link */}
        <div className="mt-8 text-center pb-8">
          <FeedbackLink />
        </div>
      </main>
      <Footer />
    </div>
  );
}
