import { supabase } from '../config/supabaseClient';

function clienteAuth() {
  if (!supabase) {
    throw new Error('La autenticación no está configurada. Define las variables de Supabase para continuar.');
  }
  return supabase;
}

export async function registrarCuenta({ nombre, email, password, barrioId }) {
  const { data, error } = await clienteAuth().auth.signUp({
    email,
    password,
    options: {
      data: { nombre: nombre.trim(), barrio_id: barrioId },
      emailRedirectTo: window.location.origin,
    },
  });

  if (error) throw error;
  return data;
}

export async function iniciarSesion(email, password) {
  const { data, error } = await clienteAuth().auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function verificarCodigoCorreo(email, token) {
  const { data, error } = await clienteAuth().auth.verifyOtp({
    email,
    token: token.trim(),
    type: 'signup',
  });

  if (error) throw error;
  return data;
}

export async function reenviarCodigoCorreo(email) {
  const { error } = await clienteAuth().auth.resend({ email, type: 'signup' });
  if (error) throw error;
}

export async function cerrarSesionAuth() {
  const { error } = await clienteAuth().auth.signOut();
  if (error) throw error;
}
