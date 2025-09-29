import { NextRequest, NextResponse } from "next/server";
import { ChainId, DojoNetworkConfig, NetworkId } from "@underware/pistols-sdk/pistols/config";
import { getConfig } from "@/pistols/config";
// import { constants } from "@underware/pistols-sdk/pistols/gen";
import { _returnError } from "@/app/api/_error";

//
// reveal last player's moves in a duel
// duel must be in Reveal state
// duel must be revelaed by one player at least
//
// examples: Reveal duel 1313
// http://assets.underware.gg/pistols/reveal/1313
// http://assets.underware.gg/pistols/reveal/1313?chain_id=SN_SEPOLIA
//
export async function GET(
  request: NextRequest,
) {
  // url params
  const searchParams = request.nextUrl.searchParams
  // all params
  const chainId: ChainId = (searchParams.get('chain_id') as ChainId || ChainId.SN_MAIN);
  const networkId: NetworkId = (chainId == ChainId.SN_SEPOLIA ? NetworkId.SEPOLIA : NetworkId.MAINNET);

  // 1. validate Challenge state
  const config: DojoNetworkConfig = getConfig(chainId);

  // prepare response
  const response = {
    chainId,
    networkId,
    DojoNetworkConfig: config,
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin')
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin || '*',
      'Access-Control-Allow-Methods': 'OPTIONS,POST',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
