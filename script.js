// =========================================================================
// VARIÁVEIS GLOBAIS
// =========================================================================

// Identifica o tipo de formulário a partir do atributo data-form-type no <body>.
const formType = document.body?.dataset?.formType || 'interno';
const STORAGE_KEY = formType === 'externo' ? 'inspecao_dados_externo' : 'inspecao_dados_interno';
const LAST_NAMES_KEY = formType === 'externo' ? 'inspecao_nomes_externo' : 'inspecao_nomes_interno';

// Se for "interno", a FORM_STRUCTURE deve vir de 'data_structure_interno.js'
// Se for "externo", a FORM_STRUCTURE deve vir de 'data_structure.js'
// A variável FORM_STRUCTURE é assumida como carregada globalmente.

let formDataState = loadData(); // Carrega dados do localStorage
let lastNames = loadLastNames(); // Carrega nomes sugeridos
let activeWindowName = null;

// VARIÁVEL CRÍTICA: Armazena objetos File/Blob (arquivos de anomalias e assinatura)
window.fileStorage = {}; 

// Referências DOM
const windowsGrid = document.querySelector('.windows-grid');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const formFieldsDiv = document.getElementById('formFields');
const windowForm = document.getElementById('windowForm');
const submitReportButton = document.getElementById('submitReport');
const jumpMenu = document.getElementById('jumpMenu');
const modalClose = document.getElementById('modalClose'); 
const modalCancel = document.getElementById('modalCancel'); 
const tagMenuModal = document.getElementById('tagMenuModal');

// Variáveis de Canvas para Assinatura
let signatureCanvas, signatureCtx, isDrawing = false;

// URLs dos WebApps (Mantenha as suas URLs reais)
const SCRIPT_URL_INTERNA = 'https://script.google.com/macros/s/AKfycbztFYnJDpSu796wPyoInzn1vpIRCNcdlkhUCaNAPzZo7emBBV2E7sP92zZlgA_THH6S/exec'; // EXEMPLO: SUBSTITUA!
const SCRIPT_URL_EXTERNA = 'https://script.google.com/macros/s/AKfycbwPz26F80W687Y4i8s_f3Qo7N5a3L4R0Vp0R-5S3I0H3E92B/exec'; // EXEMPLO: SUBSTITUA!


// =========================================================================
// 1. UTILITÁRIOS DE PERSISTÊNCIA E LÓGICA DE DADOS
// =========================================================================

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

function base64ToBlob(base64String) {
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

function getCurrentDate() {
    return new Date().toISOString().split('T')[0];
}

function getCurrentTime() {
    return new Date().toTimeString().slice(0, 5);
}

// =========================================================================
// 2. RENDERIZAÇÃO E GRID
// =========================================================================

function initializeGrid() {
    if (!windowsGrid || typeof FORM_STRUCTURE === 'undefined') return; 
    windowsGrid.innerHTML = '';
    jumpMenu.innerHTML = '<option value="">Navegação Rápida (Tags)</option>';
    
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const section = FORM_STRUCTURE[sectionKey];

        // 1. Criar opção no menu de Navegação Rápida
        const option = document.createElement('option');
        option.value = sectionKey;
        option.textContent = `${section.icon} ${section.title}`;
        jumpMenu.appendChild(option);

        // 2. Criar Janela no Grid
        const windowDiv = document.createElement('div');
        windowDiv.className = 'window-card';
        windowDiv.id = `card-${sectionKey}`;
        windowDiv.dataset.section = sectionKey;
        
        windowDiv.innerHTML = `
            <h2>${section.icon} ${section.title}</h2>
            <p id="status-${sectionKey}">Faltando dados</p>
            <button class="edit-button">Editar</button>
        `;
        const editButton = windowDiv.querySelector('.edit-button');
        if (editButton) {
            editButton.addEventListener('click', () => openModal(sectionKey));
        }
        windowsGrid.appendChild(windowDiv);
        
        if (!formDataState[sectionKey]) {
             formDataState[sectionKey] = {};
        }
    });

    const jumpMenuContainer = document.getElementById('jumpMenuContainer');
    if (jumpMenuContainer) {
        jumpMenuContainer.style.display = 'block';
    }
    updateAllWindowStatuses();
}

