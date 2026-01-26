import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Briefcase, Code2, Bot, ExternalLink, Eye } from "lucide-react";
import { usePortfolio, PortfolioItem } from "@/hooks/usePortfolio";

const Portfolio = () => {
  const { items, isLoading, fetchPublicItems, getItemsByType } = usePortfolio();
  const [selectedItem, setSelectedItem] = useState<PortfolioItem | null>(null);

  useEffect(() => {
    fetchPublicItems();
  }, [fetchPublicItems]);

  const siteItems = getItemsByType('site');
  const automationItems = getItemsByType('automation');

  const renderPortfolioCard = (item: PortfolioItem) => (
    <Card key={item.id} className="group relative overflow-hidden bg-card border border-border rounded-3xl hover:shadow-lg transition-all duration-300 card-hover">
      {/* Decorative gradient blob */}
      <div className={`absolute -top-4 -right-4 w-24 h-24 rounded-full opacity-20 blur-xl transition-all duration-300 group-hover:opacity-30 ${
        item.type === 'site' 
          ? 'bg-gradient-to-br from-blue-500 to-purple-600' 
          : 'bg-gradient-to-br from-green-500 to-teal-600'
      }`} />
      
      {/* Image */}
      {item.image_url && (
        <div className="aspect-video overflow-hidden rounded-t-3xl">
          <img 
            src={item.image_url} 
            alt={item.title}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      
      <CardHeader className="relative z-10">
        <CardTitle className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
          {item.title}
        </CardTitle>
        <CardDescription className="text-muted-foreground line-clamp-2">
          {item.description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="relative z-10">
        <div className="flex flex-wrap gap-2">
          {item.technologies.slice(0, 3).map((tech, index) => (
            <Badge key={index} variant="secondary" className="text-xs">
              {tech}
            </Badge>
          ))}
          {item.technologies.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{item.technologies.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="relative z-10 flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setSelectedItem(item)}
          className="flex items-center gap-2"
        >
          <Eye className="h-4 w-4" />
          Ver detalhes
        </Button>
        {item.url && (
          <Button
            variant="default"
            size="sm"
            asChild
            className="flex items-center gap-2"
          >
            <a href={item.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-4 w-4" />
              Acessar
            </a>
          </Button>
        )}
        {!item.url && (
          <Button
            variant="default"
            size="sm"
            disabled
            className="flex items-center gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Acessar
          </Button>
        )}
      </CardFooter>
    </Card>
  );

  const renderEmptyState = (type: string) => (
    <div className="text-center py-12">
      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">
        Nenhum {type === 'site' ? 'site' : 'automação'} disponível no momento
      </p>
    </div>
  );

  const renderLoadingState = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <div className="aspect-video bg-muted rounded-t-3xl" />
          <CardHeader>
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <div className="h-6 bg-muted rounded w-16" />
              <div className="h-6 bg-muted rounded w-20" />
              <div className="h-6 bg-muted rounded w-14" />
            </div>
          </CardContent>
          <CardFooter>
            <div className="h-8 bg-muted rounded w-24" />
          </CardFooter>
        </Card>
      ))}
    </div>
  );

  return (
    <section className="p-6 sm:p-8 bg-card border border-border rounded-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-primary/10 rounded-xl">
          <Briefcase className="h-6 w-6 text-primary" />
        </div>
        <span className="text-sm font-medium text-primary uppercase tracking-wider">
          Portfólio
        </span>
      </div>
      
      <div className="mb-8">
        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold text-foreground mb-4">
          Projetos que entregamos.
        </h2>
        <p className="text-lg text-muted-foreground max-w-2xl">
          Sites e automações desenvolvidos com excelência.
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="sites" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="sites" className="flex items-center gap-2">
            <Code2 className="h-4 w-4" />
            Sites
          </TabsTrigger>
          <TabsTrigger value="automations" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Automações
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="sites">
          {isLoading ? (
            renderLoadingState()
          ) : siteItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {siteItems.map(renderPortfolioCard)}
            </div>
          ) : (
            renderEmptyState('site')
          )}
        </TabsContent>
        
        <TabsContent value="automations">
          {isLoading ? (
            renderLoadingState()
          ) : automationItems.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {automationItems.map(renderPortfolioCard)}
            </div>
          ) : (
            renderEmptyState('automation')
          )}
        </TabsContent>
      </Tabs>

      {/* Details Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-semibold">
              {selectedItem?.title}
            </DialogTitle>
            <DialogDescription className="text-base">
              {selectedItem?.type === 'site' ? 'Website' : 'Automação'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Image */}
            {selectedItem?.image_url && (
              <div className="aspect-video overflow-hidden rounded-xl">
                <img 
                  src={selectedItem.image_url} 
                  alt={selectedItem.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            {/* Description */}
            <div>
              <h4 className="font-semibold mb-2">Descrição</h4>
              <p className="text-muted-foreground leading-relaxed">
                {selectedItem?.description}
              </p>
            </div>
            
            {/* Technologies */}
            <div>
              <h4 className="font-semibold mb-3">Tecnologias utilizadas</h4>
              <div className="flex flex-wrap gap-2">
                {selectedItem?.technologies.map((tech, index) => (
                  <Badge key={index} variant="secondary">
                    {tech}
                  </Badge>
                ))}
              </div>
            </div>
            
            {/* Link */}
            {selectedItem?.url && (
              <div className="pt-4 border-t">
                <Button asChild className="w-full">
                  <a href={selectedItem.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar projeto
                  </a>
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default Portfolio;
