export const SUITS = [
  { key: 'O', name: 'OROS',    values: ['As','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho','Nueve','Sota','Caballo','Rey'] },
  { key: 'C', name: 'COPAS',   values: ['As','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho','Nueve','Sota','Caballo','Rey'] },
  { key: 'E', name: 'ESPADAS', values: ['As','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho','Nueve','Sota','Caballo','Rey'] },
  { key: 'B', name: 'BASTOS',  values: ['As','Dos','Tres','Cuatro','Cinco','Seis','Siete','Ocho','Nueve','Sota','Caballo','Rey'] },
]

export const FULL_DECK = SUITS.flatMap(suit =>
  suit.values.map((value, i) => {
    const sName = suit.name.charAt(0) + suit.name.slice(1).toLowerCase();
    return {
      id: `${suit.key}${i + 1}`,
      suit: suit.key,
      suitName: sName,
      value,
      spanishName: `${value} de ${sName}`,
      img: `/assets/cards/${suit.key}${i + 1}.webp`,
    }
  })
)

export const MAX_SHUFFLES = 7

// 55 Preguntas Fase 2
export const FASE2_QUESTIONS = [
  // Escalón 1: La Víctima
  { id:1, level:1, text:"Amor: Siento que tengo mala suerte en el amor y que los demás siempre me lastiman." },
  { id:2, level:1, text:"Trabajo: En mi empleo me explotan o no me valoran, y no puedo hacer nada para cambiarlo." },
  { id:3, level:1, text:"Dinero: Las crisis y la economía siempre me hunden; el dinero me falta por culpa del sistema." },
  { id:4, level:1, text:"Salud: Mis dolencias o falta de energía son culpa del estrés del entorno o de la mala suerte." },
  { id:5, level:1, text:"General: Siento que la vida es injusta conmigo y que los culpables de mis males son los demás." },
  // Escalón 2: El Miedo
  { id:6, level:2, text:"Amor: Me da pánico que mi pareja me deje, o prefiero no buscar pareja por miedo a sufrir." },
  { id:7, level:2, text:"Trabajo: No cambio de empleo ni pido un ascenso porque temo fracasar o quedarme sin nada." },
  { id:8, level:2, text:"Dinero: Me da terror gastar o invertir; guardo el dinero con angustia por si llega una desgracia." },
  { id:9, level:2, text:"Salud: Vivo con una constante preocupación por enfermarme o por lo que me pueda pasar en el futuro." },
  { id:10, level:2, text:"General: Evito tomar decisiones importantes porque el futuro me genera mucha ansiedad." },
  // Escalón 3: El Deseo
  { id:11, level:3, text:"Amor: Siento que necesito tener una pareja a mi lado para poder ser feliz y estar completo." },
  { id:12, level:3, text:"Trabajo: Busco obsesivamente el estatus y el reconocimiento de mis jefes o compañeros de trabajo." },
  { id:13, level:3, text:"Dinero: Creo que acumular más cosas materiales y dinero es la única forma de sentirme seguro." },
  { id:14, level:3, text:"Salud: Me obsesiono con tener un cuerpo perfecto o una salud ideal, y sufro si no lo logro." },
  { id:15, level:3, text:"General: Siempre estoy pensando en lo que me falta en lugar de disfrutar lo que ya tengo hoy." },
  // Escalón 4: La Ira
  { id:16, level:4, text:"Amor: Discuto a menudo con mis seres queridos porque no hacen las cosas como yo quiero." },
  { id:17, level:4, text:"Trabajo: Me da rabia ver cómo progresa gente menos capaz que yo en mi entorno laboral." },
  { id:18, level:4, text:"Dinero: Me indigna y me molesta mucho tener que pagar cuentas, impuestos o ver el éxito financiero ajeno." },
  { id:19, level:4, text:"Salud: Me enfado con mi propio cuerpo cuando se cansa, se enferma o no responde como exijo." },
  { id:20, level:4, text:"General: Me altero con facilidad cuando los planes se tuercen o las cosas no salen a mi manera." },
  // Escalón 5: Aprendizaje
  { id:21, level:5, text:"Amor: Cuando tengo un problema de pareja, intento ver qué parte de responsabilidad es mía." },
  { id:22, level:5, text:"Trabajo: Analizo mis errores laborales del pasado como lecciones valiosas para mi carrera." },
  { id:23, level:5, text:"Dinero: En vez de quejarme por un bache económico, busco entender en qué fallé para corregirlo." },
  { id:24, level:5, text:"Salud: Veo los síntomas de mi cuerpo como señales de alerta que me enseñan a cuidarme mejor." },
  { id:25, level:5, text:"General: Cuando algo sale mal, me pregunto: \"¿Qué puedo aprender yo de esta situación?\"." },
  // Escalón 6: Orgullo
  { id:26, level:6, text:"Amor: En las relaciones me cuesta mucho pedir perdón o admitir que mi pareja tiene razón." },
  { id:27, level:6, text:"Trabajo: Creo que sé hacer las cosas mejor que nadie en mi empleo y me cuesta aceptar críticas." },
  { id:28, level:6, text:"Dinero: Me gusta que la gente note mi nivel económico o las marcas que compro para sentirme bien." },
  { id:29, level:6, text:"Salud: Presumo de mi resistencia o estilo de vida sano, y me cuesta pedir ayuda médica cuando me duele algo." },
  { id:30, level:6, text:"General: Me importa mucho tener la última palabra en las discusiones y defender mi postura a muerte." },
  // Escalón 7: Valor
  { id:31, level:7, text:"Amor: Me atrevo a expresar lo que siento y a poner límites claros en mis relaciones, aunque me dé reparo." },
  { id:32, level:7, text:"Trabajo: Propongo nuevas ideas en mi empleo y asumo retos difíciles aunque impliquen riesgos." },
  { id:33, level:7, text:"Dinero: Tomo decisiones financieras valientes, como emprender o invertir en mi formación." },
  { id:34, level:7, text:"Salud: Afronto mis problemas de salud con acción y disciplina, sin aplazar las visitas médicas." },
  { id:35, level:7, text:"General: Siento el miedo ante los cambios cotidianos, pero actúo con firmeza de todos modos." },
  // Escalón 8: Desapego
  { id:36, level:8, text:"Amor: Amo a las personas de mi entorno libremente, sin necesidad de poseerlas ni controlarlas." },
  { id:37, level:8, text:"Trabajo: Doy el máximo en mis tareas laborales, pero mi felicidad no depende del resultado final." },
  { id:38, level:8, text:"Dinero: Disfruto del dinero y los bienes materiales, pero sé que mi valor humano no cambia si los pierdo." },
  { id:39, level:8, text:"Salud: Cuido mi cuerpo con esmero, pero acepto el paso del tiempo y la vejez de forma natural." },
  { id:40, level:8, text:"General: Me adapto rápido a las nuevas circunstancias de la vida sin quedarme estancado en el pasado." },
  // Escalón 9: Aceptación
  { id:41, level:9, text:"Amor: Acepto a las personas de mi vida tal y como son, sin intentar cambiarlas ni juzgarlas." },
  { id:42, level:9, text:"Trabajo: Asumo mi realidad laboral presente con paz, mientras trabajo con calma en mis metas futuras." },
  { id:43, level:9, text:"Dinero: Estoy en paz con mi situación financiera actual, lo que me da claridad para mejorarla." },
  { id:44, level:9, text:"Salud: Convezco a mi mente de aceptar mis limitaciones físicas actuales sin queja ni amargura." },
  { id:45, level:9, text:"General: Siento que las cosas son como tienen que ser, y elijo no gastar energía peleando contra la realidad." },
  // Escalón 10: Sabiduría
  { id:46, level:10, text:"Amor: Comprendo los hilos emocionales de mis relaciones y actúo siempre desde la empatía profunda." },
  { id:47, level:10, text:"Trabajo: Encuentro soluciones sencillas e intuitivas a los problemas complejos en mi entorno profesional." },
  { id:48, level:10, text:"Dinero: Manejo mis finanzas con un equilibrio perfecto entre la lógica, la intuición y el bien común." },
  { id:49, level:10, text:"Salud: Conozco la conexión exacta entre mis emociones y mi cuerpo, manteniendo un equilibrio constante." },
  { id:50, level:10, text:"General: Veo la vida con una perspectiva amplia, entendiendo el propósito detrás de cada experiencia." },
  // Escalón 11: El Amor
  { id:51, level:11, text:"Amor: Siento un afecto profundo, puro y desinteresado hacia todos los seres vivos, sin esperar nada a cambio." },
  { id:52, level:11, text:"Trabajo: Mi labor profesional es una extensión de mi deseo de servir y aportar luz al mundo." },
  { id:53, level:11, text:"Dinero: Veo el dinero como energía pura de intercambio que fluye para hacer el bien a mi alrededor." },
  { id:54, level:11, text:"Salud: Siento una gratitud inmensa y una conexión espiritual total con el milagro de estar vivo." },
  { id:55, level:11, text:"General: Experimento una paz interna total y me siento en perfecta unidad con el universo." },
]

