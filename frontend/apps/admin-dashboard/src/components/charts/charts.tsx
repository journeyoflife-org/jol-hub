'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

// =============================================================================
// Chart Colors
// =============================================================================

export const CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: 'hsl(var(--secondary))',
  accent: 'hsl(var(--accent))',
  muted: 'hsl(var(--muted))',
  destructive: 'hsl(var(--destructive))',
  // Recharts-friendly colors
  colors: [
    '#3b82f6', // blue
    '#10b981', // green
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#ec4899', // pink
    '#06b6d4', // cyan
    '#84cc16', // lime
  ],
};

// =============================================================================
// Custom Tooltip
// =============================================================================

interface TooltipPayload {
  name: string;
  value: number;
  color: string;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  formatter?: (value: number, name: string) => string;
}

export function ChartTooltip({ active, payload, label, formatter }: CustomTooltipProps) {
  if (!active || !payload) {
    return null;
  }

  return (
    <div className="rounded-lg border bg-background px-3 py-2 shadow-md">
      <p className="text-sm font-medium mb-1">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-muted-foreground">{entry.name}:</span>
          <span className="font-medium">
            {formatter ? formatter(entry.value, entry.name) : entry.value.toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Line Chart Component
// =============================================================================

export interface LineChartData {
  [key: string]: string | number;
}

export interface LineChartProps {
  data: LineChartData[];
  xKey: string;
  lines: {
    key: string;
    name: string;
    color?: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  formatter?: (value: number, name: string) => string;
}

export function LineChartComponent({
  data,
  xKey,
  lines,
  height = 300,
  showGrid = true,
  showLegend = true,
  formatter,
}: LineChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          }}
          className="text-muted-foreground"
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {showLegend && <Legend />}
        {lines.map((line, index) => (
          <Line
            key={line.key}
            type="monotone"
            dataKey={line.key}
            name={line.name}
            stroke={line.color || CHART_COLORS.colors[index % CHART_COLORS.colors.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

// =============================================================================
// Area Chart Component
// =============================================================================

export interface AreaChartProps {
  data: LineChartData[];
  xKey: string;
  areas: {
    key: string;
    name: string;
    color?: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  stacked?: boolean;
  formatter?: (value: number, name: string) => string;
}

export function AreaChartComponent({
  data,
  xKey,
  areas,
  height = 300,
  showGrid = true,
  showLegend = true,
  stacked = false,
  formatter,
}: AreaChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        <XAxis
          dataKey={xKey}
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          className="text-muted-foreground"
        />
        <YAxis
          tick={{ fontSize: 12 }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
            return value;
          }}
          className="text-muted-foreground"
        />
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {showLegend && <Legend />}
        {areas.map((area, index) => {
          const color = area.color || CHART_COLORS.colors[index % CHART_COLORS.colors.length];
          return (
            <Area
              key={area.key}
              type="monotone"
              dataKey={area.key}
              name={area.name}
              stackId={stacked ? 'stack' : undefined}
              stroke={color}
              fill={color}
              fillOpacity={0.2}
            />
          );
        })}
      </AreaChart>
    </ResponsiveContainer>
  );
}

// =============================================================================
// Bar Chart Component
// =============================================================================

export interface BarChartProps {
  data: LineChartData[];
  xKey: string;
  bars: {
    key: string;
    name: string;
    color?: string;
  }[];
  height?: number;
  showGrid?: boolean;
  showLegend?: boolean;
  layout?: 'vertical' | 'horizontal';
  formatter?: (value: number, name: string) => string;
}

export function BarChartComponent({
  data,
  xKey,
  bars,
  height = 300,
  showGrid = true,
  showLegend = true,
  layout = 'horizontal',
  formatter,
}: BarChartProps) {
  const isVertical = layout === 'vertical';

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 5, right: 20, left: isVertical ? 80 : 0, bottom: 5 }}
      >
        {showGrid && <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />}
        {isVertical ? (
          <>
            <XAxis type="number" tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis
              type="category"
              dataKey={xKey}
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={false}
              width={70}
            />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={false} />
          </>
        )}
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {showLegend && <Legend />}
        {bars.map((bar, index) => (
          <Bar
            key={bar.key}
            dataKey={bar.key}
            name={bar.name}
            fill={bar.color || CHART_COLORS.colors[index % CHART_COLORS.colors.length]}
            radius={[4, 4, 0, 0]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

// =============================================================================
// Pie Chart Component
// =============================================================================

export interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartData[];
  height?: number;
  showLegend?: boolean;
  innerRadius?: number;
  outerRadius?: number;
  formatter?: (value: number, name: string) => string;
}

export function PieChartComponent({
  data,
  height = 300,
  showLegend = true,
  innerRadius = 0,
  outerRadius = 80,
  formatter,
}: PieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          paddingAngle={2}
          dataKey="value"
          nameKey="name"
          label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.color || CHART_COLORS.colors[index % CHART_COLORS.colors.length]}
            />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip formatter={formatter} />} />
        {showLegend && <Legend />}
      </PieChart>
    </ResponsiveContainer>
  );
}

// =============================================================================
// Chart Card Wrapper
// =============================================================================

interface ChartCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  action?: React.ReactNode;
}

export function ChartCard({ title, description, children, className, action }: ChartCardProps) {
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {action}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
