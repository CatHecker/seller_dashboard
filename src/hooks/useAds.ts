import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  fetchItems,
  fetchItemById,
  updateItem,
  type FetchItemsParams,
  type ItemUpdatePayload,
} from '../services/api';

export function useItemsQuery(params: FetchItemsParams) {
  return useQuery({
    queryKey: ['items', params],
    queryFn: ({ signal }) => fetchItems(params, signal),
  });
}

export function useItemQuery(id: string | number | undefined) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: ({ signal }) => fetchItemById(id!, signal),
    enabled: !!id,
  });
}

export function useUpdateItemMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: ItemUpdatePayload;
    }) => updateItem(id, data),
    onSuccess: (_, variables) => {
      // Инвалидируем список и конкретный элемент
      queryClient.invalidateQueries({ queryKey: ['items'] });
      queryClient.invalidateQueries({ queryKey: ['item', variables.id] });
    },
  });
}
