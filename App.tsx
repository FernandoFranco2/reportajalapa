// Punto de entrada: maneja la sesión, carga el perfil y muestra las pestañas.
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './src/lib/supabase';
import { avisar } from './src/lib/aviso';
import { useEsEscritorio } from './src/lib/pantalla';
import { Perfil } from './src/types';
import { colores, espacio, medidas } from './src/theme';
import LoginScreen from './src/screens/LoginScreen';
import ListaScreen from './src/screens/ListaScreen';
import MapaScreen from './src/screens/MapaScreen';
import NuevoReporteScreen from './src/screens/NuevoReporteScreen';
import BarraPestanas, { Pestana as DefPestana } from './src/components/BarraPestanas';
import BarraLateral from './src/components/BarraLateral';
import { CambioPestana } from './src/components/motion';
import ToastHost from './src/components/Toast';
import MarcaJ from './src/components/MarcaJ';
import { BotonIcono, Txt } from './src/components/ui';

type Pestana = 'lista' | 'resueltos' | 'mapa' | 'nuevo';

// En web: fondo, selección de texto, barras de desplazamiento y foco con los colores de la app.
function usarEstilosWeb() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const estilo = document.createElement('style');
    estilo.textContent = `
      html, body { background: ${colores.fondo}; color-scheme: dark; }
      ::selection { background: rgba(127,167,201,0.35); color: ${colores.texto}; }
      * { scrollbar-width: thin; scrollbar-color: ${colores.bordeFuerte} transparent; }
      *::-webkit-scrollbar { width: 10px; height: 10px; }
      *::-webkit-scrollbar-thumb { background: ${colores.borde}; border-radius: 8px; border: 2px solid ${colores.fondo}; }
      :focus-visible { outline: 2px solid ${colores.acento}; outline-offset: 2px; }
    `;
    document.head.appendChild(estilo);
    return () => {
      document.head.removeChild(estilo);
    };
  }, []);
}

export default function App() {
  usarEstilosWeb();
  const escritorio = useEsEscritorio();
  const [sesion, setSesion] = useState<Session | null>(null);
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [pestana, setPestana] = useState<Pestana>('lista');

  // Al abrir la app: recuperar la sesión guardada y escuchar cambios (login / logout).
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSesion(data.session);
      setCargando(false);
    });
    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, nuevaSesion) => {
      setSesion(nuevaSesion);
    });
    return () => escucha.subscription.unsubscribe();
  }, []);

  // Cada vez que cambia la sesión, cargar el perfil (nombre y rol).
  useEffect(() => {
    if (!sesion) {
      setPerfil(null);
      return;
    }
    supabase
      .from('profiles')
      .select('*')
      .eq('id', sesion.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          avisar('Error', error.message);
          return;
        }
        setPerfil(data as Perfil);
      });
  }, [sesion]);

  if (cargando || (sesion && !perfil)) {
    return (
      <View style={estilos.centro}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colores.acento} />
      </View>
    );
  }

  // Sin sesión solo se muestra el login.
  if (!sesion || !perfil) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={estilos.raiz}>
          <LoginScreen />
        </View>
      </SafeAreaProvider>
    );
  }

  const esVecino = perfil.rol === 'vecino';
  const pestanas: DefPestana<Pestana>[] = [
    { clave: 'lista', texto: 'Reportes', icono: 'list-outline' },
    { clave: 'resueltos', texto: 'Resueltos', icono: 'checkmark-circle-outline' },
    { clave: 'mapa', texto: 'Mapa', icono: 'map-outline' },
    // "Nuevo reporte" solo para vecinos
    ...(esVecino ? [{ clave: 'nuevo' as const, texto: 'Nuevo', icono: 'add-circle-outline' as const }] : []),
  ];

  // Contenido de la pestaña activa (igual en teléfono y en pantalla ancha).
  const contenidoPestanas = (
    <CambioPestana clave={pestana} indice={pestanas.findIndex((p) => p.clave === pestana)}>
      {pestana === 'lista' && <ListaScreen perfil={perfil} soloResueltos={false} />}
      {pestana === 'resueltos' && <ListaScreen perfil={perfil} soloResueltos={true} />}
      {pestana === 'mapa' && <MapaScreen />}
      {/* "Nuevo" siempre está montado (solo se oculta) para no perder la foto ni el texto
          al cambiar de pestaña. Lista y Mapa sí se recargan cada vez. */}
      {esVecino && (
        <View style={pestana === 'nuevo' ? estilos.contenido : estilos.oculto}>
          <NuevoReporteScreen usuarioId={perfil.id} alTerminar={() => setPestana('lista')} />
        </View>
      )}
    </CambioPestana>
  );

  // Pantalla ancha (navegador, tablet horizontal): barra lateral y contenido amplio.
  if (escritorio) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <View style={[estilos.raiz, estilos.fila]}>
          <BarraLateral
            pestanas={pestanas}
            activa={pestana}
            onCambiar={setPestana}
            nombre={perfil.nombre}
            rol={esVecino ? 'Vecino' : 'Municipalidad de Jalapa'}
            onSalir={() => supabase.auth.signOut()}
          />
          <View style={estilos.principal}>
            <View style={estilos.columnaAncha}>{contenidoPestanas}</View>
            <ToastHost />
          </View>
        </View>
      </SafeAreaProvider>
    );
  }

  // Teléfono: encabezado arriba y barra de pestañas flotante abajo.
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <View style={estilos.raiz}>
        <SafeAreaView style={estilos.pantalla} edges={['top', 'left', 'right']}>
          {/* Encabezado: saludo y nombre */}
          <View style={estilos.encabezado}>
            <MarcaJ tamano={36} />
            <View style={{ flex: 1 }}>
              <Txt variante="pequeno" color={colores.textoTenue}>
                {esVecino ? 'Hola,' : 'Municipalidad de Jalapa,'}
              </Txt>
              <Txt variante="subtitulo" numberOfLines={1}>
                {perfil.nombre}
              </Txt>
            </View>
            <BotonIcono nombre="log-out-outline" etiqueta="Cerrar sesión" onPress={() => supabase.auth.signOut()} />
          </View>

          {contenidoPestanas}

          <ToastHost />
          <BarraPestanas pestanas={pestanas} activa={pestana} onCambiar={setPestana} />
        </SafeAreaView>
      </View>
    </SafeAreaProvider>
  );
}

const estilos = StyleSheet.create({
  raiz: { flex: 1, backgroundColor: colores.fondo },
  fila: { flexDirection: 'row' },
  // Teléfono: columna centrada de ancho limitado.
  pantalla: { flex: 1, width: '100%', maxWidth: medidas.anchoMaximo, alignSelf: 'center' },
  // Pantalla ancha: el contenido ocupa todo lo que deja la barra lateral, con un máximo cómodo.
  principal: { flex: 1 },
  columnaAncha: { flex: 1, width: '100%', maxWidth: medidas.anchoContenido, alignSelf: 'center', paddingTop: espacio.xl },
  centro: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colores.fondo },
  encabezado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacio.md,
    paddingHorizontal: espacio.xl,
    paddingTop: espacio.md,
    paddingBottom: espacio.sm,
  },
  contenido: { flex: 1 },
  oculto: { display: 'none' },
});
