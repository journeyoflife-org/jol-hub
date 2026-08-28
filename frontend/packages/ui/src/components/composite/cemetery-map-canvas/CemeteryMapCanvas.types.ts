import type { TenantTheme } from '../../../lib/tenant-theme';

/** One plot cell of the cemetery map canvas. */
export interface PlotCell {
  /** Plot identifier (public reference, e.g. "A-12"). */
  id: string;
  /** Availability state — display only. */
  status: 'available' | 'reserved' | 'occupied';
}

/** Props for {@link CemeteryMapCanvas}. */
export interface CemeteryMapCanvasProps {
  /** Accessible title for the map figure (e.g. the cemetery name). */
  title: string;
  /** Plot rows × columns layout. */
  rows: number;
  cols: number;
  /** Plot cells, row-major order; omitted cells render as empty ground. */
  plots?: PlotCell[];
  /** Tenant theming. */
  tenant?: TenantTheme;
  /** Extra class name. */
  className?: string;
}
