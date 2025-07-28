'use client';

import { useState } from 'react';
import Button from '@/components/atoms/Button';
import ErrorMessage from '@/components/atoms/ErrorMessage';
import LoadingSpinner from '@/components/atoms/LoadingSpinner';
import { useGetInvoiceRequests, usePutInvoiceRequestStatus } from '@/hooks/useInvoiceRequests';
import { type invoice_requests, type InvoiceRequestStatus } from '@/generated/prisma';

interface InvoiceRequestWithRelations extends invoice_requests {
  users: { email: string; name: string | null };
  stables?: { name: string } | null;
  services?: { title: string } | null;
  boxes?: { name: string } | null;
}

export function InvoiceRequestsAdmin() {
  // Use TanStack Query hooks
  const { data: invoiceRequests = [], isLoading: loading, error } = useGetInvoiceRequests();
  const updateInvoiceStatus = usePutInvoiceRequestStatus();
  
  const [editingId, setEditingId] = useState<string | null>(null);
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
    } catch (error) {
    }
  };

  const startEditing = (request: InvoiceRequestWithRelations) => {
    setEditingId(request.id);
    setEditData({
      status: request.status,
      adminNotes: request.adminNotes || '',
      invoiceNumber: request.invoiceNumber || ''
    });
  };

  const getStatusColor = (status: InvoiceRequestStatus) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'INVOICE_SENT': return 'bg-blue-100 text-blue-800';
      case 'PAID': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getItemTypeLabel = (itemType: string) => {
    switch (itemType) {
      case 'STABLE_ADVERTISING': return 'Stallannonsering';
      case 'BOX_ADVERTISING': return 'Boksannonsering';
      case 'BOX_SPONSORED': return 'Bokssponsing';
      case 'SERVICE_ADVERTISING': return 'Tjenesteannonsering';
      default: return itemType;
    }
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
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Fakturaforespørsler</h2>
      
      <ErrorMessage error={error} />
      
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kunde
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Beløp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opprettet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Handlinger
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {invoiceRequests.map((request: InvoiceRequestWithRelations) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {request.fullName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.users.email}
                      </div>
                      <div className="text-sm text-gray-500">
                        {request.phone}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {getItemTypeLabel(request.itemType)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {request.description}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {(request.totalAmount / 100).toFixed(2)} kr
                    {request.discount > 0 && (
                      <div className="text-xs text-green-600">
                        -{(request.discount * 100).toFixed(0)}% rabatt
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                    {request.invoiceNumber && (
                      <div className="text-xs text-gray-500 mt-1">
                        Faktura: {request.invoiceNumber}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(request.createdAt).toLocaleDateString('no-NO')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {editingId === request.id ? (
                      <div className="space-y-2">
                        <select
                          value={editData.status}
                          onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                          className="block w-full text-sm border-gray-300 rounded-md"
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
                          className="block w-full text-sm border-gray-300 rounded-md"
                        />
                        <textarea
                          placeholder="Admin-notater"
                          value={editData.adminNotes}
                          onChange={(e) => setEditData(prev => ({ ...prev, adminNotes: e.target.value }))}
                          className="block w-full text-sm border-gray-300 rounded-md"
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
                        onClick={() => startEditing(request)}
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
            Ingen fakturaforespørsler funnet
          </div>
        )}
      </div>
    </div>
  );
}