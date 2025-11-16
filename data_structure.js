// VARIÁVEIS GLOBAIS (Assumindo que FORM_STRUCTURE está carregada de data_structure.js)
let formDataState = {};
let activeWindowName = null;

// Referências DOM
const windowsGrid = document.querySelector('.windows-grid');
const modalOverlay = document.getElementById('modalOverlay');
const modalTitle = document.getElementById('modalTitle');
const formFieldsDiv = document.getElementById('formFields');
const windowForm = document.getElementById('windowForm');
const submitReportButton = document.getElementById('submitReport');
const jumpMenu = document.getElementById('jumpMenu');
const modalClose = document.getElementById('modalClose'); // Botão de fechar 'X'
const modalCancel = document.getElementById('modalCancel'); // Botão Cancelar

// Variáveis de Canvas para Assinatura
let signatureCanvas, signatureCtx, isDrawing = false;
let signatureBlob = null; // Armazena o Blob da assinatura

// =========================================================================
// 1. RENDERIZAÇÃO DO GRID DE JANELAS E MENU RÁPIDO
// =========================================================================

/**
 * Inicializa o grid de janelas e o menu de navegação rápida.
 */
function initializeGrid() {
    if (!windowsGrid || !FORM_STRUCTURE) return; // Segurança
    windowsGrid.innerHTML = '';
    
    // Preencher o menu rápido e o grid
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const section = FORM_STRUCTURE[sectionKey];

        // 1. Criar opção no menu de Navegação Rápida
        const option = document.createElement('option');
        option.value = sectionKey;
        option.textContent = `${section.icon} ${section.title}`;
        jumpMenu.appendChild(option);

        // 2. Criar Janela no Grid
        const windowDiv = document.createElement('div');
        windowDiv.className = 'window-card incomplete';
        windowDiv.id = `card-${sectionKey}`;
        windowDiv.dataset.section = sectionKey;
        
        windowDiv.innerHTML = `
            <h2>${section.icon} ${section.title}</h2>
            <p id="status-${sectionKey}">Faltando dados</p>
            <button class="edit-button">Editar</button>
        `;
        windowDiv.querySelector('.edit-button').addEventListener('click', () => openModal(sectionKey));
        windowsGrid.appendChild(windowDiv);
        
        // Inicializar o estado dos dados
        formDataState[sectionKey] = {};
    });

    // Exibir o Jump Menu
    const jumpMenuContainer = document.getElementById('jumpMenuContainer');
    if (jumpMenuContainer) {
        jumpMenuContainer.style.display = 'block';
    }
}

/**
 * Navega rapidamente para a seção clicada no menu suspenso.
 */
function jumpToField(sectionKey) {
    if (sectionKey) {
        const targetElement = document.getElementById(`card-${sectionKey}`);
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}


// =========================================================================
// 2. MODAL E GERENCIAMENTO DE CAMPOS (INCLUINDO ASSINATURA)
// =========================================================================

/**
 * Abre o modal de edição para uma seção específica.
 */
function openModal(sectionKey) {
    if (!modalOverlay) return; // Segurança
    activeWindowName = sectionKey;
    const section = FORM_STRUCTURE[sectionKey];
    modalTitle.textContent = `${section.icon} ${section.title}`;
    formFieldsDiv.innerHTML = '';

    // Renderizar campos
    section.fields.forEach(field => {
        const fieldGroup = createFieldElement(field);
        formFieldsDiv.appendChild(fieldGroup);
    });

    // Preencher com dados salvos
    loadFormData(sectionKey);
    
    // NOVO AJUSTE: Inicializa o Canvas APÓS a renderização no DOM
    if (sectionKey === 'dados-iniciais') {
        initializeSignatureCanvas();
    }
    
    modalOverlay.style.display = 'flex';
}

/**
 * Cria o elemento DOM para um campo de formulário, tratando o tipo 'file' para assinatura.
 */
function createFieldElement(field) {
    const fieldGroup = document.createElement('div');
    fieldGroup.className = 'field-group';

    // RENDERIZAÇÃO DO CANVAS (APENAS PARA O CAMPO DE ASSINATURA)
    if (field.name === 'assinatura' && field.type === 'file') {
        fieldGroup.className += ' signature-container';
        fieldGroup.innerHTML = `
            <label>${field.label} ${field.required ? '*' : ''}</label>
            <canvas id="signatureCanvas" width="350" height="150" style="border: 1px solid #ccc; touch-action: none; background-color: white;"></canvas>
            <div class="signature-controls">
                <button type="button" id="clearSignatureButton" class="btn-secondary">Limpar</button>
                <p class="signature-hint">Desenhe sua assinatura acima.</p>
            </div>
        `;
        return fieldGroup;
    }

    // RENDERIZAÇÃO DE CAMPOS NORMAIS
    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.textContent = field.label + (field.unit ? ` (${field.unit})` : '') + (field.required ? ' *' : '');

    let inputElement;

    if (field.type === 'textarea') {
        inputElement = document.createElement('textarea');
        inputElement.rows = 3;
    } else if (field.type === 'select' || field.type === 'status') {
        inputElement = document.createElement('select');
        field.options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            inputElement.appendChild(option);
        });
    } else {
        inputElement = document.createElement('input');
        inputElement.type = field.type;
        if (field.placeholder) inputElement.placeholder = field.placeholder;
        if (field.min !== undefined) inputElement.min = field.min;
        if (field.max !== undefined) inputElement.max = field.max;
        if (field.step !== undefined) inputElement.step = field.step;
        if (field.default !== undefined) inputElement.value = field.default; // Define valor padrão
    }
    
    if (field.required) inputElement.required = true;

    inputElement.id = field.name;
    inputElement.name = field.name;

    fieldGroup.appendChild(label);
    fieldGroup.appendChild(inputElement);

    return fieldGroup;
}

