import { type NextRequest } from 'next/server'
import { duel_token as token } from '@underware/pistols-sdk/pistols/tokens'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { getControllerUsername } from '@/utils/controller'

// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#url-query-parameters

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ duel_id: string }> }
) {
  // route slug
  const { duel_id } = await params
  // url params
  const searchParams = request.nextUrl.searchParams
  const props: token.DuelSvgProps = {
    // base_uri: 'https://assets.underware.gg',
    duel_id: BigInt(duel_id),
    table_id: searchParams.get('table_id') || '',
    premise: searchParams.get('premise') as constants.Premise || constants.Premise.Undefined,
    quote: searchParams.get('quote') || '',
    state: searchParams.get('state') as constants.ChallengeState || constants.ChallengeState.Null,
    winner: parseInt(searchParams.get('winner') || '0'),
    profile_type_a: searchParams.get('profile_type_a') as constants.ProfileType || constants.ProfileType.Undefined,
    profile_type_b: searchParams.get('profile_type_b') as constants.ProfileType || constants.ProfileType.Undefined,
    profile_id_a: parseInt(searchParams.get('profile_id_a') || '0'),
    profile_id_b: parseInt(searchParams.get('profile_id_b') || '0'),
    username_a: searchParams.get('username_a') || '',
    username_b: searchParams.get('username_b') || '',
    owner_a: searchParams.get('owner_a') || '0x0',
    owner_b: searchParams.get('owner_b') || '0x0',
  }

  // get player names
  if (props.username_a === '' && props.owner_a !== '0x0') {
    props.username_a = await getControllerUsername(props.owner_a)
  }
  if (props.username_b === '' && props.owner_b !== '0x0') {
    props.username_b = await getControllerUsername(props.owner_b)
  }

  const svg = token.renderSvg(props)

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}