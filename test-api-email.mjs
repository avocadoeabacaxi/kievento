// Testar a API de reenvio de convite diretamente
const url = 'http://localhost:3000/api/trpc/registrations.resendInvite';

async function testResendInvite() {
  console.log('Testando API de reenvio de convite...');
  
  const body = JSON.stringify({
    json: {
      registrationId: 1
    }
  });
  
  console.log('Body:', body);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': '' // Precisa de autenticação
      },
      body
    });
    
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (error) {
    console.error('Erro:', error);
  }
}

testResendInvite();
