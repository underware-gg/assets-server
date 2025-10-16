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

export type DiscordUserSlugs = {
  user_id: string,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<DiscordUserSlugs> }
) {
  // route slug
  const { user_id } = await params;
  const searchParams = request.nextUrl.searchParams;
  const state: GeneralPurposeState = JSON.parse(searchParams.get('state') ?? '{}');
  console.log(`[discord/user] user_id:`, user_id);
  console.log(`[discord/user] state:`, state);

  // //----------------------------------------
  // // Step 1: get Client Credentials Grant
  // // https://discord.com/developers/docs/topics/oauth2#client-credentials-grant
  // //
  // let accessToken: string;
  // if (!process.env.DISCORD_CLIENT_ID) return _returnError(`Missing DISCORD_CLIENT_ID`);
  // if (!process.env.DISCORD_CLIENT_SECRET) return _returnError(`Missing DISCORD_CLIENT_SECRET`);
  // try {
  //   const body = new URLSearchParams({
  //     client_id: process.env.DISCORD_CLIENT_ID,
  //     client_secret: process.env.DISCORD_CLIENT_SECRET,
  //     grant_type: 'client_credentials',
  //     scope: 'identify connections'
  //   });
  //   // console.log(`[discord/user] body:`, body, body.toString());
  //   const response = await fetch(`https://discord.com/api/v10/oauth2/token`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  //     body: body.toString(),
  //   });
  //   const data = await response.json();
  //   if (data.error) {
  //     return _returnError(data);
  //   }
  //   console.log(`[discord/user] token data:`, data);
  //   accessToken = data.access_token;
  //   if (!accessToken) {
  //     return _returnError(`Invalid access token`);
  //   }
  // } catch (error) {
  //   return _returnError(`Code exchange error`, error as Error);
  // }
  // console.log(`[discord/user] accessToken:`, accessToken.substring(0, 10), '...', accessToken.length);


  //--------------------------------------
  // Step 2: get user data
  // https://discord.com/developers/docs/resources/user#get-user
  //
  let user_data: any = {};
  try {
    // const url = `https://discord.com/api/users/@me/connections`;
    // const url = `https://discord.com/api/users/@me`;
    const url = `https://discord.com/api/users/${user_id}`;
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bot ${process.env.DISCORD_BOT_TOKEN}` }
    });
    user_data = await response.json();
    if (user_data.error) {
      return _returnError(user_data);
    }
  } catch (error) {
    return _returnError(`/users error`, error as Error);
  }
  console.log(`[discord/user] user data:`, user_data);
  const userName: string = user_data.username;;
  const avatar: string = user_data.avatar;
  const avatar_url = (avatar ? `https://cdn.discordapp.com/avatars/${user_id}/${avatar}.png` : '');
  console.log(`[discord/user] avatar_url:`, avatar_url);


  // //--------------------------------------
  // // Step 4: emit player social link event
  // //
  // await emit_player_social_link(
  //   state.chainId as ChainId,
  //   constants.SocialPlatform.Discord,
  //   state.playerAddress,
  //   userName,
  //   userId,
  //   avatar,
  // );


  return new NextResponse(JSON.stringify({ result: 'success', user_data, avatar_url }), {
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
      'Access-Control-Allow-Methods': 'OPTIONS,GET',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  })
}
