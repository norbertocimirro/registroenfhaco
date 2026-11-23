const { useState, useEffect, useRef, useMemo } = React;

const Icons = {
    Shield: ({size=24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    Dashboard: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>,
    Folder: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
    FileEdit: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    Chart: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
    Back: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>,
    Save: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
    Pdf: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    Trash: ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>,
    Cloud: ({size=14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
    Local: ({size=14}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/></svg>,
    ChevronDown: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>,
    Activity: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    Calculator: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="16" y2="18"/></svg>,
    Lock: ({size=24}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    Droplets: ({size=20}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,
    Sparkles: ({size=16}) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
};

const ChartComponent = ({ type, data, options, height = "100%" }) => {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        if (chartInstance.current) chartInstance.current.destroy();
        Chart.defaults.color = window.matchMedia('print').matches ? '#334155' : '#94a3b8';
        chartInstance.current = new Chart(chartRef.current.getContext('2d'), { type, data, options });
        return () => { if (chartInstance.current) chartInstance.current.destroy(); };
    }, [data, options, type]);
    return <div style={{ position: 'relative', height, width: '100%' }}><canvas ref={chartRef}></canvas></div>;
};

const wrapText = (text, maxLength = 14) => {
    const words = text.split(' ');
    let lines = [];
    let currentLine = '';
    words.forEach(w => {
        if ((currentLine + w).length > maxLength) {
            if (currentLine.trim()) lines.push(currentLine.trim());
            currentLine = w + ' ';
        } else currentLine += w + ' ';
    });
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
};

const AVALIADORES = ["Ten Cimirro", "Ten Bárbara Viegas", "Ten Renata", "Ten Jéssica Cunha", "Ten Zomer", "Sgt Leonarczyk", "Sgt Thamires Queiroz"];

const PERIODOS = [
    { id: '2026-07', label: '15/07/2026 a 14/08/2026', short: 'Jul/Ago' },
    { id: '2026-08', label: '15/08/2026 a 14/09/2026', short: 'Ago/Set' },
    { id: '2026-09', label: '15/09/2026 a 14/10/2026', short: 'Set/Out' },
    { id: '2026-10', label: '15/10/2026 a 14/11/2026', short: 'Out/Nov' },
    { id: '2026-11', label: '15/11/2026 a 14/12/2026', short: 'Nov/Dez' },
    { id: '2026-12', label: '15/12/2026 a 14/01/2027', short: 'Dez/Jan' },
    { id: '2027-01', label: '15/01/2027 a 14/02/2027', short: 'Jan/Fev' },
    { id: '2027-02', label: '15/02/2027 a 14/03/2027', short: 'Fev/Mar' }
];

const PERGUNTAS_AUDITORIA = [
    { id: 1, sec: "Histórico de Enfermagem", text: "Possui Histórico de Enfermagem na admissão hospitalar?" },
    { id: 2, sec: "Histórico de Enfermagem", text: "Possui identificação completa do paciente?" },
    { id: 3, sec: "Histórico de Enfermagem", text: "O formulário foi completamente preenchido?" },
    { id: 4, sec: "Histórico de Enfermagem", text: "Possui registro do exame físico?" },
    { id: 5, sec: "Histórico de Enfermagem", text: "O formulário encontra-se devidamente carimbado e assinado?" },
    { id: 6, sec: "Diagnóstico de Enfermagem", text: "Possui Diagnóstico de Enfermagem?" },
    { id: 7, sec: "Diagnóstico de Enfermagem", text: "Possui identificação completa do paciente?" },
    { id: 8, sec: "Diagnóstico de Enfermagem", text: "O formulário encontra-se devidamente carimbado e assinado?" },
    { id: 9, sec: "Diagnóstico de Enfermagem", text: "Possui Diagnósticos de Enfermagem na SAE Perioperatória?" },
    { id: 10, sec: "Planejamento de Enfermagem", text: "Observa-se o estabelecimento de Diagnósticos prioritários na Evolução?" },
    { id: 11, sec: "Planejamento de Enfermagem", text: "São determinados os resultados esperados, na Evolução de Enfermagem?" },
    { id: 12, sec: "Planejamento de Enfermagem", text: "Os resultados esperados são compatíveis com os Diagnósticos?" },
    { id: 13, sec: "Planejamento de Enfermagem", text: "São determinados os prazos para a resolução dos problemas encontrados?" },
    { id: 14, sec: "Planejamento de Enfermagem", text: "O formulário encontra-se devidamente carimbado e assinado?" },
    { id: 15, sec: "Implementação", text: "São elaboradas as Prescrições de Enfermagem na admissão e diariamente?" },
    { id: 16, sec: "Implementação", text: "As Prescrições são compatíveis com os Diagnósticos de Enfermagem?" },
    { id: 17, sec: "Implementação", text: "Possui Prescrições de Enfermagem adicionais?" },
    { id: 18, sec: "Implementação", text: "As Prescrições de Enfermagem são aprazadas adequadamente?" },
    { id: 19, sec: "Implementação", text: "As Prescrições são checadas nos horários aprazados?" },
    { id: 20, sec: "Implementação", text: "A Prescrição encontra-se devidamente carimbada e assinada?" },
    { id: 21, sec: "Implementação", text: "Possui Prescrições na SAE Perioperatória?" },
    { id: 22, sec: "Implementação", text: "O formulário da SAE Perioperatória encontra-se devidamente carimbado e assinado?" },
    { id: 23, sec: "Avaliação de Enfermagem", text: "Os resultados avaliados são compatíveis com a Prescrição de Enfermagem?" },
    { id: 24, sec: "Avaliação de Enfermagem", text: "Possui Evolução de Enfermagem diária?" },
    { id: 25, sec: "Avaliação de Enfermagem", text: "As Evoluções apresentam a avaliação do estado geral do paciente?" },
    { id: 26, sec: "Avaliação de Enfermagem", text: "Em caso de transferência, há Evolução do setor de origem e de destino?" },
    { id: 27, sec: "Avaliação de Enfermagem", text: "Em caso de óbito, há evolução de enfermagem relativa ao ocorrido?" },
    { id: 28, sec: "Avaliação de Enfermagem", text: "A Evolução de Enfermagem encontra-se devidamente carimbada e assinada?" },
    { id: 29, sec: "Avaliação de Enfermagem", text: "São registradas anotações de Enfermagem?" },
    { id: 30, sec: "Avaliação de Enfermagem", text: "As Anotações de Enfermagem encontram-se devidamente carimbadas e assinadas?" },
    { id: 31, sec: "Avaliação de Enfermagem", text: "São registradas anotações no formulário da SRPA?" },
    { id: 32, sec: "Avaliação de Enfermagem", text: "As Anotações da SRPA encontram-se devidamente carimbadas e assinadas?" }
];

const calculateStats = (records) => {
    const qStats = PERGUNTAS_AUDITORIA.map(q => {
        let sim = 0, nao = 0, na = 0;
        records.forEach(r => {
            if (r.answers[q.id] === 'SIM') sim++;
            else if (r.answers[q.id] === 'NÃO') nao++;
            else if (r.answers[q.id] === 'NA') na++;
        });
        const totalValido = sim + nao;
        return { ...q, sim, nao, na, pct: totalValido > 0 ? Math.round((sim / totalValido) * 100) : 0, pctFalta: totalValido > 0 ? Math.round((nao / totalValido) * 100) : 0, totalValido };
    });
    let tSim = 0, tNao = 0;
    qStats.forEach(s => { tSim += s.sim; tNao += s.nao; });
    return { qStats, globalPct: (tSim + tNao) > 0 ? Math.round((tSim / (tSim + tNao)) * 100) : 0, totalSimGeral: tSim, totalNaoGeral: tNao, sections: [...new Set(PERGUNTAS_AUDITORIA.map(q => q.sec))] };
};

const titlesGlasgow = { o: "Abertura Ocular", v: "Resposta Verbal", m: "Resposta Motora" };
const titlesBraden = { p: "Percepção Sensorial", u: "Umidade", a: "Atividade", m: "Mobilidade", n: "Nutrição", f: "Fricção / Cisalhamento" };
const titlesFugulin = { em: "Estado Mental", ox: "Oxigenação", sv: "Sinais Vitais", mo: "Motilidade", de: "Deambulação", al: "Alimentação", cc: "Cuidado Corporal", el: "Eliminação", te: "Terapêutica", ic: "Integridade Cutânea-Mucosa", cu: "Curativo", tc: "Tempo na troca de curativo" };

const glasgowFull = { 
    o: ["4 - Espontânea", "3 - Ao chamado verbal", "2 - À pressão / dor", "1 - Ausente"], 
    v: ["5 - Orientado", "4 - Confuso", "3 - Palavras inapropriadas", "2 - Sons incompreensíveis", "1 - Ausente / Intubado"], 
    m: ["6 - Obedece a comandos", "5 - Localiza o estímulo", "4 - Flexão normal (Retirada)", "3 - Flexão anormal (Decorticação)", "2 - Extensão anormal (Descerebração)", "1 - Ausente"]
};

const bradenFull = { 
    p: ["1. Total limitado", "2. Muito limitado", "3. Levemente limitado", "4. Sem limitação"], 
    u: ["1. Constantemente úmida", "2. Muito úmida", "3. Ocasionalmente úmida", "4. Raramente úmida"], 
    a: ["1. Acamado", "2. Em cadeira", "3. Deambula ocasionalmente", "4. Deambula frequentemente"], 
    m: ["1. Total imóvel", "2. Muito limitada", "3. Levemente limitada", "4. Sem limitações"], 
    n: ["1. Muito pobre", "2. Inadequada", "3. Adequada", "4. Excelente"], 
    f: ["1. Problema", "2. Problema potencial", "3. Nenhum problema"] 
};

const fugulinFull = { 
    em: ["1 - Orientação no tempo e espaço", "2 - Períodos de desorientação", "3 - Períodos de inconsciência", "4 - Inconsciente"], 
    ox: ["1 - Não depende de Oxigênio", "2 - Uso intermitente de máscara ou Cateter de O2", "3 - Uso contínuo de máscara ou Cateter de O2", "4 - Ventilação Mecânica"], 
    sv: ["1 - Controle de 8/8h ou mais", "2 - Controle de 6/6h", "3 - Controle de 4/4h", "4 - Controle de 2/2h"], 
    mo: ["1 - Movimenta todos os segmentos corporais", "2 - Limitação de movimentos", "3 - Dificuldade para movimentar segmentos...", "4 - Incapaz de movimentar qualquer segmento..."], 
    de: ["1 - Deambula sozinho", "2 - Necessita de auxílio para deambular", "3 - Locomoção através de cadeira de rodas", "4 - Restrito ao leito"],
    al: ["1 - Autossuficiente", "2 - Oral com auxílio", "3 - Através de Sonda Enteral (SNE)", "4 - Através de Cateter Central (NPT)"], 
    cc: ["1 - Autossuficiente", "2 - Banho no chuveiro e higiene oral auxiliados...", "3 - Banho no chuveiro e higiene oral pela Equipe...", "4 - Banho de leito pela Equipe..."], 
    el: ["1 - Autossuficiente", "2 - Uso de vaso sanitário com auxílio", "3 - Uso de comadre ou eliminação no leito", "4 - Evacuação no Leito e Uso de Cateter Vesical..."], 
    te: ["1 - IM ou VO", "2 - E.V Intermitente", "3 - E.V contínua ou através de cateter", "4 - Uso de drogas vasoativas para manutenção"],
    ic: ["1 - Pele íntegra", "2 - Alteração da cor da pele e/ou Comp. Derme", "3 - Solução de continuidade envolve subcutâneo...", "4 - Destruição atinge músculo, tendões"],
    cu: ["1 - Sem curativo", "2 - Troca de curativo 1x/dia", "3 - Troca de curativo 2x/dia", "4 - Troca de curativo 3x/dia"],
    tc: ["1 - Sem curativo", "2 - Tempo de troca entre 05 e 15min", "3 - Tempo de troca entre 15min a 30min", "4 - Tempo de Troca maior que 30min"]
};

const morseFull = { 
    h: ["Não(0)", "Sim(25)"], 
    d: ["Não(0)", "Sim(15)"], 
    a: ["Nenhum(0)", "Auxílio(15)", "Móveis(30)"], 
    t: ["Não(0)", "Sim(20)"], 
    m: ["Normal(0)", "Fraca(10)", "Comprometida(20)"], 
    e: ["Orientado(0)", "Esquece limites(15)"] 
};

const nandaIntegral = [
    { d: 1, name: "Promoção da Saúde", diagnoses: ["Estilo de vida sedentário", "Controle ineficaz da saúde", "Manutenção ineficaz da saúde", "Comportamento de saúde propenso a risco", "Síndrome do idoso frágil", "Autogestão ineficaz da saúde", "Prontidão para autogestão aprimorada da saúde", "Comportamentos de manutenção doméstica ineficazes"] },
    { d: 2, name: "Nutrição", diagnoses: ["Deglutição prejudicada", "Nutrição desequilibrada: menor que as necessidades", "Volume de líquidos deficiente", "Risco de volume de líquidos deficiente", "Excesso de volume de líquidos", "Risco de desequilíbrio eletrolítico", "Risco de glicemia instável", "Função hepática prejudicada", "Risco de função hepática prejudicada", "Produção insuficiente de leite materno", "Amamentação ineficaz", "Dinâmica alimentar infantil ineficaz", "Obesidade", "Sobrepeso", "Risco de sobrepeso", "Resposta ineficaz de sucção e deglutição do bebê"] },
    { d: 3, name: "Eliminação e Troca", diagnoses: ["Eliminação urinária prejudicada", "Retenção urinária", "Risco de retenção urinária", "Incontinência urinária de esforço", "Incontinência urinária de urgência", "Incontinência urinária mista", "Incontinência urinária associada à deficiência", "Constipação", "Risco de constipação", "Constipação percebida", "Constipação funcional crônica", "Risco de constipação funcional crônica", "Continência intestinal prejudicada", "Diarreia", "Incontinência fecal", "Motilidade gastrintestinal disfuncional", "Risco de motilidade gastrintestinal disfuncional", "Troca de gases prejudicada", "Função gastrintestinal prejudicada"] },
    { d: 4, name: "Atividade/Repouso", diagnoses: ["Distúrbio no padrão do sono", "Privação de sono", "Prontidão para sono aprimorado", "Insônia", "Diminuição da tolerância à atividade", "Risco de diminuição da tolerância à atividade", "Mobilidade física prejudicada", "Mobilidade no leito prejudicada", "Mobilidade em cadeira de rodas prejudicada", "Risco de síndrome do desuso", "Fadiga", "Débito cardíaco diminuído", "Risco de diminuição do débito cardíaco", "Risco de função cardiovascular prejudicada", "Padrão respiratório ineficaz", "Limpeza ineficaz de vias aéreas", "Resposta disfuncional ao desmame ventilatório", "Perfusão tissular periférica ineficaz", "Risco de perfusão tissular periférica ineficaz", "Ventilação espontânea prejudicada", "Risco de sangramento", "Risco de trombose", "Déficit no autocuidado para banho/higiene", "Déficit no autocuidado para alimentação", "Déficit no autocuidado para vestir-se", "Déficit no autocuidado para eliminação"] },
    { d: 5, name: "Percepção/Cognição", diagnoses: ["Confusão aguda", "Risco de confusão aguda", "Confusão crônica", "Memória prejudicada", "Conhecimento deficiente", "Prontidão para conhecimento aprimorado", "Comunicação verbal prejudicada", "Processo de pensamento perturbado", "Controle de impulso ineficaz", "Controle emocional instável", "Negligência unilateral"] },
    { d: 6, name: "Autopercepção", diagnoses: ["Desesperança", "Risco de dignidade humana comprometida", "Autoestima baixa crônica", "Autoestima baixa situacional", "Distúrbio na imagem corporal", "Identidade pessoal perturbada"] },
    { d: 7, name: "Papéis e Relações", diagnoses: ["Processos familiares disfuncionais", "Processos familiares interrompidos", "Tensão do papel de cuidador", "Risco de tensão do papel de cuidador", "Interação social prejudicada", "Desempenho de papel ineficaz", "Síndrome de identidade familiar perturbada", "Paternidade ou maternidade prejudicada"] },
    { d: 8, name: "Sexualidade", diagnoses: ["Padrão de sexualidade ineficaz", "Disfunção sexual", "Processo de maternidade ineficaz", "Risco de processo de maternidade ineficaz", "Risco de díade materno-fetal perturbada"] },
    { d: 9, name: "Enfrentamento/Stress", diagnoses: ["Ansiedade", "Medo", "Tristeza crônica", "Luto desadaptativo", "Risco de luto desadaptativo", "Enfrentamento ineficaz", "Enfrentamento familiar comprometido", "Impotência", "Risco de impotência", "Resiliência prejudicada", "Síndrome do trauma de estupro", "Síndrome do estresse de mudança", "Planejamento de atividades ineficaz", "Disreflexia autonômica", "Comportamento infantil desorganizado"] },
    { d: 10, name: "Princípios de Vida", diagnoses: ["Sofrimento espiritual", "Risco de sofrimento espiritual", "Conflito de decisões", "Não adesão", "Angústia moral", "Religiosidade prejudicada"] },
    { d: 11, name: "Segurança/Proteção", diagnoses: ["Risco de infecção", "Integridade da pele prejudicada", "Risco de integridade da pele prejudicada", "Integridade tissular prejudicada", "Risco de lesão por pressão em adulto", "Risco de lesão por pressão infantil", "Risco de lesão por pressão neonatal", "Risco de queda", "Risco de aspiração", "Risco de choque", "Risco de trauma vascular", "Risco de lesão do trato urinário", "Risco de lesão de posicionamento perioperatório", "Termorregulação ineficaz", "Hipertermia", "Hipotermia", "Risco de hipotermia", "Risco de reação alérgica", "Risco de comportamento suicida", "Automutilação"] },
    { d: 12, name: "Conforto", diagnoses: ["Dor aguda", "Dor crônica", "Síndrome de dor crônica", "Dor do parto", "Conforto prejudicado", "Náusea", "Isolamento social"] },
    { d: 13, name: "Cresc. e Desenvolv.", diagnoses: ["Atraso no desenvolvimento infantil", "Risco de atraso no desenvolvimento infantil", "Atraso no desenvolvimento motor infantil", "Risco de atraso no desenvolvimento motor infantil"] }
];

const CalcScaleRadio = ({ label, options, values, value, onChange, color='blue' }) => {
    const colorStyles = { orange: 'bg-orange-600 border-orange-500 text-white shadow-md', blue: 'bg-blue-600 border-blue-500 text-white shadow-md', emerald: 'bg-emerald-600 border-emerald-500 text-white shadow-md', purple: 'bg-purple-600 border-purple-500 text-white shadow-md', cyan: 'bg-cyan-600 border-cyan-500 text-white shadow-md' };
    const titleColors = { orange: 'text-orange-400', blue: 'text-blue-400', emerald: 'text-emerald-400', purple: 'text-purple-400', cyan: 'text-cyan-400' };
    return (
        <div className="space-y-2 mb-4">
            <div className={`text-[11px] font-black uppercase tracking-widest ${titleColors[color]}`}>{label}</div>
            <div className="flex flex-col gap-2">
                {options.map((opt, idx) => {
                    const val = values ? values[idx] : (typeof opt === 'string' ? idx + 1 : opt);
                    const active = value === val;
                    return (
                        <button key={idx} type="button" onClick={() => onChange(val)} className={`text-left px-4 py-3 rounded-xl text-xs md:text-sm font-semibold transition-all border ${active ? colorStyles[color] : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700/50 hover:text-slate-200'}`}>
                            {opt}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

const InputField = ({ label, value, onChange, placeholder='' }) => (
    <div className="w-full mb-3">
        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</div>
        <input className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}/>
    </div>
);

const TextAreaField = ({ label, value, onChange, h="h-32", placeholder='' }) => (
    <div className="w-full mb-3">
        <div className="text-[10px] font-bold uppercase text-slate-400 mb-1">{label}</div>
        <textarea className={`w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-sm text-white focus:border-blue-500 outline-none ${h}`} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
);

const ElimButtonGroup = ({ label, options, currentVal, onSelect }) => (
    <div className="mb-3">
        <div className="text-[9px] text-slate-500 uppercase font-bold mb-1.5">{label}</div>
        <div className="flex flex-wrap gap-1.5">
            {options.map(o => (
                <button key={o} type="button" onClick={() => onSelect(o)} className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${currentVal === o ? 'bg-blue-600 border-blue-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-700/50 hover:text-slate-200'}`}>
                    {o}
                </button>
            ))}
        </div>
    </div>
);
