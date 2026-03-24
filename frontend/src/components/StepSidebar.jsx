export default function StepSidebar({ activeStep = 1 }) {
  const steps = [
    { id: 1, title: "Фото участка" },
    { id: 2, title: "Круг Иттена" },
    { id: 3, title: "Локация" }
  ];

  return (
    <aside className="step-sidebar">
      {steps.map((step) => {
        const done = step.id < activeStep;
        const active = step.id === activeStep;
        return (
          <div key={step.id} className={`step-item ${active ? "active" : ""}`}>
            <div className={`step-dot ${done || active ? "filled" : ""}`}>{done ? "✓" : step.id}</div>
            <div>
              <div className="step-label">ШАГ {step.id}</div>
              <div className="step-title">{step.title}</div>
            </div>
          </div>
        );
      })}
    </aside>
  );
}
