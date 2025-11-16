# 🔧 Sistema de Inspeção On-Line - Termelétrica Pernambuco III

## 📋 Visão Geral

Sistema moderno e responsivo de inspeção on-line desenvolvido para a Termelétrica Pernambuco III, otimizado para preenchimento em dispositivos móveis com interface intuitiva e dados persistentes.

---

## ✨ Principais Características

### 🎯 Interface Moderna
- **Design responsivo** - Funciona perfeitamente em celulares, tablets e desktops
- **Layout tipo "Workspace"** - Janelas/cards para organização visual dos dados
- **Animações suaves** - Transições e efeitos para melhor experiência do usuário
- **Tema moderno** - Paleta de cores profissional e tipografia clara

### 📱 Otimizado para Mobile
- **Campos facilitados** - Teclados numéricos, seletores e validações automáticas
- **Sticky headers** - Seção de dados iniciais sempre visível
- **Botão de envio flutuante** - Fácil acesso ao botão de envio
- **Touch-friendly** - Botões e campos com tamanho adequado para toque

### 💾 Persistência de Dados
- **Salvamento automático** - Dados salvos no localStorage do navegador
- **Recuperação de dados anteriores** - Mostra dados da última inspeção para referência
- **Sugestões automáticas** - Nomes de operador e supervisor sugeridos automaticamente

### 🎨 Indicadores Visuais
- **Sinalizadores tipo farol** - Status com cores (Verde=OPE, Amarelo=ST-BY, Vermelho=MNT)
- **Validações em tempo real** - Feedback imediato sobre dados inválidos
- **Ícones descritivos** - Emojis para melhor identificação das seções

---

## 📂 Estrutura do Projeto

```
Insp3-main/
├── index.html           # Página inicial com menu de seleção
├── interno.html         # Formulário de inspeção interna (19 janelas)
├── externo.html         # Formulário de inspeção externa
├── script.js            # Scripts JavaScript (pode ser integrado nos HTMLs)
├── style.css            # Estilos CSS (pode ser integrado nos HTMLs)
├── logo.png             # Logo da Termelétrica
├── README.md            # Documentação original
└── README_NOVO.md       # Esta documentação
```

---

## 🚀 Como Usar

### 1. **Página Inicial (index.html)**
- Exibe dois botões principais:
  - **Formulário Interno** - Para inspeções internas da planta
  - **Formulário Externo** - Para inspeções de visitantes/externos

### 2. **Formulário Interno (interno.html)**

#### Seção de Dados Iniciais (Sticky)
- **Data** - Preenchida automaticamente com a data atual
- **Hora Inicial** - Preenchida automaticamente com a hora atual
- **Hora Final** - Preenchida automaticamente ao enviar o relatório
- **Operador** - Nome do operador (com sugestão automática)
- **Supervisor** - Nome do supervisor (com sugestão automática)
- **Turma** - Seleção de A até E

#### Janelas de Dados (19 no total)
Cada janela contém campos específicos com validações:

1. **Dados Inicial** - Informações gerais
2. **Bomba dos Poços** - Status e fluxômetro das bombas 1 e 2
3. **Container Incêndio** - Bombas jockey, sprinkler e diesel
4. **ETA** - Tratamento de água (abrandado e osmose reversa)
5. **Tancagem** - Níveis e temperaturas de tanques
6. **Separadoras de HFO** - Status (em construção)
7. **Bombas de Transferência O.C** - Status (em construção)
8. **ETE** - Status (em construção)
9. **Caldeiras RCC** - Status (em construção)
10. **Caldeiras RCE** - Status (em construção)
11. **Container de Caldeiras RHC** - Status (em construção)
12. **Bombas de Transferência AO (DAD)** - Status (em construção)
13. **Gerador de Emergência** - Status (em construção)
14. **Subestação** - Status (em construção)
15. **Temperaturas Salas** - Temperaturas das salas
16. **Anormalidades** - Descrição de anormalidades
17-19. **Reservados** - Para expansão futura

#### Tipos de Campos
- **Status** - Dropdown com OPE, ST-BY, MNT (com indicador visual)
- **Número** - Campos numéricos com validação de min/max
- **Texto** - Campos de texto simples
- **Textarea** - Áreas de texto para descrições

