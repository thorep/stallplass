'use client';

import { useState } from 'react';
import { formatDate, formatPrice } from '@/utils/formatting';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  CreditCardIcon,
  BanknotesIcon 
} from '@heroicons/react/24/outline';

interface Payment {
  id: string;
  amount: number;
  months: number;
  discount: number;
  totalAmount: number;
  vippsOrderId: string;
  vippsReference: string | null;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'REFUNDED' | 'CANCELLED';
  paymentMethod: 'VIPPS' | 'CARD';
  paidAt: string | null;
  failedAt: string | null;
  failureReason: string | null;
  createdAt: string;
  user: {
    id: string;
    firebaseId: string;
    email: string;
    name: string | null;
  };
  stable: {
    id: string;
    name: string;
    owner: {
      email: string;
      name: string | null;
    };
  };
}

interface PaymentsAdminProps {
  initialPayments: Payment[];
}

const statusConfig = {
  PENDING: { label: 'Venter', color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
  PROCESSING: { label: 'Behandler', color: 'bg-blue-100 text-blue-800', icon: ClockIcon },
  COMPLETED: { label: 'Fullført', color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
  FAILED: { label: 'Feilet', color: 'bg-red-100 text-red-800', icon: XCircleIcon },
  REFUNDED: { label: 'Refundert', color: 'bg-purple-100 text-purple-800', icon: BanknotesIcon },
  CANCELLED: { label: 'Kansellert', color: 'bg-slate-100 text-slate-800', icon: XCircleIcon },
};

const paymentMethodConfig = {
  VIPPS: { label: 'Vipps', color: 'bg-orange-100 text-orange-800' },
  CARD: { label: 'Kort', color: 'bg-blue-100 text-blue-800' },
};

export function PaymentsAdmin({ initialPayments }: PaymentsAdminProps) {
  const [payments] = useState(initialPayments);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.stable.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.vippsOrderId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = payments
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  const pendingAmount = payments
    .filter(p => p.status === 'PENDING' || p.status === 'PROCESSING')
    .reduce((sum, p) => sum + p.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800 mb-4">Betalinger</h2>
        
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center">
              <CheckCircleIcon className="h-8 w-8 text-green-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600">Total omsetning</p>
                <p className="text-xl font-bold text-slate-900">{formatPrice(totalRevenue)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-yellow-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600">Ventende betalinger</p>
                <p className="text-xl font-bold text-slate-900">{formatPrice(pendingAmount)}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
            <div className="flex items-center">
              <CreditCardIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-600">Antall transaksjoner</p>
                <p className="text-xl font-bold text-slate-900">{payments.length}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Søk etter bruker, stall eller ordre-ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="sm:w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Alle statuser</option>
              <option value="PENDING">Venter</option>
              <option value="PROCESSING">Behandler</option>
              <option value="COMPLETED">Fullført</option>
              <option value="FAILED">Feilet</option>
              <option value="REFUNDED">Refundert</option>
              <option value="CANCELLED">Kansellert</option>
            </select>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Ordre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Bruker
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Stall
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Detaljer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Beløp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Dato
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredPayments.map((payment) => {
                  const statusInfo = statusConfig[payment.status];
                  const StatusIcon = statusInfo.icon;
                  const methodInfo = paymentMethodConfig[payment.paymentMethod];
                  
                  return (
                    <tr key={payment.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {payment.vippsOrderId}
                          </div>
                          {payment.vippsReference && (
                            <div className="text-xs text-slate-500">
                              Ref: {payment.vippsReference}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-slate-900">
                            {payment.user.name || 'Ingen navn'}
                          </div>
                          <div className="text-xs text-slate-500">{payment.user.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm text-slate-900">{payment.stable.name}</div>
                          <div className="text-xs text-slate-500">
                            Eier: {payment.stable.owner.name || payment.stable.owner.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>
                          <div>{payment.months} måneder</div>
                          {payment.discount > 0 && (
                            <div className="text-green-600">
                              {(payment.discount * 100).toFixed(0)}% rabatt
                            </div>
                          )}
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium mt-1 ${methodInfo.color}`}>
                            {methodInfo.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {formatPrice(payment.totalAmount)}
                          </div>
                          {payment.discount > 0 && (
                            <div className="text-xs text-slate-500 line-through">
                              {formatPrice(payment.amount)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {statusInfo.label}
                        </span>
                        {payment.failureReason && (
                          <div className="text-xs text-red-600 mt-1">
                            {payment.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        <div>
                          <div>Opprettet: {formatDate(payment.createdAt)}</div>
                          {payment.paidAt && (
                            <div className="text-green-600">Betalt: {formatDate(payment.paidAt)}</div>
                          )}
                          {payment.failedAt && (
                            <div className="text-red-600">Feilet: {formatDate(payment.failedAt)}</div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {filteredPayments.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            Ingen betalinger funnet
          </div>
        )}
      </div>
    </div>
  );
}