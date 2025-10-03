/**
 * Participant Players Routes
 * --------------------------
 * Base path: /api/participant-players
 * Gestiona la plantilla (roster) de un participante, estado de cada jugador
 * y atributos de cláusula (valor, bloqueos, clausulable).
 *
 * Convención: :id representa participant_id, :playerId representa id de jugador.
 *
 * Endpoints:
 *  GET    /:id/team                         -> getTeam (lista jugadores con status/clauses)
 *  POST   /:id/team                         -> addPlayer (añade jugador a roster)
 *  PUT    /:id/team/:playerId               -> updateStatus (R / XI / B)
 *  PATCH  /:id/team/:playerId/clause        -> updateClauseValue (actualiza valor de cláusula)
 *  PATCH  /:id/team/:playerId/clausulable   -> updateClausulable (toggle boolean)
 *  PATCH  /:id/team/:playerId/clause-lock   -> updateClauseLock (fecha/hora bloqueo)
 *  DELETE /:id/team/:playerId               -> removePlayer (retira jugador)
 *
 * Notas reglas negocio:
 *  - Status normalizado en controlador/servicio (R = Reserva, XI = Titular, B = Bloqueado?).
 *  - Las cláusulas permiten mercado dinámico (valor, clausulable, lock temporal).
 */
const express = require("express");
const router = express.Router();
const controller = require("../controllers/participantPlayersController");

router.get("/:id/team", controller.getTeam);
router.post("/:id/team", controller.addPlayer);
router.put("/:id/team/:playerId", controller.updateStatus);
router.patch("/:id/team/:playerId/clause", controller.updateClauseValue);
router.patch("/:id/team/:playerId/clausulable", controller.updateClausulable);
router.delete("/:id/team/:playerId", controller.removePlayer);
router.patch("/:id/team/:playerId/clause-lock", controller.updateClauseLock);


module.exports = router;
