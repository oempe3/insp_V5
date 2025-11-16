// O FORM_STRUCTURE é assumido como carregado do data_structure.js

// Variáveis globais de estado
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
        windowDiv.className = 'window-card incomplete'; // Começa como incompleta
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
    document.getElementById('jumpMenuContainer').style.display = 'block';
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
    activeWindowName = sectionKey;
    const section = FORM_STRUCTURE[sectionKey];
    modalTitle.textContent = `${section.icon} ${section.title}`;
    formFieldsDiv.innerHTML = '';

    // Renderizar campos
    section.fields.forEach(field => {
        const fieldGroup = createFieldElement(field);
        formFieldsDiv.appendChild(fieldGroup);
    });

    // Se for a seção de dados iniciais, inicializa o canvas de assinatura
    if (sectionKey === 'dados-iniciais') {
        initializeSignatureCanvas();
    }
    
    // Preencher com dados salvos
    loadFormData(sectionKey);
    
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
            <label>${field.label}</label>
            <canvas id="signatureCanvas" width="350" height="150" style="border: 1px solid #ccc; touch-action: none;"></canvas>
            <div class="signature-controls">
                <button type="button" id="clearSignatureButton">Limpar</button>
                <p class="signature-hint">Desenhe sua assinatura acima.</p>
            </div>
        `;
        return fieldGroup;
    }

    // RENDERIZAÇÃO DE CAMPOS NORMAIS (text, number, range, select, status, etc.)
    const label = document.createElement('label');
    label.htmlFor = field.name;
    label.textContent = field.label + (field.unit ? ` (${field.unit})` : '');

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
    }

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
            // Não carrega a assinatura (o canvas deve ser manipulado separadamente)
            if (fieldName === 'assinatura') return; 

            if (fieldElement.type === 'checkbox') {
                fieldElement.checked = data[fieldName];
            } else {
                fieldElement.value = data[fieldName];
            }
        }
    });

    // Carregar Assinatura salva (se houver um blob salvo)
    if (sectionKey === 'dados-iniciais' && signatureBlob) {
        if (signatureCanvas) {
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
    
    signatureCtx = signatureCanvas.getContext('2d');
    signatureCtx.lineWidth = 3;
    signatureCtx.lineCap = 'round';
    signatureCtx.strokeStyle = '#000';

    // Configuração de Eventos
    signatureCanvas.addEventListener('pointerdown', startDrawing);
    signatureCanvas.addEventListener('pointerup', stopDrawing);
    signatureCanvas.addEventListener('pointerout', stopDrawing);
    signatureCanvas.addEventListener('pointermove', draw);
    
    document.getElementById('clearSignatureButton').addEventListener('click', clearSignature);

    // Se houver um blob salvo, ele é carregado em loadFormData, mas garante que o blob está disponível
    if (signatureBlob) {
        // Redesenhar o blob no canvas se já existir
        loadFormData('dados-iniciais');
    }
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
    signatureCtx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
    signatureBlob = null;
}

/**
 * Converte o canvas para Blob e salva na variável global.
 */
function saveSignature() {
    if (!signatureCanvas) return;
    
    // Verifica se o canvas está em branco
    const isCanvasBlank = !signatureCtx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data.some(channel => channel !== 0);
    
    if (isCanvasBlank) {
        signatureBlob = null;
    } else {
        // Converte o conteúdo do canvas para um Blob de imagem (PNG)
        signatureCanvas.toBlob(blob => {
            signatureBlob = blob;
            // O blob precisa de um nome de arquivo para ser processado pelo Apps Script
            blob.name = 'assinatura.png';
        }, 'image/png');
    }
}


// =========================================================================
// 4. LÓGICA DE ENVIO E GERENCIAMENTO DE ESTADO
// =========================================================================

/**
 * Salva os dados do formulário modal no estado global.
 */
function saveFormData() {
    const currentData = {};
    const section = FORM_STRUCTURE[activeWindowName];
    let isComplete = true;

    // 1. Coletar dados dos campos normais
    section.fields.forEach(field => {
        const element = document.getElementById(field.name);
        if (element) {
            let value;
            if (field.type === 'file' && field.name !== 'assinatura') {
                // Arquivos são tratados separadamente, o campo de texto guarda o nome
                value = element.files[0] ? element.files[0].name : '';
            } else if (field.name === 'assinatura') {
                // A assinatura é tratada separadamente, aqui guardamos uma flag
                value = signatureBlob ? 'assinatura.png' : '';
            } else if (element.type === 'checkbox') {
                value = element.checked;
            } else {
                value = element.value;
            }
            
            currentData[field.name] = value;
            
            // Checar obrigatoriedade
            if (field.required && !value) {
                isComplete = false;
            }
        }
    });

    // 2. Salvar Assinatura (se for a seção inicial)
    if (activeWindowName === 'dados-iniciais') {
        saveSignature(); 
        if (section.fields.find(f => f.name === 'assinatura' && f.required) && !signatureBlob) {
             // Se a assinatura for obrigatória e o blob não foi gerado
             // (Pode exigir um setTimeout para garantir que toBlob terminou, mas vamos simplificar aqui)
             // isComplete = false; 
        }
    }
    
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

/**
 * Verifica se todas as seções estão completas para habilitar o botão de envio.
 */
function checkAllSectionsComplete() {
    const allComplete = Object.keys(FORM_STRUCTURE).every(key => {
        const card = document.getElementById(`card-${key}`);
        return card && card.classList.contains('complete');
    });

    submitReportButton.disabled = !allComplete;
}

/**
 * Lida com o envio final de todos os dados e arquivos para o Apps Script.
 */
async function submitReport() {
    if (submitReportButton.disabled) return;

    const finalFormData = new FormData();
    let filesCount = 0;

    // 1. Coletar todos os dados de texto e arquivos
    Object.keys(FORM_STRUCTURE).forEach(sectionKey => {
        const sectionData = formDataState[sectionKey];
        const sectionFields = FORM_STRUCTURE[sectionKey].fields;

        sectionFields.forEach(field => {
            const fieldName = field.name;
            const fieldValue = sectionData[fieldName];

            if (field.type === 'file' && fieldName !== 'assinatura') {
                // 1a. Tratar arquivos de anomalia
                const inputElement = document.getElementById(fieldName);
                if (inputElement && inputElement.files[0]) {
                    finalFormData.append(fieldName, inputElement.files[0], fieldValue);
                    filesCount++;
                }
            } else if (fieldName === 'assinatura' && signatureBlob) {
                // 1b. Tratar Assinatura (o blob foi salvo anteriormente)
                // Usamos o blob salvo e damos o nome de arquivo
                finalFormData.append(fieldName, signatureBlob, 'assinatura.png');
                filesCount++;
            } else {
                // 1c. Tratar dados de texto (incluindo paths de arquivos vazios)
                finalFormData.append(fieldName, fieldValue || '');
            }
        });
    });

    // 2. Exibir o spinner de carregamento
    showSpinner('Enviando relatório e arquivos. Aguarde...');

    // 3. Enviar para o Apps Script
    try {
        const url = 'SEU_URL_APPS_SCRIPT_DEPLOY'; // Substitua pelo seu URL de implantação
        const response = await fetch(url, {
            method: 'POST',
            body: finalFormData,
            // Não defina Content-Type; o FormData fará isso automaticamente com boundary.
        });

        const result = await response.text();

        if (result === 'ok') {
            alert('Relatório enviado com sucesso!');
            window.location.reload(); // Recarregar a página para novo formulário
        } else {
            alert('Erro ao enviar o relatório. Detalhes: ' + result);
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
    initializeGrid();
    
    // Eventos do Modal
    modalClose.addEventListener('click', () => modalOverlay.style.display = 'none');
    modalCancel.addEventListener('click', () => modalOverlay.style.display = 'none');
    windowForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // A função saveSignature pode ser assíncrona (toBlob), então o ideal seria
        // envolver isso em uma Promise, mas para simplificar, chamamos a saveFormData
        // após uma pequena pausa para o toBlob rodar.
        saveSignature(); 
        setTimeout(saveFormData, 100); 
    });
    
    // Evento de envio final
    submitReportButton.addEventListener('click', submitReport);
    
    // Inicialização do campo 'data'
    const today = new Date().toISOString().split('T')[0];
    FORM_STRUCTURE['dados-iniciais'].fields.find(f => f.name === 'data').default = today;
});

// Implementação simples de spinner (requer o arquivo spinner.js e spinner.css)
function showSpinner(message = 'Carregando...') {
    const spinner = document.getElementById('loadingSpinner') || createSpinnerElement();
    spinner.querySelector('p').textContent = message;
    document.body.appendChild(spinner);
}

function hideSpinner() {
    const spinner = document.getElementById('loadingSpinner');
    if (spinner) {
        spinner.remove();
    }
}

// Cria o elemento spinner (se não estiver definido em spinner.js)
function createSpinnerElement() {
    const spinner = document.createElement('div');
    spinner.id = 'loadingSpinner';
    spinner.className = 'spinner-overlay';
    spinner.innerHTML = `
        <div class="spinner-container">
            <div class="spinner"></div>
            <p></p>
        </div>
    `;
    return spinner;
}
