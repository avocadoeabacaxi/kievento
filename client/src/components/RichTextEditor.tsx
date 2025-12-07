import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon, Image as ImageIcon } from "lucide-react";
import parse from "html-react-parser";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  const insertTag = (openTag: string, closeTag: string, placeholder: string = "") => {
    const textarea = document.querySelector('textarea[data-rich-editor="true"]') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textToInsert = selectedText || placeholder;
    
    const newValue = 
      value.substring(0, start) + 
      openTag + textToInsert + closeTag + 
      value.substring(end);
    
    onChange(newValue);

    // Restaurar foco e seleção
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + openTag.length + textToInsert.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const toolbarButtons = [
    {
      icon: Bold,
      label: "Negrito",
      action: () => insertTag("<strong>", "</strong>", "texto em negrito"),
    },
    {
      icon: Italic,
      label: "Itálico",
      action: () => insertTag("<em>", "</em>", "texto em itálico"),
    },
    {
      icon: List,
      label: "Lista",
      action: () => insertTag("<ul>\n  <li>", "</li>\n</ul>", "item da lista"),
    },
    {
      icon: ListOrdered,
      label: "Lista Numerada",
      action: () => insertTag("<ol>\n  <li>", "</li>\n</ol>", "item da lista"),
    },
    {
      icon: LinkIcon,
      label: "Link",
      action: () => {
        const url = prompt("Digite a URL:");
        if (url) {
          insertTag(`<a href="${url}" target="_blank">`, "</a>", "texto do link");
        }
      },
    },
    {
      icon: ImageIcon,
      label: "Imagem",
      action: () => {
        const url = prompt("Digite a URL da imagem:");
        if (url) {
          insertTag(`<img src="${url}" alt="`, '" class="max-w-full h-auto rounded-lg my-4" />', "descrição da imagem");
        }
      },
    },
  ];

  return (
    <div className="border rounded-lg overflow-hidden">
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "edit" | "preview")}>
        <div className="border-b bg-muted/30 p-2">
          <div className="flex items-center justify-between">
            <div className="flex gap-1">
              {toolbarButtons.map((button, idx) => (
                <Button
                  key={idx}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={button.action}
                  title={button.label}
                  className="h-8 w-8 p-0"
                >
                  <button.icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
            <TabsList className="h-8">
              <TabsTrigger value="edit" className="text-xs">Editar</TabsTrigger>
              <TabsTrigger value="preview" className="text-xs">Visualizar</TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="edit" className="m-0 p-0">
          <Textarea
            data-rich-editor="true"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "Digite aqui... Você pode usar HTML"}
            className="min-h-[300px] border-0 rounded-none focus-visible:ring-0 font-mono text-sm"
          />
        </TabsContent>

        <TabsContent value="preview" className="m-0 p-4 min-h-[300px]">
          {value ? (
            <div className="prose prose-sm max-w-none dark:prose-invert">
              {parse(value)}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">Nada para visualizar ainda...</p>
          )}
        </TabsContent>
      </Tabs>

      <div className="border-t bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
        <p>
          💡 <strong>Dica:</strong> Você pode usar tags HTML diretamente. Selecione o texto e clique nos botões acima para formatar.
        </p>
      </div>
    </div>
  );
}
