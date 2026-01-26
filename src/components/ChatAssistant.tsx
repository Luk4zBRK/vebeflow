import { FormEvent, useEffect, useRef, useState } from "react";
import { SendHorizontal, Mic, Loader2, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useSiteConfig } from "@/hooks/useSiteConfig";
import { supabase } from "@/integrations/supabase/client";

const FALLBACK_WEBHOOK = "https://n8n.verticalon.com.br/webhook/95a9e0be-09ad-403f-9cb0-3c60494576ec";

type MessageRole = "assistant" | "user" | "human_agent";

const ROLE_LABEL: Record<MessageRole, string> = {
  assistant: "Assistente",
  user: "Você",
  human_agent: "Atendente"
};

type ChatMessage = {
  id: string;
  role: MessageRole;
  content: string;
};

// Gera ou recupera o session_id do usuário
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('chat_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('chat_session_id', sessionId);
  }
  return sessionId;
};

const buildAssistantReply = async (response: Response): Promise<string> => {
  const raw = await response.text();
  if (!raw) {
    return "Não recebi uma resposta. Podemos tentar novamente?";
  }

  try {
    const data = JSON.parse(raw);
    if (typeof data === "string") {
      return data;
    }

    if (Array.isArray(data)) {
      const first = data[0];
      if (typeof first === "string") return first;
      if (typeof first === "object" && first) {
        return (
          first.reply ||
          first.response ||
          first.answer ||
          first.message ||
          first.text ||
          JSON.stringify(first)
        );
      }
    }

    if (typeof data === "object" && data) {
      return (
        data.reply ||
        data.response ||
        data.answer ||
        data.message ||
        data.text ||
        data.content ||
        JSON.stringify(data)
      );
    }
  } catch (_error) {
    // raw text
  }

  return raw;
};

