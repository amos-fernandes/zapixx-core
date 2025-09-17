import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Clock, 
  CheckCircle, 
  XCircle,
  ExternalLink
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface Transaction {
  id: string;
  value: number;
  status: string;
  type: string;
  description: string;
  created_at: string;
  asaas_payment_id?: string;
  retained_amount?: number;
  sent_amount?: number;
  destination_address?: string;
}

interface TransactionCardProps {
  transaction: Transaction;
}

const TransactionCard = ({ transaction }: TransactionCardProps) => {
  const getStatusConfig = (status: string) => {
    const configs = {
      'PENDING': { 
        label: 'Processando', 
        variant: 'secondary' as const, 
        icon: Clock,
        className: 'bg-warning/10 text-warning border-warning/20'
      },
      'COMPLETED': { 
        label: 'Concluído', 
        variant: 'default' as const, 
        icon: CheckCircle,
        className: 'bg-success/10 text-success border-success/20'
      },
      'CANCELLED': { 
        label: 'Cancelado', 
        variant: 'destructive' as const, 
        icon: XCircle,
        className: 'bg-destructive/10 text-destructive border-destructive/20'
      },
    };
    return configs[status as keyof typeof configs] || configs.PENDING;
  };

  const statusConfig = getStatusConfig(transaction.status);
  const StatusIcon = statusConfig.icon;
  const isIncome = transaction.type === 'INCOME';
  const isTransfer = transaction.type === 'TRANSFER';

  return (
    <Card className="hover:shadow-md transition-all duration-200 border-border/50 bg-gradient-card">
      <CardContent className="p-4">
        <div className="flex items-start justify-between space-x-4">
          <div className="flex items-start space-x-3 flex-1">
            <div className={`p-2 rounded-lg ${isIncome ? 'bg-success/10' : 'bg-destructive/10'}`}>
              {isIncome ? (
                <ArrowDownLeft className={`h-5 w-5 ${isIncome ? 'text-success' : 'text-destructive'}`} />
              ) : (
                <ArrowUpRight className={`h-5 w-5 ${isIncome ? 'text-success' : 'text-destructive'}`} />
              )}
            </div>
            
            <div className="flex-1 space-y-1">
              <div className="flex items-center space-x-2">
                <span className="font-semibold text-card-foreground">
                  {isIncome ? 'Recebimento PIX' : 'Transferência Bitfinex'}
                </span>
                <Badge className={statusConfig.className}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
              
              <p className="text-sm text-muted-foreground">
                {new Date(transaction.created_at).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
              
              {transaction.description && (
                <p className="text-sm text-card-foreground/80">
                  {transaction.description}
                </p>
              )}
              
              {transaction.destination_address && (
                <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                  <ExternalLink className="h-3 w-3" />
                  <span className="truncate">
                    Destino: {transaction.destination_address}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right space-y-1">
            <div className={`font-bold text-lg ${isIncome ? 'text-success' : 'text-destructive'}`}>
              {isIncome ? '+' : '-'}
              {formatCurrency(Number(transaction.value))}
            </div>
            
            {isTransfer && transaction.retained_amount && (
              <div className="text-xs text-muted-foreground">
                Taxa: {formatCurrency(Number(transaction.retained_amount))}
              </div>
            )}
            
            {isTransfer && transaction.sent_amount && (
              <div className="text-xs text-success">
                Líquido: {formatCurrency(Number(transaction.sent_amount))}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TransactionCard;