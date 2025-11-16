// ============ FUNÇÕES PARA O COMPONENTE SPINNER (ROLETA) ============

/**
 * Gera o HTML para o componente Spinner (Roleta).
 * @param {object} field - Configuração do campo (name, min, max, step, unit).
 * @param {string} fieldId - ID único para o campo.
 * @param {number} currentValue - Valor atual do campo.
 * @returns {string} HTML do componente.
 */
function createSpinnerHTML(field, fieldId, currentValue) {
    const defaultValue = (field.default !== undefined) ? field.default : field.min;
    const displayValue = (currentValue !== undefined && currentValue !== null && currentValue !== '') ? currentValue : defaultValue;

    return `
        <div class="spinner-container">
            <button type="button" class="spinner-button decrement" 
                    data-target-id="${fieldId}" 
                    data-step="${field.step || 1}" 
                    data-min="${field.min}" 
                    data-max="${field.max}"
                    onclick="handleSpinnerChange(this, -1)">
                −
            </button>
            <div class="spinner-value-display" id="display-${fieldId}">
                ${displayValue}
                <span class="spinner-unit">${field.unit || ''}</span>
            </div>
            <button type="button" class="spinner-button increment" 
                    data-target-id="${fieldId}" 
                    data-step="${field.step || 1}" 
                    data-min="${field.min}" 
                    data-max="${field.max}"
                    onclick="handleSpinnerChange(this, 1)">
                +
            </button>
            <input type="hidden" id="${fieldId}" name="${field.name}" value="${displayValue}" data-type="spinner">
        </div>
    `;
}

/**
 * Manipula o evento de clique nos botões do Spinner.
 * @param {HTMLElement} button - O botão clicado (+ ou -).
 * @param {number} direction - 1 para incrementar, -1 para decrementar.
 */
window.handleSpinnerChange = function(button, direction) {
    const targetId = button.dataset.targetId;
    const inputElement = document.getElementById(targetId);
    const displayElement = document.getElementById(`display-${targetId}`);
    
    if (!inputElement || !displayElement) return;

    const step = parseFloat(button.dataset.step);
    const min = parseFloat(button.dataset.min);
    const max = parseFloat(button.dataset.max);
    let currentValue = parseFloat(inputElement.value || inputElement.dataset.defaultValue || min);

    let newValue = currentValue + (direction * step);

    // Garante que o valor esteja dentro dos limites
    if (newValue < min) {
        newValue = min;
    } else if (newValue > max) {
        newValue = max;
    }

    // Atualiza o input e o display
    inputElement.value = newValue.toFixed(step % 1 === 0 ? 0 : 2); // Formata para 0 ou 2 casas decimais
    displayElement.innerHTML = `${inputElement.value} <span class="spinner-unit">${button.closest('.spinner-container').querySelector('.spinner-unit').textContent}</span>`;

    // Atualiza o estado dos botões (opcional, mas bom para UX)
    const container = button.closest('.spinner-container');
    const decrementBtn = container.querySelector('.decrement');
    const incrementBtn = container.querySelector('.increment');

    decrementBtn.disabled = (newValue <= min);
    incrementBtn.disabled = (newValue >= max);
};

// Função de inicialização para garantir que os botões estejam no estado correto ao carregar
function initializeSpinners() {
    document.querySelectorAll('.spinner-container').forEach(container => {
        const inputElement = container.querySelector('input[type="hidden"]');
        const decrementBtn = container.querySelector('.decrement');
        const incrementBtn = container.querySelector('.increment');
        
        if (inputElement && decrementBtn && incrementBtn) {
            const min = parseFloat(decrementBtn.dataset.min);
            const max = parseFloat(decrementBtn.dataset.max);
            const currentValue = parseFloat(inputElement.value);

            decrementBtn.disabled = (currentValue <= min);
            incrementBtn.disabled = (currentValue >= max);
        }
    });
}

// Adiciona a função de inicialização para ser chamada após a geração do formulário
window.initializeSpinners = initializeSpinners;
