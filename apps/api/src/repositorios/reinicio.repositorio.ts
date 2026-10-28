import { supabase } from "../lib/supabase";

interface ClienteRpcReinicio {
  rpc: (
    nombre: "reiniciar_datos_operativos",
  ) => Promise<{ data: null; error: { message: string } | null }>;
}

export async function reiniciarDatosOperativos(): Promise<void> {
  const clienteRpc = supabase as unknown as ClienteRpcReinicio;
  const { error } = await clienteRpc.rpc("reiniciar_datos_operativos");
  if (error) throw new Error(error.message);
}
