import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  async redirects() {
    return [
      {
        source: '/pistols/tokens/StarterPack.jpg',
        destination: '/pistols/tokens/packs/StarterPack.jpg',
        permanent: true,
      },
      {
        source: '/pistols/tokens/GenesisDuelists5x.png',
        destination: '/pistols/tokens/packs/GenesisDuelists5x.png',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
