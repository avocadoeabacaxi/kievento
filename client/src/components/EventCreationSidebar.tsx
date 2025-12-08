import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string;
  title: string;
  completed: boolean;
}

interface EventCreationSidebarProps {
  steps: Step[];
  currentStepId: string;
  onStepClick: (stepId: string) => void;
  completedSteps: Set<string>;
}

export default function EventCreationSidebar({
  steps,
  currentStepId,
  onStepClick,
  completedSteps,
}: EventCreationSidebarProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);
  const progress = ((completedSteps.size / steps.length) * 100).toFixed(0);

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Criar Evento</h2>
        <p className="text-sm text-gray-500 mt-1">
          Preencha as informações do seu evento
        </p>
      </div>

      {/* Progress Bar */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-gray-600">Progresso</span>
          <span className="text-xs font-bold text-primary">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-1">
          {steps.map((step, index) => {
            const isCurrent = step.id === currentStepId;
            const isPast = index < currentIndex;
            const isCompleted = completedSteps.has(step.id);

            return (
              <li key={step.id}>
                <button
                  onClick={() => onStepClick(step.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                    isCurrent && "bg-primary/10 border-l-4 border-primary",
                    !isCurrent && "hover:bg-gray-50",
                    (isPast || isCompleted) && !isCurrent && "text-gray-600"
                  )}
                >
                  {/* Step Number or Check */}
                  <div
                    className={cn(
                      "flex items-center justify-center w-8 h-8 rounded-full text-sm font-semibold flex-shrink-0",
                      isCurrent && "bg-primary text-white",
                      isCompleted && !isCurrent && "bg-green-500 text-white",
                      !isCurrent && !isCompleted && "bg-gray-200 text-gray-600"
                    )}
                  >
                    {isCompleted ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span>{index + 1}</span>
                    )}
                  </div>

                  {/* Step Title */}
                  <span
                    className={cn(
                      "text-sm font-medium",
                      isCurrent && "text-primary font-semibold",
                      !isCurrent && "text-gray-700"
                    )}
                  >
                    {step.title}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-500 text-center">
          Etapa {currentIndex + 1} de {steps.length}
        </p>
      </div>
    </div>
  );
}
