import { AdminApp } from "@/components/admin-app";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string | string[] }>;
}) {
  const params = await searchParams;
  const scenario = Array.isArray(params.scenario) ? params.scenario[0] : params.scenario;
  return <AdminApp initialScenario={scenario === "active" ? "active" : "setup"} />;
}
