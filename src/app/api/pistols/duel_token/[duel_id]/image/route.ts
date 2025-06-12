import { type NextRequest } from 'next/server'
import { duel_token as token } from '@underware/pistols-sdk/pistols/tokens'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { getControllerUsername } from '@/utils/controller_lookup'

// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#url-query-parameters

export type PistolsDuelTokenImageSlugs = {
  duel_id: string,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<PistolsDuelTokenImageSlugs> }
) {
  // route slug
  const { duel_id } = await params
  // url params
  const searchParams = request.nextUrl.searchParams
  const props: token.DuelSvgProps = {
    // base_uri: 'https://assets.underware.gg',
    duel_id: BigInt(duel_id),
    duel_type: searchParams.get('duel_type') as constants.DuelType || constants.DuelType.Undefined,
    premise: searchParams.get('premise') as constants.Premise || constants.Premise.Undefined,
    message: searchParams.get('message') || '',
    state: searchParams.get('state') as constants.ChallengeState || constants.ChallengeState.Null,
    winner: parseInt(searchParams.get('winner') || '0'),
    profile_type_a: searchParams.get('profile_type_a') as constants.DuelistProfile || constants.DuelistProfile.Undefined,
    profile_type_b: searchParams.get('profile_type_b') as constants.DuelistProfile || constants.DuelistProfile.Undefined,
    profile_id_a: parseInt(searchParams.get('profile_id_a') || '0'),
    profile_id_b: parseInt(searchParams.get('profile_id_b') || '0'),
    username_a: searchParams.get('username_a') || '',
    username_b: searchParams.get('username_b') || '',
    address_a: searchParams.get('address_a') || '0x0',
    address_b: searchParams.get('address_b') || '0x0',
    season_id: parseInt(searchParams.get('season_id') || '0'),
  }

  // get player names
  if (props.username_a === '' && props.address_a !== '0x0') {
    props.username_a = await getControllerUsername(props.address_a)
  }
  if (props.username_b === '' && props.address_b !== '0x0') {
    props.username_b = await getControllerUsername(props.address_b)
  }

  const svg = await token.renderSvg(props)

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}