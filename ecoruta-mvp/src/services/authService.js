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

export async function cerrarSesionAuth() {
  const { error } = await clienteAuth().auth.signOut();
  if (error) throw error;
}
