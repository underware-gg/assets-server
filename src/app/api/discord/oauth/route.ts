import { NextRequest, NextResponse } from "next/server";
import { redirect } from "next/navigation";
import { StarknetDomain } from "starknet";
import { ChainId, GeneralPurposeMessage, GeneralPurposeState, makeStarknetDomain } from '@underware/pistols-sdk/pistols/config';
import { createTypedMessage, getMessageHash } from "@underware/pistols-sdk/starknet";
import { bigintEquals } from "@underware/pistols-sdk/utils";
import { constants } from "@underware/pistols-sdk/pistols/gen";
import { emit_player_social_link } from "@/pistols/contractCalls";
import { generate_salt } from "@/app/api/controller/salt";
import { _returnError } from "@/app/api/_error";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code: string = searchParams.get('code') ?? '';
  const state: GeneralPurposeState = JSON.parse(searchParams.get('state') ?? '{}');
  // console.log(`[discord/oauth] code:`, code);
  // console.log(`[discord/oauth] state:`, state);

  if (!code) return _returnError(`Missing code`);
  if (!state?.chainId) return _returnError(`Missing state.chainId`);
  if (!state?.playerAddress) return _returnError(`Missing state.playerAddress`);
  if (!state?.salt) return _returnError(`Missing state.salt`);


  //--------------------------------------
  // Step 1: verify salt
  // (salt was generated at the client by signing the message below)
  //
  const messages: GeneralPurposeMessage = {
    purpose: `Link to ${constants.SocialPlatform.Discord as string}`,
  };
  const starknetDomain: StarknetDomain = makeStarknetDomain({ chainId: state.chainId });
  const typedMessage = createTypedMessage({ starknetDomain, messages });
  const messageHash = getMessageHash(typedMessage, state.playerAddress);
  const salt: bigint | null = generate_salt(state.playerAddress, messageHash);
  // validate...
  if (!bigintEquals(state.salt, salt)) {
    return _returnError(`Invalid salt`);
  }


  //----------------------------------------
  // Step 2: exchange code for access token
  // https://discord.com/developers/docs/topics/oauth2#authorization-code-grant
  //
  let accessToken: string;
  if (!process.env.DISCORD_CLIENT_ID) return _returnError(`Missing DISCORD_CLIENT_ID`);
  if (!process.env.DISCORD_CLIENT_SECRET) return _returnError(`Missing DISCORD_CLIENT_SECRET`);
  if (!process.env.DISCORD_REDIRECT_URL) return _returnError(`Missing DISCORD_REDIRECT_URL`);
  try {
    const body = new URLSearchParams({
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      redirect_uri: process.env.DISCORD_REDIRECT_URL,
      grant_type: 'authorization_code',
      scope: 'identify email',
      code,
    });
    // console.log(`[discord/oauth] body:`, body, body.toString());
    const response = await fetch(`https://discord.com/api/v10/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await response.json();
    if (data.error) {
      return _returnError(data);
    }
    // console.log(`[discord/oauth] data:`, data);
    accessToken = data.access_token;
    if (!accessToken) {
      return _returnError(`Invalid access token`);
    }
  } catch (error) {
    return _returnError(`Code exchange error`, error as Error);
  }


  //--------------------------------------
  // Step 3: get user info
  //
  let userName: string;
  let userId: string;
  let avatar: string;
  try {
    const response = await fetch(`https://discord.com/api/users/@me`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await response.json();
    if (data.error) {
      return _returnError(data);
    }
    // console.log(`[discord/oauth] @me:`, data);
    userName = data.username;
    userId = data.id;
    avatar = data.avatar;
  } catch (error) {
    return _returnError(`@me error`, error as Error);
  }


  //--------------------------------------
  // Step 4: emit player social link event
  //
  await emit_player_social_link(
    state.chainId as ChainId,
    constants.SocialPlatform.Discord,
    state.playerAddress,
    userName,
    userId,
    avatar,
  );

  if (state.redirectUrl) {
    return redirect(state.redirectUrl)
  }

  return new NextResponse(JSON.stringify({ result: 'success' }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  })
}

