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
  
  const [from, setFrom] =useState('İstanbul');
  const [to, setTo] = useState('Bodrum');
  const [location, setLocation] = useState('Kuşadası Marina');
  const [vessel, setVessel] = useState('Ada-1');
  const [service, setService] = useState('Otel');
  const [assistanceLocation, setAssistanceLocation] = useState('Çeşme');
  const [queryDetails, setQueryDetails] = useState('Son 24 saatteki hareketler');
  const [eventName, setEventName] = useState('Ada Global Summit 2024');
  
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
  
  const baseInputClasses = "w-full bg-[var(--color-panel)] border border-[var(--color-primary)]/30 rounded-md p-2 text-white focus:ring-2 focus:ring-[var(--color-primary)] focus:outline-none transition-all";
  
  const renderNodeSelector = (label: string, id: string, value: string, setter: (val: string) => void, nodes: Node[]) => (
    <div className="flex-grow w-full">
        <label htmlFor={id} className="text-xs text-[var(--color-text-dim)]">{label}</label>
        <select id={id} value={value} onChange={(e) => setter(e.target.value)}
            className={baseInputClasses}
            disabled={isProcessing || nodes.length === 0}>
            {nodes.length === 0 ? (<option>No Available Node</option>) : (nodes.map(node => <option key={node.id} value={node.id}>{node.name}</option>))}
        </select>
    </div>
  );

  const renderInputs = () => {
    if (selectedSkill === 'congressOrganization') {
        return (
            <div className="grid grid-cols-2 gap-2 w-full">
                <div className="col-span-2">
                    <label htmlFor="eventName" className="text-xs text-[var(--color-text-dim)]">Event Name</label>
                    <input id="eventName" type="text" value={eventName} onChange={(e) => setEventName(e.target.value)} className={baseInputClasses} disabled={isProcessing} />
                </div>
                {renderNodeSelector('Congress', 'congressNode', targetCongressNodeId, setTargetCongressNodeId, congressNodes)}
                {renderNodeSelector('Passkit', 'passkitNode', targetPasskitNodeId, setTargetPasskitNodeId, passkitNodes)}
                {renderNodeSelector('Finance', 'financeNode', targetFinanceNodeId, setTargetFinanceNodeId, financeNodes)}
                {renderNodeSelector('Interpreter', 'interpreterNode', targetInterpreterNodeId, setTargetInterpreterNodeId, interpreterNodes)}
                {renderNodeSelector('Restaurant', 'restaurantNode', targetRestaurantNodeId, setTargetRestaurantNodeId, restaurantNodes)}
                {renderNodeSelector('Hukuk', 'hukukNode', targetHukukNodeId, setTargetHukukNodeId, hukukNodes)}
            </div>
        )
    }
    // Add other cases if more complex UIs are needed
    return null;
  };

  const getButtonText = () => {
    switch(selectedSkill) {
      case 'congressOrganization': return 'Organize';
      default: return 'Initiate';
    }
  }

  const isSubmitDisabled = isProcessing || (selectedSkill === 'congressOrganization' && (!congressNodes.length || !passkitNodes.length || !financeNodes.length || !interpreterNodes.length || !restaurantNodes.length || !hukukNodes.length));

  return (
    <form onSubmit={handleSubmit} className="panel-glow p-4 flex flex-col gap-3 h-full">
      <h3 className="text-lg font-semibold text-[var(--color-primary)] flex-shrink-0" style={{ textShadow: `0 0 5px var(--color-primary-glow)`}}>Task Initiator</h3>
      <div className="w-full">
         <label htmlFor="skill" className="text-xs text-[var(--color-text-dim)]">Task Type</label>
         <select
            id="skill"
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value as TaskDetails['skillName'])}
            className={baseInputClasses}
            disabled={isProcessing}
         >
            <option value="congressOrganization">Int. Congress Org.</option>
            <option value="fullItinerary">Full Itinerary</option>
            <option value="weeklyReport">Weekly Report</option>
            <option value="routePlanning">Route Planning</option>
         </select>
      </div>
      <div className="flex-grow w-full overflow-y-auto">
          {renderInputs()}
      </div>
      <button
        type="submit"
        disabled={isSubmitDisabled}
        className="w-full mt-2 px-6 py-2 border border-[var(--color-primary)] bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-semibold rounded-md flex items-center justify-center gap-2 hover:bg-[var(--color-primary)]/40 disabled:bg-gray-500/20 disabled:border-gray-600 disabled:text-gray-500 disabled:cursor-not-allowed transition-colors self-end flex-shrink-0"
      >
        {isProcessing ? (
          <>
            <Loader className="animate-spin" size={20} />
            <span>Processing...</span>
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
