'use client';

import React from 'react';
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
import { useProductsStore } from '../store';
import { Search, X, ChevronDown, RotateCcw, LayoutGrid, List } from 'lucide-react';

const CATEGORY_OPTIONS = [
  { value: 'mobile_credit', label: 'Mobile Credit' },
  { value: 'sim_cards', label: 'SIM Cards' },
  { value: 'scratch_cards', label: 'Scratch Cards' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'data_packs', label: 'Data Packs' },
  { value: 'voice_packages', label: 'Voice Packages' },
  { value: 'sms_packages', label: 'SMS Packages' },
];

const OPERATOR_OPTIONS = [
  { value: 'Mobilis', label: 'Mobilis' },
  { value: 'Ooredoo', label: 'Ooredoo' },
  { value: 'Djezzy', label: 'Djezzy' },
];

const STOCK_OPTIONS = [
  { value: 'all', label: 'All Stock' },
  { value: 'in_stock', label: 'In Stock' },
  { value: 'low_stock', label: 'Low Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
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
          variant="ghost"
          size="sm"
          className={cn(
            'h-9 px-3.5 rounded-[12px] text-xs font-medium gap-1.5 border transition-colors',
            selected.length > 0
              ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
              : 'border-border/60 bg-white text-muted-foreground hover:bg-muted/70'
          )}
        >
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 h-4 px-1 text-[10px] rounded-full bg-primary/20 text-primary">
              {selected.length}
            </Badge>
          )}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
        <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">{label}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {selected.length > 0 && (
          <>
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={onClear}
              className="rounded-lg cursor-pointer text-xs text-primary"
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
            className="rounded-lg cursor-pointer text-xs"
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function ProductFilters() {
  const { filters, setFilter, resetFilters, viewMode, setViewMode } = useProductsStore();

  const activeFilterCount =
    filters.category.length +
    filters.operator.length +
    filters.productStatus.length +
    filters.region.length +
    (filters.stockStatus !== 'all' ? 1 : 0) +
    (filters.dateRange.start ? 1 : 0);

  const toggleArrayFilter = (key: 'category' | 'operator' | 'productStatus' | 'region', value: string) => {
    const current = filters[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    setFilter(key, next as any);
  };

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      {/* Search */}
      <div className="relative flex-1 min-w-[240px] max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search product name, SKU, operator..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-10 pr-10 h-9 text-sm rounded-[12px] bg-white border-border/60"
        />
        {filters.search && (
          <button
            onClick={() => setFilter('search', '')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Category Filter */}
      <FilterDropdown
        label="Category"
        options={CATEGORY_OPTIONS}
        selected={filters.category}
        onToggle={(v) => toggleArrayFilter('category', v)}
        onClear={() => setFilter('category', [])}
      />

      {/* Operator Filter */}
      <FilterDropdown
        label="Operator"
        options={OPERATOR_OPTIONS}
        selected={filters.operator}
        onToggle={(v) => toggleArrayFilter('operator', v)}
        onClear={() => setFilter('operator', [])}
      />

      {/* Stock Status Filter */}
      <DropdownMenu>
        <DropdownMenuTrigger className="outline-none" nativeButton={false}>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              'h-9 px-3.5 rounded-[12px] text-xs font-medium gap-1.5 border transition-colors',
              filters.stockStatus !== 'all'
                ? 'border-primary/30 bg-primary/5 text-primary hover:bg-primary/10'
                : 'border-border/60 bg-white text-muted-foreground hover:bg-muted/70'
            )}
          >
            Stock Status
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-52 rounded-xl p-1.5">
          <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground px-2">Stock Status</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {STOCK_OPTIONS.map((opt) => (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={filters.stockStatus === opt.value}
              onCheckedChange={() => setFilter('stockStatus', opt.value as any)}
              className="rounded-lg cursor-pointer text-xs"
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Product Status Filter */}
      <FilterDropdown
        label="Status"
        options={STATUS_OPTIONS}
        selected={filters.productStatus}
        onToggle={(v) => toggleArrayFilter('productStatus', v)}
        onClear={() => setFilter('productStatus', [])}
      />

      {/* Clear All */}
      {activeFilterCount > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3.5 rounded-[12px] text-xs font-medium gap-1.5 text-destructive hover:bg-destructive/10"
          onClick={resetFilters}
        >
          <RotateCcw className="h-3 w-3" />
          Clear ({activeFilterCount})
        </Button>
      )}

      {/* Right-side actions */}
      <div className="flex items-center gap-1 ml-auto">
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-[12px] text-muted-foreground hover:text-foreground" title="Refresh">
          <RotateCcw className="h-4 w-4" />
        </Button>

        {/* View Toggle */}
        <div className="flex items-center bg-muted/50 rounded-[12px] p-0.5">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 rounded-[10px]',
              viewMode === 'table' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            )}
            onClick={() => setViewMode('table')}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              'h-8 w-8 rounded-[10px]',
              viewMode === 'grid' ? 'bg-white text-foreground shadow-sm' : 'text-muted-foreground'
            )}
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