### 3. **Formulário Externo (externo.html)**
- **Dados Pessoais** - Nome, email, telefone
- **Dados da Inspeção** - Data, hora, local
- **Observações** - Descrição das observações
- **Documentação** - Upload de foto

---

## 🔌 Integração com Google Sheets

Para integrar com Google Sheets, siga os passos:

1. **Criar um Google Apps Script:**
   - Acesse [script.google.com](https://script.google.com)
   - Crie um novo projeto
   - Cole o código abaixo:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActiveSheet();
  const data = e.parameter;
  
  // Adicionar dados à planilha
  sheet.appendRow([
    new Date(),
    data.tipoFormulario,
    data.operador || data.nome,
    data.supervisor || data.email,
    // ... adicione outros campos conforme necessário
  ]);
  
  return ContentService.createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

2. **Publicar como aplicativo web:**
   - Clique em "Deploy" > "New deployment"
   - Selecione "Web app"
   - Configure para executar como você e permitir acesso a qualquer pessoa
   - Copie o URL do script

3. **Atualizar os formulários:**
   - Substitua `SEU_SCRIPT_ID` nos arquivos HTML pelo ID do seu script
   - O URL será algo como: `https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec`

---

## 🎨 Customização

### Cores
Edite as variáveis CSS em `:root`:
```css
:root {
  --primary-color: #004C99;      /* Azul principal */
  --secondary-color: #00A86B;    /* Verde secundário */
  --danger-color: #DC3545;       /* Vermelho para MNT */
  --warning-color: #FFC107;      /* Amarelo para ST-BY */
  --success-color: #28A745;      /* Verde para OPE */
}
```

### Adicionar Novas Janelas
No arquivo `interno.html`, adicione no objeto `windowsData`:
```javascript
'nova-janela': {
  title: 'Título da Janela',
  fields: [
    { name: 'campo1', label: 'Rótulo do Campo', type: 'number', min: 0, max: 100 },
    // ... mais campos
  ]
}
```

E adicione o botão na grid:
```html
<button class="window-btn" data-window="nova-janela">Nova Janela</button>
```

---

## 🔐 Segurança

- **Dados locais** - Todos os dados são salvos no localStorage do navegador (não são enviados até o envio)
- **HTTPS recomendado** - Use sempre HTTPS em produção
- **Validação de entrada** - Todos os campos têm validação no cliente
- **Sem armazenamento de senha** - O sistema não armazena senhas

---

## 📊 Dados Salvos

Os dados são salvos em duas chaves no localStorage:

1. **`inspecao_dados`** - Todos os dados dos formulários
2. **`inspecao_nomes`** - Nomes do operador e supervisor para sugestão

Para limpar os dados:
```javascript
localStorage.removeItem('inspecao_dados');
localStorage.removeItem('inspecao_nomes');
```

---

## 🐛 Troubleshooting

### Os dados não estão sendo salvos
- Verifique se o localStorage está habilitado no navegador
- Tente limpar o cache do navegador

### O formulário não envia
- Verifique se o URL do Google Apps Script está correto
- Verifique a conexão com a internet
- Abra o console (F12) para ver mensagens de erro

### Os campos não aparecem corretamente no mobile
- Verifique se a viewport está configurada corretamente
- Tente recarregar a página

---

## 📱 Compatibilidade

- ✅ Chrome/Edge (versão 90+)
- ✅ Firefox (versão 88+)
- ✅ Safari (versão 14+)
- ✅ Mobile Chrome/Firefox
- ✅ Safari iOS

---

## 📝 Changelog

### v2.0 (Atual)
- ✨ Layout completamente redesenhado
- ✨ Interface tipo "workspace" com janelas/cards
- ✨ Indicadores visuais (farol) para status
- ✨ Dados iniciais sticky
- ✨ Sugestões automáticas de nomes
- ✨ Animações suaves
- ✨ Melhor responsividade para mobile
- ✨ 19 janelas de dados

### v1.0
- Versão inicial com formulário básico

---

## 👨‍💼 Suporte

Para dúvidas ou sugestões de melhorias, entre em contato com a equipe de desenvolvimento.

---

## 📄 Licença

Este projeto é propriedade da Termelétrica Pernambuco III.

---

**Desenvolvido com ❤️ para melhorar a eficiência das inspeções**
