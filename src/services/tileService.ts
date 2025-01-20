interface CloudCubeConfig {
    url: string;
    accessKeyId: string;
    secretAccessKey: string;
}

export class TileService {
    private cache: Cache | null = null;
    private cloudCubeConfig: CloudCubeConfig | null = null;

    constructor() {
        // Initialize cache
        if ('caches' in window) {
            caches.open('map-tiles').then(cache => {
                this.cache = cache;
            });
        }

        // Get CloudCube config from environment
        const cloudCubeUrl = process.env.CLOUDCUBE_URL;
        const accessKeyId = process.env.CLOUDCUBE_ACCESS_KEY_ID;
        const secretAccessKey = process.env.CLOUDCUBE_SECRET_ACCESS_KEY;

        if (cloudCubeUrl && accessKeyId && secretAccessKey) {
            this.cloudCubeConfig = {
                url: cloudCubeUrl,
                accessKeyId,
                secretAccessKey
            };
        }
    }

    private async fetchFromCloudCube(path: string): Promise<Response> {
        if (!this.cloudCubeConfig) {
            throw new Error('CloudCube configuration not found');
        }

        const { url, accessKeyId, secretAccessKey } = this.cloudCubeConfig;
        const timestamp = new Date().toISOString().slice(0, -5) + 'Z';
        const date = timestamp.slice(0, 10).replace(/-/g, '');

        // AWS S3 request signing
        const signature = await this.signRequest('GET', path, timestamp, date);

        const headers = new Headers({
            'Authorization': `AWS ${accessKeyId}:${signature}`,
            'x-amz-date': timestamp
        });

        return fetch(`${url}${path}`, { headers });
    }

    private async signRequest(method: string, path: string, timestamp: string, date: string): Promise<string> {
        if (!this.cloudCubeConfig) {
            throw new Error('CloudCube configuration not found');
        }

        const { secretAccessKey } = this.cloudCubeConfig;
        const stringToSign = [
            method,
            '',
            '',
            timestamp,
            path
        ].join('\n');

        // Create HMAC SHA1 signature
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secretAccessKey),
            { name: 'HMAC', hash: 'SHA-1' },
            false,
            ['sign']
        );

        const signature = await crypto.subtle.sign(
            'HMAC',
            key,
            encoder.encode(stringToSign)
        );

        return btoa(String.fromCharCode(...new Uint8Array(signature)));
    }

    public async getTile(floorNumber: string, directory: string, file: string): Promise<string> {
        const tilePath = `/floors/floor-${floorNumber}/tiles/${directory}/${file}.png`;
        
        // Try to get from cache first
        if (this.cache) {
            const cachedResponse = await this.cache.match(tilePath);
            if (cachedResponse) {
                return URL.createObjectURL(await cachedResponse.blob());
            }
        }

        try {
            // Fetch from CloudCube
            const response = await this.fetchFromCloudCube(tilePath);
            const blob = await response.blob();

            // Cache the response
            if (this.cache) {
                await this.cache.put(tilePath, new Response(blob.slice(0)));
            }

            return URL.createObjectURL(blob);
        } catch (error) {
            console.error(`Failed to load tile: ${tilePath}`, error);
            throw error;
        }
    }

    public async getTileConfig(floorNumber: string): Promise<Response> {
        const configPath = `/floors/floor-${floorNumber}/required_tiles.json`;
        
        // Try to get from cache first
        if (this.cache) {
            const cachedResponse = await this.cache.match(configPath);
            if (cachedResponse) {
                return cachedResponse;
            }
        }

        try {
            // Fetch from CloudCube
            const response = await this.fetchFromCloudCube(configPath);
            
            // Cache the response
            if (this.cache) {
                await this.cache.put(configPath, response.clone());
            }

            return response;
        } catch (error) {
            console.error(`Failed to load tile config: ${configPath}`, error);
            throw error;
        }
    }
}
