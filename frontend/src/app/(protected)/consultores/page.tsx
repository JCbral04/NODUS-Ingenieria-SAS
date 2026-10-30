import { Users } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function ConsultoresPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Consultores</h1>
      <div className="mt-6">
        <EmptyState
          icon={Users}
          title="Aún no hay listado de consultores"
          description="El directorio con perfiles, especialidades y disponibilidad llega con los endpoints del ecosistema de consultores."
        />
      </div>
    </div>
  );
}
