
import { VotableResponse, TaskContext } from '../types';

interface SimulationResult {
    response: VotableResponse | null;
    data?: any;
}

const createSuccessResponse = (reason: string, data?: any): SimulationResult => ({
    response: {
        decision: 'confirm',
        reason,
        confidence: 0.9 + Math.random() * 0.1,
    },
    data
});

export const simulateProviderResponse = async (toolId: string, providerId: string, context: TaskContext): Promise<SimulationResult> => {
    console.log(`[Provider Sim] Executing tool '${toolId}' via provider '${providerId}' with context:`, context);
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700));

    // --- Tool-specific logic ---
    switch (toolId) {
        case 'tk_verify_customer':
             return createSuccessResponse(`Miles&Smiles member verified.`);
        case 'tk_check_miles':
             return createSuccessResponse(`Member has 150,000 miles.`);
        case 'tk_search_flights':
        case 'gds_flight_search':
            let flightDetails = {};
            // --- Provider-specific logic nested within the tool ---
            if (providerId === 'turkish_airlines') {
                flightDetails = { airline: "Turkish Airlines", from: "IST", to: "NCE", direct: true, price: 2500, currency: "EUR", summary: "Direct THY flight to Nice (NCE) found." };
            } else if (providerId === 'amadeus') {
                flightDetails = { airline: "Lufthansa", from: "IST", to: "NCE", direct: true, price: 2800, currency: "EUR", summary: "Direct Lufthansa flight found via Amadeus." };
            } else if (providerId === 'sabre') {
                flightDetails = { airline: "Air France", from: "IST", to: "NCE", direct: false, stops: 1, price: 1800, currency: "EUR", summary: "Cheaper Air France flight with 1 stop found via Sabre." };
            }
            return createSuccessResponse(`Flight option found via ${providerId}.`, flightDetails);

        case 'check_marina_availability':
            if (context.customerProfile?.assets?.some((a:any) => a.type === 'yacht')) {
                 return createSuccessResponse(`Berth available at Port Hercule for yacht 'Wim'.`, { marinaConfirmation: 'MHB-8817', summary: 'Marina berth confirmed in Monaco.'});
            }
            return createSuccessResponse('No yacht in profile, marina check skipped.', {});

        case 'customer_lookup':
             return createSuccessResponse(`Customer profile found.`, { customerProfile: context.customerProfile });

        default:
            return createSuccessResponse(`Generic tool '${toolId}' executed successfully.`);
    }
};