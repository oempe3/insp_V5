// =========================================================================
// VARIÁVEIS GLOBAIS
// =========================================================================
// A FORM_STRUCTURE é carregada de 'data_structure.js' (assumindo que seja para o form externo)

const FORM_TYPE = 'externo'; // Definido explicitamente para o formulário externo
const STORAGE_KEY = 'inspecao_dados_externo';
const LAST_NAMES_KEY = 'inspecao_nomes_externo';

let formDataState = loadData(); // Carrega dados do localStorage
let lastNames = loadLastNames(); // Carrega nomes sugeridos
let activeWindowName = null;

// VARIÁVEL CRÍTICA: Armazena objetos File/Blob (arquivos de anomalias e assinatura)
// Estes objetos são perdidos no localStorage, então são mantidos na memória.
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

// Variáveis de Canvas para Assinatura (para uso interno das funções)
let signatureCanvas, signatureCtx, isDrawing = false;


// =========================================================================
// 1. UTILITÁRIOS DE PERSISTÊNCIA (NOVAS FUNÇÕES CRÍTICAS)
// =========================================================================

/**
 * Carrega o estado do formulário do localStorage.
 */
function loadData() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
}

/**
 * Salva o estado do formulário no localStorage.
 */
function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

/**
 * Carrega nomes para sugestão futura (não implementado totalmente no script, mas bom para ter).
 */
function loadLastNames() {
    const stored = localStorage.getItem(LAST_NAMES_KEY);
    return stored ? JSON.parse(stored) : { operador: '', supervisor: '' };
}

/**
 * Salva nomes para sugestão futura.
 */
function saveLastNames(names) {
    localStorage.setItem(LAST_NAMES_KEY, JSON.stringify(names));
}

/**
 * Converte string Base64 (da assinatura) em objeto Blob para envio.
 */
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


// =========================================================================
// 2. RENDERIZAÇÃO E GRID
// =========================================================================

/**
 * Inicializa o grid de janelas e o menu de navegação rápida.
 */
