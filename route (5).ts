/** @type {import('next').NextConfig} */
const nextConfig = {
  // El dashboard lee de Google Sheets vía server components / route handlers.
  eslint: {
    // No fallar el build por ESLint (no se instala eslint en este MVP).
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
