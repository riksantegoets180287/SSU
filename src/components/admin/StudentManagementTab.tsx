import React, { useState } from 'react';
import { 
  Plus, 
  Trash2, 
  X, 
  GraduationCap, 
  Briefcase,
  CheckCircle2,
  Clock,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Tag
} from 'lucide-react';
import { StudentWorker, ServiceTicket, TicketStatus } from '../../types';

interface StudentManagementTabProps {
  students: StudentWorker[];
  tickets: ServiceTicket[];
  onAddStudent: (student: Omit<StudentWorker, 'id'>) => void;
  onDeleteStudent: (studentId: string) => void;
  onToggleStudentActive: (studentId: string) => void;
}

export const StudentManagementTab: React.FC<StudentManagementTabProps> = ({
  students,
  tickets,
  onAddStudent,
  onDeleteStudent,
  onToggleStudentActive,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [expandedStudentId, setExpandedStudentId] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    onAddStudent({
      name: name.trim(),
      active: true,
    });

    setName('');
    setIsAddModalOpen(false);
  };

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-pink-100 text-[#D70096]">Open</span>;
      case 'in_behandeling':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-[#24126E]">Behandeling</span>;
      case 'wacht_op_onderdelen':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-900">Onderdelen</span>;
      case 'afgerond':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-800">Afgerond</span>;
      case 'geannuleerd':
        return <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">Geannuleerd</span>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#D70096] block mb-1">
            Studentenpool & Uitvoering
          </span>
          <h3 className="text-xl font-extrabold text-[#24126E]">
            Studenten Beheren
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Voer nieuwe studenten in met hun voornaam en bekijk hun toegewezen en uitgevoerde klussen.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 bg-[#D70096] hover:bg-[#b5007e] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md shadow-[#D70096]/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Student Toevoegen</span>
        </button>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {students.map((student) => {
          // Count assigned tickets
          const assignedTickets = tickets.filter(
            t => t.assignedStudent === student.name || t.assignedTo?.includes(student.name)
          );
          const completedTickets = assignedTickets.filter(t => t.status === 'afgerond');
          const activeTickets = assignedTickets.filter(t => t.status !== 'afgerond' && t.status !== 'geannuleerd');
          const isExpanded = expandedStudentId === student.id;

          return (
            <div
              key={student.id}
              className={`bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between transition-all ${
                !student.active ? 'opacity-60 bg-slate-50' : 'hover:border-[#24126E]/40'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-pink-50 text-[#D70096] font-black flex items-center justify-center text-base shadow-xs">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-base text-[#24126E]">{student.name}</h4>
                      <span className="text-[11px] text-slate-400 font-medium block">Student</span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    student.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {student.active ? 'Actief' : 'Inactief'}
                  </span>
                </div>

                {/* Begeleidende / Uitgevoerde Klussen Box */}
                <div className="bg-[#F7F5FA] rounded-2xl p-3.5 border border-slate-200/80 text-xs space-y-2.5 my-2">
                  <div className="flex items-center justify-between text-slate-600">
                    <span className="font-bold text-[#24126E] flex items-center gap-1.5">
                      <Briefcase className="w-3.5 h-3.5 text-[#D70096]" />
                      Klussen ({assignedTickets.length}):
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500">
                      {completedTickets.length} afgerond &bull; {activeTickets.length} actief
                    </span>
                  </div>

                  {/* Toggle view assigned tasks */}
                  {assignedTickets.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setExpandedStudentId(isExpanded ? null : student.id)}
                      className="w-full flex items-center justify-between text-[11px] font-bold text-[#24126E] hover:text-[#D70096] pt-1.5 border-t border-slate-200/60 cursor-pointer transition-colors"
                    >
                      <span>{isExpanded ? 'Verberg klussenlijst' : 'Bekijk gekoppelde klussen'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic pt-1 border-t border-slate-200/60">
                      Nog geen klussen gekoppeld
                    </p>
                  )}

                  {/* Expanded Task list */}
                  {isExpanded && assignedTickets.length > 0 && (
                    <div className="space-y-1.5 pt-1 max-h-48 overflow-y-auto pr-1">
                      {assignedTickets.map(t => (
                        <div key={t.id} className="bg-white p-2 rounded-xl border border-slate-200/70 text-[11px] space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-bold text-[#24126E] truncate">{t.ticketNumber}</span>
                            {getStatusBadge(t.status)}
                          </div>
                          <p className="text-slate-600 text-[11px] line-clamp-1 font-medium">{t.title}</p>
                          <span className="text-[10px] text-slate-400 block">{t.location}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <button
                  onClick={() => onToggleStudentActive(student.id)}
                  className="text-xs font-bold text-slate-600 hover:text-[#24126E] cursor-pointer"
                >
                  {student.active ? 'Deactiveren' : 'Activeren'}
                </button>
                <button
                  onClick={() => onDeleteStudent(student.id)}
                  className="text-rose-500 hover:text-rose-700 p-1 rounded-lg transition-colors cursor-pointer"
                  title="Verwijderen"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#1F1735]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-pink-50 text-[#D70096] flex items-center justify-center">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <h3 className="text-base font-extrabold text-[#24126E]">
                  Student Toevoegen
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F7F5FA] hover:bg-slate-200 text-slate-500 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#24126E] uppercase tracking-wider mb-1.5">
                  Voornaam student <span className="text-[#D70096]">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="bijv. Noah"
                  autoFocus
                  required
                  className="w-full px-3.5 py-2.5 bg-[#F7F5FA] rounded-xl border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#D70096]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Alleen voornaam is voldoende.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-[#D70096] hover:bg-[#b5007e] text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
