// Estrutura de dados completa do formulário, conforme as instruções do usuário.
// Esta estrutura será usada para gerar dinamicamente os campos no HTML e gerenciar o estado.

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
            { name: 'turma', label: 'Turma', type: 'select', options: ['A', 'B', 'C', 'D', 'E'], required: true },
            // MANTIDO: Campo opcional de assinatura para o operador (type: 'signature' para renderizar Canvas)
            { name: 'assinatura', label: 'Assinatura', type: 'signature', required: false }
        ]
    },
    'bomba-pocos': {
        title: 'Bomba dos Poços',
        icon: '💧',
        fields: [
            { name: 'bomba1_status', label: 'Status da Bomba 1', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'bomba1_hidrometro', label: 'Hidrômetro Bomba 1', type: 'number', unit: 'acumulado m³' },
            { name: 'bomba2_status', label: 'Status da Bomba 2', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'bomba2_hidrometro', label: 'Hidrômetro Bomba 2', type: 'number', unit: 'acumulado m³' }
        ]
    },
    'container-incendio': {
        title: 'Container Incêndio',
        icon: '🔥',
        fields: [
            { name: 'jockey_status', label: 'Status Bomba Jockey', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            // Valor padrão de 12 para range max 10 foi corrigido para o default ser 10, mantendo o min/max.
            { name: 'incendio_pressao', label: 'Pressão da Linha de Incêndio', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar', default: 10 }, 
            { name: 'sprinkler_status', label: 'Status Bomba Sprinkler (Elétrica)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'sprinkler_oleo', label: 'Nível de Óleo Cavalete Bomba Sprinkler', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'diesel_status', label: 'Status Bomba Diesel', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'bateria01_tensao', label: 'Tensão Bateria 01', type: 'range', min: 0, max: 16, step: 0.1, unit: 'V', default: 12 },
            { name: 'bateria02_tensao', label: 'Tensão Bateria 02', type: 'range', min: 0, max: 16, step: 0.1, unit: 'V', default: 12 },
            { name: 'radiador_agua', label: 'Nível Água do Radiador', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'oleo_lubrificante', label: 'Nível de Óleo Lubrificante', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'oleo_combustivel', label: 'Nível de Óleo Combustível', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'horimetro', label: 'Horímetro', type: 'number', unit: 'acumulado m³', default: 0 },
            { name: 'diesel_oleo_cavalete', label: 'Nível de Óleo Cavalete Bomba Diesel', type: 'range', min: 0, max: 100, step: 1, unit: '%' }
        ]
    },
    'eta': {
        title: 'ETA',
        icon: '🧪',
        fields: [
            { name: 'abrandado_status', label: 'Status Tratamento Abrandado', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'abrandado_nivel', label: 'Nível do Tanque Abrandado', type: 'range', min: 0, max: 10, step: 0.1, unit: 'm³' },
            { name: 'osmose_status', label: 'Status Tratamento Osmose Reversa', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'agua_tratada_pressao', label: 'Pressão da Linha de Água Tratada', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            { name: 'ph_bruta', label: 'PH Água Bruta', type: 'range', min: 0, max: 15, step: 0.1 },
            { name: 'ph_tratada', label: 'PH Água Tratada', type: 'range', min: 0, max: 15, step: 0.1 },
            { name: 'hidrometro_bruta', label: 'Hidrômetro Água Bruta', type: 'number', unit: 'acumulado m³', default: 0 },
            { name: 'hidrometro_tratada', label: 'Hidrômetro Água Tratada', type: 'number', unit: 'acumulado m³', default: 0 },
            { name: 'soda_caustica', label: 'Nível Soda Cáustica', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'complexante_ferro', label: 'Nível Complexante de Ferro', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'biocida', label: 'Nível Biocida', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'anti_incrustante', label: 'Nível Anti-incrustante O.R', type: 'range', min: 0, max: 100, step: 1, unit: '%' }
        ]
    },
    'tancagem': {
        title: 'Tancagem',
        icon: '🛢️',
        fields: [
            { name: 'storage_hfo_volume', label: 'Storage HFO PAB901 - Volume', type: 'number', unit: 'm³', digits: 6 },
            { name: 'storage_hfo_temp', label: 'Storage HFO PAB901 - Temp.', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            { name: 'buffer_hfo_volume', label: 'Buffer HFO PBA901 - Volume', type: 'number', unit: 'm³', digits: 6 },
            { name: 'buffer_hfo_temp', label: 'Buffer HFO PBA901 - Temp.', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            { name: 'day_hfo_volume', label: 'Day HFO PBC901 - Volume', type: 'number', unit: 'm³', digits: 6 },
            { name: 'day_hfo_temp', label: 'Day HFO PBC901 - Temp.', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            { name: 'lfo_volume', label: 'LFO PBF901 - Volume', type: 'number', unit: 'm³', digits: 6 },
            { name: 'lfo_temp', label: 'LFO PBF901 - Temp.', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            { name: 'agua_oleosa_volume', label: 'Água Oleosa DAB901 - Volume', type: 'number', unit: 'm³', digits: 6 },
            { name: 'agua_oleosa_temp', label: 'Água Oleosa DAB901 - Temp.', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            { name: 'borra_volume', label: 'Borra DDB901 - Volume', type: 'number', unit: 'm³', digits: 6 },
            { name: 'borra_temp', label: 'Borra DDB901 - Temp.', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            { name: 'agua_bruta_incendio_temp', label: 'Água Bruta / Incêndio VBA VBE901 - Temp.', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            { name: 'agua_tratada_volume', label: 'Água Tratada VBC901 - Volume', type: 'number', unit: 'm³' },
            { name: 'oleo_novo_volume', label: 'Óleo Lubrificante Novo QAC901 - Volume', type: 'number', unit: 'm³' },
            { name: 'oleo_usado_volume', label: 'Óleo Lubrificante Usado QAD901 - Volume', type: 'number', unit: 'm³' },
            { name: 'oleo_manutencao1_volume', label: 'Óleo Lubrificante Manutenção QAM901 - Volume', type: 'number', unit: 'm³' },
            { name: 'oleo_manutencao2_volume', label: 'Óleo Lubrificante Manutenção QAM902 - Volume', type: 'number', unit: 'm³' }
        ]
    },
    'separadoras-hfo': {
        title: 'Separadoras de HFO',
        icon: '⚙️',
        fields: [
            // PBB901.1 (BJJ902)
            { name: 'pbb901_1_status', label: 'Status PBB901.1 (BJJ902)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pbb901_1_temp', label: 'Temp.', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC' },
            { name: 'pbb901_1_vazao', label: 'Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h' },
            { name: 'pbb901_1_frequencia', label: 'Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz' },
            { name: 'pbb901_1_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar' },
            { name: 'pbb901_1_nivel_oleo', label: 'Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'pbb901_1_horimetro', label: 'Horímetro', type: 'number' },
            // PBB901.2 (BJJ902)
            { name: 'pbb901_2_status', label: 'Status PBB901.2 (BJJ902)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pbb901_2_temp', label: 'Temp.', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC' },
            { name: 'pbb901_2_vazao', label: 'Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h' },
            { name: 'pbb901_2_frequencia', label: 'Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz' },
            { name: 'pbb901_2_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar' },
            { name: 'pbb901_2_nivel_oleo', label: 'Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'pbb901_2_horimetro', label: 'Horímetro', type: 'number' },
            // PBB901.3 (BJJ903)
            { name: 'pbb901_3_status', label: 'Status PBB901.3 (BJJ903)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pbb901_3_temp', label: 'Temp.', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC' },
            { name: 'pbb901_3_vazao', label: 'Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h' },
            { name: 'pbb901_3_frequencia', label: 'Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz' },
            { name: 'pbb901_3_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar' },
            { name: 'pbb901_3_nivel_oleo', label: 'Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'pbb901_3_horimetro', label: 'Horímetro', type: 'number' },
            // PBB902.1 (BJJ904)
            { name: 'pbb902_1_status', label: 'Status PBB902.1 (BJJ904)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pbb902_1_temp', label: 'Temp.', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC' },
            { name: 'pbb902_1_vazao', label: 'Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h' },
            { name: 'pbb902_1_frequencia', label: 'Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz' },
            { name: 'pbb902_1_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar' },
            { name: 'pbb902_1_nivel_oleo', label: 'Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'pbb902_1_horimetro', label: 'Horímetro', type: 'number' },
            // PBB902.2 (BJJ905)
            { name: 'pbb902_2_status', label: 'Status PBB902.2 (BJJ905)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pbb902_2_temp', label: 'Temp.', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC' },
            { name: 'pbb902_2_vazao', label: 'Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h' },
            { name: 'pbb902_2_frequencia', label: 'Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz' },
            { name: 'pbb902_2_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar' },
            { name: 'pbb902_2_nivel_oleo', label: 'Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'pbb902_2_horimetro', label: 'Horímetro', type: 'number' },
            // PBB902.3 (BJJ906)
            { name: 'pbb902_3_status', label: 'Status PBB902.3 (BJJ906)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pbb902_3_temp', label: 'Temp.', type: 'range', min: 60, max: 120, step: 1, unit: 'ºC' },
            { name: 'pbb902_3_vazao', label: 'Vazão', type: 'range', min: 0, max: 12, step: 0.1, unit: 'm³/h' },
            { name: 'pbb902_3_frequencia', label: 'Frequência', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz' },
            { name: 'pbb902_3_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 4, step: 0.1, unit: 'Bar' },
            { name: 'pbb902_3_nivel_oleo', label: 'Nível de Óleo', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'pbb902_3_horimetro', label: 'Horímetro', type: 'number' }
        ]
    },
    'bombas-transferencia-oc': {
        title: 'Bombas de Transferência O.C',
        icon: '⛽',
        fields: [
            // Bombas transf. HFO
            { name: 'pac901_1_status', label: 'Status PAC901.1', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pac901_2_status', label: 'Status PAC901.2', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pca902_status', label: 'Status PCA902 (Feeder HFO)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            // Feeder LFO
            { name: 'pca903_1_status', label: 'Status PCA903.1 (Feeder LFO)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'pca903_2_status', label: 'Status PCA903.2 (Feeder LFO)', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            // Feeder OL
            { name: 'feeder_ol_fluxometro', label: 'Fluxômetro Feeder OL', type: 'number', unit: 'Acumulado em m³' }
        ]
    },
    'caldeiras-rcc': {
        title: 'Caldeiras RCC',
        icon: '♨️',
        fields: [
            // RCC061
            { name: 'rcc061_status', label: 'Status RCC061', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rcc061_temp_entrada', label: 'Temp. Entrada', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc061_temp_saida', label: 'Temp. Saída', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc061_temp_agua', label: 'Temp. Água', type: 'range', min: 0, max: 200, step: 1, unit: 'ºC' },
            { name: 'rcc061_nivel_agua', label: 'Nível de Água', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'rcc061_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            // RCC121
            { name: 'rcc121_status', label: 'Status RCC121', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rcc121_temp_entrada', label: 'Temp. Entrada', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc121_temp_saida', label: 'Temp. Saída', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc121_temp_agua', label: 'Temp. Água', type: 'range', min: 0, max: 200, step: 1, unit: 'ºC' },
            { name: 'rcc121_nivel_agua', label: 'Nível de Água', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'rcc121_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            // RCC181
            { name: 'rcc181_status', label: 'Status RCC181', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rcc181_temp_entrada', label: 'Temp. Entrada', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc181_temp_saida', label: 'Temp. Saída', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc181_temp_agua', label: 'Temp. Água', type: 'range', min: 0, max: 200, step: 1, unit: 'ºC' },
            { name: 'rcc181_nivel_agua', label: 'Nível de Água', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'rcc181_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            // RCC191
            { name: 'rcc191_status', label: 'Status RCC191', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rcc191_temp_entrada', label: 'Temp. Entrada', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc191_temp_saida', label: 'Temp. Saída', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc191_temp_agua', label: 'Temp. Água', type: 'range', min: 0, max: 200, step: 1, unit: 'ºC' },
            { name: 'rcc191_nivel_agua', label: 'Nível de Água', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'rcc191_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            // RCC201
            { name: 'rcc201_status', label: 'Status RCC201', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rcc201_temp_entrada', label: 'Temp. Entrada', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc201_temp_saida', label: 'Temp. Saída', type: 'range', min: 0, max: 500, step: 1, unit: 'ºC' },
            { name: 'rcc201_temp_agua', label: 'Temp. Água', type: 'range', min: 0, max: 200, step: 1, unit: 'ºC' },
            { name: 'rcc201_nivel_agua', label: 'Nível de Água', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'rcc201_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' }
        ]
    },
    'caldeiras-rce': {
        title: 'Caldeiras RCE',
        icon: '🔥',
        fields: [
            // RCE901
            { name: 'rce901_status', label: 'Status RCE901', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rce901_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            { name: 'rce901_nivel_agua', label: 'Nível de Água', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'rce901_temp_agua', label: 'Temp. Água', type: 'range', min: 0, max: 200, step: 1, unit: 'ºC' },
            { name: 'rce901_nivel_combustivel', label: 'Nível de Combustível', type: 'range', min: 0, max: 1680, step: 1, unit: 'L' },
            // RCE902
            { name: 'rce902_status', label: 'Status RCE902', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rce902_pressao_saida', label: 'Pressão Saída', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            { name: 'rce902_nivel_agua', label: 'Nível de Água', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'rce902_temp_agua', label: 'Temp. Água', type: 'range', min: 0, max: 200, step: 1, unit: 'ºC' },
            { name: 'rce902_nivel_combustivel', label: 'Nível de Combustível', type: 'range', min: 0, max: 1680, step: 1, unit: 'L' }
        ]
    },
    'container-caldeiras-rhc': {
        title: 'Container Controle das Caldeiras RHC',
        icon: '🎛️',
        fields: [
            { name: 'rbb901_1_status', label: 'Status Bomba RBB901.1', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rbb901_1_frequencia', label: 'Frequência RBB901.1', type: 'range', min: 0, max: 60, step: 0.1, unit: 'Hz' },
            { name: 'rbb901_2_status', label: 'Status Bomba RBB901.2', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rbb902_1_status', label: 'Status Bomba de Condensado RBB902.1', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rbb902_2_status', label: 'Status Bomba de Condensado RBB902.2', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'rda901_pressao', label: 'Pressão RDA901', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            { name: 'rda902_pressao', label: 'Pressão RDA902', type: 'range', min: 0, max: 10, step: 0.1, unit: 'Bar' },
            { name: 'rba901_volume', label: 'Tanque RBA901 - Volume', type: 'number', unit: 'm³' },
            { name: 'rba901_temp', label: 'Tanque RBA901 - Temp.', type: 'range', min: 20, max: 100, step: 1, unit: 'ºC' },
            { name: 'nivel_alcalinizante', label: 'Nível de Alcalinizante', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'nivel_sequestrante', label: 'Nível de Sequestrante de Oxigênio', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'nivel_dispersante', label: 'Nível de Dispersante', type: 'range', min: 0, max: 100, step: 1, unit: '%' }
        ]
    },
    'bombas-transferencia-ao': {
        title: 'Bombas de Transferência AO (DAD)',
        icon: '🛢️',
        fields: [
            { name: 'dad901_status', label: 'Status Bomba DAD901', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad901_nivel', label: 'Nível DAD901', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad902_status', label: 'Status Bomba DAD902', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad902_nivel', label: 'Nível DAD902', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad903_status', label: 'Status Bomba DAD903', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad903_nivel', label: 'Nível DAD903', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad904_status', label: 'Status Bomba DAD904', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad904_nivel', label: 'Nível DAD904', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad905_status', label: 'Status Bomba DAD905', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad905_nivel', label: 'Nível DAD905', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad906_status', label: 'Status Bomba DAD906', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad906_nivel', label: 'Nível DAD906', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad908_status', label: 'Status Bomba DAD908', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad908_nivel', label: 'Nível DAD908', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad909_status', label: 'Status Bomba DAD909', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad909_nivel', label: 'Nível DAD909', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'dad910_status', label: 'Status Bomba DAD910', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'dad910_nivel', label: 'Nível DAD910', type: 'range', min: 0, max: 100, step: 1, unit: '%' }
        ]
    },
    'gerador-emergencia': {
        title: 'Gerador de Emergência',
        icon: '⚡',
        fields: [
            { name: 'gerador_status', label: 'Status do Gerador SAB901', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'bateria_tensao', label: 'Tensão Bateria', type: 'range', min: 0, max: 16, step: 0.1, unit: 'V', default: 12 },
            { name: 'radiador_agua', label: 'Nível Água do Radiador', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'oleo_lubrificante', label: 'Nível de Óleo Lubrificante', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'oleo_combustivel', label: 'Nível de Óleo Combustível', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'horimetro', label: 'Horímetro', type: 'number', unit: 'acumulado m³' }
        ]
    },
    'subestacao': {
        title: 'Subestação',
        icon: '🔌',
        fields: [
            // TR01
            { name: 'tr01_status', label: 'Status do TR01', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'tr01_temp_enrolamento', label: 'Temp. Enrolamento', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            // NOVO: 'Nível do Óleo Isolante' deve ser em % e não em ºC
            { name: 'tr01_nivel_oleo_isolante', label: 'Nível do Óleo Isolante', type: 'range', min: 0, max: 100, step: 1, unit: '%' }, 
            { name: 'tr01_cor_silica', label: 'Cor da Sílica', type: 'select', options: ['Azul', 'Branca', 'Laranja'] },
            { name: 'tr01_nivel_oleo_selante', label: 'Nível do Óleo Selante da Sílica', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            // TR02
            { name: 'tr02_status', label: 'Status do TR02', type: 'status', options: ['OPE', 'ST-BY', 'MNT'] },
            { name: 'tr02_temp_enrolamento', label: 'Temp. Enrolamento', type: 'range', min: 0, max: 150, step: 1, unit: 'ºC' },
            // NOVO: 'Nível do Óleo Isolante' deve ser em % e não em ºC
            { name: 'tr02_nivel_oleo_isolante', label: 'Nível do Óleo Isolante', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'tr02_cor_silica', label: 'Cor da Sílica', type: 'select', options: ['Azul', 'Branca', 'Laranja'] },
            { name: 'tr02_nivel_oleo_selante', label: 'Nível do Óleo Selante da Sílica', type: 'range', min: 0, max: 100, step: 1, unit: '%' }
        ]
    },
    'temperaturas-salas': {
        title: 'Temperaturas Salas',
        icon: '🌡️',
        fields: [
            { name: 'sala_rele_temp', label: 'Sala de Relé SE-PE3 - Temp.', type: 'range', min: 15, max: 30, step: 0.1, unit: 'ºC' },
            { name: 'sala_rele_umidade', label: 'Sala de Relé SE-PE3 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_mv1_temp', label: 'Sala de MV1 - Temp.', type: 'range', min: 15, max: 40, step: 0.1, unit: 'ºC' },
            { name: 'sala_mv1_umidade', label: 'Sala de MV1 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_mv2_temp', label: 'Sala de MV2 - Temp.', type: 'range', min: 15, max: 40, step: 0.1, unit: 'ºC' },
            { name: 'sala_mv2_umidade', label: 'Sala de MV2 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_lv1_temp', label: 'Sala de LV1 - Temp.', type: 'range', min: 15, max: 40, step: 0.1, unit: 'ºC' },
            { name: 'sala_lv1_umidade', label: 'Sala de LV1 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_lv2_temp', label: 'Sala de LV2 SE-PE3 - Temp.', type: 'range', min: 15, max: 40, step: 0.1, unit: 'ºC' },
            { name: 'sala_lv2_umidade', label: 'Sala de LV2 SE-PE3 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_lv3_temp', label: 'Sala de LV3 (FTH) SE-PE3 - Temp.', type: 'range', min: 15, max: 30, step: 0.1, unit: 'ºC' },
            { name: 'sala_lv3_umidade', label: 'Sala de LV3 (FTH) SE-PE3 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_lv4_temp', label: 'Sala de LV4 (Controle) SE-PE3 - Temp.', type: 'range', min: 15, max: 30, step: 0.1, unit: 'ºC' },
            { name: 'sala_lv4_umidade', label: 'Sala de LV4 (Controle) SE-PE3 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_sv1_temp', label: 'Sala de SV1 - Temp.', type: 'range', min: 15, max: 40, step: 0.1, unit: 'ºC' },
            { name: 'sala_sv1_umidade', label: 'Sala de SV1 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' },
            { name: 'sala_sv2_temp', label: 'Sala de SV2 - Temp.', type: 'range', min: 15, max: 40, step: 0.1, unit: 'ºC' },
            { name: 'sala_sv2_umidade', label: 'Sala de SV2 - Umidade', type: 'range', min: 0, max: 100, step: 1, unit: '%' }
        ]
    },
    'anormalidades': {
        title: 'Anormalidades',
        icon: '⚠️',
        /**
         * Ajustado para gerar os campos de anormalidade de 1 a 6.
         */
        fields: (() => {
            const fields = [];
            for (let i = 1; i <= 6; i++) {
                fields.push({
                    name: `descricao_${i}`,
                    label: `Descrição Anormalidade ${i}`,
                    type: 'textarea',
                    placeholder: 'Descreva a anormalidade e o local',
                    required: false
                });
                fields.push({
                    name: `local_${i}`,
                    label: `Local Anormalidade ${i}`,
                    type: 'text',
                    placeholder: 'Local da anormalidade',
                    required: false
                });
                fields.push({
                    name: `imagem_${i}`,
                    label: `Anexar Imagem ${i}`,
                    type: 'file',
                    accept: 'image/*',
                    required: false
                });
            }
            return fields;
        })()
    }
};
