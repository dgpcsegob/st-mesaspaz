// src/components/Map.js

import React, { useState, useRef, useEffect } from "react";
import maplibregl from "maplibre-gl";
import { interpolateObject } from "d3-interpolate";
import { chapters } from "../config/chapters";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import "./Map.css";

// Capítulos con location y sin imageUrl (capítulos de mapa), en orden
const mapChapterList = Object.values(chapters).filter(
  (ch) => ch.location && !ch.imageUrl
);

// --- Inicialización del protocolo PMTiles ---
const pmtilesProtocol = new Protocol();
if (!maplibregl.hasPmtilesProtocol) {
  maplibregl.addProtocol("pmtiles", pmtilesProtocol.tile);
  maplibregl.hasPmtilesProtocol = true;
}

const Map = ({ location, activeChapterId, styleUrl }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const animationTimers = useRef({});
  const [map, setMap] = useState(null);

  // --- EFECTO 1: Crear/destuir mapa al cambiar estilo ---
  useEffect(() => {
    if (!mapContainerRef.current) return;

  const mapInstance = new maplibregl.Map({
    container: mapContainerRef.current,
    style: styleUrl,
    center: location.center,
    zoom: location.zoom,
    pitch: location.pitch,
    bearing: location.bearing,
    interactive: false,
    attributionControl: false,
  });

  // ✅ Añadimos manualmente el control con nuestra atribución
  mapInstance.addControl(
    new maplibregl.AttributionControl({
      compact: true,
      customAttribution: `<a href="https://www.gob.mx/segob" target="_blank" rel="noopener noreferrer">Secretaría de Gobernación</a>`,
    }),
    'bottom-right'
  );

    // Proyección globe: solo se puede aplicar después de que el estilo cargó
    mapInstance.on("style.load", () => {
      mapInstance.setProjection({ type: 'globe' });
    });

    mapInstance.on("load", () => {
      mapRef.current = mapInstance;
      setMap(mapInstance);
      mapInstance.jumpTo(location);
    });

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        setMap(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [styleUrl]);

  // --- EFECTO 2: Manejo de capas ---
  useEffect(() => {
    if (!map) return;

    // Limpieza de capas
    Object.values(chapters).forEach((chapter) => {
      const cleanupLayer = (layerConfig) => {
        const sourceId = `source-${layerConfig.id}`;
        if (map.getSource(sourceId)) {
          if (map.getLayer(`${sourceId}-fill`)) map.removeLayer(`${sourceId}-fill`);
          if (map.getLayer(`${sourceId}-line`)) map.removeLayer(`${sourceId}-line`);
          if (map.getLayer(`${sourceId}-circle`)) map.removeLayer(`${sourceId}-circle`);
          map.removeSource(sourceId);
        }
        
        const startPointSourceId = `${sourceId}-start-point`;
        const endPointSourceId = `${sourceId}-end-point`;
        if (map.getLayer(`${startPointSourceId}-layer`)) map.removeLayer(`${startPointSourceId}-layer`);
        if (map.getSource(startPointSourceId)) map.removeSource(startPointSourceId);
        if (map.getLayer(`${endPointSourceId}-layer`)) map.removeLayer(`${endPointSourceId}-layer`);
        if (map.getSource(endPointSourceId)) map.removeSource(endPointSourceId);
      };

      if (Array.isArray(chapter.layers)) {
        chapter.layers.forEach(cleanupLayer);
      } else if (chapter.pmtileUrl) {
        cleanupLayer(chapter);
      }
    });

    // Limpiar animaciones anteriores
    Object.values(animationTimers.current).forEach(timer => clearTimeout(timer));
    animationTimers.current = {};

    const chapterData = chapters[activeChapterId];

    // Solo agregar capas si tiene datos
    if (!chapterData?.pmtileUrl && !Array.isArray(chapterData?.layers)) {
      return;
    }

    const addLayerToMap = (layerConfig) => {
      const sourceId = `source-${layerConfig.id}`;
      const firstSymbolId = map.getStyle().layers.find((l) => l.type === "symbol")?.id;

      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, { type: "vector", url: layerConfig.pmtileUrl });
      }

      if (layerConfig.layerType === "polygon") {
        map.addLayer({ 
          id: `${sourceId}-fill`, 
          type: "fill", 
          source: sourceId, 
          "source-layer": layerConfig.sourceLayer, 
          paint: { "fill-color": "#1e5b4f", "fill-opacity": 0.4 } 
        }, firstSymbolId);
        map.addLayer({ 
          id: `${sourceId}-line`, 
          type: "line", 
          source: sourceId, 
          "source-layer": layerConfig.sourceLayer, 
          paint: { "line-color": "#ffffff", "line-width": 3 } 
        }, firstSymbolId);
       
      } else if (layerConfig.layerType === "line") {
        map.addLayer({ 
          id: `${sourceId}-line`, 
          type: "line", 
          source: sourceId, 
          "source-layer": layerConfig.sourceLayer, 
          paint: { "line-color": "#fd7600ff", "line-width": 7 } 
        }, firstSymbolId );
        
        if (layerConfig.startCoords && layerConfig.endCoords) {
          const startCoords = layerConfig.startCoords;
          const endCoords = layerConfig.endCoords;

          const startPointSourceId = `${sourceId}-start-point`;
          const endPointSourceId = `${sourceId}-end-point`;

          if (!map.getSource(startPointSourceId)) {
            map.addSource(startPointSourceId, { 
              type: 'geojson', 
              data: { type: 'Point', coordinates: startCoords } 
            });
          }
          if (!map.getSource(endPointSourceId)) {
            map.addSource(endPointSourceId, { 
              type: 'geojson', 
              data: { type: 'Point', coordinates: endCoords } 
            });
          }

          const startLayerId = `${startPointSourceId}-layer`;
          const endLayerId = `${endPointSourceId}-layer`;

          map.addLayer({ 
            id: startLayerId, 
            type: 'circle', 
            source: startPointSourceId, 
            paint: { 'circle-radius': 8, 'circle-color': '#fd7600ff' } 
          });
          map.addLayer({ 
            id: endLayerId, 
            type: 'circle', 
            source: endPointSourceId, 
            paint: { 'circle-radius': 8, 'circle-color': '#fd7600ff' } 
          });
          
          // Animación de pulso segura
          let pulseUp = true;
          const animate = () => {
            if (!map || !map.getStyle() || !map.getLayer(startLayerId)) return;
            const radius = pulseUp ? 17 : 10;
            map.setPaintProperty(startLayerId, 'circle-radius', radius);
            map.setPaintProperty(endLayerId, 'circle-radius', radius);
            pulseUp = !pulseUp;
            animationTimers.current[sourceId] = setTimeout(animate, 300);
          };
          animate();
        }
      }
    };

    if (Array.isArray(chapterData.layers)) {
      chapterData.layers.forEach(addLayerToMap);
    } else if (chapterData.pmtileUrl) {
      addLayerToMap(chapterData);
    }

  }, [map, activeChapterId]);

  // --- EFECTO 3: Cámara controlada por scroll (interpolación continua) ---
  useEffect(() => {
    if (!map) return;

    let rafId = null;
    let lastLng = null;
    let lastLat = null;
    let lastZoom = null;

    const applyCamera = (loc) => {
      const currentMap = mapRef.current;
      if (!currentMap || !currentMap.isStyleLoaded()) return;

      const lng = Array.isArray(loc.center) ? loc.center[0] : loc.center;
      const lat = Array.isArray(loc.center) ? loc.center[1] : loc.center;
      const zoom = loc.zoom;

      // No llamar jumpTo si la posición no cambió significativamente
      if (
        lastZoom !== null &&
        Math.abs(lastZoom - zoom) < 0.01 &&
        Math.abs(lastLng - lng) < 0.001 &&
        Math.abs(lastLat - lat) < 0.001
      ) {
        return;
      }

      lastLng = lng;
      lastLat = lat;
      lastZoom = zoom;

      currentMap.jumpTo({
        center: [lng, lat],
        zoom: zoom,
        pitch: loc.pitch || 0,
        bearing: loc.bearing || 0,
      });
    };

    const handleScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        if (!mapRef.current || !mapRef.current.isStyleLoaded()) return;

        const viewportCenter = window.innerHeight / 2;

        const sections = mapChapterList
          .map((ch) => {
            const el = document.querySelector(
              `[data-chapter-id="${ch.id}"]`
            );
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return {
              id: ch.id,
              center: rect.top + rect.height / 2,
              location: ch.location,
            };
          })
          .filter(Boolean);

        if (sections.length === 0) return;

        // Antes de la primera sección
        if (viewportCenter <= sections[0].center) {
          applyCamera(sections[0].location);
          return;
        }

        // Después de la última sección
        if (viewportCenter >= sections[sections.length - 1].center) {
          applyCamera(sections[sections.length - 1].location);
          return;
        }

        // Interpolar entre las dos secciones que rodean el viewport center
        for (let i = 0; i < sections.length - 1; i++) {
          const cur = sections[i];
          const nxt = sections[i + 1];

          if (viewportCenter >= cur.center && viewportCenter <= nxt.center) {
            const progress =
              (viewportCenter - cur.center) / (nxt.center - cur.center);
            const interpolated = interpolateObject(
              cur.location,
              nxt.location
            )(progress);

            applyCamera(interpolated);
            return;
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Esperar a que el mapa y el globe se estabilicen antes de activar el scroll handler
    const initTimer = setTimeout(handleScroll, 300);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
      clearTimeout(initTimer);
    };
  }, [map]);

  return <div className="map-container" ref={mapContainerRef} />;
};

export default Map;