
import { ToolOutput, VoteOutcome, VotableResponse } from '../types';

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Analyzes a collection of tool outputs to determine a consensus.
 * This is a pure function and does not make any external API calls.
 * @param toolOutputs An array of outputs from executed tools.
 * @returns A VoteOutcome object with the results of the analysis.
 */
export const performMajorityVote = (toolOutputs: ToolOutput[]): VoteOutcome => {
    const validResponses: ToolOutput[] = toolOutputs.filter(o => o.response);
    if (validResponses.length === 0) {
        return {
            isConsensus: false,
            majorityDecision: 'reject', // Default to reject if no valid responses
            confidence: 0,
            voteDistribution: { 'no_response': toolOutputs.length },
            rawResponses: toolOutputs,
        };
    }

    const voteDistribution: Record<string, number> = {};
    let totalConfidence = 0;

    for (const output of validResponses) {
        const res = output.response as VotableResponse;
        const decision = res.decision.toLowerCase().trim();
        voteDistribution[decision] = (voteDistribution[decision] || 0) + 1;
        totalConfidence += res.confidence;
    }

    let majorityDecision: string | null = null;
    let maxVotes = 0;
    for (const decision in voteDistribution) {
        if (voteDistribution[decision] > maxVotes) {
            maxVotes = voteDistribution[decision];
            majorityDecision = decision;
        }
    }

    // Check for ties
    const decisionsWithMaxVotes = Object.values(voteDistribution).filter(v => v === maxVotes);
    const hasTie = decisionsWithMaxVotes.length > 1;

    const averageConfidence = validResponses.length > 0 ? totalConfidence / validResponses.length : 0;
    
    // Consensus is reached if there's no tie, the winner has >50% of the valid votes, and confidence is high.
    const isConsensus = 
        !hasTie &&
        majorityDecision !== null && 
        maxVotes > validResponses.length / 2 &&
        averageConfidence >= CONFIDENCE_THRESHOLD;

    return {
        isConsensus,
        majorityDecision,
        confidence: averageConfidence,
        voteDistribution,
        rawResponses: toolOutputs,
    };
};