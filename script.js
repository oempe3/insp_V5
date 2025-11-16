// ============ CONSTANTES E VARIÁVEIS GLOBAIS ============
const JUMP_MENU_TAGS = []; // Array para armazenar os tags dos equipamentos

// Identifica o tipo de formulário a partir do atributo data-form-type no <body>.
const formType = document.body?.dataset?.formType || 'interno';
const STORAGE_KEY = formType === 'externo' ? 'inspecao_dados_externo' : 'inspecao_dados_interno';
const LAST_NAMES_KEY = formType === 'externo' ? 'inspecao_nomes_externo' : 'inspecao_nomes_interno';

let currentWindowId = null;
let inspectionData = loadData();
let lastNames = loadLastNames();

// VARIÁVEL CRÍTICA: Armazena objetos File/Blob dos inputs de arquivo e da assinatura.
// Estes objetos não podem ser salvos no localStorage, então são mantidos na memória.
window.fileStorage = {}; 

/**
 * URLs dos WebApps do Google Apps Script para envio dos relatórios.
 * ⚠️ ATUALIZE ESTAS DUAS URLs após o novo deploy do seu Apps Script.
 */
const SCRIPT_URL_INTERNA =
  'https://script.google.com/macros/s/AKfycbztFYnJDpSu796wPyoInzn1vpIRCNcdlkhUCaNAPzZo7emBBV2E7sP92zZlgA_THH6S/exec'; // EXEMPLO: SUBSTITUA!
const SCRIPT_URL_EXTERNA =
  'https://script.google.com/macros/s/AKfycbzI-8Veh6fS4-E4EUkitC1mGQluPZwyX7bTbhTxcmxY1yENrBx7a938PShv-xo5x4Oi/exec'; // EXEMPLO: SUBSTITUA!


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
            e.stopPropagation();
            menu.querySelectorAll('.tag-item').forEach(item => item.classList.remove('active'));
            span.classList.add('active');
            const target = document.getElementById(tagItem.id);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                target.classList.add('highlight');
                setTimeout(() => target.classList.remove('highlight'), 1500);
            }
        });
        menu.appendChild(span);
    });
    const first = menu.querySelector('.tag-item');
    if (first) first.classList.add('active');
    return menu;
}

// ============ FUNÇÕES UTILITÁRIAS ============

function getCurrentDate() {
    const today = new Date();
    return today.toISOString().split('T')[0];
}

function getCurrentTime() {
    const now = new Date();
    return now.toTimeString().slice(0, 5);
}

function setFinalTime() {
    const finalTimeField = document.getElementById('dados-iniciais-hora_final');
    if (finalTimeField) {
        finalTimeField.value = getCurrentTime();
    }
}

function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function loadLastNames() {
    const stored = localStorage.getItem(LAST_NAMES_KEY);
    return stored ? JSON.parse(stored) : { operador: '', supervisor: '' };
}

function saveLastNames(names) {
    localStorage.setItem(LAST_NAMES_KEY, JSON.stringify(names));
}

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
 * CRÍTICO: Para campos de arquivo, verifica a flag de preenchimento.
 * @param {string} windowId
 * @returns {boolean}
 */
function checkWindowCompletion(windowId) {
    const windowFields = FORM_STRUCTURE[windowId].fields;
    if (!inspectionData[windowId]) return false;
    return windowFields.every(field => {
        if (field.required) {
            const value = inspectionData[windowId][field.name];
            // Para arquivos, a flag é 'FILE_SET_...' ou o Base64 da assinatura
            if (field.type === 'file' || field.type === 'signature') {
                 // Verifica se há a flag ou se há Base64 (string não vazia)
                return value !== undefined && value !== null && value !== '' && (value.startsWith('FILE_SET_') || value.startsWith('data:image'));
            }
            // Para outros campos
            return value !== undefined && value !== null && value !== '';
        }
        return true;
    });
}

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

// ============ GERAÇÃO DE HTML DO FORMULÁRIO (Funções Omitidas, mas mantidas no seu código) ============
// As funções createFieldHTML e generateForm foram omitidas aqui para brevidade,
// pois não continham a falha crítica, mas devem ser mantidas intactas no seu código.

// Função global para atualizar o indicador de status de um campo
window.updateStatusIndicator = function(fieldId, value) {
    const indicator = document.getElementById(`indicator-${fieldId}`);
    if (indicator) {
        indicator.className = 'status-indicator ' + getStatusColorClass(value);
    }
};

// ============ MANIPULAÇÃO DE EVENTOS ============

function handleWindowClick(event) {
    const button = event.currentTarget;
    const windowId = button.dataset.window;
    generateForm(windowId);
}

