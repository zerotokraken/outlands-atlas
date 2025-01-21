export class TileService {
    constructor() {}

    public async getTileConfig(floorNumber: string): Promise<Response> {
        const configPath = `/floors/floor-${floorNumber}/required_tiles.json`;
        const response = await fetch(configPath);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
    }

    public cleanup(): void {
        // No cleanup needed anymore
    }
}
