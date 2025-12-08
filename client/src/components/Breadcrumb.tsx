import { Link } from "wouter";
import { ChevronRight, Home } from "lucide-react";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  return (
    <nav className="flex items-center space-x-2 text-sm mb-6 py-3 px-4 bg-muted/30 rounded-lg border border-border/50">
      <Link href="/dashboard">
        <a className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Home className="h-4 w-4" />
          <span>Início</span>
        </a>
      </Link>
      
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center space-x-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
            
            {item.href && !isLast ? (
              <Link href={item.href}>
                <a className="text-muted-foreground hover:text-foreground transition-colors">
                  {item.label}
                </a>
              </Link>
            ) : (
              <span className={isLast ? "font-medium text-foreground" : "text-muted-foreground"}>
                {item.label}
              </span>
            )}
          </div>
        );
      })}
    </nav>
  );
}
