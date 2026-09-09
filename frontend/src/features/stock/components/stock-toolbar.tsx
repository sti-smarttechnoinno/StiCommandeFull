'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useStockStore } from '../store';
import { stockService } from '@/services/stock';
import { warehousesService } from '@/services/warehouses';
import { Search, X, ChevronDown, RotateCcw, RefreshCw, Download } from 'lucide-react';
import { toast } from 'sonner';

const TYPE_OPTIONS = [
  { value: 'incoming', label: 'Incoming' },
  { value: 'outgoing', label: 'Outgoing' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
];

const STATUS_OPTIONS = [
  { value: 'completed', label: 'Completed' },
  { value: 'pending', label: 'Pending' },
  { value: 'in_transit', label: 'In Transit' },
  { value: 'cancelled', label: 'Cancelled' },
];

interface FilterDropdownProps {
  label: string;
  options: { value: string; label: string }[];
  selected: string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}

function FilterDropdown({ label, options, selected, onToggle, onClear }: FilterDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="outline-none" nativeButton={false}>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 px-3 rounded-xl text-xs font-semibold gap-1.5 border border-border/60 transition-colors',
            selected.length > 0
              ? 'border-primary/40 bg-primary/10 text-primary'
              : 'bg-card text-muted-foreground'
          )}
        >
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px] rounded-full bg-primary text-primary-foreground">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5 shadow-md">
        <DropdownMenuLabel className="text-xs font-bold text-muted-foreground px-2">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {selected.length > 0 && (
          <>
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={onClear}
              className="rounded-lg cursor-pointer text-xs text-primary font-semibold"
              onSelect={(e) => e.preventDefault()}
            >
              Clear all
            </DropdownMenuCheckboxItem>
            <DropdownMenuSeparator />
          </>
        )}
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => onToggle(opt.value)}
            className="rounded-lg cursor-pointer text-xs font-medium"
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StockToolbar() {
  const { filters, setFilter, resetFilters, triggerRefresh } = useStockStore();
  const [warehouseOptions, setWarehouseOptions] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    Promise.all([
      stockService.getFilterOptions(),
      warehousesService.list({ active_only: true }).catch(() => null),
    ])
      .then(([opts, whRes]) => {
        const dbNames = whRes?.data?.map((w) => w.name) || [];
        const combined = Array.from(new Set([...dbNames, ...(opts.warehouses || [])]));
        if (combined.length) {
          setWarehouseOptions(combined.map((w) => ({ value: w, label: w })));
        }
      })
      .catch(() => {});
  }, []);

  const activeFilterCount =
    filters.warehouse.length +
    filters.movementType.length +
    filters.delegate.length +
    filters.status.length +
    (filters.dateRange.start ? 1 : 0);

  const toggleArrayFilter = (key: 'warehouse' | 'movementType' | 'delegate' | 'status', value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilter(key, next as any);
  };

  const handleExport = async () => {
    try {
      toast.info('Exporting stock movements...');
      const res = await stockService.list({ pageSize: 1000 });
      if (!res.data.length) {
        toast.error('No movements to export');
        return;
      }
      const headers = ['Reference', 'Product', 'Type', 'Quantity', 'Warehouse', 'Destination', 'Delegate', 'Status', 'Date'];
      const csvRows = [headers.join(',')];
      for (const m of res.data) {
        csvRows.push([
          `"${m.reference}"`,
          `"${m.product}"`,
          `"${m.movementType}"`,
          m.quantity,
          `"${m.warehouse}"`,
          `"${m.destinationWarehouse || ''}"`,
          `"${m.delegate || ''}"`,
          `"${m.status}"`,
          `"${m.date}"`,
        ].join(','));
      }
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `stock_movements_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Stock movements exported successfully');
    } catch {
      toast.error('Failed to export movements');
    }
  };

  return (
    <div className="w-full bg-muted/20 border border-border/40 rounded-xl p-2.5 flex items-center gap-2.5 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search product, reference, delegate..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-9 pr-8 h-9 text-xs rounded-xl bg-card border-border/60 focus-visible:ring-primary/20"
        />
        {filters.search && (
          <button
            onClick={() => setFilter('search', '')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Warehouse Filter */}
      <FilterDropdown
        label="Warehouse"
        options={warehouseOptions}
        selected={filters.warehouse}
        onToggle={(v) => toggleArrayFilter('warehouse', v)}
        onClear={() => setFilter('warehouse', [])}
      />

      {/* Movement Type Filter */}
      <FilterDropdown
        label="Type"
        options={TYPE_OPTIONS}
        selected={filters.movementType}
        onToggle={(v) => toggleArrayFilter('movementType', v)}
        onClear={() => setFilter('movementType', [])}
      />

      {/* Status Filter */}
      <FilterDropdown
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.status}
        onToggle={(v) => toggleArrayFilter('status', v)}
        onClear={() => setFilter('status', [])}
      />

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 rounded-xl text-xs font-semibold gap-1 text-destructive hover:bg-destructive/10"
          onClick={resetFilters}
        >
          <RotateCcw className="h-3 w-3" />
          Clear ({activeFilterCount})
        </Button>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl border-border/60 bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          title="Refresh Table"
          onClick={() => {
            triggerRefresh();
            toast.success('Stock data refreshed');
          }}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl border-border/60 bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          title="Export Stock Movements"
          onClick={handleExport}
        >
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
