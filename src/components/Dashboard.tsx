import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { QrCode, Plus, ArrowUpRight, LogOut, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
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
}

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [balance, setBalance] = useState(0);

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
      
      // Calculate balance from received transactions
      const receivedTransactions = (data || []).filter(t => t.type === 'INBOUND' && t.status === 'RECEIVED');
      const sentTransactions = (data || []).filter(t => t.type === 'OUTBOUND' && t.status === 'SENT');
      
      const totalReceived = receivedTransactions.reduce((sum, t) => sum + Number(t.value), 0);
      const totalSent = sentTransactions.reduce((sum, t) => sum + Number(t.sent_amount || 0), 0);
      
      setBalance(totalReceived - totalSent);
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

  const handleGenerateQR = () => {
    toast({
      title: 'QR Code PIX',
      description: 'Funcionalidade em desenvolvimento. Será integrada com a API do Asaas.',
    });
  };

  const handleTransferToBitfinex = () => {
    toast({
      title: 'Transferência para Bitfinex',
      description: 'Funcionalidade em desenvolvimento. Será integrada com as APIs do Asaas e Bitfinex.',
    });
  };

  const getStatusBadge = (status: string, type: string) => {
    const statusMap = {
      'PENDING': { label: 'Pendente', variant: 'secondary' as const },
      'RECEIVED': { label: 'Recebido', variant: 'default' as const },
      'SENT': { label: 'Enviado', variant: 'destructive' as const },
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
              <Button onClick={handleGenerateQR} className="flex-1">
                <QrCode className="h-4 w-4 mr-2" />
                Gerar QR PIX
              </Button>
              <Button 
                variant="outline" 
                onClick={handleTransferToBitfinex}
                disabled={balance <= 0}
                className="flex-1"
              >
                <ArrowUpRight className="h-4 w-4 mr-2" />
                Enviar para Bitfinex
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="cursor-pointer hover:bg-accent/50 transition-colors" onClick={handleGenerateQR}>
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <QrCode className="h-8 w-8 text-primary mb-2" />
              <h3 className="font-medium">QR Code PIX</h3>
              <p className="text-sm text-muted-foreground">Receber pagamentos</p>
            </CardContent>
          </Card>
          
          <Card className={`cursor-pointer transition-colors ${balance > 0 ? 'hover:bg-accent/50' : 'opacity-50 cursor-not-allowed'}`} onClick={balance > 0 ? handleTransferToBitfinex : undefined}>
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
                          {transaction.type === 'INBOUND' ? 'Recebimento PIX' : 'Transferência'}
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
                    </div>
                    <div className="text-right">
                      <div className={`font-bold ${transaction.type === 'INBOUND' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'INBOUND' ? '+' : '-'}
                        {formatCurrency(Number(transaction.value))}
                      </div>
                      {transaction.type === 'OUTBOUND' && transaction.retained_amount && (
                        <div className="text-xs text-muted-foreground">
                          Taxa: {formatCurrency(Number(transaction.retained_amount))}
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