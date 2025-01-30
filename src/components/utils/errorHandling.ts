export function createErrorMessage(message: string = 'Error loading content. Please try again.'): string {
    return `
        <div style="
            color: #999;
            padding: 20px;
            text-align: center;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            margin: 20px;
        ">
            ${message}
        </div>
    `;
}

export function createLoadingMessage(): string {
    return `
        <div style="
            color: #999;
            padding: 20px;
            text-align: center;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            margin: 20px;
        ">
            Loading...
        </div>
    `;
}

export function createComingSoonMessage(page: string): string {
    return `
        <div style="
            color: #999;
            padding: 20px;
            text-align: center;
            background: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
            margin: 20px;
        ">
            Content for ${page} is coming soon.
        </div>
    `;
}
