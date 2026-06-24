"use client";

import { create } from 'zustand';

// Pure state management - NO window operations in state setters
// Window history updates should be handled by consumer components in useEffect
const useOrderStore = create((set) => ({
    selectedOrderId: null,
    isSliderOpen: false,
    currentOrderList: [],
    currentIndex: -1,
    // Track orders being edited to prevent socket-driven overwrites
    dirtyOrderIds: new Set(),

    // Pure state setter - removes window.history calls that break rendering
    setSelectedOrderId: (id) => set((state) => {
        const index = state.currentOrderList.findIndex(o => o._id === id);
        return { selectedOrderId: id, isSliderOpen: !!id, currentIndex: index };
    }),

    setCurrentOrderList: (list) => set({ currentOrderList: list }),

    setDirty: (id, isDirty) => set((state) => {
        const next = new Set(state.dirtyOrderIds);
        if (isDirty) next.add(id);
        else next.delete(id);
        return { dirtyOrderIds: next };
    }),

    isOrderDirty: (id) => {
        // Zustand doesn't expose state directly in methods this way easily for external calls 
        // without getting state first, but for selectors it works fine.
    },

    nextOrder: () => set((state) => {
        if (state.currentIndex < state.currentOrderList.length - 1) {
            const newId = state.currentOrderList[state.currentIndex + 1]._id;
            return { selectedOrderId: newId, currentIndex: state.currentIndex + 1 };
        }
        return state;
    }),

    prevOrder: () => set((state) => {
        if (state.currentIndex > 0) {
            const newId = state.currentOrderList[state.currentIndex - 1]._id;
            return { selectedOrderId: newId, currentIndex: state.currentIndex - 1 };
        }
        return state;
    }),

    openSlider: (id, list) => set(() => {
        const index = list.findIndex(o => o._id === id);
        return { 
            selectedOrderId: id, 
            isSliderOpen: true, 
            currentOrderList: list, 
            currentIndex: index 
        };
    }),

    closeSlider: () => set(() => {
        return { isSliderOpen: false, selectedOrderId: null, currentIndex: -1 };
    })
}));

export default useOrderStore;
