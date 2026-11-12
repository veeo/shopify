import { LoadGate } from "@/components/load-gate";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ scenario?: string | string[] }>;
}) {
  const params = await searchParams;
  const scenario = Array.isArray(params.scenario) ? params.scenario[0] : params.scenario;
  return <LoadGate initialScenario={scenario === "setup" ? "setup" : "active"} />;
}
