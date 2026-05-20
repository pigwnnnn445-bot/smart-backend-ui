import { createFileRoute } from "@tanstack/react-router";
import { SpuRuleManagement } from "@/components/spu/SpuRuleManagement";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  return <SpuRuleManagement />;
}
