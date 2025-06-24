import { options } from "./options";

export const debug  = () => {

    const container = document.getElementById('overlay');
    
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = 'SSGI';
    checkbox.checked = true;
    const label = document.createElement('label');
    label.textContent = 'use POSTPROCESSING';
    label.htmlFor = 'SSGI';
    container.appendChild(checkbox);
    container.appendChild(label);
    checkbox.addEventListener('change', function () {
        options.useComposer = checkbox.checked
    });
}

