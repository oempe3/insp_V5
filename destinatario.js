// Arquivo: script.js (ou dentro de <script> no HTML)

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('destForm');
    const emailInput = document.getElementById('dest-email');
    const senhaInput = document.getElementById('dest-senha');
    const messageDiv = document.getElementById('destMessage');

    // ⚠️ ATUALIZE ESTE URL se for uma nova implantação!
    const SCRIPT_URL_DEST =
      'https://script.google.com/macros/s/AKfycbzJMgFn6SQJqifB4w5IKXHe_3inXxyN2nXPxcrECSg4VDhiKsCJervIbJgRXUx4DQM/exec';
    
    // Senha hardcoded (123) deve ser a mesma no Apps Script e aqui.
    const EXPECTED_PASSWORD = '123'; 

    // Valida formato de email simples
    function isValidEmail(email) {
        const regex = /^[\w.+-]+@[\w.-]+\.[\w.-]{2,}$/i;
        return regex.test(email);
    }

    /**
     * Atualiza a lista local (localStorage) após uma operação bem-sucedida.
     * @param {string} email O e-mail a ser manipulado.
     * @param {string} action A ação realizada ('add' ou 'remove').
     */
    function updateLocalStorage(email, action) {
        const storedList = localStorage.getItem('destinatarios_list');
        let list = storedList ? JSON.parse(storedList) : [];
        
        if (action === 'remove') {
            list = list.filter(e => e !== email);
        } else if (action === 'add') {
            if (!list.includes(email)) {
                list.push(email);
            }
        }
        localStorage.setItem('destinatarios_list', JSON.stringify(list));
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();
        let action = 'add'; // Assume 'add' por padrão

        // Limpa e prepara a div de mensagem
        messageDiv.textContent = 'Processando...';
        messageDiv.style.color = '#666'; 

        // 1. Validação do Front-end
        if (!isValidEmail(email)) {
            messageDiv.textContent = 'Email inválido. Insira um endereço válido.';
            messageDiv.style.color = 'var(--danger-color)';
            return;
        }

        if (senha !== EXPECTED_PASSWORD) {
            messageDiv.textContent = 'Senha incorreta. Tente novamente.';
            messageDiv.style.color = 'var(--danger-color)';
            return;
        }

        // 2. Lógica de Ação (Baseada no LocalStorage)
        const storedList = localStorage.getItem('destinatarios_list');
        const list = storedList ? JSON.parse(storedList) : [];
        const exists = list.includes(email);

        if (exists) {
            if (window.confirm(`O email "${email}" já está inscrito. Deseja removê-lo da lista?`)) {
                action = 'remove';
            } else {
                messageDiv.textContent = 'Nenhuma alteração realizada.';
                messageDiv.style.color = '#666';
                form.reset();
                return;
            }
        }

        // 3. Preparação da Requisição (CORREÇÃO CRÍTICA)
        // Usar URLSearchParams garante que os dados sejam enviados no formato esperado
        const params = new URLSearchParams();
        params.append('email', email);
        params.append('password', senha);
        params.append('action', action);

        // 4. Realiza o POST para o Apps Script
        fetch(SCRIPT_URL_DEST, {
            method: 'POST',
            // O body deve ser o objeto URLSearchParams
            body: params 
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Erro de rede: ${response.status}`);
            }
            return response.text();
        })
        .then(text => {
            messageDiv.textContent = text;
            
            // Verifica a resposta do Google Script para determinar sucesso
            const textLower = text.toLowerCase();
            let finalAction = null;

            if (textLower.includes('adicionado com sucesso')) {
                finalAction = 'add';
            } else if (textLower.includes('removido com sucesso')) {
                finalAction = 'remove';
            }
            
            // Atualiza o localStorage apenas se a operação foi confirmada pelo servidor
            if (finalAction) {
                updateLocalStorage(email, finalAction);
                messageDiv.style.color = 'var(--primary-color)'; // Cor de sucesso
                form.reset();
            } else if (textLower.includes('já está cadastrado') || textLower.includes('não encontrado')) {
                 messageDiv.style.color = 'var(--secondary-color)'; // Cor neutra
                 form.reset();
            } else {
                 messageDiv.style.color = 'var(--danger-color)'; // Erros: senha, email inválido, etc.
            }
        })
        .catch(err => {
            console.error('Erro de Fetch/Rede:', err);
            messageDiv.textContent = `Ocorreu um erro ao conectar com o servidor: ${err.message}`;
            messageDiv.style.color = 'var(--danger-color)';
        });
    });
});
