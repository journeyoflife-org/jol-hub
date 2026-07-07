export {
  LineChartComponent,
  AreaChartComponent,
  BarChartComponent,
  PieChartComponent,
  ChartTooltip,
  ChartCard,
  CHART_COLORS,
} from './charts';

export type {
  BarChartProps,
  PieChartProps,
  LineChartData,
  PieChartData,
} from './charts';

// Re-export the interface types from charts.tsx
export type { LineChartProps, AreaChartProps } from './charts';
