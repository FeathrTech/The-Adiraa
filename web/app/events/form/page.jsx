// src/app/events/form/page.jsx
import { Suspense } from "react";
import EventFormScreen from "../../../src/components/events/EventFormScreen";

export default function EventFormPage() {
  return (
    <Suspense fallback={null}>
      <EventFormScreen />
    </Suspense>
  );
}