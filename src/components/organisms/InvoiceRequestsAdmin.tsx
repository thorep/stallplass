'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Card,
  CardContent,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Pagination,
  useTheme,
  useMediaQuery,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { XMarkIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';
import ErrorMessage from '@/components/atoms/ErrorMessage';
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  if (!invoice) return null;

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
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      fullScreen={isMobile}
      PaperProps={{
        sx: {
          borderRadius: '0.625rem',
        }
      }}
    >
      <DialogTitle>
        <Box className="flex justify-between items-center">
          <Typography variant="h5" component="h3">
            Fakturadetajer
          </Typography>
          <IconButton
            onClick={onClose}
            size="small"
            sx={{ color: 'text.secondary' }}
          >
            <XMarkIcon className="w-5 h-5" />
          </IconButton>
        </Box>
      </DialogTitle>
      <DialogContent dividers>
          
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Details */}
          <Box>
            <Stack spacing={2}>
              <Typography variant="h6" className="border-b pb-2">
                Kundeinformasjon
              </Typography>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Navn:
                </Typography>
                <Typography variant="body1">{invoice.fullName}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Telefon:
                </Typography>
                <Typography variant="body1">{invoice.phone}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  E-post:
                </Typography>
                <Typography variant="body1">{invoice.email}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Adresse:
                </Typography>
                <Typography variant="body1">
                  {invoice.address}<br />
                  {invoice.postalCode} {invoice.city}
                </Typography>
              </Box>
            </Stack>
          </Box>
            
          {/* Invoice Details */}
          <Box>
            <Stack spacing={2}>
              <Typography variant="h6" className="border-b pb-2">
                Fakturainformasjon
              </Typography>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Status:
                </Typography>
                <Chip
                  label={invoice.status}
                  size="small"
                  color={invoice.status === 'PAID' ? 'success' : 
                         invoice.status === 'CANCELLED' ? 'error' :
                         invoice.status === 'INVOICE_SENT' ? 'info' : 'warning'}
                />
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Fakturanummer:
                </Typography>
                <Typography variant="body1">
                  {invoice.invoiceNumber || 'Ikke angitt'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Beløp:
                </Typography>
                <Typography variant="body1">{invoice.amount.toFixed(2)} kr</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Rabatt:
                </Typography>
                <Typography variant="body1">{invoice.discount}%</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Sluttbeløp:
                </Typography>
                <Typography variant="h6" className="font-bold">
                  {(invoice.amount * (1 - invoice.discount / 100)).toFixed(2)} kr
                </Typography>
              </Box>
            </Stack>
          </Box>
            
          {/* Product/Service Details */}
          <Box>
            <Stack spacing={2}>
              <Typography variant="h6" className="border-b pb-2">
                Vare/Tjeneste
              </Typography>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Type:
                </Typography>
                <Typography variant="body1">{getItemTypeLabel(invoice.itemType)}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Beskrivelse:
                </Typography>
                <Typography variant="body1">{invoice.description}</Typography>
              </Box>
              {invoice.months && (
                <Box>
                  <Typography variant="body2" className="font-medium text-gray-600">
                    Måneder:
                  </Typography>
                  <Typography variant="body1">{invoice.months}</Typography>
                </Box>
              )}
              {invoice.days && (
                <Box>
                  <Typography variant="body2" className="font-medium text-gray-600">
                    Dager:
                  </Typography>
                  <Typography variant="body1">{invoice.days}</Typography>
                </Box>
              )}
              {invoice.boxIds && invoice.boxIds.length > 0 && (
                <Box>
                  <Typography variant="body2" className="font-medium text-gray-600">
                    Boks ID{invoice.boxIds.length > 1 ? 'er' : ''}:
                  </Typography>
                  <Typography variant="body1">{invoice.boxIds.join(', ')}</Typography>
                </Box>
              )}
            </Stack>
          </Box>
          
          {/* Dates and Notes */}
          <Box>
            <Stack spacing={2}>
              <Typography variant="h6" className="border-b pb-2">
                Øvrig informasjon
              </Typography>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Opprettet:
                </Typography>
                <Typography variant="body1">
                  {new Date(invoice.createdAt).toLocaleDateString('no-NO')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Oppdatert:
                </Typography>
                <Typography variant="body1">
                  {new Date(invoice.updatedAt).toLocaleDateString('no-NO')}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  Admin-notater:
                </Typography>
                <Typography variant="body1">{invoice.adminNotes || 'Ingen notater'}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" className="font-medium text-gray-600">
                  ID:
                </Typography>
                <Typography variant="caption" className="font-mono text-gray-500 break-all">
                  {invoice.id}
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          variant="outlined"
          onClick={copyToClipboard}
          startIcon={<DocumentDuplicateIcon className="w-4 h-4" />}
          sx={{ textTransform: 'none' }}
        >
          Kopier detaljer
        </Button>
        <Button
          variant="contained"
          onClick={onClose}
          sx={{ textTransform: 'none' }}
        >
          Lukk
        </Button>
      </DialogActions>
    </Dialog>
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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

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
      <Box className="p-4 flex items-center justify-center">
        <CircularProgress size={32} />
        <Typography variant="body1" className="ml-3">
          Laster fakturaforespørsler...
        </Typography>
      </Box>
    );
  }

  return (
    <Box className="p-6" data-cy="invoice-requests-admin">
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} className="mb-6">
        <Typography variant="h4" component="h2" className="text-slate-800">
          Fakturaforespørsler
        </Typography>
        
        {/* Filters */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" className="font-medium text-gray-600 whitespace-nowrap">
              Status:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <Select
                value={filters.status || 'ALL'}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                data-cy="status-filter"
                sx={{
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <MenuItem value="ALL">Alle</MenuItem>
                <MenuItem value="PENDING">Ventende</MenuItem>
                <MenuItem value="INVOICE_SENT">Faktura sendt</MenuItem>
                <MenuItem value="PAID">Betalt</MenuItem>
                <MenuItem value="CANCELLED">Avbrutt</MenuItem>
              </Select>
            </FormControl>
          </Stack>
          
          <Stack direction="row" alignItems="center" spacing={1}>
            <Typography variant="body2" className="font-medium text-gray-600 whitespace-nowrap">
              Per side:
            </Typography>
            <FormControl size="small" sx={{ minWidth: 80 }}>
              <Select
                value={filters.pageSize || 20}
                onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                data-cy="page-size-selector"
                sx={{
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem'
                }}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="20">20</MenuItem>
                <MenuItem value="50">50</MenuItem>
                <MenuItem value="100">100</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </Stack>
      </Stack>
      
      <ErrorMessage error={error} />
      
      {isMobile ? (
        // Mobile Card Layout
        <Stack spacing={2}>
          {invoiceRequests.map((request: InvoiceRequestWithRelations) => (
            <Card 
              key={request.id} 
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleInvoiceRowClick(request)}
              sx={{
                backgroundColor: editingId === request.id ? '#eff6ff' : 'white'
              }}
            >
              <CardContent>
                <Stack spacing={2}>
                  <Box className="flex items-start justify-between">
                    <Box className="flex-1">
                      <Typography variant="h6" className="text-slate-900 font-medium">
                        {request.fullName}
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {request.email}
                      </Typography>
                      <Typography variant="body2" className="text-slate-500">
                        {request.phone}
                      </Typography>
                    </Box>
                    <Chip
                      label={request.status}
                      size="small"
                      color={request.status === 'PAID' ? 'success' : 
                             request.status === 'CANCELLED' ? 'error' :
                             request.status === 'INVOICE_SENT' ? 'info' : 'warning'}
                    />
                  </Box>

                  <Box>
                    <Typography variant="body2" className="text-slate-900 font-medium">
                      {getItemTypeLabel(request.itemType)}
                    </Typography>
                    <Typography variant="body2" className="text-slate-500">
                      {request.description}
                    </Typography>
                    {request.boxIds && request.boxIds.length > 0 && (
                      <Typography variant="caption" className="text-blue-600">
                        Boks ID{request.boxIds.length > 1 ? 'er' : ''}: {request.boxIds.join(', ')}
                      </Typography>
                    )}
                  </Box>

                  <Box className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <Box>
                      <Typography variant="body2" className="text-slate-500">
                        Beløp
                      </Typography>
                      <Typography variant="body2" className="text-slate-900 font-medium">
                        {request.amount.toFixed(2)} kr
                      </Typography>
                      {request.discount > 0 && (
                        <Typography variant="caption" className="text-green-600">
                          -{request.discount.toFixed(0)}% rabatt
                        </Typography>
                      )}
                    </Box>
                    <Box>
                      <Typography variant="body2" className="text-slate-500">
                        Opprettet
                      </Typography>
                      <Typography variant="body2" className="text-slate-900">
                        {new Date(request.createdAt).toLocaleDateString('no-NO')}
                      </Typography>
                    </Box>
                  </Box>

                  {editingId === request.id ? (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Stack spacing={2}>
                        <FormControl fullWidth size="small">
                          <InputLabel>Status</InputLabel>
                          <Select
                            value={editData.status}
                            onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                            label="Status"
                          >
                            <MenuItem value="PENDING">PENDING</MenuItem>
                            <MenuItem value="INVOICE_SENT">INVOICE_SENT</MenuItem>
                            <MenuItem value="PAID">PAID</MenuItem>
                            <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                          </Select>
                        </FormControl>
                        <TextField
                          fullWidth
                          size="small"
                          label="Fakturanummer"
                          value={editData.invoiceNumber}
                          onChange={(e) => setEditData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                        />
                        <TextField
                          fullWidth
                          size="small"
                          label="Admin-notater"
                          multiline
                          rows={2}
                          value={editData.adminNotes}
                          onChange={(e) => setEditData(prev => ({ ...prev, adminNotes: e.target.value }))}
                        />
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleStatusUpdate(request.id)}
                            sx={{ textTransform: 'none' }}
                          >
                            Lagre
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => setEditingId(null)}
                            sx={{ textTransform: 'none' }}
                          >
                            Avbryt
                          </Button>
                        </Stack>
                      </Stack>
                    </Box>
                  ) : (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(request);
                      }}
                      sx={{ alignSelf: 'flex-start', textTransform: 'none' }}
                    >
                      Rediger
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      ) : (
        // Desktop Table Layout
        <TableContainer component={Paper} className="shadow rounded-lg">
          <Table data-cy="invoice-requests-table">
            <TableHead className="bg-gray-50">
              <TableRow>
                <TableCell className="text-gray-500 font-medium">
                  ID
                </TableCell>
                <TableCell 
                  className="text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('fullName')}
                  data-cy="sort-customer"
                >
                  <Box className="flex items-center gap-1">
                    Kunde
                    {getSortIcon('fullName')}
                  </Box>
                </TableCell>
                <TableCell className="text-gray-500 font-medium">
                  Type
                </TableCell>
                <TableCell 
                  className="text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('amount')}
                  data-cy="sort-amount"
                >
                  <Box className="flex items-center gap-1">
                    Beløp
                    {getSortIcon('amount')}
                  </Box>
                </TableCell>
                <TableCell 
                  className="text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('status')}
                  data-cy="sort-status"
                >
                  <Box className="flex items-center gap-1">
                    Status
                    {getSortIcon('status')}
                  </Box>
                </TableCell>
                <TableCell 
                  className="text-gray-500 font-medium cursor-pointer hover:bg-gray-100 transition-colors"
                  onClick={() => handleSort('createdAt')}
                  data-cy="sort-created"
                >
                  <Box className="flex items-center gap-1">
                    Opprettet
                    {getSortIcon('createdAt')}
                  </Box>
                </TableCell>
                <TableCell className="text-gray-500 font-medium">
                  Handlinger
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {invoiceRequests.map((request: InvoiceRequestWithRelations) => (
                <TableRow 
                  key={request.id} 
                  className={cn(
                    "hover:bg-gray-50 transition-colors cursor-pointer",
                    editingId === request.id && "bg-blue-50"
                  )}
                  onClick={() => handleInvoiceRowClick(request)}
                  data-cy={`invoice-request-row-${request.id}`}
                >
                  <TableCell>
                    <Typography
                      variant="caption" 
                      className="font-mono text-gray-500 cursor-pointer hover:text-gray-700 select-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleIdExpansion(request.id);
                      }}
                      title="Click to expand/collapse full ID"
                      data-cy={`invoice-request-id-${request.id}`}
                    >
                      {expandedIds.has(request.id) ? request.id : `${request.id.slice(0, 8)}...`}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="font-medium text-gray-900">
                        {request.fullName}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500">
                        {request.email}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500">
                        {request.phone}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-gray-900">
                        {getItemTypeLabel(request.itemType)}
                      </Typography>
                      <Typography variant="body2" className="text-gray-500">
                        {request.description}
                      </Typography>
                      {request.boxIds && request.boxIds.length > 0 && (
                        <Typography variant="caption" className="text-blue-600 mt-1">
                          Boks ID{request.boxIds.length > 1 ? 'er' : ''}: {request.boxIds.join(', ')}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2" className="text-gray-900">
                        {request.amount.toFixed(2)} kr
                      </Typography>
                      {request.discount > 0 && (
                        <Typography variant="caption" className="text-green-600">
                          -{request.discount.toFixed(0)}% rabatt
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Chip
                        label={request.status}
                        size="small"
                        color={request.status === 'PAID' ? 'success' : 
                               request.status === 'CANCELLED' ? 'error' :
                               request.status === 'INVOICE_SENT' ? 'info' : 'warning'}
                      />
                      {request.invoiceNumber && (
                        <Typography variant="caption" className="text-gray-500 mt-1 block">
                          Faktura: {request.invoiceNumber}
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" className="text-gray-500">
                      {new Date(request.createdAt).toLocaleDateString('no-NO')}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {editingId === request.id ? (
                      <Box onClick={(e) => e.stopPropagation()}>
                        <Stack spacing={2}>
                          <FormControl fullWidth size="small">
                            <InputLabel>Status</InputLabel>
                            <Select
                              value={editData.status}
                              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value }))}
                              label="Status"
                            >
                              <MenuItem value="PENDING">PENDING</MenuItem>
                              <MenuItem value="INVOICE_SENT">INVOICE_SENT</MenuItem>
                              <MenuItem value="PAID">PAID</MenuItem>
                              <MenuItem value="CANCELLED">CANCELLED</MenuItem>
                            </Select>
                          </FormControl>
                          <TextField
                            fullWidth
                            size="small"
                            label="Fakturanummer"
                            value={editData.invoiceNumber}
                            onChange={(e) => setEditData(prev => ({ ...prev, invoiceNumber: e.target.value }))}
                          />
                          <TextField
                            fullWidth
                            size="small"
                            label="Admin-notater"
                            multiline
                            rows={2}
                            value={editData.adminNotes}
                            onChange={(e) => setEditData(prev => ({ ...prev, adminNotes: e.target.value }))}
                          />
                          <Stack direction="row" spacing={1}>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleStatusUpdate(request.id)}
                              sx={{ textTransform: 'none' }}
                            >
                              Lagre
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => setEditingId(null)}
                              sx={{ textTransform: 'none' }}
                            >
                              Avbryt
                            </Button>
                          </Stack>
                        </Stack>
                      </Box>
                    ) : (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(request);
                        }}
                        sx={{ textTransform: 'none' }}
                      >
                        Rediger
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
        
      {invoiceRequests.length === 0 && (
        <Paper className="p-8">
          <Typography variant="body1" className="text-center text-gray-500">
            {loading ? 'Laster...' : 'Ingen fakturaforespørsler funnet'}
          </Typography>
        </Paper>
      )}
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          justifyContent="space-between" 
          alignItems="center" 
          spacing={2} 
          className="mt-6"
        >
          <Typography variant="body2" className="text-gray-600">
            Viser {((pagination.page - 1) * pagination.pageSize) + 1} til {Math.min(pagination.page * pagination.pageSize, pagination.totalItems)} av {pagination.totalItems} fakturaforespørsler
          </Typography>
          
          <Pagination
            count={pagination.totalPages}
            page={pagination.page}
            onChange={(_, page) => handlePageChange(page)}
            color="primary"
            size={isMobile ? "small" : "medium"}
            showFirstButton
            showLastButton
            data-cy="pagination"
          />
        </Stack>
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
    </Box>
  );
}