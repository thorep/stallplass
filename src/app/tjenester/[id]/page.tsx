import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getServiceById } from "@/services/marketplace-service";
import ServiceDetailClient from "@/components/organisms/ServiceDetailClient";
import Header from "@/components/organisms/Header";
import Footer from "@/components/organisms/Footer";
import { requireAuth } from "@/lib/auth";
import { NextResponse } from "next/server";

interface ServiceDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: ServiceDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const service = await getServiceById(id);
  
  if (!service) {
    return {
      title: "Tjeneste ikke funnet - Stallplass",
    };
  }

  return {
    title: `${service.title} - Stallplass`,
    description: service.description ? service.description.substring(0, 160) + "..." : `Tjeneste: ${service.title}`,
  };
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { id } = await params;
  
  // Get service data
  const service = await getServiceById(id);
  
  if (!service) {
    notFound();
  }

  // Get current user
  const authResult = await requireAuth();
  const user = authResult instanceof NextResponse ? null : authResult;

  return (
    <>
      <Header />
      <ServiceDetailClient serviceId={id} user={user} />
      <Footer />
    </>
  );
}
