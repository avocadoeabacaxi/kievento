import { drizzle } from "drizzle-orm/mysql2";
import { siteSettings } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("DATABASE_URL não configurada");
  process.exit(1);
}

const db = drizzle(DATABASE_URL);

const termsContent = `
<h2>1. Aceitação dos Termos</h2>
<p>Ao acessar e usar a plataforma KiEvento, você concorda em cumprir e estar vinculado aos seguintes termos e condições de uso. Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.</p>

<h2>2. Descrição do Serviço</h2>
<p>O KiEvento é uma plataforma de gestão de eventos que permite aos usuários criar, gerenciar e promover eventos, bem como gerenciar inscrições e participantes.</p>

<h2>3. Cadastro e Conta</h2>
<p>Para utilizar determinadas funcionalidades da plataforma, você precisará criar uma conta. Você é responsável por manter a confidencialidade de suas credenciais de acesso e por todas as atividades que ocorram em sua conta.</p>

<h2>4. Uso Aceitável</h2>
<p>Você concorda em usar a plataforma apenas para fins legais e de acordo com estes Termos. Você não deve:</p>
<ul>
  <li>Usar a plataforma de qualquer maneira que viole leis ou regulamentos aplicáveis</li>
  <li>Transmitir qualquer material que seja ofensivo, difamatório ou ilegal</li>
  <li>Tentar obter acesso não autorizado a qualquer parte da plataforma</li>
  <li>Interferir ou interromper a integridade ou desempenho da plataforma</li>
</ul>

<h2>5. Conteúdo do Usuário</h2>
<p>Você mantém todos os direitos sobre o conteúdo que criar e publicar na plataforma. Ao publicar conteúdo, você nos concede uma licença não exclusiva para usar, reproduzir e exibir esse conteúdo conforme necessário para operar a plataforma.</p>

<h2>6. Propriedade Intelectual</h2>
<p>A plataforma KiEvento e todo o seu conteúdo, recursos e funcionalidades são de propriedade da Lab485/Avocado e são protegidos por leis de direitos autorais, marcas registradas e outras leis de propriedade intelectual.</p>

<h2>7. Limitação de Responsabilidade</h2>
<p>Em nenhuma circunstância a KiEvento, seus diretores, funcionários ou afiliados serão responsáveis por quaisquer danos indiretos, incidentais, especiais, consequenciais ou punitivos resultantes do uso ou incapacidade de usar a plataforma.</p>

<h2>8. Modificações dos Termos</h2>
<p>Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos os usuários sobre mudanças significativas. O uso continuado da plataforma após tais modificações constitui sua aceitação dos novos termos.</p>

<h2>9. Lei Aplicável</h2>
<p>Estes Termos serão regidos e interpretados de acordo com as leis do Brasil, sem considerar conflitos de disposições legais.</p>

<h2>10. Contato</h2>
<p>Se você tiver dúvidas sobre estes Termos de Serviço, entre em contato conosco através da plataforma.</p>
`;

