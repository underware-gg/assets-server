import { NextRequest, NextResponse } from "next/server";
import { BigNumberish } from "starknet";
import { poseidon } from "@underware/pistols-sdk/utils/starknet";
import { bigintToHex } from "@underware/pistols-sdk/utils";
import { ControllerVerifyParams, verify_message } from "../lib";

export type SaltGeneratorResponse = {
  salt?: BigNumberish,
  error?: string,
  message?: string,
}

// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
export async function POST(request: Request) {
  const params: ControllerVerifyParams = await request.json()
  // console.log(`[controller/salt] params:`, params.address, params.chainId, params.messageHash)

  let response: SaltGeneratorResponse = {};
  try {
    const verified = await verify_message(params);
    if (verified && process.env.SALT_PRIVATE_KEY) {
      // console.log(`[controller/salt] generate:`, params.address, params.chainId, process.env.SALT_PRIVATE_KEY)
      const salt = bigintToHex(
        poseidon([
          params.address,
          params.messageHash,
          process.env.SALT_PRIVATE_KEY,
        ])
      );
      response = {
        salt,
      }
    } else {
      response = {
        error: 'Invalid signature',
      }
    }
  } catch (e: unknown) {
    response = {
      error: 'Invalid signature',
      message: e instanceof Error ? e.message : e as string,
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
