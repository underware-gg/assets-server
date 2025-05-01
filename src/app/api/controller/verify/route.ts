import { NextRequest, NextResponse } from "next/server";
import { ControllerVerifyParams, verify_message } from "../lib";

// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
export async function POST(request: Request) {
  const params: ControllerVerifyParams = await request.json()
  // console.log(`[controller/verify]`, params.address, params.chainId, params.messageHash)

  const verified = await verify_message(params);
  const response = {
    address: params.address,
    chainId: params.chainId,
    messageHash: params.messageHash,
    verified,
  }

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