/**
 * Lógica para criar o menu de tags no modal (usado na Inspeção Interna).
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
        // Lógica de cor (mantida da solução interna original)
        const hue = Math.floor((index / Math.max(total, 1)) * 360);
        span.style.backgroundColor = `hsl(${hue}, 60%, 50%)`;
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


// =========================================================================
// 3. MODAL E GERENCIAMENTO DE CAMPOS (UNIFICADO)
// =========================================================================

function openModal(sectionKey) {
    if (!modalOverlay) return; 
    activeWindowName = sectionKey;
    const section = FORM_STRUCTURE[sectionKey];
    modalTitle.textContent = `${section.icon} ${section.title}`;
    formFieldsDiv.innerHTML = '';
    tagMenuModal.innerHTML = ''; // Limpa o menu de tags

    const jumpTags = [];

    // Renderizar campos
    section.fields.forEach(field => {
        const fieldGroup = createFieldElement(field);
        formFieldsDiv.appendChild(fieldGroup);
        
        // Coleta tags para o menu interno do modal (se for o formulário interno)
        if (field.tag && formType === 'interno') {
             jumpTags.push({ tag: field.tag, id: `group-${field.name}` });
        }
    });

    // Inserir o menu de tags (apenas para o form interno)
    if (formType === 'interno' && jumpTags.length > 0) {
        const menu = createTagMenu(jumpTags);
        if (menu) {
            tagMenuModal.appendChild(menu);
            tagMenuModal.style.display = 'flex';
        } else {
            tagMenuModal.style.display = 'none';
        }
    } else {
        tagMenuModal.style.display = 'none';
    }

    // Preencher com dados salvos e inicializar canvas
    loadFormData(sectionKey);
    
    const hasSignature = section.fields.some(f => f.type === 'signature');
    if (hasSignature) {
        initializeSignatureCanvas();
    }
    
    // Preenche campos automáticos (data, hora, nomes sugeridos)
    initializeAutomaticFields(sectionKey);
    
    modalOverlay.style.display = 'flex';
}

function initializeAutomaticFields(windowId) {
    if (windowId !== 'dados-iniciais') return;

    const dataField = document.getElementById('data');
    const horaInicialField = document.getElementById('hora_inicial');
    const operadorField = document.getElementById('operador');
    const supervisorField = document.getElementById('supervisor');

    // Preenche data e hora inicial se estiverem vazios
    if (dataField && !dataField.value) {
        dataField.value = getCurrentDate();
        handleFieldChange('data', getCurrentDate());
    }
    if (horaInicialField && !horaInicialField.value) {
        horaInicialField.value = getCurrentTime();
        handleFieldChange('hora_inicial', getCurrentTime());
    }

    // Preenche nomes sugeridos
    if (operadorField && lastNames.operador && !operadorField.value) {
        operadorField.value = lastNames.operador;
        handleFieldChange('operador', lastNames.operador);
    }
    if (supervisorField && lastNames.supervisor && !supervisorField.value) {
        supervisorField.value = lastNames.supervisor;
        handleFieldChange('supervisor', lastNames.supervisor);
    }
}

/**
 * Função genérica para lidar com a mudança de valor de um campo simples.
 */
function handleFieldChange(fieldName, value) {
    if (!formDataState[activeWindowName]) {
        formDataState[activeWindowName] = {};
    }
    formDataState[activeWindowName][fieldName] = value;
    saveData(formDataState);
    
    // Atualiza indicador de status se for o caso
    const fieldConfig = FORM_STRUCTURE[activeWindowName].fields.find(f => f.name === fieldName);
    if (fieldConfig && fieldConfig.type === 'status') {
         const indicator = document.getElementById(`indicator-${fieldName}`);
         if (indicator) {
             indicator.className = 'status-indicator ' + getStatusColorClass(value);
         }
    }
}

