# EcoRuta

Aplicación React + Vite para consultar información de recolección y crear reportes ciudadanos.

## Desarrollo local

```bash
npm install
npm run dev
```

## Configuración de Supabase

La autenticación, los perfiles y el catálogo de ciudades/barrios usan Supabase.

1. En el SQL Editor de Supabase, ejecuta `supabase/migrations/20261124010000_auth_profiles_city_catalog.sql`.
2. En **Authentication → Providers → Email**, habilita la confirmación de correo.
3. En **Authentication → Email Templates → Confirm signup**, configura el mensaje para mostrar el código con `{{ .Token }}`. La aplicación verifica ese código como OTP.
4. Copia `.env.example` a `.env` y completa la URL del proyecto y la clave pública/anon de Supabase. Nunca uses la clave `service_role` en el frontend.
5. En Vercel, agrega las mismas variables en **Project → Settings → Environment Variables** y vuelve a desplegar.

El catálogo SQL inicial contiene una selección ampliable de barrios de Bogotá y Medellín. Sus horarios y empresas de aseo quedan vacíos hasta que se carguen datos verificados; la interfaz los muestra como pendientes.

Las contraseñas las administra Supabase Auth. La tabla `perfiles` solo guarda el nombre y el barrio asociados al usuario autenticado.

## Comandos

- `npm run build`: compila la aplicación.
- `npm run lint`: ejecuta ESLint.
