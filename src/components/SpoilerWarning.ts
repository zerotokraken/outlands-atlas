export class SpoilerWarning {
    private static readonly STORAGE_KEY = 'spoiler_warning_acknowledged';

    public static show(): void {
        // Check if user has already seen the warning
        if (localStorage.getItem(this.STORAGE_KEY)) {
            return;
        }

        const backdrop = document.createElement('div');
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000000;
        `;

        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: #262626;
            border: 2px solid #d4af37;
            border-radius: 8px;
            padding: 24px;
            max-width: 500px;
            color: #fff;
            text-align: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        `;

        const title = document.createElement('h2');
        title.textContent = 'Spoiler Warning';
        title.style.cssText = `
            color: #d4af37;
            margin: 0 0 16px 0;
            font-size: 1.5em;
        `;

        const message = document.createElement('p');
        message.innerHTML = `
            This atlas contains information about secret locations, hidden passages, 
            and special encounters that may spoil your exploration experience.<br><br>
        `;
        message.style.cssText = `
            margin: 0 0 24px 0;
            line-height: 1.5;
            color: #ccc;
        `;

        const button = document.createElement('button');
        button.textContent = 'I Understand';
        button.style.cssText = `
            background: #d4af37;
            border: none;
            color: #000;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 1em;
            transition: all 0.2s ease;
        `;
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#e5c158';
        });
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#d4af37';
        });
        button.addEventListener('click', () => {
            localStorage.setItem(this.STORAGE_KEY, 'true');
            backdrop.remove();
        });

        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(button);
        backdrop.appendChild(dialog);
        document.body.appendChild(backdrop);
    }
}
