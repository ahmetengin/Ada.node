import { generateVotableContent } from './geminiService';
import { VoteOutcome, VotableResponse } from '../types';

const VOTER_COUNT = 3; // Default to 3 for performance in a web demo. Can be increased to 7.
const CONFIDENCE_THRESHOLD = 0.7;

/**
 * Performs a majority vote by making parallel calls to an AI model.
 * @param prompt The prompt describing the decision to be made.
 * @returns A VoteOutcome object with the results of the vote.
 */
export const performMajorityVote = async (prompt: string): Promise<VoteOutcome> => {
    const voterPromises: Promise<VotableResponse | null>[] = [];
    for (let i = 0; i < VOTER_COUNT; i++) {
        voterPromises.push(generateVotableContent(prompt));
    }

    const responses = (await Promise.all(voterPromises)).filter(
        (res): res is VotableResponse => res !== null
    );

    const voteDistribution: Record<string, number> = {};
    let totalConfidence = 0;

    for (const res of responses) {
        const decision = res.decision.toLowerCase().trim();
        voteDistribution[decision] = (voteDistribution[decision] || 0) + 1;
        totalConfidence += res.confidence;
    }

    if (responses.length === 0) {
        return {
            isConsensus: false,
            majorityDecision: null,
            confidence: 0,
            voteDistribution: {},
            rawResponses: [],
        };
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

    const averageConfidence = totalConfidence / responses.length;
    
    // Consensus is reached if there's no tie, the winner has >50% of the vote, and confidence is high.
    const isConsensus = 
        !hasTie &&
        majorityDecision !== null && 
        maxVotes > VOTER_COUNT / 2 &&
        averageConfidence >= CONFIDENCE_THRESHOLD;

    return {
        isConsensus,
        majorityDecision,
        confidence: averageConfidence,
        voteDistribution,
        rawResponses: responses,
    };
};
