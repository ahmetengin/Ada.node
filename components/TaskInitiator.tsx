import React, { useState, useEffect } from 'react';
import { PlayCircle, Loader } from 'lucide-react';
import { TaskDetails, Node, NodeType } from '../types';

interface TaskInitiatorProps {
  onSubmit: (task: TaskDetails) => void;
  isProcessing: boolean;
  nodes: Node[];
}

const TaskInitiator: React.FC<TaskInitiatorProps> = ({ onSubmit, isProcessing, nodes }) => {
  const [selectedSkill, setSelectedSkill] = useState<TaskDetails['skillName']>('congressOrganization');
  
  // State for route planning / itinerary
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

  // State for congress organization
  const [eventName, setEventName] = useState('Ada Global Summit 2024');
  
  // State for target nodes
  const [targetNodeId, setTargetNodeId] = useState('');
  const [targetFinanceNodeId, setTargetFinanceNodeId] = useState('');
  const [targetTravelNodeId, setTargetTravelNodeId] = useState('');
  const [targetDbNodeId, setTargetDbNodeId] = useState('');
  const [targetApiNodeId, setTargetApiNodeId] = useState('');
  const [targetCongressNodeId, setTargetCongressNodeId] = useState('');
  const [targetPasskitNodeId, setTargetPasskitNodeId] = useState('');
  const [targetInterpreterNodeId, setTargetInterpreterNodeId] = useState('');
  const [targetRestaurantNodeId, setTargetRestaurantNodeId] = useState('');
  const [targetHukukNodeId, setTargetHukukNodeId] = useState('');


  // Filter nodes by type for selectors
  const marinaNodes = nodes.filter(n => n.type === NodeType.MARINA);
  const seaNodes = nodes.filter(n => n.type === NodeType.SEA);
  const financeNodes = nodes.filter(n => n.type === NodeType.FINANCE);
  const travelNodes = nodes.filter(n => n.type === NodeType.TRAVEL);
  const dbNodes = nodes.filter(n => n.type === NodeType.DB);
  const apiNodes = nodes.filter(n => n.type === NodeType.API);
  const congressNodes = nodes.filter(n => n.type === NodeType.CONGRESS);
  const passkitNodes = nodes.filter(n => n.type === NodeType.PASSKIT);
  const interpreterNodes = nodes.filter(n => n.type === NodeType.INTERPRETER);
  const restaurantNodes = nodes.filter(n => n.type === NodeType.RESTAURANT);
  const hukukNodes = nodes.filter(n => n.type === NodeType.HUKUK);
  
  
  useEffect(() => {
    // Simplified auto-selection logic for clarity
    const autoSelect = (nodes: Node[], setter: React.Dispatch<React.SetStateAction<string>>) => {
        if (nodes.length > 0) {
            setter(prev => nodes.find(n => n.id === prev) ? prev : nodes[0].id);
        } else {
            setter('');
        }
    };
    
    switch(selectedSkill) {
        case 'bookingConfirmation':
        case 'bookingAssistance':
            autoSelect(marinaNodes, setTargetNodeId);
            break;
        case 'vesselStatusCheck':
            autoSelect(seaNodes, setTargetNodeId);
            break;
        case 'transactionQuery':
            autoSelect(financeNodes, setTargetNodeId);
            break;
        case 'fullItinerary':
            autoSelect(marinaNodes, setTargetNodeId);
            autoSelect(financeNodes, setTargetFinanceNodeId);
            autoSelect(travelNodes, setTargetTravelNodeId);
            break;
        case 'weeklyReport':
            autoSelect(dbNodes, setTargetDbNodeId);
            autoSelect(apiNodes, setTargetApiNodeId);
            break;
        case 'congressOrganization':
            autoSelect(congressNodes, setTargetCongressNodeId);
            autoSelect(passkitNodes, setTargetPasskitNodeId);
            autoSelect(financeNodes, setTargetFinanceNodeId);
            autoSelect(interpreterNodes, setTargetInterpreterNodeId);
            autoSelect(restaurantNodes, setTargetRestaurantNodeId);
            autoSelect(hukukNodes, setTargetHukukNodeId);
            break;
        default:
            setTargetNodeId('');
    }
  }, [selectedSkill, nodes]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isProcessing) return;

    switch(selectedSkill) {
        case 'routePlanning':
            if (from && to) onSubmit({ skillName: 'routePlanning', from, to });
            break;
        case 'bookingConfirmation':
            if (location && vessel && targetNodeId) onSubmit({ skillName: 'bookingConfirmation', location, vessel, targetNodeId });
            break;
        case 'bookingAssistance':
            if (service && assistanceLocation && targetNodeId) onSubmit({ skillName: 'bookingAssistance', service, location: assistanceLocation, targetNodeId });
            break;
        case 'vesselStatusCheck':
            if (targetNodeId) onSubmit({ skillName: 'vesselStatusCheck', targetNodeId });
            break;
        case 'transactionQuery':
            if (queryDetails && targetNodeId) onSubmit({ skillName: 'transactionQuery', details: queryDetails, targetNodeId });
            break;
        case 'fullItinerary':
            if (from && to && targetNodeId && targetFinanceNodeId && targetTravelNodeId) onSubmit({ skillName: 'fullItinerary', from, to, targetMarinaNodeId: targetNodeId, targetFinanceNodeId, targetTravelNodeId });
            break;
        case 'weeklyReport':
            if (targetDbNodeId && targetApiNodeId) onSubmit({ skillName: 'weeklyReport', targetDbNodeId, targetApiNodeId });
            break;
        case 'congressOrganization':
            if (eventName && targetCongressNodeId && targetPasskitNodeId && targetFinanceNodeId && targetInterpreterNodeId && targetRestaurantNodeId && targetHukukNodeId) {
                onSubmit({ skillName: 'congressOrganization', eventName, targetCongressNodeId, targetPasskitNodeId, targetFinanceNodeId, targetInterpreterNodeId, targetRestaurantNodeId, targetHukukNodeId });
            }
            break;
    }
  };

  const renderNodeSelector = (label: string, id: string, value: string, setter: (val: string) => void, nodes: Node[]) => (
    <div className="flex-grow w-full">
        <label htmlFor={id} className="text-xs text-gray-400">{label}</label>
        <select id={id} value={value} onChange={(e) => setter(e.target.value)}
            className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
            disabled={isProcessing || nodes.length === 0}>
            {nodes.length === 0 ? (<option>Uygun Düğüm Yok</option>) : (nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>))}
        </select>
    </div>
  );

  const renderInputs = () => {
    switch (selectedSkill) {
        case 'congressOrganization':
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    <div className="md:col-span-2 lg:col-span-3">
                        <label htmlFor="eventName" className="text-xs text-gray-400">Etkinlik Adı</label>
                        <input id="eventName" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing} />
                    </div>
                    {renderNodeSelector('Kongre Düğümü', 'congressNode', targetCongressNodeId, setTargetCongressNodeId, congressNodes)}
                    {renderNodeSelector('Passkit Düğümü', 'passkitNode', targetPasskitNodeId, setTargetPasskitNodeId, passkitNodes)}
                    {renderNodeSelector('Finans Düğümü', 'financeNode', targetFinanceNodeId, setTargetFinanceNodeId, financeNodes)}
                    {renderNodeSelector('Tercüman Düğümü', 'interpreterNode', targetInterpreterNodeId, setTargetInterpreterNodeId, interpreterNodes)}
                    {renderNodeSelector('Restoran Düğümü', 'restaurantNode', targetRestaurantNodeId, setTargetRestaurantNodeId, restaurantNodes)}
                    {renderNodeSelector('Hukuk Düğümü', 'hukukNode', targetHukukNodeId, setTargetHukukNodeId, hukukNodes)}
                </div>
            )
        case 'fullItinerary':
        case 'routePlanning':
            return (
                <div className="flex flex-col sm:flex-row items-end gap-4 w-full">
                    <div className="flex-grow w-full">
                        <label htmlFor="from" className="text-xs text-gray-400">Nereden</label>
                        <input id="from" type="text" value={from} onChange={(e) => setFrom(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing} />
                    </div>
                    <div className="flex-grow w-full">
                        <label htmlFor="to" className="text-xs text-gray-400">Nereye</label>
                        <input id="to" type="text" value={to} onChange={(e) => setTo(e.target.value)} className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white" disabled={isProcessing} />
                    </div>
                    {selectedSkill === 'fullItinerary' && (
                        <>
                            {renderNodeSelector('Hedef Marina', 'marinaNode', targetNodeId, setTargetNodeId, marinaNodes)}
                            {renderNodeSelector('Hedef Finans', 'financeNode', targetFinanceNodeId, setTargetFinanceNodeId, financeNodes)}
                            {renderNodeSelector('Hedef Seyahat', 'travelNode', targetTravelNodeId, setTargetTravelNodeId, travelNodes)}
                        </>
                    )}
                </div>
            )
        // Other cases can be simplified similarly...
        default:
            return <div className="flex-grow w-full min-h-[42px] flex items-center"><p className="text-sm text-gray-400">Görevi başlatmak için parametreleri doldurun.</p></div>;
    }
  };

  const getButtonText = () => {
    switch(selectedSkill) {
      case 'congressOrganization': return 'Kongreyi Organize Et';
      case 'fullItinerary': return 'Tam Plan Oluştur';
      case 'weeklyReport': return 'Rapor Oluştur';
      case 'routePlanning': return 'Rota Planla';
      case 'bookingConfirmation': return 'Rezervasyonu Onayla';
      case 'bookingAssistance': return 'Yardım İste';
      case 'vesselStatusCheck': return 'Durumu Sorgula';
      case 'transactionQuery': return 'İşlemi Sorgula';
      default: return 'Görevi Başlat';
    }
  }

  const isSubmitDisabled = isProcessing || (selectedSkill === 'congressOrganization' && (!congressNodes.length || !passkitNodes.length || !financeNodes.length || !interpreterNodes.length || !restaurantNodes.length || !hukukNodes.length));


  return (
    <form onSubmit={handleSubmit} className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 flex flex-col gap-4">
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="w-full sm:w-auto sm:min-w-[250px]">
           <label htmlFor="skill" className="text-xs text-gray-400">Görev Tipi</label>
           <select
              id="skill"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value as TaskDetails['skillName'])}
              className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-2 focus:ring-cyan-500 focus:outline-none"
              disabled={isProcessing}
           >
              <option value="congressOrganization">Uluslararası Kongre Organizasyonu</option>
              <option value="fullItinerary">Tam Seyahat Planı Oluşturma</option>
              <option value="weeklyReport">Haftalık Rapor Oluşturma</option>
              <option value="routePlanning">Rota Planlama</option>
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