/**
 * Preenche o formulário modal com os dados atualmente salvos.
 */
function loadFormData(sectionKey) {
    const data = formDataState[sectionKey] || {};
    
    Object.keys(data).forEach(fieldName => {
        const fieldElement = document.getElementById(fieldName);
        if (fieldElement) {
            // A assinatura é carregada separadamente
            if (fieldName === 'assinatura') return; 

            if (fieldElement.type === 'checkbox') {
                fieldElement.checked = data[fieldName];
            } else {
                fieldElement.value = data[fieldName];
            }
        }
    });
    
    // NOVO AJUSTE: Carrega Assinatura (se houver um blob salvo)
    if (signatureBlob && sectionKey === 'dados-iniciais') {
        signatureCanvas = document.getElementById('signatureCanvas');
        if (signatureCanvas) {
            signatureCtx = signatureCanvas.getContext('2d');
            
            // Desenhar o blob salvo no canvas para visualização/edição
            const img = new Image();
            img.onload = () => {
                signatureCtx.drawImage(img, 0, 0, signatureCanvas.width, signatureCanvas.height);
            };
            img.src = URL.createObjectURL(signatureBlob);
        }
    }
}

// =========================================================================
// 3. LÓGICA DO CANVAS DE ASSINATURA
// =========================================================================

function initializeSignatureCanvas() {
    signatureCanvas = document.getElementById('signatureCanvas');
    if (!signatureCanvas) return;
    
    // Configurações do contexto de desenho
    signatureCtx = signatureCanvas.getContext('2d');
    signatureCtx.lineWidth = 3;
    signatureCtx.lineCap = 'round';
    signatureCtx.strokeStyle = '#000';
    signatureCtx.fillStyle = '#fff';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height); // Garante fundo branco

    // Configuração de Eventos
    signatureCanvas.addEventListener('pointerdown', startDrawing);
    signatureCanvas.addEventListener('pointerup', stopDrawing);
    signatureCanvas.addEventListener('pointerout', stopDrawing);
    signatureCanvas.addEventListener('pointermove', draw);
    
    document.getElementById('clearSignatureButton').addEventListener('click', clearSignature);
}

function startDrawing(e) {
    e.preventDefault();
    isDrawing = true;
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    signatureCtx.beginPath();
    signatureCtx.moveTo(x, y);
}

function draw(e) {
    if (!isDrawing) return;
    e.preventDefault();
    const rect = signatureCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    signatureCtx.lineTo(x, y);
    signatureCtx.stroke();
}

function stopDrawing() {
    isDrawing = false;
}

function clearSignature() {
    // Limpa o canvas e redesenha o fundo branco
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureCtx.fillStyle = '#fff';
    signatureCtx.fillRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureBlob = null;
}

/**
 * Converte o canvas para Blob e salva na variável global.
 * Retorna uma Promise que resolve após o toBlob terminar.
 */
function saveSignature() {
    return new Promise(resolve => {
        if (!signatureCanvas) {
            signatureBlob = null;
            resolve();
            return;
        }
        
        // Verifica se o canvas está em branco
        // Se a cor for RGB(255, 255, 255, 255) em toda a área, está em branco
        const imageData = signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height);
        const isCanvasBlank = !imageData.data.some((channel, index) => {
             // Checa se o canal de cor não é branco E se não é o canal alfa (que é 255)
             return (index + 1) % 4 !== 0 && channel !== 255;
        });

        if (isCanvasBlank) {
            signatureBlob = null;
            resolve();
        } else {
            // Converte o conteúdo do canvas para um Blob de imagem (PNG)
            signatureCanvas.toBlob(blob => {
                // Adiciona um nome ao blob, essencial para o Apps Script (e.files)
                blob.name = 'assinatura.png';
                signatureBlob = blob;
                resolve();
            }, 'image/png');
        }
    });
}


// =========================================================================
// 4. LÓGICA DE ENVIO E GERENCIAMENTO DE ESTADO
// =========================================================================

