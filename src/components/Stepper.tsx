import { useRef, useEffect, useState } from "react";
import type { Step } from "../types/stepper";
import "./Stepper.css";

interface Props {
  steps: Step[];
}

export default function Stepper({ steps }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [segments, setSegments] = useState<Array<{ 
    startX: number; 
    startY: number; 
    endX: number; 
    endY: number;
    progress: number;
  }>>([]);
  
  const totalSegments = steps.length - 1;
  const completedSegments = steps.filter(s => s.status === "completed").length;
  
  useEffect(() => {
    const calculatePositions = () => {
      if (!containerRef.current) return;
      
      const circles = containerRef.current.querySelectorAll(".circle");
      const newSegments = [];
      
      for (let i = 0; i < circles.length - 1; i++) {
        const currentCircle = circles[i] as HTMLElement;
        const nextCircle = circles[i + 1] as HTMLElement;
        
        const currentRect = currentCircle.getBoundingClientRect();
        const nextRect = nextCircle.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        
        // Calcular centro de cada círculo
        const currentCenterX = currentRect.left + currentRect.width / 2;
        const currentCenterY = currentRect.top + currentRect.height / 2;
        const nextCenterX = nextRect.left + nextRect.width / 2;
        const nextCenterY = nextRect.top + nextRect.height / 2;
        
        // Calcular radio (20px)
        const radius = 20;
        
        // Calcular ángulo de la línea
        const dx = nextCenterX - currentCenterX;
        const dy = nextCenterY - currentCenterY;
        const angle = Math.atan2(dy, dx);
        
        // Calcular puntos en los bordes de los círculos
        const startX = currentCenterX + radius * Math.cos(angle);
        const startY = currentCenterY + radius * Math.sin(angle);
        const endX = nextCenterX - radius * Math.cos(angle);
        const endY = nextCenterY - radius * Math.sin(angle);
        
        // Convertir a coordenadas relativas al contenedor
        const relativeStartX = startX - containerRect.left;
        const relativeStartY = startY - containerRect.top;
        const relativeEndX = endX - containerRect.left;
        const relativeEndY = endY - containerRect.top;
        
        const isSegmentCompleted = i < completedSegments;
        
        newSegments.push({
          startX: relativeStartX,
          startY: relativeStartY,
          endX: relativeEndX,
          endY: relativeEndY,
          progress: isSegmentCompleted ? 100 : 0
        });
      }
      
      setSegments(newSegments);
    };
    
    // Calcular inicialmente y en cada cambio
    calculatePositions();
    
    // Usar ResizeObserver para detectar cambios de tamaño
    const resizeObserver = new ResizeObserver(() => calculatePositions());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    window.addEventListener("resize", calculatePositions);
    
    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", calculatePositions);
    };
  }, [steps, completedSegments]);
  
  return (
    <div className="stepper" ref={containerRef}>
      <svg className="stepper-svg">
        {segments.map((segment, index) => {
          // Calcular la longitud de la línea para la animación
          const length = Math.sqrt(
            Math.pow(segment.endX - segment.startX, 2) + 
            Math.pow(segment.endY - segment.startY, 2)
          );
          
          return (
            <g key={index}>
              {/* Línea base */}
              <line
                x1={segment.startX}
                y1={segment.startY}
                x2={segment.endX}
                y2={segment.endY}
                className="line-base"
              />
              {/* Línea de progreso animada */}
              <line
                x1={segment.startX}
                y1={segment.startY}
                x2={segment.endX}
                y2={segment.endY}
                className="line-progress"
                style={{
                  strokeDasharray: length,
                  strokeDashoffset: length - (segment.progress / 100) * length,
                }}
              />
            </g>
          );
        })}
      </svg>
      
      {steps.map((step, index) => (
        <div className={`step ${step.status}`} key={index}>
          <div className={`circle ${step.status}`}>
            {step.status === "completed" ? "✓" : index + 1}
          </div>
          <div className="content">
            <h3>{step.title}</h3>
            <span className={`badge ${step.status}`}>
              {step.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}