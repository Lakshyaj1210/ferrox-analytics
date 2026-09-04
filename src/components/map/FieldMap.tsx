import { useMemo } from "react";
import { MapContainer, TileLayer, Polygon, CircleMarker, Popup, Rectangle, useMap } from "react-leaflet";
import type { LatLngBoundsExpression, LatLngExpression } from "leaflet";
import type { FieldSurveySession, TelemetryPayload } from "../../types";
import { centroid, idwInterpolate } from "../../lib/geo";
import { fertilityStatus, rankCrops } from "../../lib/agronomy";
import { useLanguage } from "../../context/LanguageContext";
import { cropName } from "../../lib/i18n";

type HeatmapMetric = "moisture" | "nitrogen" | "phosphorus" | "potassium";

interface FieldMapProps {
  session: FieldSurveySession;
  heatmapMetric: HeatmapMetric;
  selectedSampleId: string | null;
  onSelectSample: (sample: TelemetryPayload) => void;
}

const METRIC_RANGES: Record<HeatmapMetric, [number, number]> = {
  moisture: [0, 100],
  nitrogen: [0, 70],
  phosphorus: [0, 35],
  potassium: [0, 45],
};

function valueToColor(value: number, [lo, hi]: [number, number]): string {
  const t = Math.max(0, Math.min(1, (value - lo) / (hi - lo)));
  // rust (deficient) -> ochre (moderate) -> chlorophyll (optimal)
  const stops = [
    { t: 0, c: [184, 69, 47] },
    { t: 0.5, c: [217, 139, 43] },
    { t: 1, c: [139, 175, 63] },
  ];
  let a = stops[0];
  let b = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (t >= stops[i].t && t <= stops[i + 1].t) {
      a = stops[i];
      b = stops[i + 1];
      break;
    }
  }
  const localT = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t);
  const rgb = a.c.map((v, i) => Math.round(v + (b.c[i] - v) * localT));
  return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
}

function statusColor(status: "optimal" | "moderate" | "deficient") {
  if (status === "optimal") return "#8BAF3F";
  if (status === "moderate") return "#D98B2B";
  return "#B8452F";
}

function FitToBounds({ points }: { points: { lat: number; lng: number }[] }) {
  const map = useMap();
  useMemo(() => {
    if (points.length === 0) return;
    const bounds = points.map((p) => [p.lat, p.lng]) as LatLngExpression[];
    // @ts-expect-error - leaflet accepts an array of LatLngExpression for fitBounds
    map.fitBounds(bounds, { padding: [30, 30] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(points)]);
  return null;
}

export function FieldMap({ session, heatmapMetric, selectedSampleId, onSelectSample }: FieldMapProps) {
  const { lang, t } = useLanguage();
  const center = useMemo(
    () => centroid(session.boundary.length > 0 ? session.boundary : session.samples),
    [session.boundary, session.samples]
  );

  const boundaryLatLng: LatLngExpression[] = session.boundary.map((p) => [p.lat, p.lng]);

  const heatCells = useMemo(() => {
    if (session.boundary.length < 3 || session.samples.length === 0) return [];
    const lats = session.boundary.map((p) => p.lat);
    const lngs = session.boundary.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.min(...lats) === Math.max(...lats) ? Math.min(...lats) + 0.0001 : Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const resolution = 10;
    const cells: { bounds: LatLngBoundsExpression; color: string }[] = [];
    const samplePts = session.samples.map((s) => ({ lat: s.lat, lng: s.lng, value: s[heatmapMetric] }));
    for (let i = 0; i < resolution; i++) {
      for (let j = 0; j < resolution; j++) {
        const lat0 = minLat + ((maxLat - minLat) * i) / resolution;
        const lat1 = minLat + ((maxLat - minLat) * (i + 1)) / resolution;
        const lng0 = minLng + ((maxLng - minLng) * j) / resolution;
        const lng1 = minLng + ((maxLng - minLng) * (j + 1)) / resolution;
        const midLat = (lat0 + lat1) / 2;
        const midLng = (lng0 + lng1) / 2;
        const value = idwInterpolate(midLat, midLng, samplePts, 2.2);
        cells.push({
          bounds: [
            [lat0, lng0],
            [lat1, lng1],
          ],
          color: valueToColor(value, METRIC_RANGES[heatmapMetric]),
        });
      }
    }
    return cells;
  }, [session.boundary, session.samples, heatmapMetric]);

  const fitPoints = session.boundary.length > 0 ? session.boundary : session.samples;

  return (
    <MapContainer
      center={[center.lat, center.lng]}
      zoom={17}
      scrollWheelZoom
      className="h-full w-full"
      style={{ minHeight: 420 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      {fitPoints.length > 0 && <FitToBounds points={fitPoints} />}

      {heatCells.map((cell, i) => (
        <Rectangle
          key={i}
          bounds={cell.bounds}
          pathOptions={{ color: "transparent", fillColor: cell.color, fillOpacity: 0.32, weight: 0 }}
        />
      ))}

      {boundaryLatLng.length >= 3 && (
        <Polygon
          positions={boundaryLatLng}
          pathOptions={{ color: "#4FD1C5", weight: 2, fillOpacity: 0.03 }}
        />
      )}

      {session.samples.map((sample) => {
        const top = rankCrops(sample, 1)[0];
        const status = fertilityStatus(top.score);
        const isSelected = sample.packetId === selectedSampleId;
        return (
          <CircleMarker
            key={sample.packetId}
            center={[sample.lat, sample.lng]}
            radius={isSelected ? 10 : 7}
            pathOptions={{
              color: isSelected ? "#EFE9DA" : statusColor(status),
              weight: isSelected ? 3 : 2,
              fillColor: statusColor(status),
              fillOpacity: 0.85,
            }}
            eventHandlers={{ click: () => onSelectSample(sample) }}
          >
            <Popup>
              <div className="font-mono text-xs">
                <p className="mb-1 font-display text-sm font-semibold">#{sample.sampleIndex}</p>
                <p>{t("gaugeMoisture")}: {sample.moisture}%</p>
                <p>pH: {sample.ph}</p>
                <p>N/P/K: {sample.nitrogen}/{sample.phosphorus}/{sample.potassium} kg/ac</p>
                <p className="mt-1">{t("bestFit")}: {cropName(top.crop, lang)} ({top.score}/100)</p>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
