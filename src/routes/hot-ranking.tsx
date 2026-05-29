import { createFileRoute } from "@tanstack/react-router";
import { HotRankingManagement } from "@/components/hot-ranking/HotRankingManagement";

export const Route = createFileRoute("/hot-ranking")({
  component: HotRankingManagement,
});