import React, { useState, useEffect } from 'react';
import { PlayCircle, Loader } from 'lucide-react';
import { TaskDetails, Node, NodeType } from '../types';

interface TaskInitiatorProps {
  onSubmit: (task: TaskDetails) => void;
  isProcessing: boolean;
  nodes: Node[];
}

const TaskInitiator: React.FC<TaskInitiatorProps> = ({ onSubmit, isProcessing, nodes }) => {
  const [selectedSkill, setSelectedSkill] = useState<TaskDetails['skillName']>('routePlanning');
  
  // State for route planning
  const [from, setFrom] = useState('İstanbul');
  const [to, setTo] = useState('Bodrum');

  // State for booking confirmation
  const [location, setLocation] = useState('Kuşadası Marina');
  const [vessel, setVessel] = useState('Ada-1');
  
  // State for booking assistance
  const [service, setService] = useState('Otel');
  const [assistanceLocation, setAssistanceLocation] = useState('Çeşme');

  // State for transaction query
  const [queryDetails, setQueryDetails] = useState('Son 24 saatteki hareketler');

  // State for target node
  const [targetNodeId, setTargetNodeId] = useState('');

  const marinaNodes = nodes.filter(n => n.type === NodeType.MARINA);
  const seaNodes = nodes.filter(n => n.type === NodeType.SEA);
  const financeNodes = nodes.filter(n => n.type === NodeType.FINANCE);
  
  useEffect(() => {
    // Auto-select first available node when switching task type
    if (['bookingConfirmation', 'bookingAssistance'].includes(selectedSkill)) {
      if (marinaNodes.length > 0) {
        if (!targetNodeId || !marinaNodes.find(n => n.id === targetNodeId)) {
          setTargetNodeId(marinaNodes[0].id);
        }
      } else {
        setTargetNodeId('');
      }
    } else if (selectedSkill === 'vesselStatusCheck') {
      if (seaNodes.length > 0) {
        if (!targetNodeId || !seaNodes.find(n => n.id === targetNodeId)) {
          setTargetNodeId(seaNodes[0].id);
        }
      } else {
        setTargetNodeId('');
      }
    } else if (selectedSkill === 'transactionQuery') {
        if (financeNodes.length > 0) {
            if (!targetNodeId || !financeNodes.find(n => n.id === targetNodeId)) {
                setTargetNodeId(financeNodes[0].id);
            }
        } else {
            setTargetNodeId('');
        }
    } else {
      setTargetNodeId('');
    }
  }, [selectedSkill, nodes]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    if (selectedSkill === 'routePlanning' && from && to) {
      onSubmit({ skillName: 'routePlanning', from, to });
    } else if (selectedSkill === 'bookingConfirmation' && location && vessel && targetNodeId) {
      onSubmit({ skillName: 'bookingConfirmation', location, vessel, targetNodeId });
    } else if (selectedSkill === 'bookingAssistance' && service && assistanceLocation && targetNodeId) {
      onSubmit({ skillName: 'bookingAssistance', service, location: assistanceLocation, targetNodeId });
    } else if (selectedSkill === 'vesselStatusCheck' && targetNodeId) {
      onSubmit({ skillName: 'vesselStatusCheck', targetNodeId });
    } else if (selectedSkill === 'transactionQuery' && queryDetails && targetNodeId) {
      onSubmit({ skillName: 'transactionQuery', details: queryDetails, targetNodeId });
    }
  };

  const renderInputs = () => {
    const requiresMarinaTarget = ['bookingConfirmation', 'bookingAssistance'].includes(selectedSkill);
    const requiresSeaTarget = selectedSkill === 'vesselStatusCheck';
    const requiresFinanceTarget = selectedSkill === 'transactionQuery';
    
    let skillInputs;
    let targetNodeSelector;

    if (selectedSkill === 'routePlanning') {
      skillInputs = (
        <>
          <div className="flex-grow w-full">
            <label htmlFor="from" className="text-xs text-gray-400">Nereden</label>
            <input
              id="from" type="text" value={from} onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g., İstanbul" disabled={isProcessing}
            />
          </div>
          <div className="flex-grow w-full">
            <label htmlFor="to" className="text-xs text-gray-400">Nereye</label>
            <input
              id="to" type="text" value={to} onChange={(e) => setTo(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g., Bodrum" disabled={isProcessing}
            />
          </div>
        </>
      );
    } else if (selectedSkill === 'bookingConfirmation') {
      skillInputs = (
        <>
          <div className="flex-grow w-full">
            <label htmlFor="location" className="text-xs text-gray-400">Lokasyon</label>
            <input
              id="location" type="text" value={location} onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g., Kuşadası Marina" disabled={isProcessing}
            />
          </div>
          <div className="flex-grow w-full">
            <label htmlFor="vessel" className="text-xs text-gray-400">Gemi Adı</label>
            <input
              id="vessel" type="text" value={vessel} onChange={(e) => setVessel(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g., Ada-1" disabled={isProcessing}
            />
          </div>
        </>
      );
    } else if (selectedSkill === 'bookingAssistance') {
        skillInputs = (
          <>
            <div className="flex-grow w-full">
              <label htmlFor="service" className="text-xs text-gray-400">Servis Tipi</label>
              <input
                id="service" type="text" value={service} onChange={(e) => setService(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="e.g., Otel, Restoran" disabled={isProcessing}
              />
            </div>
            <div className="flex-grow w-full">
              <label htmlFor="assistanceLocation" className="text-xs text-gray-400">Lokasyon</label>
              <input
                id="assistanceLocation" type="text" value={assistanceLocation} onChange={(e) => setAssistanceLocation(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                placeholder="e.g., Çeşme" disabled={isProcessing}
              />
            </div>
          </>
        );
    } else if (selectedSkill === 'transactionQuery') {
        skillInputs = (
          <div className="flex-grow w-full">
            <label htmlFor="queryDetails" className="text-xs text-gray-400">Sorgu Detayları</label>
            <input
              id="queryDetails" type="text" value={queryDetails} onChange={(e) => setQueryDetails(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              placeholder="e.g., Son 24 saatteki hareketler" disabled={isProcessing}
            />
          </div>
        );
      } else if (selectedSkill === 'vesselStatusCheck') {
        skillInputs = <div className="flex-grow w-full min-h-[42px] flex items-center"><p className="text-sm text-gray-400">Durumunu kontrol etmek için bir yat seçin.</p></div>;
      }
    
    if (requiresMarinaTarget || requiresSeaTarget || requiresFinanceTarget) {
      const targetNodes = requiresMarinaTarget ? marinaNodes : requiresSeaTarget ? seaNodes : financeNodes;
      let label = 'Hedef Düğüm';
      let emptyMessage = 'Uygun Düğüm Yok';
      if (requiresMarinaTarget) { label = 'Hedef Marina'; emptyMessage = 'Marina Düğümü Yok'; }
      if (requiresSeaTarget) { label = 'Hedef Yat'; emptyMessage = 'Yat Düğümü Yok'; }
      if (requiresFinanceTarget) { label = 'Hedef Finans Düğümü'; emptyMessage = 'Finans Düğümü Yok'; }

      targetNodeSelector = (
        <div className="flex-grow w-full sm:max-w-xs">
          <label htmlFor="targetNode" className="text-xs text-gray-400">{label}</label>
          <select
              id="targetNode" value={targetNodeId} onChange={(e) => setTargetNodeId(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              disabled={isProcessing || targetNodes.length === 0}
          >
              {targetNodes.length === 0 ? (
                  <option>{emptyMessage}</option>
              ) : (
                  targetNodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>)
              )}
          </select>
        </div>
      );
    }
      
    return (
        <div className="flex flex-col sm:flex-row items-end gap-4 w-full">
            <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
                {skillInputs}
            </div>
            {targetNodeSelector}
        </div>
    );
  };

  const getButtonText = () => {
    switch(selectedSkill) {
      case 'routePlanning': return 'Rota Planla';
      case 'bookingConfirmation': return 'Rezervasyonu Onayla';
      case 'bookingAssistance': return 'Yardım İste';
      case 'vesselStatusCheck': return 'Durumu Sorgula';
      case 'transactionQuery': return 'İşlemi Sorgula';
      default: return 'Görevi Başlat';
    }
  }

  const isSubmitDisabled = isProcessing || 
    ( (selectedSkill === 'bookingConfirmation' || selectedSkill === 'bookingAssistance') && marinaNodes.length === 0 ) ||
    ( selectedSkill === 'vesselStatusCheck' && seaNodes.length === 0 ) ||
    ( selectedSkill === 'transactionQuery' && financeNodes.length === 0 );

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-end gap-4">
        <div className="w-full sm:w-1/3">
           <label htmlFor="skill" className="text-xs text-gray-400">Görev Tipi</label>
           <select
              id="skill"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value as TaskDetails['skillName'])}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              disabled={isProcessing}
           >
              <option value="routePlanning">Rota Planlama</option>
              <option value="bookingConfirmation">Rezervasyon Onaylama</option>
              <option value="bookingAssistance">Rezervasyon Yardımı</option>
              <option value="vesselStatusCheck">Yat Durum Kontrolü</option>
              <option value="transactionQuery">Finansal İşlem Sorgusu</option>
           </select>
        </div>
        <div className="flex-grow w-full">
            {renderInputs()}
        </div>
      </div>
       <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full sm:w-auto px-6 py-2 h-[42px] bg-cyan-600 text-white font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-cyan-500 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors self-end"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>İşleniyor...</span>
          </>
        ) : (
          <>
            <PlayCircle size={20} />
            <span>{getButtonText()}</span>
          </>
        )}
      </button>
    </form>
  );
};

export default TaskInitiator;