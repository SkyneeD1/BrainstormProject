import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Favorabilidade } from "@shared/schema";

interface JudgeAvatarProps {
  nome: string;
  favorabilidade: Favorabilidade;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const sizeMap = {
  sm: { width: 32, height: 32 },
  md: { width: 48, height: 48 },
  lg: { width: 64, height: 64 },
};

export function JudgeAvatar({ nome, favorabilidade, size = "md", showTooltip = true }: JudgeAvatarProps) {
  const favoravelPercent = favorabilidade.percentualFavoravel;
  const dimensions = sizeMap[size];
  const gradientId = `judge-fill-${nome.replace(/\s+/g, "-")}-${Math.random().toString(36).substr(2, 9)}`;

  const avatarContent = (
    <div 
      className="relative flex items-center justify-center"
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <svg 
        viewBox="0 0 100 100" 
        width={dimensions.width} 
        height={dimensions.height}
        className="drop-shadow-sm"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset={`${favoravelPercent}%`} stopColor="#22c55e" />
            <stop offset={`${favoravelPercent}%`} stopColor="#ef4444" />
          </linearGradient>
          <clipPath id={`judge-clip-${gradientId}`}>
            <path d="
              M50 8
              C35 8 28 15 25 22
              C22 29 20 32 15 35
              C10 38 8 42 10 46
              C12 50 18 52 22 52
              C20 55 18 58 18 62
              L18 68
              C18 72 22 76 28 78
              L28 85
              L22 88
              C18 90 16 94 18 98
              L82 98
              C84 94 82 90 78 88
              L72 85
              L72 78
              C78 76 82 72 82 68
              L82 62
              C82 58 80 55 78 52
              C82 52 88 50 90 46
              C92 42 90 38 85 35
              C80 32 78 29 75 22
              C72 15 65 8 50 8
              Z
            " />
          </clipPath>
        </defs>
        
        <rect 
          x="0" 
          y="0" 
          width="100" 
          height="100" 
          fill={`url(#${gradientId})`}
          clipPath={`url(#judge-clip-${gradientId})`}
        />
        
        <path
          d="
            M50 8
            C35 8 28 15 25 22
            C22 29 20 32 15 35
            C10 38 8 42 10 46
            C12 50 18 52 22 52
            C20 55 18 58 18 62
            L18 68
            C18 72 22 76 28 78
            L28 85
            L22 88
            C18 90 16 94 18 98
            L82 98
            C84 94 82 90 78 88
            L72 85
            L72 78
            C78 76 82 72 82 68
            L82 62
            C82 58 80 55 78 52
            C82 52 88 50 90 46
            C92 42 90 38 85 35
            C80 32 78 29 75 22
            C72 15 65 8 50 8
            Z
          "
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-foreground/70"
        />
        
        <ellipse cx="50" cy="58" rx="18" ry="20" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-foreground/50" />
        
        <path
          d="M32 72 Q35 80 40 82 L40 90 L60 90 L60 82 Q65 80 68 72"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-foreground/50"
        />
      </svg>
    </div>
  );

  if (!showTooltip) {
    return avatarContent;
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {avatarContent}
      </TooltipTrigger>
      <TooltipContent className="p-3">
        <div className="space-y-2">
          <p className="font-medium">{nome}</p>
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-green-500" />
              <span>Favorável: {favoravelPercent}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
              <span>Desfavorável: {favorabilidade.percentualDesfavoravel}%</span>
            </div>
            <div className="text-muted-foreground pt-1">
              Total: {favorabilidade.totalJulgamentos} julgamentos
            </div>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}

interface FavorabilidadeBarProps {
  favorabilidade: Favorabilidade;
  showLabels?: boolean;
  height?: "sm" | "md" | "lg";
}

const barHeights = {
  sm: "h-2",
  md: "h-3",
  lg: "h-4",
};

export function FavorabilidadeBar({ favorabilidade, showLabels = true, height = "md" }: FavorabilidadeBarProps) {
  const { percentualFavoravel, percentualDesfavoravel, totalJulgamentos, favoraveis, desfavoraveis, parciais } = favorabilidade;

  if (totalJulgamentos === 0) {
    return (
      <div className="space-y-1">
        <div className={`${barHeights[height]} bg-muted rounded-full overflow-hidden w-full`}>
          <div className="h-full w-full bg-muted-foreground/20" />
        </div>
        {showLabels && (
          <p className="text-xs text-muted-foreground text-center">Sem julgamentos</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div className={`${barHeights[height]} bg-muted rounded-full overflow-hidden flex w-full`}>
        <div
          className="h-full bg-green-500 transition-all"
          style={{ width: `${percentualFavoravel}%` }}
        />
        <div
          className="h-full bg-red-500 transition-all"
          style={{ width: `${percentualDesfavoravel}%` }}
        />
      </div>
      {showLabels && (
        <div className="flex justify-between text-xs text-muted-foreground">
          <span className="text-green-600 dark:text-green-400">{favoraveis}F / {parciais}P</span>
          <span className="text-red-600 dark:text-red-400">{desfavoraveis}D</span>
        </div>
      )}
    </div>
  );
}

interface FavorabilidadeBadgeProps {
  percentual: number;
  variant?: "default" | "compact";
}

export function FavorabilidadeBadge({ percentual, variant = "default" }: FavorabilidadeBadgeProps) {
  const getColor = () => {
    if (percentual >= 70) return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    if (percentual >= 50) return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  };

  if (variant === "compact") {
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getColor()}`}>
        {percentual}%
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-sm font-medium ${getColor()}`}>
      {percentual}% Favorável
    </span>
  );
}
