"use client";

import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

type Partner = {
  id: string;
  name: string;
  type: string;
  location: string;
  capacity: number;
  lat: number;
  lng: number;
  verified: boolean;
};

const partnerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

export default function RecoveryMap({
  partners,
}: {
  partners: Partner[];
}) {
  const center: [number, number] = [-2.9761, 104.7754];

  return (
    <div className="h-full min-h-[320px] w-full overflow-hidden rounded-[22px]">
      <MapContainer
        center={center}
        zoom={12}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {partners.map((partner) => (
          <Marker
            key={partner.id}
            position={[partner.lat, partner.lng]}
            icon={partnerIcon}
          >
            <Popup>
              <div className="min-w-[210px]">
                <h3 className="mb-1 text-base font-bold text-[#315b2a]">
                  {partner.name}
                </h3>

                <p className="mb-2 text-sm text-gray-600">
                  {partner.location}
                </p>

                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Recovery:</strong> {partner.type}
                  </p>

                  <p>
                    <strong>Kapasitas:</strong>{" "}
                    {partner.capacity.toLocaleString("id-ID")} kg/minggu
                  </p>

                  <p>
                    <strong>Status:</strong>{" "}
                    {partner.verified ? "Terverifikasi" : "Menunggu verifikasi"}
                  </p>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}