function createFieldElement(field) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'form-group';
    fieldGroup.id = `group-${field.name}`;

    const currentValue = formDataState[activeWindowName]?.[field.name] || '';

    const requiredAttr = field.required ? 'required' : '';
    const readonlyAttr = field.readonly ? 'readonly' : '';
    const placeholderAttr = field.placeholder ? `placeholder="${field.placeholder}"` : '';
    
    let indicatorHTML = '';
    let unitHTML = field.unit ? `<span class="unit">${field.unit}</span>` : '';
    let inputHTML = '';

    // TRATAMENTO DA ASSINATURA
    if (field.type === 'signature') {
        fieldGroup.className += ' signature-container';
        fieldGroup.innerHTML = `
            <label>${field.label} ${field.required ? '*' : ''}</label>
            <canvas id="signatureCanvas" width="350" height="150" style="border: 1px solid #ccc; touch-action: none; background-color: white;"></canvas>
            <input type="hidden" id="${field.name}" name="${field.name}" value="${currentValue}">
            <div class="signature-controls">
                <button type="button" id="clearSignatureButton" class="btn-secondary">Limpar</button>
                <p class="signature-hint">Desenhe sua assinatura acima.</p>
            </div>
        `;
        return fieldGroup;
    } 
    // TRATAMENTO DE ARQUIVOS
    else if (field.type === 'file') {
         // Verifica se existe a flag no localStorage OU se existe o File na memória
         const fileIsSet = (currentValue && currentValue.startsWith('FILE_SET_')) || window.fileStorage[field.name];
         const fileStatusText = fileIsSet ? `Arquivo Selecionado: ${window.fileStorage[field.name]?.name || 'sim'}` : 'Nenhum arquivo';
         const fileStatusClass = fileIsSet ? 'file-set' : 'file-unset';
         
         inputHTML = `
            <input type="file" id="${field.name}" name="${field.name}" ${requiredAttr} accept="${field.accept || ''}"
                   onchange="handleFileChange(this, '${field.name}')">
            <label for="${field.name}" class="custom-file-upload">
                Escolher Arquivo
            </label>
            <span id="status-${field.name}" class="file-status ${fileStatusClass}">${fileStatusText}</span>
         `;

    }
    // TRATAMENTO DE STATUS/SELECT
    else if (field.type === 'select' || field.type === 'status') {
         if (field.type === 'status') {
             indicatorHTML = `<span id="indicator-${field.name}" class="status-indicator ${getStatusColorClass(currentValue)}"></span>`;
         }
         let optionsHTML = `<option value="" disabled ${!currentValue ? 'selected' : ''}>Selecione...</option>`;
         field.options.forEach(optionValue => {
             const selected = optionValue.toString() === currentValue.toString() ? 'selected' : '';
             optionsHTML += `<option value="${optionValue}" ${selected}>${optionValue}</option>`;
         });
         const onChange = field.type === 'status' 
             ? `onchange="handleFieldChange('${field.name}', this.value)"`
             : `onchange="handleFieldChange('${field.name}', this.value)"`;

         inputHTML = `<select id="${field.name}" name="${field.name}" ${requiredAttr} ${onChange}>${optionsHTML}</select>`;
    }
    // TRATAMENTO DE RANGE
    else if (field.type === 'range') {
        const rangeMin = field.min || 0;
        const rangeMax = field.max || 100;
        const rangeStep = field.step || 1;
        const displayValue = currentValue === '' ? (field.default || rangeMin) : currentValue;

        inputHTML = `
            <div class="range-container">
                <input type="range" id="${field.name}" name="${field.name}" min="${rangeMin}" max="${rangeMax}" step="${rangeStep}" value="${displayValue}" 
                       oninput="document.getElementById('display-${field.name}').textContent=this.value; handleFieldChange('${field.name}', this.value)" ${requiredAttr}>
                <span class="range-value" id="display-${field.name}">${displayValue}</span>
                ${unitHTML}
            </div>
        `;
        unitHTML = ''; // Limpa a unidade para não duplicar no label
    }
    // TRATAMENTO DE TEXT, NUMBER, DATE, TIME, TEXTAREA
    else {
        const type = field.type === 'textarea' ? 'textarea' : field.type;
        const tag = field.type === 'textarea' ? 'textarea' : 'input';
        
        const onChange = `onchange="handleFieldChange('${field.name}', this.value)"`;
        
        if (tag === 'input') {
            inputHTML = `<input type="${type}" id="${field.name}" name="${field.name}" value="${currentValue}" ${requiredAttr} ${readonlyAttr} ${placeholderAttr} ${onChange}>`;
        } else {
            inputHTML = `<textarea id="${field.name}" name="${field.name}" rows="3" ${requiredAttr} ${readonlyAttr} ${placeholderAttr} ${onChange}>${currentValue}</textarea>`;
        }
    }
    
    // Estrutura o HTML do grupo de formulário
    fieldGroup.innerHTML = `
        <label for="${field.name}">
            ${indicatorHTML}
            ${field.label} ${field.unit && field.type !== 'range' ? `(${field.unit})` : ''} ${field.required ? ' *' : ''}
        </label>
        <div class="input-wrapper">${inputHTML}</div>
    `;

    return fieldGroup;
}


