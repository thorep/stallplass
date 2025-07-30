import type { invoice_requests, InvoiceRequestStatus, InvoiceItemType, Prisma } from '@/generated/prisma';
import { prisma } from '@/services/prisma';

export interface CreateInvoiceRequestData {
  userId: string;
  fullName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  amount: number;
  discount: number;
  description: string;
  itemType: InvoiceItemType;
  months?: number;
  days?: number;
  slots?: number;
  stableId?: string;
  serviceId?: string;
  boxId?: string;
}

export interface InvoiceRequestWithBoxes extends invoice_requests {
  users?: { email: string; name: string | null } | null;
  stables?: { name: string } | null;
  services?: { title: string } | null;
  boxIds?: string[];
}

// Helper function to parse comma-separated box IDs
function parseBoxIds(boxId: string | null): string[] {
  if (!boxId) return [];
  return boxId.includes(',') ? boxId.split(',').map(id => id.trim()) : [boxId];
}

// Create a new invoice request
export async function createInvoiceRequest(data: CreateInvoiceRequestData): Promise<invoice_requests> {
  try {
    const invoiceRequest = await prisma.invoice_requests.create({
      data: {
        userId: data.userId,
        fullName: data.fullName,
        address: data.address,
        postalCode: data.postalCode,
        city: data.city,
        phone: data.phone,
        email: data.email,
        amount: data.amount,
        discount: data.discount,
        description: data.description,
        itemType: data.itemType,
        months: data.months,
        days: data.days,
        stableId: data.stableId,
        serviceId: data.serviceId,
        boxId: data.boxId,
        status: 'PENDING'
      }
    });

    // Immediately activate the purchase based on item type
    await activatePurchase(invoiceRequest);

    return invoiceRequest;
  } catch (error) {
    throw error;
  }
}

// Activate purchase immediately (since payment will be handled manually)
async function activatePurchase(invoiceRequest: invoice_requests): Promise<void> {
  const now = new Date();

  console.log('Activating purchase:', {
    itemType: invoiceRequest.itemType,
    stableId: invoiceRequest.stableId,
    boxId: invoiceRequest.boxId,
    months: invoiceRequest.months,
    days: invoiceRequest.days
  });

  try {
    if (invoiceRequest.itemType === 'BOX_ADVERTISING' && invoiceRequest.boxId && invoiceRequest.months) {
      // Handle both single and multiple box advertising
      const boxIds = invoiceRequest.boxId.includes(',') 
        ? invoiceRequest.boxId.split(',') 
        : [invoiceRequest.boxId];
      
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + invoiceRequest.months);
      
      console.log('Activating box advertising:', {
        boxIds,
        months: invoiceRequest.months,
        advertisingEndDate: endDate
      });
      
      // Process each box
      for (const boxId of boxIds) {
        // Get current box data to check if already advertised
        const currentBox = await prisma.boxes.findUnique({
          where: { id: boxId.trim() }
        });
        
        if (!currentBox) {
          console.warn(`Box not found: ${boxId}`);
          continue;
        }
        
        // Extend end date if purchasing more time
        let newEndDate = endDate;
        if (currentBox.advertisingActive && currentBox.advertisingEndDate && currentBox.advertisingEndDate > now) {
          // If current advertising is still active, extend from current end date
          const currentEndDate = new Date(currentBox.advertisingEndDate);
          newEndDate = new Date(currentEndDate);
          newEndDate.setMonth(newEndDate.getMonth() + invoiceRequest.months);
        }
        
        await prisma.boxes.update({
          where: { id: boxId.trim() },
          data: {
            advertisingActive: true,
            advertisingStartDate: currentBox.advertisingActive ? currentBox.advertisingStartDate : now,
            advertisingEndDate: newEndDate,
          }
        });

        console.log('Box advertising activated successfully', {
          boxId: boxId.trim(),
          wasActive: currentBox.advertisingActive,
          newEndDate
        });
      }

    } else if (invoiceRequest.itemType === 'BOX_SPONSORED' && invoiceRequest.boxId && invoiceRequest.days) {
      // Activate box boost (sponsored placement)
      const currentBox = await prisma.boxes.findUnique({
        where: { id: invoiceRequest.boxId },
        select: { isSponsored: true, sponsoredUntil: true }
      });
      
      if (!currentBox) {
        console.warn(`Box not found for sponsoring: ${invoiceRequest.boxId}`);
        return;
      }
      
      // Calculate end date - extend from current sponsoring if still active
      let endDate = new Date(now);
      endDate.setDate(endDate.getDate() + invoiceRequest.days);
      
      if (currentBox.isSponsored && currentBox.sponsoredUntil && currentBox.sponsoredUntil > now) {
        // If current sponsoring is still active, extend from current end date
        const currentEndDate = new Date(currentBox.sponsoredUntil);
        endDate = new Date(currentEndDate);
        endDate.setDate(endDate.getDate() + invoiceRequest.days);
      }
      
      await prisma.boxes.update({
        where: { id: invoiceRequest.boxId },
        data: {
          isSponsored: true,
          sponsoredStartDate: currentBox.isSponsored ? undefined : now, // Keep existing start date if already sponsored
          sponsoredUntil: endDate,
        }
      });
      
      console.log('Activated box boost:', {
        boxId: invoiceRequest.boxId,
        days: invoiceRequest.days,
        sponsoredUntil: endDate,
        wasSponsored: currentBox.isSponsored
      });

    } else if (invoiceRequest.itemType === 'SERVICE_ADVERTISING' && invoiceRequest.serviceId && invoiceRequest.days) {
      // Activate service advertising
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + invoiceRequest.days);
      
      await prisma.services.update({
        where: { id: invoiceRequest.serviceId },
        data: {
          advertisingActive: true,
          advertisingEndDate: endDate,
        }
      });
    } else {
      console.log('No activation performed - conditions not met:', {
        itemType: invoiceRequest.itemType,
        hasBoxId: !!invoiceRequest.boxId,
        hasStableId: !!invoiceRequest.stableId,
        hasServiceId: !!invoiceRequest.serviceId,
        hasMonths: !!invoiceRequest.months,
        hasDays: !!invoiceRequest.days
      });
    }
  } catch (error) {
    // Log the error but don't throw - the invoice request should still be created even if activation fails
    console.error('Failed to activate purchase:', error);
  }
}

