/**
 * Generación del código de confirmación mutuo.
 *
 * Vive en su propio módulo porque lo necesitan dos rutas distintas: el PATCH
 * del panel de coordinación y la respuesta por correo del anfitrión.
 */
import { randomInt } from "crypto";

/**
 * Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L, 8/B...): el código se
 * dicta por teléfono y se compara a ojo en la puerta de una casa, muchas veces
 * escrito a mano. Cada carácter debe ser inconfundible.
 */
const CODIGO_ALFABETO = "ACDEFHJKMNPRTUVWXY34679";

/** Genera un código de verificación de 6 caracteres (aleatoriedad de crypto). */
export function generarCodigoVerificacion(): string {
  let codigo = "";
  for (let i = 0; i < 6; i++) {
    codigo += CODIGO_ALFABETO[randomInt(CODIGO_ALFABETO.length)];
  }
  return codigo;
}
