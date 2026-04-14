import { NextResponse } from "next/server";
import { getOperatorPublicKey, SERVER_CLUSTER, SERVER_RPC } from "@/lib/server-metaplex";

export const dynamic = "force-dynamic";

/**
 * GET /api/operator
 * Returns the operator wallet pubkey + cluster so the client can:
 *  - set it as `adminAuthority` during launch (so the server can mint into the collection)
 *  - display the right network in the UI
 */
export async function GET() {
  try {
    return NextResponse.json({
      operatorPubkey: getOperatorPublicKey(),
      cluster: SERVER_CLUSTER,
      rpc: SERVER_RPC,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
