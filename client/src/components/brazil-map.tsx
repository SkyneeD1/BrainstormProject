import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, TrendingUp, TrendingDown, Users, Building2 } from "lucide-react";

interface EstadoData {
  uf: string;
  estado: string;
  trtCodigo: string;
  trtNome: string;
  regiao: string;
  totalDecisoes: number;
  favoraveis: number;
  desfavoraveis: number;
  percentualFavoravel: number;
  totalComarcas: number;
  totalRelatores: number;
}

interface BrazilMapProps {
  estados: EstadoData[];
  onSelectEstado: (uf: string, estado: string) => void;
  selectedUF?: string | null;
  tenantColor?: string;
}

const BRAZIL_STATES: Record<string, { path: string; labelX: number; labelY: number }> = {
  AC: {
    path: "M99.8,363.2l-0.5-11.2l-7.5-6.5l-2.9-0.6l-0.5-2.1l-4.4-1.9l-0.8-2.7l-5.7-5.9l2.5-3.3l-0.6-4.2l6.9-0.6l1.4-4.6l-0.2-2.9l10.5-0.8l1.9,3.7l4.9,4.2l1.9,0.5l0.6,3.3l5.2,1l3.3-2.5l1.1-0.3l0.7,0.9l1.3-0.1l0.3,0.6l2,0.3l1,1.9l3.8,0.1l0.6,1.9l1.7,0.6l2.6-0.5l0.9,3.1l2.4,2.5l-0.9,4.5l-1,1.3l-0.2,4.1l-2.6,3l-8.1,2.5l-5.1-1.5l-3.9,0.2l-2.9-0.9l-0.5,1.1l-3-1.1l-5.2,3.7l-2.3,0.1l-0.7,1.8Z",
    labelX: 85, labelY: 345
  },
  AM: {
    path: "M249.1,278l-0.3-3.7l-12.7-9.7l-5.7-0.5l-1.4-7.7l-10.4-2.9l-2.7-6.1l-6.7,0.2l-3.2,4.6l-12.4-0.1l-2.2-7.5l-2.9-1.8l0.9-6.7l-2.5-4.5l-4.2-0.4l-5.9-10.5l-1.2-5.4l-4.4-1.3l0.2-7.4l-2.2-5.9l-3.9-1.5l-0.3-2.3l-2.4-0.5l0.2-2.1l-3.8-2.9l-4.9-1l-4.6,1.3l-2.5,4.4l-2.7-0.7l-0.9,1.7l-5.5-0.2l-2.4-6.9l-5-5.5l0.4-3.6l-1.9-5.2l0.4-3.7l-0.8-1.5l0.5-2.8l-1.4-4.7l-5.1-0.3l-1.1-1.9l-4.7,0.9l-2.7,3.9l-7,2.3l-3.7,4.2l-8.7,0.6l-5.2,1.5l-2.7-0.9l0.6,1.9l-3.5,1.6l-1.7,3.4l1.3,1.7l-0.7,4.1l0.5,1.4l-1.2,2.9l-3.2,1.2l-0.9,2.8l2.2,1.9l0.1,1.6l3.1,0.6l0.9,1.7l-0.5,2l1.6,0.9l0.1,2.2l3.1,1.5l0.9,3l-0.7,2.5l2.7,0.3l1.3-0.9l3.9,2.6l1.6-0.5l3.2,1.7l0.3,2.5l2.2,0.1l0.5,1.4l6.9,0.9l2-0.8l0.7,1.1l7.5-0.1l2.3,1.8l2.9-0.1l2.1,1.2l0.4,3l1.9,0.9l0.3,2.9l2.9,3.7l6.7,3.6l3.8,4.7l2.7,0.3l1.9-1.6l4.7,0.7l2.2-0.5l4.9,2.8l7.9,0.1l4.9,0.9l6.9,4.9l8.5,1.9l3.4,3.9l5.1,3.1l0.4,2.9l1.4,1.5l-0.2,2.7l1.7,4.2l0,2.9l0.9,1.1l-0.3,2.1l2.5,4.5l0.1,6.4l5.5,5.9l0.7,2.2l6.6,0.9l1.7,2.4l5.1-0.2l3.9,2.7l5.3-4.6l3.3,0.7l1.2-0.9l6.8,0.3l2.4,1.4l0.4-0.6l3.9,0.6l3.9-2.7l6.9-1l1.1-3.2l7.4-7.8l0.9-4.9l-1.7-4.7l0.5-4.3l-1.4-0.8l0.6-3.4l-2.8-4.9Z",
    labelX: 150, labelY: 235
  },
  AP: {
    path: "M303,179.2l1.1-4.5l-4.9-0.2l-0.9-2.5l-5.9-1.2l0-3l-1.6-3.9l1.9-2.5l-0.8-1.3l3.5-3.1l3.3,0.3l0.9-0.9l3.6,0.9l0.8-1.7l2.1,0.3l2.1-5.7l2.1,0.3l1.7,2.9l0.3,3.6l2.2,2.9l-0.5,1.9l2.6,3.6l-0.5,2.7l-1.7,1l-0.3,3.8l-4.9,5.1l-4.9,1.5Z",
    labelX: 305, labelY: 163
  },
  BA: {
    path: "M404.3,366.9l-3.1-0.5l-2.5-3.5l-2.1-0.5l-3.2,2.7l-3.4-0.6l-2.7-2.6l-2.9,0.9l-1.7,6.8l-3.9,0.5l-4.3-0.8l-2.4,0.7l-3.9-0.4l-0.9-2.5l-2.7-1.4l-3.7,0.7l-2.3-3.2l-0.1-2.5l-3.7,0.3l-0.9-0.9l-1.7,1.1l-2.3-0.3l-0.5-2.2l-5.2-2l-4.1-0.1l-1.7-5.2l-2.9-2.7l-0.5-3.9l-2.1-1.7l-0.3-6.7l4.9-0.7l-0.1-12.2l5.1-0.5l18.8-3.3l3.9,0.7l2.6-4.7l1-6.2l2.9-3.6l0.2-4.6l3.5-2.2l-0.5-5.7l1.3-4.5l-0.3-6l3.2-6.9l4.5-4.6l0.6-2l6.7-2.5l4.9,0.9l3.3,2.5l2.3-0.5l3.9,1.9l7.4,0.5l6.6-3.7l3.6,0.8l0.7,1.9l5.4,1.2l2.5,3l-1.5,3.1l0.9,3.5l2.5-0.1l3.6,3.2l0.1,2.9l-2.2,5l0.4,6.3l-0.8,4.5l1.9,3.3l-0.5,2.9l0.7,3.4l4.9,4.9l-0.5,2.4l1.3,4.7l0.2,5.5l-0.7,3.5l-1.2,0.8l0.3,2.8l-2.5,1.8l-0.2,1.4l-2.4,0.2l-4.9,4.6l-1.1-0.3l-5.5,5.7l-3.2,0l-1.2,2.4l1.9,5.2l-0.2,3.9l-6.7,7l-2.2-0.5l-0.3,1.5l-2.2,0.3l-3,3.9l-1.5,0Z",
    labelX: 383, labelY: 327
  },
  CE: {
    path: "M420.6,262.2l-2.2-0.5l-2.3,1.2l-2-3.7l-5.9-4.1l-2.6-4.7l0.5-7.7l-3.2-5.9l0.3-2.7l1.5-1.7l-1.7-2.5l1.2-7.9l1.9-0.7l0.3-1.9l4.5-4.5l3.7-0.2l4.9,2.5l2.5-1.5l3.1,0.2l4.7,4.2l2.7,0.7l5.5,6.2l2.1,0.3l2.5,3.6l1.2,5.4l-3.7,1.5l-0.7,2.9l0.9,3.6l-1.6,2.4l0.3,2.3l-4.7,5.3l-3.9,1l-0.3-1.2l-2-0.2l-1.2,2.9l-2.5,0.5l-0.5,1.3l-2.6,0.9Z",
    labelX: 418, labelY: 238
  },
  DF: {
    path: "M333.9,377l-0.5-3.6l2.2-2.5l3.5-0.3l2.5,1.6l1.2,5.5l-3.2,2.6l-3.9-0.5l-1.8-2.8Z",
    labelX: 336, labelY: 377
  },
  ES: {
    path: "M427.2,401.2l-2.5-3.1l-0.1-5.2l-1.5-2.3l0.2-2.7l-3-4.4l0.5-3l5.3-6.4l3.1,0l1.1-2.4l3.3,0l5.5-5.5l0.9,0.2l0.5,3.4l2.5,1.3l-0.3,4.9l2.7,4.3l0.5,5.9l-0.5,3.4l-3.5,1.7l-2.3,4.9l-4.5,3.3l-4.5,0.5l-2.9,1.2Z",
    labelX: 430, labelY: 379
  },
  GO: {
    path: "M333.5,381.5l-1.1-3.1l1.7-0.9l-0.5-2.3l-3.4-0.7l-1.2-2.4l2.2-0.3l0.9-5.9l-1.5-4.4l1.2-3.2l-0.5-1.7l1.2-0.9l0.1-2.3l-2.5-3.9l0.5-2.3l4.7-4.9l1.9-7.8l3.9-4l-0.5-7.4l5.5-0.3l3.1-3.5l0.3-3.5l0.9-1l6.5,0.9l5.4,4.9l1.9-0.4l2.2,1l-1.1,3.3l0.9,3l3.2,3.6l-1.9,4.7l0.5,2.3l-2.2,2.9l0.5,1.9l-0.5,4.5l-2.3,1.5l-0.4,3.2l3.1,3.2l2.5,7.8l4.5,3.5l-0.5,2.3l0.9,1.9l-0.2,1.5l3.9,0.9l0.4,3.9l-2.9,0.9l-5.1-0.3l-1.9,1.1l-2.5-2.3l-1.7,0.2l0.7,2.7l-3.5,0.7l-1.9,3.1l1.5,5.1l-3.3,1.3l-0.1,2.9l-4.5-0.1l-4.5-2.7l-6.5,1.9l-3.3-3.9Z",
    labelX: 352, labelY: 358
  },
  MA: {
    path: "M351.5,249.1l-3.1-7.5l-3.9-3.5l0.5-3.5l-2.2-0.9l0.5-3.7l1.2-1.7l-2.2-1.9l2.5-5.7l-0.5-1.9l1.5-2.9l-1.5-5.1l0.3-1.9l3.5-2.7l0.9-4l4.7-2.1l2.9,0.5l4.4-3l6.9,0.7l5.5,3.2l2.5-0.5l2.5,2.7l-0.5,2.7l5.7,0.5l3.5-3.5l1.7,0.9l5.1-1.7l2,1.1l-0.2,2.3l2.5,2.9l-0.7,2.3l2.9,3.5l-0.2,3l0.9,0.9l-0.7,3.5l-4.7,0.9l-1.2,1.9l0.7,1.5l-3.5,0.7l-2.9,4.3l0.2,5.9l-1.2,2.9l1.7,1.9l-2.7,0.9l-1.7,5.9l-4.2-1.3l-1.3-5.9l-2.1-1.4l0.1-1.7l-2.9-1.9l-5.7,0.1l-1.2-2.6l-6.4,1.7l-0.7,1.9l-3.1-0.7l-2.2,2.9l-3.5-1Z",
    labelX: 370, labelY: 225
  },
  MG: {
    path: "M407.4,369l-3.6,0.2l-2.5-3.5l-2.1-0.5l-3.2,2.7l-3.4-0.6l-2.7-2.6l-2.9,0.9l-1.7,6.8l-3.9,0.5l-4.3-0.8l-2.4,0.7l-3.9-0.4l-0.9-2.5l-2.7-1.4l-3.7,0.7l-2.3-3.2l-0.1-2.5l-3.7,0.3l-0.9-0.9l-1.7,1.1l-2.3-0.3l-0.5-2.2l-5.2-2l-3.1,0l-0.3-3.2l-1.9-0.9l0.9-3.5l-1.2-0.5l-0.3-4.9l2.3-2.5l-1.5-5l1.9-3.1l3.5-0.7l-0.7-2.9l1.7-0.2l2.7,2.5l1.9-1.1l5.1,0.3l2.9-0.7l-0.5-4l-0.7-1.9l0.2-1.5l-3.9-0.9l0.2-3l2.9-0.7l-4.5-3.5l-2.5-7.8l-3.1-3.2l0.4-3.2l2.3-1.5l0.5-4.5l-0.5-1.9l2.2-2.9l-0.5-2.3l1.9-4.7l3.2,0.9l5.5-0.4l18.7-3.3l3.9,0.7l2.6-4.7l1-6.2l2.9-3.6l0.2-4.6l3.5-2.2l-0.5-5.7l1.3-4.5l-0.3-6l1.5-3.4l4.9,0.9l3.3,2.5l2.3-0.5l3.9,1.9l7.4,0.5l6.6-3.7l3.6,0.8l0.7,1.9l5.4,1.2l2.5,3l-1.5,3.1l0.9,3.5l2.5-0.1l3.6,3.2l0.1,2.9l-2.2,5l0.4,6.3l-0.8,4.5l1.9,3.3l-0.5,2.9l0.7,3.4l4.9,4.9l-0.5,2.4l1.3,4.7l0.2,5.5l-0.7,3.5l-1.2,0.8l0.3,2.8l-2.5,1.8l-0.2,1.4l-2.4,0.2l-4.9,4.6l-1.1-0.3l-0.3,2.5l-2.7-1.3l-0.5-3.6l-2.5-1.3l-0.5,3.6l-5.5,6.7l-0.3,2.9l3,4.4l-0.2,2.7l1.5,2.3l0.1,5.2l2.5,3.1l-2.9-0.1l-5.5,1.2l-1,2l-4.7-0.5l-2.3,1.9l-2.5-0.5l-2.1,3.9l-3.4,2.3l-0.3,2.5Z",
    labelX: 395, labelY: 357
  },
  MS: {
    path: "M297.5,425l-2.7-0.3l-2.1-1.9l0.5-3.1l-2.7-2.5l-0.1-2.3l-3.3-4.1l0.3-6.7l-4.5-5.9l-2.3-0.5l0.5-1.9l-2.3-1.5l-1.2-3.9l-2.7-2.2l0.5-3.7l-0.5-5.9l-5.7-3.1l-0.3-2.9l-4.7-0.5l-4.5-5l3.1-4.5l5.9-2.3l2.5,0.5l1.7-1.7l0.5-2.5l7.2-5.4l0.5-2.1l3.3-1.5l3.9-4.1l1.5,1.9l4.9-0.3l4.7,2.3l0.5-1.7l3.7-0.9l1.1,2l5.2,1l0.9,3.5l2.5,0.7l1.5,4.5l2.1,0.9l-0.5,2.5l3.3,1.9l0.3,2.9l5.1,5.7l-3.9,4l0.5,7.4l-3.9,4l-1.9,7.8l-4.7,4.9l-0.5,2.3l2.5,3.9l-0.1,2.3l-1,0.7l-3.9-0.5l-1.7,0.3l-0.9,1.5l-4.9,2.3l-1.9-0.3l-2.5,3.1l-0.9,4.9l-2.3,0.3Z",
    labelX: 285, labelY: 390
  },
  MT: {
    path: "M265,358.5l-0.9-4.2l-4.9-3.9l-1.5-5.5l-2.5-2.9l-1.7-4.9l0.5-3.5l-5.7-0.5l-3.5-4.7l-3.1,0.5l-2.9-2.7l-8.2-1.2l-1.5-2.9l-3.9-1.9l-0.7-1.9l2.2-2.1l0.1-3.1l-5.1-7.2l-3.5-3.1l-1.7-4.5l-0.5-7.9l-2-5.2l0.3-3.2l-4.3-0.5l-0.5-5.5l-3.9-3.7l-3.5,0.3l-1.3-2.5l0.5-1.9l-1.9-1.3l-3.5,2.5l-1.9-0.5l-2.9,2.3l-1.5,3.9l-3.9,0.9l-2.1,2.9l-5.3-0.9l-1.9,0.9l-1.5-1.9l-4.5,0.5l-1.5-1l-0.9,1l-3.7-0.7l-3.5,1.3l2.9-4.7l5.2-3.7l3,1.1l0.5-1.1l2.9,0.9l3.9-0.2l5.1,1.5l8.1-2.5l2.6-3l0.2-4.1l1-1.3l0.9-4.5l-2.4-2.5l-0.9-3.1l5.5,0l1.7-0.6l7.1,0.1l2-0.9l5.3-0.1l2.9-2.9l4.4,1.6l6.9-1l3.9,2.7l-0.4,0.6l5.7,0.7l1.2,0.9l9.3,0l3.9-2.7l5.1,0.2l1.7-2.4l5.5-0.1l0.3,3.7l12.7,9.7l0.5-0.1l3.9,4.5l8.5,4.7l9.9,0.9l1.9,1.9l5.5,0.5l3.1,2.9l3.5,0.5l2.5,2.9l-0.5,4.9l0.9,2.9l6.5,5.5l-5.4,0.3l-0.3,3.5l-3.1,3.5l-5.5,0.3l0.5,7.4l-3.9,4l-1.9,7.8l-4.7,4.9l-0.5,2.3l2.5,3.9l-0.1,2.3l-1.2,0.9l0.5,1.7l-1.2,3.2l1.5,4.4l-0.9,5.9l-2.2,0.3l1.2,2.4l3.4,0.7l0.5,2.3l-1.7,0.9l1.1,3.1l-8.9,0.3l-6.5-1.9l-4.1,2.9l-10.7-0.1l-2.9,0.5l-6.1,3.3l-5.5-0.3Z",
    labelX: 215, labelY: 310
  },
  PA: {
    path: "M351.5,249.1l-3.7,1.3l-1.7-2.3l-3.7,0.7l-2.2-1.5l-1.9,1.5l-2.9-1.5l-2.5,0.5l-1.7,2.9l-4.9-0.9l-3.9,1.5l-1.3-1.7l-3.3,0.5l-1.5-0.5l-5.5,5.1l-1.5-0.9l-2.2,2.1l-3.9-0.5l-3.1,1.1l-2.5-2.5l-0.5-2.7l-5.5-4.1l-1.5,0.7l-3.5-1.5l-4.9,3.1l-0.5,2.1l-2.5-0.1l-1.7,1.5l-4.5-0.3l0.5-2.9l-3.3-1.7l-3.5,1.3l-1.5-0.9l0.1-2.3l-3.1-0.7l-2.7,1.5l-0.5-1.7l2.9-3.3l-2.7-5.3l-0.3-1.9l-2.1-1.3l0.1-2.7l-4.3-3.1l1.7-4.2l2.9,4.9l6.7,0.3l0.5-4.3l1.2-0.8l-0.2-2.7l1.4-0.8l0.6,3.4l2.8,0.3l1.1-1.7l1.7,2.3l3.3-0.9l0.7-2.1l2.7,0.3l0.7-1.9l4.9,0.3l1.3-2.7l5.5,0.3l0.3-2.5l2.3-0.9l0.3-1.9l-1.5-0.9l1.5-2.5l2.7,0.5l2.2-2.3l-0.5-1.9l1.5-0.7l-0.5-3.9l2.1-1.9l0.9,1.3l0.5-3.3l2.5-2.3l-0.5-1.5l0.7-3.7l2.1,0.5l0.5-1.5l4.5-3.7l-0.5-2.9l5.7-0.1l-0.5,1.5l1.3,1.7l-1.9,2.5l1.6,3.9l0,3l5.9,1.2l0.9,2.5l4.9,0.2l-1.1,4.5l5.1-1.5l4.9-5.1l0.3-3.8l1.7-1l0.5-2.7l-2.6-3.6l0.5-1.9l-2.2-2.9l-0.3-3.6l-1.7-2.9l4.9-0.5l0.9,1.5l5.1,0.5l2.2,4.7l2.5,0.7l-0.5,2.2l7.3,0.5l3.1,1.9l2.9-0.5l1.5,3.5l3.5-0.5l0.5,1.9l4.4,2.5l0.5,2.1l-1.3,2.9l2.1,2.9l-0.9,2.7l2.5,1.7l-1.5,3.5l2.5,2.1l-2.9,4.5l1.9,5.3l-3.5,2.7l-0.3,1.9l1.5,5.1l-1.5,2.9l0.5,1.9l-2.5,5.7l2.2,1.9l-1.2,1.7l-0.5,3.7l2.2,0.9l-0.5,3.5l3.9,3.5l3.1,7.5Z",
    labelX: 293, labelY: 212
  },
  PB: {
    path: "M445.6,269.9l-2.5-1.5l-4.1,0.9l-4.3-0.5l-2-1.9l-3.5,1.2l-1.7-0.5l-1.9,1.5l-3.1-0.9l-1.5,0.5l-0.5-1.3l2.5-0.5l1.2-2.9l2,0.2l0.3,1.2l3.9-1l4.7-5.3l-0.3-2.3l1.6-2.4l-0.9-3.6l0.7-2.9l3.7-1.5l6.3,1l3.3,2.1l0.9,2.3l2.7,0.2l1.9,1.7l3.7,0.9l-0.5,3.1l-3.3,0.7l-1.5,3.9l-2.5,0.9l-2.3,3.9l-3.1,1.9Z",
    labelX: 440, labelY: 260
  },
  PE: {
    path: "M411.5,295.7l-1.7-1.1l2.5-4.9l-2.5-3.5l2.1-3.9l2.1-1.5l-0.5-2.5l1.7-3.5l0.5-3.5l-1.7-1l1.5-0.5l3.1,0.9l1.9-1.5l1.7,0.5l3.5-1.2l2,1.9l4.3,0.5l4.1-0.9l2.5,1.5l1.7,3.3l2.5,0.9l3.7-0.5l0.9-1.9l4.1,0.5l3.7,3.1l2.9-0.5l3.1,2.7l-0.7,2.7l-5.4,4.7l-3.5,0.5l-2.4,2.3l-2.5-0.9l-1.1,2.1l-5.9-1.7l-1.5-2.5l-2.3,0.5l-0.5,1.5l-2.5-1.1l-3.5,1.7l-6.5-0.5l-2.5,1.9l-1.9-0.5l-3.7,2.3Z",
    labelX: 440, labelY: 280
  },
  PI: {
    path: "M401.3,271.3l-0.5,3.5l-1.7,3.5l0.5,2.5l-2.1,1.5l-2.1,3.9l2.5,3.5l-2.5,4.9l-0.9-0.3l-4.2-4.3l-0.5-2.9l-1.5-1.7l0.7-3.5l-0.5-1.9l-2.1-0.5l-0.7-4.5l-2.5-4.1l-0.5-3.9l-3.7-4.7l-1.2-5.5l3.7-1.9l0.7-4.9l-1.2-3.3l1.7-5.9l2.7-0.9l-1.7-1.9l1.2-2.9l-0.2-5.9l2.9-4.3l3.5-0.7l-0.7-1.5l1.2-1.9l4.7-0.9l0.7-3.5l-0.9-0.9l0.2-3l-2.9-3.5l0.7-2.3l-2.5-2.9l0.2-2.3l-2-1.1l4-0.7l4.5,3.5l2,4.5l4.9,2.9l2.5,5.5l4.1,3.7l0.9,4.5l-0.5,6.5l0.7,2.9l-2.5,6.5l0.9,3.7l-0.3,8.5l-2.2-0.5l-2.3,1.2l-2-3.7l-5.9-4.1l-2.6-4.7l0.5-7.7l-3.2-5.9l0.3-2.7l1.5-1.7l-1.7-2.5l-1.2,0.5l-0.5,5.5l1.9,1l0.7,5.9l2.1,3.9l0.3,4.9l4.5,4.7l2.9,5.1l-0.3,2.3l0.7,1.5Z",
    labelX: 385, labelY: 248
  },
  PR: {
    path: "M331.5,434.9l-2.9-2.5l-3.7,0.3l-3.1-2.7l-7.5-0.9l-2.5,0.7l-4.9-2.5l-3.5,1.5l-5.1-3.5l2.5-3.1l1.9,0.3l4.9-2.3l0.9-1.5l1.7-0.3l3.9,0.5l1-0.7l0.1-2.3l-2.5-3.9l0.5-2.3l4.7-4.9l1.9-7.8l3.9-4l0.5,1.7l0.9-0.5l0.5,5.9l-0.5,3.7l2.7,2.2l1.2,3.9l2.3,1.5l-0.5,1.9l2.3,0.5l4.5,5.9l-0.3,6.7l3.3,4.1l0.1,2.3l2.7,2.5l-0.5,3.1l2.1,1.9l-3.9,0.5l-6.3-2.5l-0.9,1.3Z",
    labelX: 305, labelY: 418
  },
  RJ: {
    path: "M407.1,421.8l-1.9-1.5l0.3-1.5l2.2,0.5l6.7-7l0.2-3.9l-1.9-5.2l1.2-2.4l2.9,0.1l2.9-1.2l4.5-0.5l4.5-3.3l2.3-4.9l3.5-1.7l0.5-3.4l3.3,1.5l3.5,5.1l7.1,4.9l4.9,1.1l2.9,2.5l-0.5,2.3l1.5,1.9l-2.1,2.5l0.3,1.5l-3.3,1.9l-2.9-0.5l-4.5,1.9l-5.1-0.5l-4.9,2.9l-9.5,1.5l-7.9,3.5l-5.1,1.9l-2.5,0.5Z",
    labelX: 433, labelY: 410
  },
  RN: {
    path: "M457.4,256.9l-0.5-3.3l-1.9-1.7l-2.7-0.2l-0.9-2.3l-3.3-2.1l-3.4,0.5l1.2-5.4l-2.5-3.6l-2.1-0.3l1.3-2.9l7.7-2.5l4.5,0.5l4.9,4.1l2.5,4.9l0,4.3l-2.7,3.1l-0.2,4.5l-1.9,2.4Z",
    labelX: 455, labelY: 242
  },
  RO: {
    path: "M181.5,343.3l-2.9,2.9l-5.3,0.1l-2,0.9l-7.1-0.1l-1.7,0.6l-2.6,0.5l-0.6-1.9l-3.8-0.1l-1-1.9l-2-0.3l-0.3-0.6l-1.3,0.1l-0.7-0.9l-1.1,0.3l-3.3,2.5l-5.2-1l-0.6-3.3l-1.9-0.5l-4.9-4.2l-1.9-3.7l3.1-2.1l0.9-5.1l5.1-3.1l2.1-4.7l-0.9-2.5l0.5-4.5l-1.5-3.5l1.9-4.1l-0.9-2.5l0.5-1.5l0.5,1.5l7.1,0.1l1.5,1l4.5-0.5l1.5,1.9l1.9-0.9l5.3,0.9l2.1-2.9l3.9-0.9l1.5-3.9l2.9-2.3l1.9,0.5l3.5-2.5l1.9,1.3l-0.5,1.9l1.3,2.5l3.5-0.3l3.9,3.7l0.5,5.5l4.3,0.5l-0.3,3.2l2,5.2l0.5,7.9l1.7,4.5l3.5,3.1l5.1,7.2l-0.1,3.1l-2.2,2.1l-3.5-1.3l-6.9,1l-4.4-1.6l-2.9,2.9Z",
    labelX: 140, labelY: 318
  },
  RR: {
    path: "M169.1,181.9l-2.5-4.5l0.3-2.1l-0.9-1.1l0-2.9l-1.7-4.2l0.2-2.7l-1.4-1.5l-0.4-2.9l-5.1-3.1l-3.4-3.9l-8.5-1.9l-6.9-4.9l-4.9-0.9l-7.9-0.1l-4.9-2.8l-2.2,0.5l-4.7-0.7l-1.9,1.6l-2.7-0.3l0.9-2.3l-2.7-1.1l-3.1-3.9l1.7-3.7l-0.7-2.9l1.3-1.5l-0.5-2.9l5.7-3.9l1.9,0.9l0.9-1.9l1.7,0.7l0.5-3l2.5-0.7l0.5,1.1l1.5-0.5l3.9,3.3l3.9-1.5l1.5,1.9l2.7-0.9l0.5-1.9l2.9-0.9l0.7-2.3l5.5-0.5l1.7-2.1l-0.5-4.5l3.9-0.3l1.3,0.9l-0.5,2.7l1.9,2.3l4.5,1.1l0.9,1.9l3.9,1.7l1.9-0.5l0.9,2.3l6.7,0.5l0.7,2.5l3.1,1.7l0.9,1.9l1.9,0.1l0.9,3.7l5.1,4.1l-2,4.1l-1,8.9l-2.5,0.9l-0.9,1.9l0.9,1.9l-3.1,2.1l0.5,1.5l-0.7,5.5l-1.7-0.9l-0.5,1.7l-5.5,0.9l-1.1,5.5l-1.7,1.5l0.9,2.9l-1.9,0.9Z",
    labelX: 132, labelY: 122
  },
  RS: {
    path: "M306.7,494.5l-3.1,3.9l-0.5,3.5l-3.5,4.5l-3.5,1.7l-3.5-1.1l-3.7,1.5l-3.7,4.9l-3.9,0.9l-3.9,3.1l-5.5,0.7l-0.5,2.1l-4.9,2.5l-3.5-0.5l-3.1,1.7l-0.9-2.9l-2.3,0.7l-0.3-2.5l-4.7-3.9l-0.5-3.9l-3.1-2.3l-0.9-3.3l1.5-2.1l-3.1-5.1l2.3-1.9l0.7-3.1l-0.9-4.5l2.1-4.7l-0.1-4.5l3.1-2.9l-0.5-1.3l0.5-4.5l2.9-4.9l3.9-3.5l1.1-3.7l3.5-0.1l3.7,2.1l6.3,0.7l5.5,2.5l2.3-0.5l3.5,1.5l5.9-0.7l1.7,1.5l-0.9,4.7l0.7,2.5l3.5,2.9l4.5,0.7l0.5,3.3l4.9,4.5l0.5,5.5l0.9,1.5l-0.7,3.5l0.9,3.1Z",
    labelX: 270, labelY: 485
  },
  SC: {
    path: "M336.5,463.5l-2.1-1.3l-3.1-4.5l-5.1,0.1l-1.5,1.9l-3.5-1.5l-3.5,0.7l-1.7-1.5l-5.9,0.7l-3.5-1.5l-2.3,0.5l-5.5-2.5l-6.3-0.7l-3.7-2.1l-3.5,0.1l-0.3-1.5l4.5-0.5l0.9-1.3l6.3,2.5l3.9-0.5l3.3,0.5l4.5-2.3l2.5-0.7l7.5,0.9l3.1,2.7l3.7-0.3l2.9,2.5l5.5-0.5l4.9,2.1l-0.9,3.5l-0.5,1.9l-1.7,2.3Z",
    labelX: 305, labelY: 455
  },
  SE: {
    path: "M448.7,310l-2.5-0.9l-4.7,2.3l-3.9-2.5l1.5-4.7l0.5-3.9l2.5-1.9l6.5,0.5l3.5-1.7l2.5,1.1l0.5-1.5l2.3-0.5l1.5,2.5l-1.5,2.9l-0.9,5.3l-4.5,2.1l-2.8,0.9Z",
    labelX: 450, labelY: 302
  },
  SP: {
    path: "M366.7,430.5l-4.7,2.5l-5.3-1.7l-5.1,1.7l-5.9-3.3l-3.9,1.7l-2.7-1.7l0.9-1.3l-0.9-1.5l-2.1,0.5l-3.3-0.5l-3.5,0.7l-4.5,2.3l0.5-5.5l-4.5-0.1l-3.3,3.1l-3.1-0.5l-2.3,1.5l-3.1-0.7l-2.5-3.5l-3.7-0.5l-0.5-1.3l1.9-2.3l2.7,0.3l2.3-0.3l0.9-4.9l2.5-3.1l0.9,0.3l1.9-0.5l0.9-1.5l2.9-0.5l10.7,0.1l4.1-2.9l6.5,1.9l8.9-0.3l3.3,3.9l6.5-1.9l4.5,2.7l4.5,0.1l0.1-2.9l3.3-1.3l0.3,4.9l1.2,0.5l-0.9,3.5l1.9,0.9l0.3,3.2l3.1,0l-0.9,1.9l-3.3,1.9l-3.7,5.9l-4.5,0.5Z",
    labelX: 330, labelY: 418
  },
  TO: {
    path: "M346,321.1l-5.5,0.4l-3.2-0.9l-3.2-3.6l-0.9-3l1.1-3.3l-2.2-1l-1.9,0.4l-5.4-4.9l-6.5-0.9l-0.9,1l-0.3,3.5l-3.1,3.5l-5.5,0.3l0.5,7.4l-3.9,4l-1.9,7.8l-4.7,4.9l-0.5,2.3l2.5,3.9l-0.1,2.3l-1.2,0.9l0.5,1.7l-1.2,3.2l1.5,4.4l-0.9,5.9l-2.2,0.3l1.2,2.4l3.4,0.7l0.5,2.3l-1.7,0.9l-0.5-1.5l-0.9,0.5l-0.5-1.7l-4.7-2.3l-4.9,0.3l-1.5-1.9l0.5-9.1l-2.5-0.5l-2.1-3.5l-8.9-1.1l-0.3-43.1l5.5,0.3l6.1-3.3l2.9-0.5l10.7,0.1l4.1-2.9l6.5,1.9l0.9,4.2l10.9,1.2l8.2,1.2l2.9,2.7l3.1-0.5l3.5,4.7l5.7,0.5l-0.5,3.5l1.7,4.9l2.5,2.9l1.5,5.5l4.9,3.9Z",
    labelX: 306, labelY: 288
  },
};

