import { createFileRoute } from "@tanstack/react-router";
import { SceneTermManagement } from "@/components/scene/SceneTermManagement";

export const Route = createFileRoute("/scene")({
  component: SceneTermManagement,
});