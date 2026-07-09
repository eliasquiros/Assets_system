import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listarBajas, registrarBaja, revertirBaja } from '../api/bajas'
import { useAuth } from '../context/AuthContext'

export function useBajas() {
  const { token } = useAuth()
  return useQuery({ queryKey: ['bajas'], queryFn: () => listarBajas({ token }) })
}

export function useRegistrarBaja() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos) => registrarBaja(datos, { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bajas'] })
      queryClient.invalidateQueries({ queryKey: ['activos'] })
    },
  })
}

export function useRevertirBaja() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id) => revertirBaja(id, { token }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bajas'] })
      queryClient.invalidateQueries({ queryKey: ['activos'] })
    },
  })
}
