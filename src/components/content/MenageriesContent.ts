import { CreateIconContainer } from '../types/InfoMenuTypes.js';

export function createMenageriesContent(_: any, _createIconContainer: CreateIconContainer): string {
    return `
        <style>
            .menageries-viewer {
                position: relative;
                width: 100%;
                height: 80vh;
                overflow: hidden;
                border: 1px solid #d4af37;
                cursor: grab;
                background: #000;
                touch-action: none;
            }

            .menageries-viewer.grabbing {
                cursor: grabbing !important;
            }

            .menageries-image {
                position: absolute;
                top: 0;
                left: 0;
                width: auto;
                height: auto;
                max-width: none;
                max-height: none;
                object-fit: contain;
                transform-origin: top left;
                user-select: none;
                touch-action: none;
                will-change: transform;
            }
        </style>
        <div class="menageries-content">
            <div class="menageries-viewer" id="menageriesViewer">
                <img src="/src/images/menageries.png" class="menageries-image" id="menageriesImage" />
            </div>
        </div>
    `;
}
