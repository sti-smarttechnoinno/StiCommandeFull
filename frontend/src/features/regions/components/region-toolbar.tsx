'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRegionsStore } from '../store';
import { Search, ChevronDown, ChevronUp, RefreshCw, Download, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RegionToolbar() {
  const { filters, setFilter, expandAll, collapseAll } = useRegionsStore();

  return (
    <div className="bg-white border border-border/40 shadow-xs rounded-[20px] px-5 py-4 flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[240px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search region, wilaya or delegate..."
          value={filters.search}
          onChange={(e) => setFilter('search', e.target.value)}
          className="pl-10 h-10 rounded-xl text-sm border-border/60 bg-muted/30"
        />
      </div>

      {/* Region Filter */}
      <Select
        value={filters.region.length > 0 ? filters.region[0] : '__all'}
        onValueChange={(v) => setFilter('region', v === '__all' ? [] : [v as any])}
      >
        <SelectTrigger className="w-[140px] h-10 rounded-xl text-xs font-medium border-border/60">
          <Filter className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">All Regions</SelectItem>
          <SelectItem value="east">East</SelectItem>
          <SelectItem value="center">Center</SelectItem>
          <SelectItem value="west">West</SelectItem>
          <SelectItem value="south">South</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status.length > 0 ? filters.status[0] : '__all'}
        onValueChange={(v) => setFilter('status', v === '__all' ? [] : [v as any])}
      >
        <SelectTrigger className="w-[130px] h-10 rounded-xl text-xs font-medium border-border/60">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="limited">Limited</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
        </SelectContent>
      </Select>

      {/* Divider */}
      <div className="w-px h-6 bg-border/40" />

      {/* Expand/Collapse */}
      <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5" onClick={expandAll}>
        <ChevronDown className="h-3.5 w-3.5" /> Expand All
      </Button>
      <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5" onClick={collapseAll}>
        <ChevronUp className="h-3.5 w-3.5" /> Collapse All
      </Button>

      {/* Divider */}
      <div className="w-px h-6 bg-border/40" />

      {/* Actions */}
      <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5">
        <RefreshCw className="h-3.5 w-3.5" /> Refresh
      </Button>
      <Button variant="ghost" size="sm" className="h-9 px-3 text-xs font-medium gap-1.5">
        <Download className="h-3.5 w-3.5" /> Export
      </Button>
    </div>
  );
}
