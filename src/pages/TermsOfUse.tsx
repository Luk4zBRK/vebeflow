import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const TermsOfUse = () => {
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
            Termos de Uso
          </h1>
          <p className="text-muted-foreground mb-8">
            Última atualização: {new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>

          <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">1. Aceitação dos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ao acessar e utilizar os serviços da Vibe Flow, você concorda em cumprir e estar vinculado a estes Termos de Uso. 
                Se você não concordar com qualquer parte destes termos, não deverá utilizar nossos serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">2. Descrição dos Serviços</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Vibe Flow oferece serviços de desenvolvimento de software, incluindo, mas não limitado a:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>Desenvolvimento de sites e aplicações web</li>
                <li>Desenvolvimento de aplicativos móveis</li>
                <li>Consultoria em tecnologia</li>
                <li>Manutenção e suporte técnico</li>
                <li>Integração de sistemas e APIs</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">3. Uso Aceitável</h2>
              <p className="text-muted-foreground leading-relaxed">
                Você concorda em utilizar nossos serviços apenas para fins legais e de acordo com estes Termos. 
                Você não deve:
              </p>
              <ul className="list-disc list-inside text-muted-foreground mt-3 space-y-2">
                <li>Violar qualquer lei ou regulamento aplicável</li>
                <li>Infringir direitos de propriedade intelectual de terceiros</li>
                <li>Transmitir conteúdo malicioso, difamatório ou ilegal</li>
                <li>Tentar acessar sistemas ou dados sem autorização</li>
                <li>Interferir no funcionamento adequado dos serviços</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">4. Propriedade Intelectual</h2>
              <p className="text-muted-foreground leading-relaxed">
                Todo o conteúdo, design, código-fonte, marcas e materiais disponibilizados pela Vibe Flow são de 
                propriedade exclusiva da empresa ou de seus licenciadores. É proibida a reprodução, distribuição 
                ou modificação sem autorização prévia por escrito.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Os projetos desenvolvidos para clientes terão sua propriedade intelectual transferida conforme 
                acordado em contrato específico de prestação de serviços.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">5. Pagamentos e Faturamento</h2>
              <p className="text-muted-foreground leading-relaxed">
                Os valores, prazos e condições de pagamento serão definidos em proposta comercial ou contrato 
                específico para cada projeto. O não pagamento nas datas acordadas pode resultar na suspensão 
                dos serviços e aplicação de multas contratuais.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">6. Limitação de Responsabilidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Vibe Flow não será responsável por danos indiretos, incidentais, especiais ou consequenciais 
                resultantes do uso ou impossibilidade de uso dos serviços. Nossa responsabilidade total está 
                limitada ao valor pago pelos serviços nos últimos 12 meses.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">7. Confidencialidade</h2>
              <p className="text-muted-foreground leading-relaxed">
                Ambas as partes concordam em manter confidenciais todas as informações proprietárias ou 
                confidenciais compartilhadas durante a prestação dos serviços, exceto quando exigido por lei 
                ou com consentimento prévio por escrito.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">8. Rescisão</h2>
              <p className="text-muted-foreground leading-relaxed">
                Qualquer parte pode rescindir a relação comercial mediante aviso prévio conforme estabelecido 
                em contrato. A rescisão não afeta obrigações já assumidas, incluindo pagamentos devidos por 
                serviços já prestados.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">9. Alterações nos Termos</h2>
              <p className="text-muted-foreground leading-relaxed">
                A Vibe Flow reserva-se o direito de modificar estes Termos de Uso a qualquer momento. 
                As alterações entrarão em vigor imediatamente após sua publicação nesta página. 
                O uso continuado dos serviços após as alterações constitui aceitação dos novos termos.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">10. Lei Aplicável e Foro</h2>
              <p className="text-muted-foreground leading-relaxed">
                Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. 
                Fica eleito o foro da comarca de São Paulo/SP para dirimir quaisquer controvérsias 
                decorrentes destes termos, com renúncia expressa a qualquer outro, por mais privilegiado que seja.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4">11. Contato</h2>
              <p className="text-muted-foreground leading-relaxed">
                Para dúvidas sobre estes Termos de Uso, entre em contato conosco:
              </p>
              <ul className="list-none text-muted-foreground mt-3 space-y-1">
                <li><strong>E-mail:</strong> contato@vibeflow.site</li>
                <li><strong>Site:</strong> vibeflow.site</li>
              </ul>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfUse;
