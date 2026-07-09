import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { crearActivo, editarActivo, listarActivos, obtenerActivo, obtenerMovimientos } from '../api/activos'
import { useAuth } from '../context/AuthContext'

export function useActivos({ search = '', area = '', tipo = '' } = {}) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['activos', { search, area, tipo }],
    queryFn: () => listarActivos({ search, area, tipo, token }),
  })
}

export function useActivo(num) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['activo', num],
    queryFn: () => obtenerActivo(num, { token }),
    enabled: !!num,
  })
}

export function useMovimientos(num) {
  const { token } = useAuth()
  return useQuery({
    queryKey: ['movimientos', num],
    queryFn: () => obtenerMovimientos(num, { token }),
    enabled: !!num,
  })
}

export function useCrearActivo() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (datos) => crearActivo(datos, { token }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activos'] }),
  })
}

export function useEditarActivo() {
  const { token } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ num, datos }) => editarActivo(num, datos, { token }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['activos'] })
      queryClient.invalidateQueries({ queryKey: ['activo', variables.num] })
    },
  })
}
