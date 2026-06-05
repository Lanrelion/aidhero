import { create } from 'zustand';

interface RescueStore {
  activeScenario: string | null;
  currentNodeId: string | null;
  currentStepIndex: number;
  history: string[];
  isVoiceMode: boolean;
  startRescue: (scenarioId: string) => void;
  answerQuestion: (nextNodeId: string) => void;
  goBack: () => void;
  advanceStep: () => void;
  setVoiceMode: (val: boolean) => void;
  clearRescue: () => void;
}

export const useRescueStore = create<RescueStore>((set) => ({
  activeScenario: null,
  currentNodeId: null,
  currentStepIndex: 0,
  history: [],
  isVoiceMode: false,

  startRescue: (scenarioId: string) => set({
    activeScenario: scenarioId,
    currentNodeId: 'q1', // default root node id for our decision trees
    currentStepIndex: 0,
    history: ['q1'],
  }),

  answerQuestion: (nextNodeId: string) => set((state) => ({
    currentNodeId: nextNodeId,
    history: [...state.history, nextNodeId]
  })),

  goBack: () => set((state) => {
    if (state.history.length <= 1) return state; // Can't go back from root
    const newHistory = state.history.slice(0, -1);
    return {
      history: newHistory,
      currentNodeId: newHistory[newHistory.length - 1],
      currentStepIndex: 0 // Reset step index when going back to a decision node
    };
  }),

  advanceStep: () => set((state) => ({
    currentStepIndex: state.currentStepIndex + 1
  })),

  setVoiceMode: (val: boolean) => set({ isVoiceMode: val }),

  clearRescue: () => set({
    activeScenario: null,
    currentNodeId: null,
    currentStepIndex: 0,
    history: []
  })
}));
