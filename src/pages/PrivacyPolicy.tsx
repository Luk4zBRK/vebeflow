import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 py-12">
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para o início
        </Link>

        <div className="bg-card border border-border rounded-3xl p-8 sm:p-12">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2">
            Política de Privacidade
          </h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Introdução</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Vibe Flow está comprometida em proteger sua privacidade. Esta Política de Privacidade explica 
                como coletamos, usamos, armazenamos e protegemos suas informações pessoais quando você utiliza 
                nossos serviços e acessa nosso site.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Esta política está em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018) 
                e demais legislações aplicáveis.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Dados que Coletamos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos coletar os seguintes tipos de informações:
              </p>
              
              <h3 className="text-lg font-medium mt-4 mb-2">2.1 Dados fornecidos por você:</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Número de telefone</li>
                <li>Informações da empresa (quando aplicável)</li>
                <li>Mensagens enviadas através do formulário de contato</li>
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">2.2 Dados coletados automaticamente:</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-2">
                <li>Endereço IP</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Páginas visitadas e tempo de permanência</li>
                <li>Data e hora de acesso</li>
                <li>Cookies e tecnologias similares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Como Utilizamos seus Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos suas informações para as seguintes finalidades:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>Responder suas solicitações e fornecer suporte</li>
                <li>Elaborar propostas comerciais e contratos</li>
                <li>Prestar os serviços contratados</li>
                <li>Enviar comunicações sobre nossos serviços (com seu consentimento)</li>
                <li>Melhorar nosso site e serviços</li>
                <li>Cumprir obrigações legais e regulatórias</li>
                <li>Proteger nossos direitos e prevenir fraudes</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Base Legal para Tratamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                O tratamento de seus dados pessoais é realizado com base nas seguintes hipóteses legais 
                previstas na LGPD:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li><strong>Consentimento:</strong> quando você autoriza expressamente</li>
                <li><strong>Execução de contrato:</strong> para prestação dos serviços contratados</li>
                <li><strong>Legítimo interesse:</strong> para melhorias e comunicações relevantes</li>
                <li><strong>Cumprimento de obrigação legal:</strong> quando exigido por lei</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Compartilhamento de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Não vendemos, alugamos ou compartilhamos suas informações pessoais com terceiros para 
                fins de marketing. Podemos compartilhar seus dados apenas nas seguintes situações:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>Com prestadores de serviços essenciais (hospedagem, e-mail, etc.)</li>
                <li>Para cumprir obrigações legais ou ordens judiciais</li>
                <li>Para proteger nossos direitos, propriedade ou segurança</li>
                <li>Com seu consentimento expresso</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Cookies e Tecnologias de Rastreamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Utilizamos cookies e tecnologias similares para:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>Manter você conectado durante sua sessão</li>
                <li>Lembrar suas preferências</li>
                <li>Analisar o uso do site e melhorar sua experiência</li>
                <li>Medir a eficácia de nossas comunicações</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Você pode configurar seu navegador para recusar cookies, mas isso pode afetar 
                algumas funcionalidades do site.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Segurança dos Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas e organizacionais apropriadas para proteger suas 
                informações pessoais contra acesso não autorizado, alteração, divulgação ou destruição. 
                Isso inclui:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>Criptografia de dados em trânsito (SSL/TLS)</li>
                <li>Controle de acesso restrito</li>
                <li>Monitoramento de segurança</li>
                <li>Backups regulares</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Retenção de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Mantemos suas informações pessoais apenas pelo tempo necessário para cumprir as 
                finalidades para as quais foram coletadas, incluindo obrigações legais, contratuais 
                e regulatórias. Após esse período, os dados serão excluídos ou anonimizados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Seus Direitos (LGPD)</h2>
              <p className="text-muted-foreground leading-relaxed">
                De acordo com a LGPD, você tem os seguintes direitos em relação aos seus dados pessoais:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li><strong>Confirmação e acesso:</strong> saber se tratamos seus dados e acessá-los</li>
                <li><strong>Correção:</strong> solicitar a correção de dados incompletos ou desatualizados</li>
                <li><strong>Anonimização ou eliminação:</strong> solicitar a exclusão de dados desnecessários</li>
                <li><strong>Portabilidade:</strong> receber seus dados em formato estruturado</li>
                <li><strong>Informação:</strong> saber com quem compartilhamos seus dados</li>
                <li><strong>Revogação:</strong> retirar seu consentimento a qualquer momento</li>
                <li><strong>Oposição:</strong> opor-se ao tratamento em determinadas situações</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Para exercer seus direitos, entre em contato conosco através dos canais indicados abaixo.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Menores de Idade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Nossos serviços não são direcionados a menores de 18 anos. Não coletamos intencionalmente 
                informações de menores. Se tomarmos conhecimento de que coletamos dados de um menor, 
                tomaremos medidas para excluí-los.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">11. Alterações nesta Política</h2>
              <p className="text-muted-foreground leading-relaxed">
                Podemos atualizar esta Política de Privacidade periodicamente. Quaisquer alterações 
                serão publicadas nesta página com a data de atualização. Recomendamos que você revise 
                esta política regularmente.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">12. Contato e Encarregado de Dados</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre esta Política de Privacidade ou para exercer seus direitos, 
                entre em contato conosco:
              </p>
              <ul className="list-none text-muted-foreground mt-3 space-y-1">
                <li><strong>E-mail:</strong> contato@vibeflow.site</li>
                <li><strong>Site:</strong> vibeflow.site</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Responderemos sua solicitação no prazo de 15 dias, conforme previsto na LGPD.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
