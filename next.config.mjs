import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@abd/ecosystem-widgets', '@abd/styles', '@abd/satellite-sdk', 'next-intl'],
};

export default withNextIntl(nextConfig);
