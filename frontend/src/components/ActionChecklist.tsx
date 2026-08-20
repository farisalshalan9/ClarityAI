import React, { useState } from 'react';
import { 
  CheckSquare, Square, Plus, Trash2, Tag, 
  User as UserIcon, Sparkles, Filter, CheckCircle2, RefreshCw 
} from 'lucide-react';
import { ActionItem } from '../types';
import { apiClient } from '../api/client';
import { useLanguage } from '../context/LanguageContext';

interface ActionChecklistProps {
  documentId: string;
  items: ActionItem[];
  onItemsChange: (items: ActionItem[]) => void;
  onJumpToPage: (page: number) => void;
  isReadOnly?: boolean;
  onReanalyze?: () => void;
  reanalyzing?: boolean;
}

export const ActionChecklist: React.FC<ActionChecklistProps> = ({
  documentId,
  items,
  onItemsChange,
  onJumpToPage,
  isReadOnly = false,
  onReanalyze,
  reanalyzing = false,
}) => {
  const { t } = useLanguage();
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [newTaskText, setNewTaskText] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [newTaskCategory, setNewTaskCategory] = useState<string>('General');
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [loadingActionId, setLoadingActionId] = useState<string | null>(null);

  const completedCount = items.filter((i) => i.is_completed).length;
  const progressPercent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  const filteredItems = items.filter((item) => {
    if (filterPriority === 'All') return true;
    return item.priority === filterPriority;
  });

  const handleToggleComplete = async (item: ActionItem) => {
    if (isReadOnly) return;
    setLoadingActionId(item.id);
    try {
      const updated = await apiClient.updateActionItem(documentId, item.id, {
        is_completed: !item.is_completed,
      });
      onItemsChange(items.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error('Failed to toggle action item:', err);
    } finally {
      setLoadingActionId(null);
    }
  };

  const handleDeleteItem = async (itemId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isReadOnly) return;
    try {
      await apiClient.deleteActionItem(documentId, itemId);
      onItemsChange(items.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete action item:', err);
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || isReadOnly) return;

    try {
      const created = await apiClient.createActionItem(documentId, {
        task: newTaskText.trim(),
        priority: newTaskPriority,
        category: newTaskCategory,
      });
      onItemsChange([...items, created]);
      setNewTaskText('');
      setShowAddForm(false);
    } catch (err) {
      console.error('Failed to add action item:', err);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      case 'Medium':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
    }
  };

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'High':
        return t('act.priorityHigh');
      case 'Medium':
        return t('act.priorityMedium');
      case 'Low':
        return t('act.priorityLow');
      default:
        return priority;
    }
  };

  return (
    <div className="space-y-4 pb-6">
      {/* Header & Progress Card */}
      <div className="glass-card rounded-2xl p-4.5 border border-slate-800/80">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {t('act.title')}
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {completedCount} / {items.length} {t('act.completed')} ({progressPercent}%)
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onReanalyze && !isReadOnly && (
              <button
                onClick={onReanalyze}
                disabled={reanalyzing}
                className="px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-brand-300 border border-slate-700/80 rounded-lg transition-all flex items-center gap-1.5 shadow-sm"
                title={t('ws.reanalyze')}
              >
                <RefreshCw className={`w-3 h-3 ${reanalyzing ? 'animate-spin text-brand-400' : ''}`} />
                <span className="hidden sm:inline">{t('ws.reanalyze')}</span>
              </button>
            )}

            {!isReadOnly && (
              <button
                onClick={() => setShowAddForm(!showAddForm)}
                className="px-2.5 py-1 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{t('act.addTask')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Priority Filter Chips */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-800/60">
          <span className="text-[11px] text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" />
          </span>
          {[
            { key: 'All', label: t('act.filterAll') },
            { key: 'High', label: t('act.priorityHigh') },
            { key: 'Medium', label: t('act.priorityMedium') },
            { key: 'Low', label: t('act.priorityLow') },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilterPriority(key)}
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-all ${
                filterPriority === key
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Inline Add Task Form */}
      {showAddForm && !isReadOnly && (
        <form onSubmit={handleAddTask} className="glass-card rounded-2xl p-4 border border-brand-500/30 space-y-3">
          <h4 className="text-xs font-semibold text-brand-300">{t('act.addTask')}</h4>
          <input
            type="text"
            placeholder={t('act.taskPlaceholder')}
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            autoFocus
          />
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <select
                value={newTaskPriority}
                onChange={(e) => setNewTaskPriority(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none"
              >
                <option value="High">{t('act.priorityHigh')}</option>
                <option value="Medium">{t('act.priorityMedium')}</option>
                <option value="Low">{t('act.priorityLow')}</option>
              </select>
              <input
                type="text"
                placeholder="Category"
                value={newTaskCategory}
                onChange={(e) => setNewTaskCategory(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 text-xs font-medium bg-brand-600 hover:bg-brand-500 text-white rounded-lg shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8 glass-card rounded-2xl">
            <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs text-slate-400">{t('dl.noDeadlines')}</p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => handleToggleComplete(item)}
              className={`group flex items-start gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                item.is_completed
                  ? 'bg-slate-950/40 border-slate-800/40 opacity-60'
                  : 'glass-card-interactive border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Checkbox */}
              <button
                type="button"
                className="mt-0.5 text-brand-400 hover:text-brand-300 transition-colors flex-shrink-0"
                disabled={loadingActionId === item.id}
              >
                {item.is_completed ? (
                  <CheckSquare className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Square className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
                )}
              </button>

              {/* Task info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-xs font-medium leading-snug transition-all ${
                    item.is_completed ? 'line-through text-slate-500' : 'text-slate-100'
                  }`}
                >
                  {item.task}
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium border ${getPriorityBadge(
                      item.priority
                    )}`}
                  >
                    {getPriorityLabel(item.priority)}
                  </span>

                  {item.category && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-slate-400 border border-slate-700/60 flex items-center gap-1">
                      <Tag className="w-2.5 h-2.5" />
                      {item.category}
                    </span>
                  )}

                  {item.assignee && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-800/80 text-indigo-300 border border-slate-700/60 flex items-center gap-1">
                      <UserIcon className="w-2.5 h-2.5" />
                      {item.assignee}
                    </span>
                  )}

                  {item.page_number && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onJumpToPage(item.page_number!);
                      }}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-brand-500/10 hover:bg-brand-500/20 text-brand-400 border border-brand-500/20 flex items-center gap-1 transition-colors"
                      title={`${t('exec.jumpCitation')} ${item.page_number}`}
                    >
                      <Sparkles className="w-2.5 h-2.5" />
                      {t('ws.pages')} {item.page_number}
                    </button>
                  )}
                </div>
              </div>

              {/* Delete Button */}
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(item.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  title="Delete Task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
