// Cuestionario de 48 Preguntas Situacionales del Método Bénturi
// 4 preguntas por cada uno de los 12 peldaños (distribuidos en 3 Grandes Factores)

export const FACTORES_PIRAMIDE = {
  1: {
    id: 1,
    nombre: "FACTOR 1: NIVELES DE VÍCTIMA Y VULNERABILIDAD",
    subtitulo: "Fases iniciales: Supervivencia, Culpa y Resistencia",
    color: "#f87171",
    accent: "rgba(248, 113, 113, 0.2)",
    niveles: [1, 2, 3, 4]
  },
  2: {
    id: 2,
    nombre: "FACTOR 2: NIVELES DE CONTROL, EGO Y LOGRO MATERIAL",
    subtitulo: "Fases intermedias: Dominio, Estatus, Competencia y Despertar",
    color: "#fbbf24",
    accent: "rgba(251, 191, 36, 0.2)",
    niveles: [5, 6, 7, 8]
  },
  3: {
    id: 3,
    nombre: "FACTOR 3: NIVELES DE ACEPTACIÓN, INTEGRACIÓN Y PROPÓSITO",
    subtitulo: "Fases superiores: Coherencia, Servicio, Generosidad y Trascendencia",
    color: "#38bdf8",
    accent: "rgba(56, 189, 248, 0.2)",
    niveles: [9, 10, 11, 12]
  }
}

export const NIVELES_12 = {
  1: { id: 1, factorId: 1, nombre: "Víctima Absoluta", subtitulo: "Culpa Externa y Resentimiento", zona: "DE LO MATERIAL" },
  2: { id: 2, factorId: 1, nombre: "Impotencia y Parálisis", subtitulo: "Bloqueo y Miedo al Cambio", zona: "DE LO MATERIAL" },
  3: { id: 3, factorId: 1, nombre: "Reactividad y Conflicto", subtitulo: "Defensa y Enfrentamiento", zona: "DE LO MATERIAL" },
  4: { id: 4, factorId: 1, nombre: "Resignación Pasiva", subtitulo: "Conformismo y Desgana", zona: "DE LO MATERIAL" },

  5: { id: 5, factorId: 2, nombre: "Validación y Estatus", subtitulo: "Ego Social y Aprobación", zona: "DE LO MENTAL" },
  6: { id: 6, factorId: 2, nombre: "Control Rígido y Exigencia", subtitulo: "Perfeccionismo y Tensión", zona: "DE LO MENTAL" },
  7: { id: 7, factorId: 2, nombre: "Ambición Estratégica", subtitulo: "Pragmatismo y Competitividad", zona: "DE LO MENTAL" },
  8: { id: 8, factorId: 2, nombre: "Crisis de Identidad", subtitulo: "Cuestionamiento del Ego", zona: "DE LO MENTAL" },

  9: { id: 9, factorId: 3, nombre: "Aceptación y Perdón", subtitulo: "Paz con el Pasado", zona: "DE LO ESPIRITUAL" },
  10: { id: 10, factorId: 3, nombre: "Responsabilidad Absoluta", subtitulo: "Autoría y Coherencia", zona: "DE LO ESPIRITUAL" },
  11: { id: 11, factorId: 3, nombre: "Servicio y Transmisión", subtitulo: "Generosidad y Legado", zona: "DE LO ESPIRITUAL" },
  12: { id: 12, factorId: 3, nombre: "Trascendencia y Libertad", subtitulo: "Paz Absoluta e Integración", zona: "DE LO ESPIRITUAL" }
}

