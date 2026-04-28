"use client";

/*
Este archivo coordina el estado compartido entre el gráfico y el breakdown de features.
Mantiene qué día está seleccionado, qué feature está activa y qué dimensión se analiza,
para sincronizar ambos componentes sin prop-drilling entre ellos.

Funciones exportadas:
- FeaturesView: coordinador de estado que monta FeatureChart y FeatureBreakdown.
*/

import { useState } from "react";
import FeatureChart from "./FeatureChart";
import FeatureBreakdown from "./FeatureBreakdown";
import type { FeatureId, FeatureDimension } from "@/app/lib/features.config";

export default function FeaturesView() {
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [activeFeatureId, setActiveFeatureId] = useState<FeatureId>("split_expenses");
  const [activeDimension, setActiveDimension] = useState<FeatureDimension>("users");

  return (
    <div className="space-y-6">
      <FeatureChart
        selectedDay={selectedDay}
        onDayClick={(day) => setSelectedDay(day)}
        onFeatureChange={setActiveFeatureId}
        onDimensionChange={setActiveDimension}
      />
      {selectedDay && (
        <FeatureBreakdown
          featureId={activeFeatureId}
          dimension={activeDimension}
          selectedDay={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}
