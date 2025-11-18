import { VotableResponse, TaskContext } from '../types';

// Simulates various provider tools based on context

interface SimulationResult {
    response: VotableResponse;
    data?: any;
}

const createSuccessResponse = (reason: string, data?: any): SimulationResult => ({
    response: {
        decision: 'confirm',
        reason,
        confidence: 0.9 + Math.random() * 0.1, // High confidence for success
    },
    data
});

export const simulateProviderResponse = async (toolId: string, context: TaskContext): Promise<SimulationResult> => {
    console.log(`[Provider Sim] Executing tool '${toolId}' with context:`, context);
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700)); // Simulate API latency

    switch (toolId) {
        // --- Turkish Airlines Tools ---
        case 'tk_verify_customer':
            if (context.customerProfile?.loyalty?.miles_card) {
                return createSuccessResponse(
                    `Miles&Smiles member ${context.customerProfile.loyalty.miles_card} verified successfully.`,
                    { customerVerified: true }
                );
            }
            return { response: { decision: 'reject', reason: 'No loyalty card found in profile.', confidence: 1.0 }, data: { customerVerified: false } };
            
        case 'tk_check_miles':
             if (context.customerProfile?.loyalty?.miles_balance) {
                return createSuccessResponse(
                    `Customer has ${context.customerProfile.loyalty.miles_balance.toLocaleString()} miles available.`,
                    { milesBalance: context.customerProfile.loyalty.miles_balance }
                );
            }
            return createSuccessResponse('No miles balance found.', { milesBalance: 0 });

        case 'tk_search_flights':
            const flightDetails = {
                airline: "Turkish Airlines",
                flightNumber: "TK1815",
                from: "IST",
                to: "NCE", // Nice, for Monaco
                class: context.customerProfile?.preferences?.class_preference || 'Economy',
                price: context.customerProfile?.preferences?.class_preference === 'Business' ? 2500 : 800,
                currency: 'EUR',
                summary: 'Found a direct THY flight to Nice.'
            };
            return createSuccessResponse(`Direct flight found for customer preference.`, flightDetails);

        // --- Maritime Tools ---
        case 'check_marina_availability':
            if (context.customerProfile?.assets?.some((a:any) => a.type === 'yacht')) {
                 return createSuccessResponse(
                    `Berth available at Port Hercule for yacht 'Wim'.`,
                    { marinaConfirmation: 'MHB-8817', summary: 'Marina berth confirmed in Monaco.'}
                 );
            }
            return createSuccessResponse('No yacht found in profile, marina check skipped.', {});
            
        // --- Default/Generic Tools ---
        default:
            return createSuccessResponse(`Generic tool '${toolId}' executed successfully with provided context.`);
    }
};
