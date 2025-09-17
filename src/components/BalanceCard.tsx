import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Eye, 
  EyeOff,
  DollarSign,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BalanceCardProps {
  balance: number;
  totalIncome: number;
  totalTransfers: number;
  pendingAmount: number;
  onGenerateQR: () => void;
  onTransfer: () => void;
}

const BalanceCard = ({
  balance,
  totalIncome,
  totalTransfers,
  pendingAmount,
  onGenerateQR,
  onTransfer
}: BalanceCardProps) => {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [animateBalance, setAnimateBalance] = useState(false);

  useEffect(() => {
    setAnimateBalance(true);
    const timer = setTimeout(() => setAnimateBalance(false), 500);
    return () => clearTimeout(timer);
  }, [balance]);

  return (
    <Card className="relative overflow-hidden bg-gradient-card border-border/50 shadow-lg">
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-card-foreground">
            <div className="p-2 rounded-lg bg-primary/10">
              <Wallet className="h-5 w-5 text-primary" />
            </div>
            <span>Saldo Disponível</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsBalanceVisible(!isBalanceVisible)}
            className="h-8 w-8 p-0 hover:bg-primary/10"
          >
            {isBalanceVisible ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="relative space-y-6">
        <div className="space-y-2">
          <div className={`text-4xl font-bold text-primary transition-all duration-500 ${animateBalance ? 'scale-105' : ''}`}>
            {isBalanceVisible ? formatCurrency(balance) : '••••••'}
          </div>
          {pendingAmount > 0 && (
            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="text-xs">
                Pendente: {formatCurrency(pendingAmount)}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-success">
              <ArrowDownLeft className="h-4 w-4" />
              <span className="text-sm font-medium">Recebido</span>
            </div>
            <div className="text-lg font-semibold">
              {isBalanceVisible ? formatCurrency(totalIncome) : '••••••'}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center space-x-1 text-destructive">
              <ArrowUpRight className="h-4 w-4" />
              <span className="text-sm font-medium">Enviado</span>
            </div>
            <div className="text-lg font-semibold">
              {isBalanceVisible ? formatCurrency(totalTransfers) : '••••••'}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2">
          <Button 
            onClick={onGenerateQR}
            className="bg-gradient-primary hover:bg-gradient-primary/90 transition-all duration-200 shadow-glow hover:shadow-lg"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Receber PIX
          </Button>
          <Button 
            variant="outline" 
            onClick={onTransfer}
            disabled={balance <= 0}
            className="border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-all duration-200"
          >
            <ArrowUpRight className="h-4 w-4 mr-2" />
            Transferir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BalanceCard;