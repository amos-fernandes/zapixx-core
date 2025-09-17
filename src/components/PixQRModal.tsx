import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  QrCode, 
  Loader2, 
  Copy, 
  Download, 
  RefreshCw,
  CheckCircle
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

interface PixQRModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (value: number, description: string) => Promise<void>;
  loading: boolean;
  qrData: any;
  onReset: () => void;
}

const PixQRModal = ({
  open,
  onOpenChange,
  onGenerate,
  loading,
  qrData,
  onReset
}: PixQRModalProps) => {
  const [pixValue, setPixValue] = useState('');
  const [pixDescription, setPixDescription] = useState('');
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!pixValue || !pixDescription) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o valor e a descrição do PIX',
        variant: 'destructive',
      });
      return;
    }

    await onGenerate(parseFloat(pixValue), pixDescription);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: 'Copiado!',
        description: 'Código PIX copiado para a área de transferência',
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: 'Erro ao copiar',
        description: 'Não foi possível copiar o código PIX',
        variant: 'destructive',
      });
    }
  };

  const downloadQR = () => {
    if (!qrData?.qrCodeImage) return;
    
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${qrData.qrCodeImage}`;
    link.download = `qr-pix-${formatCurrency(parseFloat(pixValue)).replace(/[^\d]/g, '')}.png`;
    link.click();
  };

  const handleReset = () => {
    onReset();
    setPixValue('');
    setPixDescription('');
    setCopied(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border/50">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <QrCode className="h-5 w-5 text-primary" />
            </div>
            <span>Gerar QR Code PIX</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {!qrData ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="pixValue" className="text-sm font-medium">
                  Valor (R$) *
                </Label>
                <Input
                  id="pixValue"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={pixValue}
                  onChange={(e) => setPixValue(e.target.value)}
                  placeholder="0,00"
                  className="text-lg font-semibold"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="pixDescription" className="text-sm font-medium">
                  Descrição *
                </Label>
                <Textarea
                  id="pixDescription"
                  value={pixDescription}
                  onChange={(e) => setPixDescription(e.target.value)}
                  placeholder="Descrição do pagamento"
                  className="resize-none"
                  rows={3}
                />
              </div>
              
              {pixValue && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">Valor a receber:</span>
                      <span className="font-bold text-primary text-lg">
                        {formatCurrency(parseFloat(pixValue) || 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !pixValue || !pixDescription} 
                className="w-full h-11 bg-gradient-primary hover:bg-gradient-primary/90 shadow-glow"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando QR Code...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Gerar QR Code PIX
                  </>
                )}
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <Card className="bg-white p-4 border-border/20">
                <div className="text-center">
                  <img 
                    src={`data:image/png;base64,${qrData.qrCodeImage}`}
                    alt="QR Code PIX"
                    className="mx-auto rounded-lg shadow-md"
                    style={{ maxWidth: '200px', height: 'auto' }}
                  />
                </div>
              </Card>
              
              <div className="space-y-3">
                <div className="flex items-center justify-center space-x-2">
                  <Badge className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    QR Code Ativo
                  </Badge>
                </div>
                
                <div className="text-center space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Valor a receber:
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(parseFloat(pixValue))}
                  </p>
                </div>
                
                {qrData.expiresAt && (
                  <p className="text-xs text-center text-muted-foreground">
                    Expira em: {new Date(qrData.expiresAt).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(qrData.qrCode || '')}
                  disabled={!qrData.qrCode}
                  className="h-10"
                >
                  {copied ? (
                    <CheckCircle className="h-4 w-4 mr-2 text-success" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? 'Copiado!' : 'Copiar'}
                </Button>
                
                <Button
                  variant="outline"
                  onClick={downloadQR}
                  className="h-10"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
              </div>
              
              <Button 
                onClick={handleReset}
                className="w-full h-10"
                variant="secondary"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Criar Novo QR Code
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PixQRModal;