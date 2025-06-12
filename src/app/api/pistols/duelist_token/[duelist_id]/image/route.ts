import { type NextRequest } from 'next/server'
import { duelist_token as token } from '@underware/pistols-sdk/pistols/tokens'
import { constants } from '@underware/pistols-sdk/pistols/gen'
import { getControllerUsername } from '@/utils/controller_lookup'

// next.js app routerAPI routes
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#dynamic-route-segments
// https://nextjs.org/docs/app/building-your-application/routing/route-handlers#url-query-parameters

export type PistolsDuelistTokenImageSlugs = {
  duelist_id: string,
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<PistolsDuelistTokenImageSlugs> }
) {
  // route slug
  const { duelist_id } = await params
  // url params
  const searchParams = request.nextUrl.searchParams

  // build props
  const props: token.DuelistSvgProps = {
    // base_uri: 'https://assets.underware.gg',
    duelist_id: BigInt(duelist_id),
    owner: searchParams.get('owner') || '0x0',
    username: searchParams.get('username') || '',
    honour: parseInt(searchParams.get('honour') || '0'),
    archetype: searchParams.get('archetype') as constants.Archetype || constants.Archetype.Undefined,
    profile_type: searchParams.get('profile_type') as constants.DuelistProfile || constants.DuelistProfile.Undefined,
    profile_id: parseInt(searchParams.get('profile_id') || '0'),
    total_duels: parseInt(searchParams.get('total_duels') || '0'),
    total_wins: parseInt(searchParams.get('total_wins') || '0'),
    total_losses: parseInt(searchParams.get('total_losses') || '0'),
    total_draws: parseInt(searchParams.get('total_draws') || '0'),
    fame: parseInt(searchParams.get('fame') || '0'),
    lives: parseInt(searchParams.get('lives') || '0'),
    is_memorized: searchParams.get('is_memorized') === 'true',
    duel_id: parseInt(searchParams.get('duel_id') || '0'),
    pass_id: parseInt(searchParams.get('pass_id') || '0'),
    timestamp_registered: parseInt(searchParams.get('timestamp_registered') || '0'),
    timestamp_active: parseInt(searchParams.get('timestamp_active') || '0'),
    level: parseInt(searchParams.get('level') || '0'),
  }

  // get player name
  if (props.username === '' && props.owner !== '0x0') {
    props.username = await getControllerUsername(props.owner)
  }

  // render svg
  const svg = await token.renderSvg(props)

  return new Response(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
