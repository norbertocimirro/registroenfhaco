import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  PlusCircle, 
  Activity, 
  Stethoscope, 
  ChevronRight,
  History,
  AlertCircle,
  FileText,
  Clock,
  Sun,
  Moon,
  Sunrise,
  Lock,
  LogOut,
  ShieldCheck,
  UserCircle,
  Calendar,
  Filter,
  XCircle,
  RefreshCcw,
  ClipboardList
} from 'lucide-react';

// COLE AQUI A URL QUE VOCÊ GEROU NO PASSO 3 DAS INSTRUÇÕES
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyHw6wCJGdI1I1NX7kIwqdyW3BLRcIwBVX28HsimrdElZ2EOY82c4p3Kt73XY0n1vsbww/exec"; 

const SECTORS = [
  { id: 'UPI', name: 'UPI (Clínica/Cirúrgica)', icon: <Stethoscope size={20} />, type: 'ward' },
  { id: 'UTI', name: 'UTI (Intensiva)', icon: <Activity size={20} />, type: 'ward' },
  { id: 'UCC', name: 'UCC (Centro Cirúrgico)', icon: <Users size={20} />, type: 'surgery' },
  { id: 'UPA', name: 'UPA (Pronto Atendimento)', icon: <AlertCircle size={20} />, type: 'er' },
  { id: 'CAIS', name: 'CAIS (ESF)', icon: <ClipboardList size={20} />, type: 'er' }
];

const SHIFTS = [
  { id: 'Manhã', icon: <Sunrise size={16} />, color: 'bg-amber-100 text-amber-700' },
  { id: 'Tarde', icon: <Sun size={16} />, color: 'bg-orange-100 text-orange-700' },
  { id: 'Noite', icon: <Moon size={16} />, color: 'bg-indigo-100 text-indigo-700' }
];