/**
 * Salva os dados do formulário modal no estado global.
 */
async function saveFormData() {
    const currentData = {};
    const section = FORM_STRUCTURE[activeWindowName];
    let isComplete = true;

    // 1. Salvar Assinatura (deve ser o primeiro para garantir que o blob existe)
    if (activeWindowName === 'dados-iniciais') {
        // Aguarda a conversão toBlob ser finalizada
        await saveSignature(); 
    }

    // 2. Coletar dados dos campos normais e verificar completude
    section.fields.forEach(field => {
        const element = document.getElementById(field.name);
        if (element) {
            let value;
            if (field.type === 'file' && field.name !== 'assinatura') {
                // Arquivos de anomalia
                value = element.files[0] ? element.files[0].name : '';
            } else if (field.name === 'assinatura') {
                // Assinatura (usa o blob gerado)
                value = signatureBlob ? 'assinatura.png' : '';
            } else if (element.type === 'checkbox') {
                value = element.checked;
            } else {
                value = element.value;
            }
            
            currentData[field.name] = value;
            
            // Checar obrigatoriedade
            if (field.required && !value && (field.name !== 'assinatura' || !signatureBlob)) {
                isComplete = false;
            }
        }
    });
    
    // 3. Atualizar Estado
    formDataState[activeWindowName] = currentData;
    updateWindowStatus(activeWindowName, isComplete);
    
    // 4. Fechar Modal
    modalOverlay.style.display = 'none';
    checkAllSectionsComplete();
}

/**
 * Atualiza o status visual de uma seção no grid.
 */
function updateWindowStatus(sectionKey, isComplete) {
    const card = document.getElementById(`card-${sectionKey}`);
    const statusP = document.getElementById(`status-${sectionKey}`);
    
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
 * Verifica se todas as seções estão completas para habilitar o botão de envio.
 */
function checkAllSectionsComplete() {
    const allComplete = Object.keys(FORM_STRUCTURE).every(key => {
        const card = document.getElementById(`card-${key}`);
        return card && card.classList.contains('complete');
    });

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

    // Confirmação final
    if (!confirm("Tem certeza que deseja enviar o relatório? Não será possível editar depois.")) {
        return;
    }

    const finalFormData = new FormData();

    // 1. Coletar todos os dados de texto e arquivos
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const sectionData = formDataState[sectionKey];
        const sectionFields = FORM_STRUCTURE[sectionKey].fields;

        sectionFields.forEach(field => {
            const fieldName = field.name;
            
            if (field.type === 'file' && fieldName !== 'assinatura') {
                // 1a. Tratar arquivos de anomalia (pegar do input DOM)
                const inputElement = document.getElementById(fieldName);
                if (inputElement && inputElement.files[0]) {
                    finalFormData.append(fieldName, inputElement.files[0], inputElement.files[0].name);
                }
            } else if (fieldName === 'assinatura' && signatureBlob) {
                // 1b. Tratar Assinatura (usar o blob salvo)
                finalFormData.append(fieldName, signatureBlob, signatureBlob.name);
            } else {
                // 1c. Tratar dados de texto
                const fieldValue = sectionData[fieldName] || '';
                finalFormData.append(fieldName, fieldValue);
            }
        });
    });

    // 2. Exibir o spinner de carregamento
    showSpinner('Enviando relatório e arquivos. Aguarde...');

    // 3. Enviar para o Apps Script
    try {
        // *** SUBSTITUA PELO SEU URL DE IMPLANTAÇÃO DO GOOGLE APPS SCRIPT ***
        const url = 'SEU_URL_APPS_SCRIPT_DEPLOY'; 
        const response = await fetch(url, {
            method: 'POST',
            body: finalFormData,
        });

        const result = await response.text();

        if (result.trim() === 'ok') {
            alert('Relatório enviado com sucesso!');
            window.location.reload(); 
        } else {
            alert('Erro ao enviar o relatório. Resposta: ' + result);
        }

    } catch (error) {
        alert('Erro de rede ou servidor: ' + error.message);
    } finally {
        hideSpinner();
    }
}

// =========================================================================
// 5. EVENT LISTENERS E INICIALIZAÇÃO
// =========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // 1. Inicia o grid principal
    initializeGrid();
    
    // 2. Define o valor inicial da data
    const today = new Date().toISOString().split('T')[0];
    const dataField = FORM_STRUCTURE['dados-iniciais'].fields.find(f => f.name === 'data');
    if (dataField) dataField.default = today;
    
    // 3. Eventos do Modal
    if (modalClose) modalClose.addEventListener('click', () => modalOverlay.style.display = 'none');
    if (modalCancel) modalCancel.addEventListener('click', () => modalOverlay.style.display = 'none');
    
    if (windowForm) {
        windowForm.addEventListener('submit', (e) => {
            e.preventDefault();
            // saveFormData agora é async e lida com a assinatura internamente
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
