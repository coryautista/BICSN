export interface RetencionPorCobrar {
  claveOrganica0: string;
  claveOrganica1: string;
  claveOrganica2: string | null;
  claveOrganica3: string | null;
  periodo: string;
  fechaGeneracion: Date | null;
  userAlta: string | null;
  tipo: string; // Valores: "PPV", "PMP", "PCP"
}