function loadFormData(sectionKey) {
    // A lógica de preenchimento está embutida no createFieldElement ao usar 'currentValue'
    // Apenas a assinatura requer carregamento manual no canvas.
    
    // Preenche campos de nomes sugeridos (para dados-iniciais)
    if (sectionKey === 'dados-iniciais') {
        const operador = document.getElementById('operador');
        const supervisor = document.getElementById('supervisor');
        if (operador && !operador.value) operador.value = lastNames.operador || '';
        if (supervisor && !supervisor.value) supervisor.value = lastNames.supervisor || '';
    }
}

function handleFileChange(inputElement, fieldName) {
    const statusSpan = document.getElementById(`status-${fieldName}`);
    
    if (inputElement.files.length > 0) {
        const file = inputElement.files[0];
        window.fileStorage[fieldName] = file;
        formDataState[activeWindowName][fieldName] = `FILE_SET_${fieldName}`;
        
        statusSpan.textContent = `Arquivo Selecionado: ${file.name}`;
        statusSpan.classList.add('file-set');
    } else {
        delete window.fileStorage[fieldName];
        formDataState[activeWindowName][fieldName] = '';
        
        statusSpan.textContent = 'Nenhum arquivo';
        statusSpan.classList.remove('file-set');
    }
    saveData(formDataState);
}


// =========================================================================
// 4. LÓGICA DO CANVAS DE ASSINATURA
// =========================================================================

function initializeSignatureCanvas() {
    signatureCanvas = document.getElementById('signatureCanvas');
    const signatureField = FORM_STRUCTURE[activeWindowName].fields.find(f => f.type === 'signature');
    const hiddenInput = document.getElementById(signatureField?.name);
    
    if (!signatureCanvas || !hiddenInput) return;
    
    signatureCtx = signatureCanvas.getContext('2d');
    
    signatureCtx.lineWidth = 3;
    signatureCtx.lineCap = 'round';
    signatureCtx.strokeStyle = '#000';
    signatureCtx.fillStyle = '#fff';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height); 
    
    // Recarrega Base64 se existir
    if (hiddenInput.value) {
         const img = new Image();
         img.onload = () => {
             signatureCtx.drawImage(img, 0, 0, signatureCanvas.width, signatureCanvas.height);
         };
         img.src = hiddenInput.value;
    }

    // Configuração de Eventos
    function getPos(e) {
        const rect = signatureCanvas.getBoundingClientRect();
        const clientX = e.clientX || e.touches?.[0]?.clientX;
        const clientY = e.clientY || e.touches?.[0]?.clientY;
        if (clientX === undefined || clientY === undefined) return { x: 0, y: 0 };
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function startDrawing(e) {
        isDrawing = true;
        const pos = getPos(e);
        signatureCtx.beginPath();
        signatureCtx.moveTo(pos.x, pos.y);
        e.preventDefault();
    }

    function draw(e) {
        if (!isDrawing) return;
        const pos = getPos(e);
        signatureCtx.lineTo(pos.x, pos.y);
        signatureCtx.stroke();
        e.preventDefault();
    }

    function stopDrawing(e) {
        if (isDrawing) {
             isDrawing = false;
             signatureCtx.closePath();
             // Salva a imagem da assinatura no input hidden como Base64
             hiddenInput.value = signatureCanvas.toDataURL();
             // Salva no estado
             handleFieldChange(hiddenInput.name, hiddenInput.value);
        }
        e.preventDefault();
    }

    function clearSignature(e) {
        e.preventDefault();
        signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        signatureCtx.fillStyle = '#fff';
        signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        hiddenInput.value = '';
        // Força a atualização do estado
        handleFieldChange(hiddenInput.name, '');
        updateWindowStatus(activeWindowName); 
    }
    
    // Re-obter o contêiner (para evitar duplicação de listeners)
    const container = signatureCanvas.parentElement;
    container.replaceWith(container.cloneNode(true));
    
    // Re-obter elementos de controle
    const newContainer = document.getElementById(`group-${signatureField.name}`);
    signatureCanvas = newContainer.querySelector('canvas');
    const clearButton = newContainer.querySelector('#clearSignatureButton');
    
    // Adicionar Listeners
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseout', stopDrawing);
    signatureCanvas.addEventListener('touchstart', startDrawing);
    signatureCanvas.addEventListener('touchmove', draw);
    signatureCanvas.addEventListener('touchend', stopDrawing);
    signatureCanvas.addEventListener('touchcancel', stopDrawing);
    if (clearButton) clearButton.addEventListener('click', clearSignature);
}


