import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Favorabilidade } from "@shared/schema";

interface JudgeAvatarProps {
  nome: string;
  favorabilidade: Favorabilidade;
  size?: "sm" | "md" | "lg";
  showTooltip?: boolean;
}

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-base",
};

const ringClasses = {
  sm: "h-10 w-10",
  md: "h-14 w-14",
  lg: "h-20 w-20",
};

export function JudgeAvatar({ nome, favorabilidade, size = "md", showTooltip = true }: JudgeAvatarProps) {
  const initials = nome
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const favoravelPercent = favorabilidade.percentualFavoravel;
  const desfavoravelPercent = favorabilidade.percentualDesfavoravel;

  const gradientId = `gradient-${nome.replace(/\s+/g, "-")}-${Math.random().toString(36).substr(2, 9)}`;

  const avatarContent = (
    <div className="relative flex items-center justify-center">
      <svg className={`absolute ${ringClasses[size]}`} viewBox="0 0 100 100">
        <defs>
          <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="50" x2="100" y2="50">
            <stop offset={`${favoravelPercent}%`} stopColor="hsl(142, 71%, 45%)" />
            <stop offset={`${favoravelPercent}%`} stopColor="hsl(0, 84%, 60%)" />
          </linearGradient>
        </defs>
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="6"
          strokeLinecap="round"
          transform="rotate(-90 50 50)"
          style={{
            strokeDasharray: "289",
            strokeDashoffset: "0",
          }}
        />
      </svg>
      <Avatar className={`${sizeClasses[size]} border-2 border-background`}>
        <AvatarFallback className="bg-muted text-muted-foreground font-medium">
          {initials}
        </AvatarFallback>
      </Avatar>
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
              <span>Desfavorável: {desfavoravelPercent}%</span>
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
