interface ViewerState {
    scale: number;
    translateX: number;
    translateY: number;
    lastX: number;
    lastY: number;
    isDragging: boolean;
}

export function initViewer() {
    const viewer = document.getElementById('menageriesViewer') as HTMLElement | null;
    const image = document.getElementById('menageriesImage') as HTMLImageElement | null;

    if (!viewer || !image) return;

    // Tell TypeScript from here on, `viewer` and `image` are definitely not null
    const viewerEl = viewer;
    const imageEl = image;

    const state: ViewerState = {
        scale: 1,
        translateX: 0,
        translateY: 0,
        lastX: 0,
        lastY: 0,
        isDragging: false,
    };

    function updateTransform() {
        imageEl.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
    }

    function handleMouseDown(e: MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        state.isDragging = true;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        viewerEl.classList.add('grabbing');
    }

    function handleMouseMove(e: MouseEvent) {
        if (!state.isDragging) return;
        e.preventDefault();
        e.stopPropagation();
        const dx = e.clientX - state.lastX;
        const dy = e.clientY - state.lastY;
        state.translateX += dx;
        state.translateY += dy;
        state.lastX = e.clientX;
        state.lastY = e.clientY;
        updateTransform();
    }

    function handleMouseUp(e: MouseEvent) {
        e.stopPropagation();
        state.isDragging = false;
        viewerEl.classList.remove('grabbing');
    }

    function handleWheel(e: WheelEvent) {
        e.preventDefault();
        e.stopPropagation();

        const rect = viewerEl.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const prevScale = state.scale;
        const delta = -e.deltaY * 0.001;
        const newScale = Math.min(8, Math.max(0.1, prevScale * (1 + delta)));

        const imageX = (mouseX - state.translateX) / prevScale;
        const imageY = (mouseY - state.translateY) / prevScale;

        state.scale = newScale;
        state.translateX = mouseX - imageX * newScale;
        state.translateY = mouseY - imageY * newScale;

        updateTransform();
    }

    function handleImageLoad() {
        const viewerRect = viewerEl.getBoundingClientRect();

        const scaleX = viewerRect.width / imageEl.naturalWidth;
        const scaleY = viewerRect.height / imageEl.naturalHeight;
        state.scale = Math.min(scaleX, scaleY);

        const scaledWidth = imageEl.naturalWidth * state.scale;
        const scaledHeight = imageEl.naturalHeight * state.scale;

        state.translateX = (viewerRect.width - scaledWidth) / 2;
        state.translateY = (viewerRect.height - scaledHeight) / 2;

        updateTransform();
    }

    // Event listeners
    viewerEl.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    viewerEl.addEventListener('wheel', handleWheel, { passive: false });

    imageEl.onload = handleImageLoad;
    if (imageEl.complete) handleImageLoad();
}

