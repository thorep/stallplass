import DashboardClient from "@/components/organisms/DashboardClient";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { getUser } from "@/lib/server-auth";
import { getAllStableAmenities } from "@/services/amenity-service";
import { getPublicStats } from "@/services/public-stats-service";
import { faHorse } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Box, Button, Container, Grid, Paper, Stack, Typography } from "@mui/material";
import { BarChart3, MapPin, MessageSquare, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const user = await getUser();
  const stats = await getPublicStats();

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
                  Administrer din stall
                </Typography>
                <Typography variant="body1" className="text-body text-gray-600 mb-8">
                  Opprett din stall og stallplasser, legg til bilder, angi ledighet og motta meldinger fra interesserte - alt samlet på ett sted.
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
                    href="/registrer?returnUrl=/dashboard"
                    color="primary"
                  >
                    Opprett stallkonto
                  </Button>
                  <Button
                    variant="outlined"
                    size="large"
                    component={Link}
                    href="/logg-inn?returnUrl=/dashboard"
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
                        Stallplassadministrasjon
                      </Typography>
                    </Box>
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Administrer alle dine stallplasser og leietakere. Hold oversikt over hvem som
                      leier hva og angi når du forventer at plasser blir ledige.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    className="p-6 h-full border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Box className="flex items-center mb-4">
                      <TrendingUp className="h-8 w-8 text-primary-600 mr-3" />
                      <Typography variant="h5" className="text-h5">
                        Annonseringssystem
                      </Typography>
                    </Box>
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Markedsfør din stall og ledige stallplasser gratis. Nå ut til tusenvis av
                      hesteinteresserte over hele Norge.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    className="p-6 h-full border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Box className="flex items-center mb-4">
                      <MessageSquare className="h-8 w-8 text-primary-600 mr-3" />
                      <Typography variant="h5" className="text-h5">
                        Kundebehandling
                      </Typography>
                    </Box>
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Kommuniser enkelt med leietakere og interessenter. Svar på henvendelser og
                      administrer forespørsler effektivt.
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper
                    elevation={0}
                    className="p-6 h-full border border-gray-200 hover:shadow-md transition-shadow"
                  >
                    <Box className="flex items-center mb-4">
                      <BarChart3 className="h-8 w-8 text-primary-600 mr-3" />
                      <Typography variant="h5" className="text-h5">
                        Oversikt og statistikk
                      </Typography>
                    </Box>
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Få oversikt over din stall med statistikk over hvor mange som har sett på
                      stallen din og dine stallplasser.
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Testimonial or Value Prop */}
              <Box className="bg-primary-50 rounded-lg p-8 w-full mt-8">
                <Grid container spacing={4} alignItems="center">
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Typography variant="h4" className="text-h4 mb-3">
                      Bli en del av Norges største stallnettverk
                    </Typography>
                    <Typography variant="body1" className="text-body text-gray-700 mb-4">
                      Over {stats.activeStables} staller bruker allerede Stallplass for å
                      administrere sine anlegg og nå ut til nye kunder.
                    </Typography>
                    <Stack direction="row" spacing={4}>
                      <Box>
                        <Typography variant="h3" className="text-h3 text-primary-600">
                          {stats.activeStables}+
                        </Typography>
                        <Typography variant="body2" className="text-caption text-gray-600">
                          Aktive staller
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="h3" className="text-h3 text-primary-600">
                          {stats.registeredUsers.toLocaleString("no-NO")}+
                        </Typography>
                        <Typography variant="body2" className="text-caption text-gray-600">
                          Registrerte brukere
                        </Typography>
                      </Box>
                    </Stack>
                  </Grid>
                  <Grid size={{ xs: 12, md: 6 }} className="text-center">
                    <MapPin className="h-24 w-24 text-primary-200 mx-auto mb-4" />
                    <Typography variant="body1" className="text-body-sm text-gray-600">
                      Staller over hele Norge bruker Stallplass
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main>
          <Container maxWidth="sm" className="py-12">
            <Paper className="p-8 text-center">
              <Typography variant="h4" className="text-h4 mb-4">
                Verifiser e-posten din
              </Typography>
              <Typography variant="body1" className="text-body text-gray-600 mb-6">
                Du må verifisere e-postadressen din før du kan bruke kontrollpanelet.
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

  // User is authenticated and verified, show the actual dashboard
  const amenities = await getAllStableAmenities();

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main>
        <DashboardClient userId={user.id} user={user} amenities={amenities} />
      </main>
      <Footer />
    </div>
  );
}
