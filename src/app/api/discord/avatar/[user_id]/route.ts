import { NextRequest, NextResponse } from "next/server";
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
  // console.log(`[discord/avatar] user_id:`, user_id);

  //--------------------------------------
  // Step 1: get user data
  // https://discord.com/developers/docs/resources/user#get-user
  //
  let user_data: any = {};
  try {
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
  // console.log(`[discord/avatar] user data:`, user_data);
  const userName: string = user_data.username;
  const avatar: string = user_data.avatar;

  const avatar_url = (avatar ? `https://cdn.discordapp.com/avatars/${user_id}/${avatar}.png` : '');
  console.log(`[discord/avatar] avatar_url:`, userName, avatar_url);

  if (!avatar_url) {
    return NextResponse.redirect('https://play.pistols.gg/profiles/genesis/00.jpg');
  }

  return NextResponse.redirect(avatar_url);
}
