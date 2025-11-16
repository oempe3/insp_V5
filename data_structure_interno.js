// Estrutura de dados para o formulário de Inspeção Interna
// Esta configuração segue as especificações fornecidas pelo usuário:
// - Janelas (cards) semelhantes à inspeção externa, com marcação azul quando preenchidas
// - Campos deslizantes (roletas) para intervalos numéricos
// - Suporte a 23 motores/unidades e 23 geradores AVK, além de compressores e separadoras

const FORM_STRUCTURE = {
    'dados-iniciais': {
        title: 'Dados Iniciais',
        icon: '📋',
        fields: [
            { name: 'hora_inicial', label: 'Hora Inicial', type: 'time', auto: 'start_time', required: true },
            { name: 'hora_final', label: 'Hora Final', type: 'time', auto: 'end_time', readonly: true },
            { name: 'data', label: 'Data', type: 'date', auto: 'start_date', required: true },
            { name: 'operador', label: 'Operador', type: 'text', placeholder: 'Nome do operador', auto: 'suggest_name', required: true },
            { name: 'supervisor', label: 'Supervisor', type: 'text', placeholder: 'Nome do supervisor', auto: 'suggest_name', required: true },
            { name: 'turma', label: 'Turma', type: 'select', options: ['A','B','C','D','E'], required: true },
            // Campo opcional de assinatura para o operador
            { name: 'assinatura', label: 'Assinatura', type: 'signature', required: false }
        ]
    },

    // Janela 02 – Unidades Geradoras (23 motores)
    'unidades-geradoras': (() => {
        const fields = [];
        for (let i = 1; i <= 23; i++) {
            const idx = String(i).padStart(2, '0');
            fields.push({ name: `motor${idx}_status`, label: `Status Motor #${idx}`, type: 'status', options: ['OPE','ST-BY','MNT'], default: 'ST-BY', required: true, tag: `UG#${idx}` });
            fields.push({ name: `motor${idx}_governor`, label: `Nível Óleo Governor #${idx}`, type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50, required: true });
            fields.push({ name: `motor${idx}_carter`, label: `Nível do Cárter #${idx}`, type: 'range', min: 0, max: 35, step: 1, unit: 'cm', default: 20, required: true });
            fields.push({ name: `motor${idx}_unic_status`, label: `Status UNIC #${idx}`, type: 'status', options: ['NORMAL','FALHA'], default: 'NORMAL', required: true });
            fields.push({ name: `motor${idx}_tanque_expansao`, label: `Tanque de Expansão #${idx}`, type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50, required: true });
        }
        return { title: 'Unidades Geradoras', icon: '⚙️', fields };
    })(),

    // Janela 03 – Geradores AVK (23 unidades)
    'geradores-avk': (() => {
        const fields = [];
        for (let i = 1; i <= 23; i++) {
            const idx = String(i).padStart(2, '0');
            fields.push({ name: `avk${idx}_status`, label: `Status Gerador #${idx}`, type: 'status', options: ['OPE','ST-BY','MNT'], default: 'ST-BY', required: true, tag: `AVK#${idx}` });
            fields.push({ name: `avk${idx}_aquecedor`, label: `Aquecedor do Gerador #${idx}`, type: 'status', options: ['LIGADO','DESLIGADO'], default: 'LIGADO', required: true });
            fields.push({ name: `avk${idx}_mancal_nao_acoplado`, label: `Nível Óleo Mancal Não Acoplado #${idx}`, type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50, required: true });
            fields.push({ name: `avk${idx}_mancal_acoplado`, label: `Nível Óleo Mancal Acoplado #${idx}`, type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50, required: true });
        }
        return { title: 'Geradores AVK', icon: '⚡', fields };
    })(),

    // Janela 04 – Nível VBA (Quatro tanques)
    'nivel-vba': {
        title: 'Nível VBA',
        icon: '🌊',
        fields: [
            { name: 'vba901', label: 'Nível VBA901', type: 'range', min: 0, max: 10000, step: 100, unit: 'L', default: 2000, required: true },
            { name: 'vba902', label: 'Nível VBA902', type: 'range', min: 0, max: 10000, step: 100, unit: 'L', default: 2000, required: true },
            { name: 'vba903', label: 'Nível VBA903', type: 'range', min: 0, max: 10000, step: 100, unit: 'L', default: 2000, required: true },
            { name: 'vba904', label: 'Nível VBA904', type: 'range', min: 0, max: 10000, step: 100, unit: 'L', default: 2000, required: true }
        ]
    },

    // Janela 05 – Compressores Partida (TSA)
    'compressores-partida': (() => {
        const equip = ['TSA901.1','TSA901.2','TSA902.1','TSA902.2'];
        const fields = [];
        equip.forEach(code => {
            const slug = code.replace(/\./g, '_').toLowerCase();
            fields.push({ name: `${slug}_status`, label: `Status ${code}`, type: 'status', options: ['OPE','ST-BY','MNT'], default: 'ST-BY', required: true, tag: `${code}` });
            fields.push({ name: `${slug}_pressao`, label: `Pressão de Ar ${code}`, type: 'range', min: 0, max: 40, step: 0.1, unit: 'Bar', default: 20, required: true });
            fields.push({ name: `${slug}_carter`, label: `Nível do Cárter ${code}`, type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 70, required: true });
            fields.push({ name: `${slug}_horimetro`, label: `Horímetro ${code}`, type: 'number', digits: 6, default: 0, required: true });
        });
        return { title: 'Compressores Partida', icon: '💨', fields };
    })(),

    // Janela 06 – Compressores Instrumentação (TCA)
    'compressores-instrumentacao': (() => {
        const equip = ['TCA901','TCA902','TCA903'];
        const fields = [];
        equip.forEach(code => {
            const slug = code.toLowerCase();
            fields.push({ name: `${slug}_status`, label: `Status ${code}`, type: 'status', options: ['OPE','ST-BY','MNT'], default: 'ST-BY', required: true, tag: `${code}` });
            fields.push({ name: `${slug}_pressao`, label: `Pressão de Ar ${code}`, type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar', default: 5, required: true });
            fields.push({ name: `${slug}_carter`, label: `Nível do Cárter ${code}`, type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50, required: true });
            fields.push({ name: `${slug}_horimetro`, label: `Horímetro ${code}`, type: 'number', digits: 6, default: 0, required: true });
            fields.push({ name: `${slug}_secador_status`, label: `Status Secador ${code}`, type: 'status', options: ['OPE','ST-BY','MNT'], default: 'ST-BY', required: true });
        });
        return { title: 'Compressores Instrumentação', icon: '🎛️', fields };
    })(),

    // Janela 07 – Separadoras de Óleo Lubrificante (QBB)
    'separadoras-oleo-lubrificante': (() => {
        const fields = [];
        for (let i = 1; i <= 23; i++) {
            const idx = String(i).padStart(2, '0');
            fields.push({ name: `qbb${idx}_status`, label: `Status QBB#${idx}`, type: 'status', options: ['OPE','ST-BY','MNT'], default: 'ST-BY', required: true, tag: `QBB#${idx}` });
            fields.push({ name: `qbb${idx}_carter`, label: `Nível do Cárter QBB#${idx}`, type: 'range', min: 0, max: 100, step: 1, unit: '%', default: 50, required: true });
            // Vazão, temperatura e rotação não são obrigatórios quando a QBB estiver em stand-by ou manutenção, por isso não marcados como required
            fields.push({ name: `qbb${idx}_vazao`, label: `Vazão QBB#${idx}`, type: 'range', min: 0, max: 4000, step: 1, unit: 'l/h', default: 2000, required: false });
            fields.push({ name: `qbb${idx}_temperatura`, label: `Temperatura QBB#${idx}`, type: 'range', min: 0, max: 125, step: 1, unit: 'ºC', default: 85, required: false });
            fields.push({ name: `qbb${idx}_rotacao`, label: `Rotação QBB#${idx}`, type: 'range', min: 0, max: 14000, step: 100, unit: 'RPM', default: 8000, required: false });
        }
        return { title: 'Separadoras de Óleo Lubrificante', icon: '🛢️', fields };
    })(),

    // Janela 08 – Anormalidades
    'anormalidades': {
        title: 'Anormalidades',
        icon: '⚠️',
        /**
         * Nesta seção o operador pode registrar até seis anormalidades.
         * Para cada anormalidade são gerados três campos: descrição, local e imagem.
         */
        fields: (() => {
            const arr = [];
            for (let i = 1; i <= 6; i++) {
                arr.push({
                    name: `descricao_${i}`,
                    label: `Descrição Anormalidade ${i}`,
                    type: 'textarea',
                    placeholder: 'Descreva a anormalidade e o local',
                    required: false
                });
                arr.push({
                    name: `local_${i}`,
                    label: `Local Anormalidade ${i}`,
                    type: 'text',
                    placeholder: 'Local da anormalidade',
                    required: false
                });
                arr.push({
                    name: `imagem_${i}`,
                    label: `Anexar Imagem ${i}`,
                    type: 'file',
                    accept: 'image/*',
                    required: false
                });
            }
            return arr;
        })()
    }
};