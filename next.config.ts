/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    GCLOUD_PROJECT_ID: process.env.GCLOUD_PROJECT_ID,
  },
};

export default nextConfig;