function initializeGrid() {
    if (!windowsGrid || typeof FORM_STRUCTURE === 'undefined') return; 
    windowsGrid.innerHTML = '';
    
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
        
        // Inicializa o estado se ainda não existir
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
 * Navega rapidamente para a seção clicada no menu suspenso.
 */
window.jumpToField = function(sectionKey) {
    if (sectionKey) {
        const targetElement = document.getElementById(`card-${sectionKey}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
            targetElement.classList.add('highlight');
            setTimeout(() => targetElement.classList.remove('highlight'), 1500);
        }
    }
};


// =========================================================================
// 3. MODAL E GERENCIAMENTO DE CAMPOS
// =========================================================================

/**
 * Abre o modal de edição para uma seção específica.
 */
function openModal(sectionKey) {
    if (!modalOverlay) return; 
    activeWindowName = sectionKey;
    const section = FORM_STRUCTURE[sectionKey];
    modalTitle.textContent = `${section.icon} ${section.title}`;
    formFieldsDiv.innerHTML = '';

    // Renderizar campos
    section.fields.forEach(field => {
        const fieldGroup = createFieldElement(field);
        formFieldsDiv.appendChild(fieldGroup);
    });

    // Preencher com dados salvos e inicializar canvas
    loadFormData(sectionKey);
    
    // Inicializa o Canvas APÓS a renderização no DOM
    const hasSignature = section.fields.some(f => f.type === 'signature');
    if (hasSignature) {
        initializeSignatureCanvas();
    }
    
    modalOverlay.style.display = 'flex';
}

/**
 * Cria o elemento DOM para um campo de formulário.
 */
function createFieldElement(field) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'field-group';
    fieldGroup.id = `group-${field.name}`;

    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.textContent = field.label + (field.unit ? ` (${field.unit})` : '') + (field.required ? ' *' : '');

    let inputElement;

    // TRATAMENTO DO CAMPO DE ASSINATURA
    if (field.type === 'signature') {
        fieldGroup.className += ' signature-container';
        fieldGroup.innerHTML = `
            <label>${field.label} ${field.required ? '*' : ''}</label>
            <canvas id="signatureCanvas" name="${field.name}" width="350" height="150" style="border: 1px solid #ccc; touch-action: none; background-color: white;"></canvas>
            <input type="hidden" id="${field.name}" name="${field.name}">
            <div class="signature-controls">
                <button type="button" id="clearSignatureButton" class="btn-secondary">Limpar</button>
                <p class="signature-hint">Desenhe sua assinatura acima.</p>
            </div>
        `;
        return fieldGroup;
    } 
    // TRATAMENTO DO CAMPO DE ARQUIVO
    else if (field.type === 'file') {
         inputElement = document.createElement('input');
         inputElement.type = 'file';
         inputElement.id = field.name;
         inputElement.name = field.name;
         inputElement.accept = field.accept || 'image/*';
         if (field.required) inputElement.required = true;
         
         // Adiciona um listener para salvar o File object na memória
         inputElement.addEventListener('change', (e) => handleFileChange(e.target, field.name));

         const fileContainer = document.createElement('div');
         fileContainer.className = 'file-input-wrapper';
         
         const customLabel = document.createElement('label');
         customLabel.htmlFor = field.name;
         customLabel.className = 'custom-file-upload';
         customLabel.textContent = 'Escolher Arquivo';
         
         const statusSpan = document.createElement('span');
         statusSpan.id = `status-${field.name}`;
         statusSpan.className = 'file-status';
         statusSpan.textContent = 'Nenhum arquivo';

         fileContainer.appendChild(inputElement);
         fileContainer.appendChild(customLabel);
         fileContainer.appendChild(statusSpan);

         fieldGroup.appendChild(label);
         fieldGroup.appendChild(fileContainer);

         return fieldGroup;
    }
    // TRATAMENTO DE OUTROS CAMPOS (TEXT, NUMBER, SELECT, etc.)
    else if (field.type === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.rows = 3;
    } else if (field.type === 'select' || field.type === 'status') {
        inputElement = document.createElement('select');
        // Adicionar opção inicial vazia
        let defaultSelected = true;
        inputElement.appendChild(new Option('Selecione...', ''));
        field.options.forEach(optionValue => {
            const option = new Option(optionValue, optionValue);
            inputElement.appendChild(option);
        });
    } else {
        inputElement = document.createElement('input');
        inputElement.type = field.type;
        if (field.placeholder) inputElement.placeholder = field.placeholder;
        if (field.min !== undefined) inputElement.min = field.min;
        if (field.max !== undefined) inputElement.max = field.max;
        if (field.step !== undefined) inputElement.step = field.step;
        if (field.default !== undefined) inputElement.value = field.default; 
    }
    
    if (field.required) inputElement.required = true;

    inputElement.id = field.name;
    inputElement.name = field.name;
    
    // Adiciona listener para campos de texto/seleção para salvar no estado (ao sair do campo)
    inputElement.addEventListener('change', (e) => {
         formDataState[activeWindowName][field.name] = e.target.value;
         saveData(formDataState);
    });

    fieldGroup.appendChild(label);
    fieldGroup.appendChild(inputElement);

    return fieldGroup;
}

/**
 * Preenche o formulário modal com os dados atualmente salvos.
 */
function loadFormData(sectionKey) {
    const data = formDataState[sectionKey] || {};
    
    // Percorre todos os campos da seção para preencher
    FORM_STRUCTURE[sectionKey].fields.forEach(field => {
        const fieldName = field.name;
        const value = data[fieldName];
        const fieldElement = document.getElementById(fieldName);
        
        if (fieldElement) {
             // 1. Assinatura: Carrega a string Base64 no input hidden
            if (field.type === 'signature') {
                 fieldElement.value = value || '';
                 // O Canvas é carregado no initializeSignatureCanvas
                 return;
            }
            // 2. Arquivo: Atualiza o status visual
            else if (field.type === 'file') {
                 const statusSpan = document.getElementById(`status-${fieldName}`);
                 // Verifica se existe a flag no localStorage OU se existe o File na memória
                 const fileIsSet = (value && value.startsWith('FILE_SET_')) || window.fileStorage[fieldName];
                 if (statusSpan) {
                     statusSpan.textContent = fileIsSet ? `Arquivo Selecionado: ${window.fileStorage[fieldName]?.name || 'sim'}` : 'Nenhum arquivo';
                     statusSpan.classList.toggle('file-set', fileIsSet);
                 }
                 // O valor do input type="file" não pode ser preenchido por segurança
                 return;
            }
            // 3. Outros campos: Preenche o valor
            else if (fieldElement.type === 'checkbox') {
                 fieldElement.checked = value;
            } else {
                 fieldElement.value = value || '';
            }
        }
    });
}

/**
 * Lida com a mudança no input de arquivo, armazenando o objeto File na memória global.
 */
function handleFileChange(inputElement, fieldName) {
    const statusSpan = document.getElementById(`status-${fieldName}`);
    
    if (inputElement.files.length > 0) {
        const file = inputElement.files[0];
        // 1. Salva o objeto File na memória global (CRÍTICO para o envio)
        window.fileStorage[fieldName] = file;
        // 2. Salva a flag no formDataState (para persistir a indicação no localStorage)
        formDataState[activeWindowName][fieldName] = `FILE_SET_${fieldName}`;
        
        statusSpan.textContent = `Arquivo Selecionado: ${file.name}`;
        statusSpan.classList.add('file-set');
    } else {
        // Remove a flag e o objeto se o arquivo for limpo
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
    const hiddenInput = document.getElementById(FORM_STRUCTURE[activeWindowName].fields.find(f => f.type === 'signature').name);
    
    if (!signatureCanvas || !hiddenInput) return;
    
    signatureCtx = signatureCanvas.getContext('2d');
    
    // Configurações básicas de desenho
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

    // Configuração de Eventos (simplificada e unificada)
    function getPos(e) {
        const rect = signatureCanvas.getBoundingClientRect();
        // Trata eventos de toque e mouse
        const clientX = e.clientX || e.touches[0].clientX;
        const clientY = e.clientY || e.touches[0].clientY;
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
        formDataState[activeWindowName][hiddenInput.name] = '';
        saveData(formDataState);
        updateWindowStatus(activeWindowName); // Atualiza o status para incompleto se for obrigatório
    }
    
    // Limpeza de Listeners (necessário em reabertura de modal)
    signatureCanvas.parentElement.replaceWith(signatureCanvas.parentElement.cloneNode(true));
    signatureCanvas = document.getElementById('signatureCanvas'); // Re-obter o novo elemento

    // Re-obter elementos de controle
    const newHiddenInput = document.getElementById(hiddenInput.name);
    const clearButton = document.getElementById('clearSignatureButton');
    
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

/**
 * Salva os dados do formulário modal no estado global e localStorage.
 */
function saveFormData() {
    const section = FORM_STRUCTURE[activeWindowName];
    let isComplete = true;

    // 1. Coletar dados dos campos normais e verificar completude
    section.fields.forEach(field => {
        const element = document.getElementById(field.name);
        
        if (element) {
            let value;
            if (field.type === 'file') {
                 // Para arquivos, o valor é a flag de que o arquivo existe
                 value = formDataState[activeWindowName][field.name]; 
            } else if (field.type === 'signature') {
                 // Para assinatura, o valor é a string Base64 do input hidden
                 value = element.value; 
            } else if (element.type === 'checkbox') {
                 value = element.checked;
            } else {
                 value = element.value;
            }
            
            // Salva o valor original na seção (ex: imagem_1, assinatura)
            formDataState[activeWindowName][field.name] = value;
            
            // Checar obrigatoriedade
            if (field.required) {
                if (!value || (field.type === 'file' && !window.fileStorage[field.name]) ) {
                    isComplete = false;
                }
            }
        } else if (field.required) {
             // Caso não encontre o elemento (erro de renderização ou campo não é input, ex: assinatura canvas)
             isComplete = false;
        }
    });
    
    // 2. Atualizar Estado e Persistência
    saveData(formDataState);
    
    // 3. Fechar Modal
    modalOverlay.style.display = 'none';
    updateWindowStatus(activeWindowName, isComplete);
    checkAllSectionsComplete();
}

/**
 * Atualiza o status visual de uma seção no grid.
 */
function updateWindowStatus(sectionKey) {
    const card = document.getElementById(`card-${sectionKey}`);
    const statusP = document.getElementById(`status-${sectionKey}`);
    
    // Recalcula o status de conclusão
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

/**
 * Verifica se todos os campos obrigatórios de uma janela foram preenchidos.
 */
function checkWindowCompletion(windowId) {
    const windowConfig = FORM_STRUCTURE[windowId];
    const currentData = formDataState[windowId] || {};
    
    if (!windowConfig) return false;
    
    return windowConfig.fields.every(field => {
        if (field.required) {
            const value = currentData[field.name];
            
            if (field.type === 'signature') {
                 // Verifica se há Base64 (string que começa com data:image)
                 return value && value.startsWith('data:image');
            }
            if (field.type === 'file') {
                 // Verifica se existe a flag no state E o File object na memória
                 return value && value.startsWith('FILE_SET_') && window.fileStorage[field.name];
            }
            
            // Outros campos: verifica se o valor não é vazio
            return value !== undefined && value !== null && value !== '';
        }
        return true;
    });
}

/**
 * Atualiza o status de todas as janelas.
 */
function updateAllWindowStatuses() {
     Object.keys(FORM_STRUCTURE).forEach(updateWindowStatus);
}

/**
 * Verifica se todas as seções estão completas para habilitar o botão de envio.
 */
function checkAllSectionsComplete() {
    const allComplete = Object.keys(FORM_STRUCTURE).every(key => checkWindowCompletion(key));

    submitReportButton.disabled = !allComplete;
    if (submitReportButton.disabled) {
        submitReportButton.textContent = 'Preencha todos os campos';
    } else {
        submitReportButton.textContent = 'Enviar Relatório';
    }
}

/**
 * Lida com o envio final de todos os dados e arquivos para o Apps Script.
 */
async function submitReport() {
    if (submitReportButton.disabled) return;

    if (!confirm("Tem certeza que deseja enviar o relatório? Não será possível editar depois.")) {
        return;
    }

    // Assume-se que você tem uma função showSpinner/hideSpinner definida em 'spinner.js'
    if (typeof showSpinner === 'function') {
        showSpinner('Enviando relatório e arquivos. Aguarde...');
    }

    const finalFormData = new FormData();
    const dataToSend = {}; // Objeto para armazenar dados mapeados

    // 1. Coletar e mapear todos os dados de texto e arquivos
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const sectionData = formDataState[sectionKey] || {};
        const sectionFields = FORM_STRUCTURE[sectionKey].fields;

        sectionFields.forEach(field => {
            const fieldName = field.name;
            let dataName = fieldName;

            // Mapeamento CRÍTICO do nome do campo de anomalia (conforme o Apps Script)
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
                     // Adiciona o nome do arquivo para o Apps Script
                     finalFormData.append(dataName, signatureBlob, `${dataName}.png`); 
                }
            } else {
                // 1c. Tratar dados de texto (usa o nome mapeado/original)
                // Usamos o valor salvo, exceto para arquivos que já foram tratados acima.
                if (value && !value.startsWith('FILE_SET_')) { 
                    finalFormData.append(dataName, value);
                }
            }
        });
    });

    // 2. Enviar para o Apps Script
    try {
        // *** SUBSTITUA AQUI COM SEU URL REAL DO APPS SCRIPT ***
        const url = 'https://script.google.com/macros/s/AKfycbwPz26F80W687Y4i8s_f3Qo7N5a3L4R0Vp0R-5S3I0H3E92B/exec'; 
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
    
    // 1. Inicia o grid principal
    initializeGrid();
    
    // 2. Define o valor inicial da data
    const today = new Date().toISOString().split('T')[0];
    const dataField = FORM_STRUCTURE['dados-iniciais']?.fields.find(f => f.name === 'data');
    if (dataField && !formDataState['dados-iniciais']?.data) {
         // Define o valor padrão apenas se o estado estiver vazio (para a data inicial)
        formDataState['dados-iniciais'].data = today;
    }
    
    // 3. Eventos do Modal
    if (modalClose) modalClose.addEventListener('click', () => modalOverlay.style.display = 'none');
    if (modalCancel) modalCancel.addEventListener('click', () => modalOverlay.style.display = 'none');
    
    if (windowForm) {
        windowForm.addEventListener('submit', (e) => {
            e.preventDefault();
            saveFormData(); 
        });
    }
    
    // 4. Evento de envio final
    if (submitReportButton) {
        submitReportButton.addEventListener('click', submitReport);
    }
    
    // 5. Evento do Jump Menu
    if (jumpMenu) {
        jumpMenu.addEventListener('change', (e) => jumpToField(e.target.value));
    }

    // 6. Atualiza o status inicial do botão de envio
    checkAllSectionsComplete();
});