export function BrazilMap({ estados, onSelectEstado, selectedUF, tenantColor = "#ffd700" }: BrazilMapProps) {
  const [hoveredUF, setHoveredUF] = useState<string | null>(null);

  const getEstadoData = (uf: string): EstadoData | undefined => {
    return estados.find(e => e.uf === uf);
  };

  const getStateColor = (uf: string): string => {
    const data = getEstadoData(uf);
    if (!data || data.totalDecisoes === 0) return "#e5e7eb";
    
    if (selectedUF === uf) return tenantColor;
    if (hoveredUF === uf) return tenantColor + "99";
    
    const intensity = Math.min(data.totalDecisoes / 30, 1);
    if (data.percentualFavoravel >= 60) {
      return `rgba(34, 197, 94, ${0.4 + intensity * 0.6})`;
    } else if (data.percentualFavoravel <= 40) {
      return `rgba(239, 68, 68, ${0.4 + intensity * 0.6})`;
    }
    return `rgba(234, 179, 8, ${0.4 + intensity * 0.6})`;
  };

  const hoveredData = hoveredUF ? getEstadoData(hoveredUF) : null;

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      <div className="relative flex-shrink-0">
        <svg viewBox="40 100 480 440" className="w-full max-w-[550px] h-auto">
          {Object.entries(BRAZIL_STATES).map(([uf, { path }]) => {
            const data = getEstadoData(uf);
            const hasData = data && data.totalDecisoes > 0;
            return (
              <path
                key={uf}
                d={path}
                fill={getStateColor(uf)}
                stroke={selectedUF === uf ? tenantColor : "#64748b"}
                strokeWidth={selectedUF === uf ? 2.5 : 0.8}
                className={`transition-all duration-200 ${hasData ? 'cursor-pointer' : 'cursor-default'}`}
                onMouseEnter={() => setHoveredUF(uf)}
                onMouseLeave={() => setHoveredUF(null)}
                onClick={() => hasData && onSelectEstado(uf, data.estado)}
                data-testid={`map-state-${uf}`}
              />
            );
          })}
          {Object.entries(BRAZIL_STATES).map(([uf, { labelX, labelY }]) => {
            const data = getEstadoData(uf);
            const hasData = data && data.totalDecisoes > 0;
            return (
              <g key={`label-${uf}`} className="pointer-events-none">
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="select-none"
                  fontSize="9"
                  fontWeight="600"
                  fill={hasData ? "#1f2937" : "#9ca3af"}
                >
                  {uf}
                </text>
                {hasData && (
                  <text
                    x={labelX}
                    y={labelY + 10}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    className="select-none"
                    fontSize="7"
                    fill="#4b5563"
                  >
                    {data.totalDecisoes}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {hoveredData && (
          <Card className="absolute top-2 left-2 shadow-lg z-10 min-w-[220px] bg-background/95 backdrop-blur">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4" style={{ color: tenantColor }} />
                <span className="font-semibold">{hoveredData.estado}</span>
                <Badge variant="outline" className="text-xs">{hoveredData.trtNome}</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  <span>{hoveredData.favoraveis} favoráveis</span>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingDown className="h-3 w-3 text-red-500" />
                  <span>{hoveredData.desfavoraveis} desfav.</span>
                </div>
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span>{hoveredData.totalComarcas} comarcas</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3 text-muted-foreground" />
                  <span>{hoveredData.totalRelatores} relatores</span>
                </div>
              </div>
              <div className="mt-2 text-center">
                <span className="text-lg font-bold" style={{ color: hoveredData.percentualFavoravel >= 50 ? "#22c55e" : "#ef4444" }}>
                  {hoveredData.percentualFavoravel}%
                </span>
                <span className="text-xs text-muted-foreground ml-1">favorável</span>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="flex-1 space-y-2 max-h-[450px] overflow-y-auto">
        <h3 className="font-semibold text-sm text-muted-foreground mb-3 sticky top-0 bg-background py-1 z-10">
          Estados com Decisões ({estados.filter(e => e.totalDecisoes > 0).length})
        </h3>
        {estados.filter(e => e.totalDecisoes > 0).map((estado) => (
          <Card
            key={estado.uf}
            className={`cursor-pointer transition-all hover-elevate ${selectedUF === estado.uf ? 'ring-2' : ''}`}
            style={{ 
              borderColor: selectedUF === estado.uf ? tenantColor : undefined,
              ['--tw-ring-color' as string]: tenantColor 
            }}
            onClick={() => onSelectEstado(estado.uf, estado.estado)}
            data-testid={`card-estado-${estado.uf}`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Badge 
                    variant="secondary" 
                    className="font-mono"
                    style={{ backgroundColor: tenantColor + "20", color: tenantColor }}
                  >
                    {estado.uf}
                  </Badge>
                  <span className="font-medium text-sm">{estado.estado}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground">{estado.totalDecisoes} dec.</span>
                  <Badge 
                    variant={estado.percentualFavoravel >= 50 ? "default" : "destructive"}
                    className="text-xs"
                  >
                    {estado.percentualFavoravel}% fav
                  </Badge>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full transition-all"
                  style={{ 
                    width: `${estado.percentualFavoravel}%`,
                    backgroundColor: estado.percentualFavoravel >= 50 ? "#22c55e" : "#ef4444"
                  }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
        {estados.filter(e => e.totalDecisoes > 0).length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum estado com decisões</p>
          </div>
        )}
      </div>
    </div>
  );
}
