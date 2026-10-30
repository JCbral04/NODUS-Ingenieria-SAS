import { FileText } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DocumentosPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Documentos</h1>
      <div className="mt-6">
        <EmptyState
          icon={FileText}
          title="La gestión documental llega en la Fase 2"
          description="Por ahora el flujo se concentra en el camino principal del caso, de la solicitud al cierre."
        />
      </div>
    </div>
  );
}
