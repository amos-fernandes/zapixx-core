import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface MetricsGridProps {
  totalTransactions: number;
  pendingTransactions: number;
  completedTransactions: number;
  averageTransaction: number;
  totalVolume: number;
  weeklyGrowth: number;
}

const MetricsGrid = ({
  totalTransactions,
  pendingTransactions,
  completedTransactions,
  averageTransaction,
  totalVolume,
  weeklyGrowth
}: MetricsGridProps) => {
  const metrics = [
    {
      title: 'Total de Transações',
      value: totalTransactions.toString(),
      icon: Activity,
      trend: weeklyGrowth > 0 ? 'up' : 'down',
      trendValue: `${Math.abs(weeklyGrowth).toFixed(1)}%`,
      className: 'bg-info/10 text-info'
    },
    {
      title: 'Pendentes',
      value: pendingTransactions.toString(),
      icon: Clock,
      className: 'bg-warning/10 text-warning'
    },
    {
      title: 'Concluídas',
      value: completedTransactions.toString(),
      icon: TrendingUp,
      className: 'bg-success/10 text-success'
    },
    {
      title: 'Ticket Médio',
      value: formatCurrency(averageTransaction),
      icon: BarChart3,
      className: 'bg-primary/10 text-primary'
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <Card key={index} className="border-border/50 bg-gradient-card hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {metric.title}
                </CardTitle>
                <div className={`p-1.5 rounded-md ${metric.className}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-card-foreground">
                  {metric.value}
                </div>
                {metric.trend && (
                  <div className={`flex items-center space-x-1 text-xs ${
                    metric.trend === 'up' ? 'text-success' : 'text-destructive'
                  }`}>
                    {metric.trend === 'up' ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    <span>{metric.trendValue} esta semana</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MetricsGrid;