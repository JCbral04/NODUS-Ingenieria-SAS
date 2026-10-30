import { Building2 } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function EmpresasPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Empresas</h1>
      <div className="mt-6">
        <EmptyState
          icon={Building2}
          title="Aún no hay listado de empresas"
          description="Mientras tanto, la empresa de cada caso se ve en su detalle."
        />
      </div>
    </div>
  );
}
