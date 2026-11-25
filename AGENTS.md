# AGENTS.md — Guardería SaaS / guarderia-ui

## 1. Propósito y etapa actual
Guardería SaaS es una plataforma B2B para la administración y operación de guarderías, inicialmente en México. Busca mejorar la seguridad de los menores, agilizar el trabajo del personal y facilitar la comunicación con las familias.

La prioridad actual es terminar y validar el frontend y la UX/UI antes de implementar el backend definitivo. Ante la ausencia de un diseño completo en Figma, el repositorio funciona como prototipo interactivo y laboratorio de diseño. Codex colabora en diseño e implementación frontend; el desarrollador responsable se enfocará posteriormente en backend, arquitectura, seguridad e integración biométrica.

No confundas una pantalla funcional con una funcionalidad lista para producción. Los datos simulados son deliberados. No implementes backend, bases de datos, autenticación real, hardware, servicios cloud ni integraciones externas sin una petición explícita. No ejecutes un rediseño global solo por leer este archivo.

## 2. Principios del producto
- El sistema se adapta al usuario, no al revés.
- Seguridad infantil, privacidad, claridad, rapidez y accesibilidad por encima de efectos visuales.
- Experiencias coherentes pero adaptadas a escritorio, web, tablet y móvil; no reducir simplemente una pantalla de escritorio.
- Reducir carga cognitiva, pasos, errores y trabajo repetitivo del personal.
- Operaciones críticas tolerantes a desconexiones en la arquitectura futura.
- Evitar sobreingeniería y dependencias innecesarias; medir rendimiento antes de afirmar mejoras.

## 3. Dirección creativa y UX/UI
Construir una identidad propia, moderna, cálida, tranquila, profesional y confiable. Evitar tanto una apariencia infantil como un dashboard SaaS genérico. Buscar diferenciación mediante composición, jerarquía, tipografía, ritmo, navegación, microinteracciones y flujos excelentes, no mediante decoración excesiva.

La paleta actual NO está aprobada como identidad final. Los colores existentes son experimentales. El verde no es deseable como color principal de marca, aunque puede utilizarse semánticamente para éxito. Explorar alternativas cuando se solicite, sin asumir que azul, lavanda o marfil son obligatorios. Mantener contraste y significado semántico. No copiar literalmente otras marcas ni imponer una estética de moda sin justificarla.

- Priorizar claridad y densidad adecuada al contexto; no convertir cada sección en una tarjeta ni usar badges, sombras, gradientes o bordes indiscriminadamente.
- Usar tipografía legible, espaciado consistente, alineación precisa, iconos coherentes y estados interactivos claros.
- Animaciones discretas, rápidas y funcionales; respetar prefers-reduced-motion.
- Diseñar estados vacío, carga, error, éxito, sin resultados, desconexión, permisos insuficientes y acciones deshabilitadas cuando correspondan.
- Objetivo WCAG 2.2 AA: contraste, teclado, foco visible, etiquetas accesibles, semántica, lectores de pantalla y objetivos táctiles adecuados. No depender únicamente del color.
- Probar resoluciones representativas de móvil (390 px), tablet (768/1024 px) y escritorio (1280/1440 px), además de tamaños intermedios, zoom y contenido largo. No ocultar funciones esenciales en pantallas pequeñas.
- Diferenciar visualmente acciones primarias, secundarias y destructivas. Confirmar acciones irreversibles; ofrecer recuperación cuando sea viable.
- Utilizar español natural de México, instrucciones breves y mensajes que expliquen qué ocurrió y cómo continuar.
- Mantener la consistencia global, pero permitir patrones específicos para recepción, expedientes y formularios si mejoran la tarea.

## 4. Usuarios y flujos
Personal de recepción: entradas, salidas, reingresos y validación de adultos, frecuentemente bajo presión. Personal de cuidados: información relevante de salud, incidentes y notas. Administración: expedientes, tutores, asistencia, pagos, configuración y reportes. Familias: consulta de asistencia, autorizados, cuidados y avisos mediante aplicaciones futuras. No asumir que todos los roles tienen acceso a todos los datos.

### Recepción (flujo crítico)
El flujo actual selecciona menores primero, determina movimientos compatibles, identifica al adulto dentro del conjunto de autorizados, revisa autorización y confirma el registro. Preservar la selección múltiple para hermanos, filtros, reingresos, ausencias avisadas, vigencia del servicio y manejo de errores. Identidad y autorización son conceptos diferentes. Un adulto debe estar autorizado para cada menor y acción. Nunca simular éxito en modo real ante una respuesta ambigua. La seguridad prevalece sobre reducir clics.

Preservar el contrato ReceptionGateway y la separación explícita entre simulación y modo real. Mantener expiración de autorizaciones, validación del conjunto completo, idempotencia en reintentos y confirmación del recibo. En producción, estas garantías deben ser verificadas por servicios confiables, no únicamente por React. La simulación no prueba seguridad real. No eliminar reglas existentes para simplificar la UI.

