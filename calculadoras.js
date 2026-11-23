const CalculadorasApp = () => {
    const initialState = { 
        glasgow: { o:null, v:null, m:null },
        braden: { p:null, u:null, a:null, m:null, n:null, f:null }, 
        morse: { h:null, d:null, a:null, t:null, m:null, e:null }, 
        fugulin: { em:null, ox:null, sv:null, mo:null, de:null, al:null, cc:null, el:null, te:null, ic:null, cu:null, tc:null }, 
        bh: { peso: '', horas: '', febre: null, taquipneia: null, sudorese: null, ventMech: null } 
    };
    const [escalas, setEscalas] = useState(initialState);
    const [activeTab, setActiveTab] = useState('GLASGOW');

    const glasgowCalc = useMemo(() => { 
        const g=escalas.glasgow; if(g.o===null && g.v===null && g.m===null) return {t: 0, r: "Pendente"};
        const t=(g.o||0)+(g.v||0)+(g.m||0); 
        let r = "Leve / Normal";
        if(t >= 3 && t <= 8) r = "Grave (Necessita IOT)";
        else if(t >= 9 && t <= 12) r = "Moderado";
        return {t, r}; 
    }, [escalas.glasgow]);

    const bradenCalc = useMemo(() => { 
        const b=escalas.braden; if(b.p===null && b.u===null && b.a===null && b.m===null && b.n===null && b.f===null) return {t: 0, r: "Pendente"};
        const t=(b.p||0)+(b.u||0)+(b.a||0)+(b.m||0)+(b.n||0)+(b.f||0); return {t, r: t>=19?"Sem Risco":t>=15?"Baixo":t>=13?"Moderado":t>=10?"Alto":"Muito Elevado"}; 
    }, [escalas.braden]);

    const morseCalc = useMemo(() => { 
        const m=escalas.morse; if(m.h===null && m.d===null && m.a===null && m.t===null && m.m===null && m.e===null) return {t: 0, r: "Pendente"};
        const t=(m.h||0)+(m.d||0)+(m.a||0)+(m.t||0)+(m.m||0)+(m.e||0); return {t, r: t>=45?"Elevado":t>=25?"Moderado":"Baixo"}; 
    }, [escalas.morse]);

    const fugulinCalc = useMemo(() => { 
        const f = escalas.fugulin; const vals = Object.values(f); if(vals.every(x => x === null)) return {t: 0, d: "Pendente"};
        const t = vals.reduce((a,b)=>(a||0)+(b||0),0); 
        return {t, d: t>34?"Intensivos":t>=30?"Semi-Intensivos":t>=24?"Alta Dependência":t>=18?"Intermediários":"Mínimos"}; 
    }, [escalas.fugulin]);

    const piCalc = useMemo(() => {
        const peso = parseFloat(escalas.bh.peso);
        const horas = parseFloat(escalas.bh.horas);
        if(isNaN(peso) || isNaN(horas) || peso <= 0 || horas <= 0) return { total: 0, base: 0, extras: 0, d: "Aguardando Peso e Tempo" };
        let base = 0.5 * peso * horas;
        let extras = 0;
        if (escalas.bh.febre === '37.8 - 38.9°C') extras += (0.1 * peso * horas);
        if (escalas.bh.febre === '≥ 39.0°C') extras += (0.2 * peso * horas);
        if (escalas.bh.taquipneia === '21 - 30 irpm') extras += (base * 0.20); 
        if (escalas.bh.taquipneia === '> 30 irpm') extras += (base * 0.40); 
        if (escalas.bh.sudorese === 'Leve') extras += (12.5 * horas);
        if (escalas.bh.sudorese === 'Moderada') extras += (25 * horas);
        if (escalas.bh.sudorese === 'Intensa') extras += (41.6 * horas);
        let total = base + extras;
        if (escalas.bh.ventMech === 'Sim (Umidificada)') {
            const perdaResp = (total * 0.33);
            total = total - perdaResp;
        }
        return { total: Math.round(total), base: Math.round(base), extras: Math.round(extras), d: "Volume Estimado a Descontar" };
    }, [escalas.bh]);

    const reset = () => { if(window.confirm("Limpar todos os dados das escalas?")) setEscalas(initialState); };

    return (
        <div className="max-w-5xl mx-auto w-full animate-fade flex flex-col pb-12 px-4 sm:px-6">
            <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl"><Icons.Calculator size={28} className="text-amber-500"/></div>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Cálculos Clínicos</h1>
                        <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Ferramentas Rápidas de Enfermagem</p>
                    </div>
                </div>
                <button type="button" onClick={reset} className="w-full md:w-auto px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-sm font-bold text-red-400 transition-colors flex items-center justify-center gap-3 shadow-sm hover:text-red-300">
                    <Icons.Trash size={18}/> Limpar Dados
                </button>
            </header>

            <div className="flex gap-2 bg-slate-900 p-2 rounded-2xl border border-slate-800 mb-8 overflow-x-auto no-scrollbar">
                <button type="button" onClick={()=>setActiveTab('GLASGOW')} className={`px-5 py-3 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${activeTab==='GLASGOW'?'bg-orange-600 text-white shadow-lg':'text-slate-400 hover:bg-slate-800'}`}>Glasgow</button>
                <button type="button" onClick={()=>setActiveTab('BRADEN')} className={`px-5 py-3 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${activeTab==='BRADEN'?'bg-blue-600 text-white shadow-lg':'text-slate-400 hover:bg-slate-800'}`}>Braden</button>
                <button type="button" onClick={()=>setActiveTab('MORSE')} className={`px-5 py-3 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${activeTab==='MORSE'?'bg-purple-600 text-white shadow-lg':'text-slate-400 hover:bg-slate-800'}`}>Morse</button>
                <button type="button" onClick={()=>setActiveTab('FUGULIN')} className={`px-5 py-3 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all ${activeTab==='FUGULIN'?'bg-emerald-600 text-white shadow-lg':'text-slate-400 hover:bg-slate-800'}`}>Fugulin</button>
                <button type="button" onClick={()=>setActiveTab('BH')} className={`px-5 py-3 rounded-xl text-xs md:text-sm font-black whitespace-nowrap transition-all flex items-center justify-center gap-2 ${activeTab==='BH'?'bg-cyan-600 text-white shadow-lg':'text-slate-400 hover:bg-slate-800'}`}><Icons.Droplets size={16}/> Perdas Insensíveis</button>
            </div>
            
            {activeTab === 'GLASGOW' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm animate-fade">
                    <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800 shadow-inner text-center">
                        <h2 className="text-sm font-black uppercase tracking-widest text-orange-500 mb-2">Escala de Glasgow <span className="text-slate-500 ml-1">(3 a 15 pts)</span></h2>
                        <div className="text-6xl font-black text-white mb-2">{glasgowCalc.t} <span className="text-xl text-slate-500 font-bold">Pts</span></div>
                        <div className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest ${glasgowCalc.t > 0 ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{glasgowCalc.r}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <CalcScaleRadio color="orange" label={titlesGlasgow.o} options={glasgowFull.o} values={[4,3,2,1]} value={escalas.glasgow.o} onChange={v=>setEscalas({...escalas,glasgow:{...escalas.glasgow,o:v}})}/>
                        <CalcScaleRadio color="orange" label={titlesGlasgow.v} options={glasgowFull.v} values={[5,4,3,2,1]} value={escalas.glasgow.v} onChange={v=>setEscalas({...escalas,glasgow:{...escalas.glasgow,v:v}})}/>
                        <CalcScaleRadio color="orange" label={titlesGlasgow.m} options={glasgowFull.m} values={[6,5,4,3,2,1]} value={escalas.glasgow.m} onChange={v=>setEscalas({...escalas,glasgow:{...escalas.glasgow,m:v}})}/>
                    </div>
                </div>
            )}

            {activeTab === 'BRADEN' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm animate-fade">
                    <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800 shadow-inner text-center">
                        <h2 className="text-sm font-black uppercase tracking-widest text-blue-500 mb-2">Escala de Braden <span className="text-slate-500 ml-1">(6 a 23 pts)</span></h2>
                        <div className="text-6xl font-black text-white mb-2">{bradenCalc.t} <span className="text-xl text-slate-500 font-bold">Pts</span></div>
                        <div className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest ${bradenCalc.t > 0 ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{bradenCalc.r}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Object.entries(bradenFull).map(([k,opts])=><CalcScaleRadio key={k} color="blue" label={titlesBraden[k]} options={opts} value={escalas.braden[k]} onChange={v=>setEscalas({...escalas,braden:{...escalas.braden,[k]:v}})}/>)}</div>
                </div>
            )}

            {activeTab === 'MORSE' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm animate-fade">
                    <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800 shadow-inner text-center">
                        <h2 className="text-sm font-black uppercase tracking-widest text-purple-500 mb-2">Escala de Morse <span className="text-slate-500 ml-1">(0 a 125 pts)</span></h2>
                        <div className="text-6xl font-black text-white mb-2">{morseCalc.t} <span className="text-xl text-slate-500 font-bold">Pts</span></div>
                        <div className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest ${morseCalc.t > 0 ? 'bg-purple-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{morseCalc.r}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <CalcScaleRadio color="purple" label="Histórico de Quedas" options={morseFull.h} values={[0,25]} value={escalas.morse.h} onChange={v=>setEscalas({...escalas,morse:{...escalas.morse,h:v}})}/> 
                        <CalcScaleRadio color="purple" label="Diagnóstico Secundário" options={morseFull.d} values={[0,15]} value={escalas.morse.d} onChange={v=>setEscalas({...escalas,morse:{...escalas.morse,d:v}})}/> 
                        <CalcScaleRadio color="purple" label="Auxílio na Deambulação" options={morseFull.a} values={[0,15,30]} value={escalas.morse.a} onChange={v=>setEscalas({...escalas,morse:{...escalas.morse,a:v}})}/> 
                        <CalcScaleRadio color="purple" label="Terapia Endovenosa" options={morseFull.t} values={[0,20]} value={escalas.morse.t} onChange={v=>setEscalas({...escalas,morse:{...escalas.morse,t:v}})}/> 
                        <CalcScaleRadio color="purple" label="Marcha" options={morseFull.m} values={[0,10,20]} value={escalas.morse.m} onChange={v=>setEscalas({...escalas,morse:{...escalas.morse,m:v}})}/> 
                        <CalcScaleRadio color="purple" label="Estado Mental" options={morseFull.e} values={[0,15]} value={escalas.morse.e} onChange={v=>setEscalas({...escalas,morse:{...escalas.morse,e:v}})}/>
                    </div>
                </div>
            )}

            {activeTab === 'FUGULIN' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm animate-fade">
                    <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800 shadow-inner text-center">
                        <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-2">Escala de Fugulin HACO <span className="text-slate-500 ml-1">(12 a 48 pts)</span></h2>
                        <div className="text-6xl font-black text-white mb-2">{fugulinCalc.t} <span className="text-xl text-slate-500 font-bold">Pts</span></div>
                        <div className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest ${fugulinCalc.t > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{fugulinCalc.d}</div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{Object.entries(fugulinFull).map(([k,opts])=><CalcScaleRadio key={k} color="emerald" label={titlesFugulin[k]} options={opts} value={escalas.fugulin[k]} onChange={v=>setEscalas({...escalas,fugulin:{...escalas.fugulin,[k]:v}})}/>)}</div>
                </div>
            )}

            {activeTab === 'BH' && (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-sm animate-fade">
                    <div className="flex flex-col items-center justify-center bg-slate-950 p-6 rounded-2xl mb-8 border border-slate-800 shadow-inner text-center">
                        <h2 className="text-sm font-black uppercase tracking-widest text-cyan-500 mb-2">Perdas Insensíveis (Estimativa)</h2>
                        <div className="text-6xl font-black text-white mb-2">{piCalc.total} <span className="text-xl text-slate-500 font-bold">ml</span></div>
                        <div className={`px-6 py-2 rounded-full text-sm font-black uppercase tracking-widest ${piCalc.total > 0 ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-500'}`}>{piCalc.d}</div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-2">Peso do Paciente (Kg)</label>
                            <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-black text-white focus:border-cyan-500 outline-none text-center" value={escalas.bh.peso} onChange={e => setEscalas({...escalas, bh: {...escalas.bh, peso: e.target.value}})} placeholder="0.0" />
                        </div>
                        <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800">
                            <label className="text-xs font-black uppercase text-slate-500 tracking-widest block mb-2">Tempo do Balanço (Horas)</label>
                            <input type="number" className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-2xl font-black text-white focus:border-cyan-500 outline-none text-center" value={escalas.bh.horas} onChange={e => setEscalas({...escalas, bh: {...escalas.bh, horas: e.target.value}})} placeholder="Ex: 6, 12, 24" />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-x-6 gap-y-2">
                        <CalcScaleRadio color="cyan" label="Febre (Maior temp do período)" options={['Afebril (Até 37.7°C)', '37.8 - 38.9°C', '≥ 39.0°C']} values={['Afebril', '37.8 - 38.9°C', '≥ 39.0°C']} value={escalas.bh.febre} onChange={v=>setEscalas({...escalas,bh:{...escalas.bh,febre:v}})}/>
                        <CalcScaleRadio color="cyan" label="Frequência Respiratória (Taquipneia)" options={['Eupnéico (Até 20 irpm)', '21 - 30 irpm', '> 30 irpm']} values={['Eupnéico', '21 - 30 irpm', '> 30 irpm']} value={escalas.bh.taquipneia} onChange={v=>setEscalas({...escalas,bh:{...escalas.bh,taquipneia:v}})}/>
                        <CalcScaleRadio color="cyan" label="Sudorese Profusa" options={['Ausente', 'Leve', 'Moderada', 'Intensa']} values={['Ausente', 'Leve', 'Moderada', 'Intensa']} value={escalas.bh.sudorese} onChange={v=>setEscalas({...escalas,bh:{...escalas.bh,sudorese:v}})}/>
                        <CalcScaleRadio color="cyan" label="Ventilação Mecânica?" options={['Não / Cateter / Máscara', 'Sim (Umidificada)']} values={['Não', 'Sim (Umidificada)']} value={escalas.bh.ventMech} onChange={v=>setEscalas({...escalas,bh:{...escalas.bh,ventMech:v}})}/>
                    </div>
                </div>
            )}
        </div>
    );
};
