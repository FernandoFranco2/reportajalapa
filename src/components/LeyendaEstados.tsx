// Leyenda de los tres estados con su punto de color.
import { StyleSheet, View } from 'react-native';
import { COLOR_ESTADO, ESTADOS } from '../types';
import { colores, espacio } from '../theme';
import { etiquetaEstado } from '../lib/texto';
import { Txt } from './ui';

export default function LeyendaEstados() {
  return (
    <View style={estilos.fila}>
      {ESTADOS.map((estado) => (
        <View key={estado} style={estilos.item}>
          <View style={[estilos.punto, { backgroundColor: COLOR_ESTADO[estado] }]} />
          <Txt variante="pequeno" color={colores.textoSecundario}>
            {etiquetaEstado(estado)}
          </Txt>
        </View>
      ))}
    </View>
  );
}

const estilos = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: espacio.lg },
  item: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  punto: { width: 8, height: 8, borderRadius: 4 },
});
