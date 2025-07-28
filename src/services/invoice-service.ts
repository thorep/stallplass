import type { invoice_requests, InvoiceRequestStatus, InvoiceItemType } from '@/generated/prisma';
import { supabaseServer } from '@/lib/supabase-server';

export interface CreateInvoiceRequestData {
  userId: string;
  fullName: string;
  address: string;
  postalCode: string;
  city: string;
  phone: string;
  email: string;
  amount: number;
  totalAmount: number;
  discount: number;
  description: string;
  itemType: InvoiceItemType;
  months?: number;
  days?: number;
  stableId?: string;
  serviceId?: string;
  boxId?: string;
}

// Create a new invoice request
export async function createInvoiceRequest(data: CreateInvoiceRequestData): Promise<invoice_requests> {
  try {
    const { data: invoiceRequest, error } = await supabaseServer
      .from('invoice_requests')
      .insert([{
        user_id: data.userId,
        full_name: data.fullName,
        address: data.address,
        postal_code: data.postalCode,
        city: data.city,
        phone: data.phone,
        email: data.email,
        amount: data.amount,
        total_amount: data.totalAmount,
        discount: data.discount,
        description: data.description,
        itemType: data.itemType,
        months: data.months,
        days: data.days,
        stableId: data.stableId,
        serviceId: data.serviceId,
        boxId: data.boxId,
        status: 'PENDING'
      }])
      .select()
      .single();

    if (error || !invoiceRequest) {
      throw new Error(`Failed to create invoice request: ${error?.message}`);
    }

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

  try {
    if (invoiceRequest.itemType === 'STABLE_ADVERTISING' && invoiceRequest.stableId && invoiceRequest.months) {
      // Activate stable advertising
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + invoiceRequest.months);
      
      const { error } = await supabaseServer
        .from('stables')
        .update({
          advertising_start_date: now.toISOString(),
          advertising_end_date: endDate.toISOString(),
          advertising_active: true,
        })
        .eq('id', invoiceRequest.stableId);

      if (error) {
        throw new Error(`Failed to activate stable advertising: ${error.message}`);
      }

    } else if (invoiceRequest.itemType === 'BOX_ADVERTISING' && invoiceRequest.boxId && invoiceRequest.months) {
      // Activate box advertising
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + invoiceRequest.months);
      
      const { error } = await supabaseServer
        .from('boxes')
        .update({
          is_advertised: true,
          advertising_start_date: now.toISOString(),
          advertising_until: endDate.toISOString(),
        })
        .eq('id', invoiceRequest.boxId);

      if (error) {
        throw new Error(`Failed to activate box advertising: ${error.message}`);
      }

    } else if (invoiceRequest.itemType === 'BOX_SPONSORED' && invoiceRequest.boxId && invoiceRequest.months) {
      // Activate box sponsoring
      const endDate = new Date(now);
      endDate.setMonth(endDate.getMonth() + invoiceRequest.months);
      
      const { error } = await supabaseServer
        .from('boxes')
        .update({
          is_sponsored: true,
          sponsored_start_date: now.toISOString(),
          sponsored_until: endDate.toISOString(),
        })
        .eq('id', invoiceRequest.boxId);

      if (error) {
        throw new Error(`Failed to activate box sponsoring: ${error.message}`);
      }

    } else if (invoiceRequest.itemType === 'SERVICE_ADVERTISING' && invoiceRequest.serviceId && invoiceRequest.days) {
      // Activate service advertising
      const endDate = new Date(now);
      endDate.setDate(endDate.getDate() + invoiceRequest.days);
      
      const { error } = await supabaseServer
        .from('services')
        .update({
          advertising_active: true,
          advertising_end_date: endDate.toISOString(),
        })
        .eq('id', invoiceRequest.serviceId);

      if (error) {
        throw new Error(`Failed to activate service advertising: ${error.message}`);
      }
    }
  } catch (error) {
    // Don't throw here - the invoice request should still be created even if activation fails
  }
}

// Get all invoice requests for admin
export async function getAllInvoiceRequests(): Promise<invoice_requests[]> {
  const { data, error } = await supabaseServer
    .from('invoice_requests')
    .select(`
      *,
      users!inner(email, name),
      stables(name),
      services(title),
      boxes(name)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get invoice requests: ${error.message}`);
  }

  return data || [];
}

// Get invoice requests for a specific user
export async function getUserInvoiceRequests(userId: string): Promise<invoice_requests[]> {
  const { data, error } = await supabaseServer
    .from('invoice_requests')
    .select(`
      *,
      stables(name),
      services(title),
      boxes(name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to get user invoice requests: ${error.message}`);
  }

  return data || [];
}

// Update invoice request status (admin only)
export async function updateInvoiceRequestStatus(
  id: string,
  status: InvoiceRequestStatus,
  adminNotes?: string,
  invoiceNumber?: string
): Promise<invoice_requests> {
  try {
    const updates: Record<string, unknown> = { status };
    
    if (status === 'INVOICE_SENT') {
      updates.invoice_sent = true;
      updates.invoice_sent_at = new Date().toISOString();
      if (invoiceNumber) {
        updates.invoice_number = invoiceNumber;
      }
    } else if (status === 'PAID') {
      updates.paid_at = new Date().toISOString();
    }
    
    if (adminNotes) {
      updates.admin_notes = adminNotes;
    }

    const { data, error } = await supabaseServer
      .from('invoice_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      throw new Error(`Failed to update invoice request: ${error?.message}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

// Get invoice request by ID
export async function getInvoiceRequestById(id: string): Promise<invoice_requests | null> {
  const { data, error } = await supabaseServer
    .from('invoice_requests')
    .select(`
      *,
      users!inner(email, name),
      stables(name),
      services(title),
      boxes(name)
    `)
    .eq('id', id)
    .single();

  if (error) {
    return null;
  }

  return data;
}