const ChatAssistant = () => {
  const { toast } = useToast();
  const { getChatAssistantConfig } = useSiteConfig();
  const chatConfig = getChatAssistantConfig();
  const welcomeMessage = chatConfig?.welcome_message?.trim();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const sessionId = useRef(getSessionId());

  const webhookUrl = chatConfig?.webhook_url?.trim() || import.meta.env.VITE_N8N_CHAT_WEBHOOK || FALLBACK_WEBHOOK;
  const placeholderText = welcomeMessage || "Envie uma mensagem para a Vibe Flow...";

  // Criar ou recuperar conversa
  const getOrCreateConversation = async (): Promise<string | null> => {
    if (conversationId) return conversationId;

    try {
      // Verificar se já existe uma conversa ativa para esta sessão
      const { data: existing } = await (supabase as any)
        .from('chat_conversations')
        .select('id')
        .eq('session_id', sessionId.current)
        .eq('status', 'active')
        .single();

      if (existing?.id) {
        setConversationId(existing.id);
        return existing.id;
      }

      // Criar nova conversa
      const { data: newConv, error } = await (supabase as any)
        .from('chat_conversations')
        .insert({
          session_id: sessionId.current,
          status: 'active'
        })
        .select('id')
        .single();

      if (error) throw error;
      setConversationId(newConv.id);
      return newConv.id;
    } catch (error) {
      console.error('Erro ao criar conversa:', error);
      return null;
    }
  };

  // Salvar mensagem no banco
  const saveMessage = async (role: MessageRole, content: string) => {
    const convId = await getOrCreateConversation();
    if (!convId) return;

    try {
      await (supabase as any)
        .from('chat_messages')
        .insert({
          conversation_id: convId,
          role,
          content
        });

      // Atualizar contagem e última mensagem
      await (supabase as any)
        .from('chat_conversations')
        .update({
          last_message_at: new Date().toISOString(),
          message_count: messages.length + 1
        })
        .eq('id', convId);
    } catch (error) {
      console.error('Erro ao salvar mensagem:', error);
    }
  };

  // Escutar mensagens do atendente humano em tempo real
  useEffect(() => {
    if (!conversationId) return;

    const channel = (supabase as any)
      .channel(`chat_${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        (payload: any) => {
          const newMsg = payload.new;
          // Só adiciona se for mensagem de atendente humano (não duplicar as locais)
          if (newMsg.role === 'human_agent') {
            setMessages(prev => [...prev, {
              id: newMsg.id,
              role: 'human_agent',
              content: newMsg.content
            }]);
          }
        }
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [conversationId]);

  useEffect(() => {
    if (welcomeMessage) {
      setMessages((prev) => {
        if (prev.length === 0) {
          // Mensagem de boas-vindas não é salva no banco
          return [
            {
              id: "assistant-welcome",
              role: "assistant" as MessageRole,
              content: welcomeMessage
            }
          ];
        }

        if (prev.length === 1 && prev[0].id === "assistant-welcome") {
          if (prev[0].content === welcomeMessage) {
            return prev;
          }

          return [
            {
              ...prev[0],
              content: welcomeMessage
            }
          ];
        }

        return prev;
      });
    } else {
      setMessages((prev) =>
        prev[0]?.id === "assistant-welcome" ? prev.slice(1) : prev
      );
    }
  }, [welcomeMessage]);

  // Scroll automático sempre que mensagens mudarem
  useEffect(() => {
    const container = messagesContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isSending]);

  const appendMessage = (role: MessageRole, content: string, save: boolean = true) => {
    setMessages((prev) => [
      ...prev,
      {
        id: `${role}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        role,
        content
      }
    ]);
    // Salvar no banco (exceto mensagem de boas-vindas)
    if (save && role !== 'human_agent') {
      saveMessage(role, content);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmed = inputValue.trim();
    if (!trimmed || isSending) return;

    appendMessage("user", trimmed);
    setInputValue("");
    setIsSending(true);

    try {
      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          message: trimmed,
          source: "vibe-flow-lp",
          session_id: sessionId.current,
          conversation_id: conversationId
        })
      });

      if (!response.ok) {
        throw new Error(`Webhook retornou status ${response.status}`);
      }

      const assistantReply = await buildAssistantReply(response);
      appendMessage("assistant", assistantReply);
    } catch (error) {
      console.error(error);
      toast({
        title: "Não foi possível enviar sua mensagem",
        description: "Tente novamente ou use um dos canais de contato.",
        variant: "destructive"
      });
      appendMessage(
        "assistant",
        "Encontrei um erro ao falar com o fluxo de automação. Pode tentar novamente em instantes ou entrar em contato pelos canais tradicionais."
      );
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section
      id="chat"
      className="relative overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-background via-card to-background px-6 py-14 sm:px-12"
    >
      <div className="absolute inset-0 bg-gradient-primary opacity-10" />
      <div className="absolute inset-0 bg-[radial-gradient(600px_400px_at_15%_10%,hsl(var(--brand-violet)/0.15),transparent),radial-gradient(700px_600px_at_85%_90%,hsl(var(--brand-sky)/0.12),transparent)]" />
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-background/20 to-transparent" />

      <div className="relative mx-auto flex w-full max-w-4xl flex-col gap-8 text-center text-foreground">
        <div className="space-y-4">
          <span className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground bg-gradient-primary bg-clip-text text-transparent">
            🤖 Assistente Inteligente Vibe Flow
          </span>
          <h2 className="text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl text-foreground">
            Converse com nossa <span className="gradient-text">IA</span>
          </h2>
          <p className="mx-auto max-w-2xl text-sm text-muted-foreground sm:text-base">
            Descubra, em tempo real, como a Vibe Flow pode transformar seus resultados.
          </p>
        </div>

        <div className="relative mx-auto flex w-full max-w-3xl flex-col gap-4 rounded-[32px] border border-border bg-card/80 p-6 shadow-primary backdrop-blur glass-effect">
          <div ref={messagesContainerRef} className="flex max-h-64 flex-col gap-6 overflow-y-auto pr-1 text-left">
            {messages.map((message) => {
              const isUser = message.role === "user";
              const isHumanAgent = message.role === "human_agent";

              return (
                <div key={message.id} className={`flex items-end gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  {isUser ? (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-primary text-white shadow-sm">
                      <User className="h-5 w-5" />
                    </div>
                  ) : (
                    <div className={`flex h-10 w-10 overflow-hidden rounded-full border border-border shadow-sm ${isHumanAgent ? 'bg-green-100 dark:bg-green-900' : 'bg-card/80'}`}>
                      {isHumanAgent ? (
                        <div className="flex h-full w-full items-center justify-center">
                          <User className="h-5 w-5 text-green-700 dark:text-green-300" />
                        </div>
                      ) : (
                        <img
                          src="/Transformando ideias em soluções digitais.png"
                          alt="Vibe Flow"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  )}
                  <div className="flex max-w-[85%] flex-col gap-1">
                    <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      {ROLE_LABEL[message.role]}
                    </span>
                    <span
                      className={`inline-block whitespace-pre-wrap rounded-3xl px-5 py-3 text-sm sm:text-base leading-relaxed ${
                        isUser
                          ? "bg-gradient-primary text-white"
                          : isHumanAgent
                            ? "bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 text-foreground"
                            : "bg-secondary/50 text-foreground border border-border"
                      }`}
                    >
                      {message.content}
                    </span>
                  </div>
                </div>
              );
            })}
            {isSending && (
              <div className="flex items-end gap-3">
                <div className="flex h-10 w-10 overflow-hidden rounded-full border border-border bg-card/80 shadow-sm">
                  <img
                    src="/Transformando ideias em soluções digitais.png"
                    alt="Vibe Flow"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex max-w-[85%] flex-col gap-1">
                  <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Assistente
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-3xl bg-secondary/50 border border-border px-5 py-3 text-sm text-foreground">
                    <Loader2 className="h-4 w-4 animate-spin text-brand-violet" />
                    Digitando...
                  </span>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="group flex items-center gap-3">

            <Input
              type="text"
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={placeholderText}
              className="flex-1 border border-border bg-background/80 text-sm text-foreground sm:text-base placeholder:text-muted-foreground"
              disabled={isSending}
            />

            <Button
              type="submit"
              size="lg"
              className="h-12 rounded-full bg-gradient-primary px-6 text-white shadow-primary hover:shadow-glow transition-all duration-300"
              disabled={isSending || !inputValue.trim()}
            >
              {isSending ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <SendHorizontal className="h-5 w-5" />
              )}
            </Button>
          </form>

          <p className="text-center text-[11px] text-muted-foreground/70">
            🔒 O assistente virtual da Vibe Flow é uma ferramenta de apoio inteligente. Para decisões
            estratégicas, valide as informações com nossa equipe. ©{new Date().getFullYear()} Vibe Flow.
          </p>
        </div>
      </div>
    </section>
  );
};

export default ChatAssistant;
