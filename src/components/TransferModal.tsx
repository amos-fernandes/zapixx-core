import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ArrowUpRight, 
  Loader2, 
  Wallet,
  AlertTriangle,
  Info,
  CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface TransferModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransfer: (amount: number) => Promise<void>;
  loading: boolean;
  balance: number;
}

const TransferModal = ({
  open,
  onOpenChange,
  onTransfer,
  loading,
  balance
}: TransferModalProps) => {
  const [transferAmount, setTransferAmount] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { toast } = useToast();

  const amount = parseFloat(transferAmount) || 0;
  const fee = amount * 0.02; // 2% fee
  const netAmount = amount - fee;
  const exceedsBalance = amount > balance;

  const handleTransfer = async () => {
    if (!transferAmount) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o valor da transferência',
        variant: 'destructive',
      });
      return;
    }

    if (exceedsBalance) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Valor da transferência excede o saldo disponível',
        variant: 'destructive',
      });
      return;
    }

    if (amount < 10) {
      toast({
        title: 'Valor mínimo',
        description: 'O valor mínimo para transferência é R$ 10,00',
        variant: 'destructive',
      });
      return;
    }

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    await onTransfer(amount);
    setTransferAmount('');
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setTransferAmount('');
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      setShowConfirmation(false);
      setTransferAmount('');
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
            <span>
              {showConfirmation ? 'Confirmar Transferência' : 'Transferir para Bitfinex'}
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!showConfirmation ? (
            <>
              <Card className="bg-muted/30 border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Saldo disponível:</span>
                    </div>
                    <Badge variant="secondary" className="font-semibold">
                      {formatCurrency(balance)}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
              
              <div className="space-y-2">
                <Label htmlFor="transferAmount" className="text-sm font-medium">
                  Valor da transferência (R$) *
                </Label>
                <Input
                  id="transferAmount"
                  type="number"
                  step="0.01"
                  min="10"
                  max={balance}
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="0,00"
                  className={`text-lg font-semibold ${exceedsBalance ? 'border-destructive' : ''}`}
                />
                {exceedsBalance && (
                  <p className="text-sm text-destructive">
                    Valor excede o saldo disponível
                  </p>
                )}
              </div>
              
              {amount >= 10 && !exceedsBalance && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Valor a transferir:</span>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Taxa de serviço (2%):</span>
                      <span className="font-semibold text-destructive">-{formatCurrency(fee)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Valor líquido:</span>
                        <span className="font-bold text-primary text-lg">{formatCurrency(netAmount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  Valor mínimo: R$ 10,00. A transferência será processada em até 24 horas úteis.
                </AlertDescription>
              </Alert>
              
              <Button 
                onClick={handleTransfer} 
                disabled={loading || !transferAmount || exceedsBalance || amount < 10}
                className="w-full h-11 bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Continuar
                  </>
                )}
              </Button>
            </>
          ) : (
            <>
              <Alert className="border-warning/50 bg-warning/10">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription className="text-warning-foreground">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita. Confirme os dados antes de prosseguir.
                </AlertDescription>
              </Alert>
              
              <Card className="bg-muted/30 border-border/50">
                <CardContent className="p-4 space-y-3">
                  <div className="text-center space-y-2">
                    <h3 className="font-semibold text-lg">Resumo da Transferência</h3>
                    <Badge className="bg-info/10 text-info border-info/20">
                      Destino: Bitfinex Exchange
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor solicitado:</span>
                      <span className="font-semibold">{formatCurrency(amount)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Taxa de serviço:</span>
                      <span className="font-semibold text-destructive">-{formatCurrency(fee)}</span>
                    </div>
                    <div className="border-t pt-2">
                      <div className="flex justify-between">
                        <span className="font-bold">Valor a receber:</span>
                        <span className="font-bold text-primary text-xl">{formatCurrency(netAmount)}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={loading}
                  className="h-11"
                >
                  Cancelar
                </Button>
                <Button 
                  onClick={handleTransfer} 
                  disabled={loading}
                  className="h-11 bg-gradient-success hover:bg-gradient-success/90"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransferModal;