// ============ CONSTANTES E VARIÁVEIS GLOBAIS ============
const JUMP_MENU_TAGS = []; // Array para armazenar os tags dos equipamentos

// Identifica o tipo de formulário a partir do atributo data-form-type no <body>.
// Isso permite separar o armazenamento local de dados entre formulários interno e externo.
const formType = document.body?.dataset?.formType || 'interno';
const STORAGE_KEY = formType === 'externo' ? 'inspecao_dados_externo' : 'inspecao_dados_interno';
const LAST_NAMES_KEY = formType === 'externo' ? 'inspecao_nomes_externo' : 'inspecao_nomes_interno';

let currentWindowId = null;
let inspectionData = loadData();
let lastNames = loadLastNames();

/**
 * Gera uma cor HSL com matizes diferentes para cada índice de tag.
 * Isso garante que cada botão de equipamento tenha uma cor distinta
 * de forma elegante e consistente.
 * @param {number} index Posição da tag no array
 * @param {number} total Quantidade total de tags
 * @returns {string} Cor em formato hsl(...)
 */
function generateTagColor(index, total) {
    // Evita divisão por zero e distribui o espectro de cores uniformemente
    const hue = Math.floor((index / Math.max(total, 1)) * 360);
    return `hsl(${hue}, 60%, 50%)`;
}

/**
 * Constrói o menu horizontal de tags para navegar entre equipamentos repetitivos.
 * Cada item recebe uma cor de fundo calculada, marca-se como ativo quando clicado
 * e rola suavemente até o grupo de campos correspondente. Quando uma tag é
 * selecionada, os demais itens são desativados.
 * @param {Array<{tag: string, id: string}>} tags Lista de objetos com nome da tag e id do grupo
 * @returns {HTMLElement|null} Elemento de menu ou null se não houver tags
 */
function createTagMenu(tags) {
    if (!tags || tags.length === 0) return null;
    const menu = document.createElement('div');
    menu.className = 'tag-menu';
    const total = tags.length;
    tags.forEach((tagItem, index) => {
        const span = document.createElement('span');
        span.className = 'tag-item';
        span.textContent = tagItem.tag;
        span.style.backgroundColor = generateTagColor(index, total);
        span.addEventListener('click', function(e) {
            // Evita que o clique no menu feche o modal
            e.stopPropagation();
            // Alterna a classe ativa
            menu.querySelectorAll('.tag-item').forEach(item => item.classList.remove('active'));
            span.classList.add('active');
            // Rola suavemente até o campo associado
            const target = document.getElementById(tagItem.id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.classList.add('highlight');
                setTimeout(() => target.classList.remove('highlight'), 1500);
            }
        });
        menu.appendChild(span);
    });
    // Define o primeiro item como ativo por padrão
    const first = menu.querySelector('.tag-item');
    if (first) first.classList.add('active');
    return menu;
}

// ============ FUNÇÕES UTILITÁRIAS ============

/**
 * Retorna a data atual no formato YYYY-MM-DD.
 */
function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

/**
 * Retorna a hora atual no formato HH:MM (24h).
 */
function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
}

/**
 * Preenche a hora final automaticamente.
 */
function setFinalTime() {
    const finalTimeField = document.getElementById('dados-iniciais-hora_final');
    if (finalTimeField) {
        finalTimeField.value = getCurrentTime();
    }
}


/**
 * Carrega os dados de inspeção salvos no localStorage.
 */
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

/**
 * Salva os dados de inspeção no localStorage.
 * @param {object} data
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Carrega os nomes sugeridos (operador e supervisor) do localStorage.
 */
function loadLastNames() {
    const stored = localStorage.getItem(LAST_NAMES_KEY);
    return stored ? JSON.parse(stored) : { operador: '', supervisor: '' };
}

/**
 * Salva os nomes sugeridos (operador e supervisor) no localStorage.
 * @param {object} names
 */
function saveLastNames(names) {
    localStorage.setItem(LAST_NAMES_KEY, JSON.stringify(names));
}

/**
 * Converte um valor de status em uma classe CSS para o indicador visual (farol).
 * Suporta estados originais (OPE, ST-BY, MNT) e novos estados (NORMAL, FALHA, LIGADO, DESLIGADO).
 * @param {string} status
 * @returns {string} Nome da classe CSS correspondente.
 */
