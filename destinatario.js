// Script para gerenciar a lista de destinatários do relatório
// Armazena a lista no localStorage, valida email e senha (padrão: 123)

document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('destForm');
    const emailInput = document.getElementById('dest-email');
    const senhaInput = document.getElementById('dest-senha');
    const messageDiv = document.getElementById('destMessage');

    // Endereço do WebApp para destinatários
    const SCRIPT_URL_DEST =
      'https://script.google.com/macros/s/AKfycbzJMgFn6SQJqifB4w5IKXHe_3inXxyN2nXPxcrECSg4VDhiKsCJervIbJgRXUx4DQM/exec';

    // Valida formato de email simples
    function isValidEmail(email) {
        const regex = /^[\w.+-]+@[\w.-]+\.[\w.-]{2,}$/i;
        return regex.test(email);
    }

    form.addEventListener('submit', function(e) {
        e.preventDefault();
        const email = emailInput.value.trim();
        const senha = senhaInput.value.trim();
        // Validação do email
        if (!isValidEmail(email)) {
            messageDiv.textContent = 'Email inválido. Insira um endereço válido.';
            messageDiv.style.color = 'var(--danger-color)';
            return;
        }
        // Validação da senha
        if (senha !== '123') {
            messageDiv.textContent = 'Senha incorreta. Tente novamente.';
            messageDiv.style.color = 'var(--danger-color)';
            return;
        }
        // Para determinar se o email existe, consultamos a lista local (se houver)
        let action = 'add';
        const storedList = localStorage.getItem('destinatarios_list');
        let list = storedList ? JSON.parse(storedList) : [];
        const exists = list.includes(email);
        if (exists) {
            if (window.confirm('Este email já está inscrito. Deseja removê-lo da lista?')) {
                action = 'remove';
            } else {
                // Usuário cancelou remoção; não faz nada
                messageDiv.textContent = 'Nenhuma alteração realizada.';
                messageDiv.style.color = '#666';
                form.reset();
                return;
            }
        }
        // Prepara o corpo da requisição
        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', senha);
        formData.append('action', action);
        // Realiza o POST para o Apps Script
        fetch(SCRIPT_URL_DEST, {
            method: 'POST',
            body: formData
        })
            .then(response => response.text())
            .then(text => {
                messageDiv.textContent = text;
                // Atualiza a lista local
                if (action === 'remove') {
                    list = list.filter(e => e !== email);
                } else {
                    if (!exists) list.push(email);
                }
                localStorage.setItem('destinatarios_list', JSON.stringify(list));
                messageDiv.style.color = 'var(--primary-color)';
                form.reset();
            })
            .catch(err => {
                console.error(err);
                messageDiv.textContent = 'Ocorreu um erro ao atualizar a lista.';
                messageDiv.style.color = 'var(--danger-color)';
            });
    });
});
