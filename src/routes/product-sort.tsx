import { createFileRoute } from "@tanstack/react-router";
import { ProductSortManagement } from "@/components/product-sort/ProductSortManagement";

export const Route = createFileRoute("/product-sort")({
  component: ProductSortManagement,
});