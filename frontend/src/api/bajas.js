import { apiFetch } from './client'

export function listarBajas({ token } = {}) {
  return apiFetch('/bajas/', { token })
}

export function registrarBaja(datos, { token } = {}) {
  // El respaldo (RN-002.2) es un archivo: se envía como multipart, no JSON.
  const fd = new FormData()
  fd.append('activoNum', datos.activoNum)
  fd.append('motivo', datos.motivo)
  fd.append('desc', datos.desc)
  fd.append('fechaEfectiva', datos.fechaEfectiva)
  fd.append('archivo', datos.archivo)
  return apiFetch('/bajas/', { method: 'POST', body: fd, token })
}

export function revertirBaja(id, { token } = {}) {
  return apiFetch(`/bajas/${id}/revertir/`, { method: 'POST', token })
}
