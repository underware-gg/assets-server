import { NextRequest, NextResponse } from "next/server";
import { ControllerVerifyParams, verify_message } from "@/utils/controller";

export type VerifyResponse = {
  verified?: boolean,
  error?: string,
}

export async function POST(request: Request) {
  const params: ControllerVerifyParams = await request.json()
  // console.log(`[controller/verify] params:`, params.address, params.chainId, params.messageHash)

  let response: VerifyResponse = {}
  try {
    const verified = await verify_message(params);
    response = {
      // address: params.address,
      // chainId: params.chainId,
      // messageHash: params.messageHash,
      verified,
    }
  } catch (e: unknown) {
    response = {
      verified: false,
      error: e instanceof Error ? e.message : e as string,
    }
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
