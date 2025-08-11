import BoxDetailClient from "@/components/organisms/BoxDetailClient";
import Footer from "@/components/organisms/Footer";
import Header from "@/components/organisms/Header";
import { getBoxWithStable } from "@/services/box-service";
import { getUser } from "@/lib/server-auth";
import { Metadata } from "next";
import { redirect } from "next/navigation";

interface BoxPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: BoxPageProps): Promise<Metadata> {
  const { id } = await params;
  try {
    const box = await getBoxWithStable(id);
    if (!box) {
      return {
        title: "Boks ikke funnet - Stallplass",
      };
    }

    return {
      title: `${box.name} - ${box.stable?.name || "Stallboks"} | Stallplass`,
      description:
        box.description ||
        `Stallboks til leie hos ${box.stable?.name || "ukjent stall"} i ${
          box.stable?.location || "ukjent lokasjon"
        }`,
      openGraph: {
        title: `${box.name} - ${box.stable?.name || "Stallboks"}`,
        description:
          box.description || `Stallboks til leie hos ${box.stable?.name || "ukjent stall"}`,
        images: box.stable?.images ? [box.stable.images[0]] : [],
      },
    };
  } catch {
    return {
      title: "Stallboks - Stallplass",
    };
  }
}

export default async function BoxPage({ params }: BoxPageProps) {
  const { id } = await params;
  try {
    const box = await getBoxWithStable(id);

    if (!box) {
      redirect("/sok");
    }

    // Check if user is the owner
    const user = await getUser();
    const isOwner = user && box.stable?.owner?.id === user.id;
    
    // Add flags for owner view if applicable
    const boxWithFlags = isOwner ? {
      ...box,
      isOwnerView: true,
      requiresAdvertising: !box.isAvailable
    } : box;
    
    return (
      <>
        <Header />
        <BoxDetailClient box={boxWithFlags} />
        <Footer />
      </>
    );
  } catch {
    redirect("/sok");
  }
}