function getStatusColorClass(status) {
    if (!status) return '';
    const normalized = status.toString().toUpperCase();
    if (normalized === 'OPE') return 'ope';
    if (normalized === 'ST-BY' || normalized === 'STBY') return 'stby';
    if (normalized === 'MNT' || normalized === 'MANUTENCAO' || normalized === 'MANUTENÇÃO') return 'mnt';
    if (normalized === 'NORMAL') return 'normal';
    if (normalized === 'FALHA') return 'falha';
    if (normalized === 'LIGADO') return 'ligado';
    if (normalized === 'DESLIGADO') return 'desligado';
    return '';
}

/**
 * Verifica se todos os campos obrigatórios de uma janela foram preenchidos.
 * @param {string} windowId
 * @returns {boolean}
 */
function checkWindowCompletion(windowId) {
    const windowFields = FORM_STRUCTURE[windowId].fields;
    if (!inspectionData[windowId]) return false;
    return windowFields.every(field => {
        if (field.required) {
            const value = inspectionData[windowId][field.name];
            return value !== undefined && value !== null && value !== '';
        }
        // Campos não obrigatórios não impedem a conclusão
        return true;
    });
}

/**
 * Atualiza o estado de conclusão das janelas (marcando o botão como completo em azul)
 * e habilita ou desabilita o botão de envio final.
 */
function updateCompletionStatus() {
    let allCompleted = true;
    Object.keys(FORM_STRUCTURE).forEach(windowId => {
        const button = document.querySelector(`[data-window="${windowId}"]`);
        if (button) {
            const isCompleted = checkWindowCompletion(windowId);
            button.classList.toggle('completed', isCompleted);
            if (!isCompleted) {
                allCompleted = false;
            }
        }
    });
    const submitBtn = document.getElementById('submitReport');
    if (submitBtn) {
        submitBtn.disabled = !allCompleted;
    }
}

// ============ GERAÇÃO DE HTML DO FORMULÁRIO ============

/**
 * Gera o HTML para um campo de formulário com base em sua definição.
 * Suporta tipos: status, range, select, textarea, file, number, text, date, time.
 * Para campos numéricos com min e max definidos, utiliza o componente spinner (roleta).
 * @param {object} field Definição do campo
 * @param {*} currentValue Valor atual salvo
 * @param {*} previousValue Valor da inspeção anterior
 * @returns {string} HTML gerado
 */
function createFieldHTML(field, currentValue, previousValue, uniqueId) {
    let html = '';
    const fieldId = uniqueId;
    // Adiciona o tag do equipamento ao array global para o Jump Menu
    if (field.tag) {
        JUMP_MENU_TAGS.push({ id: fieldId, tag: field.tag });
    }

    // Exibe dados anteriores, se existirem
    if (previousValue !== undefined && previousValue !== null && previousValue !== '') {
        html += `<div class="previous-data"><strong>Dados Anteriores:</strong> ${previousValue} ${field.unit || ''}</div>`;
    }
    html += `<div class="form-group" id="group-${fieldId}">`;
    html += `<label for="${fieldId}">${field.label}${field.required ? ' *' : ''}</label>`;
    switch (field.type) {
        case 'status': {
            // Determina o valor padrão para status: usa field.default ou 'ST-BY' se nada definido
            const defaultValue = (field.default !== undefined) ? field.default : 'ST-BY';
            const selectValue = (currentValue !== undefined && currentValue !== null && currentValue !== '') ? currentValue : defaultValue;
            const statusClass = getStatusColorClass(selectValue);
            html += `<div class="status-group">
                        <span class="status-indicator ${statusClass}" id="indicator-${fieldId}"></span>
                        <select id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''} onchange="updateStatusIndicator('${fieldId}', this.value)">
                            <option value="">Selecione o Status</option>
                            ${field.options.map(opt => `<option value="${opt}" ${selectValue === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                        </select>
                    </div>`;
            break;
        }
        case 'range': {
            /**
             * Para alguns intervalos pequenos (por exemplo, 0 a 10 Bar) uma interface de roleta
             * pode ser mais fácil de usar do que um slider contínuo. Adota-se a regra de usar
             * o componente spinner sempre que o intervalo for menor ou igual a 20 unidades e
             * o step for 1 ou menor. Caso contrário mantém o slider original.
             */
            const useSpinnerForRange = (typeof field.min === 'number' && typeof field.max === 'number') && ((field.max - field.min) <= 20) && (field.step === undefined || field.step <= 1);
            if (useSpinnerForRange) {
                // Converte o campo de range em spinner (roleta) usando os mesmos limites
                html += createSpinnerHTML(field, fieldId, currentValue);
            } else {
                // Slider tradicional
                const defaultValue = (field.default !== undefined) ? field.default : field.min;
                const displayValue = (currentValue !== undefined && currentValue !== null && currentValue !== '') ? currentValue : defaultValue;
                html += `<div class="range-group">
                            <div class="range-display">
                                <span>${field.min} ${field.unit || ''}</span>
                                <span class="value" id="range-value-${fieldId}">${displayValue} ${field.unit || ''}</span>
                                <span>${field.max} ${field.unit || ''}</span>
                            </div>
                            <input type="range" id="${fieldId}" name="${field.name}"
                                   min="${field.min}" max="${field.max}" step="${field.step || 1}"
                                   value="${displayValue}"
                                   oninput="document.getElementById('range-value-${fieldId}').textContent = this.value + ' ${field.unit || ''}'">
                        </div>`;
            }
            break;
        }
        case 'select': {
            html += `<select id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''}>
                        <option value="">Selecione</option>
                        ${field.options.map(opt => `<option value="${opt}" ${currentValue === opt ? 'selected' : ''}>${opt}</option>`).join('')}
                    </select>`;
            break;
        }
        case 'textarea': {
            html += `<textarea id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''} placeholder="Descreva a anormalidade e o local">${currentValue || ''}</textarea>`;
            break;
        }
        case 'file': {
            html += `<input type="file" id="${fieldId}" name="${field.name}" accept="${field.accept || ''}" ${field.required ? 'required' : ''}>`;
            if (currentValue) {
                html += `<p class="text-muted mt-2">Arquivo atual: ${currentValue}</p>`;
            }
            break;
        }
        case 'number': {
            // Se o campo define um intervalo (min/max), usa o spinner (roleta)
            if (field.min !== undefined && field.max !== undefined) {
                html += createSpinnerHTML(field, fieldId, currentValue);
            } else {
                // Input numérico padrão com limite de dígitos, se especificado
                const maxLengthAttr = field.digits ? `maxlength=\"${field.digits}\"` : '';
                const placeholder = field.unit ? `placeholder=\"Unidade: ${field.unit}\"` : '';
                // Valor padrão numérico: usa field.default se definido; caso contrário usa 0 quando houver limite de dígitos ou
                // quando o nome do campo indica horímetro/hidrômetro, pois estes campos devem iniciar em zero
                const defaultValue = (field.default !== undefined) ? field.default :
                    ((field.digits !== undefined || /horimetro|hidrometro/i.test(field.name)) ? 0 : '');
                const displayValue = (currentValue !== undefined && currentValue !== null && currentValue !== '') ? currentValue : defaultValue;
                html += `<input type="number" id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''} ${maxLengthAttr} ${placeholder} value="${displayValue}">`;
            }
            break;
        }
        case 'signature': {
            // Campo de assinatura: canvas para desenhar e input hidden para armazenar a imagem em base64
            const existingValue = currentValue || '';
            html += `<div class="signature-container">
                        <canvas id="${fieldId}_canvas" class="signature-canvas" width="300" height="150"></canvas>
                        <input type="hidden" id="${fieldId}" name="${field.name}" value="${existingValue}">
                        <button type="button" class="clear-signature" data-target="${fieldId}">Limpar</button>
                    </div>`;
            break;
        }
        case 'text':
        case 'date':
        case 'time':
        default: {
            let inputType = field.type;
            let autoValue = currentValue || '';
            if (field.auto === 'start_time' && !currentValue) {
                autoValue = getCurrentTime();
            } else if (field.auto === 'start_date' && !currentValue) {
                autoValue = getCurrentDate();
            } else if (field.auto === 'suggest_name') {
                // Usa o último nome salvo, se houver
                autoValue = currentValue || lastNames[field.name] || '';
            }
            const placeholder = field.placeholder ? `placeholder=\"${field.placeholder}\"` : '';
            const readonlyAttr = field.readonly ? 'readonly' : '';
            html += `<input type="${inputType}" id="${fieldId}" name="${field.name}" ${field.required ? 'required' : ''} ${placeholder} value="${autoValue}" ${readonlyAttr}>`;
            break;
        }
    }
    html += `</div>`;
    return html;
}

/**
 * Gera e exibe o formulário para uma janela específica.
 * @param {string} windowId
 */
function generateForm(windowId) {
    currentWindowId = windowId;
    const windowConfig = FORM_STRUCTURE[windowId];
    const modalTitle = document.getElementById('modalTitle');
    const formFieldsContainer = document.getElementById('formFields');
    const modalContent = document.getElementById('modalContent');
    if (!modalTitle || !formFieldsContainer) return;
    modalTitle.textContent = windowConfig.title;
    // Limpa o container dos campos
    formFieldsContainer.innerHTML = '';
    // Remove qualquer menu de tags anteriormente criado
    const tagMenuContainer = document.getElementById('tagMenuModal');
    if (tagMenuContainer) {
        tagMenuContainer.innerHTML = '';
    }
    // Reset global tags e cria lista local de tags
    JUMP_MENU_TAGS.length = 0;
    const tags = [];
    // Recupera dados atuais e dados anteriores, se existirem
    const currentWindowData = inspectionData[windowId] || {};
    const previousWindowData = (inspectionData.previous && inspectionData.previous[windowId]) ? inspectionData.previous[windowId] : {};
    windowConfig.fields.forEach(field => {
        const currentValue = currentWindowData[field.name];
        const previousValue = previousWindowData[field.name];
        // Gera um ID único para cada form-group
        const fieldId = `${currentWindowId}-${field.name}`;
        // Cria o campo e adiciona ao contêiner
        formFieldsContainer.innerHTML += createFieldHTML(field, currentValue, previousValue, fieldId);
        // Se o campo possuir um tag (equipamento), adiciona ao menu (evitando duplicados)
        if (field.tag) {
            if (!tags.some(item => item.tag === field.tag)) {
                tags.push({ tag: field.tag, id: `group-${fieldId}` });
            }
        }
    });
    // Gera o menu de tags dentro do modal, se existirem tags
    if (tagMenuContainer) {
        const menu = createTagMenu(tags);
        if (menu) {
            tagMenuContainer.appendChild(menu);
        }
    }
    // Ajusta altura total para anormalidades (melhor experiência mobile)
    if (modalContent) {
        modalContent.classList.toggle('full-height', windowId === 'anormalidades');
    }
    // Exibe o modal overlay
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.add('active');
    }
    // Inicializa os spinners (roletas) após a geração
    if (typeof initializeSpinners === 'function') {
        initializeSpinners();
    }
    // Inicializa as assinaturas após a geração
    if (typeof initializeSignatures === 'function') {
        initializeSignatures();
    }
}

// Função global para atualizar o indicador de status de um campo
window.updateStatusIndicator = function(fieldId, value) {
    const indicator = document.getElementById(`indicator-${fieldId}`);
    if (indicator) {
        indicator.className = 'status-indicator ' + getStatusColorClass(value);
    }
};

// ============ MANIPULAÇÃO DE EVENTOS ============

/**
 * Trata o clique em um botão de janela, gerando o formulário correspondente.
 */
function handleWindowClick(event) {
    const button = event.currentTarget;
    const windowId = button.dataset.window;
    generateForm(windowId);
}

/**
 * Salva os dados da janela quando o formulário é submetido.
 * Atualiza dados atuais e nomes sugeridos.
 */
function handleFormSubmit(event) {
    event.preventDefault();
    const windowForm = document.getElementById('windowForm');
    const formData = new FormData(windowForm);
    const data = {};
    FORM_STRUCTURE[currentWindowId].fields.forEach(field => {
        const value = formData.get(field.name);
        if (value !== null) {
            data[field.name] = value;
        }
    });
        // Se for Dados Iniciais, armazena os nomes para autocompletar no futuro
        if (currentWindowId === 'dados-iniciais') {
            lastNames.operador = data.operador || '';
            lastNames.supervisor = data.supervisor || '';
            saveLastNames(lastNames);
            // Preenche a hora final ao salvar os dados iniciais
            setFinalTime();
        }
        // Salva os dados da janela no objeto de inspeção e no localStorage
    inspectionData[currentWindowId] = data;
    saveData(inspectionData);
    // Fecha o modal
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.classList.remove('active');
    }
    updateCompletionStatus();
}

/**
 * Envia o relatório completo. Valida que todas as janelas obrigatórias estejam completas,
 * grava a hora final, move os dados para "previous" e limpa a inspeção atual.
 */
