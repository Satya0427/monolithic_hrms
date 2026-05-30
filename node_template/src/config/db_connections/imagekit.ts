import ImageKit from 'imagekit';
import { env } from '../env';

const imagekit = new ImageKit({
    publicKey: env.IMAGEKIT_PUBLIC_KEY,
    privateKey: env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: env.IMAGEKIT_URLENDPOINT
});

export { imagekit };