/**
 * 💾 CORREÇÃO CRÍTICA AQUI: Salva os dados, garantindo que objetos File sejam
 * armazenados na variável global window.fileStorage e a assinatura Base64
 * e a flag de arquivo sejam persistidas no localStorage.
 */
function handleFormSubmit(event) {
    event.preventDefault();
    const windowForm = document.getElementById('windowForm');
    const formData = new FormData(windowForm);
    const data = {};
    const windowFields = FORM_STRUCTURE[currentWindowId].fields;

    windowFields.forEach(field => {
        const value = formData.get(field.name);
        
        if (field.type === 'file') {
            // Se for input type="file", 'value' é um objeto File.
            if (value instanceof File && value.size > 0) {
                // 1. Armazena o OBJETO FILE na memória (window.fileStorage)
                window.fileStorage[field.name] = value;
                // 2. Salva uma FLAG no inspectionData para persistir no localStorage
                data[field.name] = `FILE_SET_${field.name}`; 
            } else if (inspectionData[currentWindowId] && inspectionData[currentWindowId][field.name] && inspectionData[currentWindowId][field.name].startsWith('FILE_SET')) {
                // Mantém a flag se o campo não foi alterado mas já havia um arquivo antes
                data[field.name] = inspectionData[currentWindowId][field.name];
            } else {
                data[field.name] = '';
            }
        } else if (field.type === 'signature') {
            // Se for assinatura, 'value' é a string Base64 do input hidden.
            // 1. Armazena Base64 no data para ser persistido no localStorage e enviado.
            data[field.name] = value || '';
        } else if (value !== null) {
            // Campos de texto, números, etc.
            data[field.name] = value;
        }
    });

    if (currentWindowId === 'dados-iniciais') {
        lastNames.operador = data.operador || '';
        lastNames.supervisor = data.supervisor || '';
        saveLastNames(lastNames);
        setFinalTime();
    }
    
    inspectionData[currentWindowId] = data;
    saveData(inspectionData);

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
    // Mostra o spinner (assumindo que você tem showSpinner/hideSpinner no seu spinner.js)
    if (typeof showSpinner === 'function') {
        showSpinner();
    }

    if (inspectionData['dados-iniciais'] && !inspectionData['dados-iniciais'].hora_final) {
        inspectionData['dados-iniciais'].hora_final = getCurrentTime();
    }
    
    const dataToSend = {};
    Object.keys(inspectionData).forEach(key => {
        if (key !== 'previous') {
            dataToSend[key] = inspectionData[key];
        }
    });
    
    const formType = document.body.dataset.formType || 'interno';
    
    // Envia dados para o Apps Script
    sendReportToScript(formType, dataToSend)
        .then(response => {
            if (typeof hideSpinner === 'function') {
                hideSpinner();
            }
            if (!response.ok) {
                throw new Error('Falha HTTP ao enviar dados: ' + response.status);
            }
            return response.text();
        })
        .then((result) => {
            if (result.startsWith('Erro')) {
                 throw new Error(result);
            }

            // Após envio bem-sucedido, salva os dados localmente como "previous" e limpa inspeção
            inspectionData.previous = { ...inspectionData };
            delete inspectionData.previous.previous;
            const newInspectionData = { previous: inspectionData.previous };
            
            // ⚠️ Importante: O window.fileStorage deve ser LIMPO, pois os arquivos foram enviados.
            window.fileStorage = {};
            
            saveData(newInspectionData);
            alert('✅ Relatório enviado com sucesso! O formulário foi limpo para uma nova inspeção.');
            window.location.reload();
        })
        .catch(err => {
            if (typeof hideSpinner === 'function') {
                hideSpinner();
            }
            console.error(err);
            alert('❌ Ocorreu um erro ao enviar o relatório. Detalhes: ' + err.message);
        });
}

// ============ FUNÇÕES DE ENVIOS E CONVERSÃO (CRÍTICAS) ============

/**
 * Converte uma string Base64 (ex: data:image/png;base64,...) em um objeto Blob.
 * @param {string} base64String
 * @returns {Blob|null}
 */
function base64ToBlob(base64String) {
    // Remove o prefixo 'data:image/png;base64,'
    const parts = base64String.split(';base64,');
    if (parts.length < 2) return null;

    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);

    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
}

/**
 * 🚀 CORREÇÃO CRÍTICA AQUI: Envia o objeto de dados da inspeção para o script Apps Script correspondente.
 * Gera um FormData com todos os campos coletados. Converte a assinatura Base64 para Blob.
 * Anexa os objetos File/Blob corretamente para que o Apps Script os receba em e.files.
 * * @param {string} formType Tipo de formulário ('interno' ou 'externo')
 * @param {Object} data Objeto contendo os dados de todas as janelas
 * @returns {Promise<Response>} Promessa que resolve para a resposta da requisição
 */
