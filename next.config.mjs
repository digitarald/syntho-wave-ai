import { PHASE_DEVELOPMENT_SERVER } from 'next/constants.js';

const nextConfig = (phase, { defaultConfig }) => {
    if (phase === PHASE_DEVELOPMENT_SERVER) {
        return {
            /* development only config options here */
        }
    }

    return {
        output: 'export',
        basePath: '/syntho-wave-ai',
        images: {
            unoptimized: true,
        },
    }
};

export default nextConfig;