### Gestión de niños
Listado con búsqueda, filtros, paginación y acceso rápido al expediente. Alta por etapas: información básica, adultos responsables, salud y confirmación. Perfil con información, asistencia, pagos, incidentes y notas; autorizados y cuidados especiales visibles según contexto. Priorizar información accionable, minimizar campos obligatorios y justificar datos sensibles. Mantener información consistente entre pantallas cuando se amplíe el prototipo.

### Alcance futuro
Dashboard operativo, personal, aulas, roles, dispositivos, reportes, configuración, notificaciones, alimentación, medicamentos y aplicaciones para familias. No implementar módulos futuros sin solicitud. IA avanzada es una visión posterior, no requisito de esta etapa.

## 5. Contexto técnico
Repositorio: g17dev/guarderia-ui. Stack observado: React, TypeScript, Vite, Tailwind CSS, shadcn/Radix, React Router, CSS propio y Lucide. Verificar package.json y archivos actuales antes de asumir versiones o estructura.

Estructura observada: src/pages, src/features/children, src/features/child-handover, src/components, src/context, src/data, src/styles, src/types y src/utils. Rutas: /dashboard, /children, /children/new, /children/:slug, /access; /handover redirige a /access. Dashboard en construcción al momento de la revisión. Listado, alta, perfil y recepción utilizan datos de prueba o estado local. Revisar el código actual para confirmar cambios posteriores.

Tokens: src/styles/appearance.css para apariencia general; src/styles/theme.css para semántica y componentes; src/index.css para integración global. Preservar una fuente de verdad para tokens y evitar valores repetidos sin motivo. No forzar migración total a Tailwind o shadcn ni agregar librerías sin necesidad. Preferir componentes existentes y Lucide cuando resulte apropiado. Separar lógica de dominio de presentación cuando aporte claridad. Mantener contratos tipados y adaptadores para datos simulados y futuros servicios. No crear abstracciones especulativas.

Arquitectura futura en evaluación: backend Go, PostgreSQL multi-tenant (estrategia de aislamiento pendiente), escritorio Tauri u otra alternativa, iOS/Android posiblemente nativos, agente biométrico Rust con lector DigitalPersona U.are.U 4500 y SQLite cifrado local. Las plantillas e imágenes biométricas deben permanecer localmente; el backend recibe eventos mínimos autorizados. No asumir que esta arquitectura está implementada ni decidirla unilateralmente. No almacenar datos reales de menores, tutores, salud o biometría en fixtures, logs, repositorio o localStorage. Usar datos ficticios.

## 6. Forma de trabajar con Codex
1. Leer estas instrucciones y el código relevante antes de modificarlo; comprobar git status y preservar cambios ajenos.
2. Entender el objetivo concreto de la petición y el usuario afectado. Si hay una ambigüedad material sobre alcance, flujo o dirección visual, preguntar antes de una decisión difícil de revertir.
3. Cuando se solicite explorar diseño, proponer alternativas concretas con ventajas y compromisos; no aplicar todas ni rediseñar pantallas ajenas sin autorización. Si se solicita implementación clara, proceder sin preguntas innecesarias.
4. Implementar cambios acotados y completos, coherentes con el resto del producto. Mantener los flujos existentes salvo petición explícita. No usar placeholders para fingir que una interacción funciona.
5. Revisar visualmente en navegador cuando haya herramientas disponibles, incluyendo estados y tamaños de pantalla; usar capturas para comparar cuando sea posible. Si no se puede, declarar la limitación. No afirmar que la UX es perfecta ni que se ha validado con usuarios reales sin evidencia.
6. Ejecutar los comandos disponibles de build, lint y pruebas pertinentes; inspeccionar scripts antes de ejecutarlos. Agregar pruebas para reglas críticas cuando proceda. No ocultar fallos ni desactivar validaciones para pasar comprobaciones.
7. Informar brevemente qué cambió, por qué mejora la experiencia, archivos relevantes, comprobaciones realizadas y pendientes. Diferenciar hechos, hipótesis y decisiones por aprobar.

No hacer commits, push, despliegues, cambios destructivos ni modificaciones de configuración externa sin solicitud. No revertir cambios del desarrollador. No cambiar stack, identidad global o contratos críticos sin autorización. Actualizar este archivo únicamente cuando se acuerde un cambio duradero de contexto.

## 7. Criterios de aceptación
Una mejora frontend está lista para revisión cuando cumple el objetivo solicitado, mantiene coherencia visual, funciona en los tamaños pertinentes, contempla estados y accesibilidad, no rompe reglas existentes, utiliza datos ficticios y deja una ruta clara para integrar servicios reales. Validar compilación y lint cuando sea posible. La aprobación final de la identidad visual y UX corresponde al desarrollador, idealmente con pruebas de usuarios representativos.

Prioridad inmediata: calidad del frontend y UX/UI. Esperar la siguiente petición concreta antes de iniciar modificaciones.
