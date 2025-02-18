/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push(
        'fluent-ffmpeg',
        '@ffmpeg-installer/ffmpeg',
        '@ffmpeg-installer/linux-x64'
      )
    }
    return config
  }
};

export default nextConfig;