export const LEVEL_NAMES = {
  1:'VÍCTIMA', 2:'MIEDO', 3:'DESEO', 4:'IRA', 5:'APRENDIZAJE',
  6:'ORGULLO', 7:'VALOR', 8:'DESAPEGO', 9:'ACEPTACIÓN', 10:'SABIDURÍA', 11:'AMOR INCONDICIONAL'
}

export const getLevelZone = l => l<=4 ? 'DE LO MATERIAL' : l<=8 ? 'DE LO MENTAL' : 'DE LO ESPIRITUAL'
export const getLevelClass = l => l<=4 ? 'material' : l<=8 ? 'mental' : 'espiritual'

export const ACTION_PLANS = {
  1:{ title:'Plan para salir de: La Víctima', actions:['Vigila tus palabras: Prohibido quejarse hoy de la pareja, del jefe o del gobierno.','Usa el "Yo elijo": Si vas a trabajar, di "yo elijo ir" en vez de "tengo que ir".','Hazte responsable: Resuelve un problema pequeño en casa tú solo, sin pedir ayuda ni poner excusas.','Busca tres gracias: Escribe tres cosas buenas que tienes hoy y que dependen solo de ti.','Acepta un error: Si fallas en algo en tu empleo, dilo abiertamente y no busques culpables.'] },
  2:{ title:'Plan para superar: El Miedo', actions:['Incomodidad diaria: Haz hoy una llamada o tarea pendiente que te dé un poco de reparo.','Habla claro: Dile a tu pareja o a un amigo algo que piensas y que callabas por temor.','Lista de deseos: Escribe en un papel diez metas grandes que te gustaría cumplir este año.','Ancla el presente: Si te da ansiedad el futuro, toca tu pecho y repite: "Hoy estoy a salvo".','Pon un límite: Di un "no" amable a un favor que te agobia o te quita energía.'] },
  3:{ title:'Plan para transformar: El Deseo y Apego', actions:['Paseo en soledad: Camina 20 minutos al día a solas, sin música, sin móvil y sin comprar nada.','Regala lo que usas: Dona una prenda de ropa buena o un objeto útil a alguien sin esperar las gracias.','Ayuno de compras: Pasa todo el día de hoy sin gastar dinero en caprichos o antojos.','Silencio digital: Apaga el teléfono móvil dos horas antes de irte a dormir para desconectar.','Disfruta lo gratis: Pasa la tarde leyendo un libro, tomando el sol o charlando, sin consumir nada.'] },
  4:{ title:'Plan para calmar: La Ira y Frustración', actions:['Cuenta hasta diez: Si alguien te contesta mal en el trabajo o en casa, respira antes de hablar.','Saca la energía: Haz deporte intenso, corre o golpea una almohada si sientes rabia acumulada.','Busca tu espejo: Si un defecto de otra persona te enfada mucho, piensa si tú también lo haces.','Suelta el control: Deja que los demás cometan sus propios errores hoy sin gritarles por ello.','Pide disculpas: Si pierdes el control y gritas a alguien, pídele perdón de forma sincera al rato.'] },
  5:{ title:'Plan para avanzar desde: El Aprendizaje', actions:['El diario de lecciones: Apunta en una libreta antes de dormir qué te ha enseñado el día de hoy.','Pide opinión: Pregunta a tu pareja o a tu jefe en qué creen que puedes mejorar y escucha.','Estudia tus finanzas: Lee un artículo o mira un video sobre cómo ahorrar o gestionar tu dinero.','Prueba otro método: Haz una tarea aburrida del trabajo de una forma totalmente distinta a la habitual.','Sé el alumno: Si alguien te explica algo que ya sabes, cállate y escúchale con atención y respeto.'] },
  6:{ title:'Plan para suavizar: El Orgullo', actions:['Pide perdón tú: Da el primer paso para arreglar un roce familiar aunque creas que tienes razón.','Felicita al resto: Alaba el buen trabajo de un compañero de empleo delante de los demás jefes.','Usa el "No lo sé": Si te preguntan algo que desconoces en el trabajo, dilo sin inventar la respuesta.','Escucha sin replicar: Deja que tu pareja hable en una discusión sin interrumpirla para defenderte.','Ríete de ti: Cuenta una historia divertida sobre un error patoso que hayas cometido tú mismo.'] },
  7:{ title:'Plan para activar: El Valor', actions:['Decisión valiente: Haz hoy ese trámite de dinero o trabajo que llevabas meses retrasando por pereza.','Límites firmes: Di que no a un plan de amigos que no te apetece nada, con educación y sin inventar excusas.','Defiende tu idea: Propón un proyecto o una solución nueva en tu próxima reunión laboral.','Corta lo sano: Aléjate hoy de una persona o situación que sabes perfectamente que te hace daño.','Cambia el hábito: Deja hoy mismo un vicio o costumbre que sepas que perjudica tu salud diaria.'] },
  8:{ title:'Plan para integrar: El Desapego', actions:['Manos libres: Deja que tu pareja o tus hijos organicen sus cosas a su manera, sin meterte tú.','Fluye con el cambio: Si un plan de trabajo se anula a última hora, sonríe y dedícate ese tiempo a ti.','Dinero libre: Regala una moneda o un billete pequeño a alguien en la calle sin pensar en qué lo gastará.','Suelta el pasado: Tira o regala tres objetos viejos de tu casa que ya no uses pero guardes por nostalgia.','Mente abierta: Si alguien opina lo contrario que tú sobre política o religión, déjalo pasar en paz.'] },
  9:{ title:'Plan para asentar: La Aceptación', actions:['Día sin críticas: Pasa 24 horas completas sin juzgar mentalmente el físico o la actitud de nadie.','Paz con el saldo: Mira el dinero que tienes hoy en el banco y acéptalo en calma, sin quejarte ni agobiarte.','Acepta a tu pareja: Mira a tu pareja y repite para tus adentros: "Te quiero tal y como eres hoy".','Asume el clima: Si llueve o hace mucho calor, adáptate al día con una sonrisa y sin maldecir el tiempo.','Perdona el ayer: Piensa en alguien que te hizo daño hace años y decide dejar ir ese rencor hoy.'] },
  10:{ title:'Plan para alcanzar: La Sabiduría', actions:['Escucha sagrada: Cuando alguien te hable de sus penas, escúchale con el corazón y sin darle consejos rápidos.','Busca el trasfondo: Si alguien se enfada contigo, intenta comprender qué dolor oculto le hace actuar así.','Conexión interna: Pasa diez minutos en silencio total al despertar, sintiendo los latidos de tu corazón.','Alimenta tu alma: Dedica media hora al día a pasear por la naturaleza o a meditar en un lugar tranquilo.','Palabras sabias: Habla solo cuando lo que vayas a decir sea más bello y útil que el propio silencio.'] },
  11:{ title:'Plan para mantenerte en la Cima: El Amor Incondicional', actions:['Favor secreto: Haz una buena acción por un desconocido o por tu pareja sin que nadie sepa que fuiste tú.','Gratitud al despertar: Dedica los primeros cinco minutos de tu mañana a dar gracias por el milagro de estar vivo.','Luz al enemigo: Visualiza a una persona que te dañó en el pasado y deséale de corazón que le vaya muy bien.','Amor a todo: Siente cariño por los animales, las plantas y las personas con las que te cruces en la calle hoy.','Paz total: Mantén una sonrisa interna durante todo el día, pase lo que pase a tu alrededor.'] },
}