const AUTHORIZED_NURSES = [
  "Gisele", "Zanini", "Marasca", "Serafin", "Sandri", "Cimirro", "Parode", 
  "Oliveira", "Luiziane", "Karen Casarin", "Renata", "Jéssica Cunha", 
  "Suellen Stiehl", "Maia", "Favilla", "Zomer", "Laura Elisa", 
  "Barbara Viegas", "Barbara Figueiredo", "Anderson", "Cassia Freitas", 
  "Nascimento", "Jessica", "Fritz", "Coronet", "Suellen Azevedo", "Pereira"
];

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export default function App() {
  const [appUser, setAppUser] = useState(null);
  const [view, setView] = useState('login'); 
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Filtros
  const [filterDay, setFilterDay] = useState('');
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

  const [loginInput, setLoginInput] = useState('');
  const [passInput, setPassInput] = useState('');

  const [formData, setFormData] = useState({
    selectedSectorId: '',
    shift: 'Manhã',
    nurseName: '',
    sgtsNames: '',
    intercurrences: '',
    patients: '',
    discharges: '',
    admissions: '',
    transfers: '',
    procedures: '',
    consultations: ''
  });

  // Função para buscar dados da planilha
  const fetchSheetData = async () => {
    if (!GOOGLE_SCRIPT_URL) return;
    setLoading(true);
    try {
      const response = await fetch(GOOGLE_SCRIPT_URL);
      const data = await response.json();
      // Ordenar por timestamp decrescente
      setReports(data.sort((a, b) => b.timestamp - a.timestamp));
    } catch (error) {
      console.error("Erro ao buscar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (appUser) fetchSheetData();
  }, [appUser]);

  const handleLogin = (e) => {
    e.preventDefault();
    setLoginError('');
    const inputClean = loginInput.trim();
    const inputLower = inputClean.toLowerCase();
    const nurseFound = AUTHORIZED_NURSES.find(n => n.toLowerCase() === inputLower);
    const sectorFound = SECTORS.find(s => s.id.toLowerCase() === inputLower);

    if ((nurseFound || sectorFound) && passInput === '123456') {
      const displayName = nurseFound || (sectorFound ? sectorFound.id : null);
      if (displayName) {
        setAppUser({ id: displayName, name: displayName });
        setFormData(prev => ({ ...prev, nurseName: displayName }));
        setView('dashboard');
        return;
      }
    }
    setLoginError('Nome não encontrado ou senha incorreta.');
  };

  const handleLogout = () => {
    setAppUser(null);
    setView('login');
    setLoginInput('');
    setPassInput('');
    setReports([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!GOOGLE_SCRIPT_URL) {
      alert("Configure a URL do Script do Google primeiro!");
      return;
    }
    
    const sectorToSave = SECTORS.find(s => s.id === formData.selectedSectorId);
    if (!sectorToSave) return;

    setSubmitting(true);
    const payload = {
      timestamp: Date.now(),
      sectorId: sectorToSave.id,
      sectorName: sectorToSave.name,
      sectorType: sectorToSave.type,
      shift: formData.shift,
      nurseName: formData.nurseName,
      sgtsNames: formData.sgtsNames,
      intercurrences: formData.intercurrences,
      patients: parseInt(formData.patients) || 0,
      discharges: parseInt(formData.discharges) || 0,
      admissions: parseInt(formData.admissions) || 0,
      transfers: parseInt(formData.transfers) || 0,
      procedures: parseInt(formData.procedures) || 0,
      consultations: parseInt(formData.consultations) || 0,
      authorName: appUser.name
    };

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors', // Necessário para Google Apps Script
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      // Como o no-cors não permite ler a resposta, assumimos sucesso 
      // ou recarregamos os dados manualmente após um pequeno delay
      setTimeout(() => {
        fetchSheetData();
        setView('dashboard');
        setFormData({
          ...formData,
          selectedSectorId: '', shift: 'Manhã', sgtsNames: '', intercurrences: '',
          patients: '', discharges: '', admissions: '', transfers: '',
          procedures: '', consultations: ''
        });
        setSubmitting(false);
      }, 1500);

    } catch (error) {
      console.error("Erro ao salvar:", error);
      setSubmitting(false);
      alert("Erro ao salvar dados na planilha.");
    }
  };

  const getLatestForSector = (sectorId) => reports.find(r => r.sectorId === sectorId);

  const filteredAndGroupedHistory = useMemo(() => {
    const filtered = reports.filter(report => {
      const date = new Date(report.timestamp);
      const matchesDay = filterDay ? date.getDate() === parseInt(filterDay) : true;
      const matchesMonth = filterMonth ? (date.getMonth() + 1) === parseInt(filterMonth) : true;
      const matchesYear = filterYear ? date.getFullYear() === parseInt(filterYear) : true;
      return matchesDay && matchesMonth && matchesYear;
    });

    const groups = {};
    filtered.forEach(report => {
      const dateStr = new Date(report.timestamp).toLocaleDateString('pt-BR');
      if (!groups[dateStr]) groups[dateStr] = [];
      groups[dateStr].push(report);
    });
    return groups;
  }, [reports, filterDay, filterMonth, filterYear]);

  const availableYears = useMemo(() => {
    const years = new Set();
    reports.forEach(r => years.add(new Date(r.timestamp).getFullYear()));
    return Array.from(years).sort((a, b) => b - a);
  }, [reports]);

  const clearFilters = () => {
    setFilterDay('');
    setFilterMonth('');
    setFilterYear('');
  };

  if (view === 'login') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-sans">
        <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl border border-slate-800">
          <div className="flex flex-col items-center mb-10 text-center">
            <div className="bg-emerald-600 p-5 rounded-[2rem] shadow-xl shadow-emerald-900/30 mb-6">
              <ClipboardList size={48} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter italic leading-none">HACO PLANILHA</h1>
            <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.3em] mt-2 border-t border-slate-800 pt-2 w-full">Divisão de Enfermagem</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <InputGroup dark label="Nome do Enfermeiro ou Setor" value={loginInput} onChange={setLoginInput} icon={<UserCircle size={20} />} placeholder="Ex: Zanini ou UPI" />
            <InputGroup dark label="Senha de Acesso" type="password" value={passInput} onChange={setPassInput} icon={<Lock size={20} />} placeholder="••••••" />
            {loginError && <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-2xl text-[10px] font-black uppercase text-center animate-pulse">{loginError}</div>}
            <button type="submit" className="w-full bg-emerald-600 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all text-sm tracking-widest">ENTRAR NO PLANTÃO</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-24 font-sans">
      <header className="bg-slate-900 text-white p-5 shadow-lg sticky top-0 z-20 border-b border-white/5">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600 p-2 rounded-xl"><ShieldCheck size={20} /></div>
            <div>
              <h1 className="text-sm font-black tracking-tight leading-none uppercase">HACO Integrado</h1>
              <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-1">Olá, {appUser.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchSheetData} 
              disabled={loading}
              className={`p-2.5 bg-slate-800 rounded-xl transition-all ${loading ? 'animate-spin opacity-50' : 'hover:bg-slate-700'}`}
            >
              <RefreshCcw size={18} />
            </button>
            <button onClick={handleLogout} className="p-2.5 bg-slate-800 hover:bg-red-600 rounded-xl transition-all"><LogOut size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-6">
        {loading && view !== 'login' && (
          <div className="fixed top-20 left-0 right-0 z-50 flex justify-center">
            <div className="bg-emerald-600 text-white px-4 py-2 rounded-full text-[10px] font-black uppercase shadow-lg animate-bounce">
              Atualizando Planilha...
            </div>
          </div>
        )}

        {view === 'dashboard' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center px-2">
              <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <LayoutDashboard size={14} /> Panorama Hospitalar (Sheets)
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {SECTORS.map(sector => {
                const latest = getLatestForSector(sector.id);
                const shiftData = latest ? SHIFTS.find(s => s.id === latest.shift) : null;
                return (
                  <div key={sector.id} className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 group transition-all duration-300">
                    <div className="flex justify-between items-start mb-5">
                      <div className="flex items-center gap-4">
                        <div className="p-4 bg-slate-50 text-slate-700 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition-all duration-300">{sector.icon}</div>
                        <div>
                          <h3 className="font-black text-slate-900 text-xl leading-none">{sector.id}</h3>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">{sector.name}</p>
                        </div>
                      </div>
                      <button onClick={() => { setFormData({...formData, selectedSectorId: sector.id}); setView('form'); }} className="bg-slate-900 text-white p-3 rounded-2xl hover:bg-emerald-700 shadow-lg active:scale-90 transition-all"><PlusCircle size={22} /></button>
                    </div>
                    {latest ? (
                      <div className="space-y-5">
                        <div className="flex items-center justify-between">
                          <span className={`text-[10px] font-black px-3 py-1 rounded-xl flex items-center gap-2 ${shiftData?.color} shadow-sm`}>{shiftData?.icon} {latest.shift}</span>
                          <span className="text-[10px] text-slate-400 font-black uppercase italic">{new Date(latest.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {sector.type === 'ward' ? (
                            <>
                              <MetricBox label="Pac" value={latest.patients} />
                              <MetricBox label="Alt" value={latest.discharges} color="text-green-600" />
                              <MetricBox label="Baix" value={latest.admissions} color="text-blue-600" />
                              <MetricBox label="Trns" value={latest.transfers} color="text-orange-600" />
                            </>
                          ) : (
                            <div className="col-span-4 bg-slate-50 p-4 rounded-2xl flex justify-between items-center px-6 border border-slate-100">
                              <p className="text-[11px] uppercase text-slate-400 font-black tracking-widest">Produção Turno</p>
                              <p className="text-2xl font-black text-emerald-700">{latest.procedures || latest.consultations}</p>
                            </div>
                          )}
                        </div>
                        <div className="pt-4 border-t border-slate-50 text-[11px] text-slate-700 font-bold truncate text-right">Registrado por: {latest.nurseName}</div>
                      </div>
                    ) : (
                      <div className="py-10 flex flex-col items-center justify-center border-2 border-dashed border-slate-100 rounded-3xl text-slate-300">
                        <FileText size={32} className="opacity-10 mb-2" /><span className="text-[10px] font-black uppercase tracking-[0.2em]">Sem registro</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {view === 'form' && (
          <div className="bg-white rounded-[3rem] shadow-2xl p-8 mb-10 animate-in slide-in-from-bottom-12 duration-500 border border-slate-100">
            <div className="flex items-center justify-between mb-10">
              <button onClick={() => setView('dashboard')} className="p-3 bg-slate-50 hover:bg-slate-200 rounded-[1.2rem] transition-all"><ChevronRight className="rotate-180" size={24} /></button>
              <div className="text-right">
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">{formData.selectedSectorId || 'Setor'}</h2>
                <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.3em]">Salvar na Planilha</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirme o Setor</label>
                  <select required value={formData.selectedSectorId} onChange={(e) => setFormData({...formData, selectedSectorId: e.target.value})} className="w-full p-5 bg-slate-50 border border-slate-200 rounded-[1.5rem] font-black text-slate-800 outline-none focus:ring-4 focus:ring-emerald-100 transition-all appearance-none cursor-pointer">
                    <option value="">Selecione...</option>
                    {SECTORS.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Qual o Turno?</label>
                  <div className="flex gap-3 h-[60px]">
                    {SHIFTS.map(s => (
                      <button key={s.id} type="button" onClick={() => setFormData({...formData, shift: s.id})} className={`flex-1 rounded-[1.2rem] border-2 font-black text-[10px] uppercase tracking-widest transition-all ${formData.shift === s.id ? 'border-emerald-600 bg-emerald-50 text-emerald-700 shadow-md scale-105' : 'border-slate-50 bg-slate-50 text-slate-300'}`}>{s.id}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InputGroup label="Enfermeiro Responsável" value={formData.nurseName} onChange={(v) => setFormData({...formData, nurseName: v})} placeholder="Nome completo" />
                <InputGroup label="Equipe de Sargentos" value={formData.sgtsNames} onChange={(v) => setFormData({...formData, sgtsNames: v})} placeholder="Ex: Sgt Nascimento, Sgt Maia" />
              </div>
              {formData.selectedSectorId && (
                <div className="bg-slate-950 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl relative overflow-hidden">
                  <h3 className="text-[11px] font-black text-emerald-400 uppercase tracking-[0.4em] border-l-4 border-emerald-600 pl-4">Censo Hospitalar</h3>
                  {['UPI', 'UTI'].includes(formData.selectedSectorId) ? (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                      <DarkInput label="Nº Pacientes" type="number" value={formData.patients} onChange={(v) => setFormData({...formData, patients: v})} />
                      <DarkInput label="Altas" type="number" value={formData.discharges} onChange={(v) => setFormData({...formData, discharges: v})} />
                      <DarkInput label="Baixas" type="number" value={formData.admissions} onChange={(v) => setFormData({...formData, admissions: v})} />
                      <DarkInput label="Transf." type="number" value={formData.transfers} onChange={(v) => setFormData({...formData, transfers: v})} />
                    </div>
                  ) : (
                    <DarkInput label={formData.selectedSectorId === 'UCC' ? "Total de Cirurgias Realizadas" : "Total de Atendimentos Efetuados"} type="number" value={formData.selectedSectorId === 'UCC' ? formData.procedures : formData.consultations} onChange={(v) => formData.selectedSectorId === 'UCC' ? setFormData({...formData, procedures: v}) : setFormData({...formData, consultations: v})} fullWidth />
                  )}
                </div>
              )}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <AlertCircle size={14} className="text-orange-500" /> Observações, Faltas e Atestados
                </label>
                <textarea rows="5" value={formData.intercurrences} onChange={(e) => setFormData({...formData, intercurrences: e.target.value})} className="w-full p-6 bg-slate-50 border border-slate-200 rounded-[2rem] focus:ring-4 focus:ring-emerald-100 outline-none transition-all resize-none font-medium text-sm text-slate-700 shadow-inner" placeholder="Relate as ausências e ocorrências..." />
              </div>
              <button disabled={submitting} type="submit" className={`w-full ${submitting ? 'bg-slate-400' : 'bg-emerald-700 hover:bg-emerald-800'} text-white font-black py-7 rounded-[2rem] shadow-2xl transition-all text-xl italic tracking-tighter`}>
                {submitting ? 'PROCESSANDO...' : 'ENVIAR PARA PLANILHA'}
              </button>
            </form>
          </div>
        )}

        {view === 'history' && (
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                  <Filter size={14} className="text-emerald-600" /> Filtrar Histórico
                </h2>
                {(filterDay || filterMonth || filterYear) && (
                  <button onClick={clearFilters} className="text-[10px] font-black text-red-500 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors">
                    <XCircle size={12} /> Limpar
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Dia</label>
                  <select value={filterDay} onChange={(e) => setFilterDay(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none">
                    <option value="">Todos</option>
                    {Array.from({length: 31}, (_, i) => (<option key={i+1} value={i+1}>{i+1}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Mês</label>
                  <select value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none">
                    <option value="">Todos</option>
                    {MONTHS.map((m, i) => (<option key={i} value={i+1}>{m}</option>))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest ml-1">Ano</label>
                  <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-xs font-bold outline-none">
                    <option value="">Todos</option>
                    {availableYears.map(year => (<option key={year} value={year}>{year}</option>))}
                  </select>
                </div>
              </div>
            </div>

            {Object.keys(filteredAndGroupedHistory).length === 0 ? (
              <div className="text-center py-20 text-slate-200 font-black uppercase text-[10px] tracking-widest flex flex-col items-center gap-3">
                <FileText size={32} className="opacity-10" />
                Planilha vazia ou sem resultados
              </div>
            ) : (
              Object.keys(filteredAndGroupedHistory).map(date => (
                <div key={date} className="space-y-5">
                  <div className="flex items-center gap-3 px-2 sticky top-20 z-10 py-2">
                    <div className="h-[2px] flex-1 bg-slate-200"></div>
                    <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full shadow-sm">
                      <Calendar size={12} className="text-emerald-600" />
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{date}</span>
                    </div>
                    <div className="h-[2px] flex-1 bg-slate-200"></div>
                  </div>

                  {filteredAndGroupedHistory[date].map((report, idx) => {
                    const shiftData = SHIFTS.find(s => s.id === report.shift);
                    return (
                      <div key={idx} className="bg-white p-7 rounded-[2.5rem] border border-slate-200 shadow-sm transition-all hover:border-emerald-100">
                        <div className="flex justify-between items-start mb-6">
                          <div className="flex gap-3 items-center">
                            <span className="text-[10px] font-black bg-slate-900 text-white px-3 py-1.5 rounded-xl uppercase tracking-tighter">{report.sectorId}</span>
                            <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl flex items-center gap-2 ${shiftData?.color} shadow-sm`}>{shiftData?.icon} {report.shift}</span>
                          </div>
                          <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{new Date(report.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                        </div>
                        <div className="grid grid-cols-4 gap-3 mb-6">
                          {report.sectorType === 'ward' ? (
                            <>
                              <HistoryStat label="Pac" value={report.patients} />
                              <HistoryStat label="Alt" value={report.discharges} />
                              <HistoryStat label="Baix" value={report.admissions} />
                              <HistoryStat label="Trns" value={report.transfers} />
                            </>
                          ) : (
                            <div className="col-span-4 bg-slate-50 p-4 rounded-2xl flex justify-between items-center px-6 border border-slate-100">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{report.sectorType === 'surgery' ? 'Procedimentos' : 'Atendimentos'}</span>
                              <span className="font-black text-emerald-700 text-lg">{report.procedures || report.consultations}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-2 pt-4 border-t border-slate-50 text-[11px] text-slate-600">
                           <p><span className="font-black text-slate-300 mr-2 uppercase tracking-tighter">Enf:</span> {report.nurseName}</p>
                           <p><span className="font-black text-slate-300 mr-2 uppercase tracking-tighter">Sgt:</span> {report.sgtsNames}</p>
                          {report.intercurrences && (
                            <div className="bg-slate-50 border border-slate-100 p-5 rounded-[1.5rem] mt-4 shadow-inner">
                              <p className="text-slate-700 leading-relaxed font-bold italic">"{report.intercurrences}"</p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-2xl border-t border-slate-200 flex justify-around items-center p-6 z-30 shadow-[0_-20px_40px_rgba(0,0,0,0.05)] rounded-t-[3rem]">
        <NavButton icon={<LayoutDashboard />} label="Monitor" active={view === 'dashboard'} onClick={() => setView('dashboard')} />
        <button onClick={() => { setFormData({...formData, selectedSectorId: ''}); setView('form'); clearFilters(); }} className="bg-emerald-700 text-white p-5 rounded-[1.8rem] -mt-16 shadow-2xl shadow-emerald-500/60 border-[6px] border-white active:scale-90 transition-all duration-300">
          <PlusCircle size={32} />
        </button>
        <NavButton icon={<History />} label="Histórico" active={view === 'history'} onClick={() => setView('history')} />
      </nav>
    </div>
  );
}

// Helpers
function MetricBox({ label, value, color = "text-slate-900" }) {
  return (
    <div className="bg-slate-50 p-3.5 rounded-2xl text-center border border-slate-100/50 shadow-inner">
      <p className="text-[8px] uppercase text-slate-400 font-black mb-1 tracking-tighter leading-none">{label}</p>
      <p className={`text-sm font-black ${color}`}>{value}</p>
    </div>
  );
}

function HistoryStat({ label, value }) {
  return (
    <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-100/50 shadow-sm">
      <p className="text-[8px] uppercase text-slate-400 font-black mb-1 leading-none">{label}</p>
      <p className="text-xs font-black text-slate-800">{value}</p>
    </div>
  );
}

function InputGroup({ label, value, onChange, placeholder, type = "text", dark = false, icon }) {
  return (
    <div className="space-y-3">
      <label className={`text-[10px] font-black uppercase tracking-widest ml-2 ${dark ? 'text-slate-500' : 'text-slate-400'}`}>{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">{icon}</div>}
        <input type={type} required value={value} onChange={(e) => onChange(e.target.value)} className={`w-full p-5 ${icon ? 'pl-14' : 'pl-6'} ${dark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-800'} border rounded-[1.5rem] outline-none transition-all font-black text-sm placeholder:text-slate-600`} placeholder={placeholder} />
      </div>
    </div>
  );
}

function DarkInput({ label, value, onChange, type = "text", fullWidth = false }) {
  return (
    <div className={`space-y-2 ${fullWidth ? 'w-full' : ''}`}>
      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest ml-2">{label}</label>
      <input type={type} required value={value} onChange={(e) => onChange(e.target.value)} className="w-full p-5 bg-white/5 border border-white/10 rounded-[1.2rem] outline-none transition-all font-black text-white text-center text-lg shadow-inner" />
    </div>
  );
}

function NavButton({ icon, label, active, onClick }) {
  return (
    <button onClick={onClick} className={`flex flex-col items-center gap-2 transition-all duration-300 ${active ? 'text-emerald-700 scale-110 font-black' : 'text-slate-400'}`}>
      {React.cloneElement(icon, { size: 24, strokeWidth: active ? 3 : 2 })}
      <span className="text-[9px] font-black uppercase tracking-[0.1em] leading-none">{label}</span>
    </button>
  );
}
