'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useReportsStore } from '../store';
import { Search, X, RefreshCw, FileDown, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function ReportsFilters() {
  const {
    searchQuery, setSearchQuery,
    selectedRegion, setSelectedRegion,
    selectedWilaya, setSelectedWilaya,
    selectedDelegate, setSelectedDelegate,
    selectedWarehouse, setSelectedWarehouse,
    selectedReportType, setSelectedReportType,
    selectedStatus, setSelectedStatus,
    resetFilters,
  } = useReportsStore();

  const hasFilters = searchQuery || selectedRegion || selectedWilaya || selectedDelegate || selectedWarehouse || selectedReportType || selectedStatus;

  return (
    <div className="w-full bg-muted/20 border border-border/40 rounded-xl p-2.5 flex items-center gap-2.5 flex-wrap">
      {/* Search */}
      <div className="relative flex-1 min-w-[220px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search reports..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 pr-8 h-9 text-xs rounded-xl bg-card border-border/60 focus-visible:ring-primary/20"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Report Type */}
      <Select value={selectedReportType} onValueChange={(v) => setSelectedReportType(v ?? '')}>
        <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs w-[130px] bg-card">
          <SelectValue placeholder="Report Type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sales">Sales</SelectItem>
          <SelectItem value="revenue">Revenue</SelectItem>
          <SelectItem value="delegate">Delegate</SelectItem>
          <SelectItem value="warehouse">Warehouse</SelectItem>
          <SelectItem value="stock">Stock</SelectItem>
          <SelectItem value="client">Client</SelectItem>
          <SelectItem value="regional">Regional</SelectItem>
        </SelectContent>
      </Select>

      {/* Region */}
      <Select value={selectedRegion} onValueChange={(v) => setSelectedRegion(v ?? '')}>
        <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs w-[120px] bg-card">
          <SelectValue placeholder="Region" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="east">East</SelectItem>
          <SelectItem value="center">Center</SelectItem>
          <SelectItem value="west">West</SelectItem>
          <SelectItem value="south">South</SelectItem>
        </SelectContent>
      </Select>

      {/* Wilaya */}
      <Select value={selectedWilaya} onValueChange={(v) => setSelectedWilaya(v ?? '')}>
        <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs w-[120px] bg-card">
          <SelectValue placeholder="Wilaya" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="setif">Setif</SelectItem>
          <SelectItem value="algiers">Algiers</SelectItem>
          <SelectItem value="oran">Oran</SelectItem>
          <SelectItem value="constantine">Constantine</SelectItem>
          <SelectItem value="annaba">Annaba</SelectItem>
        </SelectContent>
      </Select>

      {/* Status */}
      <Select value={selectedStatus} onValueChange={(v) => setSelectedStatus(v ?? '')}>
        <SelectTrigger className="h-9 rounded-xl border-border/60 text-xs w-[120px] bg-card">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ready">Ready</SelectItem>
          <SelectItem value="processing">Processing</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
          <SelectItem value="scheduled">Scheduled</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear All */}
      {hasFilters && (
        <Button
          variant="ghost"
          size="sm"
          className="h-9 px-3 rounded-xl text-xs font-semibold gap-1 text-destructive hover:bg-destructive/10"
          onClick={resetFilters}
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear
        </Button>
      )}

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 ml-auto">
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl border-border/60 bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          title="Refresh Reports"
          onClick={() => toast.success('Reports refreshed')}
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-9 w-9 rounded-xl border-border/60 bg-card hover:bg-muted/80 text-muted-foreground hover:text-foreground"
          title="Export Reports"
          onClick={() => toast.success('Reports exported')}
        >
          <FileDown className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
