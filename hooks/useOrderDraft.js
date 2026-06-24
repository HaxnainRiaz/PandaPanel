import { useState, useCallback, useMemo, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import useOrderStore from '@/store/useOrderStore';
import toast from 'react-hot-toast';

export const useOrderDraft = (initialOrder, onSaveSuccess) => {
    const { adminRequest, updateOrder } = useAdmin();
    const { setCurrentOrderList, currentOrderList } = useOrderStore();
    const setDirty = useOrderStore(state => state.setDirty);
    
    const [order, setOrder] = useState(initialOrder);
    const [itemEdits, setItemEdits] = useState({});
    const [inputStates, setInputStates] = useState({});
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (initialOrder?._id !== order?._id) {
            setOrder(initialOrder);
            setItemEdits({});
            setInputStates({});
        }
    }, [initialOrder?._id, order?._id]);

    // Track "dirty" state in global store to block socket overwrites
    useEffect(() => {
        if (order?._id) {
            const isDirty = Object.keys(itemEdits).length > 0;
            setDirty(order._id, isDirty);
        }
        return () => {
            if (order?._id) setDirty(order._id, false);
        };
    }, [order?._id, itemEdits, setDirty]);

    const handleInputChange = useCallback((idx, field, value) => {
        setInputStates(prev => ({
            ...prev,
            [`${idx}-${field}`]: value
        }));
    }, []);

    const updateLocalItem = useCallback((idx, updates) => {
        setItemEdits(prev => {
            const originalItem = order.items[idx];
            const currentEdit = prev[idx] || { 
                quantity: originalItem.quantity, 
                price: originalItem.price 
            };
            const nextEdit = { ...currentEdit, ...updates };

            // If it matches original, remove edit entry
            if (nextEdit.quantity === originalItem.quantity && nextEdit.price === originalItem.price) {
                const newState = { ...prev };
                delete newState[idx];
                return newState;
            }

            return { ...prev, [idx]: nextEdit };
        });
    }, [order?.items]);

    const cancelItemEdit = useCallback((idx) => {
        setItemEdits(prev => {
            const newState = { ...prev };
            delete newState[idx];
            return newState;
        });
        setInputStates(prev => {
            const newState = { ...prev };
            delete newState[`${idx}-price`];
            delete newState[`${idx}-quantity`];
            delete newState[`${idx}-total`];
            return newState;
        });
    }, []);

    const saveItemEdit = useCallback(async (idx) => {
        if (!order?._id) return;
        
        setIsSaving(true);
        try {
            const originalItem = order.items[idx];
            const edit = itemEdits[idx] || {};
            const updatedItem = { ...originalItem, ...edit };
            
            // Recalculate full items array for the payload
            const newItems = order.items.map((item, i) => i === idx ? updatedItem : item);
            
            // Note: totalAmount will be recalculated by backend, but we send it for optimistic update
            const newSubtotal = newItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
            const newTotal = newSubtotal + (order.shippingFee || 0);

            const payload = {
                items: newItems,
                totalAmount: newTotal
            };

            const res = await adminRequest(`/orders/${order._id}`, 'PATCH', payload);
            
            if (res?.success) {
                const savedOrder = res.data || { ...order, ...payload };
                setOrder(savedOrder);
                
                // Update global state
                if (updateOrder) updateOrder(savedOrder._id, savedOrder);
                
                const newList = currentOrderList.map(o => o._id === savedOrder._id ? savedOrder : o);
                setCurrentOrderList(newList);
                
                cancelItemEdit(idx);
                if (onSaveSuccess) onSaveSuccess(savedOrder);
                toast.success("Item updated");
            } else {
                toast.error(res?.message || "Failed to update item");
            }
        } catch (err) {
            toast.error("An error occurred while saving");
        } finally {
            setIsSaving(false);
        }
    }, [order, itemEdits, adminRequest, updateOrder, currentOrderList, setCurrentOrderList, cancelItemEdit, onSaveSuccess]);

    return {
        order,
        setOrder,
        itemEdits,
        inputStates,
        isSaving,
        handleInputChange,
        updateLocalItem,
        cancelItemEdit,
        saveItemEdit
    };
};
