import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TablePagination, TableSortLabel, Paper, Box, Typography,
  Skeleton,
} from '@mui/material';
import { visuallyHidden } from '@mui/utils';
import SearchBar from './SearchBar';
import EmptyState from './EmptyState';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS } from '../../constants';

export interface Column {
  id: string;
  label: string;
  minWidth?: number;
  maxWidth?: number;
  align?: 'left' | 'right' | 'center';
  sortable?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (row: any) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  rows: any[];
  loading?: boolean;
  searchable?: boolean;
  searchValue?: string;
  onSearchChange?: (v: string) => void;
  searchPlaceholder?: string;
  toolbar?: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getRowId?: (row: any) => string | number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onRowClick?: (row: any) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  total?: number;
  page?: number;
  rowsPerPage?: number;
  onPageChange?: (page: number) => void;
  onRowsPerPageChange?: (rpp: number) => void;
}

type Order = 'asc' | 'desc';

const DataTable: React.FC<DataTableProps> = ({
  columns,
  rows,
  loading = false,
  searchable = true,
  searchValue = '',
  onSearchChange,
  searchPlaceholder,
  toolbar,
  getRowId,
  onRowClick,
  emptyTitle = 'No Data Found',
  emptyDescription = 'No records match your criteria.',
  total,
  page = 0,
  rowsPerPage = DEFAULT_PAGE_SIZE,
  onPageChange,
  onRowsPerPageChange,
}) => {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<string>('');

  const handleSort = (colId: string) => {
    if (orderBy === colId) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderBy(colId);
      setOrder('asc');
    }
  };

  const sortedRows = React.useMemo(() => {
    if (!orderBy) return rows;
    return [...rows].sort((a, b) => {
      const aVal = a[orderBy];
      const bVal = b[orderBy];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return order === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return order === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
  }, [rows, order, orderBy]);

  const displayRows = onPageChange
    ? sortedRows
    : sortedRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Paper sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>
      {/* Toolbar */}
      {(searchable || toolbar) && (
        <Box
          sx={{
            px: 2, py: 1.5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 1.5, borderBottom: '1px solid rgba(0,0,0,0.06)',
          }}
        >
          {searchable && (
            <SearchBar
              value={searchValue}
              onChange={onSearchChange || (() => {})}
              placeholder={searchPlaceholder}
            />
          )}
          {toolbar && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{toolbar}</Box>}
        </Box>
      )}

      <TableContainer>
        <Table stickyHeader size="medium">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell
                  key={col.id}
                  align={col.align || 'left'}
                  style={{ minWidth: col.minWidth, maxWidth: col.maxWidth }}
                >
                  {col.sortable ? (
                    <TableSortLabel
                      active={orderBy === col.id}
                      direction={orderBy === col.id ? order : 'asc'}
                      onClick={() => handleSort(col.id)}
                    >
                      {col.label}
                      {orderBy === col.id && (
                        <Box component="span" sx={visuallyHidden}>
                          {order === 'desc' ? 'sorted descending' : 'sorted ascending'}
                        </Box>
                      )}
                    </TableSortLabel>
                  ) : (
                    col.label
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {loading ? (
              Array.from({ length: rowsPerPage }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col.id}>
                      <Skeleton variant="text" width="80%" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : displayRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} sx={{ py: 6 }}>
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </TableCell>
              </TableRow>
            ) : (
              displayRows.map((row, idx) => {
                const rowId = getRowId ? getRowId(row) : idx;
                return (
                  <TableRow
                    key={rowId}
                    hover
                    onClick={() => onRowClick?.(row)}
                    sx={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((col) => (
                      <TableCell key={col.id} align={col.align || 'left'} sx={{ py: 1.5 }}>
                        {col.render ? col.render(row) : (row[col.id] ?? '—')}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[...PAGE_SIZE_OPTIONS]}
        component="div"
        count={total ?? rows.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => onPageChange?.(newPage)}
        onRowsPerPageChange={(e) => onRowsPerPageChange?.(parseInt(e.target.value, 10))}
        sx={{ borderTop: '1px solid rgba(0,0,0,0.06)' }}
      />
    </Paper>
  );
};

export default DataTable;