function handleReportSubmit() {
    const submitBtn = document.getElementById('submitReport');
    if (submitBtn && submitBtn.disabled) {
        alert('Por favor, preencha todas as janelas obrigatórias antes de enviar o relatório.');
        return;
    }
    // A hora final já foi preenchida ao salvar os dados iniciais, mas garantimos que está no objeto
    if (inspectionData['dados-iniciais'] && !inspectionData['dados-iniciais'].hora_final) {
        inspectionData['dados-iniciais'].hora_final = getCurrentTime();
    }
    // Clona os dados para envio (sem a seção previous)
    const dataToSend = {};
    Object.keys(inspectionData).forEach(key => {
        if (key !== 'previous') {
            dataToSend[key] = inspectionData[key];
        }
    });
    // Determina o tipo de formulário com base no atributo data-form-type do body
    const formType = document.body.dataset.formType || 'interno';
    // Envia dados para o Apps Script correspondente
    sendReportToScript(formType, dataToSend)
        .then(response => {
            if (!response.ok) {
                throw new Error('Falha ao enviar dados');
            }
            return response.text();
        })
        .then(() => {
            // Após envio bem-sucedido, salva os dados localmente como "previous" e limpa inspeção
            saveData(inspectionData);
            inspectionData.previous = { ...inspectionData };
            delete inspectionData.previous.previous;
            const newInspectionData = { previous: inspectionData.previous };
            saveData(newInspectionData);
            alert('Relatório enviado com sucesso! Os dados foram salvos como "Dados Anteriores" e o formulário foi limpo para uma nova inspeção.');
            window.location.reload();
        })
        .catch(err => {
            console.error(err);
            alert('Ocorreu um erro ao enviar o relatório. Por favor, tente novamente.');
        });
}

// ============ CONFIGURAÇÃO DE SCRIPTS REMOTOS ============

// URLs dos WebApps do Google Apps Script para envio dos relatórios.
// Altere esses valores caso mude os scripts no Apps Script. Estes valores são fornecidos pelo usuário.
const SCRIPT_URL_INTERNA =
  'https://script.google.com/macros/s/AKfycbyPgxfHOhG9zHOjSHYtC3LztiMA0NUOP0Rx5Nu1sqd4VaWdngDjT1vZDNK6eqYjO_cEhw/exec';
const SCRIPT_URL_EXTERNA =
  'https://script.google.com/macros/s/AKfycbzI-8Veh6fS4-E4EUkitC1mGQluPZwyX7bTbhTxcmxY1yENrBx7a938PShv-xo5x4Oi/exec';

/**
 * Envia o objeto de dados da inspeção para o script Apps Script correspondente.
 * Gera um FormData com todos os campos coletados nas janelas e realiza um POST.
 * @param {string} formType Tipo de formulário ('interno' ou 'externo')
 * @param {Object} data Objeto contendo os dados de todas as janelas
 * @returns {Promise<Response>} Promessa que resolve para a resposta da requisição
 */
function sendReportToScript(formType, data) {
    // Determina a URL com base no tipo do formulário
    const url = formType === 'interno' ? SCRIPT_URL_INTERNA : SCRIPT_URL_EXTERNA;
    const formData = new FormData();
    // Percorre todas as janelas e adiciona seus campos ao FormData
    Object.keys(data).forEach(windowId => {
        if (windowId === 'previous') return; // ignora dados anteriores
        const windowData = data[windowId];
        Object.keys(windowData).forEach(key => {
            const value = windowData[key];
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });
    });
    // Realiza o POST para o Apps Script
    return fetch(url, {
        method: 'POST',
        body: formData
    });
}

// ============ INICIALIZAÇÃO ============

/**
 * Inicializa a página quando o DOM estiver pronto.
 * Cria os botões das janelas dinamicamente com base na estrutura do formulário.
 * Adiciona os listeners para modais e envio.
 */
document.addEventListener('DOMContentLoaded', function() {
    const windowsGrid = document.querySelector('.windows-grid');
    if (!windowsGrid) return;
    // Cria cada botão de janela
    Object.keys(FORM_STRUCTURE).forEach(windowId => {
        const config = FORM_STRUCTURE[windowId];
        const button = document.createElement('button');
        button.className = 'window-btn';
        button.dataset.window = windowId;
        button.innerHTML = `<span class="icon">${config.icon}</span><span>${config.title}</span>`;
        button.addEventListener('click', handleWindowClick);
        windowsGrid.appendChild(button);
    });

    // Gera o Jump Menu
    generateJumpMenu();

    // Listeners para fechamento do modal
    // Listeners para fechamento do modal
    const modalClose = document.getElementById('modalClose');
    const modalCancel = document.getElementById('modalCancel');
    const modalOverlay = document.getElementById('modalOverlay');
    const windowForm = document.getElementById('windowForm');
    const submitReportBtn = document.getElementById('submitReport');
    if (modalClose) {
        modalClose.addEventListener('click', () => {
            if (modalOverlay) modalOverlay.classList.remove('active');
        });
    }
    if (modalCancel) {
        modalCancel.addEventListener('click', () => {
            if (modalOverlay) modalOverlay.classList.remove('active');
        });
    }
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                modalOverlay.classList.remove('active');
            }
        });
    }
    if (windowForm) {
        windowForm.addEventListener('submit', handleFormSubmit);
    }
    if (submitReportBtn) {
        submitReportBtn.addEventListener('click', handleReportSubmit);
    }
    // Atualiza o status de conclusão inicialmente
    updateCompletionStatus();
});

