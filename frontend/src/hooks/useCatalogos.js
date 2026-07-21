import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearCatalogo, listarCatalogo } from '../api/catalogos'

export function useCatalogo(tipo, params = {}, options = {}) {
  return useQuery({
    queryKey: ['catalogo', tipo, params],
    queryFn: () => listarCatalogo(tipo, params),
    ...options,
  })
}

export function useCrearCatalogo(tipo) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos) => crearCatalogo(tipo, datos),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['catalogo', tipo] }),
  })
}