// =========================================================================
// 5. LÓGICA DE ENVIO E GERENCIAMENTO DE ESTADO
// =========================================================================

function saveFormData() {
    const section = FORM_STRUCTURE[activeWindowName];
    let isComplete = true;

    // 1. Coletar dados dos campos e verificar completude
    section.fields.forEach(field => {
        const element = document.getElementById(field.name);
        
        if (element) {
            let value;
            if (field.type === 'file') {
                 value = formDataState[activeWindowName][field.name]; 
            } else if (field.type === 'signature') {
                 value = element.value; 
            } else if (element.type === 'checkbox') {
                 value = element.checked;
            } else {
                 value = element.value;
            }
            
            // Salva o valor original na seção
            formDataState[activeWindowName][field.name] = value;
            
            // Checar obrigatoriedade
            if (field.required) {
                if (field.type === 'signature' && (!value || !value.startsWith('data:image'))) {
                     isComplete = false;
                } else if (field.type === 'file' && (!value || !value.startsWith('FILE_SET_') || !window.fileStorage[field.name])) {
                     isComplete = false;
                } else if (!value) {
                     isComplete = false;
                }
            }
        } else if (field.required && field.type !== 'signature') { // Assinatura tratada acima
             isComplete = false;
        }
    });
    
    if (activeWindowName === 'dados-iniciais') {
         const operador = formDataState['dados-iniciais'].operador;
         const supervisor = formDataState['dados-iniciais'].supervisor;
         lastNames.operador = operador || '';
         lastNames.supervisor = supervisor || '';
         saveLastNames(lastNames);
         
         // Atualiza hora final se for o formulário interno
         if (formType === 'interno') {
            const horaFinal = document.getElementById('hora_final');
            if (horaFinal) {
                horaFinal.value = getCurrentTime();
                formDataState['dados-iniciais'].hora_final = horaFinal.value;
            }
         }
    }
    
    // 2. Atualizar Estado e Persistência
    saveData(formDataState);
    
    // 3. Fechar Modal
    modalOverlay.style.display = 'none';
    updateWindowStatus(activeWindowName); // Re-calcula e atualiza o status visual
    checkAllSectionsComplete();
}

function checkWindowCompletion(windowId) {
    const windowConfig = FORM_STRUCTURE[windowId];
    const currentData = formDataState[windowId] || {};
    
    if (!windowConfig) return false;
    
    return windowConfig.fields.every(field => {
        if (field.required) {
            const value = currentData[field.name];
            
            if (field.type === 'signature') {
                 return value && value.startsWith('data:image');
            }
            if (field.type === 'file') {
                 return value && value.startsWith('FILE_SET_') && window.fileStorage[field.name];
            }
            
            return value !== undefined && value !== null && value !== '';
        }
        return true;
    });
}

function updateWindowStatus(sectionKey) {
    const card = document.getElementById(`card-${sectionKey}`);
    const statusP = document.getElementById(`status-${sectionKey}`);
    
    const isComplete = checkWindowCompletion(sectionKey);
    
    if (card && statusP) {
        if (isComplete) {
            card.classList.remove('incomplete');
            card.classList.add('complete');
            statusP.textContent = 'Completo';
        } else {
            card.classList.remove('complete');
            card.classList.add('incomplete');
            statusP.textContent = 'Faltando dados';
        }
    }
}

function updateAllWindowStatuses() {
     Object.keys(FORM_STRUCTURE).forEach(updateWindowStatus);
}

