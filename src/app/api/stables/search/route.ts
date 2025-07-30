import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/services/prisma";
import { withApiLogging } from "@/lib/api-middleware";
import { logger } from "@/lib/logger";

async function searchStables(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Build where clause based on filters
    const where: Record<string, unknown> = {};
    
    // Location filters
    const fylkeId = searchParams.get("fylkeId");
    const kommuneId = searchParams.get("kommuneId");
    if (fylkeId) where.countyId = fylkeId;
    if (kommuneId) where.municipalityId = kommuneId;
    
    // Price filters - filter stables that have boxes in the price range
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    if (minPrice || maxPrice) {
      const priceFilter: Record<string, unknown> = {};
      if (minPrice) priceFilter.gte = parseInt(minPrice);
      if (maxPrice) priceFilter.lte = parseInt(maxPrice);
      
      where.boxes = {
        some: {
          price: priceFilter
        }
      };
    }
    
    // Available spaces filter - only show stables with available boxes
    const availableSpaces = searchParams.get("availableSpaces");
    if (availableSpaces === 'available') {
      // If price filter is already applied, add availability to the existing boxes filter
      if (where.boxes) {
        (where.boxes as any).some.isAvailable = true;
      } else {
        where.boxes = {
          some: {
            isAvailable: true
          }
        };
      }
    }
    
    // Amenity filters - filter stables that have ALL selected amenities (AND logic)
    const amenityIds = searchParams.get("amenityIds");
    if (amenityIds) {
      const amenityIdList = amenityIds.split(',');
      // For AND logic, we need to ensure the stable has all required amenities
      // We'll filter the results after the initial query to check the count
      where.stable_amenity_links = {
        some: {
          amenityId: {
            in: amenityIdList
          }
        }
      };
    }
    
    // Text search
    const query = searchParams.get("query");
    if (query) {
      where.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } }
      ];
    }
    
    // Get all stables with their boxes
    const stables = await prisma.stables.findMany({
      where,
      include: {
        stable_amenity_links: {
          include: {
            stable_amenities: true
          }
        },
        users: {
          select: {
            name: true,
            email: true
          }
        },
        boxes: true, // Always include all boxes
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    
    // Apply AND logic for amenity filtering - only keep stables that have ALL selected amenities
    let filteredStables = stables;
    if (amenityIds) {
      const amenityIdList = amenityIds.split(',');
      filteredStables = stables.filter(stable => {
        const stableAmenityIds = stable.stable_amenity_links.map(link => link.amenityId);
        // Check if the stable has ALL required amenities
        return amenityIdList.every(requiredAmenityId => 
          stableAmenityIds.includes(requiredAmenityId)
        );
      });
    }
    
    // Calculate stats for each stable
    const stablesWithStats = filteredStables.map(stable => {
      const boxes = stable.boxes || [];
      const availableBoxes = boxes.filter(box => box.isAvailable).length;
      const prices = boxes.map(box => box.price).filter(price => price > 0);
      const priceRange = prices.length > 0 
        ? { min: Math.min(...prices), max: Math.max(...prices) }
        : { min: 0, max: 0 };
      
      return {
        ...stable,
        amenities: stable.stable_amenity_links.map(link => ({
          amenity: link.stable_amenities
        })),
        owner: stable.users,
        availableBoxes,
        priceRange
      };
    });
    
    logger.info({ count: stablesWithStats.length }, "Search completed");
    return NextResponse.json(stablesWithStats);
  } catch (error) {
    logger.error({ error }, "Search failed");
    return NextResponse.json({ error: "Failed to search stables" }, { status: 500 });
  }
}

export const GET = withApiLogging(searchStables);