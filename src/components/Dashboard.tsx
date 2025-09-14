import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Plus, ArrowUpRight, LogOut, Wallet, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [qrData, setQrData] = useState<any>(null);
  const [pixValue, setPixValue] = useState('');
  const [pixDescription, setPixDescription] = useState('');
  const [transferAmount, setTransferAmount] = useState('');

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      
      // Calculate balance from transactions
      const completedTransactions = (data || []).filter(t => t.status === 'COMPLETED');
      const incomeTransactions = completedTransactions.filter(t => t.type === 'INCOME');
      const transferTransactions = completedTransactions.filter(t => t.type === 'TRANSFER');
      
      const totalIncome = incomeTransactions.reduce((sum, t) => sum + Number(t.value), 0);
      const totalTransfers = transferTransactions.reduce((sum, t) => sum + Number(t.value), 0);
      
      setBalance(totalIncome - totalTransfers);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar transações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    if (!pixValue || !pixDescription) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e a descrição do PIX',
        variant: 'destructive',
      });
      return;
    }

    setQrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'generatePixQR',
          value: parseFloat(pixValue),
          description: pixDescription,
        },
      });

      if (error) throw error;

      setQrData(data);
      toast({
        title: 'QR Code PIX gerado!',
        description: 'QR Code criado com sucesso. Aguardando pagamento.',
      });
      
      // Refresh transactions
      loadTransactions();
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar QR Code',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setQrLoading(false);
    }
  };

  const handleTransferToBitfinex = async () => {
    if (!transferAmount) {
      toast({
        title: 'Campo obrigatório',
        description: 'Preencha o valor da transferência',
        variant: 'destructive',
      });
      return;
    }

    const amount = parseFloat(transferAmount);
    if (amount > balance) {
      toast({
        title: 'Saldo insuficiente',
        description: 'Valor da transferência excede o saldo disponível',
        variant: 'destructive',
      });
      return;
    }

    setTransferLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'transferToBitfinex',
          amount: amount,
        },
      });

      if (error) throw error;

      toast({
        title: 'Transferência realizada!',
        description: `${formatCurrency(data.sentAmount)} enviado para Bitfinex. Taxa: ${formatCurrency(data.fee)}`,
      });
      
      setTransferModalOpen(false);
      setTransferAmount('');
      
      // Refresh transactions
      loadTransactions();
    } catch (error: any) {
      toast({
        title: 'Erro na transferência',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setTransferLoading(false);
    }
  };

  const getStatusBadge = (status: string, type: string) => {
    const statusMap = {
      'PENDING': { label: 'Pendente', variant: 'secondary' as const },
      'COMPLETED': { label: 'Concluído', variant: 'default' as const },
      'CANCELLED': { label: 'Cancelado', variant: 'destructive' as const },
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, variant: 'secondary' as const };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur supports-[backdrop-filter]:bg-card/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">ZaPix</h1>
            </div>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Balance Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Wallet className="h-5 w-5" />
              <span>Saldo Disponível</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary mb-4">
              {formatCurrency(balance)}
            </div>
            <div className="flex gap-3">
              <Dialog open={qrModalOpen} onOpenChange={setQrModalOpen}>
                <DialogTrigger asChild>
                  <Button className="flex-1">
                    <QrCode className="h-4 w-4 mr-2" />
                    Gerar QR PIX
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Gerar QR Code PIX</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    {!qrData ? (
                      <>
                        <div>
                          <Label htmlFor="pixValue">Valor (R$)</Label>
                          <Input
                            id="pixValue"
                            type="number"
                            step="0.01"
                            value={pixValue}
                            onChange={(e) => setPixValue(e.target.value)}
                            placeholder="0,00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="pixDescription">Descrição</Label>
                          <Textarea
                            id="pixDescription"
                            value={pixDescription}
                            onChange={(e) => setPixDescription(e.target.value)}
                            placeholder="Descrição do pagamento"
                          />
                        </div>
                        <Button onClick={handleGenerateQR} disabled={qrLoading} className="w-full">
                          {qrLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Gerar QR Code
                        </Button>
                      </>
                    ) : (
                      <div className="text-center space-y-4">
                        <div className="bg-white p-4 rounded-lg">
                          <img 
                            src={`data:image/png;base64,${qrData.qrCodeImage}`}
                            alt="QR Code PIX"
                            className="mx-auto"
                          />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Escaneie o QR Code para pagar {formatCurrency(parseFloat(pixValue))}
                        </p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setQrData(null);
                            setPixValue('');
                            setPixDescription('');
                            setQrModalOpen(false);
                          }}
                          className="w-full"
                        >
                          Criar Novo QR Code
                        </Button>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              
              <Dialog open={transferModalOpen} onOpenChange={setTransferModalOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    disabled={balance <= 0}
                    className="flex-1"
                  >
                    <ArrowUpRight className="h-4 w-4 mr-2" />
                    Enviar para Bitfinex
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Transferir para Bitfinex</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="text-sm text-muted-foreground">
                      Saldo disponível: {formatCurrency(balance)}
                    </div>
                    <div>
                      <Label htmlFor="transferAmount">Valor da transferência (R$)</Label>
                      <Input
                        id="transferAmount"
                        type="number"
                        step="0.01"
                        value={transferAmount}
                        onChange={(e) => setTransferAmount(e.target.value)}
                        placeholder="0,00"
                        max={balance}
                      />
                    </div>
                    {transferAmount && (
                      <div className="text-sm space-y-1 p-3 bg-muted rounded-lg">
                        <div className="flex justify-between">
                          <span>Valor a transferir:</span>
                          <span>{formatCurrency(parseFloat(transferAmount) || 0)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa (2%):</span>
                          <span>{formatCurrency((parseFloat(transferAmount) || 0) * 0.02)}</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-1">
                          <span>Valor líquido:</span>
                          <span>{formatCurrency((parseFloat(transferAmount) || 0) * 0.98)}</span>
                        </div>
                      </div>
                    )}
                    <Button onClick={handleTransferToBitfinex} disabled={transferLoading} className="w-full">
                      {transferLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Confirmar Transferência
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={() => setQrModalOpen(true)}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <QrCode className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium">QR Code PIX</h3>
              <p className="text-sm text-muted-foreground">Receber pagamentos</p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer transition-colors ${balance > 0 ? 'hover:bg-accent/50' : 'opacity-50 cursor-not-allowed'}`} onClick={balance > 0 ? () => setTransferModalOpen(true) : undefined}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <ArrowUpRight className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium">Transferir</h3>
              <p className="text-sm text-muted-foreground">Para Bitfinex</p>
            </CardContent>
          </Card>
        </div>

        {/* Transactions History */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Transações</CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-8">
                <Plus className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma transação ainda</h3>
                <p className="text-muted-foreground">
                  Gere um QR Code PIX para receber seu primeiro pagamento
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium">
                          {transaction.type === 'INCOME' ? 'Recebimento PIX' : 'Transferência para Bitfinex'}
                        </span>
                        {getStatusBadge(transaction.status, transaction.type)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {new Date(transaction.created_at).toLocaleString('pt-BR')}
                      </p>
                      {transaction.description && (
                        <p className="text-sm text-muted-foreground">
                          {transaction.description}
                        </p>
                      )}
                      {transaction.destination_address && (
                        <p className="text-sm text-muted-foreground">
                          Destino: {transaction.destination_address}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${transaction.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'INCOME' ? '+' : '-'}
                        {formatCurrency(Number(transaction.value))}
                      </div>
                      {transaction.type === 'TRANSFER' && transaction.retained_amount && (
                        <div className="text-xs text-muted-foreground">
                          Taxa: {formatCurrency(Number(transaction.retained_amount))}
                        </div>
                      )}
                      {transaction.type === 'TRANSFER' && transaction.sent_amount && (
                        <div className="text-xs text-muted-foreground">
                          Enviado: {formatCurrency(Number(transaction.sent_amount))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;