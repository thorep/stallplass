import { prisma } from '@/lib/prisma';
import { RoadmapItem, RoadmapStatus, RoadmapPriority } from '@prisma/client';

export async function getAllRoadmapItems() {
  try {
    return await prisma.roadmapItem.findMany({
      where: {
        isPublic: true,
        status: {
          not: 'CANCELLED'
        }
      },
      orderBy: [
        { status: 'asc' }, // Show completed items last
        { priority: 'desc' }, // High priority first
        { sortOrder: 'asc' },
        { estimatedDate: 'asc' }
      ]
    });
  } catch (error) {
    // If roadmap table doesn't exist yet, return empty array
    console.warn('Roadmap table not found, returning empty array:', error);
    return [];
  }
}

export async function getRoadmapItemsByStatus(status: RoadmapStatus) {
  return await prisma.roadmapItem.findMany({
    where: {
      status,
      isPublic: true
    },
    orderBy: [
      { priority: 'desc' },
      { sortOrder: 'asc' },
      { estimatedDate: 'asc' }
    ]
  });
}

export async function createRoadmapItem(data: {
  title: string;
  description: string;
  category: string;
  status?: RoadmapStatus;
  priority?: RoadmapPriority;
  estimatedDate?: Date;
  isPublic?: boolean;
  sortOrder?: number;
}) {
  return await prisma.roadmapItem.create({
    data
  });
}

export async function updateRoadmapItem(id: string, data: Partial<RoadmapItem>) {
  return await prisma.roadmapItem.update({
    where: { id },
    data
  });
}

export async function markRoadmapItemCompleted(id: string) {
  return await prisma.roadmapItem.update({
    where: { id },
    data: {
      status: 'COMPLETED',
      completedDate: new Date()
    }
  });
}

export async function deleteRoadmapItem(id: string) {
  return await prisma.roadmapItem.delete({
    where: { id }
  });
}

export async function getRoadmapItemsByCategory(category: string) {
  return await prisma.roadmapItem.findMany({
    where: {
      category,
      isPublic: true,
      status: {
        not: 'CANCELLED'
      }
    },
    orderBy: [
      { status: 'asc' },
      { priority: 'desc' },
      { sortOrder: 'asc' }
    ]
  });
}