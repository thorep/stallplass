import { NextResponse } from "next/server";
import { prisma } from "@/services/prisma";

export async function GET() {
  try {
    console.log("Forum test endpoint called");
    
    // Direct Prisma call to test
    const categories = await prisma.forum_categories.findMany({
      where: { isActive: true },
      orderBy: [
        { sortOrder: 'asc' },
        { name: 'asc' }
      ],
    });
    
    console.log("Found categories:", categories.length);
    
    return NextResponse.json({
      success: true,
      count: categories.length,
      categories: categories
    });
  } catch (error: unknown) {
    console.error("Forum test error:", error);
    return NextResponse.json(
      { 
        error: "Test failed", 
        message: (error as Error).message,
        stack: (error as Error).stack 
      },
      { status: 500 }
    );
  }
}