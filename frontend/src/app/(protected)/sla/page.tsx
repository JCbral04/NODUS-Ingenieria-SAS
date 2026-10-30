import { Timer } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";

export default function SlaPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold">SLA</h1>
      <div className="mt-6">
        <EmptyState
          icon={Timer}
          title="Aún no hay tablero de SLA"
          description="El estado de plazo de cada caso ya se ve en su detalle y en el Dashboard."
        />
      </div>
    </div>
  );
}
