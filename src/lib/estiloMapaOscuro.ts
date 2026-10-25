// Estilo oscuro y apagado para Google Maps en Android (en iOS se usa userInterfaceStyle="dark").
export const ESTILO_MAPA_OSCURO = [
  { elementType: 'geometry', stylers: [{ color: '#151D26' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7C8D9F' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0E141B' }] },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#263340' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#18242B' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#1F2A36' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#151D26' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2A3847' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B1118' }] },
];