function checkAllSectionsComplete() {
    const allComplete = Object.keys(FORM_STRUCTURE).every(key => checkWindowCompletion(key));

    submitReportButton.disabled = !allComplete;
    if (submitReportButton.disabled) {
        submitReportButton.textContent = 'Preencha todos os campos';
    } else {
        submitReportButton.textContent = 'Enviar Relatório';
    }
}

async function submitReport() {
    if (submitReportButton.disabled) return;

    if (!confirm("Tem certeza que deseja enviar o relatório? Não será possível editar depois.")) {
        return;
    }

    if (typeof showSpinner === 'function') {
        showSpinner('Enviando relatório e arquivos. Aguarde...');
    }
    
    const url = formType === 'interno' ? SCRIPT_URL_INTERNA : SCRIPT_URL_EXTERNA;
    const finalFormData = new FormData();

    // 1. Coletar e mapear todos os dados de texto e arquivos
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const sectionData = formDataState[sectionKey] || {};
        const sectionFields = FORM_STRUCTURE[sectionKey].fields;

        sectionFields.forEach(field => {
            const fieldName = field.name;
            let dataName = fieldName;

            // Mapeamento CRÍTICO do nome do campo de anomalia (para o Apps Script)
            if (fieldName.startsWith('imagem_')) {
                dataName = 'foto_anomalia' + fieldName.split('_')[1];
            }

            const value = sectionData[fieldName];

            if (field.type === 'file' && value && value.startsWith('FILE_SET_')) {
                 // 1a. Tratar arquivos de anomalia (pegar o objeto File da memória)
                const fileObj = window.fileStorage[fieldName];
                if (fileObj) {
                    finalFormData.append(dataName, fileObj, fileObj.name);
                }
            } else if (field.type === 'signature' && value && value.startsWith('data:image')) {
                // 1b. Tratar Assinatura (converter Base64 para Blob)
                const signatureBlob = base64ToBlob(value);
                if (signatureBlob) {
                     finalFormData.append(fieldName, signatureBlob, `${fieldName}.png`); 
                }
            } else {
                // 1c. Tratar dados de texto
                if (value && !value.startsWith('FILE_SET_')) { 
                    finalFormData.append(dataName, value);
                }
            }
        });
    });

    // 2. Enviar para o Apps Script
    try {
        const response = await fetch(url, {
            method: 'POST',
            body: finalFormData,
        });

        const result = await response.text();

        if (result.trim() === 'ok') {
            alert('Relatório enviado com sucesso!');
            
            // Limpa dados e arquivos após envio bem-sucedido
            localStorage.removeItem(STORAGE_KEY);
            window.fileStorage = {}; 
            
            window.location.reload(); 
        } else {
            alert('Erro ao enviar o relatório. Resposta: ' + result);
        }

    } catch (error) {
        alert('Erro de rede ou servidor: ' + error.message);
    } finally {
        if (typeof hideSpinner === 'function') {
            hideSpinner();
        }
    }
}


// =========================================================================
// 6. EVENT LISTENERS E INICIALIZAÇÃO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    if (typeof FORM_STRUCTURE === 'undefined') {
        console.error("FORM_STRUCTURE não está definida. Verifique se o arquivo de estrutura de dados está carregado antes do script.js.");
        return;
    }
    
    // 1. Inicia o grid principal
    initializeGrid();
    
    // 2. Eventos do Modal
    if (modalClose) modalClose.addEventListener('click', () => modalOverlay.style.display = 'none');
    if (modalCancel) modalCancel.addEventListener('click', () => modalOverlay.style.display = 'none');
    
    if (windowForm) {
        windowForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveFormData(); 
        });
    }
    
    // 3. Evento de envio final
    if (submitReportButton) {
        submitReportButton.addEventListener('click', submitReport);
    }
    
    // 4. Evento do Jump Menu (principal)
    if (jumpMenu) {
        jumpMenu.addEventListener('change', (e) => {
            if (e.target.value) {
                const targetElement = document.getElementById(`card-${e.target.value}`);
                if (targetElement) {
                    targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    // Adicionar um destaque visual temporário se desejar
                    targetElement.classList.add('highlight');
                    setTimeout(() => targetElement.classList.remove('highlight'), 1500);
                }
            }
        });
    }

    // 5. Atualiza o status inicial do botão de envio
    checkAllSectionsComplete();
});