const privacyContent = `
<h2>1. Informações que Coletamos</h2>
<p>Coletamos diferentes tipos de informações para fornecer e melhorar nossos serviços:</p>

<h3>1.1 Informações Fornecidas por Você</h3>
<ul>
  <li><strong>Dados de Cadastro:</strong> nome, e-mail, telefone, CPF/CNPJ</li>
  <li><strong>Dados de Perfil:</strong> foto, endereço, data de nascimento</li>
  <li><strong>Dados de Eventos:</strong> informações sobre eventos que você cria ou participa</li>
  <li><strong>Dados de Inscrição:</strong> respostas a formulários de inscrição em eventos</li>
</ul>

<h3>1.2 Informações Coletadas Automaticamente</h3>
<ul>
  <li><strong>Dados de Uso:</strong> páginas visitadas, tempo de navegação, cliques</li>
  <li><strong>Dados Técnicos:</strong> endereço IP, tipo de navegador, sistema operacional</li>
  <li><strong>Cookies:</strong> utilizamos cookies para melhorar sua experiência</li>
</ul>

<h2>2. Como Usamos Suas Informações</h2>
<p>Utilizamos as informações coletadas para:</p>
<ul>
  <li>Fornecer, operar e manter nossa plataforma</li>
  <li>Processar inscrições em eventos e gerenciar participantes</li>
  <li>Enviar notificações sobre eventos e atualizações importantes</li>
  <li>Melhorar, personalizar e expandir nossos serviços</li>
  <li>Entender e analisar como você usa nossa plataforma</li>
  <li>Desenvolver novos produtos, serviços e funcionalidades</li>
  <li>Comunicar com você sobre atualizações e ofertas</li>
  <li>Prevenir fraudes e garantir a segurança da plataforma</li>
</ul>

<h2>3. Compartilhamento de Informações</h2>
<p>Não vendemos suas informações pessoais. Podemos compartilhar suas informações nas seguintes situações:</p>
<ul>
  <li><strong>Com Organizadores de Eventos:</strong> quando você se inscreve em um evento, suas informações são compartilhadas com o organizador</li>
  <li><strong>Com Prestadores de Serviços:</strong> compartilhamos com empresas que nos ajudam a operar a plataforma (hospedagem, análise, e-mail)</li>
  <li><strong>Por Exigência Legal:</strong> quando necessário para cumprir obrigações legais ou proteger direitos</li>
</ul>

<h2>4. Segurança dos Dados</h2>
<p>Implementamos medidas de segurança técnicas e organizacionais apropriadas para proteger suas informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição.</p>

<h2>5. Seus Direitos</h2>
<p>De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:</p>
<ul>
  <li>Acessar seus dados pessoais</li>
  <li>Corrigir dados incompletos, inexatos ou desatualizados</li>
  <li>Solicitar a exclusão de seus dados</li>
  <li>Solicitar a portabilidade de seus dados</li>
  <li>Revogar o consentimento para tratamento de dados</li>
  <li>Opor-se ao tratamento de seus dados</li>
</ul>

<h2>6. Retenção de Dados</h2>
<p>Mantemos suas informações pessoais pelo tempo necessário para cumprir os propósitos descritos nesta política, a menos que um período de retenção mais longo seja exigido ou permitido por lei.</p>

<h2>7. Cookies</h2>
<p>Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, analisar o uso da plataforma e personalizar conteúdo. Você pode controlar o uso de cookies através das configurações do seu navegador.</p>

<h2>8. Alterações nesta Política</h2>
<p>Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças significativas através da plataforma ou por e-mail.</p>

<h2>9. Contato</h2>
<p>Se você tiver dúvidas sobre esta Política de Privacidade ou sobre o tratamento de seus dados pessoais, entre em contato conosco através da plataforma.</p>

<h2>10. Encarregado de Dados (DPO)</h2>
<p>Para questões relacionadas à proteção de dados, você pode entrar em contato com nosso Encarregado de Proteção de Dados através da plataforma.</p>
`;

async function seedLegalPages() {
  console.log("Inserindo conteúdo padrão para páginas legais...");

  try {
    // Inserir ou atualizar Termos de Serviço
    const existingTerms = await db.select().from(siteSettings).where(eq(siteSettings.key, "terms_of_service"));
    
    if (existingTerms.length > 0) {
      await db.update(siteSettings)
        .set({ value: termsContent, updatedAt: new Date() })
        .where(eq(siteSettings.key, "terms_of_service"));
      console.log("✓ Termos de Serviço atualizados");
    } else {
      await db.insert(siteSettings).values({
        key: "terms_of_service",
        value: termsContent,
      });
      console.log("✓ Termos de Serviço criados");
    }

    // Inserir ou atualizar Política de Privacidade
    const existingPrivacy = await db.select().from(siteSettings).where(eq(siteSettings.key, "privacy_policy"));
    
    if (existingPrivacy.length > 0) {
      await db.update(siteSettings)
        .set({ value: privacyContent, updatedAt: new Date() })
        .where(eq(siteSettings.key, "privacy_policy"));
      console.log("✓ Política de Privacidade atualizada");
    } else {
      await db.insert(siteSettings).values({
        key: "privacy_policy",
        value: privacyContent,
      });
      console.log("✓ Política de Privacidade criada");
    }

    console.log("\n✅ Conteúdo padrão inserido com sucesso!");
    console.log("Acesse /termos e /privacidade para visualizar as páginas.");
    
  } catch (error) {
    console.error("❌ Erro ao inserir conteúdo:", error);
    process.exit(1);
  }

  process.exit(0);
}

seedLegalPages();
