'use client';

import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import Button from '@/components/atoms/Button';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';
import { useGetInvoiceRequests, usePutInvoiceRequestStatus, type InvoiceRequestFilters } from '@/hooks/useInvoiceRequests';
import { type invoice_requests, type InvoiceRequestStatus } from '@/generated/prisma';
import { cn } from '@/lib/utils';

// Updated interface to match new backend data structure
interface InvoiceRequestWithRelations extends invoice_requests {
  profiles: { nickname: string | null };
  stables?: { name: string } | null;
  services?: { title: string } | null;
  boxIds?: string[];
}

// Detailed modal component
interface InvoiceDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: InvoiceRequestWithRelations | null;
}

function InvoiceDetailModal({ isOpen, onClose, invoice }: InvoiceDetailModalProps) {
  if (!isOpen || !invoice) return null;

  const copyToClipboard = async () => {
    const invoiceDetails = `
FAKTURADETALJER
================

Kunde:
- Navn: ${invoice.fullName}
- Telefon: ${invoice.phone}
- E-post: ${invoice.email}
- Adresse: ${invoice.address}
- Postnummer: ${invoice.postalCode}
- By: ${invoice.city}

Faktura:
- Fakturanummer: ${invoice.invoiceNumber || 'Ikke angitt'}
- Status: ${invoice.status}
- Beløp: ${invoice.amount.toFixed(2)} kr
- Rabatt: ${invoice.discount}%
- Sluttbeløp: ${(invoice.amount * (1 - invoice.discount / 100)).toFixed(2)} kr

Vare/Tjeneste:
- Type: ${getItemTypeLabel(invoice.itemType)}
- Beskrivelse: ${invoice.description}
${invoice.months ? `- Måneder: ${invoice.months}` : ''}
${invoice.days ? `- Dager: ${invoice.days}` : ''}
${invoice.boxIds && invoice.boxIds.length > 0 ? `- Boks ID(er): ${invoice.boxIds.join(', ')}` : ''}

Datoer:
- Opprettet: ${new Date(invoice.createdAt).toLocaleDateString('no-NO')}
- Oppdatert: ${new Date(invoice.updatedAt).toLocaleDateString('no-NO')}

Admin-notater:
${invoice.adminNotes || 'Ingen notater'}

ID: ${invoice.id}
    `.trim();

    try {
      await navigator.clipboard.writeText(invoiceDetails);
      // You could add a toast notification here
    } catch (err) {
      // Failed to copy to clipboard - silently ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Background overlay */}
      <div 
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal container */}
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* This element is to trick the browser into centering the modal contents. */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        
        {/* Modal */}
        <div className="relative inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full sm:p-6 z-10">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-h2 text-gray-900">
              Fakturadetajer
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Lukk</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Customer Details */}
            <div className="space-y-4">
              <h4 className="text-h3 text-gray-900 border-b pb-2">Kundeinformasjon</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Navn:</span>
                  <p className="text-body text-gray-900">{invoice.fullName}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Telefon:</span>
                  <p className="text-body text-gray-900">{invoice.phone}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">E-post:</span>
                  <p className="text-body text-gray-900">{invoice.email}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Adresse:</span>
                  <p className="text-body text-gray-900">
                    {invoice.address}<br />
                    {invoice.postalCode} {invoice.city}
                  </p>
                </div>
              </div>
            </div>
            
            {/* Invoice Details */}
            <div className="space-y-4">
              <h4 className="text-h3 text-gray-900 border-b pb-2">Fakturainformasjon</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Status:</span>
                  <p className="text-body text-gray-900">
                    <span className={`inline-flex px-2 py-1 text-caption font-semibold rounded-full ${getStatusColor(invoice.status)}`}>
                      {invoice.status}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Fakturanummer:</span>
                  <p className="text-body text-gray-900">{invoice.invoiceNumber || 'Ikke angitt'}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Beløp:</span>
                  <p className="text-body text-gray-900">{invoice.amount.toFixed(2)} kr</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Rabatt:</span>
                  <p className="text-body text-gray-900">{invoice.discount}%</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Sluttbeløp:</span>
                  <p className="text-h4 text-gray-900">{(invoice.amount * (1 - invoice.discount / 100)).toFixed(2)} kr</p>
                </div>
              </div>
            </div>
            
            {/* Product/Service Details */}
            <div className="space-y-4">
              <h4 className="text-h3 text-gray-900 border-b pb-2">Vare/Tjeneste</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Type:</span>
                  <p className="text-body text-gray-900">{getItemTypeLabel(invoice.itemType)}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Beskrivelse:</span>
                  <p className="text-body text-gray-900">{invoice.description}</p>
                </div>
                {invoice.months && (
                  <div>
                    <span className="text-body-sm font-medium text-gray-600">Måneder:</span>
                    <p className="text-body text-gray-900">{invoice.months}</p>
                  </div>
                )}
                {invoice.days && (
                  <div>
                    <span className="text-body-sm font-medium text-gray-600">Dager:</span>
                    <p className="text-body text-gray-900">{invoice.days}</p>
                  </div>
                )}
                {invoice.boxIds && invoice.boxIds.length > 0 && (
                  <div>
                    <span className="text-body-sm font-medium text-gray-600">Boks ID{invoice.boxIds.length > 1 ? 'er' : ''}:</span>
                    <p className="text-body text-gray-900">{invoice.boxIds.join(', ')}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Dates and Notes */}
            <div className="space-y-4">
              <h4 className="text-h3 text-gray-900 border-b pb-2">Øvrig informasjon</h4>
              <div className="space-y-2">
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Opprettet:</span>
                  <p className="text-body text-gray-900">{new Date(invoice.createdAt).toLocaleDateString('no-NO')}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Oppdatert:</span>
                  <p className="text-body text-gray-900">{new Date(invoice.updatedAt).toLocaleDateString('no-NO')}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">Admin-notater:</span>
                  <p className="text-body text-gray-900">{invoice.adminNotes || 'Ingen notater'}</p>
                </div>
                <div>
                  <span className="text-body-sm font-medium text-gray-600">ID:</span>
                  <p className="text-caption font-mono text-gray-500 break-all">{invoice.id}</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="mt-6 flex justify-between items-center pt-4 border-t">
            <Button
              variant="outline"
              onClick={copyToClipboard}
              className="flex items-center gap-2"
            >
              <ClipboardDocumentIcon className="h-4 w-4" />
              Kopier detaljer
            </Button>
            
            <Button
              onClick={onClose}
            >
              Lukk
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getItemTypeLabel(itemType: string) {
  switch (itemType) {
    case 'STABLE_ADVERTISING': return 'Stallannonsering';
    case 'BOX_ADVERTISING': return 'Boksannonsering';
    case 'BOX_SPONSORED': return 'Bokssponsing';
    case 'SERVICE_ADVERTISING': return 'Tjenesteannonsering';
    default: return itemType;
  }
}

function getStatusColor(status: InvoiceRequestStatus) {
  switch (status) {
    case 'PENDING': return 'bg-yellow-100 text-yellow-800';
    case 'INVOICE_SENT': return 'bg-blue-100 text-blue-800';
    case 'PAID': return 'bg-green-100 text-green-800';
    case 'CANCELLED': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function InvoiceRequestsAdmin() {
  // Filters and pagination state
  const [filters, setFilters] = useState<InvoiceRequestFilters>({
    page: 1,
    pageSize: 20,
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Modal state
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRequestWithRelations | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Use TanStack Query hooks with filters
  const { data: response, isLoading: loading, error } = useGetInvoiceRequests(filters);
  const updateInvoiceStatus = usePutInvoiceRequestStatus();
  
  // Extract data from paginated response
  const invoiceRequests = response?.invoiceRequests || [];
  const pagination = response?.pagination;
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [editData, setEditData] = useState({
    status: '',
    adminNotes: '',
    invoiceNumber: ''
  });

  const handleStatusUpdate = async (id: string) => {
    try {
      await updateInvoiceStatus.mutateAsync({
        id,
        status: editData.status
      });
      setEditingId(null);
      setEditData({ status: '', adminNotes: '', invoiceNumber: '' });
    } catch {
    }
  };

  // Handler functions
  const handleStatusFilterChange = (status: string) => {
    setFilters(prev => ({
      ...prev,
      status: status === 'ALL' ? undefined : status as InvoiceRequestStatus,
      page: 1 // Reset to first page when filtering
    }));
  };
  
  const handleSort = (sortBy: InvoiceRequestFilters['sortBy']) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc',
      page: 1 // Reset to first page when sorting
    }));
  };
  
  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };
  
  const handlePageSizeChange = (pageSize: number) => {
    setFilters(prev => ({ ...prev, pageSize, page: 1 }));
  };
  
  const handleInvoiceRowClick = (invoice: InvoiceRequestWithRelations) => {
    if (editingId !== invoice.id) { // Don't open modal if editing
      setSelectedInvoice(invoice);
      setIsDetailModalOpen(true);
    }
  };

  const toggleIdExpansion = (id: string) => {
    setExpandedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const startEditing = (request: InvoiceRequestWithRelations) => {
    setEditingId(request.id);
    setEditData({
      status: request.status,
      adminNotes: request.adminNotes || '',
      invoiceNumber: request.invoiceNumber || ''
    });
  };
  
  const getSortIcon = (column: InvoiceRequestFilters['sortBy']) => {
    if (filters.sortBy !== column) {
      return <div className="w-4 h-4" />; // Placeholder for consistent spacing
    }
    return filters.sortOrder === 'desc' ? 
      <ChevronDownIcon className="w-4 h-4" /> : 
      <ChevronUpIcon className="w-4 h-4" />;
  };

  if (loading) {
    return (
      <div className="p-4 flex items-center justify-center">
        <LoadingSpinner size="lg" />
        <span className="ml-3">Laster fakturaforespørsler...</span>
      </div>
    );
  }

  return (
    <div className="p-6" data-cy="invoice-requests-admin">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <h2 className="text-h1 mb-4 sm:mb-0">Fakturaforespørsler</h2>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="status-filter" className="text-body-sm font-medium text-gray-600 whitespace-nowrap">
              Status:
            </label>
            <select
              id="status-filter"
              value={filters.status || 'ALL'}
              onChange={(e) => handleStatusFilterChange(e.target.value)}
              className="block text-body-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-cy="status-filter"
            >
              <option value="ALL">Alle</option>
              <option value="PENDING">Ventende</option>
              <option value="INVOICE_SENT">Faktura sendt</option>
              <option value="PAID">Betalt</option>
              <option value="CANCELLED">Avbrutt</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label htmlFor="page-size" className="text-body-sm font-medium text-gray-600 whitespace-nowrap">
              Per side:
            </label>
            <select
              id="page-size"
              value={filters.pageSize || 20}
              onChange={(e) => handlePageSizeChange(Number(e.target.value))}
              className="block text-body-sm border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
              data-cy="page-size-selector"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>
        </div>
      </div>
      
      <ErrorMessage error={error} />
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200" data-cy="invoice-requests-table">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-overline text-gray-500">
                  ID
                </th>
                <th 
                  className="px-6 py-3 text-left text-overline text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('fullName')}
                  data-cy="sort-customer"
                >
                  <div className="flex items-center gap-1">
                    Kunde
                    {getSortIcon('fullName')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-overline text-gray-500">
                  Type
                </th>
                <th 
                  className="px-6 py-3 text-left text-overline text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('amount')}
                  data-cy="sort-amount"
                >
                  <div className="flex items-center gap-1">
                    Beløp
                    {getSortIcon('amount')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-overline text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                  data-cy="sort-status"
                >
                  <div className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-overline text-gray-500 cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                  data-cy="sort-created"
                >
                  <div className="flex items-center gap-1">
                    Opprettet
                    {getSortIcon('createdAt')}
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-overline text-gray-500">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoiceRequests.map((request: InvoiceRequestWithRelations) => (
                <tr 
                  key={request.id} 
                  className={cn(
                    "hover:bg-gray-50 transition-colors cursor-pointer",
                    editingId === request.id && "bg-blue-50"
                  )}
                  onClick={() => handleInvoiceRowClick(request)}
                  data-cy={`invoice-request-row-${request.id}`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div 
                      className="text-caption font-mono text-gray-500 cursor-pointer hover:text-gray-700 select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleIdExpansion(request.id);
                      }}
                      title="Click to expand/collapse full ID"
                      data-cy={`invoice-request-id-${request.id}`}
                    >
                      {expandedIds.has(request.id) ? request.id : `${request.id.slice(0, 8)}...`}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-body-sm font-medium text-gray-900">
                        {request.fullName}
                      </div>
                      <div className="text-body-sm text-gray-500">
                        {request.email}
                      </div>
                      <div className="text-body-sm text-gray-500">
                        {request.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-body-sm text-gray-900">
                      {getItemTypeLabel(request.itemType)}
                    </div>
                    <div className="text-body-sm text-gray-500">
                      {request.description}
                    </div>
                    {request.boxIds && request.boxIds.length > 0 && (
                      <div className="text-caption text-blue-600 mt-1">
                        Boks ID{request.boxIds.length > 1 ? 'er' : ''}: {request.boxIds.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-sm text-gray-900">
                    {request.amount.toFixed(2)} kr
                    {request.discount > 0 && (
                      <div className="text-caption text-green-600">
                        -{request.discount.toFixed(0)}% rabatt
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-caption font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {request.invoiceNumber && (
                      <div className="text-caption text-gray-500 mt-1">
                        Faktura: {request.invoiceNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('no-NO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-body-sm font-medium">
                    {editingId === request.id ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                          className="block w-full text-body-sm border-gray-300 rounded-md"
                        >
                          <option value="PENDING">PENDING</option>
                          <option value="INVOICE_SENT">INVOICE_SENT</option>
                          <option value="PAID">PAID</option>
                          <option value="CANCELLED">CANCELLED</option>
                        </select>
                        <input
                          type="text"
                          placeholder="Fakturanummer"
                          value={editData.invoiceNumber}
                          onChange={(e) => setEditData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          className="block w-full text-body-sm border-gray-300 rounded-md"
                        />
                        <textarea
                          placeholder="Admin-notater"
                          value={editData.adminNotes}
                          onChange={(e) => setEditData(prev => ({ ...prev, adminNotes: e.target.value }))}
                          className="block w-full text-body-sm border-gray-300 rounded-md"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(request.id)}
                          >
                            Lagre
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setEditingId(null)}
                          >
                            Avbryt
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(request);
                        }}
                      >
                        Rediger
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {invoiceRequests.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-body text-gray-500">
              {loading ? 'Laster...' : 'Ingen fakturaforespørsler funnet'}
            </p>
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
          <div className="text-body-sm text-gray-600">
            Viser {((pagination.page - 1) * pagination.pageSize) + 1} til {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} av {pagination.totalItems} fakturaforespørsler
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
              data-cy="prev-page"
            >
              Forrige
            </Button>
            
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                let pageNum;
                if (pagination.totalPages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.page >= pagination.totalPages - 2) {
                  pageNum = pagination.totalPages - 4 + i;
                } else {
                  pageNum = pagination.page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="sm"
                    variant={pageNum === pagination.page ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNum)}
                    className="min-w-[32px]"
                    data-cy={`page-${pageNum}`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              data-cy="next-page"
            >
              Neste
            </Button>
          </div>
        </div>
      )}
      
      {/* Invoice Detail Modal */}
      <InvoiceDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedInvoice(null);
        }}
        invoice={selectedInvoice}
      />
    </div>
  );
}