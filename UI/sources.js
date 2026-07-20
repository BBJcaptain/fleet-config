/* ============================================================================
   FIELD SOURCE REFERENCES
   ----------------------------------------------------------------------------
   Where each value comes from in the official documentation. Shown as the small
   ⓘ tooltip next to every field in ALL THREE apps — the viewer (index.html),
   the editor (editor.html) and the collector (collector.html).

   ONE file drives all three, so the tooltips can never drift apart.

   ── HOW TO EDIT ─────────────────────────────────────────────────────────────
   • Change the text after a field name. Keep the quotes and the trailing comma.
   • Leave "Source Pending" wherever you have not confirmed the reference yet —
     that is shown to pilots as-is, so the gap is visible and honest.
   • Save this file, then double-click publish.command.

   Format:  field_key: "FCOM / Chapter / Section / Sub-section",

   Nothing here is confidential: these are pointers to where information lives,
   not the information itself. The file is served publicly alongside the apps.
   ========================================================================== */

window.FLEET_SOURCES = {

  /* ---- Identification ---- */
  registration:            "Source Pending",
  model:                   "Source Pending",
  msn:                     "Source Pending",
  first_flight:            "Source Pending",
  first_owner:             "Source Pending",

  /* ---- Performance ---- */
  mlw_t:                   "Source Pending",
  takeoff_tailwind_kts:    "FCOM / Limitations / Aircraft General / Operational Parameters / Airport Operations and Wind Limitations",
  landing_tailwind_kts:    "FCOM / Limitations / Aircraft General / Operational Parameters / Airport Operations and Wind Limitations",
  narrow_runway_approved:  "Source Pending",
  se_taxi_no_apu:          "Source Pending",
  max_altitude_autoland:   "Source Pending",
  noise_chapter:           "Source Pending",

  /* ---- Equipment ---- */
  brk_fan:                 "Source Pending",
  winglets:                "Source Pending",
  engine_type:             "Source Pending",
  cargo_heat:              "Source Pending",
  soft_goaround:           "Source Pending",
  satcom:                  "Source Pending",
  headset_plug:            "Source Pending",
  acars:                   "Source Pending",
  acars_datalink:          "Source Pending",
  init:                    "Source Pending",
  adiru_type:              "Source Pending",
  weather_radar_type:      "Source Pending",
  hf_radio:                "Source Pending",
  cpdlc:                   "Source Pending",
  transponder:             "Source Pending",

  /* ---- Remarks ---- */
  remarks:                 "Source Pending"
};