// Get all invoice requests for admin
export async function getAllInvoiceRequests(): Promise<InvoiceRequestWithBoxes[]> {
  try {
    const data = await prisma.invoice_requests.findMany({
      include: {
        users: {
          select: { email: true, name: true }
        },
        stables: {
          select: { name: true }
        },
        services: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add parsed box IDs for each invoice request
    const dataWithBoxes = data.map((invoice) => {
      const boxIds = parseBoxIds(invoice.boxId);
      return { ...invoice, boxIds };
    });

    return dataWithBoxes;
  } catch (error) {
    throw new Error(`Failed to get invoice requests: ${(error as Error).message}`);
  }
}

// Get invoice requests for a specific user
export async function getUserInvoiceRequests(userId: string): Promise<InvoiceRequestWithBoxes[]> {
  try {
    const data = await prisma.invoice_requests.findMany({
      where: { userId },
      include: {
        stables: {
          select: { name: true }
        },
        services: {
          select: { title: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Add parsed box IDs for each invoice request
    const dataWithBoxes = data.map((invoice) => {
      const boxIds = parseBoxIds(invoice.boxId);
      return { ...invoice, boxIds };
    });

    return dataWithBoxes;
  } catch (error) {
    throw new Error(`Failed to get user invoice requests: ${(error as Error).message}`);
  }
}

// Update invoice request status (admin only)
export async function updateInvoiceRequestStatus(
  id: string,
  status: InvoiceRequestStatus,
  adminNotes?: string,
  invoiceNumber?: string
): Promise<invoice_requests> {
  try {
    const updates: Prisma.invoice_requestsUpdateInput = { status };
    
    if (status === 'INVOICE_SENT') {
      updates.invoiceSent = true;
      updates.invoiceSentAt = new Date();
      if (invoiceNumber) {
        updates.invoiceNumber = invoiceNumber;
      }
    } else if (status === 'PAID') {
      updates.paidAt = new Date();
    }
    
    if (adminNotes) {
      updates.adminNotes = adminNotes;
    }

    const data = await prisma.invoice_requests.update({
      where: { id },
      data: updates
    });

    return data;
  } catch (error) {
    throw error;
  }
}

// Get invoice request by ID
export async function getInvoiceRequestById(id: string): Promise<InvoiceRequestWithBoxes | null> {
  try {
    const data = await prisma.invoice_requests.findUnique({
      where: { id },
      include: {
        users: {
          select: { email: true, name: true }
        },
        stables: {
          select: { name: true }
        },
        services: {
          select: { title: true }
        }
      }
    });

    if (!data) return null;

    // Add parsed box IDs
    const boxIds = parseBoxIds(data.boxId);
    return { ...data, boxIds };
  } catch {
    return null;
  }
}