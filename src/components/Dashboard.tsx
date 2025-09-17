import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Wallet, Plus, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BalanceCard from '@/components/BalanceCard';
import TransactionCard from '@/components/TransactionCard';
import MetricsGrid from '@/components/MetricsGrid';
import PixQRModal from '@/components/PixQRModal';
import TransferModal from '@/components/TransferModal';

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
  const [refreshing, setRefreshing] = useState(false);
  const [balance, setBalance] = useState(0);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [qrData, setQrData] = useState<any>(null);

  // Metrics state
  const [totalIncome, setTotalIncome] = useState(0);
  const [totalTransfers, setTotalTransfers] = useState(0);
  const [pendingAmount, setPendingAmount] = useState(0);
  const [weeklyGrowth, setWeeklyGrowth] = useState(0);

  useEffect(() => {
    if (user) {
      loadTransactions();
    }
  }, [user]);

  const loadTransactions = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTransactions(data || []);
      calculateMetrics(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar transações',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateMetrics = (transactionData: Transaction[]) => {
    const completedTransactions = transactionData.filter(t => t.status === 'COMPLETED');
    const pendingTransactions = transactionData.filter(t => t.status === 'PENDING');
    const incomeTransactions = completedTransactions.filter(t => t.type === 'INCOME');
    const transferTransactions = completedTransactions.filter(t => t.type === 'TRANSFER');
    
    const totalInc = incomeTransactions.reduce((sum, t) => sum + Number(t.value), 0);
    const totalTrans = transferTransactions.reduce((sum, t) => sum + Number(t.value), 0);
    const pendingAmt = pendingTransactions.reduce((sum, t) => sum + Number(t.value), 0);
    
    setTotalIncome(totalInc);
    setTotalTransfers(totalTrans);
    setPendingAmount(pendingAmt);
    setBalance(totalInc - totalTrans);
    
    // Calculate weekly growth (simplified)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentTransactions = transactionData.filter(
      t => new Date(t.created_at) > weekAgo && t.status === 'COMPLETED'
    );
    const growth = recentTransactions.length > 0 ? 
      ((recentTransactions.length / transactionData.length) * 100) : 0;
    setWeeklyGrowth(growth);
  };

  const handleGenerateQR = async (value: number, description: string) => {
    setQrLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-integration', {
        body: {
          action: 'generatePixQR',
          value,
          description,
        },
      });

      if (error) throw error;

      setQrData(data);
      toast({
        title: 'QR Code PIX gerado!',
        description: 'QR Code criado com sucesso. Aguardando pagamento.',
      });
      
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

  const handleTransferToBitfinex = async (amount: number) => {
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
        description: `${data.sentAmount ? `R$ ${data.sentAmount.toFixed(2)}` : 'Valor'} enviado para Bitfinex.`,
      });
      
      setTransferModalOpen(false);
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

  const handleResetQR = () => {
    setQrData(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary/30 border-t-primary mx-auto"></div>
            <div className="animate-pulse-glow absolute inset-0 rounded-full bg-primary/20"></div>
          </div>
          <div className="space-y-2">
            <p className="text-lg font-semibold text-foreground">Carregando dashboard...</p>
            <p className="text-sm text-muted-foreground">Sincronizando seus dados financeiros</p>
          </div>
        </div>
      </div>
    );
  }

  const averageTransaction = transactions.length > 0 ? 
    transactions.reduce((sum, t) => sum + Number(t.value), 0) / transactions.length : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-primary shadow-glow">
                <Wallet className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  ZaPix Pro
                </h1>
                <p className="text-xs text-muted-foreground">
                  Gateway de Pagamentos PIX
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => loadTransactions(true)}
                disabled={refreshing}
                className="hover:bg-primary/10"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Atualizar
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="hover:bg-destructive/10">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 space-y-8">
        {/* Balance Card */}
        <BalanceCard
          balance={balance}
          totalIncome={totalIncome}
          totalTransfers={totalTransfers}
          pendingAmount={pendingAmount}
          onGenerateQR={() => setQrModalOpen(true)}
          onTransfer={() => setTransferModalOpen(true)}
        />

        {/* Metrics Grid */}
        <MetricsGrid
          totalTransactions={transactions.length}
          pendingTransactions={transactions.filter(t => t.status === 'PENDING').length}
          completedTransactions={transactions.filter(t => t.status === 'COMPLETED').length}
          averageTransaction={averageTransaction}
          totalVolume={totalIncome}
          weeklyGrowth={weeklyGrowth}
        />

        {/* Transactions History */}
        <Card className="border-border/50 bg-gradient-card shadow-lg">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center space-x-2">
                <span>Histórico de Transações</span>
                {transactions.length > 0 && (
                  <span className="text-sm font-normal text-muted-foreground">
                    ({transactions.length} {transactions.length === 1 ? 'transação' : 'transações'})
                  </span>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <div className="relative mb-6">
                  <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                    <Plus className="h-8 w-8 text-primary" />
                  </div>
                  <div className="absolute inset-0 animate-pulse-glow bg-primary/20 rounded-full"></div>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-foreground">
                  Nenhuma transação ainda
                </h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Gere seu primeiro QR Code PIX para começar a receber pagamentos de forma rápida e segura.
                </p>
                <Button 
                  onClick={() => setQrModalOpen(true)}
                  className="bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro QR Code
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <PixQRModal
        open={qrModalOpen}
        onOpenChange={setQrModalOpen}
        onGenerate={handleGenerateQR}
        loading={qrLoading}
        qrData={qrData}
        onReset={handleResetQR}
      />

      <TransferModal
        open={transferModalOpen}
        onOpenChange={setTransferModalOpen}
        onTransfer={handleTransferToBitfinex}
        loading={transferLoading}
        balance={balance}
      />
    </div>
  );
};

export default Dashboard;