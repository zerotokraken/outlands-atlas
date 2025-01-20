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

    private getBucketHost(): string {
        if (!this.cloudCubeConfig?.url) {
            throw new Error('CloudCube URL not found');
        }
        const match = this.cloudCubeConfig.url.match(/https:\/\/(.*?)\//);
        return match ? match[1] : '';
    }

    private async sha256(message: string): Promise<string> {
        const msgBuffer = new TextEncoder().encode(message);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
        return Array.from(new Uint8Array(hashBuffer))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    private async hmacSha256(key: string | ArrayBuffer, message: string): Promise<ArrayBuffer> {
        const keyBuffer = key instanceof ArrayBuffer ? key : new TextEncoder().encode(key);
        const messageBuffer = new TextEncoder().encode(message);

        const cryptoKey = await crypto.subtle.importKey(
            'raw',
            keyBuffer,
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['sign']
        );

        return crypto.subtle.sign('HMAC', cryptoKey, messageBuffer);
    }

    private async fetchFromCloudCube(path: string): Promise<Response> {
        if (!this.cloudCubeConfig) {
            throw new Error('CloudCube configuration not found');
        }

        const { url, accessKeyId, secretAccessKey } = this.cloudCubeConfig;
        const region = 'us-east-1';
        const service = 's3';

        const timestamp = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '');
        const date = timestamp.slice(0, 8);

        // Create canonical request
        const canonicalHeaders = {
            'host': this.getBucketHost(),
            'x-amz-date': timestamp
        };

        const signedHeaders = Object.keys(canonicalHeaders).sort().join(';');

        const canonicalRequest = [
            'GET',
            path,
            '',
            Object.entries(canonicalHeaders)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([k, v]) => `${k}:${v}`)
                .join('\n') + '\n',
            signedHeaders,
            'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855' // Empty body hash
        ].join('\n');

        // Create string to sign
        const scope = `${date}/${region}/${service}/aws4_request`;
        const stringToSign = [
            'AWS4-HMAC-SHA256',
            timestamp,
            scope,
            await this.sha256(canonicalRequest)
        ].join('\n');

        // Calculate signature
        const kDate = await this.hmacSha256('AWS4' + secretAccessKey, date);
        const kRegion = await this.hmacSha256(kDate, region);
        const kService = await this.hmacSha256(kRegion, service);
        const kSigning = await this.hmacSha256(kService, 'aws4_request');
        const signature = await this.hmacSha256(kSigning, stringToSign);

        // Convert signature to hex
        const signatureHex = Array.from(new Uint8Array(signature))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');

        // Create authorization header
        const authorization = [
            'AWS4-HMAC-SHA256 Credential=' + accessKeyId + '/' + scope,
            'SignedHeaders=' + signedHeaders,
            'Signature=' + signatureHex
        ].join(', ');

        const headers = new Headers({
            'Authorization': authorization,
            'x-amz-date': timestamp
        });

        return fetch(`${url}${path}`, { headers });
    }

    public async getTile(floorNumber: string, directory: string, file: string): Promise<string> {
        const tilePath = `floors/floor-${floorNumber}/tiles/${directory}/${file}.png`;
        
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
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
        const configPath = `floors/floor-${floorNumber}/required_tiles.json`;
        
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
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
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
