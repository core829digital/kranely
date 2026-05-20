import React from 'react';
import { Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function InfoTooltip({ content }) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#2D3B35]/10 hover:bg-[#2D3B35]/20 transition-colors ml-1">
            <Info size={10} className="text-[#2D3B35]" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs bg-[#2D3B35] text-white text-xs px-3 py-2 rounded-lg shadow-xl"
        >
          {content}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}