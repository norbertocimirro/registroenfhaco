class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, errorMsg: '' };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, errorMsg: error.toString() };
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-6 m-4 bg-red-950/80 border border-red-700 rounded-xl text-red-200 space-y-3">
                    <div className="font-black uppercase text-xs tracking-wider text-red-400">Erro de Renderização Detectado</div>
                    <pre className="text-xs font-mono whitespace-pre-wrap bg-slate-950 p-3 rounded border border-red-900">{this.state.errorMsg}</pre>
                    <button type="button" onClick={() => this.setState({ hasError: false, errorMsg: '' })} className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold">
                        Tentar Novamente
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

const LoginScreen = ({ onLogin }) => {
    const [pwd, setPwd] = useState('');
    const [err, setErr] = useState(false);

    const handleLogin = (e) => {
        e.preventDefault();
        if (pwd === 'gtsae2026') {
            onLogin();
        } else {
            setErr(true);
            setPwd('');
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-6 animate-fade">
            <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-2xl w-full max-w-sm flex flex-col items-center">
                <div className="w-16 h-16 bg-blue-600/20 text-blue-500 rounded-full flex items-center justify-center mb-6">
                    <Icons.Lock size={32} />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">Acesso Restrito</h2>
                <p className="text-xs text-slate-400 text-center mb-6">O painel de auditoria é exclusivo para membros avaliadores da GT SAE HACO.</p>
                
                <form onSubmit={handleLogin} className="w-full space-y-4">
                    <div>
                        <input 
                            type="password" 
                            placeholder="Senha de Auditor" 
                            className={`w-full bg-slate-950 border ${err ? 'border-red-500' : 'border-slate-700'} rounded-xl px-4 py-3 text-center text-white tracking-widest outline-none focus:border-blue-500 transition-colors`}
                            value={pwd} 
                            onChange={e => {setPwd(e.target.value); setErr(false);}}
                            autoFocus
                        />
                        {err && <p className="text-red-500 text-[10px] text-center mt-2 font-bold uppercase">Senha Incorreta</p>}
                    </div>
                    <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors">
                        Autenticar
                    </button>
                </form>
            </div>
        </div>
    );
};

const App = () => {
    const [db, setDb] = useState({ internados: {}, records: [] });
    const [isCloud, setIsCloud] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    const anosDisponiveis = [...new Set(PERIODOS.map(p => p.id.split('-')[0]))];
    const [anoSelecionado, setAnoSelecionado] = useState(anosDisponiveis[0] || '2026');
    const [openYears, setOpenYears] = useState({});

    const groupedPeriods = useMemo(() => {
        const groups = {};
        PERIODOS.forEach(p => {
            const year = p.id.split('-')[0];
            if (!groups[year]) groups[year] = [];
            groups[year].push(p);
        });
        return groups;
    }, []);

    useEffect(() => {
        if (window.dbFS) {
            setIsCloud(true);
            const unsubRecords = window.dbFS.collection('records').onSnapshot(snap => {
                const recs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setDb(prev => ({ ...prev, records: recs }));
            });
            const unsubInternados = window.dbFS.collection('internados').onSnapshot(snap => {
                const ints = {}; snap.docs.forEach(doc => { ints[doc.id] = doc.data(); });
                setDb(prev => ({ ...prev, internados: ints }));
            });
            return () => { unsubRecords(); unsubInternados(); };
        } else {
            setIsCloud(false);
            const saved = localStorage.getItem('auditoria_gtsae_haco');
            if (saved) setDb(JSON.parse(saved));
        }
    }, []);

    useEffect(() => { if (!window.dbFS) localStorage.setItem('auditoria_gtsae_haco', JSON.stringify(db)); }, [db]);

    useEffect(() => {
        setOpenYears(prev => {
            const next = { ...prev };
            Object.keys(groupedPeriods).forEach(year => {
                const isComplete = groupedPeriods[year].every(p => {
                    const intUPI = parseInt(db.internados[p.id]?.UPI);
                    const intUTI = parseInt(db.internados[p.id]?.UTI);
                    if (isNaN(intUPI) || isNaN(intUTI)) return false; 
                    const metaUPI = Math.ceil(intUPI * 0.4);
                    const metaUTI = Math.ceil(intUTI * 0.4);
                    const fUPI = db.records.filter(r => r.periodId === p.id && r.sector === 'UPI').length;
                    const fUTI = db.records.filter(r => r.periodId === p.id && r.sector === 'UTI').length;
                    return fUPI >= metaUPI && fUTI >= metaUTI;
                });
                if (next[year] === undefined) next[year] = !isComplete; 
            });
            return next;
        });
    }, [db.internados, db.records, groupedPeriods]);

    const [view, setView] = useState('SOIC'); 
    const [selectedPeriod, setSelectedPeriod] = useState(null);
    const [selectedRecord, setSelectedRecord] = useState(null);

    const savePatientsCount = (periodId, sector, count) => {
        const val = parseInt(count) || 0;
        if (window.dbFS) window.dbFS.collection('internados').doc(periodId).set({ [sector]: val }, { merge: true });
        else setDb(prev => ({ ...prev, internados: { ...prev.internados, [periodId]: { ...(prev.internados[periodId] || {UPI:0, UTI:0}), [sector]: val } } }));
    };

    const createNewRecord = (periodId, sector) => {
        const newRecord = { periodId, sector, prontuario: '', auditor: AVALIADORES[0], date: new Date().toISOString().split('T')[0], answers: {} };
        if (window.dbFS) {
            window.dbFS.collection('records').add(newRecord).then(docRef => { setSelectedRecord(docRef.id); setView('AVALIACAO'); });
        } else {
            newRecord.id = Date.now().toString();
            setDb(prev => ({ ...prev, records: [...prev.records, newRecord] }));
            setSelectedRecord(newRecord.id); setView('AVALIACAO');
        }
    };

    const updateRecordMeta = (recordId, field, value) => {
        if (window.dbFS) window.dbFS.collection('records').doc(recordId).update({ [field]: value });
        else setDb(prev => ({ ...prev, records: prev.records.map(r => r.id === recordId ? { ...r, [field]: value } : r) }));
    };

    const answerQuestion = (recordId, questionId, value) => {
        if (window.dbFS) window.dbFS.collection('records').doc(recordId).set({ answers: { [questionId]: value } }, { merge: true });
        else setDb(prev => ({ ...prev, records: prev.records.map(r => r.id === recordId ? { ...r, answers: { ...r.answers, [questionId]: value } } : r) }));
    };

    const deleteRecord = (recordId) => {
        if (window.confirm("Confirmar exclusão?")) {
            if (window.dbFS) window.dbFS.collection('records').doc(recordId).delete();
            else setDb(prev => ({ ...prev, records: prev.records.filter(r => r.id !== recordId) }));
        }
    };

    const toggleYearDropdown = (year) => { setOpenYears(prev => ({ ...prev, [year]: !prev[year] })); };

    const renderAmostragemChart = (internados, avaliados, setor, labelPeriodo) => {
        const data = {
            labels: [''], 
            datasets: [
                { label: `Nº pact internados ${setor} ${labelPeriodo}`, data: [internados || 0], backgroundColor: '#4285F4', barPercentage: 0.5 },
                { label: `Nº pront avaliados ${setor} ${labelPeriodo}`, data: [avaliados || 0], backgroundColor: '#EA4335', barPercentage: 0.5 }
            ]
        };
        const options = {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
                legend: { position: 'top', align: 'start', labels: { usePointStyle: true, boxWidth: 8, font: { size: 10 } } },
                title: { display: true, text: `PACIENTES INTERNADOS NA ${setor}`, align: 'start', font: { size: 12, weight: 'bold' }, color: '#94a3b8' }
            },
            scales: { y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { stepSize: 1 } }, x: { grid: { display: false } } }
        };
        return (
            <div className="bg-slate-800 p-5 rounded-md border border-slate-700 shadow flex flex-col h-[300px] print-bg-white print-break-avoid">
                <div className="text-[10px] uppercase tracking-wider text-slate-400 mb-1 print-text-muted">AVALIAÇÃO DA SISTEMATIZAÇÃO DA ASSISTÊNCIA DE ENFERMAGEM (MÉTODOS-PRONTUÁRIO)</div>
                <div className="flex-1"><ChartComponent type="bar" data={data} options={options} /></div>
            </div>
        );
    };

    const renderFaltasChart = (qStats, section) => {
        const qs = qStats.filter(q => q.sec === section);
        const data = {
            labels: qs.map(q => wrapText(q.text, 14)), 
            datasets: [{ label: 'Porcentagem de Faltas', data: qs.map(q => q.pctFalta), backgroundColor: '#4285F4', barPercentage: 0.5 }]
        };
        const options = {
            responsive: true, maintainAspectRatio: false,
            plugins: { 
                legend: { display: false },
                title: { display: true, text: `${section} - Porcentagem de Faltas`, align: 'start', font: { size: 14, weight: 'bold' }, color: '#94a3b8' },
                subtitle: { display: true, text: 'Com base no número de prontuários', align: 'start', font: { size: 10 }, color: '#64748b', padding: { bottom: 20 } },
                tooltip: { callbacks: { title: (ctx) => `Q${qs[ctx[0].dataIndex].id}: ${qs[ctx[0].dataIndex].text}` } }
            },
            scales: { 
                y: { beginAtZero: true, max: 100, grid: { color: 'rgba(255,255,255,0.05)' } }, 
                x: { grid: { display: false }, ticks: { font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: false } }
            }
        };
        return (
            <div key={section} className="bg-slate-800 p-6 rounded-md border border-slate-700 shadow flex flex-col h-[480px] print-bg-white print-break-avoid w-full">
                <div className="flex-1"><ChartComponent type="bar" data={data} options={options} /></div>
            </div>
        );
    };

    const renderDashboard = () => {
        const { globalPct, totalNaoGeral } = calculateStats(db.records);
        return (
            <div className="max-w-6xl mx-auto w-full pt-6 pb-12 space-y-8 animate-fade px-4 sm:px-6">
                <header className="flex justify-between items-end border-b border-slate-700 pb-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">Painel de Gestão SAE</h1>
                        <p className="text-sm text-slate-400 mt-1">GT SAE HACO - Hospital de Aeronáutica de Canoas</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className={`hidden md:flex text-[10px] font-bold uppercase px-3 py-1.5 rounded-full items-center gap-2 ${isCloud ? 'bg-emerald-900/50 text-emerald-400 border border-emerald-800' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                            {isCloud ? <><Icons.Cloud/> Nuvem (Online)</> : <><Icons.Local/> Local (Offline)</>}
                        </span>
                        <button type="button" onClick={() => setView('COMPILADO_ANUAL')} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg">
                            <Icons.Chart size={18}/> Relatório Anual
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-slate-800 p-5 rounded-md border border-slate-700 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Conformidade Global</div>
                        <div className="text-3xl font-bold text-blue-500">{globalPct}%</div>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-md border border-slate-700 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Total Auditado</div>
                        <div className="text-3xl font-bold text-slate-100">{db.records.length}</div>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-md border border-slate-700 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">Não Conformidades</div>
                        <div className="text-3xl font-bold text-red-500">{totalNaoGeral}</div>
                    </div>
                </div>

                <div className="space-y-4 pt-2">
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 mb-4">Ciclos de Auditoria por Exercício</h2>
                    {Object.keys(groupedPeriods).sort((a,b) => b.localeCompare(a)).map(year => {
                        const isOpen = openYears[year];
                        const periods = groupedPeriods[year];
                        return (
                            <div key={year} className="bg-slate-800 border border-slate-700 rounded-md overflow-hidden shadow-sm">
                                <button type="button" onClick={() => toggleYearDropdown(year)} className="w-full flex items-center justify-between p-5 bg-slate-800 hover:bg-slate-700/80 transition-colors focus:outline-none">
                                    <div className="flex items-center gap-3">
                                        <Icons.Folder size={22} className="text-blue-500" />
                                        <span className="font-bold text-white text-lg tracking-wide">Exercício {year}</span>
                                        {!isOpen && <span className="ml-4 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-900/50 text-emerald-400 border border-emerald-800/50 uppercase tracking-wider">Concluído</span>}
                                    </div>
                                    <div className={`transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''} text-slate-400`}><Icons.ChevronDown size={20} /></div>
                                </button>
                                {isOpen && (
                                    <div className="border-t border-slate-700 bg-slate-800/50 animate-fade">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-slate-900/80 border-b border-slate-700/80">
                                                <tr><th className="p-4 font-semibold text-slate-400">Período de Avaliação</th><th className="p-4 font-semibold text-slate-400 text-center">Meta UPI</th><th className="p-4 font-semibold text-slate-400 text-center">Meta UTI</th><th className="p-4 font-semibold text-slate-400 text-right">Ação</th></tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-700/50">
                                                {periods.map(p => {
                                                    const metaUPI = Math.ceil((db.internados[p.id]?.UPI || 0) * 0.4);
                                                    const metaUTI = Math.ceil((db.internados[p.id]?.UTI || 0) * 0.4);
                                                    const fUPI = db.records.filter(r => r.periodId === p.id && r.sector === 'UPI').length;
                                                    const fUTI = db.records.filter(r => r.periodId === p.id && r.sector === 'UTI').length;

                                                    return (
                                                        <tr key={p.id} className="hover:bg-slate-700/50 transition-colors">
                                                            <td className="p-4 font-medium text-slate-200">{p.label}</td>
                                                            <td className="p-4 text-center"><span className={`px-2.5 py-1 rounded text-xs font-medium ${fUPI >= metaUPI && metaUPI > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>{fUPI} / {metaUPI}</span></td>
                                                            <td className="p-4 text-center"><span className={`px-2.5 py-1 rounded text-xs font-medium ${fUTI >= metaUTI && metaUTI > 0 ? 'bg-emerald-900/50 text-emerald-400' : 'bg-slate-900 text-slate-400'}`}>{fUTI} / {metaUTI}</span></td>
                                                            <td className="p-4 text-right"><button type="button" onClick={() => { setSelectedPeriod(p.id); setView('PERIODO'); }} className="text-blue-500 hover:text-blue-400 font-medium text-sm transition-colors">Abrir Pasta</button></td>
                                                        </tr>
                                                    )
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    const renderPeriodo = () => {
        const p = PERIODOS.find(x => x.id === selectedPeriod);
        const intUPI = parseInt(db.internados[p.id]?.UPI) || 0;
        const intUTI = parseInt(db.internados[p.id]?.UTI) || 0;
        const mUPI = Math.ceil((parseInt(intUPI) || 0) * 0.4);
        const mUTI = Math.ceil((parseInt(intUTI) || 0) * 0.4);
        const recs = db.records.filter(r => r.periodId === p.id);

        return (
            <div className="max-w-6xl mx-auto w-full pt-6 pb-12 space-y-8 animate-fade px-4 sm:px-6">
                <header className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setView('DASHBOARD')} className="text-slate-400 hover:text-white transition-colors"><Icons.Back /></button>
                        <div><h1 className="text-xl font-bold text-white">Auditoria: {p.label}</h1></div>
                    </div>
                    <button type="button" onClick={() => setView('COMPILADO_PERIODO')} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors shadow-lg">
                        <Icons.Chart size={16}/> Relatório do Mês
                    </button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-5 rounded-md border border-slate-700 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 border-l-2 border-blue-500 pl-2">Metas UPI</div>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1"><label className="text-xs text-slate-400 block mb-1">Pacientes Internados</label><input type="number" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500" value={intUPI} onChange={e => savePatientsCount(p.id, 'UPI', e.target.value)} /></div>
                            <div className="flex-1"><label className="text-xs text-slate-400 block mb-1">Amostra Mín (40%)</label><div className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-400 font-medium">{mUPI}</div></div>
                        </div>
                        <button type="button" onClick={() => createNewRecord(p.id, 'UPI')} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition-colors shadow-sm">Nova Auditoria UPI</button>
                    </div>
                    <div className="bg-slate-800 p-5 rounded-md border border-slate-700 shadow-sm">
                        <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 border-l-2 border-red-500 pl-2">Metas UTI</div>
                        <div className="flex gap-4 items-end">
                            <div className="flex-1"><label className="text-xs text-slate-400 block mb-1">Pacientes Internados</label><input type="number" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500" value={intUTI} onChange={e => savePatientsCount(p.id, 'UTI', e.target.value)} /></div>
                            <div className="flex-1"><label className="text-xs text-slate-400 block mb-1">Amostra Mín (40%)</label><div className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-slate-400 font-medium">{mUTI}</div></div>
                        </div>
                        <button type="button" onClick={() => createNewRecord(p.id, 'UTI')} className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium transition-colors shadow-sm">Nova Auditoria UTI</button>
                    </div>
                </div>

                <div className="bg-slate-800 border border-slate-700 rounded-md overflow-hidden mt-6">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-900 border-b border-slate-700">
                            <tr><th className="p-4 font-semibold text-slate-400">Setor</th><th className="p-4 font-semibold text-slate-400">Prontuário</th><th className="p-4 font-semibold text-slate-400">Auditor</th><th className="p-4 font-semibold text-slate-400">Progresso</th><th className="p-4 font-semibold text-slate-400 text-right">Ações</th></tr>
                        </thead>
                        <tbody className="divide-y divide-slate-700">
                            {recs.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500">Nenhuma avaliação iniciada.</td></tr>}
                            {recs.map(r => {
                                const progress = Math.round((Object.keys(r.answers).length / 32) * 100);
                                return (
                                    <tr key={r.id} className="hover:bg-slate-700/30 transition-colors">
                                        <td className="p-4"><span className={`px-2 py-1 text-[10px] font-bold rounded ${r.sector==='UPI' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'}`}>{r.sector}</span></td>
                                        <td className="p-4 font-medium text-slate-200">{r.prontuario || '-'}</td>
                                        <td className="p-4 text-slate-400">{r.auditor}</td>
                                        <td className="p-4"><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-blue-500" style={{width: `${progress}%`}}></div></div><span className="text-[10px] text-slate-400">{progress}%</span></div></td>
                                        <td className="p-4 text-right flex justify-end gap-3"><button type="button" onClick={() => { setSelectedRecord(r.id); setView('AVALIACAO'); }} className="text-blue-500 hover:text-blue-400 font-medium text-sm">Editar</button><button type="button" onClick={() => deleteRecord(r.id)} className="text-slate-500 hover:text-red-500"><Icons.Trash /></button></td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const renderAvaliacao = () => {
        const rec = db.records.find(x => x.id === selectedRecord);
        if (!rec) return null;
        const sections = [...new Set(PERGUNTAS_AUDITORIA.map(q => q.sec))];

        return (
            <div className="max-w-4xl mx-auto w-full pt-6 pb-12 space-y-8 animate-fade px-4 sm:px-6">
                <header className="flex items-center justify-between border-b border-slate-700 pb-4 mb-6 sticky top-0 bg-[#0f172a] pt-4 z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-xl font-bold text-white">Formulário de Auditoria</h1>
                        <span className={`px-2 py-1 text-[10px] font-bold rounded ${rec.sector==='UPI' ? 'bg-blue-900/50 text-blue-400' : 'bg-red-900/50 text-red-400'}`}>{rec.sector}</span>
                    </div>
                    <button type="button" onClick={() => setView('PERIODO')} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors">
                        <Icons.Save size={16}/> Salvar Avaliação
                    </button>
                </header>

                <div className="bg-slate-800 p-5 rounded-md border border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4 shadow-sm">
                    <div><label className="text-xs text-slate-400 block mb-1">Nº Prontuário</label><input className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500 text-sm" value={rec.prontuario} onChange={e => updateRecordMeta(rec.id, 'prontuario', e.target.value)} /></div>
                    <div><label className="text-xs text-slate-400 block mb-1">Auditor</label><select className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500 text-sm" value={rec.auditor} onChange={e => updateRecordMeta(rec.id, 'auditor', e.target.value)}>{AVALIADORES.map(a => <option key={a} value={a}>{a}</option>)}</select></div>
                    <div><label className="text-xs text-slate-400 block mb-1">Data</label><input type="date" className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white outline-none focus:border-blue-500 text-sm" value={rec.date} onChange={e => updateRecordMeta(rec.id, 'date', e.target.value)} /></div>
                </div>

                <div className="space-y-8">
                    {sections.map(sec => {
                        const qs = PERGUNTAS_AUDITORIA.filter(q => q.sec === sec);
                        return (
                            <div key={sec} className="bg-slate-800 border border-slate-700 rounded-md overflow-hidden shadow-sm">
                                <div className="bg-slate-900 px-4 py-3 border-b border-slate-700 text-xs font-semibold uppercase text-slate-300">{sec}</div>
                                <div className="divide-y divide-slate-700/50">
                                    {qs.map(q => (
                                        <div key={q.id} className="p-4 flex flex-col md:flex-row justify-between md:items-center gap-4 hover:bg-slate-700/20 transition-colors">
                                            <div className="text-sm text-slate-200 flex-1"><span className="text-slate-500 mr-2">{q.id}.</span> {q.text}</div>
                                            <div className="flex gap-1 shrink-0 bg-slate-900 p-1 rounded-md border border-slate-700">
                                                <button type="button" onClick={() => answerQuestion(rec.id, q.id, 'SIM')} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${rec.answers[q.id] === 'SIM' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>SIM</button>
                                                <button type="button" onClick={() => answerQuestion(rec.id, q.id, 'NÃO')} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${rec.answers[q.id] === 'NÃO' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>NÃO</button>
                                                <button type="button" onClick={() => answerQuestion(rec.id, q.id, 'NA')} className={`px-4 py-1.5 rounded text-xs font-medium transition-colors ${rec.answers[q.id] === 'NA' ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-slate-200'}`}>N/A</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        );
    };

    const renderCompiladoPeriodo = () => {
        const p = PERIODOS.find(x => x.id === selectedPeriod);
        const intUPI = parseInt(db.internados[p.id]?.UPI) || 0;
        const intUTI = parseInt(db.internados[p.id]?.UTI) || 0;
        const recsUPI = db.records.filter(r => r.periodId === p.id && r.sector === 'UPI');
        const recsUTI = db.records.filter(r => r.periodId === p.id && r.sector === 'UTI');
        const recs = [...recsUPI, ...recsUTI];
        const { qStats, sections } = calculateStats(recs);

        return (
            <div className="max-w-6xl mx-auto w-full pt-6 pb-12 space-y-8 animate-fade px-4 sm:px-6 print-container">
                <header className="flex justify-between items-end border-b border-slate-700 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setView('PERIODO')} className="text-slate-400 hover:text-white transition-colors no-print"><Icons.Back /></button>
                        <div><h1 className="text-2xl font-bold text-white print-text-dark">Relatório de Faltas do Período</h1><p className="text-sm text-slate-400 mt-1">{p.label}</p></div>
                    </div>
                    <button type="button" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors no-print"><Icons.Pdf size={16}/> Gerar PDF</button>
                </header>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderAmostragemChart(intUPI, recsUPI.length, 'UPI', p.label)}
                    {renderAmostragemChart(intUTI, recsUTI.length, 'UTI', p.label)}
                </div>
                <div className="grid grid-cols-1 gap-6 pt-4">
                    {sections.map(sec => renderFaltasChart(qStats, sec))}
                </div>
            </div>
        );
    };

    const renderCompiladoAnual = () => {
        const periodosDoAno = PERIODOS.filter(p => p.id.startsWith(anoSelecionado));
        const recordsDoAno = db.records.filter(r => periodosDoAno.some(p => p.id === r.periodId));
        const { qStats, sections } = calculateStats(recordsDoAno);

        let totalIntUPI = 0, totalIntUTI = 0, totalAvUPI = 0, totalAvUTI = 0;
        periodosDoAno.forEach(p => {
            totalIntUPI += parseInt(db.internados[p.id]?.UPI) || 0;
            totalIntUTI += parseInt(db.internados[p.id]?.UTI) || 0;
            totalAvUPI += db.records.filter(r => r.periodId === p.id && r.sector === 'UPI').length;
            totalAvUTI += db.records.filter(r => r.periodId === p.id && r.sector === 'UTI').length;
        });

        return (
            <div className="max-w-6xl mx-auto w-full pt-6 pb-12 space-y-8 animate-fade px-4 sm:px-6 print-container">
                <header className="flex justify-between items-end border-b border-slate-700 pb-4 mb-6">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={() => setView('DASHBOARD')} className="text-slate-400 hover:text-white transition-colors no-print"><Icons.Back /></button>
                        <div>
                            <h1 className="text-2xl font-bold text-white print-text-dark">Relatório Anual Consolidado</h1>
                            <div className="flex items-center gap-4 mt-2">
                                <p className="text-sm text-slate-400">GT SAE HACO</p>
                                <select className="bg-slate-800 border border-slate-700 text-white text-xs rounded px-2 py-1 outline-none no-print focus:border-blue-500" value={anoSelecionado} onChange={(e) => setAnoSelecionado(e.target.value)}>
                                    {anosDisponiveis.map(a => <option key={a} value={a}>Ano {a}</option>)}
                                </select>
                                <span className="hidden print:inline print-text-muted font-bold ml-2"> - Exercício {anoSelecionado}</span>
                            </div>
                        </div>
                    </div>
                    <button type="button" onClick={() => window.print()} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white px-4 py-2 rounded-md text-sm font-medium flex items-center gap-2 transition-colors no-print"><Icons.Pdf size={16}/> Gerar PDF</button>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderAmostragemChart(totalIntUPI, totalAvUPI, 'UPI', `(Acumulado ${anoSelecionado})`)}
                    {renderAmostragemChart(totalIntUTI, totalAvUTI, 'UTI', `(Acumulado ${anoSelecionado})`)}
                </div>
                <div className="grid grid-cols-1 gap-6 pt-4">
                    {sections.map(sec => renderFaltasChart(qStats, sec))}
                </div>
            </div>
        );
    };

    const navTo = (v) => {
        const auditViews = ['DASHBOARD', 'PERIODO', 'AVALIACAO', 'COMPILADO_PERIODO', 'COMPILADO_ANUAL'];
        if (auditViews.includes(v) && !isAuthenticated) setView('LOGIN');
        else setView(v);
    };

    const MobileNav = () => (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 flex justify-around items-center h-16 z-50 px-2 pb-safe no-print">
            <button type="button" onClick={() => navTo('DASHBOARD')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${['DASHBOARD','COMPILADO_ANUAL','LOGIN'].includes(view) ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}><Icons.Dashboard /> <span className="text-[8px] font-bold mt-1">Gestão</span></button>
            <button type="button" onClick={() => navTo('CALCULADORAS')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${view === 'CALCULADORAS' ? 'text-amber-500' : 'text-slate-500 hover:text-white'}`}><Icons.Calculator /> <span className="text-[8px] font-bold mt-1">Cálculos</span></button>
            {selectedPeriod && isAuthenticated && <button type="button" onClick={() => navTo('PERIODO')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${['PERIODO','COMPILADO_PERIODO'].includes(view) ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}><Icons.Folder /> <span className="text-[8px] font-bold mt-1">Amostra</span></button>}
            {selectedRecord && isAuthenticated && <button type="button" onClick={() => navTo('AVALIACAO')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${view === 'AVALIACAO' ? 'text-blue-500' : 'text-slate-500 hover:text-white'}`}><Icons.FileEdit /> <span className="text-[8px] font-bold mt-1">Auditoria</span></button>}
            <button type="button" onClick={() => navTo('SOIC')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${view === 'SOIC' ? 'text-emerald-500' : 'text-slate-500 hover:text-white'}`}><Icons.Activity /> <span className="text-[8px] font-bold mt-1">SOIC</span></button>
        </div>
    );

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden">
            <div className="hidden lg:flex w-64 bg-slate-900 border-r border-slate-800 flex-col no-print shrink-0 z-50">
                <div className="h-16 flex items-center justify-start px-6 border-b border-slate-800">
                    <Icons.Shield size={24} className="text-blue-500 shrink-0" />
                    <span className="ml-3 font-bold text-white tracking-wide">GT SAE HACO</span>
                </div>
                <div className="p-4 flex flex-col gap-2 flex-1">
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-2 mt-2 px-3">Gestão de Auditoria</div>
                    <button type="button" onClick={() => navTo('DASHBOARD')} className={`flex items-center justify-start gap-3 p-3 rounded-md transition-colors ${['DASHBOARD','COMPILADO_ANUAL','LOGIN'].includes(view) ? 'bg-blue-600/10 text-blue-500 border border-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                        <Icons.Dashboard /> <span className="text-sm font-medium">Dashboard</span>
                    </button>
                    {selectedPeriod && isAuthenticated && (
                        <button type="button" onClick={() => navTo('PERIODO')} className={`flex items-center justify-start gap-3 p-3 rounded-md transition-colors ${['PERIODO','COMPILADO_PERIODO'].includes(view) ? 'bg-blue-600/10 text-blue-500 border border-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            <Icons.Folder /> <span className="text-sm font-medium">Período Ativo</span>
                        </button>
                    )}
                    {selectedRecord && isAuthenticated && (
                        <button type="button" onClick={() => navTo('AVALIACAO')} className={`flex items-center justify-start gap-3 p-3 rounded-md transition-colors ${view === 'AVALIACAO' ? 'bg-blue-600/10 text-blue-500 border border-blue-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}>
                            <Icons.FileEdit /> <span className="text-sm font-medium">Auditoria Atual</span>
                        </button>
                    )}
                    
                    <div className="my-2 border-t border-slate-800"></div>
                    <div className="text-[10px] font-black uppercase text-slate-500 mb-2 mt-2 px-3">Assistência (Público)</div>
                    
                    <button type="button" onClick={() => navTo('SOIC')} className={`flex items-center justify-start gap-3 p-3 rounded-md transition-colors ${view === 'SOIC' ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-emerald-400'}`}>
                        <Icons.Activity /> <span className="text-sm font-medium">Assistente Clínico SOIC</span>
                    </button>
                    <button type="button" onClick={() => navTo('CALCULADORAS')} className={`flex items-center justify-start gap-3 p-3 rounded-md transition-colors ${view === 'CALCULADORAS' ? 'bg-amber-600/10 text-amber-500 border border-amber-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-amber-400'}`}>
                        <Icons.Calculator /> <span className="text-sm font-medium">Cálculos Clínicos</span>
                    </button>
                </div>
            </div>
            
            <div className="flex-1 overflow-y-auto h-full relative custom-scrollbar bg-slate-950 pb-20 lg:pb-0">
                <ErrorBoundary>
                    {view === 'LOGIN' && <LoginScreen onLogin={() => { setIsAuthenticated(true); setView('DASHBOARD'); }} />}
                    {view === 'DASHBOARD' && isAuthenticated && renderDashboard()}
                    {view === 'PERIODO' && isAuthenticated && renderPeriodo()}
                    {view === 'AVALIACAO' && isAuthenticated && renderAvaliacao()}
                    {view === 'COMPILADO_PERIODO' && isAuthenticated && renderCompiladoPeriodo()}
                    {view === 'COMPILADO_ANUAL' && isAuthenticated && renderCompiladoAnual()}
                    
                    {view === 'CALCULADORAS' && (
                        <div className="h-full py-6 md:py-8">
                            <CalculadorasApp />
                        </div>
                    )}

                    {view === 'SOIC' && (
                        <div className="h-full p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto animate-fade flex flex-col">
                            <header className="flex items-center gap-4 mb-6 shrink-0">
                                <div className="p-3 bg-slate-800 border border-slate-700 rounded-xl"><Icons.Activity size={24} className="text-emerald-500"/></div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">Assistente SOIC</h1>
                                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-800 text-emerald-400 text-[10px] font-black uppercase">v45 Modular</span>
                                    </div>
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mt-1">Ferramenta Clínica - GT SAE HACO</p>
                                </div>
                            </header>
                            <div className="flex-1 overflow-hidden">
                                <SoicApp />
                            </div>
                        </div>
                    )}
                </ErrorBoundary>
            </div>
            <MobileNav />
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
