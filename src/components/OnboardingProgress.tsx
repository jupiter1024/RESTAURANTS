import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface OnboardingProgressProps {
  steps: Step[];
  currentStep: number;
}

export const OnboardingProgress: React.FC<OnboardingProgressProps> = ({ steps, currentStep }) => {
  return (
    <div className="flex items-center justify-center gap-0 max-w-2xl mx-auto">
      {steps.map((step, idx) => {
        const isCompleted = currentStep > step.id;
        const isActive = currentStep === step.id;
        const isLast = idx === steps.length - 1;

        return (
          <React.Fragment key={step.id}>
            <div className="flex flex-col items-center min-w-[4rem]">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : isActive
                      ? 'bg-zinc-900 text-white ring-4 ring-zinc-100'
                      : 'bg-zinc-100 text-zinc-400 border border-zinc-200'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <span
                className={`text-[11px] font-medium mt-2 text-center leading-tight ${
                  isActive ? 'text-zinc-900' : isCompleted ? 'text-emerald-600' : 'text-zinc-400'
                }`}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={`flex-1 h-px max-w-12 sm:max-w-20 mb-5 transition-colors ${
                  currentStep > step.id ? 'bg-emerald-500' : 'bg-zinc-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};