export const PREGUNTAS_SITUACIONALES_48 = [
  // ==================== FACTOR 1: NIVELES DE VÍCTIMA Y VULNERABILIDAD ====================
  // Nivel 1: Víctima Absoluta (Culpa Externa y Resentimiento)
  {
    id: 1,
    level: 1,
    factor: 1,
    area: "Amor",
    pregunta: "Al afrontar una ruptura sentimental dolorosa o la disolución de una pareja clave, ¿cuál describe mejor tu vivencia?",
    opciones: [
      { key: "A", score: 1, texto: "Se vivió sintiendo que la otra persona arruinó la vida y con una sensación de injusticia irreparable." },
      { key: "B", score: 2, texto: "Se asumió con rabia y constante reproche por todo lo que se entregó a cambio de nada." },
      { key: "C", score: 3, texto: "Se entendió con el tiempo como un ciclo agotado del que ambas partes tenían responsabilidad." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he atravesado una ruptura o separación sentimental de relevancia." }
    ]
  },
  {
    id: 2,
    level: 1,
    factor: 1,
    area: "Trabajo",
    pregunta: "Al sufrir la pérdida de un empleo, despido o cierre forzado de un proyecto, ¿cómo se experimentó?",
    opciones: [
      { key: "A", score: 1, texto: "Como una traición o injusticia del sistema y de jefes/socios mala gente." },
      { key: "B", score: 2, texto: "Con amargura y la convicción de que los esfuerzos nunca son valorados justamente." },
      { key: "C", score: 3, texto: "Con tristeza inicial, pero enfocando rápidamente la energía en buscar alternativas." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he vivido un despido o el cierre de un proyecto profesional." }
    ]
  },
  {
    id: 3,
    level: 1,
    factor: 1,
    area: "Dinero",
    pregunta: "Ante un fraude económico, cobro abusivo o estafa por parte de un tercero, ¿qué postura quedó marcada?",
    opciones: [
      { key: "A", score: 1, texto: "Un resentimiento permanente hacia la sociedad y la sensación de que siempre pagan los mismos." },
      { key: "B", score: 2, texto: "La desconfianza total hacia cualquier futura propuesta de negocios o inversión." },
      { key: "C", score: 3, texto: "El aprendizaje de verificar mejor los contratos y poner filtros de seguridad." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he sufrido una pérdida económica por fraude, engaño o abuso." }
    ]
  },
  {
    id: 4,
    level: 1,
    factor: 1,
    area: "Salud",
    pregunta: "Al enfermar de gravedad o pasar por un diagnóstico médico imprevisto, ¿cómo se afrontó la situación?",
    opciones: [
      { key: "A", score: 1, texto: "Con desesperación y la continua pregunta de «¿por qué me tiene que pasar esto a mí?»." },
      { key: "B", score: 2, texto: "Con enfado hacia el cuerpo o los médicos por no dar soluciones inmediatas." },
      { key: "C", score: 3, texto: "Siguiendo el tratamiento con disciplina y buscando la causa profunda del desgaste." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he atravesado una enfermedad grave o intervención quirúrgica de calado." }
    ]
  },

  // Nivel 2: Impotencia y Parálisis (Bloqueo y Miedo al Cambio)
  {
    id: 5,
    level: 2,
    factor: 1,
    area: "Dinero",
    pregunta: "Al tener que tomar la decisión de comprar una vivienda o realizar una mudanza importante, ¿qué emoción predominó?",
    opciones: [
      { key: "A", score: 1, texto: "Una parálisis total por miedo a cometer un error irreparable o quedar arruinado." },
      { key: "B", score: 2, texto: "Una gran ansiedad generada por la presión del entorno o la familia." },
      { key: "C", score: 3, texto: "Un análisis lógico de gastos y capacidad de pago asumido con pragmatismo." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he gestionado la compra o alquiler de una vivienda principal." }
    ]
  },
  {
    id: 6,
    level: 2,
    factor: 1,
    area: "Trabajo",
    pregunta: "Frente a la oportunidad de asumir un puesto de mayor responsabilidad o un ascenso, ¿cuál fue la respuesta?",
    opciones: [
      { key: "A", score: 1, texto: "El rechazo o duda destructiva por no sentirse jamás a la altura del reto." },
      { key: "B", score: 2, texto: "La aceptación a regañadientes, viviendo el proceso con un estrés constante a fallar." },
      { key: "C", score: 3, texto: "El entusiasmo por medir la propia capacidad y dar un salto cualitativo." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás se ha presentado la opción de un ascenso o salto profesional relevante." }
    ]
  },
  {
    id: 7,
    level: 2,
    factor: 1,
    area: "Amor",
    pregunta: "Al estancarse en una relación afectiva que ya no aportaba nada positivo, ¿cómo se actuó?",
    opciones: [
      { key: "A", score: 1, texto: "Permanece o permaneció durante años por miedo a la soledad y a no valer para nadie más." },
      { key: "B", score: 2, texto: "Sosteniendo la relación a base de quejas continuas pero sin dar el paso definitivo de salir." },
      { key: "C", score: 3, texto: "Trazando un plan claro para cerrar la etapa con el menor daño posible." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he visto atrapado en una relación desgastada o paralizada." }
    ]
  },
  {
    id: 8,
    level: 2,
    factor: 1,
    area: "Dinero",
    pregunta: "Al atravesar un periodo de deudas, impagos o estrechez económica severa, ¿cómo fue la vivencia?",
    opciones: [
      { key: "A", score: 1, texto: "De parálisis absoluta, ocultando la cabeza y esperando que el problema desapareciera solo." },
      { key: "B", score: 2, texto: "De búsqueda de culpables externos para justificar la falta de ingresos." },
      { key: "C", score: 3, texto: "De recorte drástico de gastos y renegociación activa de los compromisos." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he atravesado un bache financiero o una situación de deudas graves." }
    ]
  },

  // Nivel 3: Reactividad y Conflicto (Defensa y Enfrentamiento)
  {
    id: 9,
    level: 3,
    factor: 1,
    area: "Dinero",
    pregunta: "Durante el reparto de una herencia o la liquidación de bienes familiares, ¿cómo se desarrolló la dinámica?",
    opciones: [
      { key: "A", score: 1, texto: "Estallaron discusiones encarnizadas, reproches del pasado y ruptura de lazos familiares." },
      { key: "B", score: 2, texto: "Se mantuvo una postura rígida para evitar ser engañado o despojado por los demás." },
      { key: "C", score: 3, texto: "Se buscó la vía legal o la mediación neutral para repartir de forma equitativa." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he participado en un proceso de herencia o reparto de patrimonio." }
    ]
  },
  {
    id: 10,
    level: 3,
    factor: 1,
    area: "Trabajo",
    pregunta: "Ante una discrepancia grave con un socio, jefe o cliente importante, ¿cuál fue el comportamiento?",
    opciones: [
      { key: "A", score: 1, texto: "El ataque directo y el enfrentamiento frontal para defender la posición a toda costa." },
      { key: "B", score: 2, texto: "La ruptura destructiva sin medir las pérdidas económicas ni profesionales." },
      { key: "C", score: 3, texto: "La negociación firme argumentada con datos y buscando puntos de acuerdo." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he vivido un conflicto profesional o comercial severo." }
    ]
  },
  {
    id: 11,
    level: 3,
    factor: 1,
    area: "Amor",
    pregunta: "Al descubrir una mentira o engaño de la pareja o un amigo cercano, ¿cómo se reaccionó?",
    opciones: [
      { key: "A", score: 1, texto: "Con un estallido de ira, corte radical de relación y exigencia de castigo/venganza." },
      { key: "B", score: 2, texto: "Pagando con la misma moneda para equilibrar la balanza del agravio." },
      { key: "C", score: 3, texto: "Exigiendo explicaciones serenas y decidiendo si la confianza se podía reconstruir." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he enfrentado a una traición o mentira grave en mi entorno cercano." }
    ]
  },
  {
    id: 12,
    level: 3,
    factor: 1,
    area: "Trabajo",
    pregunta: "Al recibir una crítica pública o un ataque a la reputación profesional, ¿qué postura se adoptó?",
    opciones: [
      { key: "A", score: 1, texto: "Una respuesta agresiva y pública para desacreditar por completo al atacante." },
      { key: "B", score: 2, texto: "Una obsesión por demostrar que la verdad absoluta estaba del propio lado." },
      { key: "C", score: 3, texto: "El análisis objetivo del fondo de la crítica, ignorando la descalificación personal." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he sufrido un ataque grave a la reputación o imagen pública." }
    ]
  },

  // Nivel 4: Resignación Pasiva (Conformismo y Desgana)
  {
    id: 13,
    level: 4,
    factor: 1,
    area: "Amor",
    pregunta: "Tras sufrir la pérdida de un familiar de primer grado o un ser muy querido, ¿qué tónica se instaló?",
    opciones: [
      { key: "A", score: 1, texto: "Una apatía profunda y la sensación de que la vida perdió su sentido para siempre." },
      { key: "B", score: 2, texto: "El aislamiento social, evitando compartir el dolor con el resto del entorno." },
      { key: "C", score: 3, texto: "Un proceso de duelo paulatino, recolocando el recuerdo con afecto y siguiendo adelante." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he atravesado el fallecimiento o duelo de un familiar muy cercano." }
    ]
  },
  {
    id: 14,
    level: 4,
    factor: 1,
    area: "Trabajo",
    pregunta: "Al no conseguir el resultado esperado tras años de esfuerzo en un proyecto o carrera, ¿qué se sintió?",
    opciones: [
      { key: "A", score: 1, texto: "La convicción de que luchar no sirve de nada porque el destino está escrito." },
      { key: "B", score: 2, texto: "La decisión de rebajar las aspiraciones al mínimo para no volver a frustrarse." },
      { key: "C", score: 3, texto: "La necesidad de cambiar la estrategia manteniendo el objetivo final." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he dedicado años a un proyecto que terminara en fracaso total." }
    ]
  },
  {
    id: 15,
    level: 4,
    factor: 1,
    area: "General",
    pregunta: "Al verse atrapado en la rutina diaria y la monotonía laboral/personal, ¿cuál fue la respuesta?",
    opciones: [
      { key: "A", score: 1, texto: "La aceptación resignada de que «la vida es esto y hay que aguantar»." },
      { key: "B", score: 2, texto: "La evasión constante mediante entretenimientos pasivos o consumismo." },
      { key: "C", score: 3, texto: "La búsqueda activa de nuevos incentivos, formaciones o aficiones." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he sentido estar atrapado en una rutina gris o sin estímulos." }
    ]
  },
  {
    id: 16,
    level: 4,
    factor: 1,
    area: "Trabajo",
    pregunta: "Al cambiar de residencia o mudarse por obligación laboral a un lugar no deseado, ¿cómo se vivió?",
    opciones: [
      { key: "A", score: 1, texto: "Con nostalgia destructiva y rechazo absoluto hacia el nuevo entorno." },
      { key: "B", score: 2, texto: "Dejándose llevar por la inercia, adaptándose solo en lo imprescindible." },
      { key: "C", score: 3, texto: "Con curiosidad por descubrir los recursos y posibilidades del nuevo sitio." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he tenido que trasladar la residencia por exigencia u obligación." }
    ]
  },

  // ==================== FACTOR 2: NIVELES DE CONTROL, EGO Y LOGRO MATERIAL ====================
  // Nivel 5: Necesidad de Validación y Estatus (Ego Social)
  {
    id: 17,
    level: 5,
    factor: 2,
    area: "Dinero",
    pregunta: "Al adquirir un coche de gama alta, un bien de lujo o realizar una gran inversión visible, ¿qué pensamiento primó?",
    opciones: [
      { key: "A", score: 1, texto: "El placer de mostrar el éxito alcanzado y ganar el respeto del entorno." },
      { key: "B", score: 2, texto: "La necesidad de demostrar que se pertenece a un nivel social o profesional superior." },
      { key: "C", score: 3, texto: "El disfrute personal del producto por su calidad, al margen de la opinión ajena." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he realizado la compra de un coche nuevo o un bien de elevado coste." }
    ]
  },
  {
    id: 18,
    level: 5,
    factor: 2,
    area: "Amor",
    pregunta: "Al organizar una boda, gran evento familiar o celebración social, ¿cuál fue la prioridad?",
    opciones: [
      { key: "A", score: 1, texto: "Que la puesta en escena fuera impecable para impresionar a los invitados." },
      { key: "B", score: 2, texto: "Mantener el control absoluto de los detalles para evitar críticas externas." },
      { key: "C", score: 3, texto: "Disfrutar de la compañía de los seres queridos de forma natural y distendida." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he organizado un evento social o celebración de cierta magnitud." }
    ]
  },
  {
    id: 19,
    level: 5,
    factor: 2,
    area: "Trabajo",
    pregunta: "Al ser reconocido con un galardón, premio o mención pública en la profesión, ¿cómo se gestionó?",
    opciones: [
      { key: "A", score: 1, texto: "Reafirmando la propia superioridad frente a competidores o compañeros." },
      { key: "B", score: 2, texto: "Con una satisfacción interior orientada a consolidar la marca personal." },
      { key: "C", score: 3, texto: "Con gratitud sincera y entendiéndolo como el fruto de un trabajo en equipo." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he recibido un reconocimiento público o premio relevante." }
    ]
  },
  {
    id: 20,
    level: 5,
    factor: 2,
    area: "General",
    pregunta: "Al elegir el centro educativo de los hijos o la zona de residencia habitual, ¿qué pesó más?",
    opciones: [
      { key: "A", score: 1, texto: "El prestigio y las relaciones de nivel que ese entorno pudiera aportar." },
      { key: "B", score: 2, texto: "La imagen de solvencia y buen gusto que proyecta hacia fuera." },
      { key: "C", score: 3, texto: "La practicidad, la calidad humana y el bienestar de la familia." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he tenido que tomar decisiones relativas a escolarización o zona residencial familiar." }
    ]
  },

  // Nivel 6: Control Rígido y Exigencia (Perfeccionismo)
  {
    id: 21,
    level: 6,
    factor: 2,
    area: "Trabajo",
    pregunta: "Al liderar un equipo de trabajo o un proyecto empresarial complejo, ¿cómo fue el estilo de gestión?",
    opciones: [
      { key: "A", score: 1, texto: "Supervisión constante de cada detalle por la creencia de que nadie lo hace tan bien como uno mismo." },
      { key: "B", score: 2, texto: "Alta exigencia y poca tolerancia al error humano, imponiendo el criterio propio." },
      { key: "C", score: 3, texto: "Delegación clara de funciones midiendo exclusivamente los resultados finales." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he estado al frente de la dirección de equipos o proyectos de envergadura." }
    ]
  },
  {
    id: 22,
    level: 6,
    factor: 2,
    area: "Dinero",
    pregunta: "Al reformar una vivienda o construir un hogar desde cero, ¿cómo se afrontaron los imprevistos?",
    opciones: [
      { key: "A", score: 1, texto: "Con rabia profunda y enorme estrés ante cualquier desviación de plazo o presupuesto." },
      { key: "B", score: 2, texto: "Exigiendo responsabilidades severas y manteniendo el conflicto directo con los gremios." },
      { key: "C", score: 3, texto: "Asumiendo los ajustes como parte inevitable del proceso constructivo." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he llevado a cabo una reforma integral o construcción de vivienda." }
    ]
  },
  {
    id: 23,
    level: 6,
    factor: 2,
    area: "Amor",
    pregunta: "Frente a la planificación de viajes o vacaciones familiares, ¿cuál fue la conducta habitual?",
    opciones: [
      { key: "A", score: 1, texto: "Diseñar un itinerario cerrado al milímetro, sufriendo si algo se salía de la agenda." },
      { key: "B", score: 2, texto: "Asumir toda la carga organizativa para garantizar que las cosas salieran perfectas." },
      { key: "C", score: 3, texto: "Establecer unas bases mínimas y dejar espacio a la improvisación del grupo." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he asumido la organización completa de viajes o itinerarios familiares." }
    ]
  },
  {
    id: 24,
    level: 6,
    factor: 2,
    area: "Salud",
    pregunta: "Al experimentar un fallo físico o bajón de rendimiento en la práctica deportiva o en la salud, ¿cómo se reaccionó?",
    opciones: [
      { key: "A", score: 1, texto: "Con frustración e imponiendo al cuerpo esfuerzos por encima de sus límites." },
      { key: "B", score: 2, texto: "Ocultando la debilidad para no mostrar vulnerabilidad ante los demás." },
      { key: "C", score: 3, texto: "Escuchando las señales de aviso del cuerpo y ajustando los ritmos de actividad." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he practicado deporte de competición ni exigencia física relevante." }
    ]
  },

  // Nivel 7: Ambición Estratégica e Pragmatismo (Competitividad)
  {
    id: 25,
    level: 7,
    factor: 2,
    area: "Dinero",
    pregunta: "Al diseñar una estrategia de expansión profesional o diversificación de patrimonio, ¿qué movió la decisión?",
    opciones: [
      { key: "A", score: 1, texto: "El cálculo frío del beneficio económico y el fortalecimiento del poder personal." },
      { key: "B", score: 2, texto: "La superación de retos complejos para demostrar solvencia estratégica." },
      { key: "C", score: 3, texto: "La búsqueda de un impacto positivo duradero para la estructura familiar o social." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he diseñado ni ejecutado planes de inversión o expansión patrimonial." }
    ]
  },
  {
    id: 26,
    level: 7,
    factor: 2,
    area: "Trabajo",
    pregunta: "Ante un vacío legal o una oportunidad de ventaja impositiva/comercial, ¿cuál fue la postura?",
    opciones: [
      { key: "A", score: 1, texto: "Aprovechar el resquicio al máximo si el beneficio compensaba el riesgo." },
      { key: "B", score: 2, texto: "Analizar la relación coste-beneficio antes de dar cualquier paso bordeando la norma." },
      { key: "C", score: 3, texto: "Desestimar la opción si no encajaba con un criterio ético y transparente." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he visto en la posición de gestionar vacíos legales o ventajas fiscales/comerciales." }
    ]
  },
  {
    id: 27,
    level: 7,
    factor: 2,
    area: "Trabajo",
    pregunta: "Al competir por un contrato importante o un cliente estratégico decisivo, ¿cómo se actuó?",
    opciones: [
      { key: "A", score: 1, texto: "Utilizando cualquier información o presión disponible para neutralizar a los rivales." },
      { key: "B", score: 2, texto: "Exaltando las fortalezas propias de forma agresiva y contundente." },
      { key: "C", score: 3, texto: "Presentando la propuesta de máximo valor con transparencia sobre las propias capacidades." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he tenido que competir por contratos comerciales o licitaciones clave." }
    ]
  },
  {
    id: 28,
    level: 7,
    factor: 2,
    area: "Dinero",
    pregunta: "Al producirse la venta de una empresa, sociedad o propiedad valiosa, ¿qué condicionó el acuerdo?",
    opciones: [
      { key: "A", score: 1, texto: "Conseguir hasta el último céntimo posible, alargando la negociación al límite." },
      { key: "B", score: 2, texto: "Cerrar un trato ventajoso que asegurase una posición de fuerza futura." },
      { key: "C", score: 3, texto: "Un acuerdo justo y equilibrado donde ambas partes quedasen satisfechas." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he participado en la venta o liquidación de sociedades o bienes de alto valor." }
    ]
  },

  // Nivel 8: Crisis de Identidad y Cuestionamiento (El Despertar del Ego)
  {
    id: 29,
    level: 8,
    factor: 2,
    area: "General",
    pregunta: "Al alcanzar los objetivos materiales/profesionales trazados y sentir un vacío interno imprevisto, ¿qué ocurrió?",
    opciones: [
      { key: "A", score: 1, texto: "Se intentó tapar la sensación fijando metas materiales aún más elevadas." },
      { key: "B", score: 2, texto: "Se produjo una crisis de desorientación al comprobar que el éxito no traía la paz esperada." },
      { key: "C", score: 3, texto: "Se inició un proceso de revisión de valores para redirigir la vida hacia lo esencial." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he alcanzado todas las metas materiales ni sentido esa crisis de vacío." }
    ]
  },
  {
    id: 30,
    level: 8,
    factor: 2,
    area: "Trabajo",
    pregunta: "Al sufrir una pérdida importante de estatus, cargo o poder acumulado, ¿cómo se procesó?",
    opciones: [
      { key: "A", score: 1, texto: "Con amargura, sintiendo que la identidad se desmoronaba sin ese reconocimiento." },
      { key: "B", score: 2, texto: "Con un intento desesperado por recuperar la posición perdida a cualquier precio." },
      { key: "C", score: 3, texto: "Comprendiendo que la valía personal no depende de un título ni de una posición." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he tenido una posición relevante de poder o estatus que haya perdido." }
    ]
  },
  {
    id: 31,
    level: 8,
    factor: 2,
    area: "Salud",
    pregunta: "Frente a una vivencia cercana a la muerte (accidente grave o colapso de salud), ¿qué cambio provocó?",
    opciones: [
      { key: "A", score: 1, texto: "Un pánico prolongado a la finitud y un intento de aferrarse más al control." },
      { key: "B", score: 2, texto: "Un choque emocional que obligó a reordenar las prioridades cotidianas." },
      { key: "C", score: 3, texto: "Una profunda liberación del miedo y un aprecio renovado por el presente." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he vivido un accidente grave o una situación médica límite." }
    ]
  },
  {
    id: 32,
    level: 8,
    factor: 2,
    area: "General",
    pregunta: "Al romper con convenciones sociales o familiares para ser fiel a uno mismo, ¿qué se experimentó?",
    opciones: [
      { key: "A", score: 1, texto: "Un enorme sentimiento de culpa por defraudar las expectativas de los demás." },
      { key: "B", score: 2, texto: "La tensión del conflicto con el entorno, asumida para mantener la independencia." },
      { key: "C", score: 3, texto: "Una sensación de coherencia interna y libertad no negociable." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he tenido que romper con tradiciones o expectativas familiares/sociales." }
    ]
  },

  // ==================== FACTOR 3: NIVELES DE ACEPTACIÓN, INTEGRACIÓN Y PROPÓSITO ====================
  // Nivel 9: Aceptación y Perdon Sincero (Paz con el Pasado)
  {
    id: 33,
    level: 9,
    factor: 3,
    area: "Amor",
    pregunta: "Al recordar hoy a las personas que causaron un daño o traición severa en el pasado, ¿qué emoción surge?",
    opciones: [
      { key: "A", score: 1, texto: "Aún persiste un rescoldo de amargura o el deseo de que la vida les pague con la misma moneda." },
      { key: "B", score: 2, texto: "Indiferencia neutra, prefiriendo no recordar esos episodios para no gastar energía." },
      { key: "C", score: 3, texto: "Paz absoluta y comprensión de que cada uno actuó desde su nivel de conciencia de entonces." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he sufrido un daño o traición de suficiente gravedad en mi vida." }
    ]
  },
  {
    id: 34,
    level: 9,
    factor: 3,
    area: "Dinero",
    pregunta: "Al analizar los errores o quiebras económicas cometidos en años anteriores, ¿cómo se observan?",
    opciones: [
      { key: "A", score: 1, texto: "Con remordimiento constante por no haber tomado decisiones más inteligentes." },
      { key: "B", score: 2, texto: "Como un precio caro asignado a la falta de experiencia del momento." },
      { key: "C", score: 3, texto: "Como el máster más valioso de aprendizaje que permitió construir la madurez actual." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he cometido un error financiero o de inversión de consecuencias graves." }
    ]
  },
  {
    id: 35,
    level: 9,
    factor: 3,
    area: "Amor",
    pregunta: "Al reencontrarse con una expareja tras años de conflicto o divorcio, ¿qué clima se mantiene?",
    opciones: [
      { key: "A", score: 1, texto: "Tensión contenida o frialdad marcada por las heridas no cerradas." },
      { key: "B", score: 2, texto: "Un trato estrictamente cordial y distante enfocado en aspectos prácticos." },
      { key: "C", score: 3, texto: "Un afecto sincero, deseándole el máximo bienestar en su camino actual." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he vuelto a ver a una expareja con la que tuviera un conflicto previo." }
    ]
  },
  {
    id: 36,
    level: 9,
    factor: 3,
    area: "Salud",
    pregunta: "Al valorar el envejecimiento físico y el paso del tiempo sobre el cuerpo, ¿cuál es la actitud?",
    opciones: [
      { key: "A", score: 1, texto: "Resistencia activa y preocupación constante por el deterioro de la imagen." },
      { key: "B", score: 2, texto: "Aceptación resignada del declive como algo inevitable pero incómodo." },
      { key: "C", score: 3, texto: "Gratitud por la salud disponible, cuidando el cuerpo sin obsesión por la estética." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he preocupado por el paso del tiempo o los cambios físicos de la edad." }
    ]
  },

  // Nivel 10: Responsabilidad Absoluta y Coherencia (Autoría)
  {
    id: 37,
    level: 10,
    factor: 3,
    area: "Trabajo",
    pregunta: "Al encarar un imprevisto grave en un proyecto profesional o personal, ¿dónde se sitúa el foco?",
    opciones: [
      { key: "A", score: 1, texto: "En evaluar qué parte de la responsabilidad propia generó la situación para corregirla." },
      { key: "B", score: 2, texto: "En buscar soluciones inmediatas sin perder tiempo en analizar las causas pasadas." },
      { key: "C", score: 3, texto: "En asumir las pérdidas con entereza, protegiendo al equipo o entorno dependiente." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he tenido que asumir la responsabilidad de un fallo o crisis grave." }
    ]
  },
  {
    id: 38,
    level: 10,
    factor: 3,
    area: "General",
    pregunta: "Al tener que tomar una decisión no comprendida ni apoyada por el entorno cercano, ¿cómo se actúa?",
    opciones: [
      { key: "A", score: 1, texto: "Se sigue adelante en soledad, asumiendo íntegramente las consecuencias sin buscar aprobaciones." },
      { key: "B", score: 2, texto: "Se intenta convencer repetidamente al entorno para obtener su beneplácito." },
      { key: "C", score: 3, texto: "Se pospone la decisión hasta encontrar un consenso amplio." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he visto en la situación de tomar decisiones contrarias al criterio de mi entorno." }
    ]
  },
  {
    id: 39,
    level: 10,
    factor: 3,
    area: "Trabajo",
    pregunta: "Ante la tentación de obtener un beneficio rápido sacrificando principios éticos personales, ¿qué prima?",
    opciones: [
      { key: "A", score: 1, texto: "La coherencia interna sobre cualquier ganancia material, rechazando la propuesta sin dudar." },
      { key: "B", score: 2, texto: "La valoración del riesgo de ser descubierto antes de tomar una postura." },
      { key: "C", score: 3, texto: "El intento de adaptar la propuesta para hacerla aceptable sin perder la oportunidad." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he recibido propuestas u oportunidades que pusieran a prueba mi ética." }
    ]
  },
  {
    id: 40,
    level: 10,
    factor: 3,
    area: "Dinero",
    pregunta: "Al gestionar el dinero y los bienes acumulados en la etapa madura, ¿cuál es la filosofía?",
    opciones: [
      { key: "A", score: 1, texto: "Considerarlo una herramienta para generar valor, ayudar al entorno y vivir con libertad." },
      { key: "B", score: 2, texto: "Un colchón imprescindible de seguridad ante posibles contingencias futuras." },
      { key: "C", score: 3, texto: "Un símbolo de logro profesional que debe ser protegido y preservado a toda costa." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he dispuesto de un patrimonio o capital acumulado de consideración." }
    ]
  },

  // Nivel 11: Servicio y Transmisión de Conocimiento (Generosidad)
  {
    id: 41,
    level: 11,
    factor: 3,
    area: "Trabajo",
    pregunta: "Al tutorizar, mentorizar o enseñar a personas más jóvenes en la profesión, ¿cuál es el impulso?",
    opciones: [
      { key: "A", score: 1, texto: "Entregar todo el conocimiento acumulado sin reservarse secretos para elevar su nivel." },
      { key: "B", score: 2, texto: "Guiarles para que no cometan los mismos errores que se sufrieron en el pasado." },
      { key: "C", score: 3, texto: "Exigirles disciplina estricta para que se ganen el puesto como se hizo en el propio camino." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he ejercido el rol de mentor, tutor o guía de nuevas generaciones." }
    ]
  },
  {
    id: 42,
    level: 11,
    factor: 3,
    area: "General",
    pregunta: "Al colaborar en causas sociales, proyectos comunitarios o donaciones, ¿cómo se participa?",
    opciones: [
      { key: "A", score: 1, texto: "De forma anónima y constante, implicando recursos personales con discreción." },
      { key: "B", score: 2, texto: "Participando en iniciativas donde se pueda aportar experiencia estratégica directa." },
      { key: "C", score: 3, texto: "Vinculándose solo si el proyecto ofrece garantías públicas de transparencia." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he participado ni colaborado en proyectos sociales o altruistas." }
    ]
  },
  {
    id: 43,
    level: 11,
    factor: 3,
    area: "Trabajo",
    pregunta: "Al presenciar el éxito de un competidor o persona cercana en un campo donde uno no triunfó, ¿qué se siente?",
    opciones: [
      { key: "A", score: 1, texto: "Alegría sincera y admiración por el logro alcanzado por el otro." },
      { key: "B", score: 2, texto: "Una mezcla de cortesía externa y cierta punzada de comparación interna." },
      { key: "C", score: 3, texto: "Indiferencia centrada exclusivamente en la propia trayectoria." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he presenciado el éxito de otros en proyectos que yo haya intentado sin conseguirlo." }
    ]
  },
  {
    id: 44,
    level: 11,
    factor: 3,
    area: "General",
    pregunta: "Al diseñar el legado personal o la herencia que se dejará en el futuro, ¿qué se busca transmitir?",
    opciones: [
      { key: "A", score: 1, texto: "Valores, autonomía de criterio y sabiduría de vida por encima del patrimonio económico." },
      { key: "B", score: 2, texto: "Una estructura económica sólida que evite dificultades financieras a los descendientes." },
      { key: "C", score: 3, texto: "Una imagen de rectitud y trabajo bien hecho que sea recordada con respeto." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he planteado la cuestión de diseñar un legado o transmisión futura." }
    ]
  },

  // Nivel 12: Trascendencia y Libertad Interior (Paz Absoluta)
  {
    id: 45,
    level: 12,
    factor: 3,
    area: "General",
    pregunta: "Al contemplar la propia muerte o el fin del viaje vital, ¿cuál es el estado interno?",
    opciones: [
      { key: "A", score: 1, texto: "Paz profunda, sintiendo que la vida ha sido plena y agradeciendo lo vivido." },
      { key: "B", score: 2, texto: "Una inquietud moderada por dejar pendientes asuntos prácticos o afectivos." },
      { key: "C", score: 3, texto: "Temor al dolor físico o al proceso de pérdida de facultades." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he reflexionado ni me he parado a pensar sobre la finitud de la vida." }
    ]
  },
  {
    id: 46,
    level: 12,
    factor: 3,
    area: "General",
    pregunta: "Frente al desapego de las pertenencias materiales acumuladas a lo largo de la vida, ¿cómo se reacciona?",
    opciones: [
      { key: "A", score: 1, texto: "Con total soltura, entendiendo que las cosas solo son prestadas durante el viaje." },
      { key: "B", score: 2, texto: "Conservando con celo los objetos que tienen un valor sentimental o histórico personal." },
      { key: "C", score: 3, texto: "Cuidando los bienes por la seguridad que aportan al momento presente." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he planteado el desapego o la renuncia a mis bienes personales." }
    ]
  },
  {
    id: 47,
    level: 12,
    factor: 3,
    area: "General",
    pregunta: "Al experimentar momentos de soledad prolongada o silencio absoluto, ¿qué ocurre en el interior?",
    opciones: [
      { key: "A", score: 1, texto: "Una profunda plenitud y conexión con uno mismo, sin necesitar distracciones." },
      { key: "B", score: 2, texto: "Una oportunidad para reflexionar y poner orden en los proyectos pendientes." },
      { key: "C", score: 3, texto: "Una ligera incomodidad que invita a buscar contacto o actividad rápidamente." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás he experimentado periodos de soledad prolongada o silencio intencionado." }
    ]
  },
  {
    id: 48,
    level: 12,
    factor: 3,
    area: "General",
    pregunta: "Al observar el discurrir del mundo y sus crisis o cambios convulsos, ¿cuál es la perspectiva final?",
    opciones: [
      { key: "A", score: 1, texto: "Comprensión de la totalidad, manteniendo la calma y confiando en el orden de la vida." },
      { key: "B", score: 2, texto: "Preocupación por el impacto que esos eventos puedan tener en el entorno cercano." },
      { key: "C", score: 3, texto: "Deseo de intervenir activamente para corregir lo que se considera injusto." },
      { key: "D", score: 0, isFutureHito: true, texto: "Jamás me he parado a analizar las crisis o la evolución del mundo general." }
    ]
  }
]

// Planes de acción adaptados para los 12 niveles de la nueva estructura
export const ACTION_PLANS_12 = {
  1: {
    title: "Plan para salir de: Víctima Absoluta",
    actions: [
      "Vigila tus palabras: Prohibido culpar hoy a terceros, exparejas o al sistema.",
      "Usa el 'Yo decido': Sustituye 'me han hecho daño' por 'yo elijo cómo respondo hoy'.",
      "Asume una pequeña autoría: Resuelve una tarea pendiente sin justificarte.",
      "Escribe 3 aprendizajes de tus crisis pasadas que te hayan hecho más fuerte."
    ]
  },
  2: {
    title: "Plan para disolver: Impotencia y Parálisis",
    actions: [
      "Micro-acción diaria: Toma hoy una decisión práctica que lleves semanas postergando.",
      "Ancla la seguridad: Si el miedo al error te frena, da un paso pequeño y reversible.",
      "Habla con transparencia: Expresa tu opinión real en tu entorno sin temor al rechazo.",
      "Respira en 3-6-9 para serenar la mente ante la incertidumbre económica o laboral."
    ]
  },
  3: {
    title: "Plan para calmar: Reactividad y Conflicto",
    actions: [
      "Pausa de 10 segundos antes de responder a un mensaje o discusión caliente.",
      "Desarma la defensa: No conviertas cada diferencia de criterio en un ataque personal.",
      "Busca la mediación objetiva y los datos antes de romper relaciones o acuerdos.",
      "Transforma la energía del enfado en ejercicio físico intenso o trabajo focalizado."
    ]
  },
  4: {
    title: "Plan para despertar de: Resignación Pasiva",
    actions: [
      "Rompe la inercia: Introduce un hábito nuevo hoy (caminar, leer o aprender una habilidad).",
      "Declara tu propósito: Escribe qué meta abandonaste por cansancio y rescátala.",
      "Reduce el consumo pasivo de pantallas y entretenimiento evasivo.",
      "Recuerda que no estás atado a la rutina: la realidad cambia con decisiones conscientes."
    ]
  },
  5: {
    title: "Plan para trascender: Validación y Estatus (Ego Social)",
    actions: [
      "Disfruta en silencio: Realiza un logro o adquisición sin publicarlo en redes ni presumir.",
      "Reconoce el mérito ajeno: Felicita sinceramente a un compañero por su éxito.",
      "Sé auténtico: Viste y exprésate por tu comodidad y valores, no por impresionar.",
      "Pregúntate: ¿Haría esto si nadie estuviese mirando?"
    ]
  },
  6: {
    title: "Plan para flexibilizar: Control Rígido y Perfeccionismo",
    actions: [
      "Delega una tarea importante sin supervisar el proceso, solo el resultado final.",
      "Abraza la imperfección: Permite que algo no salga al 100% como lo planeaste.",
      "Baja la autoexigencia física o mental si tu cuerpo da señales de agotamiento.",
      "Escucha sin interrumpir ni corregir a los demás durante todo el día."
    ]
  },
  7: {
    title: "Plan para orientar: Ambición Estratégica y Pragmatismo",
    actions: [
      "Prioriza la ética y el beneficio mutuo en cualquier negociación o cierre de acuerdos.",
      "Mira a largo plazo: No sacrifiques relaciones de valor por una ganancia inmediata.",
      "Aporta valor real antes de reclamar tu contraprestación.",
      "Mide el éxito no solo por los números, sino por la paz y el bienestar generado."
    ]
  },
  8: {
    title: "Plan para integrar: El Despertar del Ego (Crisis de Identidad)",
    actions: [
      "Desidentifícate del cargo o las posesiones: Tú eres mucho más que tus títulos.",
      "Dedica 20 minutos de introspección diaria a conectar con lo esencial de tu vida.",
      "Agradece la crisis presente: Es el umbral indispensable hacia la verdadera sabiduría.",
      "Revisa tu escala de valores y alinea tus metas con tu paz interior."
    ]
  },
  9: {
    title: "Plan para profundizar en: Aceptación y Perdón Sincero",
    actions: [
      "Libera viejos agravios: Desea mentalmente el bien y la paz a quienes te dañaron.",
      "Trata los errores pasados como la matrícula de honor en tu escuela de vida.",
      "Acepta el cuerpo y el momento presente sin compararte con ideales ficticios.",
      "Vive el día de hoy sin arrastrar reproches del ayer."
    ]
  },
  10: {
    title: "Plan para consolidar: Responsabilidad Absoluta y Autoría",
    actions: [
      "Sé el capitán de tu barco: Mantén tus decisiones coherentes con tus principios.",
      "Protege y guía a quienes dependen de ti con serenidad y templanza.",
      "Utiliza el dinero y los recursos como palanca para crear valor y bienestar.",
      "Actúa con la convicción del Tercer Poder: Scripting, visualización y acción firme."
    ]
  },
  11: {
    title: "Plan para expandir: Servicio y Transmisión de Conocimiento",
    actions: [
      "Mentoriza a alguien con generosidad absoluta, sin guardarte ningún secreto.",
      "Colabora en un proyecto altruista o ayuda a quien lo necesite con discreción.",
      "Alégrate de corazón por los triunfos de los demás como si fueran propios.",
      "Construye un legado de valores, autonomía y amor que inspire a otros."
    ]
  },
  12: {
    title: "Plan para vibrar en: Trascendencia y Libertad Interior",
    actions: [
      "Practica el desapego gozoso: Disfruta de las cosas sin apegarte a su permanencia.",
      "Contempla la vida con la perspectiva del observador consciente y en paz total.",
      "Dedica tiempo al silencio sagrado y a la comunión con el Todo.",
      "Vibra en la frecuencia más alta del Universo: El Amor incondicional y la Certeza."
    ]
  }
}

// Función para calcular el nivel activo a partir de las respuestas situacionales de 48
export function calculateSituationalPyramid(answersMap) {
  const answered = Object.values(answersMap || {})
  if (answered.length === 0) {
    return { activeLevel: 1, levelName: NIVELES_12[1].nombre, factorId: 1, totalScore: 0, hitosFuturos: [] }
  }

  // Detectar opciones D (Hitos futuros no vividos)
  const hitosFuturos = answered
    .filter(a => a.isFutureHito || a.score === 0 || a.key === 'D')
    .map(a => ({
      preguntaId: a.id,
      area: a.area,
      pregunta: a.pregunta,
      textoOpcion: a.textoOpcion || a.texto
    }))

  // Puntuación acumulada por nivel (1..12) y por factor (1..3)
  const levelScores = {}
  for (let l = 1; l <= 12; l++) levelScores[l] = 0

  let totalScore = 0
  let countScored = 0

  answered.forEach(a => {
    const s = Number(a.score) || 0
    if (s > 0) {
      totalScore += s
      countScored++
      if (a.level && levelScores[a.level] !== undefined) {
        levelScores[a.level] += s
      }
    }
  })

  // Determinar el nivel promedio ponderado del consultante
  // Rango posible de puntuación por pregunta puntuada: 1 a 3
  // Normalizamos a la escala de 12 niveles
  const avg = countScored > 0 ? totalScore / countScored : 1 // de 1.0 a 3.0
  let activeLevel = Math.round(1 + ((avg - 1) / 2) * 11)
  if (activeLevel < 1) activeLevel = 1
  if (activeLevel > 12) activeLevel = 12

  // Factor predominante
  const factorId = NIVELES_12[activeLevel].factorId

  return {
    activeLevel,
    levelName: `${NIVELES_12[activeLevel].nombre} (${NIVELES_12[activeLevel].subtitulo})`,
    factorId,
    factorNombre: FACTORES_PIRAMIDE[factorId].nombre,
    zone: NIVELES_12[activeLevel].zona,
    totalScore,
    maxPossibleScore: 48 * 3,
    countScored,
    hitosFuturos,
    hitosFuturosCount: hitosFuturos.length,
    date: new Date().toLocaleDateString('es-ES')
  }
}
