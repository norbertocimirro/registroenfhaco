const SoicApp = () => {
    const [activeTab, setActiveTab] = useState('EVOLUCAO');
    const [activeSection, setActiveSection] = useState('S');
    const [openScale, setOpenScale] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [copySuccess, setCopySuccess] = useState(false);

    const initialSoicState = {
        adm: { procedencia: '', acompanhante: '', queixa: '', hpp: '' },
        subjetivo: '', sv: { pa: '', fc: '', fr: '', temp: '', spo2: '', hgt: '', eva: '' },
        exame: {}, exameObs: '', terapias: [], vasculares: [], viasAereas: [], sondasDrenos: [], diagnosticos: [],
        interpretacao: '', condutas: [], obs: '',
        elims: { vesical: {via:'', aspecto:'', volume:'', ml:''}, intestinal: {via:'', aspecto:'', freq:''} },
        escalas: { 
            glasgow: { o:null, v:null, m:null },
            braden: { p:null, u:null, a:null, m:null, n:null, f:null }, 
            morse: { h:null, d:null, a:null, t:null, m:null, e:null }, 
            fugulin: { em:null, ox:null, sv:null, mo:null, de:null, al:null, cc:null, el:null, te:null, ic:null, cu:null, tc:null } 
        },
        alta: { condicoes: '', destino: '', orientacoes: '' }
    };
    const [form, setForm] = useState(initialSoicState);

    const glasgowCalc = useMemo(() => { 
        const g=form.escalas.glasgow; if(g.o===null && g.v===null && g.m===null) return {t: 0, r: "Pendente"};
        const t=(g.o||0)+(g.v||0)+(g.m||0); 
        let r = "Leve / Normal";
        if(t >= 3 && t <= 8) r = "Grave";
        else if(t >= 9 && t <= 12) r = "Moderado";
        return {t, r}; 
    }, [form.escalas.glasgow]);

    const bradenCalc = useMemo(() => { 
        const b=form.escalas.braden; if(b.p===null && b.u===null && b.a===null && b.m===null && b.n===null && b.f===null) return {t: 0, r: "Pendente"};
        const t=(b.p||0)+(b.u||0)+(b.a||0)+(b.m||0)+(b.n||0)+(b.f||0); return {t, r: t>=19?"Sem Risco":t>=15?"Baixo":t>=13?"Moderado":t>=10?"Alto":"Muito Elevado"}; 
    }, [form.escalas.braden]);

    const morseCalc = useMemo(() => { 
        const m=form.escalas.morse; if(m.h===null && m.d===null && m.a===null && m.t===null && m.m===null && m.e===null) return {t: 0, r: "Pendente"};
        const t=(m.h||0)+(m.d||0)+(m.a||0)+(m.t||0)+(m.m||0)+(m.e||0); return {t, r: t>=45?"Elevado":t>=25?"Moderado":"Baixo"}; 
    }, [form.escalas.morse]);

    const fugulinCalc = useMemo(() => { 
        const f = form.escalas.fugulin; const vals = Object.values(f); if(vals.every(x => x === null)) return {t: 0, d: "Pendente"};
        const t = vals.reduce((a,b)=>(a||0)+(b||0),0); return {t, d: t>34?"Intensivos":t>=30?"Semi-Int.":t>=24?"Alta Dep.":t>=18?"Intermediários":"Mínimos"}; 
    }, [form.escalas.fugulin]);

    const smartSuggestions = useMemo(() => {
        const items = [];
        const add = (tag, text) => {
            if (!items.some(i => i.text === text)) items.push({ tag, text });
        };

        const geral = form.exame['Geral'] || [];
        const obsLower = (form.exameObs || '').toLowerCase();
        const diagsLower = (form.diagnosticos || []).join(' ').toLowerCase();
        const tempVal = parseFloat((form.sv.temp || '').replace(',', '.'));
        const spo2Val = parseFloat((form.sv.spo2 || '').replace(',', '.'));
        const fcVal = parseFloat((form.sv.fc || '').replace(',', '.'));
        const frVal = parseFloat((form.sv.fr || '').replace(',', '.'));
        const hgtVal = parseFloat((form.sv.hgt || '').replace(',', '.'));
        const evaVal = parseFloat((form.sv.eva || '').replace(',', '.'));

        if (!isNaN(tempVal) && tempVal >= 37.8) add("Febre", "Monitorar curva térmica rigorosamente, aplicar medidas físicas de resfriamento e administrar antitérmicos conforme prescrição médica.");
        if (!isNaN(tempVal) && tempVal > 0 && tempVal < 36.0) add("Hipotermia", "Instituir medidas de aquecimento ativo/passivo (mantas térmicas/cobertores) e monitorar temperatura axilar.");
        if ((!isNaN(spo2Val) && spo2Val > 0 && spo2Val < 94) || (!isNaN(frVal) && frVal > 22)) add("Respiratório", "Monitorar oximetria de pulso contínua, avaliar padrão e esforço respiratório e otimizar oxigenoterapia conforme prescrição.");
        if (!isNaN(fcVal) && (fcVal > 100 || (fcVal > 0 && fcVal < 55))) add("Hemodinâmica", "Manter monitorização cardíaca contínua, avaliar perfusão periférica e comunicar alterações de ritmo ou frequência à equipe médica.");
        if ((!isNaN(evaVal) && evaVal > 0) || diagsLower.includes('dor')) add("Dor / Conforto", "Reavaliar escala de dor (EVA) periodicamente, aplicar medidas não farmacológicas de conforto e administrar analgesia conforme prescrição.");
        if ((!isNaN(hgtVal) && (hgtVal < 70 || hgtVal > 180)) || diagsLower.includes('glicemia')) add("Glicemia", "Realizar controle rigoroso de glicemia capilar conforme protocolo institucional e comunicar variações extremas.");

        if ((glasgowCalc.t > 0 && glasgowCalc.t <= 14) || geral.includes("Interação Reduzida") || geral.includes("Sonolento")) add("Neurológico", "Manter vigilância neurológica rigorosa, avaliando nível de consciência (Glasgow), reatividade pupilar e resposta motora.");
        if ((bradenCalc.t > 0 && bradenCalc.t <= 18) || geral.includes("Pele Friável") || diagsLower.includes('pressão') || diagsLower.includes('pele')) add("Braden / LPP", "Manter medidas de prevenção de lesão por pressão, incluindo mudanças de decúbito 2/2h conforme tolerância clínica, alívio de proeminências ósseas e hidratação cutânea.");
        if ((morseCalc.t >= 25) || diagsLower.includes('queda')) add("Morse / Quedas", "Manter medidas de prevenção de quedas (grades elevadas, leito travado e campainha ao alcance) e prevenção de eventos adversos.");
        if (fugulinCalc.t >= 24) add("Fugulin", "Manter vigilância intensiva de enfermagem, assistência integral nas necessidades humanas básicas e monitorização multiparamétrica.");

        if (geral.includes("Dispnéico") || diagsLower.includes('respirat') || diagsLower.includes('gases')) add("Padrão Resp.", "Avaliar ausculta pulmonar, frequência, ritmo e esforço respiratório, mantendo cabeceira elevada.");
        if (geral.includes("Edema Periférico") || obsLower.includes("edema")) add("Edema / BH", "Avaliar evolução de edema periférico, perfusão tissular distal e realizar controle rigoroso do balanço hídrico.");
        if (geral.includes("Pele Friável") || obsLower.includes("lesão") || obsLower.includes("lesao") || obsLower.includes("hematoma") || obsLower.includes("ferida") || obsLower.includes("úlcera") || obsLower.includes("ulcera")) add("Pele / Lesões", "Avaliar e monitorar lesões cutâneas/hematomas quanto à extensão, aspecto, exsudato e sinais de infecção, realizando proteção local e evitando fricção ou trauma.");
        if (obsLower.includes("rabdomi") || obsLower.includes("compartimental") || obsLower.includes("mialgia")) add("Vigilância Muscular", "Observar sinais de síndrome compartimental (dor desproporcional, aumento de tensão muscular e alterações neurovasculares) e monitorar alterações eletrolíticas/ECG.");
        if (geral.includes("Abdome Flácido") || obsLower.includes("abdome") || obsLower.includes("globoso") || obsLower.includes("distendido")) add("Gastrointestinal", "Avaliar distensão e perímetro abdominal, ruídos hidroaéreos, aceitação alimentar e padrão de eliminação intestinal.");

        if ((form.terapias || []).includes("Em hemotransfusão (CHAD)")) add("Hemotransfusão", "Acompanhar hemotransfusão conforme prescrição médica, monitorando sinais vitais e possíveis manifestações de reação transfusional.");
        if ((form.terapias || []).includes("Em uso de DVA")) add("DVA", "Monitorar infusão contínua de drogas vasoativas (DVA) em bomba de infusão, avaliando pressão arterial, frequência cardíaca e perfusão periférica.");
        if ((form.terapias || []).includes("Sedação contínua")) add("Sedação", "Avaliar nível de sedação (escala RASS), reflexos protetores de via aérea e realizar cuidados oculares.");
        if ((form.terapias || []).includes("Dieta enteral contínua") || (form.sondasDrenos || []).some(s => (s.tipo || '').toUpperCase().includes("SNE"))) add("Dieta Enteral", "Manter dieta enteral conforme prescrição em bomba de infusão com cabeceira elevada (30° a 45°), observando tolerância gastrointestinal e glicemia capilar.");
        if ((form.terapias || []).includes("Hidratação venosa contínua")) add("Hidratação", "Administrar hidratação venosa conforme prescrição médica, monitorando resposta clínica e balanço hídrico.");

        (form.vasculares || []).forEach(v => {
            const tUp = (v.tipo || '').toUpperCase();
            if (tUp.includes("CVC") || tUp.includes("PICC") || tUp.includes("PAI")) add("CVC / Invasivo", `Manter cuidados com ${v.tipo}${v.sitio ? ' em ' + v.sitio : ''}, avaliando sítio de inserção, integridade do curativo estéril, conexões e permeabilidade dos lúmens.`);
            else add("Acesso Venoso", `Avaliar condições do acesso venoso (${v.tipo}${v.sitio ? ' em ' + v.sitio : ''}), observando fixação, permeabilidade e sinais flogísticos.`);
        });

        (form.viasAereas || []).forEach(va => {
            const vaUp = (va.tipo || '').toUpperCase();
            if (vaUp.includes("TQT") || vaUp.includes("TOT") || vaUp.includes("VMI")) add("VMI / Via Aérea", `Manter vigilância da adaptação à ventilação mecânica e cuidados com ${va.tipo}, incluindo checagem de fixação, pressão de cuff e aspiração conforme necessidade.`);
            else add("Oxigenoterapia", `Manter cuidados e umidificação com dispositivo de oxigenoterapia (${va.tipo}), avaliando integridade cutânea local.`);
        });

        (form.sondasDrenos || []).forEach(sd => {
            if (!(sd.tipo || '').toUpperCase().includes("SNE")) add("Drenos / Sondas", `Manter cuidados com ${sd.tipo}, observando permeabilidade, fixação, aspecto e volume drenado.`);
        });

        if (form.elims.vesical.via === 'SVD' || form.elims.vesical.via === 'SVA' || form.elims.vesical.via === 'Urostomia') add("Sonda Vesical", `Manter cuidados com dispositivo urinário (${form.elims.vesical.via}), garantindo fixação adequada, sistema fechado abaixo do nível da bexiga e higiene íntima rigorosa.`);
        if (form.elims.vesical.volume || form.elims.vesical.ml || ['Concentrado', 'Colúrico', 'Hematúrico', 'Piúrico'].includes(form.elims.vesical.aspecto)) add("Diurese / BH", "Realizar controle rigoroso da diurese e do balanço hídrico, observando características da urina, alterações de coloração e redução do débito urinário.");
        if (['Líquida/Diarreia', 'Melena', 'Enterorragia'].includes(form.elims.intestinal.aspecto) || form.elims.intestinal.via === 'Fralda') add("Intestinal / Pele", "Monitorar frequência e aspecto das evacuações, realizando higiene íntima pronta e proteção da pele perianal.");
        if ((form.elims.intestinal.freq || '').includes('Ausente')) add("Eliminação Int.", "Acompanhar padrão de eliminação intestinal, ruídos hidroaéreos e distensão abdominal.");

        return items;
    }, [form, glasgowCalc, bradenCalc, morseCalc, fugulinCalc]);

    const condutasGeraisList = [
        "Manter monitorização hemodinâmica, respiratória e neurológica contínua.",
        "Manter medidas de prevenção de infecções relacionadas à assistência à saúde (IRAS).",
        "Monitorar temperatura corporal e sinais sugestivos de infecção.",
        "Manter medidas de segurança do paciente e prevenção de quedas e eventos adversos.",
        "Comunicar prontamente alterações clínicas, intercorrências e resultados laboratoriais críticos à equipe médica e multiprofissional."
    ];

    const applyAllSuggestions = () => {
        setForm(prev => ({
            ...prev,
            condutas: Array.from(new Set([...prev.condutas, ...smartSuggestions.map(s => s.text)]))
        }));
    };

    const toggleElim = (tipo, campo, val) => {
        setForm(prev => ({ ...prev, elims: { ...prev.elims, [tipo]: { ...prev.elims[tipo], [campo]: prev.elims[tipo][campo] === val ? '' : val } } }));
    };

    const updateMorse = (campo, val) => {
        setForm(prev => ({ ...prev, escalas: { ...prev.escalas, morse: { ...prev.escalas.morse, [campo]: val } } }));
    };

    const generateText = () => {
        if (activeTab === 'ADMISSAO') {
            let admText = `ADMISSÃO ENFERMAGEM - HACO\n----------------------------------\n[HISTÓRICO]\nProcedência: ${form.adm.procedencia||'--'}\nAcompanhante: ${form.adm.acompanhante||'--'}\nQueixa Principal: ${form.adm.queixa||'--'}\nHPP e Alergias: ${form.adm.hpp||'--'}`;
            const svParts = [];
            if (form.sv.pa) svParts.push(`PA: ${form.sv.pa}`);
            if (form.sv.fc) svParts.push(`FC: ${form.sv.fc}`);
            if (form.sv.fr) svParts.push(`FR: ${form.sv.fr}`);
            if (form.sv.temp) svParts.push(`T: ${form.sv.temp}`);
            if (form.sv.spo2) svParts.push(`Sat: ${form.sv.spo2}%`);
            if (form.sv.hgt) svParts.push(`HGT: ${form.sv.hgt}`);
            if (form.sv.eva) svParts.push(`Dor (EVA): ${form.sv.eva}`);
            if (svParts.length > 0) admText += `\n\n[SINAIS VITAIS ENTRADA]\n${svParts.join(' | ')}`;
            return admText + `\n----------------------------------\n[Resolução 736/2024 - GT SAE HACO]`;
        }
        if (activeTab === 'ALTA') return `ALTA DE ENFERMAGEM - HACO\n----------------------------------\n- Condições de Alta: ${form.alta.condicoes||'--'}\n- Destino da Alta: ${form.alta.destino||'--'}\n- Orientações Fornecidas: ${form.alta.orientacoes||'--'}\n----------------------------------\nPaciente ciente.`;
        
        let text = `S: ${form.subjetivo || 'Paciente sem queixas no período.'}\n\n`;
        text += `O: `;
        
        const svParts = [];
        if (form.sv.pa) svParts.push(`PA: ${form.sv.pa}`);
        if (form.sv.fc) svParts.push(`FC: ${form.sv.fc}`);
        if (form.sv.fr) svParts.push(`FR: ${form.sv.fr}`);
        if (form.sv.temp) svParts.push(`T: ${form.sv.temp}`);
        if (form.sv.spo2) svParts.push(`Sat: ${form.sv.spo2}%`);
        if (form.sv.hgt) svParts.push(`HGT: ${form.sv.hgt}`);
        if (form.sv.eva) svParts.push(`EVA: ${form.sv.eva}`);

        let oBlocks = [];
        if (svParts.length > 0) oBlocks.push(`[SINAIS VITAIS]\n${svParts.join(' | ')}`);

        const scaleLines = [];
        if (glasgowCalc.t > 0) scaleLines.push(`- Glasgow: ${glasgowCalc.t} (${glasgowCalc.r})`);
        if (bradenCalc.t > 0) scaleLines.push(`- Braden: ${bradenCalc.t} (${bradenCalc.r})`);
        if (morseCalc.t > 0) scaleLines.push(`- Morse: ${morseCalc.t} (${morseCalc.r})`);
        if (fugulinCalc.t > 0) scaleLines.push(`- Fugulin: ${fugulinCalc.t} (${fugulinCalc.d})`);
        if (scaleLines.length > 0) oBlocks.push(`[ESCALAS TÉCNICAS]\n${scaleLines.join('\n')}`);

        let exameLines = [];
        Object.entries(form.exame).forEach(([cat, vals]) => { if (vals.length > 0) exameLines.push(`- ${cat}: ${vals.join(', ')}`); });
        if (form.exameObs && form.exameObs.trim()) exameLines.push(`- Achados Clínicos: ${form.exameObs.trim()}`);
        if (form.terapias.length > 0) exameLines.push(`- Terapias / Infusões: ${form.terapias.join(', ')}`);
        if (exameLines.length > 0) oBlocks.push(exameLines.join('\n'));

        const hasVesical = form.elims.vesical.via || form.elims.vesical.aspecto || form.elims.vesical.volume || form.elims.vesical.ml;
        const hasIntestinal = form.elims.intestinal.via || form.elims.intestinal.aspecto || form.elims.intestinal.freq;
        if (hasVesical || hasIntestinal) {
            let elimLines = [`[ELIMINAÇÕES FISIOLÓGICAS]`];
            if (hasVesical) {
                const vParts = [];
                if (form.elims.vesical.via) vParts.push(form.elims.vesical.via);
                if (form.elims.vesical.aspecto) vParts.push(`Aspecto: ${form.elims.vesical.aspecto}`);
                if (form.elims.vesical.volume || form.elims.vesical.ml) vParts.push(`Vol: ${[form.elims.vesical.volume, form.elims.vesical.ml ? `(${form.elims.vesical.ml})` : ''].filter(Boolean).join(' ')}`);
                elimLines.push(`- Vesical: ${vParts.join(' | ')}`);
            }
            if (hasIntestinal) {
                const iParts = [];
                if (form.elims.intestinal.via) iParts.push(form.elims.intestinal.via);
                if (form.elims.intestinal.aspecto) iParts.push(`Aspecto: ${form.elims.intestinal.aspecto}`);
                if (form.elims.intestinal.freq) iParts.push(`Freq: ${form.elims.intestinal.freq}`);
                elimLines.push(`- Intestinal: ${iParts.join(' | ')}`);
            }
            oBlocks.push(elimLines.join('\n'));
        }

        if (form.vasculares.length > 0 || form.viasAereas.length > 0 || form.sondasDrenos.length > 0) {
            let invLines = [`[INVASIVOS E DRENOS]`];
            form.vasculares.forEach(v => invLines.push(`- Acesso: ${v.tipo}${v.sitio ? ' em ' + v.sitio : ''}${v.obs ? ' (' + v.obs + ')' : ''}`));
            form.viasAereas.forEach(va => invLines.push(`- Via Aérea: ${va.tipo}${va.fixacao ? ' (Fixação: ' + va.fixacao + 'cm)' : ''}`));
            form.sondasDrenos.forEach(e => invLines.push(`- Dreno/Sonda: ${e.tipo}${e.aspecto ? ' | Asp: ' + e.aspecto : ''}${e.debito ? ' | Débito: ' + e.debito + 'ml' : ''}`));
            oBlocks.push(invLines.join('\n'));
        }

        text += (oBlocks.length > 0 ? oBlocks.join('\n\n') : 'Sem alterações objetivas registradas.') + '\n\n';
        text += `I: [NANDA-I]\n`;
        if (form.diagnosticos.length > 0) form.diagnosticos.forEach(d => text += `- ${d}\n`);
        else text += `- Sem novos diagnósticos prioritários.\n`;
        text += `Raciocínio Clínico: ${form.interpretacao || 'Manutenção do quadro atual.'}\n\n`;
        
        text += `C: [PLANO DE CUIDADOS E CONDUTAS]\n`;
        if (form.condutas.length > 0) form.condutas.forEach(c => text += `     ${c}\n`);
        else text += `     Manter cuidados de enfermagem de rotina e vigilância clínica.\n`;
        if (form.obs && form.obs.trim()) text += `     ${form.obs.trim()}\n`;
        return text + `\n[Resolução COFEN 736/2024 - GT SAE HACO]`;
    };

    const copyAghuse = () => { navigator.clipboard.writeText(generateText()); setCopySuccess(true); setTimeout(()=>setCopySuccess(false), 2000); };
    const toggleExame = (cat, val) => { const c = form.exame[cat]||[]; setForm({...form, exame: {...form.exame, [cat]: c.includes(val)?c.filter(x=>x!==val):[...c, val]}}); };
    const toggleTerapia = (val) => { setForm(p => ({...p, terapias: p.terapias.includes(val) ? p.terapias.filter(x=>x!==val) : [...p.terapias, val]})); };
    const appendSubjetivo = (frase) => { setForm(p => ({...p, subjetivo: p.subjetivo ? `${p.subjetivo} ${frase}` : frase})); };

    return (
        <div className="flex flex-col lg:flex-row h-full gap-6 animate-fade">
            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl flex flex-col overflow-hidden">
                <div className="bg-slate-800 p-3 border-b border-slate-700 flex justify-between items-center overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        <button type="button" onClick={()=>setActiveTab('ADMISSAO')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${activeTab==='ADMISSAO'?'bg-blue-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>Admissão</button>
                        <button type="button" onClick={()=>setActiveTab('EVOLUCAO')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${activeTab==='EVOLUCAO'?'bg-emerald-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>Evolução (SOIC)</button>
                        <button type="button" onClick={()=>setActiveTab('ALTA')} className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors ${activeTab==='ALTA'?'bg-red-600 text-white':'text-slate-400 hover:bg-slate-700'}`}>Alta</button>
                    </div>
                    <button type="button" onClick={()=> {if(window.confirm("Limpar dados do prontuário atual?")) setForm(initialSoicState);}} className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase transition-colors bg-slate-700 text-slate-300 hover:bg-red-600 hover:text-white flex items-center gap-2">
                        <Icons.Trash size={14}/> Limpar
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
                    {activeTab === 'ADMISSAO' && (
                        <div className="space-y-6">
                            <div className="space-y-4">
                                <InputField label="Procedência" value={form.adm.procedencia} onChange={v=>setForm({...form, adm:{...form.adm, procedencia:v}})}/>
                                <InputField label="Acompanhante" value={form.adm.acompanhante} onChange={v=>setForm({...form, adm:{...form.adm, acompanhante:v}})}/>
                                <TextAreaField label="Queixa Principal / Motivo da Internação" value={form.adm.queixa} onChange={v=>setForm({...form, adm:{...form.adm, queixa:v}})} h="h-24"/>
                                <TextAreaField label="História Pregressa (HPP) e Alergias" value={form.adm.hpp} onChange={v=>setForm({...form, adm:{...form.adm, hpp:v}})} h="h-32"/>
                            </div>
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                <div className="text-[10px] font-bold uppercase text-slate-400 mb-3">Sinais Vitais de Entrada</div>
                                <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                                    {['pa','fc','fr','temp','spo2','hgt','eva'].map(v=><div key={v} className="bg-slate-900 p-2 rounded-lg border border-slate-700"><div className="text-[8px] font-bold uppercase text-slate-500 mb-1">{v==='eva'?'Dor':v}</div><input className="w-full bg-transparent text-sm font-bold text-white outline-none" value={form.sv[v]} onChange={e=>setForm({...form,sv:{...form.sv,[v]:e.target.value}})} placeholder="-"/></div>)}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'ALTA' && (
                        <div className="space-y-6">
                            <TextAreaField label="Condições de Alta" value={form.alta.condicoes} onChange={v=>setForm({...form, alta:{...form.alta, condicoes:v}})} h="h-32"/>
                            <InputField label="Destino da Alta (Casa, Transferência, Óbito)" placeholder="Ex: Casa, UTI, CTI..." value={form.alta.destino} onChange={v=>setForm({...form, alta:{...form.alta, destino:v}})}/>
                            <TextAreaField label="Orientações Fornecidas e Prescrições" value={form.alta.orientacoes} onChange={v=>setForm({...form, alta:{...form.alta, orientacoes:v}})} h="h-48"/>
                        </div>
                    )}

                    {activeTab === 'EVOLUCAO' && (
                        <div className="space-y-6">
                            <div className="flex gap-2 bg-slate-800 p-2 rounded-xl border border-slate-700 overflow-x-auto no-scrollbar">
                                {[
                                    {id: 'S', label: 'Subjetivo (S)'},
                                    {id: 'O', label: 'Objetivo (O)'},
                                    {id: 'I', label: 'Diag. NANDA (I)'},
                                    {id: 'C', label: `Conduta (C)${smartSuggestions.length > 0 ? ` • ${smartSuggestions.length}` : ''}`}
                                ].map(s=><button key={s.id} type="button" onClick={()=>setActiveSection(s.id)} className={`flex-1 min-w-[115px] py-2.5 rounded-lg text-[11px] font-black transition-all ${activeSection===s.id?'bg-emerald-600 text-white shadow-md':'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300'}`}>{s.label}</button>)}
                            </div>
                            
                            {activeSection === 'S' && (
                                <div className="space-y-4">
                                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                                        <div className="text-[10px] font-bold uppercase text-emerald-400 mb-3">Inserção Rápida (Subjetivo)</div>
                                        <div className="flex flex-wrap gap-2">
                                            {[
                                                "Paciente sem queixas no período.",
                                                "Refere melhora do quadro álgico.",
                                                "Apresenta interação reduzida, limitando a obtenção de informações subjetivas.",
                                                "Paciente sob sedação / VMI, impossibilitado de verbalizar queixas."
                                            ].map(f => (
                                                <button key={f} type="button" onClick={() => appendSubjetivo(f)} className="px-3 py-2 rounded-lg text-[10px] font-bold bg-slate-900 border border-slate-700 text-slate-300 hover:border-emerald-500 hover:text-white transition-colors text-left">
                                                    + {f}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <TextAreaField label="Relato Subjetivo / Queixas" h="h-48" value={form.subjetivo} onChange={v=>setForm({...form, subjetivo:v})} placeholder="Clique nas opções acima ou digite as queixas relatadas..." />
                                </div>
                            )}
                            
                            {activeSection === 'O' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-4 lg:grid-cols-7 gap-2">
                                        {['pa','fc','fr','temp','spo2','hgt','eva'].map(v=><div key={v} className="bg-slate-800 p-3 rounded-xl border border-slate-700"><div className="text-[9px] font-bold uppercase text-slate-500 mb-1">{v==='eva'?'Dor':v}</div><input className="w-full bg-transparent text-sm font-bold text-white outline-none" value={form.sv[v]} onChange={e=>setForm({...form,sv:{...form.sv,[v]:e.target.value}})} placeholder="-"/></div>)}
                                    </div>

                                    <div className="bg-slate-800 p-4 md:p-5 rounded-xl border border-slate-700">
                                        <div className="text-[10px] font-bold uppercase text-blue-400 mb-3">Avaliação de Escalas Técnicas</div>
                                        <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                                            <button type="button" onClick={()=>setOpenScale(openScale==='glasgow'?null:'glasgow')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${openScale==='glasgow'?'bg-orange-600 text-white shadow-md':'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>Glasgow: {glasgowCalc.t > 0 ? glasgowCalc.t : '-'}</button>
                                            <button type="button" onClick={()=>setOpenScale(openScale==='braden'?null:'braden')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${openScale==='braden'?'bg-blue-600 text-white shadow-md':'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>Braden: {bradenCalc.t > 0 ? bradenCalc.t : '-'}</button>
                                            <button type="button" onClick={()=>setOpenScale(openScale==='morse'?null:'morse')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${openScale==='morse'?'bg-purple-600 text-white shadow-md':'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>Morse: {morseCalc.t > 0 ? morseCalc.t : '-'}</button>
                                            <button type="button" onClick={()=>setOpenScale(openScale==='fugulin'?null:'fugulin')} className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${openScale==='fugulin'?'bg-emerald-600 text-white shadow-md':'bg-slate-900 border border-slate-700 text-slate-400 hover:bg-slate-800'}`}>Fugulin: {fugulinCalc.t > 0 ? fugulinCalc.t : '-'}</button>
                                        </div>
                                        
                                        {openScale === 'glasgow' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-700 animate-fade"><CalcScaleRadio color="orange" label={titlesGlasgow.o} options={glasgowFull.o} values={[4,3,2,1]} value={form.escalas.glasgow.o} onChange={v=>setForm({...form,escalas:{...form.escalas,glasgow:{...form.escalas.glasgow,o:v}}})}/> <CalcScaleRadio color="orange" label={titlesGlasgow.v} options={glasgowFull.v} values={[5,4,3,2,1]} value={form.escalas.glasgow.v} onChange={v=>setForm({...form,escalas:{...form.escalas,glasgow:{...form.escalas.glasgow,v:v}}})}/> <CalcScaleRadio color="orange" label={titlesGlasgow.m} options={glasgowFull.m} values={[6,5,4,3,2,1]} value={form.escalas.glasgow.m} onChange={v=>setForm({...form,escalas:{...form.escalas,glasgow:{...form.escalas.glasgow,m:v}}})}/></div>}
                                        {openScale === 'braden' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-700 animate-fade">{Object.entries(bradenFull).map(([k,opts])=><CalcScaleRadio key={k} color="blue" label={titlesBraden[k]} options={opts} value={form.escalas.braden[k]} onChange={v=>setForm({...form,escalas:{...form.escalas,braden:{...form.escalas.braden,[k]:v}}})}/>)}</div>}
                                        {openScale === 'morse' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-700 animate-fade"><CalcScaleRadio color="purple" label="Histórico de Quedas" options={morseFull.h} values={[0,25]} value={form.escalas.morse.h} onChange={v=>updateMorse('h',v)}/> <CalcScaleRadio color="purple" label="Diagnóstico Secundário" options={morseFull.d} values={[0,15]} value={form.escalas.morse.d} onChange={v=>updateMorse('d',v)}/> <CalcScaleRadio color="purple" label="Auxílio na Deambulação" options={morseFull.a} values={[0,15,30]} value={form.escalas.morse.a} onChange={v=>updateMorse('a',v)}/> <CalcScaleRadio color="purple" label="Terapia Endovenosa" options={morseFull.t} values={[0,20]} value={form.escalas.morse.t} onChange={v=>updateMorse('t',v)}/> <CalcScaleRadio color="purple" label="Marcha" options={morseFull.m} values={[0,10,20]} value={form.escalas.morse.m} onChange={v=>updateMorse('m',v)}/> <CalcScaleRadio color="purple" label="Estado Mental" options={morseFull.e} values={[0,15]} value={form.escalas.morse.e} onChange={v=>updateMorse('e',v)}/></div>}
                                        {openScale === 'fugulin' && <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-700 animate-fade">{Object.entries(fugulinFull).map(([k,opts])=><CalcScaleRadio key={k} color="emerald" label={titlesFugulin[k]} options={opts} value={form.escalas.fugulin[k]} onChange={v=>setForm({...form,escalas:{...form.escalas,fugulin:{...form.escalas.fugulin,[k]:v}}})}/>)}</div>}
                                    </div>
                                    
                                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 space-y-4">
                                        <div className="text-[10px] font-bold uppercase text-blue-400">Exame Físico Rápido</div>
                                        <div className="flex flex-wrap gap-2">{["LOTE", "Interação Reduzida", "Sonolento", "Eupnéico", "Dispnéico", "MV+ sem RA", "BRNF", "Hemodinamicamente Estável", "Extremidades Aquecidas", "Pele Íntegra", "Pele Friável", "Descorado", "Edema Periférico", "Abdome Flácido", "Pupilas Isocóricas"].map(o=><button key={o} type="button" onClick={()=>toggleExame('Geral',o)} className={`px-3 py-2 rounded-lg text-[10px] font-bold border transition-colors ${form.exame['Geral']?.includes(o)?'bg-emerald-600 border-emerald-500 text-white shadow-md':'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'}`}>{o}</button>)}</div>
                                        <div className="pt-2">
                                            <InputField label="Complemento / Achados Específicos do Exame Físico" placeholder="Ex: Edema 1+/4+ em MMSS, hematoma palpebral à esquerda, lesão superficial em MID..." value={form.exameObs} onChange={v=>setForm({...form, exameObs:v})}/>
                                        </div>
                                        <div className="pt-2 border-t border-slate-700/60">
                                            <div className="text-[9px] font-bold uppercase text-slate-500 mb-2">Terapias e Infusões em Curso</div>
                                            <div className="flex flex-wrap gap-2">{["Sem uso de DVAs", "Em uso de DVA", "Sem sedação no momento", "Sedação contínua", "Dieta enteral contínua", "Dieta zero", "Em hemotransfusão (CHAD)", "Hidratação venosa contínua"].map(t=><button key={t} type="button" onClick={()=>toggleTerapia(t)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-colors ${form.terapias.includes(t)?'bg-blue-600 border-blue-500 text-white shadow-md':'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500 hover:bg-slate-800'}`}>{t}</button>)}</div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                                        <div className="text-[10px] font-bold uppercase text-blue-400 mb-4">Eliminações Fisiológicas</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 border-b border-slate-800 pb-2">Vesical</h4>
                                                <ElimButtonGroup label="Via de Eliminação" currentVal={form.elims.vesical.via} onSelect={o => toggleElim('vesical', 'via', o)} options={['Espontânea', 'Fralda', 'SVD', 'SVA', 'Urostomia']} />
                                                <ElimButtonGroup label="Aspecto" currentVal={form.elims.vesical.aspecto} onSelect={o => toggleElim('vesical', 'aspecto', o)} options={['Claro/Límpido', 'Concentrado', 'Colúrico', 'Hematúrico', 'Piúrico']} />
                                                <ElimButtonGroup label="Volume/Débito" currentVal={form.elims.vesical.volume} onSelect={o => toggleElim('vesical', 'volume', o)} options={['Presente (Normal)', 'Anúria', 'Oligúria', 'Poliúria']} />
                                                <div className="flex items-center gap-2 mt-2">
                                                    <input className="w-28 bg-slate-800 border border-slate-700 rounded-md px-2 py-1.5 text-xs text-white outline-none focus:border-blue-500 text-center transition-colors" placeholder="Ex: 650ml/12h" value={form.elims.vesical.ml} onChange={e=>setForm({...form, elims:{...form.elims, vesical:{...form.elims.vesical, ml: e.target.value}}})} />
                                                    <span className="text-[10px] text-slate-500 font-bold uppercase">Volume Exato (Opcional)</span>
                                                </div>
                                            </div>
                                            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                                                <h4 className="text-[10px] font-black text-slate-500 uppercase mb-3 border-b border-slate-800 pb-2">Intestinal</h4>
                                                <ElimButtonGroup label="Via de Eliminação" currentVal={form.elims.intestinal.via} onSelect={o => toggleElim('intestinal', 'via', o)} options={['Espontânea', 'Fralda', 'Ostomia']} />
                                                <ElimButtonGroup label="Aspecto" currentVal={form.elims.intestinal.aspecto} onSelect={o => toggleElim('intestinal', 'aspecto', o)} options={['Sólida/Normal', 'Pastosa', 'Líquida/Diarreia', 'Melena', 'Acolia', 'Enterorragia']} />
                                                <ElimButtonGroup label="Frequência" currentVal={form.elims.intestinal.freq} onSelect={o => toggleElim('intestinal', 'freq', o)} options={['Presente (Hoje)', 'Ausente (1 dia)', 'Ausente (2 dias)', 'Ausente (3+ dias)']} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                                        <div className="text-[10px] font-bold uppercase text-blue-400 mb-4">Invasivos, Sondas e Drenos</div>
                                        <div className="flex flex-wrap gap-2 mb-6">
                                            <button type="button" onClick={()=>setForm({...form, vasculares:[...form.vasculares,{id:Date.now(),tipo:'AVP',sitio:'MSD',obs:'Pérvio, sem sinais flogísticos'}]})} className="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-300 transition-colors">+ AVP</button>
                                            <button type="button" onClick={()=>setForm({...form, vasculares:[...form.vasculares,{id:Date.now(),tipo:'CVC Triplo Lúmen',sitio:'VJI Direita',obs:'Curativo limpo e seco, sem sinais flogísticos'}]})} className="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-300 transition-colors">+ CVC</button>
                                            <button type="button" onClick={()=>setForm({...form, viasAereas:[...form.viasAereas,{id:Date.now(),tipo:'TQT em VMI (Modo Suporte)',fixacao:'',cuff:'',secrecao:''}]})} className="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-300 transition-colors">+ TQT / VMI</button>
                                            <button type="button" onClick={()=>setForm({...form, viasAereas:[...form.viasAereas,{id:Date.now(),tipo:'TOT em VMI',fixacao:'22',cuff:'',secrecao:''}]})} className="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-300 transition-colors">+ TOT / VMI</button>
                                            <button type="button" onClick={()=>setForm({...form, sondasDrenos:[...form.sondasDrenos,{id:Date.now(),tipo:'SNE (Dieta contínua)',debito:'',aspecto:'Pérvia, bem fixada'}]})} className="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-300 transition-colors">+ SNE</button>
                                            <button type="button" onClick={()=>setForm({...form, sondasDrenos:[...form.sondasDrenos,{id:Date.now(),tipo:'Dreno',debito:'',aspecto:'Seroso'}]})} className="bg-slate-900 border border-slate-700 hover:border-blue-500 hover:bg-slate-800 px-3 py-2 rounded-lg text-[10px] font-bold text-slate-300 transition-colors">+ Dreno</button>
                                        </div>

                                        <div className="space-y-3">
                                            {form.vasculares.map(v=><div key={v.id} className="flex flex-col sm:flex-row gap-2"><input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 transition-colors" value={v.tipo} onChange={e=>setForm({...form,vasculares:form.vasculares.map(x=>x.id===v.id?{...x,tipo:e.target.value}:x)})} placeholder="Acesso (ex: AVP / CVC)"/><input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 transition-colors" value={v.sitio} onChange={e=>setForm({...form,vasculares:form.vasculares.map(x=>x.id===v.id?{...x,sitio:e.target.value}:x)})} placeholder="Sítio (ex: MSD / VJI D)"/><input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 transition-colors" value={v.obs} onChange={e=>setForm({...form,vasculares:form.vasculares.map(x=>x.id===v.id?{...x,obs:e.target.value}:x)})} placeholder="Obs (Limpo/Pérvio)"/><button type="button" onClick={()=>setForm({...form,vasculares:form.vasculares.filter(x=>x.id!==v.id)})} className="p-3 text-slate-500 hover:text-red-500 hover:bg-slate-900 rounded-lg transition-colors self-end sm:self-auto"><Icons.Trash size={16}/></button></div>)}
                                            {form.viasAereas.map(v=><div key={v.id} className="flex gap-2"><input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 transition-colors" value={v.tipo} onChange={e=>setForm({...form,viasAereas:form.viasAereas.map(x=>x.id===v.id?{...x,tipo:e.target.value}:x)})} placeholder="Via Aérea"/><input className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 text-center transition-colors" value={v.fixacao} onChange={e=>setForm({...form,viasAereas:form.viasAereas.map(x=>x.id===v.id?{...x,fixacao:e.target.value}:x)})} placeholder="Fixação(cm)"/><button type="button" onClick={()=>setForm({...form,viasAereas:form.viasAereas.filter(x=>x.id!==v.id)})} className="p-3 text-slate-500 hover:text-red-500 hover:bg-slate-900 rounded-lg transition-colors"><Icons.Trash size={16}/></button></div>)}
                                            {form.sondasDrenos.map(v=><div key={v.id} className="flex flex-col sm:flex-row gap-2"><input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 transition-colors" value={v.tipo} onChange={e=>setForm({...form,sondasDrenos:form.sondasDrenos.map(x=>x.id===v.id?{...x,tipo:e.target.value}:x)})} placeholder="Sonda/Dreno"/><input className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 transition-colors" value={v.aspecto} onChange={e=>setForm({...form,sondasDrenos:form.sondasDrenos.map(x=>x.id===v.id?{...x,aspecto:e.target.value}:x)})} placeholder="Aspecto / Vazão"/><input className="w-full sm:w-28 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs text-white outline-none focus:border-blue-500 text-center transition-colors" value={v.debito} onChange={e=>setForm({...form,sondasDrenos:form.sondasDrenos.map(x=>x.id===v.id?{...x,debito:e.target.value}:x)})} placeholder="Débito(ml)"/><button type="button" onClick={()=>setForm({...form,sondasDrenos:form.sondasDrenos.filter(x=>x.id!==v.id)})} className="p-3 text-slate-500 hover:text-red-500 hover:bg-slate-900 rounded-lg transition-colors self-end sm:self-auto"><Icons.Trash size={16}/></button></div>)}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeSection === 'I' && (
                                <div className="space-y-4">
                                    <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-sm text-white outline-none focus:border-emerald-500 mb-4 transition-colors" placeholder="Buscar diagnóstico NANDA-I..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                        {nandaIntegral.map(c=>(
                                            <div key={c.d}><div className="text-[10px] font-black uppercase text-slate-500 mb-3 border-l-2 border-emerald-500 pl-2">Domínio {c.d}: {c.name}</div><div className="flex flex-wrap gap-2">{c.diagnoses.filter(d=>d.toLowerCase().includes(searchTerm.toLowerCase())).map(d=><button key={d} type="button" onClick={()=>setForm(p=>({...p,diagnosticos:p.diagnosticos.includes(d)?p.diagnosticos.filter(x=>x!==d):[...p.diagnosticos,d]}))} className={`px-4 py-2 rounded-lg text-[10px] font-bold transition-all ${form.diagnosticos.includes(d)?'bg-emerald-600 text-white shadow-md':'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-700/50'}`}>{d}</button>)}</div></div>
                                        ))}
                                    </div>
                                    <div className="pt-4 border-t border-slate-800">
                                        <TextAreaField label="Raciocínio Clínico e Justificativas" h="h-32" value={form.interpretacao} onChange={v=>setForm({...form, interpretacao:v})} />
                                    </div>
                                </div>
                            )}

                            {activeSection === 'C' && (
                                <div className="space-y-6">
                                    <div className="bg-slate-800 p-5 rounded-xl border border-emerald-500/40 shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b border-slate-700 pb-3">
                                            <div className="text-[10px] font-black uppercase text-emerald-400 tracking-wider flex items-center gap-2">
                                                <Icons.Sparkles size={16}/> Sugestões Inteligentes Baseadas no Objetivo (O) {smartSuggestions.length > 0 && `(${smartSuggestions.length})`}
                                            </div>
                                            {smartSuggestions.length > 0 && (
                                                <button type="button" onClick={applyAllSuggestions} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors shadow">
                                                    + Aplicar Todas ({smartSuggestions.length})
                                                </button>
                                            )}
                                        </div>
                                        {smartSuggestions.length > 0 ? (
                                            <div className="flex flex-col gap-2">
                                                {smartSuggestions.map(item => (
                                                    <button key={item.text} type="button" onClick={()=>setForm(p=>({...p,condutas:p.condutas.includes(item.text)?p.condutas.filter(x=>x!==item.text):[...p.condutas,item.text]}))} className={`text-left px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all border flex items-start gap-2.5 ${form.condutas.includes(item.text)?'bg-emerald-600 border-emerald-500 text-white shadow-md':'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500/50 hover:bg-slate-800'}`}>
                                                        <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 mt-0.5 ${form.condutas.includes(item.text)?'bg-emerald-800 text-emerald-100':'bg-slate-800 text-emerald-400 border border-slate-700'}`}>{item.tag}</span>
                                                        <span className="leading-snug">{item.text}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-slate-400 bg-slate-900/80 border border-slate-700/80 rounded-lg p-4 leading-relaxed">
                                                Preencha os achados na aba <strong className="text-emerald-400">Objetivo (O)</strong> (sinais vitais, escalas de Glasgow/Braden/Morse/Fugulin, exame físico, terapias, eliminações ou dispositivos invasivos) para gerar prescrições personalizadas automaticamente aqui.
                                            </div>
                                        )}
                                    </div>

                                    <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                                        <div className="text-[10px] font-bold uppercase text-blue-400 mb-4">Condutas Gerais e Rotina Institucional</div>
                                        <div className="flex flex-col gap-2">
                                            {condutasGeraisList.map(c=><button key={c} type="button" onClick={()=>setForm(p=>({...p,condutas:p.condutas.includes(c)?p.condutas.filter(x=>x!==c):[...p.condutas,c]}))} className={`text-left px-4 py-2.5 rounded-lg text-[11px] font-semibold transition-all border ${form.condutas.includes(c)?'bg-emerald-600 border-emerald-500 text-white shadow-md':'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500 hover:bg-slate-800'}`}>
                                                {form.condutas.includes(c) ? '✓ ' : '+ '}{c}
                                            </button>)}
                                        </div>
                                    </div>
                                    <TextAreaField label="Notas e Cuidados Específicos Adicionais" h="h-36" value={form.obs} onChange={v=>setForm({...form, obs:v})} placeholder="Insira aqui condutas específicas adicionais do paciente..." />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="hidden lg:flex w-[400px] xl:w-[450px] bg-slate-900 border border-slate-800 rounded-xl flex-col overflow-hidden shadow-2xl">
                <div className="p-4 border-b border-slate-800 bg-slate-800 flex justify-between items-center"><div className="text-[10px] font-black uppercase text-emerald-400 tracking-widest flex items-center gap-2">Terminal AGHUse</div></div>
                <div className="flex-1 p-4 overflow-hidden flex flex-col bg-slate-950">
                    <pre className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4 text-[11px] font-mono text-emerald-400 overflow-y-auto custom-scrollbar whitespace-pre-wrap select-all leading-loose">{generateText()}</pre>
                    <button type="button" onClick={copyAghuse} className={`w-full py-4 mt-4 rounded-xl font-black text-[11px] uppercase tracking-widest transition-colors flex justify-center items-center gap-2 ${copySuccess?'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50':'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'}`}>{copySuccess?"Copiado para a Área de Transferência!":"Copiar Evolução"}</button>
                </div>
            </div>
        </div>
    );
};
