import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const asaasApiKey = Deno.env.get('ASAAS_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, ...payload } = await req.json();
    
    // Get user from JWT
    const authHeader = req.headers.get('authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    
    if (!user) {
      throw new Error('Usuário não autenticado');
    }

    console.log(`Processing ${action} for user ${user.id}`);

    switch (action) {
      case 'generatePixQR':
        return await generatePixQR(user.id, payload);
      case 'checkPaymentStatus':
        return await checkPaymentStatus(payload.paymentId);
      case 'transferToBitfinex':
        return await transferToBitfinex(user.id, payload);
      default:
        throw new Error('Ação não reconhecida');
    }
  } catch (error) {
    console.error('Erro na integração Asaas:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function generatePixQR(userId: string, { value, description }: { value: number, description: string }) {
  try {
    // Criar cobrança PIX no Asaas
    const response = await fetch('https://www.asaas.com/api/v3/payments', {
      method: 'POST',
      headers: {
        'access_token': asaasApiKey!,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billingType: 'PIX',
        value: value,
        description: description,
        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24h
      }),
    });

    const paymentData = await response.json();
    console.log('Asaas payment response:', paymentData);

    if (!response.ok) {
      throw new Error(paymentData.message || 'Erro ao criar cobrança PIX');
    }

    // Buscar QR code da cobrança
    const qrResponse = await fetch(`https://www.asaas.com/api/v3/payments/${paymentData.id}/pixQrCode`, {
      headers: {
        'access_token': asaasApiKey!,
      },
    });

    const qrData = await qrResponse.json();
    console.log('Asaas QR response:', qrData);

    if (!qrResponse.ok) {
      throw new Error('Erro ao gerar QR Code PIX');
    }

    // Salvar transação no banco
    const { error: dbError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        value: value,
        description: description,
        type: 'INCOME',
        status: 'PENDING',
        asaas_payment_id: paymentData.id,
      });

    if (dbError) {
      console.error('Erro ao salvar transação:', dbError);
      throw new Error('Erro ao salvar transação');
    }

    return new Response(JSON.stringify({
      success: true,
      paymentId: paymentData.id,
      qrCode: qrData.payload,
      qrCodeImage: qrData.encodedImage,
      expiryDate: qrData.expirationDate,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao gerar QR PIX:', error);
    throw error;
  }
}

async function checkPaymentStatus(paymentId: string) {
  try {
    const response = await fetch(`https://www.asaas.com/api/v3/payments/${paymentId}`, {
      headers: {
        'access_token': asaasApiKey!,
      },
    });

    const paymentData = await response.json();
    console.log('Payment status check:', paymentData);

    if (!response.ok) {
      throw new Error('Erro ao verificar status do pagamento');
    }

    // Atualizar status no banco se necessário
    if (paymentData.status === 'RECEIVED') {
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'COMPLETED' })
        .eq('asaas_payment_id', paymentId);

      if (error) {
        console.error('Erro ao atualizar status:', error);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      status: paymentData.status,
      value: paymentData.value,
      paymentDate: paymentData.paymentDate,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro ao verificar status:', error);
    throw error;
  }
}

async function transferToBitfinex(userId: string, { amount }: { amount: number }) {
  try {
    // Verificar saldo disponível
    const { data: transactions } = await supabase
      .from('transactions')
      .select('value, type, status')
      .eq('user_id', userId);

    if (!transactions) {
      throw new Error('Erro ao verificar saldo');
    }

    const balance = transactions.reduce((acc, transaction) => {
      if (transaction.status === 'COMPLETED') {
        return transaction.type === 'INCOME' 
          ? acc + Number(transaction.value)
          : acc - Number(transaction.value);
      }
      return acc;
    }, 0);

    if (balance < amount) {
      throw new Error('Saldo insuficiente para transferência');
    }

    // Taxa de 2% para transferência
    const fee = amount * 0.02;
    const sentAmount = amount - fee;

    // Registrar transação de transferência
    const { error } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        value: amount,
        description: 'Transferência para Bitfinex',
        type: 'TRANSFER',
        status: 'COMPLETED', // Simulando transferência instantânea
        retained_amount: fee,
        sent_amount: sentAmount,
        destination_address: 'Bitfinex Exchange',
      });

    if (error) {
      console.error('Erro ao registrar transferência:', error);
      throw new Error('Erro ao processar transferência');
    }

    return new Response(JSON.stringify({
      success: true,
      transferredAmount: amount,
      fee: fee,
      sentAmount: sentAmount,
      message: 'Transferência realizada com sucesso',
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Erro na transferência:', error);
    throw error;
  }
}