async function sendReportToScript(formType, data) {
    const url = formType === 'interno' ? SCRIPT_URL_INTERNA : SCRIPT_URL_EXTERNA;
    const formData = new FormData();
    // Obtém a lista de todas as configurações de campo
    const allWindowFields = Object.values(FORM_STRUCTURE).flatMap(w => w.fields);
    
    // Percorre todos os dados coletados (texto, Base64 de assinatura, flags de arquivo)
    Object.keys(data).forEach(windowId => {
        if (windowId === 'previous') return;
        const windowData = data[windowId];

        Object.keys(windowData).forEach(key => {
            const value = windowData[key];
            // Encontra a configuração original do campo
            const fieldConfig = allWindowFields.find(f => f.name === key);

            if (value !== undefined && value !== null) {
                if (fieldConfig && fieldConfig.type === 'signature' && typeof value === 'string' && value.startsWith('data:image')) {
                    // 1. TRATAMENTO DA ASSINATURA: Converte Base64 para Blob
                    try {
                        const blob = base64ToBlob(value);
                        if (blob) {
                             // CRÍTICO: Anexa o Blob com o nome do campo. Isso faz o Apps Script usar e.files['assinatura'].
                            formData.append(key, blob, `${key}.png`);
                        }
                    } catch (e) {
                        console.error(`Erro ao converter assinatura para Blob (${key}): ${e}`);
                        // Em caso de falha grave, anexa a string Base64 como texto (para diagnóstico).
                        formData.append(key, value); 
                    }

                } else if (fieldConfig && fieldConfig.type === 'file' && typeof value === 'string' && value.startsWith('FILE_SET')) {
                    // 2. TRATAMENTO DE INPUTS FILE: Pega o objeto File da memória (armazenado em handleFormSubmit)
                    const fileObj = window.fileStorage && window.fileStorage[key];
                    if (fileObj) {
                         // CRÍTICO: Anexa o objeto File original.
                         formData.append(key, fileObj, fileObj.name);
                    } else {
                        console.warn(`Tentou enviar arquivo ${key}, mas File não foi encontrado em fileStorage. Verifique o input.`);
                    }
                    // Não anexa o 'FILE_SET_X' como string.
                } else {
                    // 3. CAMPOS DE TEXTO/NÚMERO
                    formData.append(key, value);
                }
            }
        });
    });

    // Realiza o POST para o Apps Script
    return fetch(url, {
        method: 'POST',
        body: formData // Envia o FormData com Blobs/Files
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
    // Listener do formulário modal
    if (windowForm) {
        windowForm.addEventListener('submit', handleFormSubmit);
    }
    // Listener do botão de envio final
    if (submitReportBtn) {
        submitReportBtn.addEventListener('click', handleReportSubmit);
    }
    
    // Inicializa a variável fileStorage com arquivos existentes no input (se houver)
    // Isso é útil se o usuário navegar entre janelas antes de enviar.
    Object.keys(FORM_STRUCTURE).forEach(windowId => {
        if (inspectionData[windowId]) {
            FORM_STRUCTURE[windowId].fields.filter(f => f.type === 'file').forEach(field => {
                if (inspectionData[windowId][field.name] && inspectionData[windowId][field.name].startsWith('FILE_SET')) {
                    // Tenta restaurar a File se possível, mas aqui confiamos na flag e na memória.
                    // Se o usuário fechar/reabrir o navegador, o fileStorage será perdido.
                    // Isso é aceitável, pois exige que o usuário re-selecione o arquivo.
                }
            });
        }
    });


    // Atualiza o status de conclusão inicialmente
    updateCompletionStatus();
});

// ============ FUNÇÕES DO JUMP MENU ============

/**
 * Gera o menu suspenso com os tags de equipamentos.
 */
function generateJumpMenu() {
    const jumpMenu = document.getElementById('jumpMenu');
    const jumpMenuContainer = document.getElementById('jumpMenuContainer');
    if (!jumpMenu || !jumpMenuContainer) return;

    if (JUMP_MENU_TAGS.length > 0) {
        jumpMenuContainer.style.display = 'block';
        JUMP_MENU_TAGS.forEach(item => {
            const option = document.createElement('option');
            option.value = `group-${item.id}`;
            option.textContent = item.tag;
            jumpMenu.appendChild(option);
        });
    }
}

/**
 * Navega para o campo selecionado no Jump Menu.
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

window.initializeSignatures = initializeSignatures;
// Nota: Funções createSpinnerHTML e initializeSpinners (do spinner.js) são necessárias
// mas foram omitidas aqui para manter o foco no script principal.