// ============ FUNÇÕES DO JUMP MENU ============

/**
 * Gera o menu suspenso com os tags de equipamentos.
 * Este menu lista os tags definidos em cada campo para permitir navegação rápida.
 * Cada option possui como valor o id do form-group correspondente, permitindo rolar
 * diretamente até o campo selecionado.
 */
function generateJumpMenu() {
    const jumpMenu = document.getElementById('jumpMenu');
    const jumpMenuContainer = document.getElementById('jumpMenuContainer');
    if (!jumpMenu || !jumpMenuContainer) return;

    // Se houver tags, exibe o container e preenche o select
    if (JUMP_MENU_TAGS.length > 0) {
        jumpMenuContainer.style.display = 'block';
        JUMP_MENU_TAGS.forEach(item => {
            const option = document.createElement('option');
            // Prefixamos o id com 'group-' para evitar colisões com outros elementos
            option.value = `group-${item.id}`;
            option.textContent = item.tag;
            jumpMenu.appendChild(option);
        });
    }
}

/**
 * Navega para o campo selecionado no Jump Menu.
 * Rola suavemente até o form-group e aplica um destaque temporário.
 * @param {string} elementId ID do form-group para rolar.
 */
window.jumpToField = function(elementId) {
    if (!elementId) return;
    const element = document.getElementById(elementId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        element.classList.add('highlight');
        setTimeout(() => {
            element.classList.remove('highlight');
        }, 1500);
    }
};

// Adiciona um estilo de destaque temporário para o campo selecionado apenas uma vez
(() => {
    const styleEl = document.createElement('style');
    styleEl.textContent = `
        .form-group.highlight {
            box-shadow: 0 0 10px 3px var(--warning-color);
            transition: box-shadow 0.5s ease-in-out;
        }
    `;
    document.head.appendChild(styleEl);
})();

// ============ FUNÇÕES DE ASSINATURA ============

/**
 * Inicializa todos os campos de assinatura após a geração do formulário.
 * Configura eventos de desenho nos canvases e botão de limpeza.
 */
function initializeSignatures() {
    document.querySelectorAll('.signature-canvas').forEach(canvas => {
        const hiddenInput = document.getElementById(canvas.id.replace('_canvas',''));
        const clearBtn = canvas.parentElement.querySelector('.clear-signature');
        const ctx = canvas.getContext('2d');
        let drawing = false;
        // Função para obter a posição do ponteiro (mouse ou toque) relativa ao canvas
        function getPos(e) {
            const rect = canvas.getBoundingClientRect();
            if (e.touches && e.touches.length > 0) {
                return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
            }
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        }
        function startDraw(e) {
            drawing = true;
            ctx.beginPath();
            const pos = getPos(e);
            ctx.moveTo(pos.x, pos.y);
            e.preventDefault();
        }
        function draw(e) {
            if (!drawing) return;
            const pos = getPos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.stroke();
            e.preventDefault();
        }
        function endDraw(e) {
            if (drawing) {
                drawing = false;
                ctx.closePath();
                // Salva a imagem da assinatura no campo hidden em base64
                hiddenInput.value = canvas.toDataURL();
            }
            e.preventDefault();
        }
        // Eventos de mouse
        canvas.addEventListener('mousedown', startDraw);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', endDraw);
        canvas.addEventListener('mouseout', endDraw);
        // Eventos de toque
        canvas.addEventListener('touchstart', startDraw);
        canvas.addEventListener('touchmove', draw);
        canvas.addEventListener('touchend', endDraw);
        canvas.addEventListener('touchcancel', endDraw);
        // Botão limpar
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                hiddenInput.value = '';
            });
        }
        // Se já houver uma assinatura salva, exibe-a no canvas
        if (hiddenInput && hiddenInput.value) {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            };
            img.src = hiddenInput.value;
        }
    });
}

// Expõe a função globalmente para uso externo
window.initializeSignatures = initializeSignatures;
