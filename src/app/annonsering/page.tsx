import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import {
  getAllBoxQuantityDiscounts,
  getAllDiscounts,
  getBoxAdvertisingPriceObject,
} from "@/services/pricing-service";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import CampaignIcon from "@mui/icons-material/Campaign";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import GroupIcon from "@mui/icons-material/Group";
import PaymentIcon from "@mui/icons-material/Payment";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
  Alert,
  Box,
  Button,
  Container,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import Link from "next/link";

// Force dynamic rendering to avoid database calls during build
export const dynamic = "force-dynamic";

export default async function AdvertisingPage() {
  let boxAdvertisingPrice = null;
  let discounts: Awaited<ReturnType<typeof getAllDiscounts>> = [];
  let boxQuantityDiscounts: Awaited<ReturnType<typeof getAllBoxQuantityDiscounts>> = [];

  try {
    boxAdvertisingPrice = await getBoxAdvertisingPriceObject();
    discounts = await getAllDiscounts();
    boxQuantityDiscounts = await getAllBoxQuantityDiscounts();
  } catch {
    // Fallback pricing will be shown if API fails
  }

  const basePrice = boxAdvertisingPrice?.price || 299;
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="py-8 sm:py-16">
        <Container maxWidth="lg">
          <Stack spacing={4}>
            {/* Hero Section */}
            <Paper
              elevation={0}
              sx={{ p: 4, bgcolor: "primary.main", color: "white", borderRadius: 2 }}
            >
              <Stack spacing={2} alignItems="center" textAlign="center">
                <CampaignIcon sx={{ fontSize: 48 }} />
                <Typography variant="h3" component="h1" fontWeight="bold">
                  Annonsering på Stallplass.no
                </Typography>
                <Typography variant="h6" sx={{ maxWidth: "600px" }}>
                  Få dine stallplasser synlig for tusenvis av hesteinteresserte over hele Norge
                </Typography>
              </Stack>
            </Paper>

            {/* Benefits Section */}
            <Stack spacing={3}>
              <Typography variant="h4" component="h2" fontWeight="medium">
                Hvorfor annonsere på Stallplass.no?
              </Typography>

              <Paper sx={{ p: 4 }}>
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <VisibilityIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Økt synlighet"
                      secondary="Dine stallplasser blir synlige i søkeresultater og på kartet for alle besøkende"
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <GroupIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Målrettet"
                      secondary="Nå ut til hesteiere som aktivt leter etter stallplass i ditt område"
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <TrendingUpIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Henvendelser"
                      secondary="Motta direkte henvendelser fra interesserte leietakere gjennom plattformen"
                    />
                  </ListItem>

                  <ListItem>
                    <ListItemIcon>
                      <CheckCircleIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Enkel administrasjon"
                      secondary="Hold oversikt over ledige plasser, priser og henvendelser på ett sted"
                    />
                  </ListItem>
                </List>
              </Paper>
            </Stack>

            <Divider />

            {/* How it works Section */}
            <Stack spacing={3}>
              <Typography variant="h4" component="h2" fontWeight="medium">
                Slik fungerer det
              </Typography>

              <Stack spacing={2}>
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      1
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6">Opprett stall og stallplasser</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Registrer din stall og legg til alle dine stallplasser helt gratis
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      2
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6">Aktiver annonsering</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Velg hvilke stallplasser du ønsker å annonsere og hvor lenge
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "white",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                      }}
                    >
                      3
                    </Box>
                    <Box flex={1}>
                      <Typography variant="h6">Motta henvendelser</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Interesserte leietakere kan kontakte deg direkte gjennom plattformen
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Stack>
            </Stack>

            <Divider />

            {/* Pricing Section */}
            <Stack spacing={3}>
              <Typography variant="h4" component="h2" fontWeight="medium">
                Priser
              </Typography>

              <Alert severity="info" icon={<PaymentIcon />}>
                <Typography variant="body1">
                  <strong>Enkel og transparent prising</strong>
                </Typography>
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Du betaler kun for aktiv annonsering. Opprettelse av stall og stallplasser er helt
                  gratis.
                </Typography>
              </Alert>

              <Paper sx={{ p: 4 }}>
                <Stack spacing={3}>
                  <Box>
                    <Typography variant="h5" gutterBottom>
                      Annonseringspakker
                    </Typography>
                    <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                      Velg pakke basert på hvor mange stallplasser du ønsker å annonsere og hvor
                      lenge.
                    </Typography>
                  </Box>

                  <Stack spacing={2}>
                    {/* 1 month */}
                    <Paper variant="outlined" sx={{ p: 3 }}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        justifyContent="space-between"
                        alignItems={{ sm: "center" }}
                        spacing={2}
                      >
                        <Box>
                          <Typography variant="h6">1 måned</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Perfekt for korttidsutleie
                          </Typography>
                        </Box>
                        <Typography variant="h5" color="primary.main" fontWeight="bold">
                          kr {basePrice},-
                        </Typography>
                      </Stack>
                    </Paper>

                    {/* 3 months */}
                    {(() => {
                      const discount3 = discounts.find((d) => d.months === 3);
                      const price3Months = discount3
                        ? Math.round(basePrice * 3 * (1 - discount3.percentage / 100))
                        : basePrice * 3;
                      const monthlyPrice3 = Math.round(price3Months / 3);

                      return (
                        <Paper variant="outlined" sx={{ p: 3 }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ sm: "center" }}
                            spacing={2}
                          >
                            <Box>
                              <Typography variant="h6">3 måneder</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {discount3 &&
                                  `Spar ${discount3.percentage}% - kun kr ${monthlyPrice3},- per måned`}
                              </Typography>
                            </Box>
                            <Typography variant="h5" color="primary.main" fontWeight="bold">
                              kr {price3Months},-
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })()}

                    {/* 6 months */}
                    {(() => {
                      const discount6 = discounts.find((d) => d.months === 6);
                      const price6Months = discount6
                        ? Math.round(basePrice * 6 * (1 - discount6.percentage / 100))
                        : basePrice * 6;
                      const monthlyPrice6 = Math.round(price6Months / 6);

                      return (
                        <Paper variant="outlined" sx={{ p: 3 }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ sm: "center" }}
                            spacing={2}
                          >
                            <Box>
                              <Typography variant="h6">6 måneder</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {discount6
                                  ? `Spar ${discount6.percentage}% - kun kr ${monthlyPrice6},- per måned`
                                  : "God balanse mellom pris og varighet"}
                              </Typography>
                            </Box>
                            <Typography variant="h5" color="primary.main" fontWeight="bold">
                              kr {price6Months},-
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })()}

                    {/* 12 months */}
                    {(() => {
                      const discount12 = discounts.find((d) => d.months === 12);
                      const price12Months = discount12
                        ? Math.round(basePrice * 12 * (1 - discount12.percentage / 100))
                        : basePrice * 12;
                      const monthlyPrice12 = Math.round(price12Months / 12);

                      return (
                        <Paper variant="outlined" sx={{ p: 3 }}>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ sm: "center" }}
                            spacing={2}
                          >
                            <Box>
                              <Typography variant="h6">12 måneder</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {discount12 &&
                                  `Spar ${discount12.percentage}% - kun kr ${monthlyPrice12},- per måned`}
                              </Typography>
                            </Box>
                            <Typography variant="h5" color="primary.main" fontWeight="bold">
                              kr {price12Months},-
                            </Typography>
                          </Stack>
                        </Paper>
                      );
                    })()}
                  </Stack>

                  {boxQuantityDiscounts.length > 0 && (
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>Rabatt ved flere stallplasser:</strong>
                        {boxQuantityDiscounts
                          .map((discount, index) => {
                            if (index === 0) {
                              return ` ${discount.minBoxes}+ stallplasser: ${discount.discountPercentage}% rabatt`;
                            }
                            return `, ${discount.minBoxes}+ stallplasser: ${discount.discountPercentage}% rabatt`;
                          })
                          .join("")}
                      </Typography>
                    </Alert>
                  )}

                  {boxQuantityDiscounts.length === 0 && (
                    <Alert severity="success">
                      <Typography variant="body2">
                        <strong>Rabatt ved flere stallplasser:</strong> Kjøp annonsering for flere
                        stallplasser samtidig og få rabatt på totalsummen!
                      </Typography>
                    </Alert>
                  )}
                </Stack>
              </Paper>
            </Stack>

            <Divider />

            {/* FAQ Section */}
            <Stack spacing={3}>
              <Typography variant="h4" component="h2" fontWeight="medium">
                Ofte stilte spørsmål
              </Typography>

              <Stack spacing={2}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Må jeg betale for å opprette en stall?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Nei, det er helt gratis å opprette stall og legge til stallplasser. Du betaler
                    kun når du aktiverer annonsering.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Kan jeg skjule en stallplass midlertidig?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Annonseringen løper for den perioden som er betalt, men du kan markere en
                    stallplass som "utleid" hvis du ønsker å fjerne den fra søkeresultatene
                    midlertidig.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Hvordan mottar jeg betaling?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Vi sender deg en faktura på e-post med betalingsinformasjon når du aktiverer
                    annonsering.
                  </Typography>
                </Paper>

                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" gutterBottom>
                    Kan jeg endre informasjon om stallplassene etter at annonseringen er aktivert?
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Ja, du kan når som helst oppdatere informasjon, bilder og priser for dine
                    stallplasser fra dashboardet.
                  </Typography>
                </Paper>
              </Stack>
            </Stack>
          </Stack>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
